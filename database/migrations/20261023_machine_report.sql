BEGIN;

CREATE OR REPLACE FUNCTION public.maintenance_report(p_from date DEFAULT NULL::date, p_to date DEFAULT NULL::date) RETURNS jsonb
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
      machine_name,
      count(*) as total,
      count(*) filter (
        where status::text not in ('closed', 'rejected')
      ) as open,
      count(*) filter (where status::text = 'closed') as closed,
      count(*) filter (where status::text = 'rejected') as rejected,
      coalesce(sum(downtime_minutes), 0) as downtime_minutes,
      count(downtime_minutes) as downtime_records,
      count(*) filter (
        where downtime_applicable and downtime_minutes is null
      ) as downtime_unresolved,
      avg(repair_hours) as average_repair_hours,
      count(repair_hours) as repair_records
    from metrics
    group by machine_name
  ),
  status_totals as (
    select status::text as status, count(*) as count
    from selected
    group by status
  )
  select jsonb_build_object(
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

COMMIT;
