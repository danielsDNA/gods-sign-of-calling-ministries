/*
 * ============================================================
 * CHURCH EVENTS PAGE
 * ============================================================
 * Sections:
 *   1. Page Hero — title + breadcrumb
 *   2. Featured Event — large banner card
 *   3. Events Grid — filterable by category
 *   4. Add to Calendar CTA strip
 *
 * Published events and event categories are loaded from the CMS.
 * ============================================================
 */

import { useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, MapPin, ChevronRight, ArrowRight, Tag } from 'lucide-react';

import { useCmsList } from '@/hooks/useCmsList';
import { usePageContent } from '@/hooks/usePageContent';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { buildPageSeoUrls } from '@/lib/seo-url';
import ScrollReveal from '@/components/ScrollReveal';
import RichTextContent from '@/components/RichTextContent';
import { SocialPlatformIcon } from '@/components/SocialMediaLinks';
import { getSocialMediaLinks } from '@/lib/social-media';

const categoryColors: Record<string, string> = {
  Conference: 'hsl(var(--primary))',
  Prayer: '#8B5CF6',
  Community: '#10B981',
  Youth: '#F97316',
  Women: '#EC4899',
  Men: '#3B82F6'
};

interface CmsEvent {
  id: number;
  title: string;
  category: string | null;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  imageUrl: string | null;
  featured: boolean | null;
}

