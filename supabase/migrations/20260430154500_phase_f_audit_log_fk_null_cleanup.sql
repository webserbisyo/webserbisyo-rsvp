create or replace function app_private.prevent_audit_log_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'audit_logs is append-only';
  end if;

  if tg_op = 'UPDATE'
    and new.entity_type is not distinct from old.entity_type
    and new.entity_id is not distinct from old.entity_id
    and new.action is not distinct from old.action
    and new.metadata is not distinct from old.metadata
    and new.ip_address is not distinct from old.ip_address
    and new.user_agent is not distinct from old.user_agent
    and new.created_at is not distinct from old.created_at
    and (
      new.actor_user_id is not distinct from old.actor_user_id
      or (old.actor_user_id is not null and new.actor_user_id is null)
    )
    and (
      new.client_id is not distinct from old.client_id
      or (old.client_id is not null and new.client_id is null)
    )
    and (
      new.event_id is not distinct from old.event_id
      or (old.event_id is not null and new.event_id is null)
    ) then
    return new;
  end if;

  raise exception 'audit_logs is append-only';
end;
$$;
