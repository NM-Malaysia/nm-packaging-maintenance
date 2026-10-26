--
-- PostgreSQL database dump
--

\restrict DUbkl0Xu4gcsRbG4pirxBKjwrsbg9jd8kKjTawoEFQdvc90g0tnvrEOkn6m7vsh

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'requestor',
    'maintenance',
    'supervisor',
    'admin'
);


--
-- Name: mrf_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mrf_status AS ENUM (
    'submitted',
    'hod_approved',
    'in_progress',
    'repair_completed',
    'handover_pending',
    'closed',
    'rejected',
    'waiting_spare_parts',
    'follow_up_required'
);


--
-- Name: acknowledge_pm_service(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.acknowledge_pm_service(p_service uuid, p_notes text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_plan_id uuid;
  v_service public.pm_services%ROWTYPE;
  v_notes text := btrim(p_notes);
  v_next_due date;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = v_user
      AND e.is_active
      AND NOT e.must_change_password
      AND e.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Active Admin required for Production Manager acknowledgement';
  END IF;

  IF v_notes IS NULL
     OR length(v_notes) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Acknowledgement notes of 1 to 5000 characters required';
  END IF;

  SELECT plan_id INTO v_plan_id
  FROM public.pm_services
  WHERE id = p_service;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PM service not found';
  END IF;

  PERFORM 1 FROM public.pm_plans
  WHERE id = v_plan_id
  FOR UPDATE;

  SELECT * INTO v_service
  FROM public.pm_services
  WHERE id = p_service
  FOR UPDATE;

  IF v_service.status <> 'awaiting_acknowledgement'
     OR v_service.reviewed_by IS NULL
     OR v_service.reviewed_at IS NULL
     OR v_service.completed_at IS NULL THEN
    RAISE EXCEPTION 'Supervisor verification is required before acknowledgement';
  END IF;

  IF v_service.reviewed_by = v_user THEN
    RAISE EXCEPTION 'Verifier and acknowledger must be different people';
  END IF;

  v_next_due :=
    (v_service.completed_at AT TIME ZONE 'Asia/Kuala_Lumpur')::date
    + v_service.interval_days;

  UPDATE public.pm_services
  SET status = 'completed',
      acknowledged_by = v_user,
      acknowledged_at = now(),
      acknowledgement_notes = v_notes
  WHERE id = p_service;

  UPDATE public.pm_plans
  SET next_due_date = v_next_due,
      updated_by = v_user,
      updated_at = now()
  WHERE id = v_plan_id;
END;
$$;


--
-- Name: add_issued_part_miv(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_issued_part_miv(p_id uuid, p_miv text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_request uuid;
  v_part public.mrf_parts_followups%rowtype;
  v_miv text := btrim(coalesce(p_miv, ''));
begin
  perform 1
  from public.employees
  where id = auth.uid()
    and is_active
    and not must_change_password
    and role in ('admin', 'maintenance_clerk')
  for share;

  if not found then
    raise exception 'Active Admin or Maintenance Clerk required';
  end if;

  if length(v_miv) not between 1 and 100 then
    raise exception 'Enter an MIV number of 1 to 100 characters';
  end if;

  select request_id into v_request
  from public.mrf_parts_followups
  where id = p_id;

  if not found then
    raise exception 'Part record not found';
  end if;

  -- Use the same parent-first locking order as other MRF updates.
  perform 1
  from public.maintenance_requests
  where id = v_request
  for update;

  select * into v_part
  from public.mrf_parts_followups
  where id = p_id and request_id = v_request
  for update;

  if not found then
    raise exception 'Part record not found';
  end if;

  if v_part.status <> 'issued' then
    raise exception 'This part has not been issued';
  end if;

  if btrim(v_part.miv_number) <> '' then
    if btrim(v_part.miv_number) = v_miv then
      return;
    end if;

    raise exception 'An MIV number is already recorded';
  end if;

  update public.mrf_parts_followups
  set miv_number = v_miv,
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_id;
end;
$$;


--
-- Name: add_maintenance_task(uuid, text, text, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_maintenance_task(p_request uuid, p_title text, p_description text, p_members uuid[]) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_status public.mrf_status;
  v_task uuid;
  v_count integer;
begin
  perform 1 from public.employees e
  where e.id = auth.uid()
    and e.is_active
    and not e.must_change_password
    and e.role in ('admin', 'maintenance_supervisor')
  for share;

  if not found then
    raise exception 'Active Admin or Maintenance Supervisor required';
  end if;

  if length(btrim(coalesce(p_title, ''))) not between 1 and 200
     or length(coalesce(p_description, '')) > 5000 then
    raise exception 'Enter a task title up to 200 characters and description up to 5000 characters';
  end if;

  if coalesce(cardinality(p_members), 0) = 0 then
    raise exception 'Select at least one team member';
  end if;

  select status into v_status
  from public.maintenance_requests
  where id = p_request
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_status not in (
    'hod_approved', 'in_progress',
    'waiting_spare_parts', 'follow_up_required'
  ) then
    raise exception 'Tasks can only be added before overall repair completion';
  end if;

  perform e.id from public.employees e
  where e.id = any(p_members)
    and e.is_active
    and e.role in (
      'maintenance_technician', 'maintenance_supervisor'
    )
  order by e.id
  for share;

  get diagnostics v_count = row_count;

  if v_count <> cardinality(p_members) then
    raise exception 'Select distinct, active technicians or supervisors';
  end if;

  insert into public.maintenance_tasks (
    request_id, title, description, created_by
  )
  values (
    p_request, btrim(p_title),
    btrim(coalesce(p_description, '')), auth.uid()
  )
  returning id into v_task;

  -- Include task members in the overall MRF team.
  insert into public.request_team_members (
    request_id, employee_id, assigned_by
  )
  select p_request, member_id, auth.uid()
  from unnest(p_members) as members(member_id)
  on conflict (request_id, employee_id) do nothing;

  insert into public.maintenance_task_members (
    task_id, employee_id, assigned_by
  )
  select v_task, member_id, auth.uid()
  from unnest(p_members) as members(member_id);

  return v_task;
end;
$$;


--
-- Name: add_parts_miv_batch(uuid[], text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_parts_miv_batch(p_ids uuid[], p_miv text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_ids uuid[];
  v_request uuid;
  v_id uuid;
  v_count integer := 0;
  v_miv text := btrim(coalesce(p_miv, ''));
begin
  perform 1
  from public.employees
  where id = auth.uid()
    and is_active
    and not must_change_password
    and role in ('admin', 'maintenance_clerk')
  for share;

  if not found then
    raise exception 'Active Admin or Maintenance Clerk required';
  end if;

  if p_ids is null
     or cardinality(p_ids) not between 1 and 100
     or array_position(p_ids, null) is not null then
    raise exception 'Select between 1 and 100 issued items';
  end if;

  if length(v_miv) not between 1 and 100 then
    raise exception 'Enter an MIV number of 1 to 100 characters';
  end if;

  select array_agg(distinct item_id order by item_id)
  into v_ids
  from unnest(p_ids) as selected(item_id);

  if (
    select count(*)
    from public.mrf_parts_followups
    where id = any(v_ids)
  ) <> cardinality(v_ids) then
    raise exception 'One or more selected part records no longer exist';
  end if;

  -- Lock parent MRFs in a consistent order.
  for v_request in
    select distinct request_id
    from public.mrf_parts_followups
    where id = any(v_ids)
    order by request_id
  loop
    perform 1
    from public.maintenance_requests
    where id = v_request
    for update;
  end loop;

  -- Reuse the existing role, issued-status and MIV-lock checks.
  foreach v_id in array v_ids
  loop
    perform public.add_issued_part_miv(v_id, v_miv);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;


--
-- Name: add_pm_annual_activity(uuid, uuid, text, text, integer, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_pm_annual_activity(p_annual_plan uuid, p_machine uuid, p_title text, p_instructions text, p_frequency_months integer, p_first_planned_date date) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_year integer;
  v_title text := btrim(p_title);
  v_instructions text := btrim(coalesce(p_instructions, ''));
  v_activity uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = v_user
      AND e.is_active
      AND NOT e.must_change_password
      AND e.role IN ('admin', 'maintenance_supervisor')
  ) THEN
    RAISE EXCEPTION 'Admin or maintenance supervisor required';
  END IF;

  IF p_machine IS NULL
     OR v_title IS NULL
     OR length(v_title) NOT BETWEEN 1 AND 200
     OR length(v_instructions) > 5000
     OR p_frequency_months IS NULL
     OR p_frequency_months NOT BETWEEN 1 AND 12
     OR p_first_planned_date IS NULL
     OR NOT isfinite(p_first_planned_date) THEN
    RAISE EXCEPTION 'Invalid annual PM activity details';
  END IF;

  SELECT plan_year INTO v_year
  FROM public.pm_annual_plans
  WHERE id = p_annual_plan
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Annual master plan not found';
  END IF;

  IF extract(year FROM p_first_planned_date)::integer <> v_year THEN
    RAISE EXCEPTION 'First planned date must fall within the master plan year';
  END IF;

  PERFORM 1
  FROM public.machines
  WHERE id = p_machine
    AND is_active
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Select active equipment or facilities from the register';
  END IF;

  INSERT INTO public.pm_annual_activities (
    annual_plan_id, machine_id, title, instructions,
    frequency_months, first_planned_date, created_by
  )
  VALUES (
    p_annual_plan, p_machine, v_title, v_instructions,
    p_frequency_months, p_first_planned_date, v_user
  )
  RETURNING id INTO v_activity;

  -- Generate dates from the original first date, avoiding
  -- month-end drift, and stop at the end of the selected year.
  INSERT INTO public.pm_annual_occurrences (
    activity_id, planned_date, created_by
  )
  SELECT
    v_activity,
    dates.planned_date,
    v_user
  FROM (
    SELECT (
      p_first_planned_date
      + make_interval(months => n * p_frequency_months)
    )::date AS planned_date
    FROM generate_series(0, 11) AS sequence(n)
  ) dates
  WHERE extract(year FROM dates.planned_date)::integer = v_year;

  RETURN v_activity;
END;
$$;


--
-- Name: advance_request(uuid, public.mrf_status); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.advance_request(p_request uuid, p_next public.mrf_status) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare cur public.mrf_status;
begin
 if not public.is_manager() then raise exception 'Supervisor or admin required'; end if;
 select status into cur from public.maintenance_requests where id=p_request for update;
 if not found then raise exception 'Request not found'; end if;
 if not (
   (cur='submitted' and p_next in ('hod_approved','rejected')) or
   (cur='hod_approved' and p_next='in_progress') or
   (cur='in_progress' and p_next='repair_completed') or
   (cur='repair_completed' and p_next='handover_pending') or
   (cur='handover_pending' and p_next='closed')
 ) then raise exception 'Invalid workflow transition'; end if;
 if p_next='hod_approved' and not exists
   (select 1 from public.approvals where request_id=p_request and approval_type='request_hod' and decision='approved')
 then raise exception 'Request HOD approval required'; end if;
 if p_next='handover_pending' and not exists
   (select 1 from public.approvals where request_id=p_request and approval_type='maintenance_hod' and decision='approved')
 then raise exception 'Maintenance HOD approval required'; end if;
 if p_next='closed' then
   if not exists (select 1 from public.handover_checks
       where request_id=p_request and machine_function_ok and bolts_nuts_tight
         and workplace_clean and no_temporary_modifications)
   or (select count(distinct approval_type) from public.approvals
       where request_id=p_request and decision='approved'
       and approval_type in ('maintenance_handover','requestor_handover')) <> 2
   then raise exception 'Handover checks and both signatures required'; end if;
 end if;
 update public.maintenance_requests set status=p_next,updated_at=now() where id=p_request;
end $$;


--
-- Name: approve_completed_repair(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.approve_completed_repair(p_request uuid, p_stage text, p_comments text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_department text;
  v_request_department text;
  v_status public.mrf_status;
  v_repair_time timestamptz;
  v_manager_time timestamptz;
  v_approval_type text;
begin
  if p_stage is null
     or p_stage not in ('manager', 'request_hod') then
    raise exception 'Invalid approval stage';
  end if;

  if length(btrim(coalesce(p_comments, ''))) < 1
     or length(p_comments) > 5000 then
    raise exception 'Enter approval comments of 1 to 5000 characters';
  end if;

  select e.role, d.name
    into v_role, v_department
  from public.employees e
  left join public.departments d on d.id = e.department_id
  where e.id = v_actor
    and e.is_active = true
    and e.must_change_password = false;

  if not found then
    raise exception 'Active employee with completed account setup required';
  end if;

  select r.department, r.status
    into v_request_department, v_status
  from public.maintenance_requests r
  where r.id = p_request
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_status <> 'repair_completed' then
    raise exception 'The MRF must be Repair Completed';
  end if;

  select rr.repair_reviewed_at
    into v_repair_time
  from public.repair_records rr
  where rr.request_id = p_request;

  if v_repair_time is null then
    raise exception 'Supervisor repair completion must be recorded first';
  end if;

  if p_stage = 'manager' then
    if v_role is distinct from 'admin' then
      raise exception 'Maintenance Manager (Admin) approval required';
    end if;

    v_approval_type := 'maintenance_hod';
  else
    if v_role is distinct from 'department_hod' then
      raise exception 'Requestor Department HOD approval required';
    end if;

    if v_department is distinct from v_request_department then
      raise exception 'You can only approve your own department MRFs';
    end if;

    select max(a.signed_at)
      into v_manager_time
    from public.approvals a
    where a.request_id = p_request
      and a.approval_type = 'maintenance_hod'
      and a.decision = 'approved'
      and a.signed_at >= v_repair_time;

    if v_manager_time is null then
      raise exception 'Maintenance Manager must approve first';
    end if;

    v_approval_type := 'request_hod_completion';
  end if;

  if exists (
    select 1
    from public.approvals a
    where a.request_id = p_request
      and a.approval_type = v_approval_type
      and a.signed_at >= v_repair_time
  ) then
    raise exception 'This repair approval has already been recorded';
  end if;

  insert into public.approvals (
    request_id, approval_type, decision,
    comments, signed_by, signed_at
  )
  values (
    p_request, v_approval_type, 'approved',
    btrim(p_comments), v_actor, clock_timestamp()
  );

  if p_stage = 'request_hod' then
    insert into public.request_status_notes (
      request_id, previous_status, new_status,
      reason, recorded_by
    )
    values (
      p_request,
      'repair_completed',
      'handover_pending',
      'Manager and Requestor Department HOD approved the repair. Handover pending.',
      v_actor
    );

    update public.maintenance_requests
    set status = 'handover_pending',
        updated_at = now()
    where id = p_request;
  end if;
end;
$$;


--
-- Name: assign_maintenance_request(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_maintenance_request(p_request uuid, p_technician uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_status public.mrf_status;
begin
  -- Verify the signed-in supervisor.
  perform 1
  from public.employees e
  where e.id = auth.uid()
    and e.is_active
    and not e.must_change_password
    and e.role in ('admin', 'maintenance_supervisor')
  for share;

  if not found then
    raise exception 'Active Admin or Maintenance Supervisor required';
  end if;

  -- Serialize assignments against other workflow changes.
  select r.status into v_status
  from public.maintenance_requests r
  where r.id = p_request
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_status not in (
    'hod_approved',
    'in_progress',
    'waiting_spare_parts',
    'follow_up_required'
  ) then
    raise exception 'Request must be HOD approved and awaiting or undergoing repair';
  end if;

  perform 1
  from public.employees e
  where e.id = p_technician
    and e.is_active
    and e.role = 'maintenance_technician'
  for share;

  if not found then
    raise exception 'Select an active Maintenance Technician';
  end if;

  insert into public.repair_records (
    request_id, assigned_to, assigned_by, assigned_at
  )
  values (
    p_request, p_technician, auth.uid(), now()
  )
  on conflict (request_id) do update
  set assigned_to = excluded.assigned_to,
      assigned_by = excluded.assigned_by,
      assigned_at = excluded.assigned_at,
      updated_at = now();
end;
$$;


--
-- Name: assign_maintenance_team(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_maintenance_team(p_request uuid, p_members uuid[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_status public.mrf_status;
  v_count integer;
begin
  perform 1 from public.employees e
  where e.id = auth.uid()
    and e.is_active
    and not e.must_change_password
    and e.role in ('admin', 'maintenance_supervisor')
  for share;

  if not found then
    raise exception 'Active Admin or Maintenance Supervisor required';
  end if;

  if coalesce(cardinality(p_members), 0) = 0 then
    raise exception 'Select at least one team member';
  end if;

  select r.status into v_status
  from public.maintenance_requests r
  where r.id = p_request
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_status not in (
    'hod_approved', 'in_progress',
    'waiting_spare_parts', 'follow_up_required'
  ) then
    raise exception 'Team changes are allowed only before repair completion';
  end if;

  -- Lock selected employees while checking eligibility.
  perform e.id
  from public.employees e
  where e.id = any(p_members)
    and e.is_active
    and e.role in (
      'maintenance_technician', 'maintenance_supervisor'
    )
  order by e.id
  for share;

  get diagnostics v_count = row_count;

  if v_count <> cardinality(p_members) then
    raise exception 'Select distinct, active technicians or supervisors';
  end if;

  -- Retain unchanged members and their original assignment times.
  delete from public.request_team_members
  where request_id = p_request
    and not (employee_id = any(p_members));

  insert into public.request_team_members (
    request_id, employee_id, assigned_by
  )
  select p_request, member_id, auth.uid()
  from unnest(p_members) as members(member_id)
  on conflict (request_id, employee_id) do nothing;
end;
$$;


--
-- Name: audit_request_row(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_request_row() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
 insert into public.audit_logs(table_name,record_id,action,actor_id,before_data,after_data)
 values(TG_TABLE_NAME,coalesce(new.request_id,old.request_id),TG_OP,auth.uid(),
        case when TG_OP<>'INSERT' then to_jsonb(old) else null end,
        case when TG_OP<>'DELETE' then to_jsonb(new) else null end);
 return coalesce(new,old);
end $$;


--
-- Name: audit_row(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_row() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
 insert into public.audit_logs(table_name,record_id,action,actor_id,before_data,after_data)
 values(TG_TABLE_NAME,coalesce(new.id,old.id),TG_OP,auth.uid(),
        case when TG_OP<>'INSERT' then to_jsonb(old) else null end,
        case when TG_OP<>'DELETE' then to_jsonb(new) else null end);
 return coalesce(new,old);
end $$;


--
-- Name: can_access_request(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_request(p_request uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.maintenance_requests r
    JOIN public.employees e
      ON e.id = (SELECT auth.uid())
    LEFT JOIN public.departments d
      ON d.id = e.department_id
    WHERE r.id = p_request
      AND e.is_active = true
      AND (
        -- Admin can oversee all MRFs
        e.role = 'admin'

        -- Original requestor can view their own MRF
        OR r.requestor_id = e.id

        -- Department HOD can view own department's MRFs
        OR (
          e.role = 'department_hod'
          AND r.department = d.name
        )

        -- Maintenance staff can view only after HOD approval
        OR (
          e.role IN (
            'maintenance_technician',
            'maintenance_supervisor',
            'maintenance_clerk'
          )
          AND r.status IN (
            'hod_approved',
            'in_progress',
            'waiting_spare_parts',
            'follow_up_required',
            'repair_completed',
            'handover_pending',
            'closed'
          )
        )
      )
  );
$$;


--
-- Name: can_edit_repair(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_edit_repair(p_request uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  SELECT public.is_maintenance()
    AND EXISTS (
      SELECT 1
      FROM public.maintenance_requests r
      WHERE r.id = p_request
        AND r.status IN (
          'hod_approved',
          'in_progress',
          'repair_completed'
        )
    );
$$;


--
-- Name: can_view_pm(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_pm() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.is_active
      AND NOT e.must_change_password
      AND e.role IN (
        'admin',
        'maintenance_supervisor',
        'maintenance_technician',
        'maintenance_clerk'
      )
  );
$$;


--
-- Name: complete_maintenance_task(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.complete_maintenance_task(p_task uuid, p_notes text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_request uuid;
  v_request_status public.mrf_status;
  v_task_status text;
  v_notes text := btrim(coalesce(p_notes, ''));
begin
  perform 1
  from public.employees e
  where e.id = auth.uid()
    and e.is_active
    and not e.must_change_password
    and e.role in ('admin', 'maintenance_supervisor')
  for share;

  if not found then
    raise exception 'Active Admin or Maintenance Supervisor required';
  end if;

  if length(v_notes) not between 1 and 5000 then
    raise exception 'Enter review notes of 1 to 5000 characters';
  end if;

  select request_id into v_request
  from public.maintenance_tasks
  where id = p_task;

  if not found then
    raise exception 'Task not found';
  end if;

  select status into v_request_status
  from public.maintenance_requests
  where id = v_request
  for update;

  if not found then
    raise exception 'MRF not found';
  end if;

  if v_request_status <> 'in_progress' then
    raise exception 'MRF must be In Progress before confirming task completion';
  end if;

  select status into v_task_status
  from public.maintenance_tasks
  where id = p_task
  for update;

  if not found or v_task_status <> 'in_progress' then
    raise exception 'Task must be In Progress and not already completed';
  end if;

  if not exists (
    select 1 from public.maintenance_task_members
    where task_id = p_task
  ) then
    raise exception 'Task has no assigned team members';
  end if;

  if exists (
    select 1
    from public.maintenance_task_members m
    left join public.task_work_records w
      on w.task_id = m.task_id
      and w.employee_id = m.employee_id
    where m.task_id = p_task
      and (
        w.id is null
        or w.completed_at is null
        or btrim(w.work_details) = ''
      )
  ) then
    raise exception 'Every assigned team member must finish their part with work details';
  end if;

  if exists (
    select 1
    from public.task_work_sessions s
    join public.task_work_records w
      on w.id = s.work_record_id
    where w.task_id = p_task
      and s.ended_at is null
  ) then
    raise exception 'A task work session is still running';
  end if;

  update public.maintenance_tasks
  set status = 'completed',
      completed_at = now(),
      reviewed_by = auth.uid(),
      review_notes = v_notes
  where id = p_task;

  -- Overall MRF remains open for repair review and handover.
end;
$$;


--
-- Name: complete_mrf_repair(uuid, text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.complete_mrf_repair(p_request uuid, p_summary text, p_downtime_ended_at timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_status public.mrf_status;
  v_downtime boolean;
  v_started timestamptz;
  v_minutes integer;
  v_summary text := btrim(coalesce(p_summary, ''));
begin
  perform 1 from public.employees e
  where e.id = auth.uid()
    and e.is_active
    and not e.must_change_password
    and e.role in ('admin', 'maintenance_supervisor')
  for share;

  if not found then
    raise exception 'Active Admin or Maintenance Supervisor required';
  end if;

  if length(v_summary) not between 1 and 10000 then
    raise exception 'Enter a repair summary of 1 to 10000 characters';
  end if;

  select status, downtime_applicable, downtime_started_at
  into v_status, v_downtime, v_started
  from public.maintenance_requests
  where id = p_request
  for update;

  if not found then
    raise exception 'MRF not found';
  end if;

  if v_status <> 'in_progress' then
    raise exception 'MRF must be In Progress';
  end if;

  if exists (
    select 1 from public.maintenance_tasks
    where request_id = p_request and status <> 'completed'
  ) then
    raise exception 'Complete and review all tasks first';
  end if;

  if exists (
    select 1 from public.request_work_records
    where request_id = p_request and completed_at is null
  ) or exists (
    select 1
    from public.task_work_records w
    join public.maintenance_tasks t on t.id = w.task_id
    where t.request_id = p_request and w.completed_at is null
  ) then
    raise exception 'Finish all personal work records first';
  end if;

  if not exists (
    select 1 from public.request_work_records
    where request_id = p_request and completed_at is not null
  ) and not exists (
    select 1
    from public.task_work_records w
    join public.maintenance_tasks t on t.id = w.task_id
    where t.request_id = p_request and w.completed_at is not null
  ) then
    raise exception 'At least one completed work record is required';
  end if;

  if exists (
    select 1
    from public.work_sessions s
    join public.request_work_records w on w.id = s.work_record_id
    where w.request_id = p_request and s.ended_at is null
  ) or exists (
    select 1
    from public.task_work_sessions s
    join public.task_work_records w on w.id = s.work_record_id
    join public.maintenance_tasks t on t.id = w.task_id
    where t.request_id = p_request and s.ended_at is null
  ) then
    raise exception 'A work session is still running';
  end if;


  if exists (
    select 1 from public.maintenance_requests
    where id = p_request and downtime_ended_at is not null
  ) then
    if p_downtime_ended_at is not null and exists (
      select 1 from public.maintenance_requests
      where id = p_request
        and downtime_ended_at <> p_downtime_ended_at
    ) then
      raise exception 'Use the previously recorded machine restart time';
    end if;

    select downtime_ended_at into p_downtime_ended_at
    from public.maintenance_requests where id = p_request;
  end if;

  if v_downtime then
    if v_started is null or p_downtime_ended_at is null then
      raise exception 'Machine downtime start and restoration time are required';
    end if;

    if p_downtime_ended_at < v_started
       or p_downtime_ended_at > now() then
      raise exception 'Machine restoration time must be after downtime started and cannot be in the future';
    end if;

    v_minutes := ceil(
      extract(epoch from (p_downtime_ended_at - v_started)) / 60
    )::integer;
  elsif p_downtime_ended_at is not null then
    raise exception 'This MRF does not have machine downtime';
  end if;

  insert into public.repair_records (
    request_id, repair_summary, repair_reviewed_by,
    repair_reviewed_at, completed_at, actual_downtime_minutes
  )
  values (
    p_request, v_summary, auth.uid(), now(), now(), v_minutes
  )
  on conflict (request_id) do update
  set repair_summary = excluded.repair_summary,
      repair_reviewed_by = excluded.repair_reviewed_by,
      repair_reviewed_at = excluded.repair_reviewed_at,
      completed_at = excluded.completed_at,
      actual_downtime_minutes = excluded.actual_downtime_minutes,
      updated_at = now();

  insert into public.request_status_notes (
    request_id, previous_status, new_status, reason, recorded_by
  )
  values (
    p_request, v_status, 'repair_completed',
    'Overall repair completion confirmed. See repair summary.',
    auth.uid()
  );

  update public.maintenance_requests
  set status = 'repair_completed',
      downtime_ended_at = p_downtime_ended_at,
      updated_at = now()
  where id = p_request;
end;
$$;


--
-- Name: create_pm_annual_plan(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_pm_annual_plan(p_year integer, p_title text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_title text := btrim(p_title);
  v_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = v_user
      AND e.is_active
      AND NOT e.must_change_password
      AND e.role IN ('admin', 'maintenance_supervisor')
  ) THEN
    RAISE EXCEPTION 'Admin or maintenance supervisor required';
  END IF;

  IF p_year IS NULL
     OR p_year NOT BETWEEN 2020 AND 2100
     OR v_title IS NULL
     OR length(v_title) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Valid year and master plan title required';
  END IF;

  INSERT INTO public.pm_annual_plans (
    plan_year, title, created_by
  )
  VALUES (p_year, v_title, v_user)
  ON CONFLICT (plan_year) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT id INTO v_id
    FROM public.pm_annual_plans
    WHERE plan_year = p_year;
  END IF;

  RETURN v_id;
END;
$$;


--
-- Name: finish_my_pm_service(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.finish_my_pm_service(p_service uuid, p_notes text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_status text;
  v_notes text := btrim(p_notes);
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = v_user
      AND e.is_active
      AND NOT e.must_change_password
      AND e.role IN (
        'maintenance_supervisor',
        'maintenance_technician'
      )
  ) THEN
    RAISE EXCEPTION 'Active technician or supervisor required';
  END IF;

  IF v_notes IS NULL
     OR length(v_notes) NOT BETWEEN 1 AND 10000 THEN
    RAISE EXCEPTION 'Work notes of 1 to 10000 characters required';
  END IF;

  SELECT status INTO v_status
  FROM public.pm_services
  WHERE id = p_service
  FOR UPDATE;

  IF NOT FOUND OR v_status <> 'in_progress' THEN
    RAISE EXCEPTION 'PM service is not open for work';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.pm_service_checks
    WHERE service_id = p_service
  ) OR EXISTS (
    SELECT 1 FROM public.pm_service_checks
    WHERE service_id = p_service AND result IS NULL
  ) THEN
    RAISE EXCEPTION 'Record every checklist result before finishing';
  END IF;

  UPDATE public.pm_service_members
  SET work_notes = v_notes,
      finished_at = now()
  WHERE service_id = p_service
    AND employee_id = v_user
    AND finished_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'You are not assigned or have already finished';
  END IF;

  -- The last person to finish submits the service for review.
  IF NOT EXISTS (
    SELECT 1 FROM public.pm_service_members
    WHERE service_id = p_service
      AND finished_at IS NULL
  ) THEN
    UPDATE public.pm_services
    SET status = 'awaiting_review',
        submitted_at = now()
    WHERE id = p_service;
  END IF;
END;
$$;


--
-- Name: guard_mrf_handover_closure(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.guard_mrf_handover_closure() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_verified_at timestamptz;
  v_hod_at timestamptz;
  v_maintenance_at timestamptz;
  v_signer uuid;
begin
  if new.status is not distinct from old.status
     or new.status <> 'closed' then
    return new;
  end if;

  if old.status <> 'handover_pending' then
    raise exception 'MRF must pass through Handover Pending';
  end if;

  select max(a.signed_at) into v_hod_at
  from public.approvals a
  join public.repair_records rr on rr.request_id = a.request_id
  where a.request_id = new.id
    and a.approval_type = 'request_hod_completion'
    and a.decision = 'approved'
    and a.signed_at >= rr.repair_reviewed_at;

  select verified_at into v_verified_at
  from public.handover_checks
  where request_id = new.id
    and machine_function_ok
    and bolts_nuts_tight
    and workplace_clean
    and no_temporary_modifications
    and verified_employee_id is not null
    and verified_at >= v_hod_at;

  if v_verified_at is null then
    raise exception 'Checklist must be verified after final HOD approval';
  end if;

  select signed_at, signed_by
    into v_maintenance_at, v_signer
  from public.approvals
  where request_id = new.id
    and approval_type = 'maintenance_handover'
    and decision = 'approved'
    and signed_at >= v_verified_at
  order by signed_at desc, id desc
  limit 1;

  if v_maintenance_at is null then
    raise exception 'Maintenance handover signature required';
  end if;

  if not exists (
    select 1 from public.approvals
    where request_id = new.id
      and approval_type = 'requestor_handover'
      and decision = 'approved'
      and signed_at >= v_maintenance_at
      and signed_by <> v_signer
  ) then
    raise exception 'Separate requestor handover signature required';
  end if;

  new.closed_at := clock_timestamp();
  return new;
end;
$$;


--
-- Name: guard_open_pm_schedule(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.guard_open_pm_schedule() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  v_plan uuid;
BEGIN
  IF TG_TABLE_NAME = 'pm_plans' THEN
    v_plan := OLD.id;

    IF ROW(
      NEW.machine_id, NEW.title, NEW.instructions,
      NEW.interval_days, NEW.next_due_date, NEW.is_active
    ) IS NOT DISTINCT FROM ROW(
      OLD.machine_id, OLD.title, OLD.instructions,
      OLD.interval_days, OLD.next_due_date, OLD.is_active
    ) THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_plan := OLD.plan_id;
  ELSE
    v_plan := NEW.plan_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.pm_services
    WHERE plan_id = v_plan
      AND status <> 'completed'
  ) THEN
    RAISE EXCEPTION 'Complete the open PM service before changing its schedule or team';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: guard_running_task_sessions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.guard_running_task_sessions() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if new.status is distinct from old.status
     and new.status::text in (
       'waiting_spare_parts', 'follow_up_required',
       'repair_completed', 'handover_pending', 'closed'
     )
     and exists (
       select 1
       from public.task_work_sessions s
       join public.task_work_records w on w.id = s.work_record_id
       join public.maintenance_tasks t on t.id = w.task_id
       where t.request_id = new.id and s.ended_at is null
     ) then
    raise exception 'Pause or finish all running task sessions first';
  end if;
  return new;
end;
$$;


--
-- Name: guard_unresolved_temporary_repair(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.guard_unresolved_temporary_repair() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if new.status in ('repair_completed', 'handover_pending', 'closed')
     and exists (
       select 1 from public.temporary_repair_followups
       where request_id = new.id and resolved_at is null
     ) then
    raise exception 'Resolve the temporary repair follow-up before completion or handover';
  end if;
  return new;
end;
$$;


--
-- Name: is_active_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_active_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    JOIN public.employees AS e
      ON e.id = p.id
    WHERE p.id = (SELECT auth.uid())
      AND p.active = true
      AND p.role::text = 'admin'
      AND e.is_active = true
      AND e.role = 'admin'
  );
$$;


--
-- Name: is_maintenance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_maintenance() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.is_active = true
      AND e.role IN (
        'maintenance_technician',
        'maintenance_supervisor'
      )
  );
$$;


--
-- Name: is_manager(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_manager() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$ select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.active and p.role in ('admin','supervisor')) $$;


--
-- Name: is_staff(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_staff() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$ select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.active) $$;


--
-- Name: list_assignable_maintenance_staff(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.list_assignable_maintenance_staff() RETURNS TABLE(id uuid, employee_id text, full_name text, role text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if not exists (
    select 1 from public.employees e
    where e.id = auth.uid()
      and e.is_active
      and not e.must_change_password
      and e.role in ('admin', 'maintenance_supervisor')
  ) then
    raise exception 'Active Admin or Maintenance Supervisor required';
  end if;

  return query
  select e.id, e.employee_id, e.full_name, e.role
  from public.employees e
  where e.is_active
    and e.role in (
      'maintenance_technician', 'maintenance_supervisor'
    )
  order by e.full_name, e.employee_id;
end;
$$;


--
-- Name: list_assignable_technicians(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.list_assignable_technicians() RETURNS TABLE(id uuid, employee_id text, full_name text)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if not exists (
    select 1
    from public.employees e
    where e.id = auth.uid()
      and e.is_active
      and not e.must_change_password
      and e.role in ('admin', 'maintenance_supervisor')
  ) then
    raise exception 'Active Admin or Maintenance Supervisor required';
  end if;

  return query
  select e.id, e.employee_id, e.full_name
  from public.employees e
  where e.is_active
    and e.role = 'maintenance_technician'
  order by e.full_name, e.employee_id;
end;
$$;


--
-- Name: list_pm_team(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.list_pm_team(p_plans uuid[]) RETURNS TABLE(plan_id uuid, employee_id uuid, employee_number text, full_name text, role text, is_active boolean, must_change_password boolean)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  IF NOT public.can_view_pm() THEN
    RAISE EXCEPTION 'Maintenance access required';
  END IF;

  IF p_plans IS NULL
     OR cardinality(p_plans) > 100
     OR (
       cardinality(p_plans) > 0
       AND array_ndims(p_plans) IS DISTINCT FROM 1
     )
     OR array_position(p_plans, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'Invalid PM schedule list';
  END IF;

  RETURN QUERY
  SELECT
    m.plan_id,
    e.id,
    e.employee_id::text,
    e.full_name::text,
    e.role::text,
    e.is_active,
    e.must_change_password
  FROM public.pm_plan_members m
  JOIN public.employees e ON e.id = m.employee_id
  WHERE m.plan_id = ANY(p_plans)
  ORDER BY m.plan_id, e.full_name, e.id;
END;
$$;


--
-- Name: list_request_team(uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.list_request_team(p_requests uuid[]) RETURNS TABLE(request_id uuid, employee_id uuid, full_name text, employee_number text, assigned_at timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select
    t.request_id,
    t.employee_id,
    e.full_name,
    e.employee_id,
    t.assigned_at
  from public.request_team_members t
  join public.employees e on e.id = t.employee_id
  where t.request_id = any(p_requests)
    and public.can_access_request(t.request_id)
  order by e.full_name, e.employee_id;
$$;


--
-- Name: maintenance_parts_report(date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.maintenance_parts_report(p_from date DEFAULT NULL::date, p_to date DEFAULT NULL::date) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_result jsonb;
begin
  if not exists (
    select 1
    from public.employees
    where id = auth.uid()
      and is_active
      and not must_change_password
      and role in ('admin', 'maintenance_supervisor')
  ) then
    raise exception 'Active Admin or Maintenance Supervisor required';
  end if;

  if p_from is not null and p_to is not null and p_from > p_to then
    raise exception 'Start date must not exceed end date';
  end if;

  with selected as (
    select
      p.*,
      r.mrf_number,
      r.machine_name,
      r.status::text as mrf_status,
      case
        when p.status <> 'cancelled'
          and p.available_at >= p.needed_at
        then extract(epoch from (p.available_at - p.needed_at)) / 3600.0
        else null
      end as wait_hours
    from public.mrf_parts_followups p
    join public.maintenance_requests r on r.id = p.request_id
    where public.can_access_request(r.id)
      and (
        p_from is null
        or r.submitted_at >=
          (p_from::timestamp at time zone 'Asia/Kuala_Lumpur')
      )
      and (
        p_to is null
        or r.submitted_at <
          ((p_to + 1)::timestamp at time zone 'Asia/Kuala_Lumpur')
      )
  ),
  totals as (
    select
      count(*) as total_records,
      count(*) filter (
        where status = 'pending_clerk_check'
      ) as pending_check,
      count(*) filter (
        where status = 'waiting'
      ) as waiting,
      count(*) filter (
        where status = 'available'
      ) as available,
      count(*) filter (
        where status = 'issued'
      ) as issued,
      count(*) filter (
        where status = 'cancelled'
      ) as cancelled,
      count(*) filter (
        where status = 'issued'
          and btrim(miv_number) = ''
      ) as miv_pending,
      count(wait_hours) as wait_samples,
      avg(wait_hours) as average_wait_hours,
      max(wait_hours) as longest_wait_hours,
      count(*) filter (
        where status <> 'cancelled'
          and btrim(defect_details) <> ''
      ) as defect_records
    from selected
  ),
  frequency as (
    select
      machine_name,
      upper(btrim(part_code)) as part_code,
      max(part_name) as part_name,
      count(*) as issue_records,
      count(distinct request_id) as mrf_count,
      sum(quantity) as issued_quantity
    from selected
    where status = 'issued'
    group by machine_name, upper(btrim(part_code))
  ),
  top_frequency as (
    select *
    from frequency
    order by issue_records desc, machine_name, part_code
    limit 50
  ),
  history as (
    select
      id,
      request_id,
      mrf_number,
      machine_name,
      mrf_status,
      part_code,
      part_name,
      quantity,
      status,
      source,
      needed_at,
      ordered_at,
      available_at,
      issued_at,
      miv_number,
      purchase_reference,
      defect_details,
      wait_hours
    from selected
    where status <> 'cancelled'
      and btrim(defect_details) <> ''
    order by needed_at desc, id desc
    limit 100
  )
  select jsonb_build_object(
    'generated_at', now(),
    'summary', (select to_jsonb(t) from totals t),
    'frequency_groups', (select count(*) from frequency),
    'frequency', coalesce((
      select jsonb_agg(
        to_jsonb(f)
        order by f.issue_records desc, f.machine_name, f.part_code
      )
      from top_frequency f
    ), '[]'::jsonb),
    'history', coalesce((
      select jsonb_agg(
        to_jsonb(h)
        order by h.needed_at desc, h.id desc
      )
      from history h
    ), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$$;


--
-- Name: maintenance_report(date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.maintenance_report(p_from date DEFAULT NULL::date, p_to date DEFAULT NULL::date) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_result jsonb;
begin
  if not exists (
    select 1 from public.employees
    where id = (select auth.uid())
      and is_active
      and not must_change_password
      and role in ('admin', 'maintenance_supervisor')
  ) then
    raise exception 'Admin or maintenance supervisor required';
  end if;

  if p_from is not null and p_to is not null
     and p_from > p_to then
    raise exception 'Start date must not exceed end date';
  end if;

  with selected as materialized (
    select r.*
    from public.maintenance_requests r
    where public.can_access_request(r.id)
      and (
        p_from is null
        or r.submitted_at >=
          (p_from::timestamp at time zone 'Asia/Kuala_Lumpur')
      )
      and (
        p_to is null
        or r.submitted_at <
          ((p_to + 1)::timestamp at time zone 'Asia/Kuala_Lumpur')
      )
  ),
  metrics as (
    select
      r.*,
      case
        when rr.repair_reviewed_at >= r.submitted_at
        then extract(epoch from
          (rr.repair_reviewed_at - r.submitted_at)) / 3600.0
      end as repair_hours,
      case
        when r.status = 'closed'
          and r.closed_at >= r.submitted_at
        then extract(epoch from
          (r.closed_at - r.submitted_at)) / 3600.0
      end as closure_hours,
      case
        when r.downtime_applicable
          and r.downtime_ended_at >= r.downtime_started_at
        then extract(epoch from
          (r.downtime_ended_at - r.downtime_started_at)) / 60.0
      end as downtime_minutes
    from selected r
    left join public.repair_records rr on rr.request_id = r.id
  ),
  sessions as (
    select w.employee_id, s.started_at, s.ended_at
    from public.work_sessions s
    join public.request_work_records w on w.id = s.work_record_id
    join selected r on r.id = w.request_id

    union all

    select w.employee_id, s.started_at, s.ended_at
    from public.task_work_sessions s
    join public.task_work_records w on w.id = s.work_record_id
    join public.maintenance_tasks t on t.id = w.task_id
    join selected r on r.id = t.request_id
  ),
  staff_totals as (
    select
      s.employee_id,
      e.employee_id as employee_number,
      e.full_name,
      count(*) filter (where s.ended_at is null) as running_sessions,
      coalesce(sum(
        greatest(
          0,
          extract(epoch from
            (coalesce(s.ended_at, now()) - s.started_at))
        )
      ), 0) / 3600.0 as work_hours
    from sessions s
    join public.employees e on e.id = s.employee_id
    group by s.employee_id, e.employee_id, e.full_name
  ),
  machine_totals as (
    select
      r.machine_id,
      m.machine_code,
      coalesce(m.machine_name, max(r.machine_name)) as machine_name,
      count(*) as total,
      count(*) filter (
        where r.status::text not in ('closed', 'rejected')
      ) as open,
      count(*) filter (where r.status::text = 'closed') as closed,
      count(*) filter (where r.status::text = 'rejected') as rejected,
      coalesce(sum(r.downtime_minutes), 0) as downtime_minutes,
      count(r.downtime_minutes) as downtime_records,
      count(*) filter (
        where r.downtime_applicable and r.downtime_minutes is null
      ) as downtime_unresolved,
      avg(r.repair_hours) as average_repair_hours,
      count(r.repair_hours) as repair_records
    from metrics r
    left join public.machines m on m.id = r.machine_id
    where r.work_category = 'equipment'
      and r.machine_id is not null
    group by r.machine_id, m.machine_code, m.machine_name
  ),
  category_totals as (
    select
      coalesce(work_category, 'uncategorised') as category,
      count(*) as total,
      count(*) filter (
        where status::text not in ('closed', 'rejected')
      ) as open,
      count(*) filter (where status::text = 'closed') as closed,
      count(*) filter (where status::text = 'rejected') as rejected,
      avg(repair_hours) as average_repair_hours,
      count(repair_hours) as repair_records
    from metrics
    group by coalesce(work_category, 'uncategorised')
  ),
  status_totals as (
    select status::text as status, count(*) as count
    from selected
    group by status
  )
  select jsonb_build_object(
    'report_version', 2,
    'generated_at', now(),
    'summary', (
      select jsonb_build_object(
        'total', count(*),
        'open', count(*) filter (
          where status::text not in ('closed', 'rejected')
        ),
        'closed', count(*) filter (where status = 'closed'),
        'rejected', count(*) filter (where status::text = 'rejected'),
        'downtime_minutes', coalesce(sum(downtime_minutes), 0),
        'downtime_records', count(downtime_minutes),
        'downtime_unresolved', count(*) filter (
          where downtime_applicable and downtime_minutes is null
        ),
        'average_repair_hours', avg(repair_hours),
        'repair_records', count(repair_hours),
        'average_closure_hours', avg(closure_hours),
        'closure_records', count(closure_hours),
        'staff_work_hours', (
          select coalesce(sum(work_hours), 0) from staff_totals
        )
      )
      from metrics
    ),
    'statuses', (
      select coalesce(
        jsonb_agg(to_jsonb(s) order by s.status), '[]'::jsonb
      )
      from status_totals s
    ),
    'categories', (
      select coalesce(
        jsonb_agg(to_jsonb(c) order by c.category),
        '[]'::jsonb
      )
      from category_totals c
    ),
    'machines', (
      select coalesce(
        jsonb_agg(
          to_jsonb(m)
          order by m.downtime_minutes desc, m.total desc, m.machine_name
        ),
        '[]'::jsonb
      )
      from machine_totals m
    ),
    'staff', (
      select coalesce(
        jsonb_agg(to_jsonb(s) order by s.work_hours desc, s.full_name),
        '[]'::jsonb
      )
      from staff_totals s
    )
  ) into v_result;

  return v_result;
end;
$$;


--
-- Name: manage_pm_annual_activity(uuid, integer, text, text, uuid, text, text, integer, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.manage_pm_annual_activity(p_activity uuid, p_expected_revision integer, p_action text, p_reason text, p_machine uuid DEFAULT NULL::uuid, p_title text DEFAULT NULL::text, p_instructions text DEFAULT ''::text, p_frequency_months integer DEFAULT NULL::integer, p_first_planned_date date DEFAULT NULL::date) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_before public.pm_annual_activities%ROWTYPE;
  v_after public.pm_annual_activities%ROWTYPE;
  v_year integer;
  v_reason text := btrim(p_reason);
  v_title text := btrim(p_title);
  v_instructions text := btrim(coalesce(p_instructions, ''));
  v_replan boolean;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = v_user
      AND e.is_active
      AND NOT e.must_change_password
      AND e.role IN ('admin', 'maintenance_supervisor')
  ) THEN
    RAISE EXCEPTION 'Admin or maintenance supervisor required';
  END IF;

  IF p_action IS NULL
     OR p_action NOT IN ('edit', 'remove')
     OR v_reason IS NULL
     OR length(v_reason) NOT BETWEEN 1 AND 1000
     OR p_expected_revision IS NULL
     OR p_expected_revision < 1 THEN
    RAISE EXCEPTION 'Valid action, revision and reason required';
  END IF;

  SELECT *
  INTO v_before
  FROM public.pm_annual_activities
  WHERE id = p_activity
  FOR UPDATE;

  IF NOT FOUND OR v_before.is_removed THEN
    RAISE EXCEPTION 'Active annual PM activity not found';
  END IF;

  IF v_before.revision <> p_expected_revision THEN
    RAISE EXCEPTION 'Activity changed. Refresh before trying again';
  END IF;

  IF p_action = 'remove' THEN
    IF EXISTS (
      SELECT 1
      FROM public.pm_annual_occurrences o
      JOIN public.pm_services s ON s.id = o.service_id
      WHERE o.activity_id = p_activity
        AND s.status <> 'completed'
    ) THEN
      RAISE EXCEPTION 'Finish the open service before removing this activity';
    END IF;

    UPDATE public.pm_annual_occurrences
    SET is_cancelled = true,
        cancelled_at = now(),
        cancellation_reason = v_reason
    WHERE activity_id = p_activity
      AND NOT is_cancelled
      AND service_id IS NULL;

    UPDATE public.pm_annual_activities
    SET is_removed = true,
        removed_at = now(),
        removed_by = v_user,
        revision = revision + 1
    WHERE id = p_activity
    RETURNING * INTO v_after;

  ELSE
    IF p_machine IS NULL
       OR v_title IS NULL
       OR length(v_title) NOT BETWEEN 1 AND 200
       OR length(v_instructions) > 5000
       OR p_frequency_months IS NULL
       OR p_frequency_months NOT BETWEEN 1 AND 12
       OR p_first_planned_date IS NULL
       OR NOT isfinite(p_first_planned_date) THEN
      RAISE EXCEPTION 'Invalid PM activity details';
    END IF;

    SELECT plan_year INTO v_year
    FROM public.pm_annual_plans
    WHERE id = v_before.annual_plan_id;

    IF extract(year FROM p_first_planned_date)::integer <> v_year THEN
      RAISE EXCEPTION 'Planned date must fall within the master plan year';
    END IF;

    v_replan :=
      p_machine IS DISTINCT FROM v_before.machine_id
      OR p_frequency_months IS DISTINCT FROM v_before.frequency_months
      OR p_first_planned_date IS DISTINCT FROM v_before.first_planned_date;

    PERFORM 1
    FROM public.machines m
    WHERE m.id = p_machine
      AND (
        m.is_active
        OR (m.id = v_before.machine_id AND NOT v_replan)
      )
    FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Select active registered equipment or facilities';
    END IF;

    IF v_replan AND EXISTS (
      SELECT 1
      FROM public.pm_annual_occurrences
      WHERE activity_id = p_activity
        AND service_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'This activity has service history. Add a new activity for a different asset or schedule';
    END IF;

    UPDATE public.pm_annual_activities
    SET machine_id = p_machine,
        title = v_title,
        instructions = v_instructions,
        frequency_months = p_frequency_months,
        first_planned_date = p_first_planned_date,
        revision = revision + 1
    WHERE id = p_activity
    RETURNING * INTO v_after;

    IF v_replan THEN
      -- Retain the previous planned dates as cancelled history.
      UPDATE public.pm_annual_occurrences
      SET is_cancelled = true,
          cancelled_at = now(),
          cancellation_reason = v_reason
      WHERE activity_id = p_activity
        AND NOT is_cancelled
        AND service_id IS NULL;

      INSERT INTO public.pm_annual_occurrences (
        activity_id, revision, planned_date, created_by
      )
      SELECT
        p_activity,
        v_after.revision,
        dates.planned_date,
        v_user
      FROM (
        SELECT (
          p_first_planned_date
          + make_interval(months => n * p_frequency_months)
        )::date AS planned_date
        FROM generate_series(0, 11) AS sequence(n)
      ) dates
      WHERE extract(year FROM dates.planned_date)::integer = v_year;
    END IF;
  END IF;

  INSERT INTO public.pm_annual_activity_changes (
    activity_id, action, reason,
    previous_details, new_details, recorded_by
  )
  VALUES (
    p_activity, p_action, v_reason,
    to_jsonb(v_before), to_jsonb(v_after), v_user
  );
END;
$$;


--
-- Name: mark_maintenance_action_read(text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_maintenance_action_read(p_key text, p_since timestamp with time zone) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if not exists (
    select 1
    from public.my_maintenance_actions() a
    where a.action_key = p_key
      and a.action_since = p_since
  ) then
    raise exception 'This action has changed or is no longer available';
  end if;

  insert into public.action_notification_reads (
    employee_id, action_key, action_since, read_at
  )
  values (auth.uid(), p_key, p_since, now())
  on conflict (employee_id, action_key) do update
  set action_since = excluded.action_since,
      read_at = excluded.read_at;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: maintenance_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mrf_number character varying(5) NOT NULL,
    requestor_id uuid NOT NULL,
    department text NOT NULL,
    machine_name text NOT NULL,
    request_type text NOT NULL,
    description text NOT NULL,
    downtime_applicable boolean DEFAULT false NOT NULL,
    downtime_started_at timestamp with time zone,
    status public.mrf_status DEFAULT 'submitted'::public.mrf_status NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    downtime_ended_at timestamp with time zone,
    closed_at timestamp with time zone,
    priority smallint DEFAULT 3 NOT NULL,
    work_category text,
    machine_id uuid,
    work_location text DEFAULT ''::text NOT NULL,
    CONSTRAINT description_not_blank CHECK ((length(btrim(description)) > 0)),
    CONSTRAINT downtime_end_after_start CHECK (((downtime_ended_at IS NULL) OR ((downtime_started_at IS NOT NULL) AND (downtime_ended_at >= downtime_started_at)))),
    CONSTRAINT machine_not_blank CHECK ((length(btrim(machine_name)) > 0)),
    CONSTRAINT maintenance_requests_priority_check CHECK (((priority >= 1) AND (priority <= 4))),
    CONSTRAINT maintenance_requests_request_type_check CHECK ((request_type = ANY (ARRAY['repair'::text, 'maintenance'::text, 'modification'::text]))),
    CONSTRAINT mrf_number_five_digits CHECK (((mrf_number)::text ~ '^[0-9]{5}$'::text)),
    CONSTRAINT request_equipment_link_valid CHECK ((((work_category IS NULL) AND (machine_id IS NULL)) OR ((work_category IS NOT NULL) AND (((work_category = 'equipment'::text) AND (machine_id IS NOT NULL)) OR ((work_category = ANY (ARRAY['facilities'::text, 'other'::text])) AND (machine_id IS NULL)))))),
    CONSTRAINT request_location_length CHECK ((char_length(work_location) <= 200)),
    CONSTRAINT request_non_equipment_downtime CHECK (((work_category IS NULL) OR (work_category = 'equipment'::text) OR (NOT downtime_applicable))),
    CONSTRAINT request_non_equipment_location CHECK (((work_category IS NULL) OR (work_category = 'equipment'::text) OR (char_length(btrim(work_location)) > 0))),
    CONSTRAINT request_work_category_valid CHECK (((work_category IS NULL) OR (work_category = ANY (ARRAY['equipment'::text, 'facilities'::text, 'other'::text]))))
);


--
-- Name: mrf_in_progress_since(public.maintenance_requests); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mrf_in_progress_since(p_row public.maintenance_requests) RETURNS timestamp with time zone
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_result timestamptz;
begin
  if not public.can_access_request(p_row.id) then
    return null;
  end if;

  if not exists (
    select 1 from public.maintenance_requests
    where id = p_row.id and status = 'in_progress'
  ) then
    return null;
  end if;

  select max(a.occurred_at)
  into v_result
  from public.audit_logs a
  where a.table_name = 'maintenance_requests'
    and a.record_id = p_row.id
    and a.after_data ->> 'status' = 'in_progress'
    and (a.before_data ->> 'status')
      is distinct from 'in_progress';

  return v_result;
end;
$$;


--
-- Name: mrf_last_activity(public.maintenance_requests); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mrf_last_activity(p_row public.maintenance_requests) RETURNS timestamp with time zone
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_result timestamptz;
begin
  if not public.can_access_request(p_row.id) then
    return null;
  end if;

  with entities(table_name, record_id) as (
    select 'maintenance_requests'::text, p_row.id
    union all
    select 'repair_records', p_row.id
    union all
    select 'handover_checks', p_row.id
    union all
    select 'approvals', id
      from public.approvals where request_id = p_row.id
    union all
    select 'request_status_notes', id
      from public.request_status_notes where request_id = p_row.id
    union all
    select 'request_team_members', id
      from public.request_team_members where request_id = p_row.id
    union all
    select 'request_work_records', id
      from public.request_work_records where request_id = p_row.id
    union all
    select 'work_sessions', s.id
      from public.work_sessions s
      join public.request_work_records w on w.id = s.work_record_id
      where w.request_id = p_row.id
    union all
    select 'maintenance_tasks', id
      from public.maintenance_tasks where request_id = p_row.id
    union all
    select 'maintenance_task_members', m.id
      from public.maintenance_task_members m
      join public.maintenance_tasks t on t.id = m.task_id
      where t.request_id = p_row.id
    union all
    select 'task_work_records', w.id
      from public.task_work_records w
      join public.maintenance_tasks t on t.id = w.task_id
      where t.request_id = p_row.id
    union all
    select 'task_work_sessions', s.id
      from public.task_work_sessions s
      join public.task_work_records w on w.id = s.work_record_id
      join public.maintenance_tasks t on t.id = w.task_id
      where t.request_id = p_row.id
    union all
    select 'temporary_repair_followups', id
      from public.temporary_repair_followups where request_id = p_row.id
  )
  select greatest(r.submitted_at, r.updated_at, (
    select max(a.occurred_at)
    from public.audit_logs a
    join entities e
      on e.table_name = a.table_name
      and e.record_id = a.record_id
  ))
  into v_result
  from public.maintenance_requests r
  where r.id = p_row.id;

  return v_result;
end;
$$;


--
-- Name: my_maintenance_actions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.my_maintenance_actions() RETURNS TABLE(action_key text, request_id uuid, mrf_number text, machine_name text, title text, action_label text, href text, action_since timestamp with time zone, priority integer, is_unread boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
with actor as (
  select e.id, e.role, d.name as department
  from public.employees e
  left join public.departments d on d.id = e.department_id
  where e.id = auth.uid()
    and e.is_active
    and not e.must_change_password
),
requests as (
  select r.*
  from public.maintenance_requests r
  where exists (select 1 from actor)
    and public.can_access_request(r.id)
),
actions as (
  -- Initial request approval.
  select
    'request_approval:' || r.id::text as key,
    r.id as rid,
    'Request needs HOD approval'::text as title,
    'Review request'::text as label,
    '/approvals'::text as href,
    r.submitted_at as since
  from requests r
  cross join actor a
  where r.status::text = 'submitted'
    and (
      a.role = 'admin'
      or (a.role = 'department_hod' and a.department = r.department)
    )

  union all

  -- Approved jobs without an assigned team.
  select
    'assign_team:' || r.id,
    r.id,
    'Approved MRF needs a maintenance team',
    'Assign team',
    '/maintenance/' || r.id,
    r.updated_at
  from requests r
  cross join actor a
  where a.role in ('admin', 'maintenance_supervisor')
    and r.status::text = 'hod_approved'
    and not exists (
      select 1 from public.request_team_members m
      where m.request_id = r.id
    )

  union all

  -- Assigned personal work.
  select
    'personal_work:' || m.id,
    r.id,
    case when w.id is null
      then 'You have an assigned maintenance job'
      else 'Your maintenance work is unfinished'
    end,
    case when w.id is null then 'View / start work'
      else 'View / continue work'
    end,
    '/maintenance/' || r.id,
    m.assigned_at
  from requests r
  join public.request_team_members m on m.request_id = r.id
  cross join actor a
  left join public.request_work_records w
    on w.request_id = r.id and w.employee_id = a.id
  where m.employee_id = a.id
    and a.role in ('maintenance_technician', 'maintenance_supervisor')
    and (
      r.status::text = 'in_progress'
      or (r.status::text = 'hod_approved' and w.id is null)
    )
    and w.completed_at is null

  union all

  -- Additional assigned tasks.
  select
    'task_work:' || m.id,
    r.id,
    'Your task is unfinished: ' || t.title,
    case when w.id is null then 'View / start task'
      else 'View / continue task'
    end,
    '/maintenance/' || r.id,
    m.assigned_at
  from requests r
  join public.maintenance_tasks t on t.request_id = r.id
  join public.maintenance_task_members m on m.task_id = t.id
  cross join actor a
  left join public.task_work_records w
    on w.task_id = t.id and w.employee_id = a.id
  where m.employee_id = a.id
    and a.role in ('maintenance_technician', 'maintenance_supervisor')
    and r.status::text = 'in_progress'
    and t.status <> 'completed'
    and w.completed_at is null

  union all

  -- Task ready for supervisor review.
  select
    'task_review:' || t.id,
    r.id,
    'Team work finished: review task ' || t.title,
    'Review task',
    '/maintenance/' || r.id,
    (
      select max(w.completed_at)
      from public.task_work_records w
      where w.task_id = t.id
    )
  from requests r
  join public.maintenance_tasks t on t.request_id = r.id
  cross join actor a
  where a.role in ('admin', 'maintenance_supervisor')
    and r.status::text = 'in_progress'
    and t.status = 'in_progress'
    and exists (
      select 1 from public.maintenance_task_members m
      where m.task_id = t.id
    )
    and not exists (
      select 1
      from public.maintenance_task_members m
      left join public.task_work_records w
        on w.task_id = m.task_id
        and w.employee_id = m.employee_id
      where m.task_id = t.id
        and (
          w.id is null or w.completed_at is null
          or btrim(coalesce(w.work_details, '')) = ''
        )
    )
    and not exists (
      select 1
      from public.task_work_sessions s
      join public.task_work_records w on w.id = s.work_record_id
      where w.task_id = t.id and s.ended_at is null
    )

  union all

  -- Overall repair review: only after personal work/tasks finish.
  select
    'repair_review:' || r.id,
    r.id,
    'Recorded work is finished: review overall repair',
    'Review repair',
    '/maintenance/' || r.id,
    greatest(
      r.updated_at,
      (select max(w.completed_at)
       from public.request_work_records w where w.request_id = r.id),
      (select max(t.completed_at)
       from public.maintenance_tasks t where t.request_id = r.id)
    )
  from requests r
  cross join actor a
  where a.role in ('admin', 'maintenance_supervisor')
    and r.status::text = 'in_progress'
    and not exists (
      select 1 from public.maintenance_tasks t
      where t.request_id = r.id and t.status <> 'completed'
    )
    and not exists (
      select 1 from public.request_work_records w
      where w.request_id = r.id and w.completed_at is null
    )
    and not exists (
      select 1
      from public.task_work_records w
      join public.maintenance_tasks t on t.id = w.task_id
      where t.request_id = r.id and w.completed_at is null
    )
    and (
      exists (
        select 1 from public.request_work_records w
        where w.request_id = r.id and w.completed_at is not null
      )
      or exists (
        select 1
        from public.task_work_records w
        join public.maintenance_tasks t on t.id = w.task_id
        where t.request_id = r.id and w.completed_at is not null
      )
    )
    and not exists (
      select 1
      from public.work_sessions s
      join public.request_work_records w on w.id = s.work_record_id
      where w.request_id = r.id and s.ended_at is null
    )
    and not exists (
      select 1
      from public.task_work_sessions s
      join public.task_work_records w on w.id = s.work_record_id
      join public.maintenance_tasks t on t.id = w.task_id
      where t.request_id = r.id and s.ended_at is null
    )
    and not exists (
      select 1 from public.temporary_repair_followups f
      where f.request_id = r.id and f.resolved_at is null
    )

  union all

  -- Maintenance Manager approval.
  select
    'manager_approval:' || r.id,
    r.id,
    'Completed repair needs manager approval',
    'Review repair approval',
    '/repair-approvals',
    rr.repair_reviewed_at
  from requests r
  join public.repair_records rr on rr.request_id = r.id
  cross join actor a
  where a.role = 'admin'
    and r.status::text = 'repair_completed'
    and rr.repair_reviewed_at is not null
    and not exists (
      select 1 from public.approvals ap
      where ap.request_id = r.id
        and ap.approval_type = 'maintenance_hod'
        and ap.signed_at >= rr.repair_reviewed_at
    )

  union all

  -- Requestor Department HOD approval follows manager approval.
  select
    'hod_repair_approval:' || r.id,
    r.id,
    'Completed repair needs your department HOD approval',
    'Review repair approval',
    '/repair-approvals',
    manager.signed_at
  from requests r
  join public.repair_records rr on rr.request_id = r.id
  cross join actor a
  cross join lateral (
    select max(ap.signed_at) as signed_at
    from public.approvals ap
    where ap.request_id = r.id
      and ap.approval_type = 'maintenance_hod'
      and ap.decision = 'approved'
      and ap.signed_at >= rr.repair_reviewed_at
  ) manager
  where a.role = 'department_hod'
    and a.department = r.department
    and r.status::text = 'repair_completed'
    and manager.signed_at is not null
    and not exists (
      select 1 from public.approvals ap
      where ap.request_id = r.id
        and ap.approval_type = 'request_hod_completion'
        and ap.signed_at >= rr.repair_reviewed_at
    )

  union all

  -- Checklist first; maintenance signature second.
  select
    'maintenance_handover:' || r.id,
    r.id,
    case when
      h.machine_function_ok and h.bolts_nuts_tight
      and h.workplace_clean and h.no_temporary_modifications
      and h.verified_employee_id is not null
      and h.verified_at is not null
    then 'Verified checklist: maintenance handover needs signing'
    else 'Handover checklist needs verification'
    end,
    'Open handover',
    '/handovers',
    r.updated_at
  from requests r
  cross join actor a
  left join public.handover_checks h on h.request_id = r.id
  where a.role in ('admin', 'maintenance_supervisor')
    and r.status::text = 'handover_pending'
    and not exists (
      select 1 from public.approvals ap
      where ap.request_id = r.id
        and ap.approval_type = 'maintenance_handover'
    )

  union all

  -- Requestor acceptance requires checklist and a different signer.
  select
    'requestor_acceptance:' || r.id,
    r.id,
    'Maintenance handover is signed: inspect and accept',
    'Review / accept handover',
    '/handovers',
    signed.signed_at
  from requests r
  cross join actor a
  join public.handover_checks h on h.request_id = r.id
  cross join lateral (
    select ap.signed_at, ap.signed_by
    from public.approvals ap
    where ap.request_id = r.id
      and ap.approval_type = 'maintenance_handover'
      and ap.decision = 'approved'
      and ap.signed_at >= h.verified_at
    order by ap.signed_at desc, ap.id desc
    limit 1
  ) signed
  where r.status::text = 'handover_pending'
    and h.machine_function_ok and h.bolts_nuts_tight
    and h.workplace_clean and h.no_temporary_modifications
    and h.verified_employee_id is not null
    and a.id <> signed.signed_by
    and (
      a.id = r.requestor_id
      or (a.role = 'department_hod' and a.department = r.department)
    )
    and not exists (
      select 1 from public.approvals ap
      where ap.request_id = r.id
        and ap.approval_type = 'requestor_handover'
    )

  union all

  -- Clerk actions for parts.
  select
    'part:' || p.id || ':' || p.status,
    r.id,
    case p.status
      when 'pending_clerk_check' then 'Check requested part: '
      when 'waiting' then 'Follow up waiting part: '
      when 'available' then 'Part available: arrange issue — '
      else 'Add MIV number for issued part: '
    end || p.part_name,
    case when p.status = 'issued'
      then 'Add MIV number' else 'Review part'
    end,
    '/parts-followup?tab=' ||
      case when p.status = 'issued' then 'miv_pending' else p.status end,
    case when p.status = 'issued'
      then coalesce(p.issued_at, p.updated_at)
      else p.updated_at
    end
  from requests r
  join public.mrf_parts_followups p on p.request_id = r.id
  cross join actor a
  where a.role in ('admin', 'maintenance_clerk')
    and (
      (
        r.status::text in (
          'hod_approved', 'in_progress',
          'waiting_spare_parts', 'follow_up_required'
        )
        and p.status in ('pending_clerk_check', 'waiting', 'available')
      )
      or (p.status = 'issued' and btrim(p.miv_number) = '')
    )

  union all

  -- Permanent repair follow-up after a temporary fix.
  select
    'temporary_followup:' || f.id,
    r.id,
    'Permanent repair follow-up due ' || f.target_date::text,
    'Review follow-up',
    '/maintenance/' || r.id,
    f.recorded_at
  from requests r
  join public.temporary_repair_followups f on f.request_id = r.id
  cross join actor a
  where f.resolved_at is null
    and r.status::text in (
      'in_progress', 'waiting_spare_parts', 'follow_up_required'
    )
    and (
      a.role in ('admin', 'maintenance_supervisor')
      or a.id = f.responsible_employee_id
    )
)
select
  x.key,
  r.id,
  r.mrf_number::text,
  r.machine_name,
  x.title,
  x.label,
  x.href,
  x.since,
  r.priority::integer,
  (
    seen.action_since is null
    or seen.action_since is distinct from x.since
  ) as is_unread
from actions x
join requests r on r.id = x.rid
left join public.action_notification_reads seen
  on seen.employee_id = auth.uid()
  and seen.action_key = x.key
order by r.priority, x.since, x.key;
$$;


--
-- Name: on_auth_user_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.on_auth_user_created() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
 insert into public.profiles(id,full_name)
 values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
 return new;
end $$;


--
-- Name: pause_resume_my_work(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pause_resume_my_work(p_request uuid, p_action text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_status public.mrf_status;
  v_work_id uuid;
  v_completed_at timestamptz;
begin
  if p_action is null or p_action not in ('pause', 'resume') then
    raise exception 'Choose Pause or Resume';
  end if;

  perform 1
  from public.employees e
  where e.id = auth.uid()
    and e.is_active
    and not e.must_change_password
    and e.role in (
      'maintenance_technician', 'maintenance_supervisor'
    )
  for share;

  if not found then
    raise exception 'Active maintenance employee required';
  end if;

  select status into v_status
  from public.maintenance_requests
  where id = p_request
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_status not in (
    'in_progress', 'waiting_spare_parts', 'follow_up_required'
  ) then
    raise exception 'Work sessions cannot change at this request stage';
  end if;

  perform 1
  from public.request_team_members
  where request_id = p_request
    and employee_id = auth.uid()
  for share;

  if not found then
    raise exception 'You must be assigned to this job';
  end if;

  select id, completed_at into v_work_id, v_completed_at
  from public.request_work_records
  where request_id = p_request
    and employee_id = auth.uid()
  for update;

  if not found then
    raise exception 'Click Start Work first';
  end if;

  if v_completed_at is not null then
    raise exception 'Your work is already finished';
  end if;

  if p_action = 'pause' then
    update public.work_sessions
    set ended_at = now()
    where work_record_id = v_work_id
      and ended_at is null;
  else
    insert into public.work_sessions (work_record_id)
    values (v_work_id)
    on conflict (work_record_id)
      where ended_at is null
    do nothing;
  end if;
end;
$$;


--
-- Name: prepare_request(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prepare_request() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
DECLARE
  v_employee_id uuid;
  v_department text;
  v_role text;
BEGIN
  SELECT e.id, d.name, e.role
  INTO v_employee_id, v_department, v_role
  FROM public.employees e
  JOIN public.departments d
    ON d.id = e.department_id
  WHERE e.id = (SELECT auth.uid())
    AND e.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active employee with department required';
  END IF;

  IF v_role NOT IN ('requestor', 'department_hod') THEN
    RAISE EXCEPTION 'Only Requestors and Department HODs can submit MRFs';
  END IF;

  IF NEW.mrf_number IS NULL
     OR NEW.mrf_number !~ '^[0-9]{5}$' THEN
    RAISE EXCEPTION 'MRF number must contain exactly 5 digits';
  END IF;

  NEW.requestor_id := v_employee_id;
  NEW.department := v_department;
  NEW.status := 'submitted';
  NEW.submitted_at := now();
  NEW.updated_at := now();

  RETURN NEW;
END;
$_$;


--
-- Name: prepare_request_equipment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prepare_request_equipment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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
$$;


--
-- Name: record_approval(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_approval(p_request uuid, p_type text, p_decision text, p_comments text DEFAULT ''::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare s public.mrf_status;
begin
 if not public.is_manager() then raise exception 'Supervisor or admin required'; end if;
 if p_type not in ('request_hod','maintenance_hod','maintenance_handover','requestor_handover')
 or p_decision not in ('approved','rejected') then raise exception 'Invalid approval'; end if;
 select status into s from public.maintenance_requests where id=p_request for update;
 if not found then raise exception 'Request not found'; end if;
 if not ((p_type='request_hod' and s='submitted')
      or (p_type='maintenance_hod' and s='repair_completed')
      or (p_type in ('maintenance_handover','requestor_handover') and s='handover_pending'))
 then raise exception 'Approval not allowed at this stage'; end if;
 insert into public.approvals(request_id,approval_type,decision,comments,signed_by)
 values(p_request,p_type,p_decision,coalesce(p_comments,''),auth.uid());
end $$;


--
-- Name: record_temporary_repair(uuid, text, uuid, date, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_temporary_repair(p_request uuid, p_details text, p_responsible uuid, p_target_date date, p_restored_at timestamp with time zone) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_request public.maintenance_requests%rowtype;
  v_task uuid;
  v_followup uuid;
  v_minutes integer;
begin
  perform 1 from public.employees
  where id = auth.uid()
    and is_active
    and not must_change_password
    and role in ('admin', 'maintenance_supervisor')
  for share;

  if not found then
    raise exception 'Active Admin or Maintenance Supervisor required';
  end if;

  if length(btrim(coalesce(p_details, ''))) not between 1 and 5000 then
    raise exception 'Enter temporary repair details of 1 to 5000 characters';
  end if;

  if p_target_date is null
     or p_target_date < (clock_timestamp() at time zone 'Asia/Kuala_Lumpur')::date then
    raise exception 'Target date must be today or later';
  end if;

  if p_restored_at is null or p_restored_at > clock_timestamp() then
    raise exception 'Enter the actual restart time; it cannot be in the future';
  end if;

  select * into v_request
  from public.maintenance_requests
  where id = p_request
  for update;

  if not found then
    raise exception 'MRF not found';
  end if;

  if v_request.status not in (
    'in_progress', 'waiting_spare_parts', 'follow_up_required'
  ) then
    raise exception 'Temporary repair can only be recorded on an open repair-stage MRF';
  end if;

  if exists (
    select 1 from public.temporary_repair_followups
    where request_id = p_request and resolved_at is null
  ) then
    raise exception 'An unresolved temporary repair already exists';
  end if;

  if exists (
    select 1
    from public.work_sessions s
    join public.request_work_records w on w.id = s.work_record_id
    where w.request_id = p_request and s.ended_at is null
  ) or exists (
    select 1
    from public.task_work_sessions s
    join public.task_work_records w on w.id = s.work_record_id
    join public.maintenance_tasks t on t.id = w.task_id
    where t.request_id = p_request and s.ended_at is null
  ) then
    raise exception 'Pause or finish running work sessions first';
  end if;

  if v_request.downtime_applicable then
    if v_request.downtime_started_at is null
       or p_restored_at < v_request.downtime_started_at then
      raise exception 'Restart time must be at or after downtime started';
    end if;

    if v_request.downtime_ended_at is not null
       and v_request.downtime_ended_at <> p_restored_at then
      raise exception 'A different restart time is already recorded';
    end if;

    v_minutes := ceil(
      extract(epoch from (
        p_restored_at - v_request.downtime_started_at
      )) / 60
    )::integer;
  end if;

  -- Existing task creation validates and assigns the responsible person.
  select public.add_maintenance_task(
    p_request,
    'Permanent repair after temporary fix',
    btrim(p_details),
    array[p_responsible]
  ) into v_task;

  insert into public.temporary_repair_followups (
    request_id, task_id, temporary_repair_details,
    responsible_employee_id, target_date,
    machine_restored_at, recorded_by
  )
  values (
    p_request, v_task, btrim(p_details),
    p_responsible, p_target_date, p_restored_at, auth.uid()
  )
  returning id into v_followup;

  if v_request.downtime_applicable then
    insert into public.repair_records (
      request_id, actual_downtime_minutes
    )
    values (p_request, v_minutes)
    on conflict (request_id) do update
    set actual_downtime_minutes = excluded.actual_downtime_minutes,
        updated_at = now();
  end if;

  insert into public.request_status_notes (
    request_id, previous_status, new_status, reason, recorded_by
  )
  values (
    p_request, v_request.status, 'follow_up_required',
    'Temporary repair: machine restarted; permanent repair pending. '
      || btrim(p_details),
    auth.uid()
  );

  update public.maintenance_requests
  set status = 'follow_up_required',
      downtime_ended_at = case
        when downtime_applicable then p_restored_at
        else downtime_ended_at
      end,
      updated_at = now()
  where id = p_request;

  return v_followup;
end;
$$;


--
-- Name: request_mrf_part(uuid, text, text, numeric, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.request_mrf_part(p_request uuid, p_code text, p_name text, p_quantity numeric, p_reason text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_status text;
  v_id uuid;
begin
  perform 1
  from public.employees
  where id = auth.uid()
    and is_active
    and not must_change_password
    and role in (
      'maintenance_technician',
      'maintenance_supervisor'
    )
  for share;

  if not found then
    raise exception
      'Active Maintenance Technician or Supervisor required';
  end if;

  select status::text into v_status
  from public.maintenance_requests
  where id = p_request
  for update;

  if not found then
    raise exception 'MRF not found';
  end if;

  if v_status not in (
    'in_progress',
    'waiting_spare_parts',
    'follow_up_required'
  ) then
    raise exception
      'Parts can be requested only during an active repair';
  end if;

  perform 1
  from public.request_team_members
  where request_id = p_request
    and employee_id = auth.uid()
  for share;

  if not found then
    raise exception 'You must be assigned to this MRF';
  end if;

  if length(btrim(coalesce(p_code, ''))) > 100
     or length(btrim(coalesce(p_name, ''))) not between 1 and 200
     or length(btrim(coalesce(p_reason, ''))) not between 1 and 5000
     or p_quantity is null
     or not (p_quantity > 0 and p_quantity < 10000000000)
     or round(p_quantity, 2) <> p_quantity then
    raise exception
      'Enter a part name, valid quantity and reason';
  end if;

  insert into public.mrf_parts_followups (
    request_id,
    part_code,
    part_name,
    quantity,
    source,
    status,
    needed_at,
    defect_details,
    recorded_by,
    updated_by
  )
  values (
    p_request,
    upper(btrim(coalesce(p_code, ''))),
    btrim(p_name),
    p_quantity,
    'unconfirmed',
    'pending_clerk_check',
    now(),
    btrim(p_reason),
    auth.uid(),
    auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;


--
-- Name: require_completed_repair_approvals(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.require_completed_repair_approvals() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_repair_time timestamptz;
  v_manager_time timestamptz;
begin
  if new.status is not distinct from old.status
     or new.status not in ('handover_pending', 'closed') then
    return new;
  end if;

  select rr.repair_reviewed_at
    into v_repair_time
  from public.repair_records rr
  where rr.request_id = new.id;

  if v_repair_time is null then
    raise exception 'Recorded repair completion required before handover';
  end if;

  select max(a.signed_at)
    into v_manager_time
  from public.approvals a
  where a.request_id = new.id
    and a.approval_type = 'maintenance_hod'
    and a.decision = 'approved'
    and a.signed_at >= v_repair_time;

  if v_manager_time is null then
    raise exception 'Maintenance Manager approval required';
  end if;

  if not exists (
    select 1
    from public.approvals a
    where a.request_id = new.id
      and a.approval_type = 'request_hod_completion'
      and a.decision = 'approved'
      and a.signed_at >= v_manager_time
  ) then
    raise exception 'Requestor Department HOD repair approval required';
  end if;

  return new;
end;
$$;


--
-- Name: resolve_temporary_repair(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.resolve_temporary_repair(p_followup uuid, p_notes text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_request uuid;
  v_status public.mrf_status;
  v_followup public.temporary_repair_followups%rowtype;
begin
  perform 1 from public.employees
  where id = auth.uid()
    and is_active
    and not must_change_password
    and role in ('admin', 'maintenance_supervisor')
  for share;

  if not found then
    raise exception 'Active Admin or Maintenance Supervisor required';
  end if;

  if length(btrim(coalesce(p_notes, ''))) not between 1 and 5000 then
    raise exception 'Enter permanent repair verification notes';
  end if;

  select request_id into v_request
  from public.temporary_repair_followups
  where id = p_followup;

  if not found then
    raise exception 'Follow-up not found';
  end if;

  select status into v_status
  from public.maintenance_requests
  where id = v_request
  for update;

  if v_status <> 'in_progress' then
    raise exception 'Set the MRF to In Progress before completing permanent repair';
  end if;

  select * into v_followup
  from public.temporary_repair_followups
  where id = p_followup
  for update;

  if v_followup.resolved_at is not null then
    raise exception 'This follow-up is already resolved';
  end if;

  perform 1 from public.maintenance_tasks
  where id = v_followup.task_id
    and request_id = v_request
    and status = 'completed'
    and reviewed_by is not null
  for share;

  if not found then
    raise exception 'Complete and review the linked permanent-repair task first';
  end if;

  update public.temporary_repair_followups
  set resolved_by = auth.uid(),
      resolved_at = clock_timestamp(),
      resolution_notes = btrim(p_notes)
  where id = p_followup;
end;
$$;


--
-- Name: review_pm_service(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.review_pm_service(p_service uuid, p_notes text, p_follow_up text DEFAULT ''::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_plan_id uuid;
  v_service public.pm_services%ROWTYPE;
  v_notes text := btrim(p_notes);
  v_follow_up text := btrim(coalesce(p_follow_up, ''));
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

  IF v_notes IS NULL
     OR length(v_notes) NOT BETWEEN 1 AND 5000
     OR length(v_follow_up) > 5000 THEN
    RAISE EXCEPTION 'Valid review notes required';
  END IF;

  SELECT plan_id INTO v_plan_id
  FROM public.pm_services
  WHERE id = p_service;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PM service not found';
  END IF;

  PERFORM 1 FROM public.pm_plans
  WHERE id = v_plan_id
  FOR UPDATE;

  SELECT * INTO v_service
  FROM public.pm_services
  WHERE id = p_service
  FOR UPDATE;

  IF v_service.status <> 'awaiting_review'
     OR v_service.submitted_at IS NULL THEN
    RAISE EXCEPTION 'PM service is not awaiting review';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.pm_service_members
    WHERE service_id = p_service
  ) OR EXISTS (
    SELECT 1 FROM public.pm_service_members
    WHERE service_id = p_service
      AND (
        finished_at IS NULL
        OR length(btrim(work_notes)) = 0
      )
  ) THEN
    RAISE EXCEPTION 'Every assigned person must finish their work';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.pm_service_checks
    WHERE service_id = p_service
  ) OR EXISTS (
    SELECT 1 FROM public.pm_service_checks
    WHERE service_id = p_service AND result IS NULL
  ) THEN
    RAISE EXCEPTION 'Every checklist result is required';
  END IF;

  IF length(v_follow_up) = 0 AND EXISTS (
    SELECT 1 FROM public.pm_service_checks
    WHERE service_id = p_service AND result = 'fail'
  ) THEN
    RAISE EXCEPTION 'Failed checks require follow-up notes';
  END IF;

  UPDATE public.pm_services
  SET status = 'awaiting_acknowledgement',
      acknowledgement_required = true,
      completed_at = submitted_at,
      reviewed_by = v_user,
      reviewed_at = now(),
      review_notes = v_notes,
      follow_up_notes = v_follow_up
  WHERE id = p_service;

  -- Due date remains unchanged until Production Manager acknowledgement.
END;
$$;


--
-- Name: review_request_hod(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.review_request_hod(p_request uuid, p_decision text, p_comments text DEFAULT ''::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_role text;
  v_department text;
  v_request_department text;
  v_status public.mrf_status;
begin
  select e.role, d.name
    into v_role, v_department
  from public.employees e
  join public.departments d on d.id = e.department_id
  where e.id = auth.uid()
    and e.is_active = true
    and e.must_change_password = false;

  if not found then
    raise exception 'Active employee with completed account setup required';
  end if;

  if v_role not in ('department_hod', 'admin') then
    raise exception 'Department HOD or Admin access required';
  end if;

  if p_decision is null
     or p_decision not in ('approved', 'rejected') then
    raise exception 'Select Approved or Rejected';
  end if;

  if length(coalesce(p_comments, '')) > 5000 then
    raise exception 'Comments must not exceed 5000 characters';
  end if;

  if p_decision = 'rejected'
     and btrim(coalesce(p_comments, '')) = '' then
    raise exception 'Enter a reason for rejection';
  end if;

  select department, status
    into v_request_department, v_status
  from public.maintenance_requests
  where id = p_request
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_role = 'department_hod'
     and v_department is distinct from v_request_department then
    raise exception 'You can only approve your own department requests';
  end if;

  if v_status <> 'submitted' then
    raise exception 'This request has already been reviewed or moved to another stage';
  end if;

  insert into public.approvals (
    request_id, approval_type, decision, comments, signed_by
  )
  values (
    p_request, 'request_hod', p_decision,
    btrim(coalesce(p_comments, '')), auth.uid()
  );

  update public.maintenance_requests
  set status = case
        when p_decision = 'approved'
          then 'hod_approved'::public.mrf_status
        else 'rejected'::public.mrf_status
      end,
      updated_at = now()
  where id = p_request;
end;
$$;


--
-- Name: save_machine(text, text, uuid, text, text, boolean, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_machine(p_code text, p_name text, p_department uuid DEFAULT NULL::uuid, p_location text DEFAULT ''::text, p_notes text DEFAULT ''::text, p_active boolean DEFAULT true, p_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
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
$_$;


--
-- Name: save_mrf_handover_checks(uuid, boolean, boolean, boolean, boolean, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_mrf_handover_checks(p_request uuid, p_machine_ok boolean, p_bolts_tight boolean, p_workplace_clean boolean, p_no_temporary_modifications boolean, p_remarks text DEFAULT ''::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_status public.mrf_status;
begin
  select e.role into v_role
  from public.employees e
  where e.id = v_actor
    and e.is_active
    and not e.must_change_password;

  if not found then
    raise exception 'Active employee with completed account setup required';
  end if;

  if v_role not in ('admin', 'maintenance_supervisor') then
    raise exception 'Maintenance Supervisor or Admin required';
  end if;

  select status into v_status
  from public.maintenance_requests
  where id = p_request
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_status <> 'handover_pending' then
    raise exception 'MRF must be Handover Pending';
  end if;

  if p_machine_ok is not true
     or p_bolts_tight is not true
     or p_workplace_clean is not true
     or p_no_temporary_modifications is not true then
    raise exception 'All four checklist items must be verified';
  end if;

  if length(coalesce(p_remarks, '')) > 5000 then
    raise exception 'Remarks must not exceed 5000 characters';
  end if;

  if exists (
    select 1 from public.approvals
    where request_id = p_request
      and approval_type in (
        'maintenance_handover', 'requestor_handover'
      )
  ) then
    raise exception 'Checklist is locked after handover signing';
  end if;

  insert into public.handover_checks (
    request_id,
    machine_function_ok,
    bolts_nuts_tight,
    workplace_clean,
    no_temporary_modifications,
    remarks,
    verified_employee_id,
    verified_at
  )
  values (
    p_request, true, true, true, true,
    btrim(coalesce(p_remarks, '')),
    v_actor, clock_timestamp()
  )
  on conflict (request_id) do update
  set machine_function_ok = excluded.machine_function_ok,
      bolts_nuts_tight = excluded.bolts_nuts_tight,
      workplace_clean = excluded.workplace_clean,
      no_temporary_modifications = excluded.no_temporary_modifications,
      remarks = excluded.remarks,
      verified_employee_id = excluded.verified_employee_id,
      verified_at = excluded.verified_at;
end;
$$;


--
-- Name: save_mrf_part_followup(uuid, uuid, text, text, numeric, text, text, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_mrf_part_followup(p_id uuid, p_request uuid, p_code text, p_name text, p_quantity numeric, p_source text, p_status text, p_needed_at timestamp with time zone, p_ordered_at timestamp with time zone, p_available_at timestamp with time zone, p_issued_at timestamp with time zone, p_miv text, p_purchase_reference text, p_defect text, p_notes text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_status text;
  v_existing public.mrf_parts_followups%rowtype;
  v_id uuid;
begin
  perform 1 from public.employees
  where id = auth.uid()
    and is_active and not must_change_password
    and role in ('admin', 'maintenance_clerk')
  for share;

  if not found then
    raise exception 'Active Admin or Maintenance Clerk required';
  end if;

  select status::text into v_status
  from public.maintenance_requests
  where id = p_request
  for update;

  if not found then
    raise exception 'MRF not found';
  end if;

  if v_status not in (
    'hod_approved', 'in_progress',
    'waiting_spare_parts', 'follow_up_required'
  ) then
    raise exception 'Parts records can be saved only during an open repair stage';
  end if;

  if p_needed_at is null
     or p_needed_at > now()
     or p_ordered_at > now()
     or p_available_at > now()
     or p_issued_at > now() then
    raise exception 'Actual event dates cannot be in the future';
  end if;

  if p_quantity is null
     or not (p_quantity > 0 and p_quantity < 10000000000)
     or round(p_quantity, 2) <> p_quantity then
    raise exception 'Enter a positive quantity with at most two decimal places';
  end if;

  if p_source = 'store'
     and (p_ordered_at is not null
       or btrim(coalesce(p_purchase_reference, '')) <> '') then
    raise exception 'Store issues do not require purchase details';
  end if;

  if p_id is not null then
    select * into v_existing
    from public.mrf_parts_followups
    where id = p_id and request_id = p_request
    for update;

    if not found then
      raise exception 'Parts record not found under this MRF';
    end if;

    if v_existing.status in ('issued', 'cancelled') then
      raise exception 'Issued or cancelled records are locked';
    end if;

    update public.mrf_parts_followups
    set part_code = upper(btrim(p_code)),
        part_name = btrim(p_name),
        quantity = p_quantity,
        source = p_source,
        status = p_status,
        needed_at = p_needed_at,
        ordered_at = p_ordered_at,
        available_at = p_available_at,
        issued_at = p_issued_at,
        miv_number = btrim(coalesce(p_miv, '')),
        purchase_reference = btrim(coalesce(p_purchase_reference, '')),
        defect_details = btrim(coalesce(p_defect, '')),
        notes = btrim(coalesce(p_notes, '')),
        updated_by = auth.uid(),
        updated_at = now()
    where id = p_id;

    return p_id;
  end if;

  insert into public.mrf_parts_followups (
    request_id, part_code, part_name, quantity, source, status,
    needed_at, ordered_at, available_at, issued_at,
    miv_number, purchase_reference, defect_details, notes,
    recorded_by, updated_by
  )
  values (
    p_request, upper(btrim(p_code)), btrim(p_name),
    p_quantity, p_source, p_status,
    p_needed_at, p_ordered_at, p_available_at, p_issued_at,
    btrim(coalesce(p_miv, '')),
    btrim(coalesce(p_purchase_reference, '')),
    btrim(coalesce(p_defect, '')),
    btrim(coalesce(p_notes, '')),
    auth.uid(), auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;


--
-- Name: save_my_work(uuid, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_my_work(p_request uuid, p_details text, p_finish boolean DEFAULT false) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_status public.mrf_status;
  v_completed_at timestamptz;
  v_details text := btrim(coalesce(p_details, ''));
begin
  perform 1
  from public.employees e
  where e.id = auth.uid()
    and e.is_active
    and not e.must_change_password
    and e.role in (
      'maintenance_technician',
      'maintenance_supervisor'
    )
  for share;

  if not found then
    raise exception 'Active maintenance employee required';
  end if;

  if length(v_details) > 10000 then
    raise exception 'Work details must not exceed 10000 characters';
  end if;

  if p_finish is null then
    raise exception 'Select a valid save action';
  end if;

  if p_finish and v_details = '' then
    raise exception 'Enter your work details before finishing';
  end if;

  select r.status into v_status
  from public.maintenance_requests r
  where r.id = p_request
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_status not in (
    'in_progress', 'waiting_spare_parts', 'follow_up_required'
  ) then
    raise exception 'Work records cannot be changed at this request stage';
  end if;

  perform 1
  from public.request_team_members t
  where t.request_id = p_request
    and t.employee_id = auth.uid()
  for share;

  if not found then
    raise exception 'You must be assigned to this job';
  end if;

  select w.completed_at into v_completed_at
  from public.request_work_records w
  where w.request_id = p_request
    and w.employee_id = auth.uid()
  for update;

  if not found then
    raise exception 'Click Start Work first';
  end if;

  if v_completed_at is not null then
    raise exception 'Your work is already finished';
  end if;

  update public.request_work_records
  set work_details = v_details,
      completed_at = case when p_finish then now() else null end,
      updated_at = now()
  where request_id = p_request
    and employee_id = auth.uid();

  -- Overall MRF status is unchanged.
end;
$$;


--
-- Name: save_pm_checklist(uuid, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_pm_checklist(p_plan uuid, p_items text[]) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_items text[];
  v_previous public.pm_checklist_versions%ROWTYPE;
  v_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = v_user
      AND e.is_active
      AND NOT e.must_change_password
      AND e.role IN ('admin', 'maintenance_supervisor')
  ) THEN
    RAISE EXCEPTION 'Admin or maintenance supervisor required';
  END IF;

  IF p_items IS NULL
     OR cardinality(p_items) NOT BETWEEN 1 AND 100
     OR array_ndims(p_items) IS DISTINCT FROM 1
     OR array_position(p_items, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'Enter between 1 and 100 checklist items';
  END IF;

  SELECT array_agg(btrim(item) ORDER BY position)
  INTO v_items
  FROM unnest(p_items) WITH ORDINALITY
    AS entries(item, position);

  IF EXISTS (
    SELECT 1
    FROM unnest(v_items) AS entries(item)
    WHERE length(item) NOT BETWEEN 1 AND 500
  ) THEN
    RAISE EXCEPTION 'Each checklist item must contain 1 to 500 characters';
  END IF;

  -- Serialise checklist changes for this schedule.
  PERFORM 1
  FROM public.pm_plans
  WHERE id = p_plan
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PM schedule not found';
  END IF;

  SELECT *
  INTO v_previous
  FROM public.pm_checklist_versions
  WHERE plan_id = p_plan
  ORDER BY version DESC
  LIMIT 1;

  -- Saving identical items does not create another version.
  IF v_previous.id IS NOT NULL
     AND v_previous.items = v_items THEN
    RETURN v_previous.id;
  END IF;

  INSERT INTO public.pm_checklist_versions (
    plan_id, version, items, created_by
  )
  VALUES (
    p_plan,
    coalesce(v_previous.version, 0) + 1,
    v_items,
    v_user
  )
  RETURNING id INTO v_id;

  UPDATE public.pm_plans
  SET updated_at = now(),
      updated_by = v_user
  WHERE id = p_plan;

  RETURN v_id;
END;
$$;


--
-- Name: save_pm_plan(uuid, text, text, integer, date, uuid[], boolean, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_pm_plan(p_machine uuid, p_title text, p_instructions text, p_interval_days integer, p_next_due_date date, p_members uuid[], p_active boolean DEFAULT true, p_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_id uuid;
  v_title text := btrim(p_title);
  v_instructions text := btrim(coalesce(p_instructions, ''));
  v_member_count integer;
BEGIN
  -- Only an authenticated, active manager may change schedules.
  IF NOT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.id = v_user
      AND e.is_active
      AND NOT e.must_change_password
      AND e.role IN ('admin', 'maintenance_supervisor')
  ) THEN
    RAISE EXCEPTION 'Admin or maintenance supervisor required';
  END IF;

  IF p_machine IS NULL
     OR v_title IS NULL
     OR length(v_title) NOT BETWEEN 1 AND 200
     OR length(v_instructions) > 5000
     OR p_interval_days IS NULL
     OR p_interval_days NOT BETWEEN 1 AND 3650
     OR p_next_due_date IS NULL
     OR NOT isfinite(p_next_due_date)
     OR p_active IS NULL THEN
    RAISE EXCEPTION 'Invalid PM schedule details';
  END IF;

  IF p_members IS NULL
     OR cardinality(p_members) NOT BETWEEN 1 AND 20
     OR array_ndims(p_members) IS DISTINCT FROM 1
     OR array_position(p_members, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'Select between 1 and 20 team members';
  END IF;

  SELECT count(DISTINCT member_id)
  INTO v_member_count
  FROM unnest(p_members) AS members(member_id);

  IF v_member_count <> cardinality(p_members) THEN
    RAISE EXCEPTION 'Duplicate PM team members';
  END IF;

  IF p_id IS NOT NULL THEN
    PERFORM 1
    FROM public.pm_plans
    WHERE id = p_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PM schedule not found';
    END IF;
  END IF;

  -- Active schedules require active equipment.
  -- An existing schedule may still be deactivated after equipment retires.
  PERFORM 1
  FROM public.machines m
  WHERE m.id = p_machine
    AND (
      m.is_active
      OR (
        NOT p_active
        AND p_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.pm_plans p
          WHERE p.id = p_id
            AND p.machine_id = m.id
        )
      )
    )
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Select active registered equipment';
  END IF;

  -- Hold selected employee rows while validating and saving.
  PERFORM 1
  FROM public.employees e
  WHERE e.id = ANY(p_members)
  FOR SHARE;

  SELECT count(*)
  INTO v_member_count
  FROM public.employees e
  WHERE e.id = ANY(p_members)
    AND e.is_active
    AND NOT e.must_change_password
    AND e.role IN (
      'maintenance_supervisor',
      'maintenance_technician'
    );

  IF p_active AND v_member_count <> cardinality(p_members) THEN
    RAISE EXCEPTION 'Select active technicians or supervisors';
  END IF;

  -- Even an inactive plan must reference existing employees.
  IF (
    SELECT count(*)
    FROM public.employees e
    WHERE e.id = ANY(p_members)
  ) <> cardinality(p_members) THEN
    RAISE EXCEPTION 'PM team member not found';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.pm_plans (
      machine_id, title, instructions,
      interval_days, next_due_date, is_active,
      created_by, updated_by
    )
    VALUES (
      p_machine, v_title, v_instructions,
      p_interval_days, p_next_due_date, p_active,
      v_user, v_user
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.pm_plans
    SET machine_id = p_machine,
        title = v_title,
        instructions = v_instructions,
        interval_days = p_interval_days,
        next_due_date = p_next_due_date,
        is_active = p_active,
        updated_by = v_user,
        updated_at = now()
    WHERE id = p_id
    RETURNING id INTO v_id;
  END IF;

  DELETE FROM public.pm_plan_members
  WHERE plan_id = v_id;

  INSERT INTO public.pm_plan_members(plan_id, employee_id)
  SELECT v_id, member_id
  FROM unnest(p_members) AS members(member_id);

  RETURN v_id;
END;
$$;


--
-- Name: save_pm_service_check(uuid, integer, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_pm_service_check(p_service uuid, p_position integer, p_result text, p_notes text DEFAULT ''::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_status text;
  v_notes text := btrim(coalesce(p_notes, ''));
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = v_user
      AND e.is_active
      AND NOT e.must_change_password
      AND e.role IN (
        'maintenance_supervisor',
        'maintenance_technician'
      )
  ) THEN
    RAISE EXCEPTION 'Active technician or supervisor required';
  END IF;

  IF p_position IS NULL OR p_position NOT BETWEEN 1 AND 100
     OR p_result IS NULL
     OR p_result NOT IN ('pass', 'fail', 'not_applicable')
     OR length(v_notes) > 5000
     OR (p_result <> 'pass' AND length(v_notes) = 0) THEN
    RAISE EXCEPTION 'Valid result required; failed or not-applicable checks need notes';
  END IF;

  SELECT status INTO v_status
  FROM public.pm_services
  WHERE id = p_service
  FOR UPDATE;

  IF NOT FOUND OR v_status <> 'in_progress' THEN
    RAISE EXCEPTION 'PM service is not open for work';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.pm_service_members
    WHERE service_id = p_service
      AND employee_id = v_user
      AND finished_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Unfinished assigned team member required';
  END IF;

  UPDATE public.pm_service_checks
  SET result = p_result,
      notes = v_notes,
      checked_by = v_user,
      checked_at = now()
  WHERE service_id = p_service
    AND position = p_position;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Checklist item not found';
  END IF;
END;
$$;


--
-- Name: set_employee_access(uuid, public.app_role, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_employee_access(p_user uuid, p_role public.app_role, p_department text, p_active boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
 if not exists (select 1 from public.profiles where id=auth.uid() and active and role='admin')
 then raise exception 'Admin required'; end if;
 update public.profiles set role=p_role,department=btrim(p_department),active=p_active where id=p_user;
 if not found then raise exception 'Profile not found'; end if;
end $$;


--
-- Name: set_employee_active_status(uuid, uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_employee_active_status(p_admin_id uuid, p_employee_id uuid, p_active boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  v_admin_role text;
  v_admin_active boolean;
  v_target_role text;
  v_target_active boolean;
  v_active_admin_count integer;
BEGIN
  -- Only permit execution through the service role.
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;

  -- Serialize employee status changes.
  PERFORM pg_catalog.pg_advisory_xact_lock(82001, 14001);

  -- Verify the Admin identity supplied by the server.
  SELECT role, is_active
  INTO v_admin_role, v_admin_active
  FROM public.employees
  WHERE id = p_admin_id;

  IF NOT FOUND
     OR v_admin_role <> 'admin'
     OR v_admin_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Active Admin access required';
  END IF;

  -- Lock the target employee.
  SELECT role, is_active
  INTO v_target_role, v_target_active
  FROM public.employees
  WHERE id = p_employee_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee not found';
  END IF;

  -- Protect the last active Admin.
  IF p_active = false
     AND v_target_role = 'admin'
     AND v_target_active = true THEN

    SELECT count(*)
    INTO v_active_admin_count
    FROM public.employees
    WHERE role = 'admin'
      AND is_active = true;

    IF v_active_admin_count <= 1 THEN
      RAISE EXCEPTION
        'Cannot deactivate the last active Admin account';
    END IF;
  END IF;

  -- Update employee and profile together.
  UPDATE public.employees
  SET is_active = p_active,
      updated_at = now()
  WHERE id = p_employee_id;

  UPDATE public.profiles
  SET active = p_active
  WHERE id = p_employee_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee profile not found';
  END IF;
END;
$$;


--
-- Name: set_maintenance_job_status(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_maintenance_job_status(p_request uuid, p_next text, p_reason text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_current public.mrf_status;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  perform 1
  from public.employees e
  where e.id = auth.uid()
    and e.is_active
    and not e.must_change_password
    and e.role in ('admin', 'maintenance_supervisor')
  for share;

  if not found then
    raise exception 'Active Admin or Maintenance Supervisor required';
  end if;

  if p_next is null or p_next not in (
    'in_progress', 'waiting_spare_parts', 'follow_up_required'
  ) then
    raise exception 'Choose a valid maintenance status';
  end if;

  if length(v_reason) not between 1 and 5000 then
    raise exception 'Enter a reason of 1 to 5000 characters';
  end if;

  select status into v_current
  from public.maintenance_requests
  where id = p_request
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_current not in (
    'in_progress', 'waiting_spare_parts', 'follow_up_required'
  ) then
    raise exception 'This request is not at an editable repair stage';
  end if;

  if v_current::text = p_next then
    raise exception 'The request already has this status';
  end if;

  -- Team members must pause or finish their work before
  -- placing the overall job on hold.
  if p_next <> 'in_progress' and exists (
    select 1
    from public.work_sessions s
    join public.request_work_records w
      on w.id = s.work_record_id
    where w.request_id = p_request
      and s.ended_at is null
  ) then
    raise exception 'Team members must Pause Work or Finish My Work before placing this job on hold';
  end if;

  insert into public.request_status_notes (
    request_id, previous_status, new_status, reason, recorded_by
  )
  values (
    p_request, v_current, p_next::public.mrf_status,
    v_reason, auth.uid()
  );

  update public.maintenance_requests
  set status = p_next::public.mrf_status,
      updated_at = now()
  where id = p_request;
end;
$$;


--
-- Name: set_mrf_priority(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_mrf_priority(p_request uuid, p_priority integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if not exists (
    select 1
    from public.employees
    where id = (select auth.uid())
      and is_active
      and not must_change_password
      and role in ('admin', 'maintenance_supervisor')
  ) then
    raise exception 'Admin or maintenance supervisor required';
  end if;

  if p_priority is null or p_priority not between 1 and 4 then
    raise exception 'Invalid priority';
  end if;

  perform 1
  from public.maintenance_requests
  where id = p_request
  for update;

  if not found then
    raise exception 'MRF not found';
  end if;

  if exists (
    select 1 from public.maintenance_requests
    where id = p_request
      and status::text in ('closed', 'rejected')
  ) then
    raise exception 'Closed or rejected MRF priority cannot be changed';
  end if;

  update public.maintenance_requests
  set priority = p_priority,
      updated_at = now()
  where id = p_request
    and priority is distinct from p_priority;
end;
$$;


--
-- Name: set_my_language(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_my_language(p_language text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if p_language is null
     or p_language not in ('en', 'ms', 'zh', 'ne') then
    raise exception 'Unsupported language';
  end if;

  if not exists (
    select 1
    from public.employees
    where id = (select auth.uid())
      and is_active = true
      and must_change_password = false
  ) then
    raise exception 'Active employee login required';
  end if;

  insert into public.employee_language_preferences (
    employee_id, language_code, updated_at
  )
  values (auth.uid(), p_language, now())
  on conflict (employee_id) do update
  set language_code = excluded.language_code,
      updated_at = excluded.updated_at;
end;
$$;


--
-- Name: sign_mrf_handover(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sign_mrf_handover(p_request uuid, p_side text, p_comments text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_department text;
  v_request_department text;
  v_requestor uuid;
  v_status public.mrf_status;
  v_verified_at timestamptz;
  v_maintenance_time timestamptz;
  v_maintenance_signer uuid;
  v_type text;
begin
  if p_side is null
     or p_side not in ('maintenance', 'requestor') then
    raise exception 'Invalid handover side';
  end if;

  if length(btrim(coalesce(p_comments, ''))) < 1
     or length(p_comments) > 5000 then
    raise exception 'Enter sign-off comments of 1 to 5000 characters';
  end if;

  select e.role, d.name
    into v_role, v_department
  from public.employees e
  left join public.departments d on d.id = e.department_id
  where e.id = v_actor
    and e.is_active
    and not e.must_change_password;

  if not found then
    raise exception 'Active employee with completed account setup required';
  end if;

  select status, department, requestor_id
    into v_status, v_request_department, v_requestor
  from public.maintenance_requests
  where id = p_request
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_status <> 'handover_pending' then
    raise exception 'MRF must be Handover Pending';
  end if;

  select verified_at into v_verified_at
  from public.handover_checks
  where request_id = p_request
    and machine_function_ok
    and bolts_nuts_tight
    and workplace_clean
    and no_temporary_modifications
    and verified_employee_id is not null;

  if v_verified_at is null then
    raise exception 'Verified handover checklist required first';
  end if;

  if p_side = 'maintenance' then
    if v_role not in ('admin', 'maintenance_supervisor') then
      raise exception 'Maintenance Supervisor or Admin required';
    end if;

    v_type := 'maintenance_handover';
  else
    if not (
      v_actor = v_requestor
      or (
        v_role = 'department_hod'
        and v_department is not distinct from v_request_department
      )
    ) then
      raise exception 'Original requestor or their Department HOD required';
    end if;

    select signed_at, signed_by
      into v_maintenance_time, v_maintenance_signer
    from public.approvals
    where request_id = p_request
      and approval_type = 'maintenance_handover'
      and decision = 'approved'
      and signed_at >= v_verified_at
    order by signed_at desc, id desc
    limit 1;

    if v_maintenance_time is null then
      raise exception 'Maintenance handover signature required first';
    end if;

    if v_maintenance_signer = v_actor then
      raise exception 'Maintenance and requestor must use different signers';
    end if;

    v_type := 'requestor_handover';
  end if;

  if exists (
    select 1 from public.approvals
    where request_id = p_request
      and approval_type = v_type
  ) then
    raise exception 'This handover signature is already recorded';
  end if;

  insert into public.approvals (
    request_id, approval_type, decision,
    comments, signed_by, signed_at
  )
  values (
    p_request, v_type, 'approved',
    btrim(p_comments), v_actor, clock_timestamp()
  );

  if p_side = 'requestor' then
    insert into public.request_status_notes (
      request_id, previous_status, new_status,
      reason, recorded_by
    )
    values (
      p_request, 'handover_pending', 'closed',
      'Verified checklist and both handover signatures recorded.',
      v_actor
    );

    update public.maintenance_requests
    set status = 'closed',
        updated_at = now()
    where id = p_request;
  end if;
end;
$$;


--
-- Name: start_assigned_work(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.start_assigned_work(p_request uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_status public.mrf_status;
begin
  perform 1
  from public.employees e
  where e.id = auth.uid()
    and e.is_active
    and not e.must_change_password
    and e.role in (
      'maintenance_technician',
      'maintenance_supervisor'
    )
  for share;

  if not found then
    raise exception 'Active maintenance employee with completed account setup required';
  end if;

  -- Use the same request lock as team assignment.
  select r.status into v_status
  from public.maintenance_requests r
  where r.id = p_request
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_status not in ('hod_approved', 'in_progress') then
    raise exception 'Work can start only on HOD Approved or In Progress requests';
  end if;

  perform 1
  from public.request_team_members t
  where t.request_id = p_request
    and t.employee_id = auth.uid()
  for share;

  if not found then
    raise exception 'You must be assigned to this job';
  end if;

  -- Repeated clicks preserve the original start time.
  insert into public.request_work_records (
    request_id, employee_id
  )
  values (p_request, auth.uid())
  on conflict (request_id, employee_id) do nothing;

  if v_status = 'hod_approved' then
    update public.maintenance_requests
    set status = 'in_progress',
        updated_at = now()
    where id = p_request;
  end if;
end;
$$;


--
-- Name: start_pm_service(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.start_pm_service(p_plan uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_role text;
  v_plan public.pm_plans%ROWTYPE;
  v_machine public.machines%ROWTYPE;
  v_checklist public.pm_checklist_versions%ROWTYPE;
  v_service uuid;
  v_count integer;
BEGIN
  SELECT e.role
  INTO v_role
  FROM public.employees e
  WHERE e.id = v_user
    AND e.is_active
    AND NOT e.must_change_password
    AND e.role IN (
      'admin',
      'maintenance_supervisor',
      'maintenance_technician'
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Authorised maintenance employee required';
  END IF;

  SELECT *
  INTO v_plan
  FROM public.pm_plans
  WHERE id = p_plan
  FOR UPDATE;

  IF NOT FOUND OR NOT v_plan.is_active THEN
    RAISE EXCEPTION 'Active PM schedule required';
  END IF;

  IF v_role NOT IN ('admin', 'maintenance_supervisor')
     AND NOT EXISTS (
       SELECT 1
       FROM public.pm_plan_members m
       WHERE m.plan_id = p_plan
         AND m.employee_id = v_user
     ) THEN
    RAISE EXCEPTION 'You are not assigned to this PM schedule';
  END IF;

  -- Repeated clicks return the existing open service.
  SELECT id
  INTO v_service
  FROM public.pm_services
  WHERE plan_id = p_plan
    AND status <> 'completed';

  IF FOUND THEN
    RETURN v_service;
  END IF;

  SELECT *
  INTO v_machine
  FROM public.machines
  WHERE id = v_plan.machine_id
    AND is_active
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active registered equipment required';
  END IF;

  SELECT *
  INTO v_checklist
  FROM public.pm_checklist_versions
  WHERE plan_id = p_plan
  ORDER BY version DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Set up the PM checklist before starting service';
  END IF;

  -- Validate and hold the assigned employees while copying the team.
  PERFORM e.id
  FROM public.employees e
  JOIN public.pm_plan_members m ON m.employee_id = e.id
  WHERE m.plan_id = p_plan
  ORDER BY e.id
  FOR SHARE OF e;

  SELECT count(*)
  INTO v_count
  FROM public.pm_plan_members
  WHERE plan_id = p_plan;

  IF v_count < 1 OR EXISTS (
    SELECT 1
    FROM public.pm_plan_members m
    JOIN public.employees e ON e.id = m.employee_id
    WHERE m.plan_id = p_plan
      AND (
        NOT e.is_active
        OR e.must_change_password
        OR e.role NOT IN (
          'maintenance_supervisor',
          'maintenance_technician'
        )
      )
  ) THEN
    RAISE EXCEPTION 'Update the PM team before starting service';
  END IF;

  INSERT INTO public.pm_services (
    plan_id, machine_id, checklist_version_id,
    scheduled_due_date, title, instructions,
    machine_code, machine_name, interval_days, started_by
  )
  VALUES (
    p_plan, v_plan.machine_id, v_checklist.id,
    v_plan.next_due_date, v_plan.title, v_plan.instructions,
    v_machine.machine_code, v_machine.machine_name,
    v_plan.interval_days, v_user
  )
  RETURNING id INTO v_service;

  INSERT INTO public.pm_service_members (
    service_id, employee_id, employee_number, full_name
  )
  SELECT
    v_service, e.id, e.employee_id, e.full_name
  FROM public.pm_plan_members m
  JOIN public.employees e ON e.id = m.employee_id
  WHERE m.plan_id = p_plan;

  INSERT INTO public.pm_service_checks (
    service_id, position, item
  )
  SELECT v_service, position::integer, item
  FROM unnest(v_checklist.items) WITH ORDINALITY
    AS entries(item, position);

  RETURN v_service;
END;
$$;


--
-- Name: sync_work_sessions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_work_sessions() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if TG_OP = 'INSERT' then
    insert into public.work_sessions (
      work_record_id, started_at, ended_at
    )
    values (new.id, new.started_at, new.completed_at);
  elsif old.completed_at is null
        and new.completed_at is not null then
    update public.work_sessions
    set ended_at = new.completed_at
    where work_record_id = new.id
      and ended_at is null;
  end if;

  return new;
end;
$$;


--
-- Name: update_my_task_work(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_my_task_work(p_task uuid, p_action text, p_details text DEFAULT ''::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
  v_request uuid;
  v_status public.mrf_status;
  v_task_status text;
  v_work uuid;
  v_finished timestamptz;
  v_details text := btrim(coalesce(p_details, ''));
begin
  if p_action is null or p_action not in (
    'start', 'pause', 'resume', 'save', 'finish'
  ) then
    raise exception 'Invalid task action';
  end if;

  if length(v_details) > 10000
     or (p_action = 'finish' and v_details = '') then
    raise exception 'Enter work details before finishing; maximum 10000 characters';
  end if;

  perform 1 from public.employees e
  where e.id = auth.uid()
    and e.is_active
    and not e.must_change_password
    and e.role in (
      'maintenance_technician', 'maintenance_supervisor'
    )
  for share;

  if not found then
    raise exception 'Active maintenance employee required';
  end if;

  select request_id into v_request
  from public.maintenance_tasks where id = p_task;

  if not found then
    raise exception 'Task not found';
  end if;

  -- All workflow changes lock the parent MRF first.
  select status into v_status
  from public.maintenance_requests
  where id = v_request
  for update;

  if not found then
    raise exception 'MRF not found';
  end if;

  if v_status not in (
    'in_progress', 'waiting_spare_parts', 'follow_up_required'
  ) then
    raise exception 'Supervisor must set the MRF to In Progress before work starts';
  end if;

  if p_action in ('start', 'resume') and v_status <> 'in_progress' then
    raise exception 'Supervisor must change the MRF to In Progress before starting or resuming';
  end if;

  select status into v_task_status
  from public.maintenance_tasks
  where id = p_task
  for update;

  if not found or v_task_status = 'completed' then
    raise exception 'Task is unavailable or already completed';
  end if;

  perform 1 from public.maintenance_task_members
  where task_id = p_task and employee_id = auth.uid()
  for share;

  if not found then
    raise exception 'You must be assigned to this task';
  end if;

  if p_action = 'start' then
    insert into public.task_work_records(task_id, employee_id)
    values (p_task, auth.uid())
    on conflict (task_id, employee_id) do nothing;
  end if;

  select id, completed_at into v_work, v_finished
  from public.task_work_records
  where task_id = p_task and employee_id = auth.uid()
  for update;

  if not found then
    raise exception 'Start this task first';
  end if;

  if v_finished is not null then
    raise exception 'Your work on this task is already finished';
  end if;

  if p_action in ('start', 'resume') then
    insert into public.task_work_sessions(work_record_id)
    values (v_work)
    on conflict (work_record_id) where ended_at is null
    do nothing;

    update public.maintenance_tasks
    set status = 'in_progress'
    where id = p_task;

  elsif p_action = 'pause' then
    update public.task_work_sessions
    set ended_at = now()
    where work_record_id = v_work and ended_at is null;

  elsif p_action in ('save', 'finish') then
    update public.task_work_records
    set work_details = v_details,
        completed_at = case when p_action = 'finish' then now() else null end,
        updated_at = now()
    where id = v_work;

    if p_action = 'finish' then
      update public.task_work_sessions
      set ended_at = now()
      where work_record_id = v_work and ended_at is null;
    end if;
  end if;

  -- Personal completion leaves the task open for supervisor review.
end;
$$;


--
-- Name: action_notification_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.action_notification_reads (
    employee_id uuid NOT NULL,
    action_key text NOT NULL,
    action_since timestamp with time zone NOT NULL,
    read_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    approval_type text NOT NULL,
    decision text NOT NULL,
    comments text DEFAULT ''::text NOT NULL,
    signed_by uuid NOT NULL,
    signed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT approvals_approval_type_check CHECK ((approval_type = ANY (ARRAY['request_hod'::text, 'maintenance_hod'::text, 'request_hod_completion'::text, 'maintenance_handover'::text, 'requestor_handover'::text]))),
    CONSTRAINT approvals_decision_check CHECK ((decision = ANY (ARRAY['approved'::text, 'rejected'::text])))
);


--
-- Name: attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    storage_path text NOT NULL,
    original_filename text NOT NULL,
    uploaded_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    action text NOT NULL,
    actor_id uuid,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    before_data jsonb,
    after_data jsonb
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: employee_language_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_language_preferences (
    employee_id uuid NOT NULL,
    language_code text DEFAULT 'en'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT employee_language_preferences_language_code_check CHECK ((language_code = ANY (ARRAY['en'::text, 'ms'::text, 'zh'::text, 'ne'::text])))
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id uuid NOT NULL,
    employee_id text NOT NULL,
    full_name text NOT NULL,
    department_id uuid,
    role text DEFAULT 'requestor'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    must_change_password boolean DEFAULT false NOT NULL,
    CONSTRAINT employees_role_check CHECK ((role = ANY (ARRAY['requestor'::text, 'department_hod'::text, 'maintenance_technician'::text, 'maintenance_supervisor'::text, 'maintenance_clerk'::text, 'admin'::text])))
);


--
-- Name: handover_checks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.handover_checks (
    request_id uuid NOT NULL,
    machine_function_ok boolean DEFAULT false NOT NULL,
    bolts_nuts_tight boolean DEFAULT false NOT NULL,
    workplace_clean boolean DEFAULT false NOT NULL,
    no_temporary_modifications boolean DEFAULT false NOT NULL,
    remarks text DEFAULT ''::text NOT NULL,
    verified_by uuid,
    verified_at timestamp with time zone,
    verified_employee_id uuid
);


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    part_code text NOT NULL,
    part_name text NOT NULL,
    unit text DEFAULT 'pcs'::text NOT NULL,
    location text DEFAULT ''::text NOT NULL,
    minimum_stock numeric(12,2) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT inventory_location_valid CHECK ((length(location) <= 200)),
    CONSTRAINT inventory_minimum_valid CHECK ((minimum_stock >= (0)::numeric)),
    CONSTRAINT inventory_part_code_valid CHECK (((part_code = upper(btrim(part_code))) AND ((length(part_code) >= 1) AND (length(part_code) <= 100)))),
    CONSTRAINT inventory_part_name_valid CHECK (((length(btrim(part_name)) >= 1) AND (length(btrim(part_name)) <= 200))),
    CONSTRAINT inventory_unit_valid CHECK (((length(btrim(unit)) >= 1) AND (length(btrim(unit)) <= 30)))
);


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    transaction_type text NOT NULL,
    quantity numeric(12,2) NOT NULL,
    request_id uuid,
    issued_to uuid,
    original_issue_id uuid,
    reference text DEFAULT ''::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    recorded_by uuid NOT NULL,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT inventory_notes_valid CHECK ((length(notes) <= 5000)),
    CONSTRAINT inventory_quantity_positive CHECK ((quantity > (0)::numeric)),
    CONSTRAINT inventory_reference_valid CHECK ((length(reference) <= 200)),
    CONSTRAINT inventory_transaction_link_valid CHECK ((((transaction_type = ANY (ARRAY['opening'::text, 'receive'::text])) AND (request_id IS NULL) AND (issued_to IS NULL) AND (original_issue_id IS NULL)) OR ((transaction_type = 'issue'::text) AND (request_id IS NOT NULL) AND (issued_to IS NOT NULL) AND (original_issue_id IS NULL)) OR ((transaction_type = 'return'::text) AND (request_id IS NOT NULL) AND (issued_to IS NOT NULL) AND (original_issue_id IS NOT NULL)))),
    CONSTRAINT inventory_transaction_type_valid CHECK ((transaction_type = ANY (ARRAY['opening'::text, 'receive'::text, 'issue'::text, 'return'::text])))
);


--
-- Name: machines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.machines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    machine_code text NOT NULL,
    machine_name text NOT NULL,
    department_id uuid,
    location text DEFAULT ''::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT machine_code_valid CHECK (((machine_code = btrim(machine_code)) AND ((char_length(machine_code) >= 1) AND (char_length(machine_code) <= 50)) AND (machine_code ~ '^[A-Za-z0-9_-]+$'::text))),
    CONSTRAINT machine_location_length CHECK ((char_length(location) <= 200)),
    CONSTRAINT machine_name_valid CHECK (((machine_name = btrim(machine_name)) AND ((char_length(machine_name) >= 1) AND (char_length(machine_name) <= 200)))),
    CONSTRAINT machine_notes_length CHECK ((char_length(notes) <= 5000))
);


--
-- Name: maintenance_task_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_task_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    assigned_by uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: maintenance_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'planned'::text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    reviewed_by uuid,
    review_notes text,
    CONSTRAINT maintenance_tasks_description_check CHECK ((length(description) <= 5000)),
    CONSTRAINT maintenance_tasks_status_check CHECK ((status = ANY (ARRAY['planned'::text, 'in_progress'::text, 'completed'::text]))),
    CONSTRAINT maintenance_tasks_title_check CHECK (((length(btrim(title)) >= 1) AND (length(btrim(title)) <= 200)))
);


--
-- Name: mrf_parts_followups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mrf_parts_followups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    part_code text NOT NULL,
    part_name text NOT NULL,
    quantity numeric(12,2) NOT NULL,
    source text NOT NULL,
    status text DEFAULT 'waiting'::text NOT NULL,
    needed_at timestamp with time zone NOT NULL,
    ordered_at timestamp with time zone,
    available_at timestamp with time zone,
    issued_at timestamp with time zone,
    miv_number text DEFAULT ''::text NOT NULL,
    purchase_reference text DEFAULT ''::text NOT NULL,
    defect_details text DEFAULT ''::text NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    recorded_by uuid NOT NULL,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mrf_part_code_valid CHECK (((length(btrim(part_code)) <= 100) AND ((length(btrim(part_code)) > 0) OR (status = ANY (ARRAY['pending_clerk_check'::text, 'cancelled'::text]))))),
    CONSTRAINT mrf_part_dates_valid CHECK ((((ordered_at IS NULL) OR (ordered_at >= needed_at)) AND ((available_at IS NULL) OR (available_at >= needed_at)) AND ((ordered_at IS NULL) OR (available_at IS NULL) OR (available_at >= ordered_at)) AND ((issued_at IS NULL) OR ((available_at IS NOT NULL) AND (issued_at >= available_at))))),
    CONSTRAINT mrf_part_name_valid CHECK (((length(btrim(part_name)) >= 1) AND (length(btrim(part_name)) <= 200))),
    CONSTRAINT mrf_part_quantity_valid CHECK (((quantity > (0)::numeric) AND (quantity < ('10000000000'::bigint)::numeric))),
    CONSTRAINT mrf_part_source_valid CHECK (((source = ANY (ARRAY['store'::text, 'purchase'::text, 'unconfirmed'::text])) AND ((source <> 'unconfirmed'::text) OR (status = ANY (ARRAY['pending_clerk_check'::text, 'cancelled'::text]))))),
    CONSTRAINT mrf_part_stage_valid CHECK ((((status = 'pending_clerk_check'::text) AND (source = 'unconfirmed'::text) AND (ordered_at IS NULL) AND (available_at IS NULL) AND (issued_at IS NULL) AND (btrim(miv_number) = ''::text) AND (btrim(purchase_reference) = ''::text)) OR ((status = 'waiting'::text) AND (available_at IS NULL) AND (issued_at IS NULL)) OR ((status = 'available'::text) AND (available_at IS NOT NULL) AND (issued_at IS NULL)) OR ((status = 'issued'::text) AND (available_at IS NOT NULL) AND (issued_at IS NOT NULL)) OR ((status = 'cancelled'::text) AND (issued_at IS NULL)))),
    CONSTRAINT mrf_part_status_valid CHECK ((status = ANY (ARRAY['pending_clerk_check'::text, 'waiting'::text, 'available'::text, 'issued'::text, 'cancelled'::text]))),
    CONSTRAINT mrf_part_text_valid CHECK (((length(miv_number) <= 100) AND (length(purchase_reference) <= 200) AND (length(defect_details) <= 5000) AND (length(notes) <= 5000)))
);


--
-- Name: parts_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    part_name text NOT NULL,
    removed_at timestamp with time zone,
    restored_at timestamp with time zone,
    notes text DEFAULT ''::text NOT NULL,
    CONSTRAINT parts_movements_check CHECK (((restored_at IS NULL) OR (removed_at IS NULL) OR (restored_at >= removed_at)))
);


--
-- Name: pm_annual_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_annual_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    annual_plan_id uuid NOT NULL,
    machine_id uuid NOT NULL,
    title text NOT NULL,
    instructions text DEFAULT ''::text NOT NULL,
    frequency_months integer NOT NULL,
    first_planned_date date NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    revision integer DEFAULT 1 NOT NULL,
    is_removed boolean DEFAULT false NOT NULL,
    removed_at timestamp with time zone,
    removed_by uuid,
    CONSTRAINT pm_annual_activities_first_planned_date_check CHECK (isfinite(first_planned_date)),
    CONSTRAINT pm_annual_activities_frequency_months_check CHECK (((frequency_months >= 1) AND (frequency_months <= 12))),
    CONSTRAINT pm_annual_activities_instructions_check CHECK ((length(instructions) <= 5000)),
    CONSTRAINT pm_annual_activities_revision_check CHECK ((revision > 0)),
    CONSTRAINT pm_annual_activities_title_check CHECK (((length(btrim(title)) >= 1) AND (length(btrim(title)) <= 200)))
);


--
-- Name: pm_annual_activity_changes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_annual_activity_changes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    action text NOT NULL,
    reason text NOT NULL,
    previous_details jsonb NOT NULL,
    new_details jsonb NOT NULL,
    recorded_by uuid NOT NULL,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pm_annual_activity_changes_action_check CHECK ((action = ANY (ARRAY['edit'::text, 'remove'::text]))),
    CONSTRAINT pm_annual_activity_changes_reason_check CHECK (((length(btrim(reason)) >= 1) AND (length(btrim(reason)) <= 1000)))
);


--
-- Name: pm_annual_occurrences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_annual_occurrences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    planned_date date NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    revision integer DEFAULT 1 NOT NULL,
    is_cancelled boolean DEFAULT false NOT NULL,
    cancelled_at timestamp with time zone,
    cancellation_reason text DEFAULT ''::text NOT NULL,
    service_id uuid,
    CONSTRAINT pm_annual_occurrences_planned_date_check CHECK (isfinite(planned_date)),
    CONSTRAINT pm_annual_occurrences_revision_check CHECK ((revision > 0))
);


--
-- Name: pm_annual_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_annual_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_year integer NOT NULL,
    title text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pm_annual_plans_plan_year_check CHECK (((plan_year >= 2020) AND (plan_year <= 2100))),
    CONSTRAINT pm_annual_plans_title_check CHECK (((length(btrim(title)) >= 1) AND (length(btrim(title)) <= 200)))
);


--
-- Name: pm_checklist_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_checklist_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    version integer NOT NULL,
    items text[] NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pm_checklist_items_count CHECK (((cardinality(items) >= 1) AND (cardinality(items) <= 100))),
    CONSTRAINT pm_checklist_items_dimension CHECK ((array_ndims(items) = 1)),
    CONSTRAINT pm_checklist_items_not_null CHECK ((array_position(items, NULL::text) IS NULL)),
    CONSTRAINT pm_checklist_versions_version_check CHECK ((version > 0))
);


--
-- Name: pm_plan_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_plan_members (
    plan_id uuid NOT NULL,
    employee_id uuid NOT NULL
);


--
-- Name: pm_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    machine_id uuid NOT NULL,
    title text NOT NULL,
    instructions text DEFAULT ''::text NOT NULL,
    interval_days integer NOT NULL,
    next_due_date date NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid NOT NULL,
    updated_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pm_plan_due_date_valid CHECK (isfinite(next_due_date)),
    CONSTRAINT pm_plan_instructions_valid CHECK ((length(instructions) <= 5000)),
    CONSTRAINT pm_plan_interval_valid CHECK (((interval_days >= 1) AND (interval_days <= 3650))),
    CONSTRAINT pm_plan_title_valid CHECK (((length(btrim(title)) >= 1) AND (length(btrim(title)) <= 200)))
);


--
-- Name: pm_service_checks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_service_checks (
    service_id uuid NOT NULL,
    "position" integer NOT NULL,
    item text NOT NULL,
    result text,
    notes text DEFAULT ''::text NOT NULL,
    checked_by uuid,
    checked_at timestamp with time zone,
    CONSTRAINT pm_service_check_explanation CHECK (((result IS NULL) OR (result = 'pass'::text) OR (length(btrim(notes)) > 0))),
    CONSTRAINT pm_service_check_notes_length CHECK ((length(notes) <= 5000)),
    CONSTRAINT pm_service_check_result_fields CHECK ((((result IS NULL) AND (checked_by IS NULL) AND (checked_at IS NULL)) OR ((result IS NOT NULL) AND (checked_by IS NOT NULL) AND (checked_at IS NOT NULL)))),
    CONSTRAINT pm_service_checks_item_check CHECK (((length(btrim(item)) >= 1) AND (length(btrim(item)) <= 500))),
    CONSTRAINT pm_service_checks_position_check CHECK ((("position" >= 1) AND ("position" <= 100))),
    CONSTRAINT pm_service_checks_result_check CHECK ((result = ANY (ARRAY['pass'::text, 'fail'::text, 'not_applicable'::text])))
);


--
-- Name: pm_service_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_service_members (
    service_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    employee_number text NOT NULL,
    full_name text NOT NULL,
    work_notes text DEFAULT ''::text NOT NULL,
    finished_at timestamp with time zone,
    CONSTRAINT pm_service_finished_notes CHECK (((finished_at IS NULL) OR (length(btrim(work_notes)) > 0))),
    CONSTRAINT pm_service_work_notes_length CHECK ((length(work_notes) <= 10000))
);


--
-- Name: pm_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    machine_id uuid NOT NULL,
    checklist_version_id uuid NOT NULL,
    scheduled_due_date date NOT NULL,
    title text NOT NULL,
    instructions text NOT NULL,
    machine_code text NOT NULL,
    machine_name text NOT NULL,
    interval_days integer NOT NULL,
    status text DEFAULT 'in_progress'::text NOT NULL,
    started_by uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_at timestamp with time zone,
    completed_at timestamp with time zone,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_notes text DEFAULT ''::text NOT NULL,
    follow_up_notes text DEFAULT ''::text NOT NULL,
    acknowledgement_required boolean DEFAULT true NOT NULL,
    acknowledged_by uuid,
    acknowledged_at timestamp with time zone,
    acknowledgement_notes text DEFAULT ''::text NOT NULL,
    CONSTRAINT pm_service_ack_fields CHECK ((((acknowledged_by IS NULL) AND (acknowledged_at IS NULL)) OR ((acknowledged_by IS NOT NULL) AND (acknowledged_at IS NOT NULL) AND (reviewed_by IS NOT NULL) AND (reviewed_at IS NOT NULL) AND (acknowledged_by <> reviewed_by) AND (acknowledged_at >= reviewed_at) AND (length(btrim(acknowledgement_notes)) > 0)))),
    CONSTRAINT pm_service_ack_notes_length CHECK ((length(acknowledgement_notes) <= 5000)),
    CONSTRAINT pm_service_ack_required_to_close CHECK (((status <> 'completed'::text) OR (NOT acknowledgement_required) OR ((acknowledged_by IS NOT NULL) AND (acknowledged_at IS NOT NULL)))),
    CONSTRAINT pm_service_awaiting_ack_reviewed CHECK (((status <> 'awaiting_acknowledgement'::text) OR ((completed_at IS NOT NULL) AND (reviewed_by IS NOT NULL) AND (reviewed_at IS NOT NULL) AND (length(btrim(review_notes)) > 0)))),
    CONSTRAINT pm_service_completed_fields CHECK (((status <> 'completed'::text) OR ((completed_at IS NOT NULL) AND (reviewed_by IS NOT NULL) AND (reviewed_at IS NOT NULL) AND (length(btrim(review_notes)) > 0)))),
    CONSTRAINT pm_service_completion_order CHECK (((completed_at IS NULL) OR (completed_at >= started_at))),
    CONSTRAINT pm_service_follow_up_length CHECK ((length(follow_up_notes) <= 5000)),
    CONSTRAINT pm_service_review_notes_length CHECK ((length(review_notes) <= 5000)),
    CONSTRAINT pm_service_review_order CHECK (((reviewed_at IS NULL) OR ((submitted_at IS NOT NULL) AND (reviewed_at >= submitted_at)))),
    CONSTRAINT pm_service_submission_order CHECK (((submitted_at IS NULL) OR (submitted_at >= started_at))),
    CONSTRAINT pm_services_interval_days_check CHECK (((interval_days >= 1) AND (interval_days <= 3650))),
    CONSTRAINT pm_services_status_check CHECK ((status = ANY (ARRAY['in_progress'::text, 'awaiting_review'::text, 'awaiting_acknowledgement'::text, 'completed'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text DEFAULT ''::text NOT NULL,
    department text DEFAULT ''::text NOT NULL,
    role public.app_role DEFAULT 'requestor'::public.app_role NOT NULL,
    active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: repair_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_records (
    request_id uuid NOT NULL,
    repaired_by uuid,
    work_details text DEFAULT ''::text NOT NULL,
    completed_at timestamp with time zone,
    actual_downtime_minutes integer,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_to uuid,
    assigned_by uuid,
    assigned_at timestamp with time zone,
    repair_summary text,
    repair_reviewed_by uuid,
    repair_reviewed_at timestamp with time zone,
    CONSTRAINT repair_records_actual_downtime_minutes_check CHECK ((actual_downtime_minutes >= 0))
);


--
-- Name: request_status_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.request_status_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    previous_status public.mrf_status NOT NULL,
    new_status public.mrf_status NOT NULL,
    reason text NOT NULL,
    recorded_by uuid NOT NULL,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT request_status_notes_reason_check CHECK (((length(btrim(reason)) >= 1) AND (length(btrim(reason)) <= 5000)))
);


--
-- Name: request_team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.request_team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: request_work_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.request_work_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    work_details text DEFAULT ''::text NOT NULL,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT work_completion_after_start CHECK (((completed_at IS NULL) OR (completed_at >= started_at)))
);


--
-- Name: spare_parts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spare_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    part_name text NOT NULL,
    quantity numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT spare_parts_quantity_check CHECK ((quantity > (0)::numeric))
);


--
-- Name: task_work_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_work_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    work_details text DEFAULT ''::text NOT NULL,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT task_work_records_check CHECK (((completed_at IS NULL) OR (completed_at >= started_at)))
);


--
-- Name: task_work_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_work_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    work_record_id uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    CONSTRAINT task_work_sessions_check CHECK (((ended_at IS NULL) OR (ended_at >= started_at)))
);


--
-- Name: temporary_repair_followups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.temporary_repair_followups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_id uuid NOT NULL,
    task_id uuid NOT NULL,
    temporary_repair_details text NOT NULL,
    responsible_employee_id uuid NOT NULL,
    target_date date NOT NULL,
    machine_restored_at timestamp with time zone NOT NULL,
    recorded_by uuid NOT NULL,
    recorded_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    resolution_notes text,
    CONSTRAINT temporary_followup_resolution_check CHECK ((((resolved_at IS NULL) AND (resolved_by IS NULL) AND (resolution_notes IS NULL)) OR ((resolved_at IS NOT NULL) AND (resolved_by IS NOT NULL) AND ((length(btrim(resolution_notes)) >= 1) AND (length(btrim(resolution_notes)) <= 5000)) AND (resolved_at >= recorded_at)))),
    CONSTRAINT temporary_repair_followups_temporary_repair_details_check CHECK (((length(btrim(temporary_repair_details)) >= 1) AND (length(btrim(temporary_repair_details)) <= 5000)))
);


--
-- Name: work_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    work_record_id uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    CONSTRAINT session_end_after_start CHECK (((ended_at IS NULL) OR (ended_at >= started_at)))
);


--
-- Name: action_notification_reads action_notification_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_notification_reads
    ADD CONSTRAINT action_notification_reads_pkey PRIMARY KEY (employee_id, action_key);


--
-- Name: approvals approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_storage_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_storage_path_key UNIQUE (storage_path);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: employee_language_preferences employee_language_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_language_preferences
    ADD CONSTRAINT employee_language_preferences_pkey PRIMARY KEY (employee_id);


--
-- Name: employees employees_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_id_key UNIQUE (employee_id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: handover_checks handover_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handover_checks
    ADD CONSTRAINT handover_checks_pkey PRIMARY KEY (request_id);


--
-- Name: inventory_items inventory_items_part_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_part_code_key UNIQUE (part_code);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: machines machines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machines
    ADD CONSTRAINT machines_pkey PRIMARY KEY (id);


--
-- Name: maintenance_requests maintenance_requests_mrf_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_mrf_number_key UNIQUE (mrf_number);


--
-- Name: maintenance_requests maintenance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_pkey PRIMARY KEY (id);


--
-- Name: maintenance_task_members maintenance_task_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_task_members
    ADD CONSTRAINT maintenance_task_members_pkey PRIMARY KEY (id);


--
-- Name: maintenance_task_members maintenance_task_members_task_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_task_members
    ADD CONSTRAINT maintenance_task_members_task_id_employee_id_key UNIQUE (task_id, employee_id);


--
-- Name: maintenance_tasks maintenance_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_tasks
    ADD CONSTRAINT maintenance_tasks_pkey PRIMARY KEY (id);


--
-- Name: mrf_parts_followups mrf_parts_followups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mrf_parts_followups
    ADD CONSTRAINT mrf_parts_followups_pkey PRIMARY KEY (id);


--
-- Name: parts_movements parts_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_movements
    ADD CONSTRAINT parts_movements_pkey PRIMARY KEY (id);


--
-- Name: pm_annual_activities pm_annual_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_activities
    ADD CONSTRAINT pm_annual_activities_pkey PRIMARY KEY (id);


--
-- Name: pm_annual_activity_changes pm_annual_activity_changes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_activity_changes
    ADD CONSTRAINT pm_annual_activity_changes_pkey PRIMARY KEY (id);


--
-- Name: pm_annual_occurrences pm_annual_occurrence_revision_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_occurrences
    ADD CONSTRAINT pm_annual_occurrence_revision_unique UNIQUE (activity_id, revision, planned_date);


--
-- Name: pm_annual_occurrences pm_annual_occurrences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_occurrences
    ADD CONSTRAINT pm_annual_occurrences_pkey PRIMARY KEY (id);


--
-- Name: pm_annual_plans pm_annual_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_plans
    ADD CONSTRAINT pm_annual_plans_pkey PRIMARY KEY (id);


--
-- Name: pm_annual_plans pm_annual_plans_plan_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_plans
    ADD CONSTRAINT pm_annual_plans_plan_year_key UNIQUE (plan_year);


--
-- Name: pm_checklist_versions pm_checklist_version_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_checklist_versions
    ADD CONSTRAINT pm_checklist_version_unique UNIQUE (plan_id, version);


--
-- Name: pm_checklist_versions pm_checklist_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_checklist_versions
    ADD CONSTRAINT pm_checklist_versions_pkey PRIMARY KEY (id);


--
-- Name: pm_plan_members pm_plan_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_plan_members
    ADD CONSTRAINT pm_plan_members_pkey PRIMARY KEY (plan_id, employee_id);


--
-- Name: pm_plans pm_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_plans
    ADD CONSTRAINT pm_plans_pkey PRIMARY KEY (id);


--
-- Name: pm_service_checks pm_service_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_service_checks
    ADD CONSTRAINT pm_service_checks_pkey PRIMARY KEY (service_id, "position");


--
-- Name: pm_services pm_service_cycle_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_services
    ADD CONSTRAINT pm_service_cycle_unique UNIQUE (plan_id, scheduled_due_date);


--
-- Name: pm_service_members pm_service_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_service_members
    ADD CONSTRAINT pm_service_members_pkey PRIMARY KEY (service_id, employee_id);


--
-- Name: pm_services pm_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_services
    ADD CONSTRAINT pm_services_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: repair_records repair_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_records
    ADD CONSTRAINT repair_records_pkey PRIMARY KEY (request_id);


--
-- Name: request_status_notes request_status_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_status_notes
    ADD CONSTRAINT request_status_notes_pkey PRIMARY KEY (id);


--
-- Name: request_team_members request_team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_team_members
    ADD CONSTRAINT request_team_members_pkey PRIMARY KEY (id);


--
-- Name: request_team_members request_team_members_request_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_team_members
    ADD CONSTRAINT request_team_members_request_id_employee_id_key UNIQUE (request_id, employee_id);


--
-- Name: request_work_records request_work_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_work_records
    ADD CONSTRAINT request_work_records_pkey PRIMARY KEY (id);


--
-- Name: request_work_records request_work_records_request_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_work_records
    ADD CONSTRAINT request_work_records_request_id_employee_id_key UNIQUE (request_id, employee_id);


--
-- Name: spare_parts spare_parts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spare_parts
    ADD CONSTRAINT spare_parts_pkey PRIMARY KEY (id);


--
-- Name: task_work_records task_work_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_work_records
    ADD CONSTRAINT task_work_records_pkey PRIMARY KEY (id);


--
-- Name: task_work_records task_work_records_task_id_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_work_records
    ADD CONSTRAINT task_work_records_task_id_employee_id_key UNIQUE (task_id, employee_id);


--
-- Name: task_work_sessions task_work_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_work_sessions
    ADD CONSTRAINT task_work_sessions_pkey PRIMARY KEY (id);


--
-- Name: temporary_repair_followups temporary_repair_followups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporary_repair_followups
    ADD CONSTRAINT temporary_repair_followups_pkey PRIMARY KEY (id);


--
-- Name: work_sessions work_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_sessions
    ADD CONSTRAINT work_sessions_pkey PRIMARY KEY (id);


--
-- Name: approvals_request_history_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX approvals_request_history_idx ON public.approvals USING btree (request_id, approval_type, signed_at DESC);


--
-- Name: audit_logs_mrf_activity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_mrf_activity_idx ON public.audit_logs USING btree (table_name, record_id, occurred_at DESC);


--
-- Name: employees_department_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employees_department_idx ON public.employees USING btree (department_id);


--
-- Name: employees_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employees_role_idx ON public.employees USING btree (role);


--
-- Name: inventory_transactions_item_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inventory_transactions_item_idx ON public.inventory_transactions USING btree (item_id, recorded_at DESC);


--
-- Name: inventory_transactions_request_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inventory_transactions_request_idx ON public.inventory_transactions USING btree (request_id, recorded_at DESC);


--
-- Name: inventory_transactions_return_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inventory_transactions_return_idx ON public.inventory_transactions USING btree (original_issue_id) WHERE (original_issue_id IS NOT NULL);


--
-- Name: machines_code_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX machines_code_unique ON public.machines USING btree (lower(machine_code));


--
-- Name: maintenance_requests_machine_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maintenance_requests_machine_id_idx ON public.maintenance_requests USING btree (machine_id) WHERE (machine_id IS NOT NULL);


--
-- Name: maintenance_tasks_request_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX maintenance_tasks_request_idx ON public.maintenance_tasks USING btree (request_id, created_at);


--
-- Name: mrf_parts_followups_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mrf_parts_followups_code_idx ON public.mrf_parts_followups USING btree (part_code);


--
-- Name: mrf_parts_followups_request_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mrf_parts_followups_request_idx ON public.mrf_parts_followups USING btree (request_id, needed_at);


--
-- Name: one_open_session_per_work_record; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX one_open_session_per_work_record ON public.work_sessions USING btree (work_record_id) WHERE (ended_at IS NULL);


--
-- Name: one_open_task_work_session; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX one_open_task_work_session ON public.task_work_sessions USING btree (work_record_id) WHERE (ended_at IS NULL);


--
-- Name: pm_annual_activities_machine_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pm_annual_activities_machine_idx ON public.pm_annual_activities USING btree (machine_id);


--
-- Name: pm_annual_activity_changes_history_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pm_annual_activity_changes_history_idx ON public.pm_annual_activity_changes USING btree (activity_id, recorded_at DESC);


--
-- Name: pm_annual_activity_name_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pm_annual_activity_name_unique ON public.pm_annual_activities USING btree (annual_plan_id, machine_id, lower(btrim(title))) WHERE (NOT is_removed);


--
-- Name: pm_annual_occurrence_service_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pm_annual_occurrence_service_unique ON public.pm_annual_occurrences USING btree (service_id) WHERE (service_id IS NOT NULL);


--
-- Name: pm_annual_occurrences_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pm_annual_occurrences_date_idx ON public.pm_annual_occurrences USING btree (planned_date, activity_id);


--
-- Name: pm_plan_members_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pm_plan_members_employee_idx ON public.pm_plan_members USING btree (employee_id, plan_id);


--
-- Name: pm_plans_due_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pm_plans_due_date_idx ON public.pm_plans USING btree (next_due_date, id) WHERE is_active;


--
-- Name: pm_plans_machine_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pm_plans_machine_idx ON public.pm_plans USING btree (machine_id);


--
-- Name: pm_service_members_employee_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pm_service_members_employee_idx ON public.pm_service_members USING btree (employee_id, service_id);


--
-- Name: pm_services_machine_history_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pm_services_machine_history_idx ON public.pm_services USING btree (machine_id, started_at DESC);


--
-- Name: pm_services_one_open_per_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pm_services_one_open_per_plan ON public.pm_services USING btree (plan_id) WHERE (status <> 'completed'::text);


--
-- Name: temporary_followup_one_open_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX temporary_followup_one_open_idx ON public.temporary_repair_followups USING btree (request_id) WHERE (resolved_at IS NULL);


--
-- Name: approvals audit_approvals; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_approvals AFTER INSERT OR DELETE OR UPDATE ON public.approvals FOR EACH ROW EXECUTE FUNCTION public.audit_row();


--
-- Name: handover_checks audit_handover; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_handover AFTER INSERT OR DELETE OR UPDATE ON public.handover_checks FOR EACH ROW EXECUTE FUNCTION public.audit_request_row();


--
-- Name: inventory_items audit_inventory_items; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_inventory_items AFTER INSERT OR DELETE OR UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.audit_row();


--
-- Name: inventory_transactions audit_inventory_transactions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_inventory_transactions AFTER INSERT OR DELETE OR UPDATE ON public.inventory_transactions FOR EACH ROW EXECUTE FUNCTION public.audit_row();


--
-- Name: maintenance_task_members audit_maintenance_task_members; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_maintenance_task_members AFTER INSERT OR DELETE OR UPDATE ON public.maintenance_task_members FOR EACH ROW EXECUTE FUNCTION public.audit_row();


--
-- Name: maintenance_tasks audit_maintenance_tasks; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_maintenance_tasks AFTER INSERT OR DELETE OR UPDATE ON public.maintenance_tasks FOR EACH ROW EXECUTE FUNCTION public.audit_row();


--
-- Name: mrf_parts_followups audit_mrf_parts_followups; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_mrf_parts_followups AFTER INSERT OR DELETE OR UPDATE ON public.mrf_parts_followups FOR EACH ROW EXECUTE FUNCTION public.audit_row();


--
-- Name: repair_records audit_repairs; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_repairs AFTER INSERT OR DELETE OR UPDATE ON public.repair_records FOR EACH ROW EXECUTE FUNCTION public.audit_request_row();


--
-- Name: request_status_notes audit_request_status_notes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_request_status_notes AFTER INSERT OR DELETE OR UPDATE ON public.request_status_notes FOR EACH ROW EXECUTE FUNCTION public.audit_row();


--
-- Name: request_team_members audit_request_team_members; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_request_team_members AFTER INSERT OR DELETE OR UPDATE ON public.request_team_members FOR EACH ROW EXECUTE FUNCTION public.audit_row();


--
-- Name: request_work_records audit_request_work_records; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_request_work_records AFTER INSERT OR DELETE OR UPDATE ON public.request_work_records FOR EACH ROW EXECUTE FUNCTION public.audit_row();


--
-- Name: maintenance_requests audit_requests; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_requests AFTER INSERT OR DELETE OR UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.audit_row();


--
-- Name: task_work_records audit_task_work_records; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_task_work_records AFTER INSERT OR DELETE OR UPDATE ON public.task_work_records FOR EACH ROW EXECUTE FUNCTION public.audit_row();


--
-- Name: task_work_sessions audit_task_work_sessions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_task_work_sessions AFTER INSERT OR DELETE OR UPDATE ON public.task_work_sessions FOR EACH ROW EXECUTE FUNCTION public.audit_row();


--
-- Name: temporary_repair_followups audit_temporary_followups; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_temporary_followups AFTER INSERT OR DELETE OR UPDATE ON public.temporary_repair_followups FOR EACH ROW EXECUTE FUNCTION public.audit_row();


--
-- Name: work_sessions audit_work_sessions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_work_sessions AFTER INSERT OR DELETE OR UPDATE ON public.work_sessions FOR EACH ROW EXECUTE FUNCTION public.audit_row();


--
-- Name: maintenance_requests guard_handover_closure; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER guard_handover_closure BEFORE UPDATE OF status ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.guard_mrf_handover_closure();


--
-- Name: pm_plans guard_open_pm_plan_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER guard_open_pm_plan_update BEFORE UPDATE ON public.pm_plans FOR EACH ROW EXECUTE FUNCTION public.guard_open_pm_schedule();


--
-- Name: pm_plan_members guard_open_pm_team_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER guard_open_pm_team_change BEFORE INSERT OR DELETE OR UPDATE ON public.pm_plan_members FOR EACH ROW EXECUTE FUNCTION public.guard_open_pm_schedule();


--
-- Name: maintenance_requests guard_running_task_sessions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER guard_running_task_sessions BEFORE UPDATE OF status ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.guard_running_task_sessions();


--
-- Name: maintenance_requests guard_temporary_repair; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER guard_temporary_repair BEFORE UPDATE OF status ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.guard_unresolved_temporary_repair();


--
-- Name: maintenance_requests request_equipment_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER request_equipment_insert BEFORE INSERT ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.prepare_request_equipment();


--
-- Name: maintenance_requests request_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER request_insert BEFORE INSERT ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.prepare_request();


--
-- Name: maintenance_requests require_repair_approvals; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER require_repair_approvals BEFORE UPDATE OF status ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.require_completed_repair_approvals();


--
-- Name: request_work_records sync_work_record_sessions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sync_work_record_sessions AFTER INSERT OR UPDATE OF completed_at ON public.request_work_records FOR EACH ROW EXECUTE FUNCTION public.sync_work_sessions();


--
-- Name: action_notification_reads action_notification_reads_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_notification_reads
    ADD CONSTRAINT action_notification_reads_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: approvals approvals_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: approvals approvals_signed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_signed_by_fkey FOREIGN KEY (signed_by) REFERENCES public.employees(id);


--
-- Name: attachments attachments_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: attachments attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id);


--
-- Name: employee_language_preferences employee_language_preferences_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_language_preferences
    ADD CONSTRAINT employee_language_preferences_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: employees employees_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: handover_checks handover_checks_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handover_checks
    ADD CONSTRAINT handover_checks_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: handover_checks handover_checks_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handover_checks
    ADD CONSTRAINT handover_checks_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.profiles(id);


--
-- Name: handover_checks handover_checks_verified_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.handover_checks
    ADD CONSTRAINT handover_checks_verified_employee_id_fkey FOREIGN KEY (verified_employee_id) REFERENCES public.employees(id);


--
-- Name: inventory_items inventory_items_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id);


--
-- Name: inventory_transactions inventory_transactions_issued_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_issued_to_fkey FOREIGN KEY (issued_to) REFERENCES public.employees(id);


--
-- Name: inventory_transactions inventory_transactions_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: inventory_transactions inventory_transactions_original_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_original_issue_id_fkey FOREIGN KEY (original_issue_id) REFERENCES public.inventory_transactions(id);


--
-- Name: inventory_transactions inventory_transactions_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.employees(id);


--
-- Name: inventory_transactions inventory_transactions_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id);


--
-- Name: machines machines_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machines
    ADD CONSTRAINT machines_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: maintenance_requests maintenance_requests_machine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES public.machines(id) ON DELETE RESTRICT;


--
-- Name: maintenance_requests maintenance_requests_requestor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_requests
    ADD CONSTRAINT maintenance_requests_requestor_id_fkey FOREIGN KEY (requestor_id) REFERENCES public.employees(id);


--
-- Name: maintenance_task_members maintenance_task_members_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_task_members
    ADD CONSTRAINT maintenance_task_members_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.employees(id);


--
-- Name: maintenance_task_members maintenance_task_members_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_task_members
    ADD CONSTRAINT maintenance_task_members_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: maintenance_task_members maintenance_task_members_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_task_members
    ADD CONSTRAINT maintenance_task_members_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE;


--
-- Name: maintenance_tasks maintenance_tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_tasks
    ADD CONSTRAINT maintenance_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id);


--
-- Name: maintenance_tasks maintenance_tasks_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_tasks
    ADD CONSTRAINT maintenance_tasks_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: maintenance_tasks maintenance_tasks_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_tasks
    ADD CONSTRAINT maintenance_tasks_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.employees(id);


--
-- Name: mrf_parts_followups mrf_parts_followups_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mrf_parts_followups
    ADD CONSTRAINT mrf_parts_followups_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.employees(id);


--
-- Name: mrf_parts_followups mrf_parts_followups_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mrf_parts_followups
    ADD CONSTRAINT mrf_parts_followups_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id);


--
-- Name: mrf_parts_followups mrf_parts_followups_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mrf_parts_followups
    ADD CONSTRAINT mrf_parts_followups_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.employees(id);


--
-- Name: parts_movements parts_movements_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_movements
    ADD CONSTRAINT parts_movements_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: pm_annual_activities pm_annual_activities_annual_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_activities
    ADD CONSTRAINT pm_annual_activities_annual_plan_id_fkey FOREIGN KEY (annual_plan_id) REFERENCES public.pm_annual_plans(id) ON DELETE RESTRICT;


--
-- Name: pm_annual_activities pm_annual_activities_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_activities
    ADD CONSTRAINT pm_annual_activities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: pm_annual_activities pm_annual_activities_machine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_activities
    ADD CONSTRAINT pm_annual_activities_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES public.machines(id) ON DELETE RESTRICT;


--
-- Name: pm_annual_activities pm_annual_activities_removed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_activities
    ADD CONSTRAINT pm_annual_activities_removed_by_fkey FOREIGN KEY (removed_by) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: pm_annual_activity_changes pm_annual_activity_changes_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_activity_changes
    ADD CONSTRAINT pm_annual_activity_changes_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.pm_annual_activities(id) ON DELETE RESTRICT;


--
-- Name: pm_annual_activity_changes pm_annual_activity_changes_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_activity_changes
    ADD CONSTRAINT pm_annual_activity_changes_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: pm_annual_occurrences pm_annual_occurrences_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_occurrences
    ADD CONSTRAINT pm_annual_occurrences_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.pm_annual_activities(id) ON DELETE RESTRICT;


--
-- Name: pm_annual_occurrences pm_annual_occurrences_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_occurrences
    ADD CONSTRAINT pm_annual_occurrences_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: pm_annual_occurrences pm_annual_occurrences_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_occurrences
    ADD CONSTRAINT pm_annual_occurrences_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.pm_services(id) ON DELETE RESTRICT;


--
-- Name: pm_annual_plans pm_annual_plans_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_annual_plans
    ADD CONSTRAINT pm_annual_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: pm_checklist_versions pm_checklist_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_checklist_versions
    ADD CONSTRAINT pm_checklist_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: pm_checklist_versions pm_checklist_versions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_checklist_versions
    ADD CONSTRAINT pm_checklist_versions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.pm_plans(id) ON DELETE RESTRICT;


--
-- Name: pm_plan_members pm_plan_members_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_plan_members
    ADD CONSTRAINT pm_plan_members_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: pm_plan_members pm_plan_members_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_plan_members
    ADD CONSTRAINT pm_plan_members_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.pm_plans(id) ON DELETE CASCADE;


--
-- Name: pm_plans pm_plans_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_plans
    ADD CONSTRAINT pm_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: pm_plans pm_plans_machine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_plans
    ADD CONSTRAINT pm_plans_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES public.machines(id) ON DELETE RESTRICT;


--
-- Name: pm_plans pm_plans_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_plans
    ADD CONSTRAINT pm_plans_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: pm_service_checks pm_service_checks_checked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_service_checks
    ADD CONSTRAINT pm_service_checks_checked_by_fkey FOREIGN KEY (checked_by) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: pm_service_checks pm_service_checks_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_service_checks
    ADD CONSTRAINT pm_service_checks_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.pm_services(id) ON DELETE RESTRICT;


--
-- Name: pm_service_members pm_service_members_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_service_members
    ADD CONSTRAINT pm_service_members_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: pm_service_members pm_service_members_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_service_members
    ADD CONSTRAINT pm_service_members_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.pm_services(id) ON DELETE RESTRICT;


--
-- Name: pm_services pm_services_acknowledged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_services
    ADD CONSTRAINT pm_services_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: pm_services pm_services_checklist_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_services
    ADD CONSTRAINT pm_services_checklist_version_id_fkey FOREIGN KEY (checklist_version_id) REFERENCES public.pm_checklist_versions(id) ON DELETE RESTRICT;


--
-- Name: pm_services pm_services_machine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_services
    ADD CONSTRAINT pm_services_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES public.machines(id) ON DELETE RESTRICT;


--
-- Name: pm_services pm_services_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_services
    ADD CONSTRAINT pm_services_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.pm_plans(id) ON DELETE RESTRICT;


--
-- Name: pm_services pm_services_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_services
    ADD CONSTRAINT pm_services_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: pm_services pm_services_started_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_services
    ADD CONSTRAINT pm_services_started_by_fkey FOREIGN KEY (started_by) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: repair_records repair_records_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_records
    ADD CONSTRAINT repair_records_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.employees(id);


--
-- Name: repair_records repair_records_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_records
    ADD CONSTRAINT repair_records_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.employees(id);


--
-- Name: repair_records repair_records_repair_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_records
    ADD CONSTRAINT repair_records_repair_reviewed_by_fkey FOREIGN KEY (repair_reviewed_by) REFERENCES public.employees(id);


--
-- Name: repair_records repair_records_repaired_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_records
    ADD CONSTRAINT repair_records_repaired_by_fkey FOREIGN KEY (repaired_by) REFERENCES public.profiles(id);


--
-- Name: repair_records repair_records_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_records
    ADD CONSTRAINT repair_records_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: request_status_notes request_status_notes_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_status_notes
    ADD CONSTRAINT request_status_notes_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.employees(id);


--
-- Name: request_status_notes request_status_notes_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_status_notes
    ADD CONSTRAINT request_status_notes_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: request_team_members request_team_members_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_team_members
    ADD CONSTRAINT request_team_members_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.employees(id);


--
-- Name: request_team_members request_team_members_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_team_members
    ADD CONSTRAINT request_team_members_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: request_team_members request_team_members_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_team_members
    ADD CONSTRAINT request_team_members_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: request_work_records request_work_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_work_records
    ADD CONSTRAINT request_work_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: request_work_records request_work_records_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.request_work_records
    ADD CONSTRAINT request_work_records_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: spare_parts spare_parts_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spare_parts
    ADD CONSTRAINT spare_parts_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: task_work_records task_work_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_work_records
    ADD CONSTRAINT task_work_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: task_work_records task_work_records_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_work_records
    ADD CONSTRAINT task_work_records_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE;


--
-- Name: task_work_sessions task_work_sessions_work_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_work_sessions
    ADD CONSTRAINT task_work_sessions_work_record_id_fkey FOREIGN KEY (work_record_id) REFERENCES public.task_work_records(id) ON DELETE CASCADE;


--
-- Name: temporary_repair_followups temporary_repair_followups_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporary_repair_followups
    ADD CONSTRAINT temporary_repair_followups_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.employees(id);


--
-- Name: temporary_repair_followups temporary_repair_followups_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporary_repair_followups
    ADD CONSTRAINT temporary_repair_followups_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;


--
-- Name: temporary_repair_followups temporary_repair_followups_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporary_repair_followups
    ADD CONSTRAINT temporary_repair_followups_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.employees(id);


--
-- Name: temporary_repair_followups temporary_repair_followups_responsible_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporary_repair_followups
    ADD CONSTRAINT temporary_repair_followups_responsible_employee_id_fkey FOREIGN KEY (responsible_employee_id) REFERENCES public.employees(id);


--
-- Name: temporary_repair_followups temporary_repair_followups_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporary_repair_followups
    ADD CONSTRAINT temporary_repair_followups_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.maintenance_tasks(id);


--
-- Name: work_sessions work_sessions_work_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_sessions
    ADD CONSTRAINT work_sessions_work_record_id_fkey FOREIGN KEY (work_record_id) REFERENCES public.request_work_records(id) ON DELETE CASCADE;


--
-- Name: employees Active admins can read employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active admins can read employees" ON public.employees FOR SELECT TO authenticated USING (( SELECT public.is_active_admin() AS is_active_admin));


--
-- Name: employees Employees can read own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can read own profile" ON public.employees FOR SELECT TO authenticated USING ((id = ( SELECT auth.uid() AS uid)));


--
-- Name: departments Employees can view active departments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Employees can view active departments" ON public.departments FOR SELECT TO authenticated USING ((is_active = true));


--
-- Name: employee_language_preferences Read own language preference; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Read own language preference" ON public.employee_language_preferences FOR SELECT TO authenticated USING ((employee_id = ( SELECT auth.uid() AS uid)));


--
-- Name: action_notification_reads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.action_notification_reads ENABLE ROW LEVEL SECURITY;

--
-- Name: action_notification_reads action_notification_reads_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY action_notification_reads_own ON public.action_notification_reads FOR SELECT TO authenticated USING ((employee_id = ( SELECT auth.uid() AS uid)));


--
-- Name: approvals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

--
-- Name: approvals approvals_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY approvals_read ON public.approvals FOR SELECT TO authenticated USING (public.can_access_request(request_id));


--
-- Name: attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: attachments attachments_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY attachments_read ON public.attachments FOR SELECT TO authenticated USING (public.can_access_request(request_id));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs audit_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_read ON public.audit_logs FOR SELECT TO authenticated USING (public.is_manager());


--
-- Name: handover_checks checks_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY checks_insert ON public.handover_checks FOR INSERT TO authenticated WITH CHECK ((public.is_manager() AND public.can_access_request(request_id)));


--
-- Name: handover_checks checks_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY checks_read ON public.handover_checks FOR SELECT TO authenticated USING (public.can_access_request(request_id));


--
-- Name: handover_checks checks_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY checks_update ON public.handover_checks FOR UPDATE TO authenticated USING ((public.is_manager() AND public.can_access_request(request_id))) WITH CHECK ((public.is_manager() AND public.can_access_request(request_id)));


--
-- Name: departments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_language_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee_language_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: employees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

--
-- Name: handover_checks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.handover_checks ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_items inventory_items_staff_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY inventory_items_staff_read ON public.inventory_items FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND e.is_active AND (NOT e.must_change_password) AND (e.role = ANY (ARRAY['admin'::text, 'maintenance_supervisor'::text, 'maintenance_clerk'::text]))))));


--
-- Name: inventory_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_transactions inventory_transactions_staff_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY inventory_transactions_staff_read ON public.inventory_transactions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND e.is_active AND (NOT e.must_change_password) AND (e.role = ANY (ARRAY['admin'::text, 'maintenance_supervisor'::text, 'maintenance_clerk'::text]))))));


--
-- Name: machines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

--
-- Name: machines machines_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY machines_read ON public.machines FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND e.is_active AND (NOT e.must_change_password) AND (machines.is_active OR (e.role = ANY (ARRAY['admin'::text, 'maintenance_supervisor'::text])))))));


--
-- Name: maintenance_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_task_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.maintenance_task_members ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: parts_movements movements_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY movements_insert ON public.parts_movements FOR INSERT TO authenticated WITH CHECK (public.can_edit_repair(request_id));


--
-- Name: parts_movements movements_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY movements_read ON public.parts_movements FOR SELECT TO authenticated USING (public.can_access_request(request_id));


--
-- Name: mrf_parts_followups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mrf_parts_followups ENABLE ROW LEVEL SECURITY;

--
-- Name: mrf_parts_followups mrf_parts_followups_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY mrf_parts_followups_read ON public.mrf_parts_followups FOR SELECT TO authenticated USING (public.can_access_request(request_id));


--
-- Name: spare_parts parts_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY parts_insert ON public.spare_parts FOR INSERT TO authenticated WITH CHECK (public.can_edit_repair(request_id));


--
-- Name: parts_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.parts_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: spare_parts parts_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY parts_read ON public.spare_parts FOR SELECT TO authenticated USING (public.can_access_request(request_id));


--
-- Name: pm_annual_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pm_annual_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: pm_annual_activities pm_annual_activities_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pm_annual_activities_read ON public.pm_annual_activities FOR SELECT TO authenticated USING (( SELECT public.can_view_pm() AS can_view_pm));


--
-- Name: pm_annual_activity_changes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pm_annual_activity_changes ENABLE ROW LEVEL SECURITY;

--
-- Name: pm_annual_activity_changes pm_annual_activity_changes_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pm_annual_activity_changes_read ON public.pm_annual_activity_changes FOR SELECT TO authenticated USING (( SELECT public.can_view_pm() AS can_view_pm));


--
-- Name: pm_annual_occurrences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pm_annual_occurrences ENABLE ROW LEVEL SECURITY;

--
-- Name: pm_annual_occurrences pm_annual_occurrences_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pm_annual_occurrences_read ON public.pm_annual_occurrences FOR SELECT TO authenticated USING (( SELECT public.can_view_pm() AS can_view_pm));


--
-- Name: pm_annual_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pm_annual_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: pm_annual_plans pm_annual_plans_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pm_annual_plans_read ON public.pm_annual_plans FOR SELECT TO authenticated USING (( SELECT public.can_view_pm() AS can_view_pm));


--
-- Name: pm_checklist_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pm_checklist_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: pm_checklist_versions pm_checklist_versions_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pm_checklist_versions_read ON public.pm_checklist_versions FOR SELECT TO authenticated USING (( SELECT public.can_view_pm() AS can_view_pm));


--
-- Name: pm_plan_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pm_plan_members ENABLE ROW LEVEL SECURITY;

--
-- Name: pm_plan_members pm_plan_members_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pm_plan_members_read ON public.pm_plan_members FOR SELECT TO authenticated USING (( SELECT public.can_view_pm() AS can_view_pm));


--
-- Name: pm_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pm_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: pm_plans pm_plans_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pm_plans_read ON public.pm_plans FOR SELECT TO authenticated USING (( SELECT public.can_view_pm() AS can_view_pm));


--
-- Name: pm_service_checks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pm_service_checks ENABLE ROW LEVEL SECURITY;

--
-- Name: pm_service_checks pm_service_checks_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pm_service_checks_read ON public.pm_service_checks FOR SELECT TO authenticated USING (( SELECT public.can_view_pm() AS can_view_pm));


--
-- Name: pm_service_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pm_service_members ENABLE ROW LEVEL SECURITY;

--
-- Name: pm_service_members pm_service_members_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pm_service_members_read ON public.pm_service_members FOR SELECT TO authenticated USING (( SELECT public.can_view_pm() AS can_view_pm));


--
-- Name: pm_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pm_services ENABLE ROW LEVEL SECURITY;

--
-- Name: pm_services pm_services_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pm_services_read ON public.pm_services FOR SELECT TO authenticated USING (( SELECT public.can_view_pm() AS can_view_pm));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING (((id = ( SELECT auth.uid() AS uid)) OR public.is_manager()));


--
-- Name: repair_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.repair_records ENABLE ROW LEVEL SECURITY;

--
-- Name: repair_records repairs_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY repairs_insert ON public.repair_records FOR INSERT TO authenticated WITH CHECK (public.can_edit_repair(request_id));


--
-- Name: repair_records repairs_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY repairs_read ON public.repair_records FOR SELECT TO authenticated USING (public.can_access_request(request_id));


--
-- Name: repair_records repairs_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY repairs_update ON public.repair_records FOR UPDATE TO authenticated USING (public.can_edit_repair(request_id)) WITH CHECK (public.can_edit_repair(request_id));


--
-- Name: request_status_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.request_status_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: request_team_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.request_team_members ENABLE ROW LEVEL SECURITY;

--
-- Name: request_work_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.request_work_records ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_requests requests_create; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY requests_create ON public.maintenance_requests FOR INSERT TO authenticated WITH CHECK (((requestor_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND (e.is_active = true) AND (e.role = ANY (ARRAY['requestor'::text, 'department_hod'::text])))))));


--
-- Name: maintenance_requests requests_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY requests_read ON public.maintenance_requests FOR SELECT TO authenticated USING (public.can_access_request(id));


--
-- Name: spare_parts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: request_status_notes status_notes_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY status_notes_read ON public.request_status_notes FOR SELECT TO authenticated USING (public.can_access_request(request_id));


--
-- Name: maintenance_task_members task_members_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY task_members_read ON public.maintenance_task_members FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.maintenance_tasks t
  WHERE ((t.id = maintenance_task_members.task_id) AND public.can_access_request(t.request_id)))));


--
-- Name: task_work_sessions task_sessions_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY task_sessions_read ON public.task_work_sessions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.task_work_records w
     JOIN public.maintenance_tasks t ON ((t.id = w.task_id)))
  WHERE ((w.id = task_work_sessions.work_record_id) AND public.can_access_request(t.request_id)))));


--
-- Name: task_work_records task_work_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY task_work_read ON public.task_work_records FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.maintenance_tasks t
  WHERE ((t.id = task_work_records.task_id) AND public.can_access_request(t.request_id)))));


--
-- Name: task_work_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_work_records ENABLE ROW LEVEL SECURITY;

--
-- Name: task_work_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_work_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenance_tasks tasks_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tasks_read ON public.maintenance_tasks FOR SELECT TO authenticated USING (public.can_access_request(request_id));


--
-- Name: request_team_members team_members_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY team_members_read ON public.request_team_members FOR SELECT TO authenticated USING (public.can_access_request(request_id));


--
-- Name: temporary_repair_followups temporary_followups_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY temporary_followups_read ON public.temporary_repair_followups FOR SELECT TO authenticated USING (public.can_access_request(request_id));


--
-- Name: temporary_repair_followups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.temporary_repair_followups ENABLE ROW LEVEL SECURITY;

--
-- Name: request_work_records work_records_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY work_records_read ON public.request_work_records FOR SELECT TO authenticated USING (public.can_access_request(request_id));


--
-- Name: work_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: work_sessions work_sessions_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY work_sessions_read ON public.work_sessions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.request_work_records w
  WHERE ((w.id = work_sessions.work_record_id) AND public.can_access_request(w.request_id)))));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION acknowledge_pm_service(p_service uuid, p_notes text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.acknowledge_pm_service(p_service uuid, p_notes text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.acknowledge_pm_service(p_service uuid, p_notes text) TO service_role;
GRANT ALL ON FUNCTION public.acknowledge_pm_service(p_service uuid, p_notes text) TO authenticated;


--
-- Name: FUNCTION add_issued_part_miv(p_id uuid, p_miv text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.add_issued_part_miv(p_id uuid, p_miv text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.add_issued_part_miv(p_id uuid, p_miv text) TO authenticated;
GRANT ALL ON FUNCTION public.add_issued_part_miv(p_id uuid, p_miv text) TO service_role;


--
-- Name: FUNCTION add_maintenance_task(p_request uuid, p_title text, p_description text, p_members uuid[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.add_maintenance_task(p_request uuid, p_title text, p_description text, p_members uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.add_maintenance_task(p_request uuid, p_title text, p_description text, p_members uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.add_maintenance_task(p_request uuid, p_title text, p_description text, p_members uuid[]) TO service_role;


--
-- Name: FUNCTION add_parts_miv_batch(p_ids uuid[], p_miv text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.add_parts_miv_batch(p_ids uuid[], p_miv text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.add_parts_miv_batch(p_ids uuid[], p_miv text) TO authenticated;
GRANT ALL ON FUNCTION public.add_parts_miv_batch(p_ids uuid[], p_miv text) TO service_role;


--
-- Name: FUNCTION add_pm_annual_activity(p_annual_plan uuid, p_machine uuid, p_title text, p_instructions text, p_frequency_months integer, p_first_planned_date date); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.add_pm_annual_activity(p_annual_plan uuid, p_machine uuid, p_title text, p_instructions text, p_frequency_months integer, p_first_planned_date date) FROM PUBLIC;
GRANT ALL ON FUNCTION public.add_pm_annual_activity(p_annual_plan uuid, p_machine uuid, p_title text, p_instructions text, p_frequency_months integer, p_first_planned_date date) TO service_role;
GRANT ALL ON FUNCTION public.add_pm_annual_activity(p_annual_plan uuid, p_machine uuid, p_title text, p_instructions text, p_frequency_months integer, p_first_planned_date date) TO authenticated;


--
-- Name: FUNCTION advance_request(p_request uuid, p_next public.mrf_status); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.advance_request(p_request uuid, p_next public.mrf_status) FROM PUBLIC;
GRANT ALL ON FUNCTION public.advance_request(p_request uuid, p_next public.mrf_status) TO authenticated;
GRANT ALL ON FUNCTION public.advance_request(p_request uuid, p_next public.mrf_status) TO service_role;


--
-- Name: FUNCTION approve_completed_repair(p_request uuid, p_stage text, p_comments text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.approve_completed_repair(p_request uuid, p_stage text, p_comments text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.approve_completed_repair(p_request uuid, p_stage text, p_comments text) TO authenticated;
GRANT ALL ON FUNCTION public.approve_completed_repair(p_request uuid, p_stage text, p_comments text) TO service_role;


--
-- Name: FUNCTION assign_maintenance_request(p_request uuid, p_technician uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.assign_maintenance_request(p_request uuid, p_technician uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.assign_maintenance_request(p_request uuid, p_technician uuid) TO service_role;


--
-- Name: FUNCTION assign_maintenance_team(p_request uuid, p_members uuid[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.assign_maintenance_team(p_request uuid, p_members uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.assign_maintenance_team(p_request uuid, p_members uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.assign_maintenance_team(p_request uuid, p_members uuid[]) TO service_role;


--
-- Name: FUNCTION audit_request_row(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.audit_request_row() TO anon;
GRANT ALL ON FUNCTION public.audit_request_row() TO authenticated;
GRANT ALL ON FUNCTION public.audit_request_row() TO service_role;


--
-- Name: FUNCTION audit_row(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.audit_row() TO anon;
GRANT ALL ON FUNCTION public.audit_row() TO authenticated;
GRANT ALL ON FUNCTION public.audit_row() TO service_role;


--
-- Name: FUNCTION can_access_request(p_request uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.can_access_request(p_request uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.can_access_request(p_request uuid) TO authenticated;
GRANT ALL ON FUNCTION public.can_access_request(p_request uuid) TO service_role;


--
-- Name: FUNCTION can_edit_repair(p_request uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.can_edit_repair(p_request uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.can_edit_repair(p_request uuid) TO authenticated;
GRANT ALL ON FUNCTION public.can_edit_repair(p_request uuid) TO service_role;


--
-- Name: FUNCTION can_view_pm(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.can_view_pm() FROM PUBLIC;
GRANT ALL ON FUNCTION public.can_view_pm() TO service_role;
GRANT ALL ON FUNCTION public.can_view_pm() TO authenticated;


--
-- Name: FUNCTION complete_maintenance_task(p_task uuid, p_notes text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.complete_maintenance_task(p_task uuid, p_notes text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.complete_maintenance_task(p_task uuid, p_notes text) TO authenticated;
GRANT ALL ON FUNCTION public.complete_maintenance_task(p_task uuid, p_notes text) TO service_role;


--
-- Name: FUNCTION complete_mrf_repair(p_request uuid, p_summary text, p_downtime_ended_at timestamp with time zone); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.complete_mrf_repair(p_request uuid, p_summary text, p_downtime_ended_at timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION public.complete_mrf_repair(p_request uuid, p_summary text, p_downtime_ended_at timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.complete_mrf_repair(p_request uuid, p_summary text, p_downtime_ended_at timestamp with time zone) TO service_role;


--
-- Name: FUNCTION create_pm_annual_plan(p_year integer, p_title text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.create_pm_annual_plan(p_year integer, p_title text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.create_pm_annual_plan(p_year integer, p_title text) TO service_role;
GRANT ALL ON FUNCTION public.create_pm_annual_plan(p_year integer, p_title text) TO authenticated;


--
-- Name: FUNCTION finish_my_pm_service(p_service uuid, p_notes text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.finish_my_pm_service(p_service uuid, p_notes text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.finish_my_pm_service(p_service uuid, p_notes text) TO service_role;
GRANT ALL ON FUNCTION public.finish_my_pm_service(p_service uuid, p_notes text) TO authenticated;


--
-- Name: FUNCTION guard_mrf_handover_closure(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.guard_mrf_handover_closure() FROM PUBLIC;
GRANT ALL ON FUNCTION public.guard_mrf_handover_closure() TO service_role;


--
-- Name: FUNCTION guard_open_pm_schedule(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.guard_open_pm_schedule() FROM PUBLIC;
GRANT ALL ON FUNCTION public.guard_open_pm_schedule() TO service_role;


--
-- Name: FUNCTION guard_running_task_sessions(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.guard_running_task_sessions() FROM PUBLIC;
GRANT ALL ON FUNCTION public.guard_running_task_sessions() TO service_role;


--
-- Name: FUNCTION guard_unresolved_temporary_repair(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.guard_unresolved_temporary_repair() FROM PUBLIC;
GRANT ALL ON FUNCTION public.guard_unresolved_temporary_repair() TO service_role;


--
-- Name: FUNCTION is_active_admin(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_active_admin() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_active_admin() TO anon;
GRANT ALL ON FUNCTION public.is_active_admin() TO authenticated;
GRANT ALL ON FUNCTION public.is_active_admin() TO service_role;


--
-- Name: FUNCTION is_maintenance(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_maintenance() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_maintenance() TO authenticated;
GRANT ALL ON FUNCTION public.is_maintenance() TO service_role;


--
-- Name: FUNCTION is_manager(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_manager() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_manager() TO authenticated;
GRANT ALL ON FUNCTION public.is_manager() TO service_role;


--
-- Name: FUNCTION is_staff(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_staff() TO authenticated;
GRANT ALL ON FUNCTION public.is_staff() TO service_role;


--
-- Name: FUNCTION list_assignable_maintenance_staff(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.list_assignable_maintenance_staff() FROM PUBLIC;
GRANT ALL ON FUNCTION public.list_assignable_maintenance_staff() TO authenticated;
GRANT ALL ON FUNCTION public.list_assignable_maintenance_staff() TO service_role;


--
-- Name: FUNCTION list_assignable_technicians(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.list_assignable_technicians() FROM PUBLIC;
GRANT ALL ON FUNCTION public.list_assignable_technicians() TO authenticated;
GRANT ALL ON FUNCTION public.list_assignable_technicians() TO service_role;


--
-- Name: FUNCTION list_pm_team(p_plans uuid[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.list_pm_team(p_plans uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.list_pm_team(p_plans uuid[]) TO service_role;
GRANT ALL ON FUNCTION public.list_pm_team(p_plans uuid[]) TO authenticated;


--
-- Name: FUNCTION list_request_team(p_requests uuid[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.list_request_team(p_requests uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.list_request_team(p_requests uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.list_request_team(p_requests uuid[]) TO service_role;


--
-- Name: FUNCTION maintenance_parts_report(p_from date, p_to date); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.maintenance_parts_report(p_from date, p_to date) FROM PUBLIC;
GRANT ALL ON FUNCTION public.maintenance_parts_report(p_from date, p_to date) TO authenticated;
GRANT ALL ON FUNCTION public.maintenance_parts_report(p_from date, p_to date) TO service_role;


--
-- Name: FUNCTION maintenance_report(p_from date, p_to date); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.maintenance_report(p_from date, p_to date) FROM PUBLIC;
GRANT ALL ON FUNCTION public.maintenance_report(p_from date, p_to date) TO authenticated;
GRANT ALL ON FUNCTION public.maintenance_report(p_from date, p_to date) TO service_role;


--
-- Name: FUNCTION manage_pm_annual_activity(p_activity uuid, p_expected_revision integer, p_action text, p_reason text, p_machine uuid, p_title text, p_instructions text, p_frequency_months integer, p_first_planned_date date); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.manage_pm_annual_activity(p_activity uuid, p_expected_revision integer, p_action text, p_reason text, p_machine uuid, p_title text, p_instructions text, p_frequency_months integer, p_first_planned_date date) FROM PUBLIC;
GRANT ALL ON FUNCTION public.manage_pm_annual_activity(p_activity uuid, p_expected_revision integer, p_action text, p_reason text, p_machine uuid, p_title text, p_instructions text, p_frequency_months integer, p_first_planned_date date) TO service_role;
GRANT ALL ON FUNCTION public.manage_pm_annual_activity(p_activity uuid, p_expected_revision integer, p_action text, p_reason text, p_machine uuid, p_title text, p_instructions text, p_frequency_months integer, p_first_planned_date date) TO authenticated;


--
-- Name: FUNCTION mark_maintenance_action_read(p_key text, p_since timestamp with time zone); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.mark_maintenance_action_read(p_key text, p_since timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION public.mark_maintenance_action_read(p_key text, p_since timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.mark_maintenance_action_read(p_key text, p_since timestamp with time zone) TO service_role;


--
-- Name: TABLE maintenance_requests; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.maintenance_requests TO service_role;
GRANT SELECT,INSERT ON TABLE public.maintenance_requests TO authenticated;


--
-- Name: FUNCTION mrf_in_progress_since(p_row public.maintenance_requests); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.mrf_in_progress_since(p_row public.maintenance_requests) FROM PUBLIC;
GRANT ALL ON FUNCTION public.mrf_in_progress_since(p_row public.maintenance_requests) TO authenticated;
GRANT ALL ON FUNCTION public.mrf_in_progress_since(p_row public.maintenance_requests) TO service_role;


--
-- Name: FUNCTION mrf_last_activity(p_row public.maintenance_requests); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.mrf_last_activity(p_row public.maintenance_requests) FROM PUBLIC;
GRANT ALL ON FUNCTION public.mrf_last_activity(p_row public.maintenance_requests) TO authenticated;
GRANT ALL ON FUNCTION public.mrf_last_activity(p_row public.maintenance_requests) TO service_role;


--
-- Name: FUNCTION my_maintenance_actions(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.my_maintenance_actions() FROM PUBLIC;
GRANT ALL ON FUNCTION public.my_maintenance_actions() TO authenticated;
GRANT ALL ON FUNCTION public.my_maintenance_actions() TO service_role;


--
-- Name: FUNCTION on_auth_user_created(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.on_auth_user_created() TO anon;
GRANT ALL ON FUNCTION public.on_auth_user_created() TO authenticated;
GRANT ALL ON FUNCTION public.on_auth_user_created() TO service_role;


--
-- Name: FUNCTION pause_resume_my_work(p_request uuid, p_action text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.pause_resume_my_work(p_request uuid, p_action text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.pause_resume_my_work(p_request uuid, p_action text) TO authenticated;
GRANT ALL ON FUNCTION public.pause_resume_my_work(p_request uuid, p_action text) TO service_role;


--
-- Name: FUNCTION prepare_request(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.prepare_request() TO anon;
GRANT ALL ON FUNCTION public.prepare_request() TO authenticated;
GRANT ALL ON FUNCTION public.prepare_request() TO service_role;


--
-- Name: FUNCTION prepare_request_equipment(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.prepare_request_equipment() FROM PUBLIC;
GRANT ALL ON FUNCTION public.prepare_request_equipment() TO service_role;


--
-- Name: FUNCTION record_approval(p_request uuid, p_type text, p_decision text, p_comments text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.record_approval(p_request uuid, p_type text, p_decision text, p_comments text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.record_approval(p_request uuid, p_type text, p_decision text, p_comments text) TO authenticated;
GRANT ALL ON FUNCTION public.record_approval(p_request uuid, p_type text, p_decision text, p_comments text) TO service_role;


--
-- Name: FUNCTION record_temporary_repair(p_request uuid, p_details text, p_responsible uuid, p_target_date date, p_restored_at timestamp with time zone); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.record_temporary_repair(p_request uuid, p_details text, p_responsible uuid, p_target_date date, p_restored_at timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION public.record_temporary_repair(p_request uuid, p_details text, p_responsible uuid, p_target_date date, p_restored_at timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.record_temporary_repair(p_request uuid, p_details text, p_responsible uuid, p_target_date date, p_restored_at timestamp with time zone) TO service_role;


--
-- Name: FUNCTION request_mrf_part(p_request uuid, p_code text, p_name text, p_quantity numeric, p_reason text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.request_mrf_part(p_request uuid, p_code text, p_name text, p_quantity numeric, p_reason text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.request_mrf_part(p_request uuid, p_code text, p_name text, p_quantity numeric, p_reason text) TO authenticated;
GRANT ALL ON FUNCTION public.request_mrf_part(p_request uuid, p_code text, p_name text, p_quantity numeric, p_reason text) TO service_role;


--
-- Name: FUNCTION require_completed_repair_approvals(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.require_completed_repair_approvals() FROM PUBLIC;
GRANT ALL ON FUNCTION public.require_completed_repair_approvals() TO service_role;


--
-- Name: FUNCTION resolve_temporary_repair(p_followup uuid, p_notes text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.resolve_temporary_repair(p_followup uuid, p_notes text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.resolve_temporary_repair(p_followup uuid, p_notes text) TO authenticated;
GRANT ALL ON FUNCTION public.resolve_temporary_repair(p_followup uuid, p_notes text) TO service_role;


--
-- Name: FUNCTION review_pm_service(p_service uuid, p_notes text, p_follow_up text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.review_pm_service(p_service uuid, p_notes text, p_follow_up text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.review_pm_service(p_service uuid, p_notes text, p_follow_up text) TO service_role;
GRANT ALL ON FUNCTION public.review_pm_service(p_service uuid, p_notes text, p_follow_up text) TO authenticated;


--
-- Name: FUNCTION review_request_hod(p_request uuid, p_decision text, p_comments text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.review_request_hod(p_request uuid, p_decision text, p_comments text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.review_request_hod(p_request uuid, p_decision text, p_comments text) TO authenticated;
GRANT ALL ON FUNCTION public.review_request_hod(p_request uuid, p_decision text, p_comments text) TO service_role;


--
-- Name: FUNCTION save_machine(p_code text, p_name text, p_department uuid, p_location text, p_notes text, p_active boolean, p_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.save_machine(p_code text, p_name text, p_department uuid, p_location text, p_notes text, p_active boolean, p_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_machine(p_code text, p_name text, p_department uuid, p_location text, p_notes text, p_active boolean, p_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.save_machine(p_code text, p_name text, p_department uuid, p_location text, p_notes text, p_active boolean, p_id uuid) TO authenticated;


--
-- Name: FUNCTION save_mrf_handover_checks(p_request uuid, p_machine_ok boolean, p_bolts_tight boolean, p_workplace_clean boolean, p_no_temporary_modifications boolean, p_remarks text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.save_mrf_handover_checks(p_request uuid, p_machine_ok boolean, p_bolts_tight boolean, p_workplace_clean boolean, p_no_temporary_modifications boolean, p_remarks text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_mrf_handover_checks(p_request uuid, p_machine_ok boolean, p_bolts_tight boolean, p_workplace_clean boolean, p_no_temporary_modifications boolean, p_remarks text) TO authenticated;
GRANT ALL ON FUNCTION public.save_mrf_handover_checks(p_request uuid, p_machine_ok boolean, p_bolts_tight boolean, p_workplace_clean boolean, p_no_temporary_modifications boolean, p_remarks text) TO service_role;


--
-- Name: FUNCTION save_mrf_part_followup(p_id uuid, p_request uuid, p_code text, p_name text, p_quantity numeric, p_source text, p_status text, p_needed_at timestamp with time zone, p_ordered_at timestamp with time zone, p_available_at timestamp with time zone, p_issued_at timestamp with time zone, p_miv text, p_purchase_reference text, p_defect text, p_notes text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.save_mrf_part_followup(p_id uuid, p_request uuid, p_code text, p_name text, p_quantity numeric, p_source text, p_status text, p_needed_at timestamp with time zone, p_ordered_at timestamp with time zone, p_available_at timestamp with time zone, p_issued_at timestamp with time zone, p_miv text, p_purchase_reference text, p_defect text, p_notes text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_mrf_part_followup(p_id uuid, p_request uuid, p_code text, p_name text, p_quantity numeric, p_source text, p_status text, p_needed_at timestamp with time zone, p_ordered_at timestamp with time zone, p_available_at timestamp with time zone, p_issued_at timestamp with time zone, p_miv text, p_purchase_reference text, p_defect text, p_notes text) TO authenticated;
GRANT ALL ON FUNCTION public.save_mrf_part_followup(p_id uuid, p_request uuid, p_code text, p_name text, p_quantity numeric, p_source text, p_status text, p_needed_at timestamp with time zone, p_ordered_at timestamp with time zone, p_available_at timestamp with time zone, p_issued_at timestamp with time zone, p_miv text, p_purchase_reference text, p_defect text, p_notes text) TO service_role;


--
-- Name: FUNCTION save_my_work(p_request uuid, p_details text, p_finish boolean); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.save_my_work(p_request uuid, p_details text, p_finish boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_my_work(p_request uuid, p_details text, p_finish boolean) TO authenticated;
GRANT ALL ON FUNCTION public.save_my_work(p_request uuid, p_details text, p_finish boolean) TO service_role;


--
-- Name: FUNCTION save_pm_checklist(p_plan uuid, p_items text[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.save_pm_checklist(p_plan uuid, p_items text[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_pm_checklist(p_plan uuid, p_items text[]) TO service_role;
GRANT ALL ON FUNCTION public.save_pm_checklist(p_plan uuid, p_items text[]) TO authenticated;


--
-- Name: FUNCTION save_pm_plan(p_machine uuid, p_title text, p_instructions text, p_interval_days integer, p_next_due_date date, p_members uuid[], p_active boolean, p_id uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.save_pm_plan(p_machine uuid, p_title text, p_instructions text, p_interval_days integer, p_next_due_date date, p_members uuid[], p_active boolean, p_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_pm_plan(p_machine uuid, p_title text, p_instructions text, p_interval_days integer, p_next_due_date date, p_members uuid[], p_active boolean, p_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.save_pm_plan(p_machine uuid, p_title text, p_instructions text, p_interval_days integer, p_next_due_date date, p_members uuid[], p_active boolean, p_id uuid) TO authenticated;


--
-- Name: FUNCTION save_pm_service_check(p_service uuid, p_position integer, p_result text, p_notes text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.save_pm_service_check(p_service uuid, p_position integer, p_result text, p_notes text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.save_pm_service_check(p_service uuid, p_position integer, p_result text, p_notes text) TO service_role;
GRANT ALL ON FUNCTION public.save_pm_service_check(p_service uuid, p_position integer, p_result text, p_notes text) TO authenticated;


--
-- Name: FUNCTION set_employee_access(p_user uuid, p_role public.app_role, p_department text, p_active boolean); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.set_employee_access(p_user uuid, p_role public.app_role, p_department text, p_active boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_employee_access(p_user uuid, p_role public.app_role, p_department text, p_active boolean) TO authenticated;
GRANT ALL ON FUNCTION public.set_employee_access(p_user uuid, p_role public.app_role, p_department text, p_active boolean) TO service_role;


--
-- Name: FUNCTION set_employee_active_status(p_admin_id uuid, p_employee_id uuid, p_active boolean); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.set_employee_active_status(p_admin_id uuid, p_employee_id uuid, p_active boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_employee_active_status(p_admin_id uuid, p_employee_id uuid, p_active boolean) TO service_role;


--
-- Name: FUNCTION set_maintenance_job_status(p_request uuid, p_next text, p_reason text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.set_maintenance_job_status(p_request uuid, p_next text, p_reason text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_maintenance_job_status(p_request uuid, p_next text, p_reason text) TO authenticated;
GRANT ALL ON FUNCTION public.set_maintenance_job_status(p_request uuid, p_next text, p_reason text) TO service_role;


--
-- Name: FUNCTION set_mrf_priority(p_request uuid, p_priority integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.set_mrf_priority(p_request uuid, p_priority integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_mrf_priority(p_request uuid, p_priority integer) TO authenticated;
GRANT ALL ON FUNCTION public.set_mrf_priority(p_request uuid, p_priority integer) TO service_role;


--
-- Name: FUNCTION set_my_language(p_language text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.set_my_language(p_language text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_my_language(p_language text) TO authenticated;
GRANT ALL ON FUNCTION public.set_my_language(p_language text) TO service_role;


--
-- Name: FUNCTION sign_mrf_handover(p_request uuid, p_side text, p_comments text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sign_mrf_handover(p_request uuid, p_side text, p_comments text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.sign_mrf_handover(p_request uuid, p_side text, p_comments text) TO authenticated;
GRANT ALL ON FUNCTION public.sign_mrf_handover(p_request uuid, p_side text, p_comments text) TO service_role;


--
-- Name: FUNCTION start_assigned_work(p_request uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.start_assigned_work(p_request uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.start_assigned_work(p_request uuid) TO authenticated;
GRANT ALL ON FUNCTION public.start_assigned_work(p_request uuid) TO service_role;


--
-- Name: FUNCTION start_pm_service(p_plan uuid); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.start_pm_service(p_plan uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.start_pm_service(p_plan uuid) TO service_role;
GRANT ALL ON FUNCTION public.start_pm_service(p_plan uuid) TO authenticated;


--
-- Name: FUNCTION sync_work_sessions(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.sync_work_sessions() FROM PUBLIC;
GRANT ALL ON FUNCTION public.sync_work_sessions() TO service_role;


--
-- Name: FUNCTION update_my_task_work(p_task uuid, p_action text, p_details text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.update_my_task_work(p_task uuid, p_action text, p_details text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.update_my_task_work(p_task uuid, p_action text, p_details text) TO authenticated;
GRANT ALL ON FUNCTION public.update_my_task_work(p_task uuid, p_action text, p_details text) TO service_role;


--
-- Name: TABLE action_notification_reads; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.action_notification_reads TO service_role;
GRANT SELECT ON TABLE public.action_notification_reads TO authenticated;


--
-- Name: TABLE approvals; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.approvals TO service_role;
GRANT SELECT ON TABLE public.approvals TO authenticated;


--
-- Name: TABLE attachments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.attachments TO service_role;
GRANT SELECT ON TABLE public.attachments TO authenticated;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_logs TO service_role;
GRANT SELECT ON TABLE public.audit_logs TO authenticated;


--
-- Name: SEQUENCE audit_logs_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.audit_logs_id_seq TO anon;
GRANT ALL ON SEQUENCE public.audit_logs_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.audit_logs_id_seq TO service_role;


--
-- Name: TABLE departments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.departments TO anon;
GRANT ALL ON TABLE public.departments TO authenticated;
GRANT ALL ON TABLE public.departments TO service_role;


--
-- Name: TABLE employee_language_preferences; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.employee_language_preferences TO service_role;
GRANT SELECT ON TABLE public.employee_language_preferences TO authenticated;


--
-- Name: TABLE employees; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.employees TO anon;
GRANT ALL ON TABLE public.employees TO authenticated;
GRANT ALL ON TABLE public.employees TO service_role;


--
-- Name: TABLE handover_checks; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.handover_checks TO service_role;
GRANT SELECT ON TABLE public.handover_checks TO authenticated;


--
-- Name: TABLE inventory_items; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.inventory_items TO service_role;
GRANT SELECT ON TABLE public.inventory_items TO authenticated;


--
-- Name: TABLE inventory_transactions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.inventory_transactions TO service_role;
GRANT SELECT ON TABLE public.inventory_transactions TO authenticated;


--
-- Name: TABLE machines; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.machines TO service_role;
GRANT SELECT ON TABLE public.machines TO authenticated;


--
-- Name: TABLE maintenance_task_members; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.maintenance_task_members TO service_role;
GRANT SELECT ON TABLE public.maintenance_task_members TO authenticated;


--
-- Name: TABLE maintenance_tasks; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.maintenance_tasks TO service_role;
GRANT SELECT ON TABLE public.maintenance_tasks TO authenticated;


--
-- Name: TABLE mrf_parts_followups; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.mrf_parts_followups TO service_role;
GRANT SELECT ON TABLE public.mrf_parts_followups TO authenticated;


--
-- Name: TABLE parts_movements; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.parts_movements TO service_role;
GRANT SELECT,INSERT ON TABLE public.parts_movements TO authenticated;


--
-- Name: TABLE pm_annual_activities; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pm_annual_activities TO service_role;
GRANT SELECT ON TABLE public.pm_annual_activities TO authenticated;


--
-- Name: TABLE pm_annual_activity_changes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pm_annual_activity_changes TO service_role;
GRANT SELECT ON TABLE public.pm_annual_activity_changes TO authenticated;


--
-- Name: TABLE pm_annual_occurrences; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pm_annual_occurrences TO service_role;
GRANT SELECT ON TABLE public.pm_annual_occurrences TO authenticated;


--
-- Name: TABLE pm_annual_plans; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pm_annual_plans TO service_role;
GRANT SELECT ON TABLE public.pm_annual_plans TO authenticated;


--
-- Name: TABLE pm_checklist_versions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pm_checklist_versions TO service_role;
GRANT SELECT ON TABLE public.pm_checklist_versions TO authenticated;


--
-- Name: TABLE pm_plan_members; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pm_plan_members TO service_role;
GRANT SELECT ON TABLE public.pm_plan_members TO authenticated;


--
-- Name: TABLE pm_plans; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pm_plans TO service_role;
GRANT SELECT ON TABLE public.pm_plans TO authenticated;


--
-- Name: TABLE pm_service_checks; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pm_service_checks TO service_role;
GRANT SELECT ON TABLE public.pm_service_checks TO authenticated;


--
-- Name: TABLE pm_service_members; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pm_service_members TO service_role;
GRANT SELECT ON TABLE public.pm_service_members TO authenticated;


--
-- Name: TABLE pm_services; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pm_services TO service_role;
GRANT SELECT ON TABLE public.pm_services TO authenticated;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT ON TABLE public.profiles TO authenticated;


--
-- Name: TABLE repair_records; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.repair_records TO service_role;
GRANT SELECT,INSERT,UPDATE ON TABLE public.repair_records TO authenticated;


--
-- Name: TABLE request_status_notes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.request_status_notes TO service_role;
GRANT SELECT ON TABLE public.request_status_notes TO authenticated;


--
-- Name: TABLE request_team_members; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.request_team_members TO service_role;
GRANT SELECT ON TABLE public.request_team_members TO authenticated;


--
-- Name: TABLE request_work_records; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.request_work_records TO service_role;
GRANT SELECT ON TABLE public.request_work_records TO authenticated;


--
-- Name: TABLE spare_parts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.spare_parts TO service_role;
GRANT SELECT,INSERT ON TABLE public.spare_parts TO authenticated;


--
-- Name: TABLE task_work_records; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.task_work_records TO service_role;
GRANT SELECT ON TABLE public.task_work_records TO authenticated;


--
-- Name: TABLE task_work_sessions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.task_work_sessions TO service_role;
GRANT SELECT ON TABLE public.task_work_sessions TO authenticated;


--
-- Name: TABLE temporary_repair_followups; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.temporary_repair_followups TO service_role;
GRANT SELECT ON TABLE public.temporary_repair_followups TO authenticated;


--
-- Name: TABLE work_sessions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.work_sessions TO service_role;
GRANT SELECT ON TABLE public.work_sessions TO authenticated;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict DUbkl0Xu4gcsRbG4pirxBKjwrsbg9jd8kKjTawoEFQdvc90g0tnvrEOkn6m7vsh

