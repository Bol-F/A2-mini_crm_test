do $$
begin
    if not exists (
        select 1 from pg_roles where rolname = 'crm_backend'
    ) then
        create role crm_backend
            login
            nosuperuser
            nocreatedb
            nocreaterole
            noreplication;
    end if;
end
$$;

grant connect on database postgres to crm_backend;
grant usage on schema public to crm_backend;
grant select, insert, update on table public.leads to crm_backend;
grant select, insert on table public.lead_stage_history to crm_backend;
grant usage, select on sequence public.leads_id_seq to crm_backend;
grant usage, select on sequence public.lead_stage_history_id_seq
to crm_backend;

create policy "crm_backend_all_leads"
on public.leads
for all
to crm_backend
using (true)
with check (true);

create policy "crm_backend_all_history"
on public.lead_stage_history
for all
to crm_backend
using (true)
with check (true);
