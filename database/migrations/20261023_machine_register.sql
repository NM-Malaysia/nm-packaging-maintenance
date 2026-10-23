BEGIN;

CREATE TABLE public.machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_code text NOT NULL,
  machine_name text NOT NULL,
  department_id uuid REFERENCES public.departments(id),
  location text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT machine_code_valid CHECK (
    machine_code = btrim(machine_code)
    AND char_length(machine_code) BETWEEN 1 AND 50
    AND machine_code ~ '^[A-Za-z0-9_-]+$'
  ),
  CONSTRAINT machine_name_valid CHECK (
    machine_name = btrim(machine_name)
    AND char_length(machine_name) BETWEEN 1 AND 200
  ),
  CONSTRAINT machine_location_length CHECK (
    char_length(location) <= 200
  ),
  CONSTRAINT machine_notes_length CHECK (
    char_length(notes) <= 5000
  )
);

CREATE UNIQUE INDEX machines_code_unique
  ON public.machines (lower(machine_code));

ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.machines FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.machines TO authenticated;

CREATE POLICY machines_read
ON public.machines
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.is_active
      AND NOT e.must_change_password
      AND (
        machines.is_active
        OR e.role IN ('admin', 'maintenance_supervisor')
      )
  )
);

COMMIT;
