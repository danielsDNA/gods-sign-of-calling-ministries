import { ministries as defaultMinistries } from 'virtual:content';
/*
 * ============================================================
 * CHURCH MINISTRIES PAGE
 * ============================================================
 * Sections:
 *   1. Page Hero  — breadcrumb + intro paragraph
 *   2. Ministry Grid — 8 cards (image, leader, schedule, CTA)
 *   3. Scripture Banner — Psalm 27:1
 *   4. Volunteer CTA — "Not Sure Where to Start?"
 *
 * Ministries load from the CMS API and fall back to src/content/pages/ministries.json.
 * ============================================================
 */

import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { ChevronRight, Clock, Calendar, Users, ArrowRight, Heart } from 'lucide-react';

import { useCmsList } from '@/hooks/useCmsList';
import { usePageContent } from '@/hooks/usePageContent';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { buildPageSeoUrls } from '@/lib/seo-url';
import ScrollReveal from '@/components/ScrollReveal';
import RichTextContent from '@/components/RichTextContent';
import { churchImageUrl } from '@/lib/church-image-url';

/* ── Types ── */
interface MinistryLeader {
  name: string;
  title: string;
  photoSlot: string;
}

interface Ministry {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageSlot: string;
  leader: MinistryLeader;
  meetingDay: string;
  meetingTime: string;
  audience: string;
}

interface VolunteerCta {
  heading: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
}

interface Scripture {
  text: string;
  reference: string;
}

