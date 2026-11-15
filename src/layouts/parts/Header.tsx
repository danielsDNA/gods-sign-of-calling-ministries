/* === SECTION: Navigation === */
/*
 * Glass Morphism Sticky Header
 * - Glass effect that becomes more opaque on scroll
 * - Logo left, nav links center, CTA right
 * - "Give" button dormant with "Coming Soon" tooltip
 * - Mobile hamburger with slide-down glass panel
 * - Amber underline hover effect on nav links
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Church, Landmark, Menu, X } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { fetchPublicJson } from '@/lib/public-api-cache';
import { sanitizeRichTextHtml } from '@/lib/content-text';

interface PublicEvent {
  id: number;
  title: string;
  description: string | null;
  startsAt: string;
  location: string | null;
  imageUrl: string | null;
}

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Sermons', href: '/sermons' },
  { label: 'Events', href: '/events' },
  { label: 'Ministries', href: '/ministries' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showGiveDialog, setShowGiveDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [awarenessEvent, setAwarenessEvent] = useState<PublicEvent | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const awarenessHandled = useRef(false);
  const location = useLocation();
  const { settings, loaded } = useSiteSettings();
  const isLive = settings.is_live === 'true';
  const paymentMethods = [
    {
      id: 'mtn',
      enabled: settings.give_mtn_enabled === 'true',
      title: 'MTN Mobile Money',
      details: [
        ['Merchant / MoMo code', settings.give_mtn_code],
        ['Mobile number', settings.give_mtn_number],
        ['Registered name', settings.give_mtn_name],
      ].filter((entry): entry is [string, string] => Boolean(entry[1])),
    },
    {
      id: 'airtel',
      enabled: settings.give_airtel_enabled === 'true',
      title: 'Airtel Money',
      details: [
        ['Merchant / MoMo code', settings.give_airtel_code],
        ['Mobile number', settings.give_airtel_number],
        ['Registered name', settings.give_airtel_name],
      ].filter((entry): entry is [string, string] => Boolean(entry[1])),
    },
    {
      id: 'bank',
      enabled: settings.give_bank_enabled === 'true',
      title: 'Bank transfer',
      details: [
        ['Bank', settings.give_bank_name],
        ['Account name', settings.give_bank_account_name],
        ['Account number', settings.give_bank_account_number],
        ['Branch', settings.give_bank_branch],
      ].filter((entry): entry is [string, string] => Boolean(entry[1])),
    },
  ].filter(method => method.enabled && method.details.length > 0);

  useEffect(() => {
    if (!loaded || awarenessHandled.current) return;
    awarenessHandled.current = true;

    const showGivingAwareness = () => {
      if (settings.give_enabled !== 'true' || settings.give_popup_enabled !== 'true') return;
      const storageKey = 'gsc-give-awareness';
      if (window.localStorage.getItem(storageKey)) return;
      window.localStorage.setItem(storageKey, 'shown');
      setSelectedPaymentMethod(
        settings.give_mtn_enabled === 'true' ? 'mtn'
          : settings.give_airtel_enabled === 'true' ? 'airtel'
            : settings.give_bank_enabled === 'true' ? 'bank' : '',
      );
      window.setTimeout(() => setShowGiveDialog(true), 1200);
    };

    if (settings.event_popup_enabled !== 'true') {
      showGivingAwareness();
      return;
    }

    void fetchPublicJson('/api/events')
      .then(result => {
        if (!Array.isArray(result)) throw new Error('The server returned invalid event data.');
        const events = result as PublicEvent[];
        const now = Date.now();
        const nextEvent = events
          .filter(event => new Date(event.startsAt).getTime() > now)
          .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())[0];
        if (!nextEvent) {
          showGivingAwareness();
          return;
        }

        const storageKey = `gsc-event-awareness-${nextEvent.id}`;
        if (window.localStorage.getItem(storageKey)) {
          showGivingAwareness();
          return;
        }
        window.localStorage.setItem(storageKey, 'shown');
        setAwarenessEvent(nextEvent);
        window.setTimeout(() => setShowEventDialog(true), 1200);
      })
      .catch(error => {
        console.error('Unable to prepare the first-visit event announcement:', error);
        showGivingAwareness();
      });
  }, [
    loaded,
    settings.event_popup_enabled,
    settings.give_airtel_enabled,
    settings.give_bank_enabled,
    settings.give_enabled,
    settings.give_mtn_enabled,
    settings.give_popup_enabled,
  ]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let favicon = document.querySelector('link[rel~="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.setAttribute('rel', 'icon');
      document.head.appendChild(favicon);
    }
    favicon.setAttribute('href', settings.logo_url || '/favicon.svg');
  }, [settings.logo_url]);

  return (
    <>
      {/* ── Header bar ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: 'hsl(var(--surface-dark))',
          backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))',
          borderBottom: '1px solid #b7e849',
          boxShadow: scrolled ? 'var(--glass-shadow)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <Link to="/" className="brand-logo-plaque flex items-center shrink-0 min-w-0" aria-label="Home">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={`${settings.church_name || "God's Sign of Calling Revival Ministries"} logo`}
                  className="block h-auto max-h-10 w-auto max-w-[96px] object-contain self-center sm:max-w-[140px]"
                />
              ) : (
                <Church className="h-9 w-9 shrink-0 text-[hsl(var(--primary-light))]" aria-hidden="true" />
              )}
            </Link>

            {/* Desktop Nav */}
            <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="nav-link relative px-3 py-2 text-sm font-medium transition-colors duration-200"
                    style={{
                      color: isActive
                        ? 'hsl(var(--primary-light))'
                        : 'hsl(var(--surface-dark-fg))',
                    }}
                  >
                    {link.label}
                    {/* Amber underline — draws from left on hover via CSS */}
                    <span className="nav-underline absolute bottom-0 left-3 right-3 h-0.5 rounded-full origin-left scale-x-0 transition-transform duration-300"
                      style={{ background: 'hsl(var(--primary-light))' }}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Live badge — shown only when isLive: true in church config */}
              {isLive && (
                <a
                  href={settings.live_stream_url}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                  style={{ background: 'hsl(var(--destructive))' }}
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Live Now
                </a>
              )}

              {settings.give_enabled === 'true' && <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPaymentMethod(paymentMethods[0]?.id || '');
                    setShowGiveDialog(true);
                  }}
                  className="px-5 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    background: 'hsl(var(--primary-light))',
                    color: 'hsl(var(--surface-dark))',
                  }}
                >
                  Give
                </button>
              </div>}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg transition-colors duration-200"
              style={{ color: 'hsl(var(--surface-dark-fg))' }}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile slide-down glass panel ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' as const }}
            className="fixed top-16 left-0 right-0 z-40 lg:hidden"
            style={{
              background: 'hsl(var(--surface-dark))',
              backdropFilter: 'blur(var(--glass-blur))',
              WebkitBackdropFilter: 'blur(var(--glass-blur))',
              borderBottom: '1px solid #8eb69b',
              boxShadow: 'var(--glass-shadow)',
            }}
          >
            <nav aria-label="Mobile navigation" className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, ease: 'easeOut' as const }}
                >
                  <Link
                    to={link.href}
                    className="block px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200"
                    style={{
                      color:
                        location.pathname === link.href
                          ? 'hsl(var(--primary-light))'
                          : 'hsl(var(--surface-dark-fg))',
                      background:
                        location.pathname === link.href
                          ? 'hsl(var(--surface-dark-subtle) / 0.18)'
                          : 'transparent',
                    }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              {settings.give_enabled === 'true' && <div className="pt-2 pb-1 border-t mt-2 border-border">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setSelectedPaymentMethod(paymentMethods[0]?.id || '');
                    setShowGiveDialog(true);
                  }}
                  className="w-full py-3 rounded-lg text-sm font-semibold"
                  style={{
                    background: 'hsl(var(--primary-light))',
                    color: 'hsl(var(--surface-dark))',
                  }}
                >
                  Give
                </button>
              </div>}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGiveDialog && (
          <motion.div
            className="give-modal-overlay"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={event => {
              if (event.target === event.currentTarget) setShowGiveDialog(false);
            }}
          >
            <motion.section
              className="give-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="give-modal-title"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
            >
              <button className="give-modal__close" type="button" aria-label="Close giving details" onClick={() => setShowGiveDialog(false)}>
                <X size={20} />
              </button>
              <h2 id="give-modal-title" className="sr-only">Give to {settings.church_name || 'the church'}</h2>
              <div className="give-campaign-banner">
                {settings.logo_url
                  ? <img src={settings.logo_url} alt="" className="give-campaign-banner__logo" />
                  : <Church className="give-campaign-banner__logo" style={{ color: '#174b20' }} aria-hidden="true" />}
                <div className="give-campaign-banner__title">
                  <span>Fund</span>
                  <span>Raising</span>
                </div>
                {settings.give_image_url && (
                  <img
                    src={settings.give_image_url}
                    alt={settings.give_campaign_title || 'Fundraising campaign'}
                    className="give-campaign-banner__image"
                  />
                )}
              </div>
              <p className="give-campaign-banner__church">{settings.church_name || 'God’s Sign of Calling Revival Ministries'}</p>
              {(settings.give_campaign_title || settings.give_reason || settings.give_image_url) && (
                <div className="give-campaign">
                  {settings.give_campaign_title && <h3>{settings.give_campaign_title}</h3>}
                  {settings.give_reason && (
                    <div className="give-rich-text" dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(settings.give_reason) }} />
                  )}
                </div>
              )}
              {settings.give_payment_instructions && (
                <div className="give-campaign give-payment-instructions">
                  <h3>How to give</h3>
                  <div className="give-rich-text" dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(settings.give_payment_instructions) }} />
                </div>
              )}
              {paymentMethods.length > 0 ? (
                <div className="give-payment-panel">
                  <div className="give-payment-panel__label">Select transaction method</div>
                  <div className="give-payment-methods" role="group" aria-label="Transaction method">
                    {paymentMethods.map(method => (
                      <button
                        key={method.id}
                        type="button"
                        className={`give-payment-choice ${selectedPaymentMethod === method.id ? 'is-selected' : ''}`}
                        aria-pressed={selectedPaymentMethod === method.id}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        {method.id === 'airtel' ? (
                          <span className="give-brand-mark give-brand-mark--airtel" aria-hidden="true">airtel</span>
                        ) : method.id === 'mtn' ? (
                          <span className="give-brand-mark give-brand-mark--mtn" aria-hidden="true">MTN</span>
                        ) : (
                          <Landmark size={22} aria-hidden="true" />
                        )}
                        <span>{method.title}</span>
                      </button>
                    ))}
                  </div>
                  {paymentMethods.filter(method => method.id === selectedPaymentMethod).map(method => (
                    <section key={method.id} className="give-method">
                      <h3>{method.title} payment details</h3>
                      <dl>
                        {method.details.map(([label, value]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))}
                </div>
              ) : (
                <p className="give-modal__empty">Giving details are being prepared. Please contact the church for assistance.</p>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEventDialog && awarenessEvent && (
          <motion.div
            className="give-modal-overlay"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={event => {
              if (event.target === event.currentTarget) setShowEventDialog(false);
            }}
          >
            <motion.section
              className="give-modal event-awareness-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="event-awareness-title"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
            >
              <button className="give-modal__close" type="button" aria-label="Close event announcement" onClick={() => setShowEventDialog(false)}>
                <X size={20} />
              </button>
              <p className="event-awareness-modal__eyebrow">Upcoming at {settings.church_name || 'our church'}</p>
              <h2 id="event-awareness-title">{awarenessEvent.title}</h2>
              {awarenessEvent.imageUrl && <img className="event-awareness-modal__image" src={awarenessEvent.imageUrl} alt="" />}
              <p className="event-awareness-modal__date">{new Date(awarenessEvent.startsAt).toLocaleString()}</p>
              {awarenessEvent.location && <p className="event-awareness-modal__location">{awarenessEvent.location}</p>}
              {awarenessEvent.description && <p className="event-awareness-modal__description">{awarenessEvent.description.replace(/<[^>]*>/g, ' ')}</p>}
              <Link className="admin-btn admin-btn--primary event-awareness-modal__link" to="/events" onClick={() => setShowEventDialog(false)}>
                View all events
              </Link>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav hover underline CSS */}
      <style>{`
        .nav-link:hover .nav-underline,
        .nav-link:focus-visible .nav-underline {
          transform: scaleX(1);
        }
      `}</style>
    </>
  );
}
