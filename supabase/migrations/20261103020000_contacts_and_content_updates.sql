create table public.church_contacts (
  id bigserial primary key,
  kind varchar(20) not null check (kind in ('phone', 'email', 'address')),
  label varchar(100) not null,
  value text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.church_contacts enable row level security;
grant select on public.church_contacts to anon, authenticated;
create policy "Public can read active church contacts" on public.church_contacts
  for select using (active = true);

insert into public.church_contacts (kind, label, value, sort_order, active, is_primary)
select 'phone', 'Main phone', value, 0, true, true
from public.site_settings
where key = 'phone' and coalesce(value, '') <> '';

insert into public.church_contacts (kind, label, value, sort_order, active, is_primary)
select 'email', 'Main email', value, 0, true, true
from public.site_settings
where key = 'email' and coalesce(value, '') <> '';

insert into public.church_contacts (kind, label, value, sort_order, active, is_primary)
select 'address', 'Church location', value, 0, true, true
from public.site_settings
where key = 'address' and coalesce(value, '') <> '';

update public.cms_page_content
set content = jsonb_set(
  jsonb_set(
    content,
    '{stats,0,value}',
    '"2017"'::jsonb
  ),
  '{stats,0,label}',
  '"Serving since"'::jsonb
)
where page_key = 'about' and jsonb_typeof(content->'stats') = 'array';

update public.cms_page_content
set content = jsonb_set(content, '{stats,2,label}', '"Registered organization"'::jsonb)
where page_key = 'about' and jsonb_typeof(content->'stats') = 'array';

update public.cms_page_content
set content = jsonb_set(
  content,
  '{story,body,0,text}',
  to_jsonb(replace(content->'story'->'body'->0->>'text', 'Established in 2014', 'Serving since 2017'))
)
where page_key = 'about'
  and content->'story'->'body'->0->>'text' like '%Established in 2014%';

update public.cms_page_content
set content = jsonb_set(
  content,
  '{story,body,1,text}',
  to_jsonb(replace(content->'story'->'body'->1->>'text', 'Kaunga', 'Kayunga'))
)
where page_key = 'about'
  and content->'story'->'body'->1->>'text' like '%Kaunga%';

update public.cms_page_content
set content = jsonb_set(
  content,
  '{cta,body}',
  to_jsonb(replace(content->'cta'->>'body', 'Kaunga', 'Kayunga'))
)
where page_key = 'about'
  and content->'cta'->>'body' like '%Kaunga%';

update public.site_settings
set value = replace(value, 'Kaunga', 'Kayunga')
where key = 'about_body' and value like '%Kaunga%';
