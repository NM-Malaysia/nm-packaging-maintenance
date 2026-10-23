BEGIN;

CREATE FUNCTION public.save_machine(
  p_code text,
  p_name text,
  p_department uuid DEFAULT NULL,
  p_location text DEFAULT '',
  p_notes text DEFAULT '',
  p_active boolean DEFAULT true,
  p_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_id uuid;
  v_code text := btrim(p_code);
  v_name text := btrim(p_name);
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.is_active
      AND NOT e.must_change_password
      AND e.role IN ('admin', 'maintenance_supervisor')
  ) THEN
    RAISE EXCEPTION 'Admin or maintenance supervisor required';
  END IF;

  IF v_code IS NULL
     OR char_length(v_code) NOT BETWEEN 1 AND 50
     OR v_code !~ '^[A-Za-z0-9_-]+$'
     OR v_name IS NULL
     OR char_length(v_name) NOT BETWEEN 1 AND 200
     OR char_length(coalesce(p_location, '')) > 200
     OR char_length(coalesce(p_notes, '')) > 5000
     OR p_active IS NULL
  THEN
    RAISE EXCEPTION 'Invalid machine details';
  END IF;

  IF p_department IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.departments d
    WHERE d.id = p_department
      AND (
        d.is_active
        OR EXISTS (
          SELECT 1 FROM public.machines m
          WHERE m.id = p_id
            AND m.department_id = d.id
        )
      )
  ) THEN
    RAISE EXCEPTION 'Select an active department';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.machines (
      machine_code, machine_name, department_id,
      location, notes, is_active
    )
    VALUES (
      v_code, v_name, p_department,
      btrim(coalesce(p_location, '')),
      btrim(coalesce(p_notes, '')), p_active
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.machines
    SET machine_code = v_code,
        machine_name = v_name,
        department_id = p_department,
        location = btrim(coalesce(p_location, '')),
        notes = btrim(coalesce(p_notes, '')),
        is_active = p_active,
        updated_at = now()
    WHERE id = p_id
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Machine not found';
    END IF;
  END IF;

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_machine(
  text, text, uuid, text, text, boolean, uuid
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.save_machine(
  text, text, uuid, text, text, boolean, uuid
) TO authenticated;

COMMIT;
