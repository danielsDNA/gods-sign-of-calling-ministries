/* === SECTION: Footer === */
/*
 * Rich Multi-Column Footer
 * - Logo + tagline + social icons (col 1)
 * - Quick links (col 2)
 * - Service times + contact info (col 3)
 * - Configurable social links in the Stay Connected section (col 4)
 * - Auto-captured current year in copyright
 * - Deep charcoal background with amber accents
 */

import { Link } from 'react-router';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import { SocialMediaLinks } from '@/components/SocialMediaLinks';
import { churchContactHref, useChurchContacts } from '@/hooks/useChurchContacts';

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Sermons', href: '/sermons' },
  { label: 'Events', href: '/events' },
  { label: 'Ministries', href: '/ministries' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { settings, serviceTimes } = useSiteSettings();
  const { contacts } = useChurchContacts(settings);
  return (
    <footer style={{ background: 'hsl(var(--surface-dark))', color: 'hsl(var(--surface-dark-fg))' }}>

      {/* ── Main grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Col 1: Logo + tagline */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              {settings.logo_url ? <img
                src={settings.logo_url}
                alt={`${settings.church_name || "God's Sign of Calling Revival Ministries"} logo`}
                className="block h-auto max-h-10 w-auto max-w-[160px] object-contain self-center"
              /> : <span className="text-sm font-bold" style={{ color: 'hsl(var(--surface-dark-fg))', fontFamily: 'var(--font-hero)' }}>{settings.church_name}</span>}
            </Link>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'hsl(var(--surface-dark-muted))' }}>
              {settings.tagline}
            </p>
          </div>

          {/* Col 2: Quick links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{ color: 'hsl(var(--primary))' }}>
              Quick Links
            </h3>
            <nav aria-label="Footer links">
              <ul className="space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm transition-colors duration-200 footer-link"
                      style={{ color: 'hsl(var(--surface-dark-muted))' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Col 3: Service times + contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{ color: 'hsl(var(--primary))' }}>
              Service Times
            </h3>
            <ul className="space-y-3 mb-6">
              {serviceTimes.map((s, i) => (
                <li key={i} className="text-sm" style={{ color: 'hsl(var(--surface-dark-muted))' }}>
                  <span className="font-medium" style={{ color: 'hsl(var(--surface-dark-fg))' }}>
                    {s.label}
                  </span>
                  <br />
                  {s.day} · {s.time}
                </li>
              ))}
            </ul>
            <div className="space-y-2">
              {contacts.map(contact => {
                const href = churchContactHref(contact);
                const Icon = contact.kind === 'phone'
                  ? Phone
                  : contact.kind === 'email'
                    ? Mail
                    : contact.kind === 'address'
                      ? MapPin
                      : Globe;
                const content = <><Icon size={14} /><span>{contact.value}</span></>;
                return href ? (
                  <a
                    key={contact.id}
                    href={href}
                    target={contact.kind === 'website' || contact.kind === 'whatsapp' ? '_blank' : undefined}
                    rel={contact.kind === 'website' || contact.kind === 'whatsapp' ? 'noopener noreferrer' : undefined}
                    aria-label={`${contact.label}: ${contact.value}`}
                    className="flex items-center gap-2 text-sm transition-colors duration-200 footer-link"
                    style={{ color: 'hsl(var(--surface-dark-muted))' }}
                  >
                    {content}
                  </a>
                ) : (
                  <p key={contact.id} className="flex items-start gap-2 text-sm" style={{ color: 'hsl(var(--surface-dark-muted))' }}>
                    {content}
                  </p>
                );
              })}
            </div>
          </div>

          {settings.stay_connected_enabled !== 'false' && <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{ color: 'hsl(var(--primary))' }}>
              Stay Connected
            </h3>
            <p className="text-sm mb-4" style={{ color: 'hsl(var(--surface-dark-muted))' }}>
              Follow us for church news, upcoming events, and messages.
            </p>
            <SocialMediaLinks
              settings={settings}
              className="flex flex-wrap gap-3"
              linkClassName="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              linkStyle={{
                background: 'var(--social-bg)',
                color: 'hsl(var(--surface-dark-muted))',
              }}
              iconSize={19}
            />
          </div>}
        </div>
      </div>

      {/* ── Bottom bar with auto year ── */}
      <div style={{ borderTop: '1px solid var(--glass-dark-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: 'hsl(var(--surface-dark-subtle))' }}>
            © {currentYear} {settings.church_name}. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'hsl(var(--surface-dark-subtle))' }}>
            Built with faith &amp; purpose.
          </p>
          <Link to="/privacy" className="text-xs underline underline-offset-4 footer-link" style={{ color: 'hsl(var(--surface-dark-subtle))' }}>Privacy Policy</Link>
        </div>
      </div>

      {/* Footer hover styles */}
      <style>{`
        .footer-link:hover { color: hsl(var(--primary)) !important; }
      `}</style>
    </footer>
  );
}
