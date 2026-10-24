BEGIN;

ALTER TABLE public.maintenance_requests
  ADD COLUMN work_category text,
  ADD COLUMN machine_id uuid REFERENCES public.machines(id) ON DELETE RESTRICT,
  ADD COLUMN work_location text NOT NULL DEFAULT '';

ALTER TABLE public.maintenance_requests
  ADD CONSTRAINT request_work_category_valid CHECK (
    work_category IS NULL
    OR work_category IN ('equipment', 'facilities', 'other')
  ),
  ADD CONSTRAINT request_equipment_link_valid CHECK (
    (work_category IS NULL AND machine_id IS NULL)
    OR (
      work_category IS NOT NULL
      AND (
        (work_category = 'equipment' AND machine_id IS NOT NULL)
        OR (work_category IN ('facilities', 'other') AND machine_id IS NULL)
      )
    )
  ),
  ADD CONSTRAINT request_location_length CHECK (
    char_length(work_location) <= 200
  ),
  ADD CONSTRAINT request_non_equipment_location CHECK (
    work_category IS NULL
    OR work_category = 'equipment'
    OR char_length(btrim(work_location)) > 0
  ),
  ADD CONSTRAINT request_non_equipment_downtime CHECK (
    work_category IS NULL
    OR work_category = 'equipment'
    OR NOT downtime_applicable
  );

CREATE INDEX maintenance_requests_machine_id_idx
  ON public.maintenance_requests(machine_id)
  WHERE machine_id IS NOT NULL;

CREATE FUNCTION public.prepare_request_equipment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_machine public.machines%ROWTYPE;
BEGIN
  -- Compatibility with the existing form during this rollout.
  IF NEW.work_category IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.is_active
      AND NOT e.must_change_password
      AND e.role IN ('requestor', 'department_hod')
  ) THEN
    RAISE EXCEPTION 'Active requestor or department HOD required';
  END IF;

  NEW.work_location := btrim(coalesce(NEW.work_location, ''));

  IF NEW.work_category = 'equipment' THEN
    SELECT m.* INTO v_machine
    FROM public.machines m
    WHERE m.id = NEW.machine_id
      AND m.is_active
    FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Select active registered equipment';
    END IF;

    -- Keep the equipment name as it was when the MRF was submitted.
    NEW.machine_name := v_machine.machine_name;

    IF NEW.work_location = '' THEN
      NEW.work_location := v_machine.location;
    END IF;

  ELSIF NEW.work_category IN ('facilities', 'other') THEN
    IF NEW.machine_id IS NOT NULL THEN
      RAISE EXCEPTION 'Equipment must be empty for this category';
    END IF;

    NEW.machine_name := btrim(coalesce(NEW.machine_name, ''));

    IF char_length(NEW.machine_name) NOT BETWEEN 1 AND 200
       OR NEW.work_location = '' THEN
      RAISE EXCEPTION 'Enter a work subject and location';
    END IF;

    IF NEW.downtime_applicable
       OR NEW.downtime_started_at IS NOT NULL
       OR NEW.downtime_ended_at IS NOT NULL THEN
      RAISE EXCEPTION 'Machine downtime applies only to equipment requests';
    END IF;
  ELSE
    RAISE EXCEPTION 'Select a valid work category';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.prepare_request_equipment()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER request_equipment_insert
BEFORE INSERT ON public.maintenance_requests
FOR EACH ROW EXECUTE FUNCTION public.prepare_request_equipment();

COMMIT;
