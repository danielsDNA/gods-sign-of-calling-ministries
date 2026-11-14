CREATE INDEX IF NOT EXISTS sermons_published_created_at_idx
  ON public.sermons (created_at DESC)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS sermons_created_at_idx
  ON public.sermons (created_at DESC);

CREATE INDEX IF NOT EXISTS events_published_starts_at_idx
  ON public.events (starts_at DESC)
  WHERE published = true;

CREATE INDEX IF NOT EXISTS events_starts_at_idx
  ON public.events (starts_at DESC);

CREATE INDEX IF NOT EXISTS ministries_sort_order_idx
  ON public.ministries (sort_order);

CREATE INDEX IF NOT EXISTS leadership_team_sort_order_idx
  ON public.leadership_team (sort_order);

CREATE INDEX IF NOT EXISTS gallery_images_active_sort_order_idx
  ON public.gallery_images (sort_order)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS service_times_sort_order_idx
  ON public.service_times (sort_order);

CREATE INDEX IF NOT EXISTS church_contacts_active_sort_order_idx
  ON public.church_contacts (sort_order)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS hero_phrases_active_sort_order_idx
  ON public.hero_phrases (sort_order)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS prayer_requests_created_at_idx
  ON public.prayer_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS contact_requests_created_at_idx
  ON public.contact_requests (created_at DESC);
