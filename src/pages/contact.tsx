import { contact as defaultContact } from 'virtual:content';
/*
 * ============================================================
 * CHURCH CONTACT PAGE
 * ============================================================
 * Sections:
 *   1. Page Hero — title + breadcrumb
 *   2. Two-column layout:
 *        Left  — Inquiry form (saved to the church database)
 *        Right — Contact info, service times, map embed
 *   3. Find Us strip — address + directions CTA
 *
 * Form POSTs to /api/contact-messages
 * ============================================================
 */

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronRight,
  Send,
  CheckCircle,
  AlertCircle,
  Globe,
} from 'lucide-react';

import { useSiteSettings } from '@/hooks/useSiteSettings';
import { churchContactHref, useChurchContacts } from '@/hooks/useChurchContacts';
import { usePageContent } from '@/hooks/usePageContent';
import { churchConfig } from '@/config/church';
import ScrollReveal from '@/components/ScrollReveal';
import { SocialMediaLinks } from '@/components/SocialMediaLinks';
import { getSocialMediaLinks } from '@/lib/social-media';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { buildPageSeoUrls } from '@/lib/seo-url';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

function safeMapEmbedUrl(value: string, address: string): string {
  try {
    const url = new globalThis.URL(value);
    if (
      url.protocol === 'https:' &&
      ['maps.google.com', 'www.google.com'].includes(url.hostname) &&
      url.pathname.startsWith('/maps')
    ) {
      return url.toString();
    }
  } catch {
    // Generate the default map from the editable church address below.
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

export default function ContactPage() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [notificationSent, setNotificationSent] = useState(false);
  const { settings, serviceTimes } = useSiteSettings();
  const hasSocialLinks = getSocialMediaLinks(settings).length > 0;
  const seoUrls = buildPageSeoUrls(useJsonLdSiteUrl(), '/contact');
  const { contacts } = useChurchContacts(settings);
  const { content: contact } = usePageContent('contact', defaultContact);
  const addresses = contacts.filter(item => item.kind === 'address');
  const mapAddress = settings.map_address || addresses.find(item => item.primary)?.value || addresses[0]?.value || settings.address || churchConfig.address;
  const mapEmbedUrl = safeMapEmbedUrl(settings.map_embed_url, mapAddress);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    const formData = new FormData(form);
    // Honeypot check — bail silently if filled by a bot
    if (formData.get('_gotcha')) return;

    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();
    const topic = String(formData.get('topic') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();

    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, topic, message }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setNotificationSent(json.notificationSent === true);
        setStatus('success');
        form.reset();
      } else {
        throw new Error(json.error || 'Unable to send your message. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    }
  }

  return (
    <>
      <Helmet>
        <title>Contact Us — {settings.church_name}</title>
        <meta
          name="description"
          content={`Get in touch with ${settings.church_name}. Send us a message, find our service times, or get directions to our location.`}
        />
        {seoUrls.pageUrl && <link rel="canonical" href={seoUrls.pageUrl} />}
        <meta property="og:title" content={`Contact Us — ${settings.church_name}`} />
        <meta
          property="og:description"
          content={`Get in touch with ${settings.church_name}. We'd love to hear from you.`}
        />
        <meta property="og:type" content="website" />
        {seoUrls.pageUrl && <meta property="og:url" content={seoUrls.pageUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          '@id': seoUrls.webpageId,
          name: `Contact Us — ${settings.church_name}`,
          url: seoUrls.pageUrl,
          isPartOf: { '@id': seoUrls.websiteId },
          about: { '@id': seoUrls.organizationId },
        }).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main>

        {/* ================================================================
            SECTION: Page Hero
        ================================================================ */}
        <section
          className="relative pt-32 pb-16 overflow-hidden"
          style={{ background: 'hsl(var(--surface-alt))' }}
        >
          {/* Decorative amber blob */}
          <div
            className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'hsl(var(--primary) / 0.07)' }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm mb-6">
              <Link
                to="/"
                className="transition-colors duration-200 hover:underline"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                Home
              </Link>
              <ChevronRight size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span style={{ color: 'hsl(var(--primary))' }}>Contact</span>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' as const }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: 'hsl(var(--primary))' }}
              >
                We'd Love to Hear From You
              </p>
              <h1
                className="text-4xl sm:text-5xl font-bold mb-4"
                style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
              >
                Get in Touch
              </h1>
              <p
                className="text-base sm:text-lg max-w-2xl leading-relaxed"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                Whether you have a question, a prayer request, or just want to say hello — our
                doors and hearts are always open.
              </p>
            </motion.div>
          </div>
        </section>


        {/* ================================================================
            SECTION: Form + Info two-column
        ================================================================ */}
        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

              {/* ── LEFT: Inquiry Form ── */}
              <ScrollReveal direction="left">
                <div
                  className="rounded-2xl p-8 sm:p-10"
                  style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                  >
                    Send Us a Message
                  </h2>
                  <p className="text-sm mb-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    We'll get back to you within 24 hours.
                  </p>

                  {/* Success state */}
                  {status === 'success' ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center text-center py-12 gap-4"
                    >
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ background: 'hsl(var(--primary) / 0.12)' }}
                      >
                        <CheckCircle size={32} style={{ color: 'hsl(var(--primary))' }} />
                      </div>
                      <h3
                        className="text-xl font-bold"
                        style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                      >
                        Message Sent!
                      </h3>
                      <p className="text-sm max-w-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {notificationSent
                          ? "Thank you for reaching out. Your message has been received, and we'll be in touch soon. God bless you!"
                          : 'Your message was saved. Our team can review it in Requests; email notification could not be sent.'}
                      </p>
                      <button
                        onClick={() => { setStatus('idle'); setNotificationSent(false); }}
                        className="mt-2 text-sm font-semibold underline underline-offset-2"
                        style={{ color: 'hsl(var(--primary))' }}
                      >
                        Send another message
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                      {/* Honeypot — hidden from real users, never sent in POST body */}
                      <input
                        type="text"
                        name="_gotcha"
                        tabIndex={-1}
                        autoComplete="off"
                        style={{ position: 'absolute', left: '-9999px' }}
                        aria-hidden="true"
                      />

                      {/* Name + Email row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor="contact-name"
                            className="text-sm font-medium"
                            style={{ color: 'hsl(var(--foreground))' }}
                          >
                            Full Name <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                          </label>
                          <input
                            id="contact-name"
                            name="name"
                            type="text"
                            required
                            placeholder="Your name"
                            className="px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2"
                            style={{
                              background: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              color: 'hsl(var(--foreground))',
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor="contact-email"
                            className="text-sm font-medium"
                            style={{ color: 'hsl(var(--foreground))' }}
                          >
                            Email Address <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                          </label>
                          <input
                            id="contact-email"
                            name="email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2"
                            style={{
                              background: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              color: 'hsl(var(--foreground))',
                            }}
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="contact-phone"
                          className="text-sm font-medium"
                          style={{ color: 'hsl(var(--foreground))' }}
                        >
                          Phone Number{' '}
                          <span className="text-xs font-normal" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            (optional)
                          </span>
                        </label>
                        <input
                          id="contact-phone"
                          name="phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          className="px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2"
                          style={{
                            background: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            color: 'hsl(var(--foreground))',
                          }}
                        />
                      </div>

                      {/* Topic dropdown */}
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="contact-topic"
                          className="text-sm font-medium"
                          style={{ color: 'hsl(var(--foreground))' }}
                        >
                          What can we help with? <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                        </label>
                        <select
                          id="contact-topic"
                          name="topic"
                          required
                          defaultValue=""
                          className="px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 appearance-none"
                          style={{
                            background: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            color: 'hsl(var(--foreground))',
                          }}
                        >
                          <option value="" disabled>Select a topic…</option>
                          {contact.topics.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      {/* Message */}
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="contact-message"
                          className="text-sm font-medium"
                          style={{ color: 'hsl(var(--foreground))' }}
                        >
                          Message <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                        </label>
                        <textarea
                          id="contact-message"
                          name="message"
                          required
                          rows={5}
                          placeholder="Tell us how we can help or pray for you…"
                          className="px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 resize-none"
                          style={{
                            background: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            color: 'hsl(var(--foreground))',
                          }}
                        />
                      </div>

                      {/* Error message */}
                      {status === 'error' && (
                        <div
                          role="alert"
                          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                          style={{
                            background: 'hsl(var(--destructive) / 0.08)',
                            color: 'hsl(var(--destructive))',
                            border: '1px solid hsl(var(--destructive) / 0.2)',
                          }}
                        >
                          <AlertCircle size={16} />
                          {errorMsg}
                        </div>
                      )}

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={status === 'sending'}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{
                          background: 'hsl(var(--primary))',
                          color: 'hsl(var(--primary-foreground))',
                        }}
                      >
                        {status === 'sending' ? (
                          <>
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send size={15} />
                            Send Message
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </ScrollReveal>

              {/* ── RIGHT: Contact info + service times + map ── */}
              <ScrollReveal direction="right" delay={0.1}>
                <div className="flex flex-col gap-8">

                  {/* Contact details card */}
                  <div
                    className="rounded-2xl p-7"
                    style={{
                      background: 'hsl(var(--surface-alt))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <h2
                      className="text-lg font-bold mb-5"
                      style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                    >
                      Contact Information
                    </h2>
                    <div className="space-y-4">
                      {contacts.map(item => (
                        <div className="flex items-start gap-3" key={item.id}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                            {item.kind === 'phone'
                              ? <Phone size={16} style={{ color: 'hsl(var(--primary))' }} />
                              : item.kind === 'email'
                                ? <Mail size={16} style={{ color: 'hsl(var(--primary))' }} />
                                : item.kind === 'address'
                                  ? <MapPin size={16} style={{ color: 'hsl(var(--primary))' }} />
                                  : <Globe size={16} style={{ color: 'hsl(var(--primary))' }} />}
                          </div>
                          <div>
                            <p className="text-xs font-medium mb-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.label}</p>
                            {churchContactHref(item) ? (
                              <a
                                href={churchContactHref(item) ?? undefined}
                                target={item.kind === 'website' || item.kind === 'whatsapp' ? '_blank' : undefined}
                                rel={item.kind === 'website' || item.kind === 'whatsapp' ? 'noopener noreferrer' : undefined}
                                className="text-sm font-medium group-hover:underline"
                                style={{ color: 'hsl(var(--foreground))' }}
                              >{item.value}</a>
                            ) : (
                              <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{item.value}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {hasSocialLinks && <div className="mt-6 border-t pt-5" style={{ borderColor: 'hsl(var(--border))' }}>
                        <h3
                          className="text-sm font-semibold mb-3"
                          style={{ color: 'hsl(var(--foreground))' }}
                        >
                          Connect with us
                        </h3>
                        <SocialMediaLinks
                          settings={settings}
                          className="flex flex-wrap gap-2"
                          linkClassName="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:opacity-80"
                          linkStyle={{
                            background: 'hsl(var(--primary) / 0.1)',
                            color: 'hsl(var(--primary))',
                          }}
                          iconSize={18}
                          showLabels
                        />
                      </div>}
                    </div>
                  </div>

                  {/* Service times card */}
                  <div
                    className="rounded-2xl p-7"
                    style={{
                      background: 'hsl(var(--surface-alt))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <h2
                      className="text-lg font-bold mb-5"
                      style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                    >
                      Service Times
                    </h2>
                    <div className="space-y-4">
                      {serviceTimes.map((s, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: 'hsl(var(--primary) / 0.1)' }}
                          >
                            <Clock size={16} style={{ color: 'hsl(var(--primary))' }} />
                          </div>
                          <div>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: 'hsl(var(--foreground))' }}
                            >
                              {s.label}
                            </p>
                            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {s.day} · {s.time}{s.location ? ` · ${s.location}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Map embed placeholder */}
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ border: '1px solid hsl(var(--border))' }}
                  >
                    <iframe
                      title={`${settings.church_name} location map`}
                      src={mapEmbedUrl}
                      width="100%"
                      height="220"
                      style={{ border: 0, display: 'block' }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <div
                      className="px-5 py-3 flex items-center justify-between"
                      style={{ background: 'hsl(var(--card))' }}
                    >
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {mapAddress}
                      </p>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(mapAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold flex items-center gap-1 hover:underline"
                        style={{ color: 'hsl(var(--primary))' }}
                      >
                        Get Directions <ChevronRight size={12} />
                      </a>
                    </div>
                  </div>

                </div>
              </ScrollReveal>

            </div>
          </div>
        </section>


        {/* ================================================================
            SECTION: Find Us strip
        ================================================================ */}
        <section className="py-xl" style={{ background: 'hsl(var(--surface-alt))' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <h2
                className="text-2xl sm:text-3xl font-bold mb-3"
                style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
              >
                Come as You Are
              </h2>
              <p className="text-base mb-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
                You don't need to have it all together. Just come. There's a seat for you at{' '}
                {settings.church_name}.
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(mapAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
                style={{
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                }}
              >
                <MapPin size={16} />
                Get Directions
              </a>
            </ScrollReveal>
          </div>
        </section>

      </main>
    </>
  );
}
