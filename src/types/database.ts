// Supabase PostgreSQL row types matching supabase/migrations/20261030000000_church_cms.sql.
import type { AdminPermission } from '../lib/admin-permissions';

export interface AdminUserRow {
  id: number;
  email: string;
  password_hash: string;
  display_name: string | null;
  role: 'owner' | 'editor';
  permissions: AdminPermission[];
  reset_token: string | null;
  reset_token_expiry: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettingRow {
  id: number;
  key: string;
  value: string | null;
  updated_at: string;
}

export interface HeroPhraseRow {
  id: number;
  phrase: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface ServiceTimeRow {
  id: number;
  day: string;
  time: string;
  label: string;
  location: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface SermonRow {
  id: number;
  title: string;
  speaker: string | null;
  series: string | null;
  scripture: string | null;
  description: string | null;
  preached_on: string | null;
  media_type: string;
  media_url: string;
  thumbnail_url: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: number;
  title: string;
  category: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  image_url: string | null;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrayerRequestRow {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  request: string;
  is_private: boolean;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface MinistryRow {
  id: number;
  name: string;
  tagline: string | null;
  description: string | null;
  image_url: string | null;
  meeting_time: string | null;
  contact_name: string | null;
  contact_email: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadershipRow {
  id: number;
  name: string;
  title: string | null;
  bio: string | null;
  image_url: string | null;
  email: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GalleryImageRow {
  id: number;
  image_url: string;
  caption: string | null;
  category: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

type Table<Row> = {
  Row: Row;
  Insert: Partial<Omit<Row, 'id'>>;
  Update: Partial<Omit<Row, 'id'>>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      admin_users: Table<AdminUserRow>;
      site_settings: Table<SiteSettingRow>;
      hero_phrases: Table<HeroPhraseRow>;
      service_times: Table<ServiceTimeRow>;
      sermons: Table<SermonRow>;
      events: Table<EventRow>;
      prayer_requests: Table<PrayerRequestRow>;
      ministries: Table<MinistryRow>;
      leadership_team: Table<LeadershipRow>;
      gallery_images: Table<GalleryImageRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
