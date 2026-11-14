create table public.cms_page_content (
  page_key varchar(100) primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.cms_page_content enable row level security;
grant select on public.cms_page_content to anon, authenticated;

create policy "Public can read page content" on public.cms_page_content
  for select to anon, authenticated using (true);