export default function EventsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const { items: cmsEvents } = useCmsList<CmsEvent>('/api/events', []);
  const { content: eventContent } = usePageContent('events', { categories: ['All'] });
  const { settings } = useSiteSettings();
  const seoUrls = buildPageSeoUrls(useJsonLdSiteUrl(), '/events');
  const facebookLink = getSocialMediaLinks(settings).find(link => link.platform === 'facebook');
  const eventList = cmsEvents.map(event => {
      const start = new Date(event.startsAt);
      const end = event.endsAt ? new Date(event.endsAt) : null;
      return {
        id: String(event.id),
        title: event.title,
        description: event.description || '',
        date: Number.isNaN(start.getTime()) ? '' : start.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        time: Number.isNaN(start.getTime()) ? '' : `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}${end && !Number.isNaN(end.getTime()) ? ` – ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}`,
        location: event.location || '',
        category: event.category?.trim() || 'Event',
        image: event.imageUrl || '/airo-assets/images/events/event-1',
        featured: !!event.featured,
        registrationOpen: false,
      };
    });

  const featured = eventList.find((e) => e.featured);
  const categories = Array.from(new Set([
    'All',
    ...eventContent.categories.filter(category => category.trim()),
    ...eventList.map(event => event.category),
  ]));
  const filtered = activeCategory === 'All'
    ? eventList
    : eventList.filter(event => event.category === activeCategory);

  return (
    <>
      <Helmet>
        <title>Events — {settings.church_name}</title>
        <meta
          name="description"
          content={`Upcoming events at ${settings.church_name} — conferences, prayer nights, community gatherings, and more. Join us!`} />
        
        {seoUrls.pageUrl && <link rel="canonical" href={seoUrls.pageUrl} />}
        <meta property="og:title" content={`Events — ${settings.church_name}`} />
        <meta
          property="og:description"
          content={`Upcoming events at ${settings.church_name} — conferences, prayer nights, community gatherings, and more.`} />
        
        <meta property="og:type" content="website" />
        {seoUrls.pageUrl && <meta property="og:url" content={seoUrls.pageUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            '@id': seoUrls.webpageId,
            name: `Events — ${settings.church_name}`,
            url: seoUrls.pageUrl,
            isPartOf: { '@id': seoUrls.websiteId },
            about: { '@id': seoUrls.organizationId }
          }).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main>

        {/* ================================================================
             SECTION: Page Hero
             Compact hero with page title and breadcrumb
          ================================================================ */}
        <section
          className="relative pt-32 pb-16 overflow-hidden"
          style={{ background: 'hsl(var(--surface-alt))' }}>
          
          {/* Decorative amber blob */}
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'hsl(var(--primary) / 0.08)' }} />
          

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm mb-6">
              <Link
                to="/"
                className="transition-colors duration-200 hover:underline"
                style={{ color: 'hsl(var(--muted-foreground))' }}>
                
                Home
              </Link>
              <ChevronRight size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span style={{ color: 'hsl(var(--primary))' }}>Events</span>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' as const }}>
              
              <p className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: 'hsl(var(--primary))' }}>
                What's On
              </p>
              <h1
                className="text-4xl sm:text-5xl font-bold mb-4"
                style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                
                Upcoming Events
              </h1>
              <p className="text-base sm:text-lg max-w-2xl leading-relaxed"
              style={{ color: 'hsl(var(--muted-foreground))' }}>
                Come and be part of what God is doing at {settings.church_name}. There's always a place for you here.
              </p>
            </motion.div>
          </div>
        </section>


        {/* ================================================================
             SECTION: Featured Event
             Large banner card with image, details, and register CTA
          ================================================================ */}
        {featured &&
        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollReveal>
                <p className="text-xs font-semibold uppercase tracking-widest mb-6"
              style={{ color: 'hsl(var(--primary))' }}>
                  Featured Event
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.05}>
                <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-lg)'
                }}>
                
                  {/* Image */}
                  <div className="relative h-64 lg:h-auto min-h-[320px] overflow-hidden">
                    <img
                    src={featured.image}
                    alt={featured.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                    width={700}
                    height={500} />
                  
                    {/* Category badge */}
                    <div className="absolute top-4 left-4">
                      <span
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: categoryColors[featured.category] ?? 'hsl(var(--primary))',
                        color: 'hsl(var(--white))'
                      }}>
                      
                        {featured.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 lg:p-10 flex flex-col justify-center">
                    <h2
                    className="text-2xl sm:text-3xl font-bold mb-4 leading-tight"
                    style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                    
                      {featured.title}
                    </h2>
                    <RichTextContent value={featured.description} className="text-base leading-relaxed mb-6"
                      style={{ color: 'hsl(var(--muted-foreground))' }} />

                    {/* Meta */}
                    <div className="space-y-2.5 mb-8">
                      <div className="flex items-center gap-2.5">
                        <Calendar size={15} style={{ color: 'hsl(var(--primary))' }} />
                        <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                          {featured.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Clock size={15} style={{ color: 'hsl(var(--primary))' }} />
                        <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                          {featured.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <MapPin size={15} style={{ color: 'hsl(var(--primary))' }} />
                        <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                          {featured.location} · {settings.address}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    {featured.registrationOpen ?
                  <button
                    className="inline-flex items-center gap-2 self-start px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                    style={{
                      background: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))'
                    }}>
                    
                        Register Now <ArrowRight size={16} />
                      </button> :

                  <span
                    className="inline-flex items-center gap-2 self-start px-6 py-3 rounded-lg text-sm font-semibold"
                    style={{
                      background: 'hsl(var(--muted))',
                      color: 'hsl(var(--muted-foreground))'
                    }}>
                    
                        Free Entry — No Registration Needed
                      </span>
                  }
                  </div>
                </motion.div>
              </ScrollReveal>
            </div>
          </section>
        }


        {/* ================================================================
             SECTION: Events Grid
             Category filter chips + responsive card grid
          ================================================================ */}
        <section className="py-xxl" style={{ background: 'hsl(var(--surface-alt))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Section heading */}
            <ScrollReveal>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'hsl(var(--primary))' }}>
                    All Events
                  </p>
                  <h2
                    className="text-2xl sm:text-3xl font-bold"
                    style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                    
                    Find Your Place
                  </h2>
                </div>

                {/* Category filter chips */}
                <div
                  role="group"
                  aria-label="Filter events by category"
                  className="flex flex-wrap gap-2">
                  
                  {categories.map((cat) =>
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                    style={{
                      background:
                      activeCategory === cat ?
                      'hsl(var(--primary))' :
                      'hsl(var(--card))',
                      color:
                      activeCategory === cat ?
                      'hsl(var(--primary-foreground))' :
                      'hsl(var(--muted-foreground))',
                      border:
                      activeCategory === cat ?
                      '1px solid hsl(var(--primary))' :
                      '1px solid hsl(var(--border))'
                    }}>
                    
                      {cat !== 'All' && <Tag size={10} />}
                      {cat}
                    </button>
                  )}
                </div>
              </div>
            </ScrollReveal>

            {/* Cards grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' as const }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {filtered.length === 0 ?
                <div className="col-span-full text-center py-16">
                    <p className="text-base" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      No events in this category right now. Check back soon!
                    </p>
                  </div> :

                filtered.map((event, i) =>
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.07, ease: 'easeOut' as const }}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl overflow-hidden flex flex-col"
                  style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                  
                      {/* Thumbnail */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                      width={400}
                      height={250} />
                    
                        {/* Category badge */}
                        <div className="absolute top-3 left-3">
                          <span
                        className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: categoryColors[event.category] ?? 'hsl(var(--primary))',
                          color: 'hsl(var(--white))'
                        }}>
                        
                            {event.category}
                          </span>
                        </div>
                        {/* Registration badge */}
                        {event.registrationOpen &&
                    <div className="absolute top-3 right-3">
                            <span
                        className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: 'hsl(var(--surface-dark) / 0.8)', color: "#ffffff"

                        }}>
                        
                              Register
                            </span>
                          </div>
                    }
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3
                      className="text-base font-bold mb-2 leading-snug"
                      style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                      
                          {event.title}
                        </h3>
                        <RichTextContent value={event.description} className="text-sm leading-relaxed mb-4 flex-1"
                          style={{ color: 'hsl(var(--muted-foreground))' }} />

                        {/* Meta */}
                        <div className="space-y-1.5 mb-5">
                          <div className="flex items-center gap-2">
                            <Calendar size={13} style={{ color: 'hsl(var(--primary))' }} />
                            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {event.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={13} style={{ color: 'hsl(var(--primary))' }} />
                            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {event.time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={13} style={{ color: 'hsl(var(--primary))' }} />
                            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {event.location}
                            </span>
                          </div>
                        </div>

                        {/* CTA */}
                        {event.registrationOpen ?
                    <button
                      className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
                      style={{
                        background: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))'
                      }}>
                      
                            Register Now
                          </button> :

                    <div
                      className="w-full py-2.5 rounded-lg text-sm font-semibold text-center"
                      style={{
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))'
                      }}>
                      
                            Free — All Welcome
                          </div>
                    }
                      </div>
                    </motion.div>
                )
                }
              </motion.div>
            </AnimatePresence>
          </div>
        </section>


        {/* ================================================================
             SECTION: Add to Calendar CTA strip
          ================================================================ */}
        <section className="py-xl" style={{ background: 'hsl(var(--primary))' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <h2
                className="text-2xl sm:text-3xl font-bold mb-3"
                style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--white))' }}>
                
                Never Miss an Event
              </h2>
              <p className="text-base mb-8" style={{ color: 'hsl(var(--white) / 0.85)' }}>
                Stay connected with everything happening at {settings.church_name}. Follow us on social media for real-time updates.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {facebookLink && (
                  <a
                    href={facebookLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
                    style={{
                      background: 'hsl(var(--white))',
                      color: 'hsl(var(--primary))'
                    }}>
                    <SocialPlatformIcon platform="facebook" size={16} />
                    Follow on Facebook
                  </a>
                )}
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={{
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(var(--glass-blur))',
                    WebkitBackdropFilter: 'blur(var(--glass-blur))',
                    border: '1px solid var(--glass-border)',
                    color: 'hsl(var(--white))'
                  }}>
                  
                  Get in Touch <ArrowRight size={16} />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

      </main>
    </>);

}