export default function MinistriesPage() {
  const { content: ministries } = usePageContent('ministries', defaultMinistries);
  const { items: cmsMinistries } = useCmsList<{
    id: number;
    name: string;
    description: string | null;
    tagline: string | null;
    imageUrl: string | null;
    meetingTime: string | null;
    contactName: string | null;
  }>('/api/ministries', []);
  const { settings, serviceTimes } = useSiteSettings();
  const seoUrls = buildPageSeoUrls(useJsonLdSiteUrl(), '/ministries');
  const ministriesList: Ministry[] = cmsMinistries.length === 0
    ? ministries.ministries as Ministry[]
    : cmsMinistries.map(ministry => ({
      id: String(ministry.id),
      name: ministry.name,
      slug: ministry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      description: ministry.description || ministry.tagline || '',
      imageSlot: ministry.imageUrl || '/airo-assets/images/ministry/youth',
      leader: {
        name: ministry.contactName || '',
        title: ministry.contactName ? 'Ministry contact' : '',
        photoSlot: ministry.imageUrl || '/airo-assets/images/ministry/youth',
      },
      meetingDay: '',
      meetingTime: ministry.meetingTime || '',
      audience: 'Everyone',
    }));
  const volunteerCta = ministries.volunteerCta as VolunteerCta;
  const scripture = ministries.scripture as Scripture;

  return (
    <>
      <Helmet>
        <title>Ministries — {settings.church_name}</title>
        <meta
          name="description"
          content={`Explore the weekly programmes and community ministries at ${settings.church_name}. Join us for worship, prayer, counselling, and service.`}
        />
        {seoUrls.pageUrl && <link rel="canonical" href={seoUrls.pageUrl} />}
        <meta property="og:title" content={`Ministries — ${settings.church_name}`} />
        <meta
          property="og:description"
          content={`Find your place to serve and grow at ${settings.church_name}. Explore all our ministry groups.`}
        />
        <meta property="og:type" content="website" />
        {seoUrls.pageUrl && <meta property="og:url" content={seoUrls.pageUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': seoUrls.webpageId,
            name: `Ministries — ${settings.church_name}`,
            url: seoUrls.pageUrl,
            isPartOf: { '@id': seoUrls.websiteId },
            about: { '@id': seoUrls.organizationId },
          }).replace(/</g, '\\u003c')}
        </script>
      </Helmet>

      <main>

        {/* ================================================================
            SECTION 1: Page Hero
        ================================================================ */}
        <section
          className="relative pt-32 pb-16 overflow-hidden"
          style={{ background: 'hsl(var(--surface-alt))' }}
        >
          {/* Decorative blob */}
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
              <span style={{ color: 'hsl(var(--primary))' }}>Ministries</span>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' as const }}
              className="max-w-3xl"
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: 'hsl(var(--primary))' }}
              >
                Serve. Grow. Belong.
              </p>
              <h1
                className="text-4xl sm:text-5xl font-bold mb-5"
                style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
              >
                Our Ministries
              </h1>
              <p
                className="text-base sm:text-lg leading-relaxed"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                {ministries.intro}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-start">
            <ScrollReveal>
              <div className="lg:sticky lg:top-28">
                <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'hsl(var(--primary))' }}>
                  Weekly &amp; monthly programmes
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold mb-5" style={{ color: 'hsl(var(--foreground))' }}>
                  Gather, grow, and serve
                </h2>
                <p className="text-base leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Join us at our Entebbe–Bwebajja headquarters for worship, prayer, counselling, and community.
                </p>
              </div>
            </ScrollReveal>

            <div className="flex flex-col gap-3">
              {serviceTimes.map((service, index) => {
                const isDark = index % 3 === 2;
                const background = ['#ffffff', '#daf1de', '#0b2b26'][index % 3];
                const foreground = isDark ? '#daf1de' : '#051f20';
                return (
                  <ScrollReveal key={`${service.day}-${service.label}-${index}`} delay={index * 0.05}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-[7rem_1fr] sm:grid-cols-[10rem_1fr] gap-4 items-center rounded-xl p-4 sm:p-5"
                      style={{
                        background,
                        color: foreground,
                        border: isDark ? '1px solid #235347' : '1px solid #d8c8a6',
                        boxShadow: '0 8px 20px rgba(5, 31, 32, 0.06)',
                      }}
                    >
                      <div className="border-r pr-3 sm:pr-4" style={{ borderColor: isDark ? 'rgba(218,241,222,.3)' : '#d8c8a6' }}>
                        <p className="text-xs font-bold uppercase tracking-wide opacity-75">{service.day}</p>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold">{service.label}</h3>
                        <p className="text-sm mt-1 opacity-75">{service.time}</p>
                      </div>
                    </motion.div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 2: Ministry Grid
        ================================================================ */}
        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ministriesList.map((ministry, index) => (
                <ScrollReveal key={ministry.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.06, ease: 'easeOut' as const }}
                    className="group flex flex-col rounded-2xl overflow-hidden h-full"
                    style={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Ministry image */}
                    <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                      <img
                        src={churchImageUrl(ministry.imageSlot)}
                        alt={ministry.name}
                        loading={index < 4 ? 'eager' : 'lazy'}
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Audience badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                          }}
                        >
                          <Users size={10} />
                          {ministry.audience}
                        </span>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col flex-1 p-5 gap-4">

                      {/* Ministry name */}
                      <h2
                        className="text-lg font-bold leading-snug"
                        style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                      >
                        {ministry.name}
                      </h2>

                      {/* Description */}
                      <RichTextContent
                        value={ministry.description}
                        className="text-sm leading-relaxed flex-1"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      />

                      {(ministry.meetingDay || ministry.meetingTime) && <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          <Calendar size={13} style={{ color: 'hsl(var(--primary))' }} />
                          <span>{ministry.meetingDay}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          <Clock size={13} style={{ color: 'hsl(var(--primary))' }} />
                          <span>{ministry.meetingTime}</span>
                        </div>
                      </div>}

                      {/* Divider */}
                      {(ministry.leader.name || ministry.leader.title) && <div className="border-t" style={{ borderColor: 'hsl(var(--border))' }} />}

                      {/* Leader */}
                      {(ministry.leader.name || ministry.leader.title) && <div className="flex items-center gap-3">
                        <img
                          src={churchImageUrl(ministry.leader.photoSlot)}
                          alt={ministry.leader.name}
                          loading="lazy"
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                          style={{ border: '2px solid hsl(var(--primary) / 0.3)' }}
                        />
                        <div className="min-w-0">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: 'hsl(var(--foreground))' }}
                          >
                            {ministry.leader.name}
                          </p>
                          <p
                            className="text-xs truncate"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                          >
                            {ministry.leader.title}
                          </p>
                        </div>
                      </div>}

                      {/* CTA */}
                      <Link
                        to="/contact"
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90 mt-auto"
                        style={{
                          background: 'hsl(var(--primary))',
                          color: 'hsl(var(--primary-foreground))',
                        }}
                      >
                        Join This Ministry
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>


        {/* ================================================================
            SECTION 3: Scripture Banner
        ================================================================ */}
        <section className="relative py-xxl overflow-hidden">
          {/* Background image */}
          <img
            src="/airo-assets/images/pages/home/scripture-banner"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {/* Dark overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'hsl(var(--surface-dark) / 0.78)' }}
          />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: 'easeOut' as const }}
              >
                <div
                  className="w-10 h-0.5 mx-auto mb-6 rounded-full"
                  style={{ background: 'hsl(var(--primary))' }}
                />
                <blockquote
                  className="scripture-quote text-2xl sm:text-3xl md:text-4xl font-bold italic leading-snug mb-5"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--white))' }}
                >
                  "{scripture.text}"
                </blockquote>
                <cite
                  className="scripture-reference text-sm font-semibold not-italic tracking-widest uppercase"
                  style={{ color: 'hsl(var(--primary))' }}
                >
                  — {scripture.reference}
                </cite>
                <div
                  className="w-10 h-0.5 mx-auto mt-6 rounded-full"
                  style={{ background: 'hsl(var(--primary))' }}
                />
              </motion.div>
            </ScrollReveal>
          </div>
        </section>


        {/* ================================================================
            SECTION 4: Volunteer / Get Involved CTA
        ================================================================ */}
        <section className="py-xxl" style={{ background: 'hsl(var(--surface-alt))' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <div
                className="rounded-2xl p-10 sm:p-14"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'hsl(var(--primary) / 0.12)' }}
                >
                  <Heart size={24} style={{ color: 'hsl(var(--primary))' }} />
                </div>

                <h2
                  className="text-2xl sm:text-3xl font-bold mb-4"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                >
                  {volunteerCta.heading}
                </h2>
                <p
                  className="text-base leading-relaxed mb-8 max-w-md mx-auto"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {volunteerCta.body}
                </p>
                <Link
                  to={volunteerCta.buttonHref}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
                  style={{
                    background: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                  }}
                >
                  {volunteerCta.buttonLabel}
                  <ArrowRight size={15} />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

      </main>
    </>
  );
}
