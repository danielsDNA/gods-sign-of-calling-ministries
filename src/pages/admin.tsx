/*
 * ============================================================
 * CHURCH ADMIN CMS PANEL
 * ============================================================
 * Route: /admin  (standalone — no shared header/footer)
 *
 * Sections:
 *   Dashboard  — overview stats
 *   Sermons    — CRUD with rich description
 *   Events     — CRUD with rich description
 *   Requests   — review contact messages and prayer requests
 *   Ministries — CRUD
 *   Leadership — CRUD
 *   Site Info  — church identity, logo, map, and image settings
 *   Giving     — fundraising purpose, payment methods, and campaign image
 *   Hero       — welcome text, headline, subheading, photo, CTAs
 *   Phrases    — rotating typewriter phrases
 *   Service Times — CRUD
 *   Social     — Facebook, Instagram, YouTube, Twitter
 *   Password   — change admin password
 * ============================================================
 */

import { useState, useEffect, useCallback, useRef, useId, type FormEvent } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import {
  LogOut, Save, Plus, Trash2, Eye, EyeOff,
  Church, Settings, Link2, Lock, Type, Image,
  CheckCircle, AlertCircle, Loader2, Users, BookOpen,
  Calendar, Heart, Clock, MapPin, Phone, ChevronDown, ChevronUp,
  LayoutDashboard, Edit3, X, Star, Upload, ImagePlus, HandCoins,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SocialPlatformIcon } from '@/components/SocialMediaLinks';
import { SOCIAL_PLATFORMS } from '@/lib/social-media';
import { ADMIN_EDITOR_PERMISSIONS, DEFAULT_ADMIN_PERMISSIONS, type AdminPermission } from '@/lib/admin-permissions';
import { isVideoMediaUrl, isVideoPlatformUrl, parseHttpsMediaUrl } from '@/lib/media-urls';
import { uploadChurchMedia } from '@/lib/supabase';
import PageContentEditor from '@/components/admin/PageContentEditor';
import { sanitizeRichTextHtml } from '@/lib/content-text';

/* ── Types ── */
interface SiteSettings { [key: string]: string }
interface Toast { id: number; type: 'success' | 'error'; message: string }
interface Sermon { id: number; title: string; speaker: string; series: string; scripture: string; description: string; preachedOn: string; mediaType: string; mediaUrl: string; thumbnailUrl: string; featured: boolean; published: boolean }
interface ChurchEvent { id: number; title: string; category: string; description: string; startsAt: string; endsAt: string; location: string; imageUrl: string; featured: boolean; published: boolean }
interface PrayerRequest { id: number; name: string; email: string; phone: string; request: string; isPrivate: boolean; status: string; adminNote: string; createdAt: string }
interface ContactRequest { id: number; name: string; email: string; phone: string | null; topic: string; message: string; status: 'new' | 'read' | 'replied'; createdAt: string }
interface Ministry { id: number; name: string; tagline: string; description: string; imageUrl: string; meetingTime: string; contactName: string; contactEmail: string; sortOrder: number; active: boolean }
interface Leader { id: number; name: string; title: string; bio: string; imageUrl: string; email: string; sortOrder: number; active: boolean }
interface ServiceTime { id?: number; day: string; time: string; label: string; location: string; sortOrder: number; active: boolean }
interface Phrase { id: number; phrase: string; sortOrder: number; active: boolean }
interface GalleryImage { id: number; imageUrl: string; caption: string; category: string; sortOrder: number; active: boolean }
interface ChurchContact { id?: number; kind: 'phone' | 'email' | 'address' | 'website' | 'whatsapp' | 'other'; label: string; value: string; sortOrder: number; active: boolean; primary: boolean }
interface AdminAccount { id: number; email: string; displayName: string | null; role: string; permissions: AdminPermission[]; createdAt: string | null }
interface TrashItem { id: number; recordType: string; recordId: string; summary: string; deletedAt: string }
interface AdminBootstrapResponse {
  user: { email: string; displayName?: string | null; role: string; permissions: AdminPermission[] };
  settings: SiteSettings;
  phrases: string[];
  sermons: Sermon[];
  events: ChurchEvent[];
  prayers: PrayerRequest[];
  contactRequests: ContactRequest[];
  ministries: Ministry[];
  leaders: Leader[];
  serviceTimes: ServiceTime[];
  gallery: GalleryImage[];
  adminAccounts: AdminAccount[];
}

function selectedGalleryIds(value: string | undefined, images: GalleryImage[]): number[] {
  if (value === undefined) return images.filter(image => image.active).slice(0, 3).map(image => image.id);
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is number => Number.isSafeInteger(id) && id > 0)
      : [];
  } catch (error) {
    console.error('The saved homepage gallery selection is invalid:', error);
    return [];
  }
}

function isContactRequestStatus(value: string): value is ContactRequest['status'] {
  return value === 'new' || value === 'read' || value === 'replied';
}

function isSafeMediaSource(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') || parseHttpsMediaUrl(value) !== null;
}

/* ── Toast ── */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);
  return (
    <div className={`admin-toast admin-toast--${toast.type}`}>
      {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span>{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="admin-toast__close"><X size={14} /></button>
    </div>
  );
}

/* ── Rich text editor (simple contenteditable) ── */
function RichEditor({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const lastVal = useRef('');
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (ref.current && value !== lastVal.current) {
      const safeValue = sanitizeRichTextHtml(value);
      ref.current.innerHTML = safeValue;
      lastVal.current = safeValue;
    }
  }, [value]);

  useEffect(() => {
    const updateActiveFormats = () => {
      const selection = window.getSelection();
      if (!ref.current || !selection?.anchorNode || !ref.current.contains(selection.anchorNode)) return;
      const block = document.queryCommandValue('formatBlock').toLowerCase().replace(/[<>]/g, '');
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        paragraph: block === 'p',
        h2: block === 'h2',
        h3: block === 'h3',
      });
    };
    document.addEventListener('selectionchange', updateActiveFormats);
    return () => document.removeEventListener('selectionchange', updateActiveFormats);
  }, []);

  const syncEditorValue = () => {
    if (!ref.current) return;
    const safeValue = sanitizeRichTextHtml(ref.current.innerHTML);
    onChange(safeValue);
    lastVal.current = safeValue;
  };

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    syncEditorValue();
  };

  const toolbarButton = (command: string, label: string, content: string, value?: string, formatKey = command) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={activeFormats[formatKey] === true}
      className={activeFormats[formatKey] ? 'admin-rich-toolbar__button is-active' : 'admin-rich-toolbar__button'}
      onMouseDown={event => { event.preventDefault(); execCmd(command, value); }}
      title={label}
    >
      {content}
    </button>
  );

  return (
    <div className="admin-rich-editor">
      <div className="admin-rich-toolbar" role="toolbar" aria-label={`${label} formatting`} dir="ltr">
        {toolbarButton('bold', 'Bold', 'B')}
        {toolbarButton('italic', 'Italic', 'I')}
        {toolbarButton('underline', 'Underline', 'U')}
        <span className="admin-rich-sep" />
        {toolbarButton('formatBlock', 'Heading 2', 'H2', 'h2', 'h2')}
        {toolbarButton('formatBlock', 'Heading 3', 'H3', 'h3', 'h3')}
        {toolbarButton('formatBlock', 'Paragraph', 'P', 'p', 'paragraph')}
        <span className="admin-rich-sep" />
        {toolbarButton('insertUnorderedList', 'Bulleted list', '• List')}
        {toolbarButton('insertOrderedList', 'Numbered list', '1. List')}
        <span className="admin-rich-sep" />
        <button type="button" aria-label="Clear formatting" onMouseDown={event => { event.preventDefault(); execCmd('removeFormat'); }} title="Clear formatting">Clear</button>
      </div>
      <div
        ref={ref}
        className="admin-rich-content"
        contentEditable
        dir="ltr"
        style={{ direction: 'ltr', textAlign: 'left', writingMode: 'horizontal-tb', unicodeBidi: 'isolate' }}
        role="textbox"
        aria-label={label}
        aria-multiline="true"
        suppressContentEditableWarning
        data-placeholder={placeholder || 'Write here…'}
        onInput={syncEditorValue}
        onPaste={event => {
          event.preventDefault();
          const pastedHtml = event.clipboardData.getData('text/html');
          const pastedText = event.clipboardData.getData('text/plain');
          const safeHtml = pastedHtml
            ? sanitizeRichTextHtml(pastedHtml)
            : pastedText.replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character] || character).replace(/\r?\n/g, '<br>');
          document.execCommand('insertHTML', false, safeHtml);
          syncEditorValue();
        }}
      />
    </div>
  );
}

/* ── Confirm dialog ── */
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="admin-overlay">
      <div className="admin-confirm">
        <p>{message}</p>
        <div className="admin-confirm__actions">
          <button className="admin-btn admin-btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="admin-btn admin-btn--danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── API helpers ── */
const ADMIN_REQUEST_TIMEOUT_MS = 25_000;

