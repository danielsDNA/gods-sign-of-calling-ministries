alter table public.admin_users
  add column if not exists permissions jsonb not null default '[
    "sermons",
    "events",
    "requests",
    "ministries",
    "leadership",
    "gallery",
    "about-page",
    "ministry-page",
    "site-info",
    "media",
    "phrases",
    "service-times",
    "contacts",
    "social"
  ]'::jsonb;
