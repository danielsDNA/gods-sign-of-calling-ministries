import {
  bigserial,
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { DEFAULT_ADMIN_PERMISSIONS, type AdminPermission } from '../../lib/admin-permissions.js';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const adminUsers = pgTable('admin_users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }),
  role: varchar('role', { length: 50 }).notNull().default('editor'),
  permissions: jsonb('permissions').$type<AdminPermission[]>().notNull().default([...DEFAULT_ADMIN_PERMISSIONS]),
  sessionVersion: integer('session_version').notNull().default(0),
  resetToken: varchar('reset_token', { length: 128 }),
  resetTokenExpiry: timestamptz('reset_token_expiry'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

export const siteSettings = pgTable('site_settings', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

export const cmsPageContent = pgTable('cms_page_content', {
  pageKey: varchar('page_key', { length: 100 }).primaryKey(),
  content: jsonb('content').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

export const churchContacts = pgTable('church_contacts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  kind: varchar('kind', { length: 20 }).notNull(),
  label: varchar('label', { length: 100 }).notNull(),
  value: text('value').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  primary: boolean('is_primary').notNull().default(false),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

export const heroPhrases = pgTable('hero_phrases', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  phrase: varchar('phrase', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
});

export const serviceTimes = pgTable('service_times', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  day: varchar('day', { length: 50 }).notNull(),
  time: varchar('time', { length: 50 }).notNull(),
  label: varchar('label', { length: 100 }).notNull(),
  location: varchar('location', { length: 150 }),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
});

export const sermons = pgTable('sermons', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  speaker: varchar('speaker', { length: 150 }),
  series: varchar('series', { length: 150 }),
  scripture: varchar('scripture', { length: 150 }),
  description: text('description'),
  preachedOn: date('preached_on'),
  mediaType: varchar('media_type', { length: 20 }).notNull().default('youtube'),
  mediaUrl: text('media_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  featured: boolean('featured').notNull().default(false),
  published: boolean('published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

export const events = pgTable('events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull().default('Event'),
  description: text('description'),
  startsAt: timestamptz('starts_at').notNull(),
  endsAt: timestamptz('ends_at'),
  location: varchar('location', { length: 255 }),
  imageUrl: text('image_url'),
  featured: boolean('featured').notNull().default(false),
  published: boolean('published').notNull().default(true),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

export const prayerRequests = pgTable('prayer_requests', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 150 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  request: text('request').notNull(),
  isPrivate: boolean('is_private').notNull().default(true),
  status: varchar('status', { length: 50 }).notNull().default('new'),
  adminNote: text('admin_note'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

export const contactRequests = pgTable('contact_requests', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  topic: varchar('topic', { length: 150 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('new'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

export const ministries = pgTable('ministries', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  tagline: varchar('tagline', { length: 255 }),
  description: text('description'),
  imageUrl: text('image_url'),
  meetingTime: varchar('meeting_time', { length: 150 }),
  contactName: varchar('contact_name', { length: 150 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

export const leadershipTeam = pgTable('leadership_team', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  title: varchar('title', { length: 150 }),
  bio: text('bio'),
  imageUrl: text('image_url'),
  email: varchar('email', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

export const galleryImages = pgTable('gallery_images', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  imageUrl: text('image_url').notNull(),
  caption: varchar('caption', { length: 255 }),
  category: varchar('category', { length: 100 }).notNull().default('General'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
});

export const adminTrash = pgTable('admin_trash', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  recordType: varchar('record_type', { length: 80 }).notNull(),
  recordId: varchar('record_id', { length: 100 }).notNull(),
  recordData: jsonb('record_data').$type<unknown>().notNull(),
  deletedBy: integer('deleted_by'),
  deletedAt: timestamptz('deleted_at').notNull().defaultNow(),
});