async function api<T = Record<string, unknown>>(method: string, path: string, body?: unknown): Promise<T> {
  const controller = new window.AbortController();
  const timeout = window.setTimeout(() => controller.abort(), ADMIN_REQUEST_TIMEOUT_MS);
  try {
    const res = await window.fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data as T;
  } catch (error: unknown) {
    if (controller.signal.aborted) throw new Error('The server took too long to respond. Please retry.');
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

/* ── Main component ── */
export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [authCheckError, setAuthCheckError] = useState('');
  const [authCheckAttempt, setAuthCheckAttempt] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardLoadAttempt, setDashboardLoadAttempt] = useState(0);
  const [tab, setTab] = useState('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [saving, setSaving] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState('editor');
  const [adminPermissions, setAdminPermissions] = useState<AdminPermission[]>([]);

  // Auth state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetDone, setResetDone] = useState(false);

  // Content state
  const [settings, setSettings] = useState<SiteSettings>({});
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [contactReplyDrafts, setContactReplyDrafts] = useState<Record<number, string>>({});
  const [replyingToContactRequest, setReplyingToContactRequest] = useState<number | null>(null);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [serviceTimes, setServiceTimes] = useState<ServiceTime[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [churchContacts, setChurchContacts] = useState<ChurchContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState('');
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [contactsLoadAttempt, setContactsLoadAttempt] = useState(0);
  const [editGallery, setEditGallery] = useState<Partial<GalleryImage> | null>(null);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashError, setTrashError] = useState('');
  const [trashLoadAttempt, setTrashLoadAttempt] = useState(0);
  const [restoringTrashId, setRestoringTrashId] = useState<number | null>(null);
  const [permissionDrafts, setPermissionDrafts] = useState<Record<number, AdminPermission[]>>({});
  const [savingPermissionsFor, setSavingPermissionsFor] = useState<number | null>(null);
  const [newAdmin, setNewAdmin] = useState({ email: '', displayName: '', password: '' });

  // Edit state
  const [editSermon, setEditSermon] = useState<Partial<Sermon> | null>(null);
  const [editEvent, setEditEvent] = useState<Partial<ChurchEvent> | null>(null);
  const [editMinistry, setEditMinistry] = useState<Partial<Ministry> | null>(null);
  const [editLeader, setEditLeader] = useState<Partial<Leader> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: number } | null>(null);

  // Password change
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);

  const toast = useCallback((type: 'success' | 'error', message: string) => {
    setToasts(prev => [...prev, { id: Date.now(), type, message }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const applyAdminBootstrap = useCallback((data: AdminBootstrapResponse) => {
    setAdminRole(data.user.role || 'editor');
    setAdminPermissions(data.user.permissions || []);
    setSettings(data.settings || {});
    setPhrases((data.phrases || []).map((phrase, index) => ({
      id: index + 1,
      phrase,
      sortOrder: index,
      active: true,
    })));
    setSermons(data.sermons || []);
    setEvents(data.events || []);
    setPrayers(data.prayers || []);
    setContactRequests(data.contactRequests || []);
    setMinistries(data.ministries || []);
    setLeaders(data.leaders || []);
    setServiceTimes(data.serviceTimes || []);
    setGallery(data.gallery || []);
    setAdminAccounts(data.adminAccounts || []);
  }, []);

  // A slow or unreachable API should not leave the admin page on a spinner forever.
  useEffect(() => {
    const controller = new window.AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), ADMIN_REQUEST_TIMEOUT_MS);

    const checkSession = async () => {
      try {
        const response = await window.fetch('/api/admin/me', { signal: controller.signal });
        const data = await response.json().catch(() => ({})) as {
          email?: string;
          role?: string;
          permissions?: AdminPermission[];
          error?: string;
        };
        if (!active) return;
        if (response.status === 401) {
          setAuthed(false);
          return;
        }
        if (!response.ok) throw new Error(data.error || 'Unable to verify the admin session.');
        if (!data.email) throw new Error('The server returned an invalid admin session.');
        setAdminEmail(data.email);
        setAdminRole(data.role || 'editor');
        setAdminPermissions(data.permissions || []);
        setAuthed(true);
      } catch (error: unknown) {
        if (!active) return;
        setAuthCheckError(
          controller.signal.aborted
            ? 'The server took too long to respond. Check your connection and try again.'
            : error instanceof Error ? error.message : 'Unable to verify the admin session.'
        );
      } finally {
        window.clearTimeout(timeout);
      }
    };

    void checkSession();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [authCheckAttempt]);

  useEffect(() => {
    if (!authed) return;

    const controller = new window.AbortController();
    let active = true;
    setDashboardLoading(true);
    setDashboardError('');
    const timeout = window.setTimeout(() => controller.abort(), ADMIN_REQUEST_TIMEOUT_MS);

    const loadDashboard = async () => {
      try {
        const response = await window.fetch('/api/admin/bootstrap', { signal: controller.signal });
        const data = await response.json().catch(() => ({})) as Partial<AdminBootstrapResponse> & { error?: string };
        if (!active) return;
        if (response.status === 401) {
          setAuthed(false);
          return;
        }
        if (!response.ok) throw new Error(data.error || 'Unable to load dashboard content.');
        if (!data.user) throw new Error('The server returned invalid dashboard content.');
        applyAdminBootstrap(data as AdminBootstrapResponse);
      } catch (error: unknown) {
        if (!active) return;
        const message = controller.signal.aborted
          ? 'The dashboard took too long to respond. Retry or sign in again.'
          : error instanceof Error ? error.message : 'Unable to load dashboard content.';
        setDashboardError(message);
        toast('error', message);
      } finally {
        window.clearTimeout(timeout);
        if (active) setDashboardLoading(false);
      }
    };

    void loadDashboard();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [authed, applyAdminBootstrap, toast, dashboardLoadAttempt]);

  useEffect(() => {
    if (!authed || adminRole === 'owner') return;
    let active = true;
    const refreshPermissions = async () => {
      try {
        const response = await window.fetch('/api/admin/me', { cache: 'no-store' });
        if (response.status === 401) {
          if (active) setAuthed(false);
          return;
        }
        if (!response.ok) throw new Error(`Permission refresh failed (${response.status})`);
        const data = await response.json() as { permissions?: AdminPermission[] };
        if (active && Array.isArray(data.permissions)) setAdminPermissions(data.permissions);
      } catch (error) {
        if (active) console.error('Unable to refresh admin permissions:', error);
      }
    };
    const interval = window.setInterval(() => void refreshPermissions(), 15_000);
    window.addEventListener('focus', refreshPermissions);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshPermissions);
    };
  }, [adminRole, authed]);

  useEffect(() => {
    if (adminRole === 'owner') return;
    const tabPermission = ADMIN_EDITOR_PERMISSIONS.find(permission => permission.key === tab)?.key;
    if (tabPermission && !adminPermissions.includes(tabPermission)) setTab('dashboard');
  }, [adminPermissions, adminRole, tab]);

  useEffect(() => {
    if (!authed || tab !== 'contacts' || contactsLoaded) return;
    const controller = new window.AbortController();
    let active = true;
    setContactsLoading(true);
    const timeout = window.setTimeout(() => controller.abort(), ADMIN_REQUEST_TIMEOUT_MS);
    window.fetch('/api/admin/church-contacts', { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        const data: unknown = await response.json();
        if (!response.ok) {
          const message = typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
            ? data.error
            : 'Unable to load church contacts.';
          throw new Error(message);
        }
        if (!Array.isArray(data)) throw new Error('The server returned invalid church contacts.');
        if (active) {
          setChurchContacts(data as ChurchContact[]);
          setContactsLoaded(true);
        }
      })
      .catch((error: unknown) => {
        if (active) setContactsError(controller.signal.aborted
          ? 'The server took too long to load church contacts. Retry.'
          : error instanceof Error ? error.message : 'Unable to load church contacts.');
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setContactsLoading(false);
      });
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [authed, contactsLoaded, contactsLoadAttempt, tab]);

  useEffect(() => {
    if (!authed || adminRole !== 'owner' || tab !== 'trash') return;
    let active = true;
    setTrashLoading(true);
    setTrashError('');
    api<TrashItem[]>('GET', '/api/admin/trash')
      .then(items => {
        if (active) setTrashItems(items);
      })
      .catch((error: unknown) => {
        if (active) setTrashError(error instanceof Error ? error.message : 'Unable to load Trash.');
      })
      .finally(() => {
        if (active) setTrashLoading(false);
      });
    return () => { active = false; };
  }, [adminRole, authed, tab, trashLoadAttempt]);

  /* ── Login ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true); setLoginError('');
    try {
      const d = await api<{ user: AdminBootstrapResponse['user'] }>('POST', '/api/admin/login', { email: loginEmail, password: loginPassword });
      setAuthed(true);
      setAdminEmail(d.user.email || loginEmail);
      setAdminRole(d.user.role || 'editor');
      setAdminPermissions(d.user.permissions || []);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally { setLoginLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    try {
      await api('POST', '/api/admin/forgot-password', { email: forgotEmail });
      setForgotSent(true);
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : 'Unable to send the reset code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPassword !== resetConfirm) { toast('error', 'Passwords do not match'); return; }
    if (resetPassword.length < 8) { toast('error', 'Password must be at least 8 characters'); return; }
    try {
      await api('POST', '/api/admin/reset-password', { code: resetCode, password: resetPassword });
      setLoginEmail(forgotEmail);
      setResetDone(true);
    } catch (err: unknown) { toast('error', err instanceof Error ? err.message : 'Reset failed'); }
  };

  const handleLogout = async () => {
    await api('POST', '/api/admin/logout', {}).catch(() => {});
    setAuthed(false);
  };

  /* ── Settings save ── */

  const saveSettings = async (updates: SiteSettings) => {
    setSaving(true);
    try {
      const changedUpdates = Object.fromEntries(Object.entries(updates).filter(([key, value]) => settings[key] !== value));
      const editorKeys = new Set([
        'church_name', 'tagline', 'map_address', 'map_embed_url',
        'logo_url', 'about_image_url',
      ]);
      const giveDetailKeys = new Set([
        'give_mtn_number', 'give_mtn_name', 'give_airtel_number', 'give_airtel_name',
        'give_bank_name', 'give_bank_account_name', 'give_bank_account_number', 'give_bank_branch',
        'give_campaign_title', 'give_reason', 'give_image_url',
      ]);
      const socialKeys = new Set(['facebook_url', 'instagram_url', 'youtube_url', 'twitter_url', 'stay_connected_enabled']);
      const allowedUpdates = adminRole === 'owner'
        ? changedUpdates
        : Object.fromEntries(Object.entries(changedUpdates).filter(([key]) =>
          (adminPermissions.includes('site-info') && editorKeys.has(key))
          || (adminPermissions.includes('site-info') && settings.give_editor_details_enabled === 'true' && giveDetailKeys.has(key))
          || (adminPermissions.includes('gallery') && key === 'home_animated_gallery_ids')
          || (adminPermissions.includes('hero') && key.startsWith('hero_'))
          || (adminPermissions.includes('media') && ['hero_bg_url', 'about_bg_url'].includes(key))
          || (adminPermissions.includes('social') && socialKeys.has(key))
        ));
      if (Object.keys(allowedUpdates).length === 0) {
        toast('success', 'No settings changes to save');
        return;
      }
      await api('PUT', '/api/admin/settings', allowedUpdates);
      setSettings(prev => ({ ...prev, ...allowedUpdates }));
      toast('success', 'Settings saved');
    } catch (error: unknown) { toast('error', error instanceof Error ? error.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  const saveChurchContacts = async () => {
    setSaving(true);
    try {
      await api('PUT', '/api/admin/church-contacts', churchContacts);
      setContactsLoaded(true);
      setContactsError('');
      toast('success', 'Church contacts saved');
    } catch (error: unknown) {
      toast('error', error instanceof Error ? error.message : 'Unable to save church contacts');
    } finally {
      setSaving(false);
    }
  };

  /* ── Phrases ── */
  const savePhrases = async () => {
    setSaving(true);
    try {
      await api('PUT', '/api/admin/phrases', { phrases: phrases.filter(p => p.active).map(p => p.phrase) });
      toast('success', 'Phrases saved');
    } catch (error: unknown) { toast('error', error instanceof Error ? error.message : 'Unable to save phrases'); }
    finally { setSaving(false); }
  };

  /* ── Sermons ── */
  const saveSermon = async () => {
    if (!editSermon?.title || !editSermon?.mediaUrl) { toast('error', 'Title and media URL are required'); return; }
    if (!parseHttpsMediaUrl(editSermon.mediaUrl)) { toast('error', 'Use a valid HTTPS media link from a trusted source.'); return; }
    if (editSermon.thumbnailUrl && !isSafeMediaSource(editSermon.thumbnailUrl)) { toast('error', 'Use a valid HTTPS thumbnail URL or a local church image.'); return; }
    setSaving(true);
    try {
      if (editSermon.id) {
        await api('PUT', `/api/admin/sermons/${editSermon.id}`, editSermon);
        setSermons(prev => prev.map(s => s.id === editSermon.id ? { ...s, ...editSermon } as Sermon : s));
      } else {
        const d = await api('POST', '/api/admin/sermons', editSermon);
        setSermons(prev => [{ ...editSermon, id: d.id, featured: !!editSermon.featured, published: editSermon.published !== false } as Sermon, ...prev]);
      }
      toast('success', 'Sermon saved'); setEditSermon(null);
    } catch (err: unknown) { toast('error', err instanceof Error ? err.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  /* ── Events ── */
  const saveEvent = async () => {
    if (!editEvent?.title || !editEvent?.startsAt) { toast('error', 'Title and start date are required'); return; }
    if (editEvent.imageUrl && !isSafeMediaSource(editEvent.imageUrl)) { toast('error', 'Use a valid HTTPS image URL or a local church image.'); return; }
    setSaving(true);
    try {
      if (editEvent.id) {
        await api('PUT', `/api/admin/events/${editEvent.id}`, editEvent);
        setEvents(prev => prev.map(e => e.id === editEvent.id ? { ...e, ...editEvent } as ChurchEvent : e));
      } else {
        const d = await api('POST', '/api/admin/events', editEvent);
        setEvents(prev => [{ ...editEvent, id: d.id, featured: !!editEvent.featured, published: editEvent.published !== false } as ChurchEvent, ...prev]);
      }
      toast('success', 'Event saved'); setEditEvent(null);
    } catch (err: unknown) { toast('error', err instanceof Error ? err.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  /* ── Ministries ── */
  const saveMinistry = async () => {
    if (!editMinistry?.name) { toast('error', 'Name is required'); return; }
    if (editMinistry.imageUrl && !isSafeMediaSource(editMinistry.imageUrl)) { toast('error', 'Use a valid HTTPS image URL or a local church image.'); return; }
    setSaving(true);
    try {
      if (editMinistry.id) {
        await api('PUT', `/api/admin/ministries/${editMinistry.id}`, editMinistry);
        setMinistries(prev => prev.map(m => m.id === editMinistry.id ? { ...m, ...editMinistry } as Ministry : m));
      } else {
        const d = await api('POST', '/api/admin/ministries', editMinistry);
        setMinistries(prev => [...prev, { ...editMinistry, id: d.id, active: editMinistry.active !== false } as Ministry]);
      }
      toast('success', 'Ministry saved'); setEditMinistry(null);
    } catch (err: unknown) { toast('error', err instanceof Error ? err.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  /* ── Leadership ── */
  const saveLeader = async () => {
    if (!editLeader?.name) { toast('error', 'Name is required'); return; }
    if (editLeader.imageUrl && !isSafeMediaSource(editLeader.imageUrl)) { toast('error', 'Use a valid HTTPS image URL or a local church image.'); return; }
    setSaving(true);
    try {
      if (editLeader.id) {
        await api('PUT', `/api/admin/leadership/${editLeader.id}`, editLeader);
        setLeaders(prev => prev.map(l => l.id === editLeader.id ? { ...l, ...editLeader } as Leader : l));
      } else {
        const d = await api('POST', '/api/admin/leadership', editLeader);
        setLeaders(prev => [...prev, { ...editLeader, id: d.id, active: editLeader.active !== false } as Leader]);
      }
      toast('success', 'Leader saved'); setEditLeader(null);
    } catch (err: unknown) { toast('error', err instanceof Error ? err.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  /* ── Delete ── */
  const doDelete = async () => {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await api('DELETE', `/api/admin/${type}/${id}`);
      if (type === 'sermons') setSermons(prev => prev.filter(s => s.id !== id));
      if (type === 'events') setEvents(prev => prev.filter(e => e.id !== id));
      if (type === 'ministries') setMinistries(prev => prev.filter(m => m.id !== id));
      if (type === 'leadership') setLeaders(prev => prev.filter(l => l.id !== id));
      if (type === 'gallery') setGallery(prev => prev.filter(g => g.id !== id));
      toast('success', 'Deleted');
    } catch (error: unknown) { toast('error', error instanceof Error ? error.message : 'Unable to delete item'); }
  };

  /* ── Password change ── */
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwNew !== pwConfirm) { toast('error', 'Passwords do not match'); return; }
    if (pwNew.length < 8) { toast('error', 'Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await api('PUT', '/api/admin/password', { currentPassword: pwCurrent, newPassword: pwNew });
      toast('success', 'Password changed'); setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (err: unknown) { toast('error', err instanceof Error ? err.message : 'Failed'); }
    finally { setSaving(false); }
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await api<{ id: number }>('POST', '/api/admin/users', newAdmin);
      setAdminAccounts(prev => [...prev, {
        id: result.id,
        email: newAdmin.email.trim().toLowerCase(),
        displayName: newAdmin.displayName.trim() || null,
        role: 'editor',
        permissions: [...DEFAULT_ADMIN_PERMISSIONS],
        createdAt: new Date().toISOString(),
      }]);
      setNewAdmin({ email: '', displayName: '', password: '' });
      toast('success', 'Admin account created');
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Unable to create admin account');
    } finally {
      setSaving(false);
    }
  };

  const togglePermissionDraft = (accountId: number, permission: AdminPermission, checked: boolean) => {
    const account = adminAccounts.find(item => item.id === accountId);
    const currentPermissions = permissionDrafts[accountId] ?? account?.permissions ?? [];
    const nextPermissions = checked
      ? [...new Set([...currentPermissions, permission])]
      : currentPermissions.filter(item => item !== permission);
    setPermissionDrafts(previous => ({ ...previous, [accountId]: nextPermissions }));
  };

  const saveAdminPermissions = async (accountId: number) => {
    const account = adminAccounts.find(item => item.id === accountId);
    if (!account) return;
    const permissions = permissionDrafts[accountId] ?? account.permissions;
    setSavingPermissionsFor(accountId);
    try {
      await api('PUT', `/api/admin/users/${accountId}`, { permissions });
      setAdminAccounts(previous => previous.map(item => item.id === accountId ? { ...item, permissions } : item));
      setPermissionDrafts(previous => {
        const next = { ...previous };
        delete next[accountId];
        return next;
      });
      toast('success', `Privileges updated for ${account.displayName || account.email}`);
    } catch (error: unknown) {
      toast('error', error instanceof Error ? error.message : 'Unable to update editor privileges');
    } finally {
      setSavingPermissionsFor(null);
    }
  };

  /* ── Service times ── */
  const saveServiceTimes = async () => {
    setSaving(true);
    try {
      await api('PUT', '/api/admin/service-times', serviceTimes);
      toast('success', 'Service times saved');
    } catch (error: unknown) { toast('error', error instanceof Error ? error.message : 'Unable to save service times'); }
    finally { setSaving(false); }
  };

  /* ── Prayer status ── */
  const updatePrayerStatus = async (id: number, status: string, adminNote: string) => {
    try {
      await api('PUT', `/api/admin/prayer/${id}`, { status, adminNote });
      setPrayers(prev => prev.map(p => p.id === id ? { ...p, status, adminNote } : p));
      toast('success', 'Updated');
    } catch (error: unknown) { toast('error', error instanceof Error ? error.message : 'Unable to update request'); }
  };

  const updateContactRequestStatus = async (id: number, status: ContactRequest['status']) => {
    try {
      await api('PUT', `/api/admin/contact-requests/${id}`, { status });
      setContactRequests(prev => prev.map(request => request.id === id ? { ...request, status } : request));
      toast('success', 'Contact request updated');
    } catch (error: unknown) {
      toast('error', error instanceof Error ? error.message : 'Unable to update contact request');
    }
  };

  const sendContactRequestReply = async (request: ContactRequest) => {
    const reply = (contactReplyDrafts[request.id] || '').trim();
    if (!reply) {
      toast('error', 'Write a reply before sending.');
      return;
    }

    setReplyingToContactRequest(request.id);
    try {
      await api('PUT', `/api/admin/contact-requests/${request.id}`, { reply });
      setContactRequests(previous => previous.map(item =>
        item.id === request.id ? { ...item, status: 'replied' } : item
      ));
      setContactReplyDrafts(previous => ({ ...previous, [request.id]: '' }));
      toast('success', `Reply sent to ${request.email}`);
    } catch (error: unknown) {
      toast('error', error instanceof Error ? error.message : 'Unable to send reply');
    } finally {
      setReplyingToContactRequest(null);
    }
  };

  const restoreTrashItem = async (item: TrashItem) => {
    setRestoringTrashId(item.id);
    try {
      await api('POST', `/api/admin/trash/${item.id}/restore`, {});
      setTrashItems(previous => previous.filter(entry => entry.id !== item.id));
      setDashboardLoadAttempt(attempt => attempt + 1);
      toast('success', `${item.summary} restored`);
    } catch (error: unknown) {
      toast('error', error instanceof Error ? error.message : 'Unable to restore this item');
    } finally {
      setRestoringTrashId(null);
    }
  };

  /* ── Gallery CRUD ── */
  const saveGalleryItem = async () => {
    if (!editGallery?.imageUrl) { toast('error', 'Image URL required'); return; }
    if (!isSafeMediaSource(editGallery.imageUrl)) { toast('error', 'Use a valid HTTPS image URL or a local church image.'); return; }
    if (isVideoPlatformUrl(editGallery.imageUrl) || isVideoMediaUrl(editGallery.imageUrl)) {
      toast('error', 'The gallery accepts images only. Add videos and platform links under Sermons or Media Upload.');
      return;
    }
    setSaving(true);
    try {
      if (editGallery.id) {
        await api('PUT', `/api/admin/gallery/${editGallery.id}`, editGallery);
        setGallery(prev => prev.map(g => g.id === editGallery.id ? { ...g, ...editGallery } as GalleryImage : g));
        toast('success', 'Image updated');
      } else {
        const res = await api('POST', '/api/admin/gallery', editGallery);
        setGallery(prev => [...prev, { ...editGallery, id: res.id, active: editGallery.active !== false } as GalleryImage]);
        toast('success', 'Image added');
      }
      setEditGallery(null);
    } catch (error: unknown) { toast('error', error instanceof Error ? error.message : 'Unable to save gallery image'); }
    finally { setSaving(false); }
  };

  /* ── Loading ── */
  if (authed === null) {
    if (authCheckError) {
      return (
        <div className="admin-login-wrap">
          <div className="admin-card admin-login-card" role="alert">
            <div className="admin-login-header">
              <div className="admin-logo-box"><Church size={26} color="white" /></div>
              <h1>Admin connection unavailable</h1>
              <p>{authCheckError}</p>
            </div>
            <button
              className="admin-btn admin-btn--primary admin-btn--full"
              onClick={() => {
                setAuthCheckError('');
                setAuthCheckAttempt(attempt => attempt + 1);
              }}
            >
              Try again
            </button>
            <button
              className="admin-btn admin-btn--ghost admin-btn--full"
              onClick={() => {
                setAuthCheckError('');
                setAuthed(false);
              }}
            >
              Go to sign in
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="admin-loading">
        <Loader2 size={32} className="admin-spin" />
      </div>
    );
  }

  /* ── Forgot password screen ── */
  if (!authed && showForgot) {
    return (
      <>
        <Helmet>
          <title>Reset Password — {settings.church_name || 'Church'} Admin</title>
          <meta name="description" content={`${settings.church_name || 'Church'} admin password reset.`} />
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
        <div className="admin-login-wrap">
          <div className="admin-card admin-login-card">
            <div className="admin-login-header">
              <div className="admin-logo-box"><Church size={26} color="white" /></div>
              <h1>Reset Password</h1>
              <p>{settings.church_name || 'Church'} Admin</p>
            </div>
            {!forgotSent ? (
              <form onSubmit={handleForgot} className="admin-form">
                <p className="admin-form__hint">Enter your admin email address and we'll send a reset code.</p>
                {forgotError && <div className="admin-error-banner"><AlertCircle size={16} />{forgotError}</div>}
                <div className="admin-field">
                  <label htmlFor="forgot-email">Email address</label>
                  <input id="forgot-email" name="email" type="email" autoComplete="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="admin@example.org" required />
                </div>
                <button type="submit" className="admin-btn admin-btn--primary admin-btn--full" disabled={forgotLoading}>
                  {forgotLoading ? <><Loader2 size={16} className="admin-spin" /> Sending code…</> : 'Send reset code'}
                </button>
                <button type="button" className="admin-btn admin-btn--ghost admin-btn--full" onClick={() => { setShowForgot(false); setForgotError(''); }}>Back to login</button>
              </form>
            ) : showReset ? (
              <form onSubmit={handleReset} className="admin-form">
                {resetDone ? (
                  <>
                    <p className="admin-form__hint" style={{ color: 'hsl(var(--primary))' }}>✓ Password changed successfully. You can now log in.</p>
                    <button type="button" className="admin-btn admin-btn--primary admin-btn--full" onClick={() => { setShowForgot(false); setForgotSent(false); setShowReset(false); setResetDone(false); }}>Go to login</button>
                  </>
                ) : (
                  <>
                    <p className="admin-form__hint">Enter the code sent to your email and choose a new password.</p>
                    <div className="admin-field">
                      <label htmlFor="reset-code">Email reset code</label>
                      <input id="reset-code" name="resetCode" aria-label="Email reset code" value={resetCode} onChange={e => setResetCode(e.target.value)} placeholder="Paste the code from your email" autoComplete="one-time-code" required />
                    </div>
                    <div className="admin-field">
                      <label htmlFor="reset-password">New password</label>
                      <input id="reset-password" name="newPassword" type="password" autoComplete="new-password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="Min 8 characters" required />
                    </div>
                    <div className="admin-field">
                      <label htmlFor="reset-confirm">Confirm password</label>
                      <input id="reset-confirm" name="confirmPassword" type="password" autoComplete="new-password" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} placeholder="Repeat password" required />
                    </div>
                    <button type="submit" className="admin-btn admin-btn--primary admin-btn--full">Set new password</button>
                  </>
                )}
              </form>
            ) : (
              <div className="admin-form">
                <p className="admin-form__hint">If that email exists, a reset code has been sent. Check your inbox.</p>
                <button type="button" className="admin-btn admin-btn--primary admin-btn--full" onClick={() => { setShowReset(true); }}>Enter reset code</button>
                <button type="button" className="admin-btn admin-btn--ghost admin-btn--full" onClick={() => { setShowForgot(false); setForgotSent(false); }}>Back to login</button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  /* ── Login screen ── */
  if (!authed) {
    return (
      <>
        <Helmet>
          <title>Admin Login — {settings.church_name || 'Church'}</title>
          <meta name="description" content={`${settings.church_name || 'Church'} admin login. Restricted access.`} />
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
        <div className="admin-login-wrap">
          <div className="admin-card admin-login-card">
            <div className="admin-login-header">
              <div className="admin-logo-box"><Church size={26} color="white" /></div>
              <h1>Admin Portal</h1>
              <p>{settings.church_name || 'Church'} Content Management</p>
            </div>
            <form onSubmit={handleLogin} className="admin-form">
              {loginError && <div className="admin-error-banner"><AlertCircle size={16} />{loginError}</div>}
              <div className="admin-field">
                <label htmlFor="login-email">Email address</label>
                <input id="login-email" name="email" type="email" autoComplete="username" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="admin@example.org" required autoFocus />
              </div>
              <div className="admin-field">
                <label htmlFor="login-password">Password</label>
                <div className="admin-input-wrap">
                  <input id="login-password" name="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Your password" required />
                  <button type="button" className="admin-input-eye" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw(p => !p)}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>
              <button type="submit" className="admin-btn admin-btn--primary admin-btn--full" disabled={loginLoading}>
                {loginLoading ? <><Loader2 size={16} className="admin-spin" /> Signing in…</> : 'Sign in'}
              </button>
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--full" onClick={() => { setShowForgot(true); setForgotEmail(loginEmail); }}>Forgot password?</button>
            </form>
          </div>
        </div>
      </>
    );
  }

  /* ── Dashboard ── */
  const animatedGalleryIds = selectedGalleryIds(settings.home_animated_gallery_ids, gallery);
  const eventCategories = Array.from(new Set(events.map(event => event.category.trim()).filter(Boolean)));
  const tabs: Array<{ id: string; label: string; icon: LucideIcon; permission?: AdminPermission; ownerOnly?: boolean; giving?: boolean }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sermons', label: 'Sermons', icon: BookOpen, permission: 'sermons' },
    { id: 'events', label: 'Events', icon: Calendar, permission: 'events' },
    { id: 'prayer', label: 'Requests', icon: Heart, permission: 'requests' },
    { id: 'ministries', label: 'Ministries', icon: Users, permission: 'ministries' },
    { id: 'leadership', label: 'Leadership', icon: Star, permission: 'leadership' },
    { id: 'gallery', label: 'Gallery', icon: ImagePlus, permission: 'gallery' },
    { id: 'about-page', label: 'About Page', icon: Church, permission: 'about-page' },
    { id: 'ministry-page', label: 'Ministry Page', icon: Users, permission: 'ministry-page' },
    { id: 'site-info', label: 'Site Info', icon: Settings, permission: 'site-info' },
    { id: 'giving', label: 'Giving & Fundraising', icon: HandCoins, permission: 'site-info', giving: true },
    { id: 'hero', label: 'Hero', icon: Image, permission: 'hero' },
    { id: 'media', label: 'Media Upload', icon: Upload, permission: 'media' },
    { id: 'phrases', label: 'Phrases', icon: Type, permission: 'phrases' },
    { id: 'service-times', label: 'Service Times', icon: Clock, permission: 'service-times' },
    { id: 'contacts', label: 'Church Contacts', icon: Phone, permission: 'contacts' },
    { id: 'social', label: 'Social Links', icon: Link2, permission: 'social' },
    { id: 'admins', label: 'Editor Accounts', icon: ShieldCheck, ownerOnly: true },
    { id: 'trash', label: 'Trash', icon: Trash2, ownerOnly: true },
    { id: 'password', label: 'Password', icon: Lock },
  ];
  const visibleTabs = tabs.filter(item => item.ownerOnly
    ? adminRole === 'owner'
    : item.giving
      ? adminRole === 'owner' || (settings.give_editor_details_enabled === 'true' && adminPermissions.includes('site-info'))
      : adminRole === 'owner' || !item.permission || adminPermissions.includes(item.permission));

  return (
    <>
      <Helmet>
        <title>Admin Dashboard — {settings.church_name || 'Church'}</title>
        <meta name="description" content={`${settings.church_name || 'Church'} admin dashboard. Restricted access.`} />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Toast container */}
      <div className="admin-toasts">
        {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />)}
      </div>

      {/* Confirm dialog */}
      {confirmDelete && <ConfirmDialog message="Are you sure you want to delete this item? This cannot be undone." onConfirm={doDelete} onCancel={() => setConfirmDelete(null)} />}

      <div className="admin-shell">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar__brand">
            <div className="admin-logo-box admin-logo-box--sm"><Church size={18} color="white" /></div>
            <div>
              <div className="admin-sidebar__name">{settings.church_name || 'Church'}</div>
              <div className="admin-sidebar__role">{adminRole === 'owner' ? 'Super Admin' : 'Editor'}</div>
            </div>
          </div>
          <nav className="admin-sidebar__nav">
            {visibleTabs.map(t => (
              <button key={t.id} className={`admin-nav-item ${tab === t.id ? 'admin-nav-item--active' : ''}`} onClick={() => setTab(t.id)}>
                <t.icon size={16} />
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="admin-sidebar__footer">
            <div className="admin-sidebar__email">{adminEmail}</div>
            <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={handleLogout}><LogOut size={14} /> Sign out</button>
          </div>
        </aside>

        {/* Main content */}
        <main className="admin-main">
          {dashboardLoading && (
            <div className="admin-dashboard-skeleton" role="status">
              <span className="sr-only">Loading dashboard content…</span>
              <div className="admin-skeleton admin-skeleton--title" />
              <div className="admin-skeleton-grid">
                {Array.from({ length: 6 }, (_, index) => <div className="admin-skeleton admin-skeleton--stat" key={index} />)}
              </div>
              <div className="admin-skeleton admin-skeleton--panel" />
            </div>
          )}
          {dashboardError && (
            <div className="admin-error-banner" role="alert">
              <AlertCircle size={16} />
              <span>{dashboardError}</span>
              <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setDashboardLoadAttempt(attempt => attempt + 1)}>Retry dashboard</button>
              <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setAuthed(false)}>Sign in again</button>
            </div>
          )}
          {/* ── Dashboard ── */}
          {tab === 'dashboard' && !dashboardLoading && !dashboardError && (
            <div className="admin-section">
              <h2 className="admin-section__title">Dashboard</h2>
              <div className="admin-stats-grid">
                {[
                  { id: 'sermons', label: 'Sermons', value: sermons.length, icon: BookOpen, sub: `${sermons.filter(s => s.published).length} published` },
                  { id: 'events', label: 'Events', value: events.length, icon: Calendar, sub: `${events.filter(e => e.published).length} published` },
                  { id: 'prayer', label: 'Requests', value: prayers.length + contactRequests.length, icon: Heart, sub: `${prayers.filter(p => p.status === 'new').length + contactRequests.filter(request => request.status === 'new').length} new` },
                  { id: 'ministries', label: 'Ministries', value: ministries.length, icon: Users, sub: `${ministries.filter(m => m.active).length} active` },
                  { id: 'leadership', label: 'Leaders', value: leaders.length, icon: Star, sub: `${leaders.filter(l => l.active).length} active` },
                  { id: 'service-times', label: 'Service Times', value: serviceTimes.length, icon: Clock, sub: 'scheduled' },
                  { id: 'gallery', label: 'Gallery', value: gallery.length, icon: ImagePlus, sub: `${gallery.filter(g => g.active).length} visible` },
                ].map(stat => (
                  <div key={stat.label} className="admin-stat-card" onClick={() => setTab(stat.id)}>
                    <div className="admin-stat-card__icon"><stat.icon size={20} /></div>
                    <div className="admin-stat-card__body">
                      <div className="admin-stat-card__value">{stat.value}</div>
                      <div className="admin-stat-card__label">{stat.label}</div>
                      <div className="admin-stat-card__sub">{stat.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="admin-card admin-welcome-card">
                <h3>Welcome to the {settings.church_name || 'Church'} CMS</h3>
                <p>Use the sidebar to manage all your site content. Changes are saved immediately to the database and appear live on the website.</p>
                <ul>
                  <li><strong>Sermons</strong> — add YouTube links, audio, or video files</li>
                  <li><strong>Events</strong> — create and manage upcoming events</li>
                  <li><strong>Prayer</strong> — view and respond to prayer requests</li>
                  <li><strong>Site Info</strong> — update church name, contact, about text</li>
                  <li><strong>Hero</strong> — edit the homepage hero section</li>
                </ul>
              </div>
            </div>
          )}

          {tab === 'trash' && adminRole === 'owner' && (
            <div className="admin-section">
              <div className="admin-section__header">
                <h2 className="admin-section__title">Trash</h2>
                <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setTrashLoadAttempt(attempt => attempt + 1)} disabled={trashLoading}>
                  Refresh
                </button>
              </div>
              <p className="admin-form__hint">Deleted records are kept here until restored. Only Super Admins can view or restore them.</p>
              {trashError && <div className="admin-error-banner" role="alert">{trashError}</div>}
              {trashLoading ? (
                <div className="admin-loading-banner" role="status"><Loader2 size={16} className="admin-spin" /> Loading Trash…</div>
              ) : (
                <div className="admin-list">
                  {trashItems.map(item => (
                    <div className="admin-list-item" key={item.id}>
                      <div className="admin-list-item__body">
                        <div className="admin-list-item__title">{item.summary}</div>
                        <div className="admin-list-item__meta">
                          {item.recordType.replace(/_/g, ' ')} · deleted {new Date(item.deletedAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        className="admin-btn admin-btn--primary admin-btn--sm"
                        disabled={restoringTrashId !== null}
                        onClick={() => void restoreTrashItem(item)}
                      >
                        {restoringTrashId === item.id ? <><Loader2 size={14} className="admin-spin" /> Restoring…</> : 'Restore'}
                      </button>
                    </div>
                  ))}
                  {!trashItems.length && <p className="admin-empty">Trash is empty.</p>}
                </div>
              )}
            </div>
          )}

          {/* ── Sermons ── */}
          {tab === 'sermons' && (
            <div className="admin-section">
              <div className="admin-section__header">
                <h2 className="admin-section__title">Sermons</h2>
                <button className="admin-btn admin-btn--primary" onClick={() => setEditSermon({ mediaType: 'youtube', published: true, featured: false })}><Plus size={16} /> Add sermon</button>
              </div>
              {editSermon && (
                <div className="admin-card admin-form-card">
                  <h3>{editSermon.id ? 'Edit Sermon' : 'New Sermon'}</h3>
                  <div className="admin-form-grid">
                    <div className="admin-field">
                      <label>Title *</label>
                      <input name="sermonTitle" aria-label="Sermon title" value={editSermon.title || ''} onChange={e => setEditSermon(p => ({ ...p, title: e.target.value }))} placeholder="Sermon title" />
                    </div>
                    <div className="admin-field">
                      <label>Speaker</label>
                      <input name="sermonSpeaker" aria-label="Speaker" value={editSermon.speaker || ''} onChange={e => setEditSermon(p => ({ ...p, speaker: e.target.value }))} placeholder="Pastor name" />
                    </div>
                    <div className="admin-field">
                      <label>Series</label>
                      <input name="sermonSeries" aria-label="Series" value={editSermon.series || ''} onChange={e => setEditSermon(p => ({ ...p, series: e.target.value }))} placeholder="Series name" />
                    </div>
                    <div className="admin-field">
                      <label>Scripture</label>
                      <input name="sermonScripture" aria-label="Scripture" value={editSermon.scripture || ''} onChange={e => setEditSermon(p => ({ ...p, scripture: e.target.value }))} placeholder="e.g. John 3:16" />
                    </div>
                    <div className="admin-field">
                      <label>Date preached</label>
                      <input name="sermonDate" aria-label="Date preached" type="date" value={editSermon.preachedOn || ''} onChange={e => setEditSermon(p => ({ ...p, preachedOn: e.target.value }))} />
                    </div>
                    <div className="admin-field">
                      <label>Media type</label>
                      <select name="sermonMediaType" aria-label="Media type" value={editSermon.mediaType || 'youtube'} onChange={e => setEditSermon(p => ({ ...p, mediaType: e.target.value }))}>
                        <option value="youtube">YouTube</option>
                        <option value="tiktok">TikTok</option>
                        <option value="vimeo">Vimeo</option>
                        <option value="video">Video file</option>
                        <option value="audio">Audio file</option>
                        <option value="link">External link</option>
                      </select>
                    </div>
                    <div className="admin-field admin-field--full">
                      <ImageUploadField
                        value={editSermon.mediaUrl || ''}
                        onChange={url => setEditSermon(p => ({ ...p, mediaUrl: url }))}
                        onToast={toast}
                        label="Media URL or local file *"
                        allowVideo
                        allowAudio
                        allowImage={false}
                      />
                      <p className="admin-form__hint">YouTube, TikTok, and Vimeo links are embedded. Local video and audio files are stored in church media; other HTTPS links open at their source. Gallery entries remain images only.</p>
                    </div>
                    <div className="admin-field admin-field--full">
                      <ImageUploadField
                        value={editSermon.thumbnailUrl || ''}
                        onChange={url => setEditSermon(p => ({ ...p, thumbnailUrl: url }))}
                        onToast={toast}
                        label="Thumbnail URL or image upload"
                      />
                    </div>
                    <div className="admin-field admin-field--full">
                      <label>Description</label>
                      <RichEditor value={editSermon.description || ''} onChange={v => setEditSermon(p => ({ ...p, description: v }))} placeholder="Sermon description…" label="Sermon description" />
                    </div>
                    <div className="admin-field admin-field--checks">
                      <label className="admin-check"><input name="sermonFeatured" type="checkbox" checked={!!editSermon.featured} onChange={e => setEditSermon(p => ({ ...p, featured: e.target.checked }))} /> Featured</label>
                      <label className="admin-check"><input name="sermonPublished" type="checkbox" checked={editSermon.published !== false} onChange={e => setEditSermon(p => ({ ...p, published: e.target.checked }))} /> Published</label>
                    </div>
                  </div>
                  <div className="admin-form-actions">
                    <button className="admin-btn admin-btn--ghost" onClick={() => setEditSermon(null)}>Cancel</button>
                    <button className="admin-btn admin-btn--primary" onClick={saveSermon} disabled={saving}>{saving ? <Loader2 size={14} className="admin-spin" /> : <Save size={14} />} Save sermon</button>
                  </div>
                </div>
              )}
              <div className="admin-list">
                {sermons.map(s => (
                  <div key={s.id} className="admin-list-item">
                    <div className="admin-list-item__body">
                      <div className="admin-list-item__title">{s.title}</div>
                      <div className="admin-list-item__meta">{s.speaker} · {s.series} · {s.preachedOn}</div>
                      <div className="admin-list-item__badges">
                        {s.featured && <span className="admin-badge admin-badge--amber">Featured</span>}
                        <span className={`admin-badge ${s.published ? 'admin-badge--green' : 'admin-badge--gray'}`}>{s.published ? 'Published' : 'Draft'}</span>
                        <span className="admin-badge admin-badge--blue">{s.mediaType}</span>
                      </div>
                    </div>
                    <div className="admin-list-item__actions">
                      <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setEditSermon(s)}><Edit3 size={14} /> Edit</button>
                      <button className="admin-btn admin-btn--danger-ghost admin-btn--sm" onClick={() => setConfirmDelete({ type: 'sermons', id: s.id })}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {sermons.length === 0 && <p className="admin-empty">No sermons yet. Add your first one above.</p>}
              </div>
            </div>
          )}

          {/* ── Events ── */}
          {tab === 'events' && (
            <div className="admin-section">
              <div className="admin-section__header">
                <h2 className="admin-section__title">Events</h2>
                <button className="admin-btn admin-btn--primary" onClick={() => setEditEvent({ category: eventCategories[0] || 'Event', published: true, featured: false })}><Plus size={16} /> Add event</button>
              </div>
              {editEvent && (
                <div className="admin-card admin-form-card">
                  <h3>{editEvent.id ? 'Edit Event' : 'New Event'}</h3>
                  <div className="admin-form-grid">
                    <div className="admin-field admin-field--full">
                      <label>Title *</label>
                      <input name="eventTitle" aria-label="Event title" value={editEvent.title || ''} onChange={e => setEditEvent(p => ({ ...p, title: e.target.value }))} placeholder="Event title" />
                    </div>
                    <div className="admin-field">
                      <label>Category</label>
                      <input name="eventCategory" aria-label="Event category" list="event-category-options" value={editEvent.category || ''} onChange={e => setEditEvent(p => ({ ...p, category: e.target.value }))} placeholder="Choose or enter a category" />
                      <datalist id="event-category-options">
                        {eventCategories.map(category => <option key={category} value={category} />)}
                      </datalist>
                    </div>
                    <div className="admin-field">
                      <label>Location</label>
                      <input name="eventLocation" aria-label="Event location" value={editEvent.location || ''} onChange={e => setEditEvent(p => ({ ...p, location: e.target.value }))} placeholder="Venue or address" />
                    </div>
                    <div className="admin-field">
                      <label>Start date & time *</label>
                      <input name="eventStart" aria-label="Event start date and time" type="datetime-local" value={editEvent.startsAt ? editEvent.startsAt.slice(0, 16) : ''} onChange={e => setEditEvent(p => ({ ...p, startsAt: e.target.value }))} />
                    </div>
                    <div className="admin-field">
                      <label>End date & time</label>
                      <input name="eventEnd" aria-label="Event end date and time" type="datetime-local" value={editEvent.endsAt ? editEvent.endsAt.slice(0, 16) : ''} onChange={e => setEditEvent(p => ({ ...p, endsAt: e.target.value }))} />
                    </div>
                    <div className="admin-field admin-field--full">
                      <ImageUploadField value={editEvent.imageUrl || ''} onChange={url => setEditEvent(p => ({ ...p, imageUrl: url }))} onToast={toast} label="Event image URL or local upload" />
                    </div>
                    <div className="admin-field admin-field--full">
                      <label>Description</label>
                      <RichEditor value={editEvent.description || ''} onChange={v => setEditEvent(p => ({ ...p, description: v }))} placeholder="Event description…" label="Event description" />
                    </div>
                    <div className="admin-field admin-field--checks">
                      <label className="admin-check"><input name="eventFeatured" type="checkbox" checked={!!editEvent.featured} onChange={e => setEditEvent(p => ({ ...p, featured: e.target.checked }))} /> Featured</label>
                      <label className="admin-check"><input name="eventPublished" type="checkbox" checked={editEvent.published !== false} onChange={e => setEditEvent(p => ({ ...p, published: e.target.checked }))} /> Published</label>
                    </div>
                  </div>
                  <div className="admin-form-actions">
                    <button className="admin-btn admin-btn--ghost" onClick={() => setEditEvent(null)}>Cancel</button>
                    <button className="admin-btn admin-btn--primary" onClick={saveEvent} disabled={saving}>{saving ? <Loader2 size={14} className="admin-spin" /> : <Save size={14} />} Save event</button>
                  </div>
                </div>
              )}
              <div className="admin-list">
                {events.map(ev => (
                  <div key={ev.id} className="admin-list-item">
                    <div className="admin-list-item__body">
                      <div className="admin-list-item__title">{ev.title}</div>
                      <div className="admin-list-item__meta"><MapPin size={12} /> {ev.location} · <Calendar size={12} /> {new Date(ev.startsAt).toLocaleDateString()}</div>
                      <div className="admin-list-item__badges">
                        {ev.featured && <span className="admin-badge admin-badge--amber">Featured</span>}
                        <span className={`admin-badge ${ev.published ? 'admin-badge--green' : 'admin-badge--gray'}`}>{ev.published ? 'Published' : 'Draft'}</span>
                        <span className="admin-badge admin-badge--blue">{ev.category}</span>
                      </div>
                    </div>
                    <div className="admin-list-item__actions">
                      <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setEditEvent(ev)}><Edit3 size={14} /> Edit</button>
                      <button className="admin-btn admin-btn--danger-ghost admin-btn--sm" onClick={() => setConfirmDelete({ type: 'events', id: ev.id })}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <p className="admin-empty">No events yet.</p>}
              </div>
            </div>
          )}

          {/* ── Prayer ── */}
          {tab === 'prayer' && (
            <div className="admin-section">
              <h2 className="admin-section__title">Requests</h2>
              <h3 className="admin-section__subtitle">Contact messages</h3>
              <div className="admin-list">
                {contactRequests.map(request => (
                  <div key={request.id} className="admin-list-item">
                    <div className="admin-list-item__body" style={{ flex: 1 }}>
                      <div className="admin-list-item__title">
                        {request.name}
                        <span className={`admin-badge ${request.status === 'replied' ? 'admin-badge--green' : request.status === 'new' ? 'admin-badge--blue' : 'admin-badge--gray'}`}>{request.status}</span>
                      </div>
                      <div className="admin-list-item__meta">
                        <a href={`mailto:${request.email}`}>{request.email}</a>
                        {request.phone && <> · <a href={`tel:${request.phone}`}>{request.phone}</a></>}
                        {' · '}{request.topic}{' · '}{new Date(request.createdAt).toLocaleString()}
                      </div>
                      <p className="admin-prayer-text" style={{ whiteSpace: 'pre-wrap' }}>{request.message}</p>
                      <div className="admin-request-reply">
                        <label htmlFor={`contact-reply-${request.id}`}>Reply by email</label>
                        <textarea
                          id={`contact-reply-${request.id}`}
                          name={`contact-reply-${request.id}`}
                          rows={3}
                          value={contactReplyDrafts[request.id] || ''}
                          onChange={event => setContactReplyDrafts(previous => ({
                            ...previous,
                            [request.id]: event.target.value,
                          }))}
                          placeholder="Write a response…"
                        />
                        <button
                          className="admin-btn admin-btn--primary admin-btn--sm"
                          disabled={replyingToContactRequest !== null}
                          onClick={() => void sendContactRequestReply(request)}
                        >
                          {replyingToContactRequest === request.id
                            ? <><Loader2 size={14} className="admin-spin" /> Sending…</>
                            : <>Send reply</>}
                        </button>
                      </div>
                    </div>
                    <label className="admin-field" style={{ minWidth: '130px' }}>
                      <span className="sr-only">Contact request status</span>
                      <select
                        name={`contact-request-status-${request.id}`}
                        aria-label={`Status for contact request from ${request.name}`}
                        value={request.status}
                        onChange={event => {
                          if (isContactRequestStatus(event.target.value)) {
                            void updateContactRequestStatus(request.id, event.target.value);
                          }
                        }}
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                      </select>
                    </label>
                  </div>
                ))}
                {contactRequests.length === 0 && <p className="admin-empty">No contact messages yet.</p>}
              </div>
              <h3 className="admin-section__subtitle" style={{ marginTop: '28px' }}>Prayer requests</h3>
              <div className="admin-list">
                {prayers.map(p => (
                  <PrayerCard key={p.id} prayer={p} onUpdate={updatePrayerStatus} />
                ))}
                {prayers.length === 0 && <p className="admin-empty">No prayer requests yet.</p>}
              </div>
            </div>
          )}

          {/* ── Ministries ── */}
          {tab === 'ministries' && (
            <div className="admin-section">
              <div className="admin-section__header">
                <h2 className="admin-section__title">Ministries</h2>
                <button className="admin-btn admin-btn--primary" onClick={() => setEditMinistry({ active: true, sortOrder: ministries.length })}><Plus size={16} /> Add ministry</button>
              </div>
              {editMinistry && (
                <div className="admin-card admin-form-card">
                  <h3>{editMinistry.id ? 'Edit Ministry' : 'New Ministry'}</h3>
                  <div className="admin-form-grid">
                    <div className="admin-field admin-field--full">
                      <label>Name *</label>
                      <input name="ministryName" aria-label="Ministry name" value={editMinistry.name || ''} onChange={e => setEditMinistry(p => ({ ...p, name: e.target.value }))} placeholder="Ministry name" />
                    </div>
                    <div className="admin-field admin-field--full">
                      <label>Tagline</label>
                      <input name="ministryTagline" aria-label="Ministry tagline" value={editMinistry.tagline || ''} onChange={e => setEditMinistry(p => ({ ...p, tagline: e.target.value }))} placeholder="Short tagline" />
                    </div>
                    <div className="admin-field">
                      <label>Meeting time</label>
                      <input name="ministryMeetingTime" aria-label="Ministry meeting time" value={editMinistry.meetingTime || ''} onChange={e => setEditMinistry(p => ({ ...p, meetingTime: e.target.value }))} placeholder="e.g. Fridays 6:00 PM" />
                    </div>
                    <div className="admin-field">
                      <label>Contact name</label>
                      <input name="ministryContactName" aria-label="Ministry contact name" value={editMinistry.contactName || ''} onChange={e => setEditMinistry(p => ({ ...p, contactName: e.target.value }))} placeholder="Leader name" />
                    </div>
                    <div className="admin-field">
                      <label>Contact email</label>
                      <input name="ministryContactEmail" aria-label="Ministry contact email" type="email" value={editMinistry.contactEmail || ''} onChange={e => setEditMinistry(p => ({ ...p, contactEmail: e.target.value }))} placeholder="leader@church.org" />
                    </div>
                    <div className="admin-field admin-field--full">
                      <ImageUploadField value={editMinistry.imageUrl || ''} onChange={url => setEditMinistry(p => ({ ...p, imageUrl: url }))} onToast={toast} label="Ministry image URL or local upload" />
                    </div>
                    <div className="admin-field admin-field--full">
                      <label>Description</label>
                      <RichEditor value={editMinistry.description || ''} onChange={v => setEditMinistry(p => ({ ...p, description: v }))} placeholder="Ministry description…" label="Ministry description" />
                    </div>
                    <div className="admin-field admin-field--checks">
                      <label className="admin-check"><input name="ministryActive" type="checkbox" checked={editMinistry.active !== false} onChange={e => setEditMinistry(p => ({ ...p, active: e.target.checked }))} /> Active</label>
                    </div>
                  </div>
                  <div className="admin-form-actions">
                    <button className="admin-btn admin-btn--ghost" onClick={() => setEditMinistry(null)}>Cancel</button>
                    <button className="admin-btn admin-btn--primary" onClick={saveMinistry} disabled={saving}>{saving ? <Loader2 size={14} className="admin-spin" /> : <Save size={14} />} Save</button>
                  </div>
                </div>
              )}
              <div className="admin-list">
                {ministries.map(m => (
                  <div key={m.id} className="admin-list-item">
                    <div className="admin-list-item__body">
                      <div className="admin-list-item__title">{m.name}</div>
                      <div className="admin-list-item__meta">{m.tagline} · {m.meetingTime}</div>
                      <div className="admin-list-item__badges"><span className={`admin-badge ${m.active ? 'admin-badge--green' : 'admin-badge--gray'}`}>{m.active ? 'Active' : 'Inactive'}</span></div>
                    </div>
                    <div className="admin-list-item__actions">
                      <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setEditMinistry(m)}><Edit3 size={14} /> Edit</button>
                      <button className="admin-btn admin-btn--danger-ghost admin-btn--sm" onClick={() => setConfirmDelete({ type: 'ministries', id: m.id })}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {ministries.length === 0 && <p className="admin-empty">No ministries yet.</p>}
              </div>
            </div>
          )}

          {/* ── Leadership ── */}
          {tab === 'leadership' && (
            <div className="admin-section">
              <div className="admin-section__header">
                <h2 className="admin-section__title">Leadership Team</h2>
                <button className="admin-btn admin-btn--primary" onClick={() => setEditLeader({ active: true, sortOrder: leaders.length })}><Plus size={16} /> Add leader</button>
              </div>
              {editLeader && (
                <div className="admin-card admin-form-card">
                  <h3>{editLeader.id ? 'Edit Leader' : 'New Leader'}</h3>
                  <div className="admin-form-grid">
                    <div className="admin-field">
                      <label>Name *</label>
                      <input name="leaderName" aria-label="Leader name" value={editLeader.name || ''} onChange={e => setEditLeader(p => ({ ...p, name: e.target.value }))} placeholder="Full name" />
                    </div>
                    <div className="admin-field">
                      <label>Title / Role</label>
                      <input name="leaderTitle" aria-label="Leader title or role" value={editLeader.title || ''} onChange={e => setEditLeader(p => ({ ...p, title: e.target.value }))} placeholder="Senior Pastor" />
                    </div>
                    <div className="admin-field">
                      <label>Email</label>
                      <input name="leaderEmail" aria-label="Leader email" type="email" value={editLeader.email || ''} onChange={e => setEditLeader(p => ({ ...p, email: e.target.value }))} placeholder="pastor@church.org" />
                    </div>
                    <div className="admin-field admin-field--full">
                      <ImageUploadField value={editLeader.imageUrl || ''} onChange={url => setEditLeader(p => ({ ...p, imageUrl: url }))} onToast={toast} label="Leader photo URL or local upload" />
                    </div>
                    <div className="admin-field admin-field--full">
                      <label>Bio</label>
                      <RichEditor value={editLeader.bio || ''} onChange={v => setEditLeader(p => ({ ...p, bio: v }))} placeholder="Short biography…" label="Leader biography" />
                    </div>
                    <div className="admin-field admin-field--checks">
                      <label className="admin-check"><input name="leaderActive" type="checkbox" checked={editLeader.active !== false} onChange={e => setEditLeader(p => ({ ...p, active: e.target.checked }))} /> Active</label>
                    </div>
                  </div>
                  <div className="admin-form-actions">
                    <button className="admin-btn admin-btn--ghost" onClick={() => setEditLeader(null)}>Cancel</button>
                    <button className="admin-btn admin-btn--primary" onClick={saveLeader} disabled={saving}>{saving ? <Loader2 size={14} className="admin-spin" /> : <Save size={14} />} Save</button>
                  </div>
                </div>
              )}
              <div className="admin-list">
                {leaders.map(l => (
                  <div key={l.id} className="admin-list-item">
                    {l.imageUrl && <img src={l.imageUrl} alt={l.name} className="admin-list-item__avatar" />}
                    <div className="admin-list-item__body">
                      <div className="admin-list-item__title">{l.name}</div>
                      <div className="admin-list-item__meta">{l.title} · {l.email}</div>
                      <div className="admin-list-item__badges"><span className={`admin-badge ${l.active ? 'admin-badge--green' : 'admin-badge--gray'}`}>{l.active ? 'Active' : 'Inactive'}</span></div>
                    </div>
                    <div className="admin-list-item__actions">
                      <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setEditLeader(l)}><Edit3 size={14} /> Edit</button>
                      <button className="admin-btn admin-btn--danger-ghost admin-btn--sm" onClick={() => setConfirmDelete({ type: 'leadership', id: l.id })}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {leaders.length === 0 && <p className="admin-empty">No leaders yet.</p>}
              </div>
            </div>
          )}

          {/* ── Site Info ── */}
          {tab === 'site-info' && (
            <SiteInfoTab settings={settings} onSave={saveSettings} onToast={toast} saving={saving} role={adminRole} />
          )}

          {tab === 'giving' && (adminRole === 'owner' || settings.give_editor_details_enabled === 'true') && (
            <GivingTab
              settings={settings}
              onSave={saveSettings}
              onToast={toast}
              saving={saving}
              role={adminRole}
              canUploadMedia={adminRole === 'owner' || adminPermissions.includes('media')}
            />
          )}

          {tab === 'about-page' && <PageContentEditor page="about" onToast={toast} />}
          {tab === 'ministry-page' && <PageContentEditor page="ministries" onToast={toast} />}

          {tab === 'contacts' && (
            <div className="admin-section">
              <div className="admin-section__header">
                <h2 className="admin-section__title">Church Contacts</h2>
                <button className="admin-btn admin-btn--primary" disabled={!contactsLoaded || contactsLoading || !!contactsError} onClick={() => setChurchContacts(items => [
                  ...items,
                  { kind: 'phone', label: '', value: '', sortOrder: items.length, active: true, primary: false },
                ])}><Plus size={16} /> Add contact</button>
              </div>
              <p className="admin-form__hint">Add phone numbers, email addresses, locations, websites, WhatsApp contacts, or other public details. Set a primary contact for each type.</p>
              {contactsLoading && <div className="admin-loading-banner" role="status"><Loader2 size={16} className="admin-spin" /> Loading contacts…</div>}
              {contactsError && <div className="admin-error-banner" role="alert">{contactsError}<button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => { setContactsLoaded(false); setContactsError(''); setContactsLoadAttempt(attempt => attempt + 1); }}>Retry</button></div>}
              {!contactsLoading && !contactsError && <div className="admin-card">
                {churchContacts.map((contact, index) => (
                  <div className="admin-service-row" key={contact.id ?? `new-contact-${index}`}>
                    <select
                      name={`contact-kind-${index}`}
                      aria-label={`Contact ${index + 1} type`}
                      value={contact.kind}
                      onChange={event => setChurchContacts(items => items.map((item, current) => current === index ? { ...item, kind: event.target.value as ChurchContact['kind'] } : item))}
                    >
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                      <option value="address">Location</option>
                      <option value="website">Website</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="other">Other</option>
                    </select>
                    <input name={`contact-label-${index}`} aria-label={`Contact ${index + 1} label`} value={contact.label} onChange={event => setChurchContacts(items => items.map((item, current) => current === index ? { ...item, label: event.target.value } : item))} placeholder="Label" />
                    <input name={`contact-value-${index}`} aria-label={`Contact ${index + 1} value`} value={contact.value} onChange={event => setChurchContacts(items => items.map((item, current) => current === index ? { ...item, value: event.target.value } : item))} placeholder="Contact detail" />
                    <label className="admin-check"><input name={`contact-active-${index}`} type="checkbox" checked={contact.active} onChange={event => setChurchContacts(items => items.map((item, current) => current === index ? { ...item, active: event.target.checked } : item))} /> Show</label>
                    <label className="admin-check"><input name={`contact-primary-${index}`} type="checkbox" checked={contact.primary} onChange={event => setChurchContacts(items => items.map((item, current) => current === index ? { ...item, primary: event.target.checked } : { ...item, primary: item.kind === contact.kind ? false : item.primary }))} /> Primary</label>
                    <button className="admin-btn admin-btn--danger-ghost admin-btn--sm" aria-label={`Remove contact ${index + 1}`} onClick={() => setChurchContacts(items => items.filter((_, current) => current !== index))}><Trash2 size={14} /></button>
                  </div>
                ))}
                {churchContacts.length === 0 && <p className="admin-empty">No church contacts configured.</p>}
                <div className="admin-form-actions">
                  <button className="admin-btn admin-btn--primary" onClick={() => void saveChurchContacts()} disabled={saving}>{saving ? <Loader2 size={14} className="admin-spin" /> : <Save size={14} />} Save contacts</button>
                </div>
              </div>}
            </div>
          )}
          {/* ── Hero ── */}
          {tab === 'hero' && (
            <HeroTab settings={settings} onSave={saveSettings} onToast={toast} saving={saving} />
          )}

          {/* ── Phrases ── */}
          {tab === 'phrases' && (
            <div className="admin-section">
              <div className="admin-section__header">
                <h2 className="admin-section__title">Typewriter Phrases</h2>
                <button className="admin-btn admin-btn--primary" onClick={() => setPhrases(p => [...p, { id: Date.now(), phrase: '', sortOrder: p.length, active: true }])}><Plus size={16} /> Add phrase</button>
              </div>
              <div className="admin-card">
                <p className="admin-form__hint">These phrases rotate in the hero section typewriter animation.</p>
                {phrases.map((ph, i) => (
                  <div key={ph.id} className="admin-phrase-row">
                    <input name={`phrase-${ph.id}`} aria-label={`Phrase ${i + 1}`} value={ph.phrase} onChange={e => setPhrases(prev => prev.map((p, j) => j === i ? { ...p, phrase: e.target.value } : p))} placeholder="Enter a phrase…" />
                    <label className="admin-check"><input name={`phrase-active-${ph.id}`} type="checkbox" checked={ph.active} onChange={e => setPhrases(prev => prev.map((p, j) => j === i ? { ...p, active: e.target.checked } : p))} /> Active</label>
                    <button className="admin-btn admin-btn--danger-ghost admin-btn--sm" onClick={() => setPhrases(prev => prev.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
                  </div>
                ))}
                <div className="admin-form-actions">
                  <button className="admin-btn admin-btn--primary" onClick={savePhrases} disabled={saving}>{saving ? <Loader2 size={14} className="admin-spin" /> : <Save size={14} />} Save phrases</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Service Times ── */}
          {tab === 'service-times' && (
            <div className="admin-section">
              <div className="admin-section__header">
                <h2 className="admin-section__title">Service Times</h2>
                <button className="admin-btn admin-btn--primary" onClick={() => setServiceTimes(p => [...p, { day: 'Sunday', time: '9:00 AM', label: 'Service', location: 'Main Sanctuary', sortOrder: p.length, active: true }])}><Plus size={16} /> Add time</button>
              </div>
              <div className="admin-card">
                {serviceTimes.map((st, i) => (
                  <div key={i} className="admin-service-row">
                    <input name={`service-day-${i}`} aria-label={`Service time ${i + 1} day`} value={st.day} onChange={e => setServiceTimes(prev => prev.map((s, j) => j === i ? { ...s, day: e.target.value } : s))} placeholder="Day" />
                    <input name={`service-time-${i}`} aria-label={`Service time ${i + 1} time`} value={st.time} onChange={e => setServiceTimes(prev => prev.map((s, j) => j === i ? { ...s, time: e.target.value } : s))} placeholder="Time" />
                    <input name={`service-label-${i}`} aria-label={`Service time ${i + 1} label`} value={st.label} onChange={e => setServiceTimes(prev => prev.map((s, j) => j === i ? { ...s, label: e.target.value } : s))} placeholder="Label" />
                    <input name={`service-location-${i}`} aria-label={`Service time ${i + 1} location`} value={st.location || ''} onChange={e => setServiceTimes(prev => prev.map((s, j) => j === i ? { ...s, location: e.target.value } : s))} placeholder="Location" />
                    <label className="admin-check"><input name={`service-active-${i}`} type="checkbox" checked={st.active} onChange={e => setServiceTimes(prev => prev.map((s, j) => j === i ? { ...s, active: e.target.checked } : s))} /> Active</label>
                    <button className="admin-btn admin-btn--danger-ghost admin-btn--sm" onClick={() => setServiceTimes(prev => prev.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
                  </div>
                ))}
                <div className="admin-form-actions">
                  <button className="admin-btn admin-btn--primary" onClick={saveServiceTimes} disabled={saving}>{saving ? <Loader2 size={14} className="admin-spin" /> : <Save size={14} />} Save times</button>
                </div>
              </div>
            </div>
          )}


          {/* ── Gallery ── */}
          {tab === 'gallery' && (
            <div className="admin-section">
              <div className="admin-section__header">
                <h2 className="admin-section__title">Gallery</h2>
                <button className="admin-btn admin-btn--primary" onClick={() => setEditGallery({ imageUrl: '', caption: '', category: 'General', sortOrder: gallery.length, active: true })}><Plus size={16} /> Add image</button>
              </div>

              <div className="admin-card admin-form-card">
                <h3>Homepage photo rotation</h3>
                <p className="admin-form__hint">Choose which visible gallery photos rotate in the homepage story and worship sections. Unselected gallery photos remain in the Gallery page only.</p>
                {gallery.filter(image => image.active).length === 0
                  ? <p className="admin-empty">Add and publish gallery images before choosing photos for the rotation.</p>
                  : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                    {gallery.filter(image => image.active).map(image => (
                      <label key={image.id} className="admin-card" style={{ padding: '10px', cursor: 'pointer' }}>
                        <img src={image.imageUrl} alt={image.caption || ''} loading="lazy" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px', background: 'hsl(var(--muted))' }} />
                        <span className="admin-check">
                          <input
                            type="checkbox"
                            checked={animatedGalleryIds.includes(image.id)}
                            onChange={event => {
                              const nextIds = event.target.checked
                                ? [...new Set([...animatedGalleryIds, image.id])]
                                : animatedGalleryIds.filter(id => id !== image.id);
                              void saveSettings({ home_animated_gallery_ids: JSON.stringify(nextIds) });
                            }}
                          />
                          {image.caption || `Gallery photo ${image.id}`}
                        </span>
                      </label>
                    ))}
                  </div>}
              </div>

              {editGallery && (
                <div className="admin-card" style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>{editGallery.id ? 'Edit Image' : 'Add Image'}</h3>
                  <p className="admin-form__hint">Gallery entries are images only. For YouTube, TikTok, Vimeo, or video links, add a sermon instead.</p>
                  <div className="admin-form">
                    <div className="admin-field">
                      <label>Image</label>
                      <ImageUploadField
                        value={editGallery.imageUrl || ''}
                        onChange={url => setEditGallery(prev => prev ? { ...prev, imageUrl: url } : prev)}
                        onToast={toast}
                      />
                    </div>
                    <div className="admin-field">
                      <label>Caption</label>
                      <input name="galleryCaption" aria-label="Image caption" value={editGallery.caption || ''} onChange={e => setEditGallery(prev => prev ? { ...prev, caption: e.target.value } : prev)} placeholder="Optional caption…" />
                    </div>
                    <div className="admin-field">
                      <label>Category</label>
                      <select name="galleryCategory" aria-label="Image category" value={editGallery.category || 'General'} onChange={e => setEditGallery(prev => prev ? { ...prev, category: e.target.value } : prev)}>
                        <option>General</option>
                        <option>Worship</option>
                        <option>Community</option>
                        <option>Events</option>
                        <option>Outreach</option>
                        <option>Youth</option>
                        <option>Children</option>
                      </select>
                    </div>
                    <div className="admin-field">
                      <label className="admin-check"><input name="galleryActive" type="checkbox" checked={editGallery.active !== false} onChange={e => setEditGallery(prev => prev ? { ...prev, active: e.target.checked } : prev)} /> Visible on site</label>
                    </div>
                    <div className="admin-form-actions">
                      <button className="admin-btn admin-btn--ghost" onClick={() => setEditGallery(null)}>Cancel</button>
                      <button className="admin-btn admin-btn--primary" onClick={saveGalleryItem} disabled={saving}>{saving ? <Loader2 size={14} className="admin-spin" /> : <Save size={14} />} Save</button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {gallery.map(img => (
                  <div key={img.id} className="admin-card" style={{ padding: '12px', position: 'relative' }}>
                    <img src={img.imageUrl} alt={img.caption || ''} loading="lazy" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px', background: 'hsl(var(--muted))' }} />
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.caption || '(no caption)'}</div>
                    <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}>{img.category} {!img.active && '· Hidden'}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setEditGallery(img)}><Edit3 size={13} /> Edit</button>
                      <button className="admin-btn admin-btn--danger-ghost admin-btn--sm" onClick={() => setConfirmDelete({ type: 'gallery', id: img.id })}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
                {gallery.length === 0 && <p className="admin-empty">No gallery images yet. Add your first image above.</p>}
              </div>
            </div>
          )}

          {/* ── Media Upload ── */}
          {tab === 'media' && (
            <div className="admin-section">
              <h2 className="admin-section__title">Media Upload</h2>
              <div className="admin-card" style={{ maxWidth: '640px' }}>
                <p className="admin-form__hint" style={{ marginBottom: '20px' }}>Upload images or videos for use across the site, or save a secure external link to copy into a sermon or image field. Gallery entries must be images.</p>
                <BulkMediaUploader onToast={toast} />
              </div>
              <div className="admin-card" style={{ maxWidth: '640px', marginTop: '24px' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '12px' }}>Logo Upload</h3>
                <p className="admin-form__hint" style={{ marginBottom: '16px' }}>Upload a new church logo. Recommended: PNG with transparent background, min 400px wide.</p>
                <ImageUploadField
                  value={settings['logo_url'] || ''}
                  onChange={url => {
                    setSettings(prev => ({ ...prev, logo_url: url }));
                    api('PUT', '/api/admin/settings', { logo_url: url }).then(() => toast('success', 'Logo saved')).catch(() => toast('error', 'Save failed'));
                  }}
                  onToast={toast}
                  label="Church Logo"
                />
              </div>
              <div className="admin-card" style={{ maxWidth: '640px', marginTop: '24px' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '12px' }}>Hero Background</h3>
                <p className="admin-form__hint" style={{ marginBottom: '16px' }}>Upload a background image for the homepage hero section. Recommended: 1920×1080px or wider.</p>
                <ImageUploadField
                  value={settings['hero_bg_url'] || ''}
                  onChange={url => {
                    setSettings(prev => ({ ...prev, hero_bg_url: url }));
                    api('PUT', '/api/admin/settings', { hero_bg_url: url }).then(() => toast('success', 'Hero background saved')).catch(() => toast('error', 'Save failed'));
                  }}
                  onToast={toast}
                  label="Hero Background Image"
                />
              </div>
              <div className="admin-card" style={{ maxWidth: '640px', marginTop: '24px' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '12px' }}>About Section Background</h3>
                <p className="admin-form__hint" style={{ marginBottom: '16px' }}>Upload a background image for the About / Community section on the homepage.</p>
                <ImageUploadField
                  value={settings['about_bg_url'] || ''}
                  onChange={url => {
                    setSettings(prev => ({ ...prev, about_bg_url: url }));
                    api('PUT', '/api/admin/settings', { about_bg_url: url }).then(() => toast('success', 'About background saved')).catch(() => toast('error', 'Save failed'));
                  }}
                  onToast={toast}
                  label="About Section Background"
                />
              </div>
            </div>
          )}

          {/* ── Social ── */}
          {tab === 'social' && (
            <SocialTab settings={settings} onSave={saveSettings} onToast={toast} saving={saving} />
          )}

          {tab === 'admins' && adminRole === 'owner' && (
            <div className="admin-section">
              <div>
                <h2 className="admin-section__title">Editor Accounts</h2>
                <p className="admin-form__hint">Only Super Admins can create editor accounts. Passwords are stored as bcrypt hashes.</p>
              </div>
              <div className="admin-card admin-form-card">
                <h3>Create an editor account</h3>
                <form onSubmit={createAdmin} className="admin-form-grid">
                  <div className="admin-field">
                    <label htmlFor="new-admin-email">Email address</label>
                    <input id="new-admin-email" name="email" aria-label="Email address for new admin" type="email" autoComplete="email" value={newAdmin.email} onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} required />
                  </div>
                  <div className="admin-field">
                    <label htmlFor="new-admin-display-name">Display name</label>
                    <input id="new-admin-display-name" name="displayName" aria-label="Display name" value={newAdmin.displayName} onChange={e => setNewAdmin(p => ({ ...p, displayName: e.target.value }))} maxLength={100} />
                  </div>
                  <div className="admin-field admin-field--full">
                    <label htmlFor="new-admin-password">Temporary password</label>
                    <input id="new-admin-password" name="password" aria-label="Temporary password for new admin" type="password" autoComplete="new-password" value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} minLength={8} required />
                    <p className="admin-form__hint">Use at least 8 characters. Share it securely; the editor can change it after signing in.</p>
                  </div>
                  <div className="admin-form-actions admin-field--full">
                    <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                      {saving ? <Loader2 size={14} className="admin-spin" /> : <Plus size={14} />} Create admin
                    </button>
                  </div>
                </form>
              </div>
              <div className="admin-list">
                {adminAccounts.map(account => (
                  <div key={account.id} className="admin-card admin-form-card">
                    <div className="admin-list-item__body">
                      <div className="admin-list-item__title">{account.displayName || account.email}</div>
                      <div className="admin-list-item__meta">{account.email}</div>
                    </div>
                    <span className={`admin-badge ${account.role === 'owner' ? 'admin-badge--amber' : 'admin-badge--blue'}`}>
                      {account.role === 'owner' ? 'Super Admin' : 'Editor'}
                    </span>
                    {account.role === 'editor' && (
                      <>
                        <div className="admin-form-grid" style={{ marginTop: '16px' }}>
                          {ADMIN_EDITOR_PERMISSIONS.map(permission => {
                            const selectedPermissions = permissionDrafts[account.id] ?? account.permissions;
                            return (
                              <label className="admin-check" key={permission.key}>
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.includes(permission.key)}
                                  onChange={event => togglePermissionDraft(account.id, permission.key, event.target.checked)}
                                />
                                {permission.label}
                              </label>
                            );
                          })}
                        </div>
                        <div className="admin-form-actions">
                          <button
                            className="admin-btn admin-btn--primary"
                            onClick={() => void saveAdminPermissions(account.id)}
                            disabled={savingPermissionsFor === account.id || !permissionDrafts[account.id]}
                          >
                            {savingPermissionsFor === account.id
                              ? <Loader2 size={14} className="admin-spin" />
                              : <Save size={14} />}
                            Save privileges
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {adminAccounts.length === 0 && <p className="admin-empty">No admin accounts were returned.</p>}
              </div>
            </div>
          )}

          {/* ── Password ── */}
          {tab === 'password' && (
            <div className="admin-section">
              <h2 className="admin-section__title">Change Password</h2>
              <div className="admin-card" style={{ maxWidth: '480px' }}>
                <form onSubmit={changePassword} className="admin-form">
                  <div className="admin-field">
                    <label htmlFor="current-password">Current password</label>
                    <input id="current-password" name="currentPassword" type="password" autoComplete="current-password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} required />
                  </div>
                  <div className="admin-field">
                    <label htmlFor="new-password">New password</label>
                    <input id="new-password" name="newPassword" type="password" autoComplete="new-password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="Min 8 characters" required />
                  </div>
                  <div className="admin-field">
                    <label htmlFor="confirm-new-password">Confirm new password</label>
                    <input id="confirm-new-password" name="confirmPassword" type="password" autoComplete="new-password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} required />
                  </div>
                  <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>{saving ? <Loader2 size={14} className="admin-spin" /> : <Lock size={14} />} Update password</button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}


/* ── Image Upload Field ── */
function ImageUploadField({ value, onChange, onToast, label, allowVideo = false, allowAudio = false, allowImage = true }: {
  value: string;
  onChange: (url: string) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
  label?: string;
  allowVideo?: boolean;
  allowAudio?: boolean;
  allowImage?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();
  const fileInputId = `${fieldId}-file`;
  const urlInputId = `${fieldId}-url`;

  useEffect(() => { setPreview(value); }, [value]);

  const isVideo = (url: string) => /\.(mp4|webm|ogv|ogg|mov|m4v)(?:$|[?#])/i.test(url);
  const isAudio = (url: string) => /\.(mp3|m4a|wav|ogg|weba)(?:$|[?#])/i.test(url);
  const isImage = (url: string) => /\.(jpe?g|png|webp|gif|avif)(?:$|[?#])/i.test(url);

  const handleFile = async (file: File) => {
    const imageFile = allowImage && ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
    const videoFile = allowVideo && ['video/mp4', 'video/webm', 'video/ogg'].includes(file.type);
    const audioFile = allowAudio && ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm'].includes(file.type);
    if (!imageFile && !videoFile && !audioFile) {
      onToast('error', 'Choose a supported image, video, or audio file for this field');
      return;
    }
    const maxSize = videoFile || audioFile ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size <= 0 || file.size > maxSize) {
      onToast('error', `File is empty or too large (max ${videoFile || audioFile ? '50MB' : '10MB'})`);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadChurchMedia(file);
      setPreview(url);
      onChange(url);
      onToast('success', videoFile ? 'Video uploaded' : audioFile ? 'Audio uploaded' : 'Image uploaded');
    } catch (err: unknown) {
      onToast('error', err instanceof Error ? err.message : 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      {label && <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>{label}</div>}
      <div
        className="admin-upload-zone"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Loader2 size={24} className="admin-spin" style={{ color: 'hsl(var(--primary))' }} />
            <span style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>Uploading…</span>
          </div>
        ) : preview ? (
          <div style={{ position: 'relative' }}>
            {allowVideo && isVideo(preview) ? (
              <video
                src={preview}
                controls
                muted
                onClick={e => e.stopPropagation()}
                style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '6px' }}
              />
            ) : allowAudio && isAudio(preview) ? (
              <audio src={preview} controls onClick={e => e.stopPropagation()} style={{ maxWidth: '100%' }} />
            ) : allowVideo && !isImage(preview) ? (
              <a href={preview} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                Open external sermon media
              </a>
            ) : (
              <img src={preview} alt="" style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '6px', objectFit: 'contain' }} />
            )}
            <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginTop: '8px' }}>Click to replace</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Upload size={28} style={{ color: 'hsl(var(--muted-foreground))' }} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Click or drag to upload</span>
            <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
              {allowAudio
                ? `${allowImage ? 'JPEG, PNG, WebP, GIF · ' : ''}MP4/WebM/Ogg video · MP3/M4A/WAV/Ogg audio (up to 50MB)`
                : allowVideo
                  ? 'JPEG, PNG, WebP, GIF · MP4, WebM, Ogg video up to 50MB'
                  : 'JPEG, PNG, WebP, GIF · max 10MB'}
            </span>
          </div>
        )}
      </div>
      <input
        id={fileInputId}
        name="mediaFile"
        aria-label={`${label || 'Media'} file upload`}
        ref={inputRef}
        type="file"
        accept={`${allowImage ? 'image/jpeg,image/png,image/webp,image/gif' : ''}${allowVideo ? `${allowImage ? ',' : ''}video/mp4,video/webm,video/ogg` : ''}${allowAudio ? `${allowImage || allowVideo ? ',' : ''}audio/mpeg,audio/mp4,audio/wav,audio/x-wav,audio/ogg,audio/webm` : ''}`}
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.currentTarget.value = '';
        }}
      />
      <div style={{ marginTop: '8px' }}>
        <label htmlFor={urlInputId} style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>Or paste URL:</label>
        <input
          id={urlInputId}
          name="mediaUrl"
          aria-label={label ? `${label} URL` : 'Media URL'}
          value={preview}
          onChange={e => { setPreview(e.target.value); onChange(e.target.value); }}
          placeholder="https://…"
          style={{ marginTop: '4px', width: '100%', fontSize: '12px' }}
          className="admin-input-sm"
        />
      </div>
    </div>
  );
}

/* ── Bulk media uploader ── */
function BulkMediaUploader({ onToast }: { onToast: (type: 'success' | 'error', msg: string) => void }) {
  const [uploads, setUploads] = useState<{ id: string; name: string; url: string; status: 'uploading' | 'done' | 'error'; error?: string }[]>([]);
  const [externalUrl, setExternalUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: Parameters<typeof uploadChurchMedia>[0][]) => {
    const arr = files;
    const queued = arr.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      url: '',
      status: 'uploading' as const,
    }));
    setUploads(prev => [...prev, ...queued]);

    let uploaded = 0;
    let firstError = '';
    for (let i = 0; i < arr.length; i++) {
      const file = arr[i];
      const entry = queued[i];
      const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
      const isVideo = ['video/mp4', 'video/webm', 'video/ogg'].includes(file.type);
      const isAudio = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm'].includes(file.type);
      const maxSize = isVideo || isAudio ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if ((!isImage && !isVideo && !isAudio) || file.size <= 0 || file.size > maxSize) {
        const error = !isImage && !isVideo && !isAudio
          ? 'Choose a supported image, video, or audio file.'
          : `File is empty or too large (max ${isVideo || isAudio ? '50MB' : '10MB'}).`;
        firstError ||= error;
        setUploads(prev => prev.map(item => item.id === entry.id ? { ...item, status: 'error', error } : item));
        continue;
      }
      try {
        const url = await uploadChurchMedia(file);
        uploaded++;
        setUploads(prev => prev.map(item => item.id === entry.id ? { ...item, url, status: 'done' } : item));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Upload failed.';
        firstError ||= message;
        setUploads(prev => prev.map(item => item.id === entry.id ? { ...item, status: 'error', error: message } : item));
      }
    }
    if (uploaded === arr.length) onToast('success', `Uploaded ${uploaded} file(s)`);
    else onToast('error', `Uploaded ${uploaded} of ${arr.length} file(s). ${firstError}`);
  };

  const addExternalUrl = (event: FormEvent) => {
    event.preventDefault();
    const url = parseHttpsMediaUrl(externalUrl);
    if (!url) {
      onToast('error', 'Enter a valid HTTPS link from a trusted source.');
      return;
    }

    setUploads(prev => [...prev, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: url.hostname,
      url: url.toString(),
      status: 'done',
    }]);
    setExternalUrl('');
    onToast('success', 'Media link added. Copy it into a sermon or image field as appropriate.');
  };

  return (
    <div>
      <div
        className="admin-upload-zone"
        onDrop={e => { e.preventDefault(); handleFiles(Array.from(e.dataTransfer.files)); }}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{ cursor: 'pointer', marginBottom: '16px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Upload size={28} style={{ color: 'hsl(var(--muted-foreground))' }} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Click or drag images, videos, and audio to upload</span>
          <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>Images up to 10MB · video and audio up to 50MB</span>
        </div>
      </div>
      <input ref={inputRef} name="mediaFiles" aria-label="Upload media files" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg,audio/mpeg,audio/mp4,audio/wav,audio/x-wav,audio/ogg,audio/webm" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) handleFiles(Array.from(e.target.files)); e.currentTarget.value = ''; }} />
      <form onSubmit={addExternalUrl} className="admin-form" style={{ marginBottom: '20px' }}>
        <div className="admin-field">
          <label htmlFor="external-media-url">Or add a trusted media link</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="external-media-url"
              name="externalMediaUrl"
              aria-label="Trusted media URL"
              type="url"
              value={externalUrl}
              onChange={event => setExternalUrl(event.target.value)}
              placeholder="YouTube, TikTok, or direct HTTPS media URL"
              style={{ flex: 1 }}
            />
            <button type="submit" className="admin-btn admin-btn--ghost">Add link</button>
          </div>
          <p className="admin-form__hint">External links stay hosted by their source. Gallery fields accept images only.</p>
        </div>
      </form>
      {uploads.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {uploads.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'hsl(var(--muted))', borderRadius: '8px' }} title={u.error}>
              {u.status === 'uploading' && <Loader2 size={16} className="admin-spin" style={{ color: 'hsl(var(--primary))' }} />}
              {u.status === 'done' && <CheckCircle size={16} style={{ color: 'hsl(var(--success))' }} />}
              {u.status === 'error' && <AlertCircle size={16} style={{ color: 'hsl(var(--destructive))' }} />}
              <span style={{ flex: 1, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
              {u.status === 'error' && <span style={{ fontSize: '12px', color: 'hsl(var(--destructive))' }}>{u.error}</span>}
              {u.status === 'done' && (
                <button type="button" className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => { navigator.clipboard.writeText(u.url); onToast('success', 'URL copied'); }}>Copy URL</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Prayer card sub-component ── */
function PrayerCard({ prayer, onUpdate }: { prayer: PrayerRequest; onUpdate: (id: number, status: string, note: string) => void }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(prayer.status);
  const [note, setNote] = useState(prayer.adminNote || '');
  return (
    <div className="admin-list-item admin-list-item--prayer">
      <div className="admin-list-item__body" style={{ flex: 1 }}>
        <div className="admin-list-item__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {prayer.name || 'Anonymous'}
          <span className={`admin-badge ${prayer.status === 'answered' ? 'admin-badge--green' : prayer.status === 'praying' ? 'admin-badge--amber' : 'admin-badge--blue'}`}>{prayer.status}</span>
          {prayer.isPrivate && <span className="admin-badge admin-badge--gray">Private</span>}
        </div>
        <div className="admin-list-item__meta">{prayer.email} · {prayer.phone} · {new Date(prayer.createdAt).toLocaleDateString()}</div>
        <p className="admin-prayer-text">{prayer.request}</p>
        {open && (
          <div className="admin-prayer-respond">
            <div className="admin-field">
              <label>Status</label>
              <select name={`prayer-status-${prayer.id}`} aria-label={`Status for prayer request from ${prayer.name || 'anonymous'}`} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="new">New</option>
                <option value="praying">Praying</option>
                <option value="answered">Answered</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Admin note (internal)</label>
              <textarea name={`prayer-note-${prayer.id}`} aria-label={`Internal note for prayer request from ${prayer.name || 'anonymous'}`} value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Internal note…" />
            </div>
            <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => { onUpdate(prayer.id, status, note); setOpen(false); }}><Save size={14} /> Save</button>
          </div>
        )}
      </div>
      <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setOpen(o => !o)}>{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {open ? 'Close' : 'Respond'}</button>
    </div>
  );
}

/* ── Site Info tab ── */
function SiteInfoTab({ settings, onSave, onToast, saving, role }: {
  settings: SiteSettings;
  onSave: (u: SiteSettings) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
  saving: boolean;
  role: string;
}) {
  const [form, setForm] = useState({ ...settings });
  useEffect(() => { setForm(s => ({ ...s, ...settings })); }, [settings]);
  const f = (k: string) => form[k] || '';
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const save = () => {
    for (const key of role === 'owner' ? ['contact_notification_email'] : []) {
      if (f(key) !== (settings[key] || '') && f(key) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f(key))) {
        onToast('error', 'Enter a valid church email address.');
        return;
      }
    }
    const editableImages = role === 'owner'
      ? ['logo_url', 'about_image_url', 'scripture_banner_image_url']
      : ['logo_url', 'about_image_url'];
    for (const key of editableImages) {
      if (f(key) !== (settings[key] || '') && f(key) && !isSafeMediaSource(f(key))) {
        onToast('error', 'Use valid HTTPS image URLs or local church images.');
        return;
      }
    }
    const mapUrl = f('map_embed_url');
    if (mapUrl && mapUrl !== (settings.map_embed_url || '')) {
      const parsed = parseHttpsMediaUrl(mapUrl);
      if (!parsed || !['maps.google.com', 'www.google.com'].includes(parsed.hostname) || !parsed.pathname.startsWith('/maps')) {
        onToast('error', 'Use a secure Google Maps embed URL, or leave this blank to map the church address.');
        return;
      }
    }
    onSave(form);
  };
  return (
    <div className="admin-section">
      <h2 className="admin-section__title">Site Information</h2>
      <div className="admin-card admin-form-card">
        <h3>Church Identity</h3>
        <div className="admin-form-grid">
          <div className="admin-field"><label>Church name</label><input name="church_name" aria-label="Church name" value={f('church_name')} onChange={e => set('church_name', e.target.value)} /></div>
          <div className="admin-field"><label>Tagline</label><input name="tagline" aria-label="Tagline" value={f('tagline')} onChange={e => set('tagline', e.target.value)} /></div>
          {role === 'owner' && <>
            <div className="admin-field"><label>Contact notification email</label><input name="contact_notification_email" aria-label="Contact notification email" type="email" value={f('contact_notification_email')} onChange={e => set('contact_notification_email', e.target.value)} placeholder="Defaults to the church email" /></div>
            <div className="admin-field"><label>Live stream URL</label><input name="live_stream_url" aria-label="Live stream URL" type="url" value={f('live_stream_url')} onChange={e => set('live_stream_url', e.target.value)} placeholder="https://..." /></div>
            <div className="admin-field"><label className="admin-check"><input name="is_live" type="checkbox" checked={f('is_live') === 'true'} onChange={e => set('is_live', String(e.target.checked))} /> Show live badge</label></div>
          </>}
          <div className="admin-field admin-field--full">
            <ImageUploadField value={f('logo_url')} onChange={url => set('logo_url', url)} onToast={onToast} label="Church logo URL or local upload" />
          </div>
        </div>
      </div>
      <div className="admin-card admin-form-card">
        <h3>Church Story Image</h3>
        <p className="admin-form__hint">Edit the About page story, mission, vision, Scripture, and impact statistics in the About Page tab. Manage multiple phone numbers, emails, and locations in Church Contacts.</p>
        <div className="admin-form-grid">
          <div className="admin-field admin-field--full">
            <ImageUploadField
              value={f('about_image_url')}
              onChange={url => set('about_image_url', url)}
              onToast={onToast}
              label="About section image"
            />
            <p className="admin-form__hint">This image is included in the homepage photo rotation. Add more active photos in the Gallery tab.</p>
          </div>
        </div>
      </div>
      <div className="admin-card admin-form-card">
        <h3>Scripture Banner</h3>
        <p className="admin-form__hint">Edit the Scripture text and reference in the About Page tab.</p>
        <div className="admin-form-grid">
          {role === 'owner' && <div className="admin-field admin-field--full">
            <ImageUploadField value={f('scripture_banner_image_url')} onChange={url => set('scripture_banner_image_url', url)} onToast={onToast} label="Scripture banner URL or local upload" />
          </div>}
        </div>
      </div>
      <div className="admin-card admin-form-card">
        <h3>Map & Location</h3>
        <div className="admin-form-grid">
          <div className="admin-field admin-field--full"><label>Map address override (optional)</label><input name="map_address" aria-label="Map address override" value={f('map_address')} onChange={e => set('map_address', e.target.value)} placeholder="Leave blank to use the church address above" /></div>
          <div className="admin-field admin-field--full"><label>Google Maps embed URL (optional)</label><input name="map_embed_url" aria-label="Google Maps embed URL" type="url" value={f('map_embed_url')} onChange={e => set('map_embed_url', e.target.value)} placeholder="Leave blank to map the church address automatically" /></div>
        </div>
      </div>
      <div className="admin-form-actions">
        <button className="admin-btn admin-btn--primary" onClick={save} disabled={saving}>{saving ? <Loader2 size={14} className="admin-spin" /> : <Save size={14} />} Save all</button>
      </div>
    </div>
  );
}

function GivingTab({ settings, onSave, onToast, saving, role, canUploadMedia }: {
  settings: SiteSettings;
  onSave: (updates: SiteSettings) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
  saving: boolean;
  role: string;
  canUploadMedia: boolean;
}) {
  const [form, setForm] = useState({ ...settings });
  useEffect(() => { setForm(current => ({ ...current, ...settings })); }, [settings]);
  const f = (key: string) => form[key] || '';
  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));
  const isOwner = role === 'owner';
  const save = () => {
    const imageUrl = f('give_image_url');
    if (imageUrl && !isSafeMediaSource(imageUrl)) {
      onToast('error', 'Use a valid HTTPS image URL or a local church image.');
      return;
    }
    if (f('give_campaign_title').length > 120 || f('give_reason').length > 2000) {
      onToast('error', 'Keep the fundraising heading under 120 characters and description under 2,000 characters.');
      return;
    }
    onSave(form);
  };

  return (
    <div className="admin-section">
      <div className="admin-section__header">
        <div>
          <h2 className="admin-section__title">Giving &amp; Fundraising</h2>
          <p className="admin-form__hint">Explain what gifts support and configure the payment details visitors see.</p>
        </div>
      </div>
      <div className="admin-card admin-form-card">
        <h3>Fundraising purpose</h3>
        <div className="admin-form-grid">
          <div className="admin-field admin-field--full">
            <label htmlFor="give-campaign-title">Heading (optional)</label>
            <input id="give-campaign-title" name="give_campaign_title" value={f('give_campaign_title')} onChange={event => set('give_campaign_title', event.target.value)} placeholder="What your giving supports" maxLength={120} />
          </div>
          <div className="admin-field admin-field--full">
            <label htmlFor="give-reason">Why we are raising funds / what gifts support</label>
            <textarea id="give-reason" name="give_reason" value={f('give_reason')} onChange={event => set('give_reason', event.target.value)} rows={4} maxLength={2000} placeholder="Share the purpose of this fundraising or how donations will support the ministry." />
          </div>
          <div className="admin-field admin-field--full">
            {canUploadMedia ? (
              <ImageUploadField value={f('give_image_url')} onChange={url => set('give_image_url', url)} onToast={onToast} label="Optional fundraising picture" />
            ) : (
              <>
                <label htmlFor="give-image-url">Optional fundraising picture URL</label>
                <input id="give-image-url" name="give_image_url" type="url" value={f('give_image_url')} onChange={event => set('give_image_url', event.target.value)} placeholder="https://..." />
                <p className="admin-form__hint">Ask a Super Admin or Media editor to upload a picture if you do not have a secure image URL.</p>
              </>
            )}
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="admin-card admin-form-card">
          <h3>Super Admin controls</h3>
          <div className="admin-form-grid">
            <label className="admin-check admin-field--full">
              <input name="give_enabled" type="checkbox" checked={f('give_enabled') === 'true'} onChange={event => set('give_enabled', String(event.target.checked))} />
              Show the Give button in the website navigation
            </label>
            <label className="admin-check admin-field--full">
              <input name="give_editor_details_enabled" type="checkbox" checked={f('give_editor_details_enabled') === 'true'} onChange={event => set('give_editor_details_enabled', String(event.target.checked))} />
              Allow admins with Site Info permission to edit fundraising details and payment account information
            </label>
            <label className="admin-check">
              <input name="give_mtn_enabled" type="checkbox" checked={f('give_mtn_enabled') === 'true'} onChange={event => set('give_mtn_enabled', String(event.target.checked))} />
              Show MTN Mobile Money
            </label>
            <label className="admin-check">
              <input name="give_airtel_enabled" type="checkbox" checked={f('give_airtel_enabled') === 'true'} onChange={event => set('give_airtel_enabled', String(event.target.checked))} />
              Show Airtel Money
            </label>
            <label className="admin-check">
              <input name="give_bank_enabled" type="checkbox" checked={f('give_bank_enabled') === 'true'} onChange={event => set('give_bank_enabled', String(event.target.checked))} />
              Show bank transfer
            </label>
          </div>
        </div>
      )}

      {!isOwner && <p className="admin-form__hint">A Super Admin enabled access to this section. Give button visibility and payment methods remain controlled by a Super Admin.</p>}

      <div className="admin-card admin-form-card">
        <h3>Payment methods</h3>
        <div className="admin-form-grid">
          {(isOwner || settings.give_mtn_enabled === 'true') && <>
            <div className="admin-field"><label htmlFor="give-mtn-number">MTN Mobile Money number</label><input id="give-mtn-number" name="give_mtn_number" value={f('give_mtn_number')} onChange={event => set('give_mtn_number', event.target.value)} /></div>
            <div className="admin-field"><label htmlFor="give-mtn-name">MTN account name</label><input id="give-mtn-name" name="give_mtn_name" value={f('give_mtn_name')} onChange={event => set('give_mtn_name', event.target.value)} /></div>
          </>}
          {(isOwner || settings.give_airtel_enabled === 'true') && <>
            <div className="admin-field"><label htmlFor="give-airtel-number">Airtel Money number</label><input id="give-airtel-number" name="give_airtel_number" value={f('give_airtel_number')} onChange={event => set('give_airtel_number', event.target.value)} /></div>
            <div className="admin-field"><label htmlFor="give-airtel-name">Airtel account name</label><input id="give-airtel-name" name="give_airtel_name" value={f('give_airtel_name')} onChange={event => set('give_airtel_name', event.target.value)} /></div>
          </>}
          {(isOwner || settings.give_bank_enabled === 'true') && <>
            <div className="admin-field"><label htmlFor="give-bank-name">Bank name</label><input id="give-bank-name" name="give_bank_name" value={f('give_bank_name')} onChange={event => set('give_bank_name', event.target.value)} /></div>
            <div className="admin-field"><label htmlFor="give-bank-account-name">Bank account name</label><input id="give-bank-account-name" name="give_bank_account_name" value={f('give_bank_account_name')} onChange={event => set('give_bank_account_name', event.target.value)} /></div>
            <div className="admin-field"><label htmlFor="give-bank-account-number">Bank account number</label><input id="give-bank-account-number" name="give_bank_account_number" value={f('give_bank_account_number')} onChange={event => set('give_bank_account_number', event.target.value)} /></div>
            <div className="admin-field"><label htmlFor="give-bank-branch">Bank branch (optional)</label><input id="give-bank-branch" name="give_bank_branch" value={f('give_bank_branch')} onChange={event => set('give_bank_branch', event.target.value)} /></div>
          </>}
        </div>
        <div className="admin-form-actions">
          <button className="admin-btn admin-btn--primary" onClick={save} disabled={saving}>
            {saving ? <Loader2 size={14} className="admin-spin" /> : <Save size={14} />} Save giving details
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Hero tab ── */
function HeroTab({ settings, onSave, onToast, saving }: {
  settings: SiteSettings;
  onSave: (u: SiteSettings) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({ ...settings });
  useEffect(() => { setForm(s => ({ ...s, ...settings })); }, [settings]);
  const f = (k: string) => form[k] || '';
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const save = () => {
    if (f('hero_photo_url') && !isSafeMediaSource(f('hero_photo_url'))) {
      onToast('error', 'Use a valid HTTPS media URL or a local church asset.');
      return;
    }
    onSave(form);
  };
  return (
    <div className="admin-section">
      <h2 className="admin-section__title">Hero Section</h2>
      <div className="admin-card admin-form-card">
        <div className="admin-form-grid">
          <div className="admin-field admin-field--full"><label>Welcome eyebrow text</label><input name="hero_welcome" aria-label="Welcome eyebrow text" value={f('hero_welcome')} onChange={e => set('hero_welcome', e.target.value)} placeholder={`Welcome to ${settings.church_name || 'our church'}`} /></div>
          <div className="admin-field admin-field--full">
            <label>Main headline</label>
            <textarea name="hero_headline" aria-label="Main headline" value={f('hero_headline')} onChange={e => set('hero_headline', e.target.value)} rows={2} placeholder="Go and Make Disciples of All Nations" />
          </div>
          <div className="admin-field admin-field--full">
            <label>Highlighted phrase</label>
            <input name="hero_highlight" aria-label="Highlighted phrase" value={f('hero_highlight')} onChange={e => set('hero_highlight', e.target.value)} placeholder="Enter the exact words to highlight" />
            <p className="admin-form__hint">This exact phrase is highlighted in the homepage heading. Leave blank for no highlight.</p>
          </div>
          <div className="admin-field admin-field--full">
            <label>Outlined phrase</label>
            <input name="hero_outline_text" aria-label="Outlined phrase" value={f('hero_outline_text')} onChange={e => set('hero_outline_text', e.target.value)} placeholder="A Calling" />
            <p className="admin-form__hint">This phrase receives the outlined style shown in the homepage design.</p>
          </div>
          <div className="admin-field admin-field--full"><label>Subheading</label><textarea name="hero_subheading" aria-label="Subheading" value={f('hero_subheading')} onChange={e => set('hero_subheading', e.target.value)} rows={3} /></div>
          <div className="admin-field"><label>Primary CTA label</label><input name="hero_cta_primary_label" aria-label="Primary CTA label" value={f('hero_cta_primary_label')} onChange={e => set('hero_cta_primary_label', e.target.value)} /></div>
          <div className="admin-field"><label>Primary CTA link</label><input name="hero_cta_primary_href" aria-label="Primary CTA link" value={f('hero_cta_primary_href')} onChange={e => set('hero_cta_primary_href', e.target.value)} /></div>
          <div className="admin-field"><label>Secondary CTA label</label><input name="hero_cta_secondary_label" aria-label="Secondary CTA label" value={f('hero_cta_secondary_label')} onChange={e => set('hero_cta_secondary_label', e.target.value)} /></div>
          <div className="admin-field"><label>Secondary CTA link</label><input name="hero_cta_secondary_href" aria-label="Secondary CTA link" value={f('hero_cta_secondary_href')} onChange={e => set('hero_cta_secondary_href', e.target.value)} /></div>
          <div className="admin-field admin-field--full">
            <ImageUploadField
              value={f('hero_photo_url')}
              onChange={url => set('hero_photo_url', url)}
              onToast={onToast}
              label="Hero background image or video"
              allowVideo
            />
            <p className="admin-form__hint">Upload an image or a short MP4/WebM video, or paste a media URL. Images are limited to 10MB and videos to 50MB.</p>
          </div>
        </div>
        <div className="admin-form-actions">
          <button className="admin-btn admin-btn--primary" onClick={save} disabled={saving}>{saving ? <Loader2 size={14} className="admin-spin" /> : <Save size={14} />} Save hero</button>
        </div>
      </div>
    </div>
  );
}

/* ── Social tab ── */
function SocialTab({ settings, onSave, onToast, saving }: {
  settings: SiteSettings;
  onSave: (u: SiteSettings) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({ ...settings });
  useEffect(() => { setForm(s => ({ ...s, ...settings })); }, [settings]);
  const f = (k: string) => form[k] || '';
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const save = () => {
    for (const { key } of SOCIAL_PLATFORMS) {
      if (f(key) && !parseHttpsMediaUrl(f(key))) {
        onToast('error', 'Social links must use secure HTTPS URLs.');
        return;
      }
    }
    onSave(form);
  };
  return (
    <div className="admin-section">
      <h2 className="admin-section__title">Social Links</h2>
      <div className="admin-card admin-form-card" style={{ maxWidth: '560px' }}>
        <p className="admin-form__hint">Social logos appear in the website footer and Contact page. Add each account&apos;s secure https:// URL here to activate its link.</p>
        <div className="admin-form-grid">
          <div className="admin-field admin-field--full">
            <label className="admin-check">
              <input name="stay_connected_enabled" type="checkbox" checked={f('stay_connected_enabled') !== 'false'} onChange={e => set('stay_connected_enabled', String(e.target.checked))} />
              Show the Stay Connected section in the footer
            </label>
          </div>
          {SOCIAL_PLATFORMS.map(({ key, platform, label }) => (
            <div key={key} className="admin-field admin-field--full">
              <label className="flex items-center gap-2">
                <SocialPlatformIcon platform={platform} size={16} />
                {label} URL
              </label>
              <input name={key} aria-label={`${label} URL`} type="url" value={f(key)} onChange={e => set(key, e.target.value)} placeholder="https://..." />
            </div>
          ))}
        </div>
        <div className="admin-form-actions">
          <button className="admin-btn admin-btn--primary" onClick={save} disabled={saving}>{saving ? <Loader2 size={14} className="admin-spin" /> : <Save size={14} />} Save links</button>
        </div>
      </div>
    </div>
  );
}
