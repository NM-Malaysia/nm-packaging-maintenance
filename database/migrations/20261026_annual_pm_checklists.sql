BEGIN;

CREATE TABLE public.pm_annual_checklist_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL
    REFERENCES public.pm_annual_activities(id) ON DELETE RESTRICT,
  version integer NOT NULL CHECK (version > 0),
  items text[] NOT NULL,
  created_by uuid NOT NULL
    REFERENCES public.employees(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (activity_id, version),
  CHECK (cardinality(items) BETWEEN 1 AND 100),
  CHECK (array_ndims(items) = 1),
  CHECK (array_position(items, NULL) IS NULL)
);

ALTER TABLE public.pm_annual_checklist_versions
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.pm_annual_checklist_versions
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.pm_annual_checklist_versions
TO authenticated;

CREATE POLICY pm_annual_checklists_read
ON public.pm_annual_checklist_versions
FOR SELECT TO authenticated
USING ((SELECT public.can_view_pm()));

CREATE FUNCTION public.save_pm_annual_checklist(
  p_activity uuid,
  p_items text[],
  p_expected_version integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_items text[];
  v_previous public.pm_annual_checklist_versions%ROWTYPE;
  v_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = v_user
      AND e.is_active
      AND NOT e.must_change_password
      AND e.role IN ('admin', 'maintenance_supervisor')
  ) THEN
    RAISE EXCEPTION 'Admin or maintenance supervisor required';
  END IF;

  IF p_expected_version IS NULL OR p_expected_version < 0
     OR p_items IS NULL
     OR cardinality(p_items) NOT BETWEEN 1 AND 100
     OR array_ndims(p_items) IS DISTINCT FROM 1
     OR array_position(p_items, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'Invalid checklist details';
  END IF;

  SELECT array_agg(btrim(item) ORDER BY position)
  INTO v_items
  FROM unnest(p_items) WITH ORDINALITY
    AS entries(item, position);

  IF EXISTS (
    SELECT 1 FROM unnest(v_items) AS entries(item)
    WHERE length(item) NOT BETWEEN 1 AND 500
  ) THEN
    RAISE EXCEPTION 'Each checklist item must contain 1 to 500 characters';
  END IF;

  PERFORM 1
  FROM public.pm_annual_activities
  WHERE id = p_activity
    AND NOT is_removed
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active annual PM activity not found';
  END IF;

  SELECT *
  INTO v_previous
  FROM public.pm_annual_checklist_versions
  WHERE activity_id = p_activity
  ORDER BY version DESC
  LIMIT 1;

  IF coalesce(v_previous.version, 0) <> p_expected_version THEN
    RAISE EXCEPTION 'Checklist changed. Refresh before saving';
  END IF;

  IF v_previous.id IS NOT NULL
     AND v_previous.items = v_items THEN
    RETURN v_previous.id;
  END IF;

  INSERT INTO public.pm_annual_checklist_versions (
    activity_id, version, items, created_by
  )
  VALUES (
    p_activity,
    coalesce(v_previous.version, 0) + 1,
    v_items,
    v_user
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_pm_annual_checklist(
  uuid, text[], integer
)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.save_pm_annual_checklist(
  uuid, text[], integer
)
TO authenticated;

COMMIT;
