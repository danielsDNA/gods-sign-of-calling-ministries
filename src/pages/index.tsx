import { about as defaultAbout, ministries as defaultMinistries } from 'virtual:content';
/*
 * ============================================================
 * CHURCH HOMEPAGE
 * ============================================================
 * Sections (in order):
 *   1. Loading Screen
 *   2. Hero
 *   3. About Preview
 *   4. Service Times
 *   5. Sermons Preview
 *   6. Events Preview
 *   7. Ministries Preview
 *   8. Gallery Preview
 *   9. Scripture Banner
 *  10. Contact CTA
 *
 * All content driven from src/config/church.ts
 * All animations use motion/react
 * All sections use <ScrollReveal> for scroll-triggered entrance
 * ============================================================
 */

import { useRef, useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import {
  Clock,
  MapPin,
  ArrowRight,
  Play,
  Calendar,
  ChevronRight,
  Users,
  BookOpen,
  Heart,
  Star,
  Phone,
  Mail,
} from 'lucide-react';

import { useLoading } from '@/hooks/useLoading';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCmsList } from '@/hooks/useCmsList';
import { usePageContent } from '@/hooks/usePageContent';
import LoadingScreen from '@/components/LoadingScreen';
import ScrollReveal from '@/components/ScrollReveal';
import RichTextContent from '@/components/RichTextContent';
import ChurchImpactStats from '@/components/ChurchImpactStats';
import { churchImageUrl } from '@/lib/church-image-url';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { buildPageSeoUrls } from '@/lib/seo-url';

interface CmsEvent {
  id: number;
  title: string;
  description: string | null;
  startsAt: string;
  location: string | null;
  imageUrl: string | null;
  featured: boolean | null;
}

interface CmsSermon {
  id: number;
  title: string;
  speaker: string | null;
  series: string | null;
  scripture: string | null;
  preachedOn: string | null;
  thumbnailUrl: string | null;
}

interface CmsMinistry {
  id: number;
  name: string;
  description: string | null;
  tagline: string | null;
  imageUrl: string | null;
}

interface CmsGalleryImage {
  id: number;
  imageUrl: string;
  caption: string | null;
}

function getAnimatedGalleryIds(value: string | undefined, images: CmsGalleryImage[]): number[] {
  if (value === undefined) return images.slice(0, 3).map(image => image.id);
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

const ministryIcons = [
  <Star key="ministry-star" size={20} />,
  <Heart key="ministry-heart" size={20} />,
  <Users key="ministry-users" size={20} />,
  <BookOpen key="ministry-book" size={20} />,
];

/* ── Typewriter rotating phrases ── */
function Typewriter({ phrases }: { phrases: string[] }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!phrases.length) return;
    const current = phrases[index % phrases.length];

    if (paused) {
      const t = setTimeout(() => { setDeleting(true); setPaused(false); }, 2000);
      return () => clearTimeout(t);
    }

    if (!deleting) {
      if (displayed.length < current.length) {
        const t = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 55);
        return () => clearTimeout(t);
      } else {
        setPaused(true);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
        return () => clearTimeout(t);
      } else {
        setDeleting(false);
        setIndex(i => i + 1);
      }
    }
  }, [displayed, deleting, paused, phrases, index]);

  return (
    <span
      className="font-bold"
      style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-heading)' }}
    >
      {displayed}
      <span
        className="inline-block w-0.5 h-[1em] ml-0.5 align-middle"
        style={{ background: 'hsl(var(--primary))', animation: 'heroCursorBlink 1s step-end infinite' }}
      />
    </span>
  );
}

/* ── Hero word-by-word animated heading ── */
function AnimatedHeading({ text, highlightedText, outlinedText }: {
  text: string;
  highlightedText: string;
  outlinedText: string;
}) {
  const highlight = highlightedText.trim();
  const outline = outlinedText.trim();
  const phrases = [...new Set([highlight, outline].filter(Boolean))]
    .sort((left, right) => right.length - left.length);
  const phraseParts = phrases.length
    ? text.split(new RegExp(`(${phrases.map(phrase => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig'))
    : [text];
  const parts = phraseParts.flatMap(part => {
    const kind = part.toLowerCase() === highlight.toLowerCase() && highlight
      ? 'highlight'
      : part.toLowerCase() === outline.toLowerCase() && outline
        ? 'outline'
        : '';
    return kind ? [{ text: part, kind }] : part.split(/(\s+)/).map(textPart => ({ text: textPart, kind: '' }));
  });
  return (
    <span className="inline whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (/^\s+$/.test(part.text)) {
          return <span key={i} className="whitespace-pre">{part.text}</span>;
        }
        return (
        <motion.span
          key={i}
          className={part.kind === 'highlight'
            ? 'inline-block rounded-sm px-[0.08em]'
            : part.kind === 'outline'
              ? 'inline-block rounded-[0.3em] border-[0.08em] px-[0.18em] py-[0.01em]'
              : 'inline-block'}
          style={part.kind === 'highlight'
            ? { background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }
            : part.kind === 'outline'
              ? { background: 'hsl(var(--surface-dark))', color: 'white', borderColor: 'hsl(var(--secondary))' }
              : undefined}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 + i * 0.08, ease: 'easeOut' as const }}
        >
          {part.text}
        </motion.span>
        );
      })}
    </span>
  );
}

function RotatingPhoto({ images, className = '' }: {
  images: Array<{ src: string; alt: string }>;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex(current => (current + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [images.length]);

  if (!images.length) return null;
  const currentImage = images[index % images.length];

  return (
    <div className={`rotating-photo ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.img
          key={`${index}-${currentImage.src}`}
          src={currentImage.src}
          alt={currentImage.alt}
          className="rotating-photo__image"
          loading="lazy"
          initial={{ opacity: 0, scale: 1.035 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        />
      </AnimatePresence>
      {images.length > 1 && (
        <div className="rotating-photo__dots" aria-label="Choose a photo">
          {images.map((image, imageIndex) => (
            <button
              key={`${image.src}-${imageIndex}`}
              type="button"
              className="rotating-photo__dot"
              aria-label={`Show photo ${imageIndex + 1}`}
              aria-current={index === imageIndex}
              onClick={() => setIndex(imageIndex)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================ */

export default function HomePage() {
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [contactError, setContactError] = useState('');
  const [contactNotificationSent, setContactNotificationSent] = useState(false);
  const { isLoading } = useLoading(1800);
  const { settings: siteSettings, phrases, serviceTimes } = useSiteSettings();
  const seoUrls = buildPageSeoUrls(useJsonLdSiteUrl(), '/');
  const { content: ministryContent } = usePageContent('ministries', defaultMinistries);
  const { content: aboutContent } = usePageContent('about', defaultAbout);
  const { items: cmsEvents } = useCmsList<CmsEvent>('/api/events', []);
  const { items: cmsSermons } = useCmsList<CmsSermon>('/api/sermons', []);
  const { items: cmsMinistries } = useCmsList<CmsMinistry>('/api/ministries', []);
  const { items: cmsGallery } = useCmsList<CmsGalleryImage>('/api/gallery', []);
  const homeEvents = cmsEvents.map(event => {
      const start = new Date(event.startsAt);
      return {
        id: String(event.id),
        title: event.title,
        description: event.description || '',
        date: Number.isNaN(start.getTime()) ? '' : start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        image: event.imageUrl || '/airo-assets/images/events/event-1',
        featured: !!event.featured,
      };
    });
  const sermonList = cmsSermons.map(sermon => ({
      id: String(sermon.id),
      title: sermon.title,
      series: sermon.series || 'Sermon',
      speaker: sermon.speaker || '',
      date: sermon.preachedOn ? new Date(`${sermon.preachedOn}T00:00:00`).toLocaleDateString() : '',
      scripture: sermon.scripture || '',
      image: sermon.thumbnailUrl || '/airo-assets/images/sermons/sermon-1',
    }));
  const ministryList = cmsMinistries.length === 0
    ? ministryContent.ministries.map((ministry, index) => ({
      id: ministry.id,
      name: ministry.name,
      description: ministry.description,
      icon: ministryIcons[index % ministryIcons.length],
      image: churchImageUrl(ministry.imageSlot),
    }))
    : cmsMinistries.map((ministry, index) => ({
      id: String(ministry.id),
      name: ministry.name,
      description: ministry.description || ministry.tagline || '',
      icon: ministryIcons[index % ministryIcons.length],
      image: ministry.imageUrl || '/airo-assets/images/ministry/youth',
    }));
  const galleryImages = cmsGallery.map(image => ({
      slot: churchImageUrl(image.imageUrl),
      alt: image.caption || "God's Sign of Calling Revival Ministries community",
      tall: false,
    }));
  const aboutImage = siteSettings.about_image_url || siteSettings.about_bg_url || '/community.png';
  const animatedGalleryIds = new Set(getAnimatedGalleryIds(siteSettings.home_animated_gallery_ids, cmsGallery));
  const selectedGalleryImages = cmsGallery
    .filter(image => animatedGalleryIds.has(image.id))
    .map(image => ({
      src: churchImageUrl(image.imageUrl),
      alt: image.caption || `${siteSettings.church_name} community`,
    }));
  const aboutSlides = selectedGalleryImages.length
    ? selectedGalleryImages
    : [{ src: aboutImage, alt: `${siteSettings.church_name} community` }];
  const worshipSlides = aboutSlides;

  /* Subtle parallax on the hero photo */
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '8%']);
  const heroMedia = siteSettings.hero_photo_url || siteSettings.hero_bg_url || '/community.png';
  const heroMediaIsVideo = /\.(mp4|webm|ogv|ogg)(?:$|[?#])/i.test(heroMedia);
  const churchAddress = siteSettings.map_address || siteSettings.address;
  const locationUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(churchAddress)}`;

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();
    setContactStatus('sending');
    setContactError('');
    try {
      const response = await fetch('/api/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic: 'Homepage message', message }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Unable to send your message. Please try again.');
      }
      form.reset();
      setContactNotificationSent(result.notificationSent === true);
      setContactStatus('success');
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Unable to send your message. Please try again.');
      setContactStatus('error');
    }
  }

  return (
    <>
      <Helmet>
        <title>{siteSettings.church_name} | Official Website</title>
        <meta name="description" content={`Welcome to ${siteSettings.church_name}. ${aboutContent.mission.statement}`} />
        {seoUrls.pageUrl && <link rel="canonical" href={seoUrls.pageUrl} />}
        <meta property="og:title" content={`${siteSettings.church_name} — ${siteSettings.tagline}`} />
        <meta property="og:description" content={siteSettings.about_mission} />
        <meta property="og:type" content="website" />
        {seoUrls.pageUrl && <meta property="og:url" content={seoUrls.pageUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* === SECTION: Loading Screen === */}
      <LoadingScreen isLoading={isLoading} />

      <main>

        {/* ================================================================
            SECTION: Hero
            Split layout with editable church messaging, image/video media and impact stats.
        ================================================================ */}
        <section
          ref={heroRef}
          className="home-hero relative overflow-hidden"
          style={{ position: 'relative' }}
          aria-label="Hero"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:min-h-[650px] pt-20">
            {/* ── LEFT: Welcome, headline and calls to action ── */}
            <div className="flex items-center px-4 sm:px-8 lg:px-12 xl:pl-[max(3rem,calc((100vw-80rem)/2))] py-14 sm:py-16 lg:py-20">
              <div className="flex flex-col gap-5 sm:gap-6 w-full max-w-2xl mx-auto lg:mx-0">
                <motion.p
                  className="text-xs font-semibold uppercase tracking-[0.25em]"
                  style={{ color: 'hsl(var(--primary))' }}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {siteSettings.hero_welcome || "God's Sign of Calling Revival Ministries"}
                </motion.p>

                <h1
                  className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-[1.02] tracking-tight"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                >
                  <AnimatedHeading
                    text={siteSettings.hero_headline || 'A Place to Belong, A Calling to Serve.'}
                    highlightedText={siteSettings.hero_highlight}
                    outlinedText={siteSettings.hero_outline_text}
                  />
                </h1>

                <motion.div
                  className="text-xl sm:text-2xl min-h-[2rem]"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                >
                  <Typewriter phrases={phrases} />
                </motion.div>

                <motion.p
                  className="text-base sm:text-lg leading-relaxed max-w-lg"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 1.7 }}
                >
                  {siteSettings.hero_subheading}
                </motion.p>

                <motion.div
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 2.0 }}
                >
                  <a
                    href={siteSettings.hero_cta_primary_href}
                    className="hero-cta-primary church-action-button inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg text-base font-semibold transition-all duration-300 shadow-sm"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  >
                    {siteSettings.hero_cta_primary_label}
                    <ArrowRight size={18} />
                  </a>
                  <a
                    href={siteSettings.hero_cta_secondary_href}
                    className="hero-cta-secondary inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg text-base font-semibold transition-all duration-300"
                    style={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                  >
                    <Users size={16} />
                    {siteSettings.hero_cta_secondary_label}
                  </a>
                </motion.div>

                {churchAddress && (
                  <motion.a
                    href={locationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hero-location-card w-fit"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 2.2 }}
                  >
                    <span className="hero-location-pin" aria-hidden="true">
                      <MapPin size={22} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.65rem] font-bold uppercase tracking-[0.18em]" style={{ color: 'hsl(var(--primary))' }}>
                        Find our church
                      </span>
                      <span className="block text-sm font-semibold leading-snug" style={{ color: 'hsl(var(--foreground))' }}>
                        {churchAddress}
                      </span>
                    </span>
                    <ArrowRight size={17} className="shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                  </motion.a>
                )}

              </div>
            </div>

            {/* ── RIGHT: Full-height church photo ── */}
            <motion.div
              className="relative min-h-[320px] sm:min-h-[440px] lg:min-h-[650px] overflow-hidden"
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' as const }}
            >
              {heroMediaIsVideo ? (
                <motion.video
                  src={heroMedia}
                  poster={galleryImages[0]?.slot}
                  aria-hidden="true"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ y: imageY, scale: 1.04 }}
                />
              ) : (
                <motion.img
                  src={heroMedia}
                  alt={`${siteSettings.church_name || "God's Sign of Calling Revival Ministries"} community`}
                  loading="eager"
                  fetchPriority="high"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ y: imageY, scale: 1.04 }}
                />
              )}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(8, 41, 15, 0.1), rgba(4, 36, 14, 0.34))',
                  mixBlendMode: 'multiply',
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, transparent 48%, hsl(var(--surface-dark) / 0.3) 100%)' }}
              />
              <div
                className="absolute inset-y-0 left-0 hidden w-[72%] pointer-events-none lg:block"
                style={{
                  background: 'linear-gradient(90deg, hsl(var(--surface-alt)) 0%, hsl(var(--surface-alt) / 0.9) 16%, hsl(var(--surface-alt) / 0.48) 56%, hsl(var(--surface-alt) / 0.08) 86%, transparent 100%)',
                }}
              />
              <div
                className="absolute inset-x-0 top-0 h-36 pointer-events-none lg:hidden"
                style={{
                  background: 'linear-gradient(180deg, hsl(var(--surface-alt)) 0%, hsl(var(--surface-alt) / 0.72) 35%, transparent 100%)',
                }}
              />
              {siteSettings.is_live === 'true' && (
                <div className="absolute top-5 left-5">
                  <a
                    href={siteSettings.live_stream_url}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: 'var(--glass-dark-bg)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid hsl(var(--destructive) / 0.4)',
                    }}
                  >
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ background: 'hsl(var(--destructive))' }} />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5"
                        style={{ background: 'hsl(var(--destructive))' }} />
                    </span>
                    <span className="text-sm font-semibold text-white">Live Now — Watch</span>
                  </a>
                </div>
              )}
              {serviceTimes[0] && (
                <div
                  className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 max-w-[calc(100%-2.5rem)] sm:max-w-xs rounded-2xl p-4 sm:p-5 shadow-xl"
                  style={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={17} style={{ color: 'hsl(var(--primary))' }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Join us this week
                    </span>
                  </div>
                  <p className="text-base font-bold">{serviceTimes[0].label}</p>
                  <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {serviceTimes[0].day} · {serviceTimes[0].time}
                  </p>
                  {serviceTimes[0].location && (
                    <p className="flex items-center gap-1.5 text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <MapPin size={13} />
                      {serviceTimes[0].location}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Impact strip: counts from currently loaded church content ── */}
          <ChurchImpactStats stats={aboutContent.stats as { id: string; value: string; label: string }[]} />
        </section>


        {/* ================================================================
            SECTION: About Preview
            Asymmetric two-column: image left, text right
        ================================================================ */}
        <section className="py-xxl overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

              {/* Image */}
              <ScrollReveal direction="left">
                <div className="relative">
                  <RotatingPhoto images={aboutSlides} className="about-photo-stack mx-auto lg:mx-0" />
                </div>
              </ScrollReveal>

              {/* Text */}
              <ScrollReveal direction="right" delay={0.15}>
                <div className="lg:pl-4">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                    style={{ color: 'hsl(var(--primary))' }}>
                    Our Story
                  </p>
                  <h2
                    className="text-3xl sm:text-4xl font-bold mb-6 leading-tight"
                    style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                  >
                    {siteSettings.about_heading}
                  </h2>
                  <blockquote className="mb-6 pl-4 border-l-4" style={{ borderColor: 'hsl(var(--primary))' }}>
                    <p
                      className="text-lg italic leading-relaxed mb-1"
                      style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                    >
                      "{siteSettings.scripture_text}"
                    </p>
                    <cite className="text-sm not-italic font-medium" style={{ color: 'hsl(var(--primary))' }}>
                      — {siteSettings.scripture_reference}
                    </cite>
                  </blockquote>
                  <p className="text-base leading-relaxed mb-8" style={{ color: 'hsl(var(--muted-foreground))', whiteSpace: 'pre-line' }}>
                    {(aboutContent.story.body as Array<{ id: string; text: string }>)[0]?.text || ''}
                  </p>
                  <Link
                    to="/about"
                    className="church-action-button inline-flex items-center gap-2 px-5 py-3 font-semibold"
                  >
                    Our Story <ArrowRight size={16} />
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>


        {/* ================================================================
            SECTION: Service Times
            Color-block programme cards inspired by the ministry timetable.
        ================================================================ */}
        <section id="service-times" className="py-xxl overflow-hidden" style={{ background: 'hsl(var(--surface-alt))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-12">
                <p className="home-section-kicker text-xs font-bold uppercase mb-4">
                  Come worship with us
                </p>
                <h2
                  className="text-4xl sm:text-5xl font-bold"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                >
                  Join Us in Worship
                </h2>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <ScrollReveal direction="left">
                <RotatingPhoto images={worshipSlides} className="worship-photo-stack mx-auto lg:mx-0" />
              </ScrollReveal>
              <ScrollReveal direction="right" delay={0.12}>
                <div>
                  <h3 className="mb-6 text-3xl sm:text-4xl font-semibold italic"
                    style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                    Weekly Program
                  </h3>
                  <div className="worship-timeline">
                    {serviceTimes.map((service, index) => (
                      <motion.article
                        key={`${service.day}-${service.label}-${index}`}
                        className="worship-timeline__item"
                        initial={{ opacity: 0, x: 16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.45, delay: index * 0.06, ease: 'easeOut' }}
                        whileHover={{ x: 5 }}
                      >
                        <span className="worship-timeline__day">{service.day}</span>
                        <div>
                          <h4 className="font-bold leading-snug" style={{ color: 'hsl(var(--foreground))' }}>
                            {service.label}
                          </h4>
                          <p className="mt-1 text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {service.time}
                          </p>
                          {service.location && (
                            <p className="mt-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {service.location}
                            </p>
                          )}
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
            <ScrollReveal delay={0.2}>
              <div className="text-center mt-12">
                <Link
                  to="/ministries"
                  className="church-action-button inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
                >
                  See all programmes <ArrowRight size={16} />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>


        {/* ================================================================
            SECTION: Sermons Preview
            3 sermon cards with glass hover effect
        ================================================================ */}
        <section id="sermons" className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-12">
                <p className="home-section-kicker text-xs font-semibold uppercase mb-4">
                  The Word
                </p>
                <h2
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                >
                  Recent Sermons
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {sermonList.slice(0, 3).map((sermon, i) => (
                <ScrollReveal key={sermon.id} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl overflow-hidden sermon-card"
                    style={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={sermon.image}
                        alt={sermon.title}
                        className="w-full h-full object-cover transition-transform duration-500"
                        loading="lazy"
                        width={400}
                        height={225}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 sermon-play-overlay transition-opacity duration-300 pointer-events-none"
                        style={{ background: 'hsl(var(--surface-dark) / 0.5)' }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ background: 'hsl(var(--primary))' }}>
                          <Play size={18} className="ml-0.5" style={{ color: 'hsl(var(--white))' }} />
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <span
                        className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3"
                        style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--primary))' }}
                      >
                        {sermon.series}
                      </span>
                      <h3
                        className="text-base font-bold mb-2 leading-snug"
                        style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                      >
                        {sermon.title}
                      </h3>
                      <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {sermon.speaker}
                      </p>
                      <p className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {sermon.date} · {sermon.scripture}
                      </p>
                      <Link
                        to="/sermons"
                        className="sermon-listen-button"
                      >
                        Listen Now <Play size={13} fill="currentColor" />
                      </Link>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={0.3}>
              <div className="text-center mt-10">
                <Link
                  to="/sermons"
                  className="church-action-button inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
                >
                  View All Sermons <ArrowRight size={16} />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>


        {/* ================================================================
            SECTION: Events Preview
            Bento-style grid: one large left, two stacked right
        ================================================================ */}
        <section className="py-xxl" style={{ background: 'hsl(var(--surface-alt))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-12">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'hsl(var(--primary))' }}>
                  What's On
                </p>
                <h2 className="home-section-kicker text-3xl sm:text-4xl font-bold normal-case tracking-normal"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                  Upcoming Events
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Featured event — large left */}
              {homeEvents.filter((e) => e.featured).map((event) => (
                <ScrollReveal key={event.id} direction="left">
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="relative rounded-2xl overflow-hidden min-h-[320px] lg:h-full"
                  >
                    <img
                      src={event.image}
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      width={700}
                      height={500}
                    />
                    <div className="absolute inset-0 pointer-events-none"
                      style={{ background: 'var(--dark-glass-overlay)' }} />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <span
                        className="inline-block self-start px-3 py-1 rounded-full text-xs font-bold mb-3"
                        style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                      >
                        {event.date}
                      </span>
                      <h3
                        className="text-xl sm:text-2xl font-bold mb-2"
                        style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--white))' }}
                      >
                        {event.title}
                      </h3>
                      <RichTextContent value={event.description} className="text-sm mb-4"
                        style={{ color: 'hsl(var(--white) / 0.8)' }} />
                      <Link
                        to="/events"
                        className="event-learn-button"
                      >
                        Learn More <ChevronRight size={14} />
                      </Link>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}

              {/* Two stacked events — right */}
              <div className="flex flex-col gap-6">
                {homeEvents.filter((e) => !e.featured).map((event, i) => (
                  <ScrollReveal key={event.id} direction="right" delay={i * 0.1}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.3 }}
                      className="relative rounded-2xl overflow-hidden h-40"
                    >
                      <img
                        src={event.image}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        width={600}
                        height={200}
                      />
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'var(--dark-glass-overlay)' }} />
                      <div className="absolute inset-0 p-5 flex items-end">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar size={12} style={{ color: 'hsl(var(--primary))' }} />
                            <span className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                              {event.date}
                            </span>
                          </div>
                          <h3
                            className="text-base font-bold mb-1"
                            style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--white))' }}
                          >
                            {event.title}
                          </h3>
                          <Link
                            to="/events"
                            className="event-learn-button"
                          >
                            Learn More <ChevronRight size={12} />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            <ScrollReveal delay={0.3}>
              <div className="text-center mt-10">
                <Link
                  to="/events"
                  className="church-action-button inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
                >
                  See All Events <ArrowRight size={16} />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>


        {/* ================================================================
            SECTION: Ministries Preview
            4-card grid with dark glass overlay on images
        ================================================================ */}
        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-12">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'hsl(var(--primary))' }}>
                  Get Involved
                </p>
                <h2
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                >
                  Our Ministries
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {ministryList.slice(0, 4).map((ministry, i) => (
                <ScrollReveal key={ministry.id} delay={i * 0.08}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="relative rounded-2xl overflow-hidden h-72 ministry-card"
                  >
                    <img
                      src={ministry.image}
                      alt={ministry.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ministry-img"
                      loading="lazy"
                      width={300}
                      height={400}
                    />
                    <div
                      className="absolute inset-0 transition-all duration-300 ministry-overlay pointer-events-none"
                      style={{ background: 'var(--dark-glass-overlay)' }}
                    />
                    {/* Left border accent — appears on hover */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ministry-accent"
                      style={{ background: 'hsl(var(--primary))', opacity: 0 }}
                    />
                    <div className="absolute inset-0 p-5 flex flex-col justify-end">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                        style={{ background: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))' }}
                      >
                        {ministry.icon}
                      </div>
                      <h3
                        className="text-base font-bold mb-1"
                        style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--white))' }}
                      >
                        {ministry.name}
                      </h3>
                      <RichTextContent value={ministry.description} className="text-xs mb-3"
                        style={{ color: 'hsl(var(--white) / 0.75)' }} />
                      <Link
                        to="/ministries"
                        className="inline-flex items-center gap-1 text-xs font-semibold transition-all duration-200 hover:gap-2"
                        style={{ color: 'hsl(var(--primary))' }}
                      >
                        Join <ChevronRight size={12} />
                      </Link>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>


        {/* ================================================================
            SECTION: Gallery Preview
            Masonry-style grid: 2 tall + 4 square
        ================================================================ */}
        <section className="py-xxl" style={{ background: 'hsl(var(--surface-alt))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-12">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'hsl(var(--primary))' }}>
                  Our Community
                </p>
                <h2
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                >
                  Life at {siteSettings.church_name}
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {galleryImages.slice(0, 6).map((img, i) => (
                <ScrollReveal key={i} delay={i * 0.06}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="relative overflow-hidden rounded-xl gallery-item"
                    style={{ aspectRatio: img.tall ? '3/4' : '1/1' }}
                  >
                    <img
                      src={img.slot}
                      alt={img.alt}
                      className="w-full h-full object-cover transition-transform duration-500 gallery-img"
                      loading="lazy"
                      width={400}
                      height={img.tall ? 533 : 400}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 gallery-overlay pointer-events-none"
                      style={{ background: 'hsl(var(--primary) / 0.7)' }}
                    >
                      <span className="text-sm font-semibold" style={{ color: 'hsl(var(--white))' }}>
                        View Gallery
                      </span>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={0.3}>
              <div className="text-center mt-10">
                <Link
                  to="/gallery"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border transition-all duration-200 hover:gap-3"
                  style={{ borderColor: 'hsl(var(--primary))', color: 'hsl(var(--primary))' }}
                >
                  View Full Gallery <ArrowRight size={16} />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>


        {/* ================================================================
            SECTION: Scripture Banner
            Full-bleed dark section with large italic scripture quote
        ================================================================ */}
        <section className="relative py-xxxl overflow-hidden">
          <img
            src={siteSettings.scripture_banner_image_url || '/airo-assets/images/pages/home/scripture-banner'}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            width={1920}
            height={600}
          />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'hsl(var(--surface-dark) / 0.82)' }} />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <motion.blockquote
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeOut' as const }}
              >
                <p
                  className="scripture-quote text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold italic leading-tight mb-6"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--white))' }}
                >
                  "{siteSettings.scripture_text}"
                </p>
                <cite className="scripture-reference text-base not-italic font-semibold">
                  — {siteSettings.scripture_reference}
                </cite>
              </motion.blockquote>
            </ScrollReveal>
          </div>
        </section>


        {/* ================================================================
            SECTION: Contact CTA
            Two-column: info left, form right
        ================================================================ */}
        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

              {/* Left: info */}
              <ScrollReveal direction="left">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'hsl(var(--primary))' }}>
                  Get in Touch
                </p>
                <h2
                  className="text-3xl sm:text-4xl font-bold mb-4 leading-tight"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                >
                  We'd Love to Meet You
                </h2>
                <p className="text-base leading-relaxed mb-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Whether you're new to faith or looking for a church home, our doors are open. Come as you are — you belong here.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: <MapPin size={16} style={{ color: 'hsl(var(--primary))' }} />, label: 'Address', value: siteSettings.address, href: undefined },
                    { icon: <Phone size={16} style={{ color: 'hsl(var(--primary))' }} />, label: 'Phone', value: siteSettings.phone, href: `tel:${siteSettings.phone}` },
                    { icon: <Mail size={16} style={{ color: 'hsl(var(--primary))' }} />, label: 'Email', value: siteSettings.email, href: `mailto:${siteSettings.email}` },
                  ].map(({ icon, label, value, href }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'hsl(var(--muted))' }}>
                        {icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-0.5" style={{ color: 'hsl(var(--foreground))' }}>{label}</p>
                        {href ? (
                          <a href={href} className="text-sm hover:underline" style={{ color: 'hsl(var(--muted-foreground))' }}>{value}</a>
                        ) : (
                          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'hsl(var(--muted))' }}>
                      <Clock size={16} style={{ color: 'hsl(var(--primary))' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-0.5" style={{ color: 'hsl(var(--foreground))' }}>Service Times</p>
                      {serviceTimes.map((s, i) => (
                        <p key={i} className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {s.day} {s.time} — {s.label}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Right: contact form — UI only, Supabase wiring deferred */}
              <ScrollReveal direction="right" delay={0.15}>
                <div
                  className="p-6 sm:p-8 rounded-2xl"
                  style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <h3
                    className="text-xl font-bold mb-6"
                    style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                  >
                    Send Us a Message
                  </h3>
                  <form className="space-y-4" onSubmit={handleContactSubmit}>
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium mb-1.5"
                        style={{ color: 'hsl(var(--foreground))' }}>
                        Your Name
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        placeholder="Your name"
                        required
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                        style={{
                          background: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--foreground))',
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-medium mb-1.5"
                        style={{ color: 'hsl(var(--foreground))' }}>
                        Email Address
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                        style={{
                          background: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--foreground))',
                        }}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-message" className="block text-sm font-medium mb-1.5"
                        style={{ color: 'hsl(var(--foreground))' }}>
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={4}
                        placeholder="How can we help you?"
                        required
                        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 resize-none"
                        style={{
                          background: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--foreground))',
                        }}
                      />
                    </div>
                    {contactStatus === 'success' && (
                      <p role="status" className="text-sm" style={{ color: 'hsl(var(--success))' }}>
                        {contactNotificationSent
                          ? 'Your message has been received. Thank you for reaching out.'
                          : 'Your message was saved for the church team; email notifications could not be sent.'}
                      </p>
                    )}
                    {contactStatus === 'error' && (
                      <p role="alert" className="text-sm" style={{ color: 'hsl(var(--destructive))' }}>
                        {contactError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={contactStatus === 'sending'}
                      className="w-full py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
                      style={{
                        background: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                      }}
                    >
                      {contactStatus === 'sending' ? 'Sending…' : 'Send Message'}
                    </button>
                    <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      We'll get back to you within 24 hours.
                    </p>
                  </form>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

      </main>

      {/* ── Hover effect styles ── */}
      <style>{`
        .hero-cta-primary:hover { background: hsl(var(--primary-dark)) !important; transform: translateY(-2px); }
        .hero-cta-secondary:hover { background: hsl(var(--primary) / 0.2) !important; }
        .sermon-card:hover .sermon-play-overlay { opacity: 1; }
        .ministry-card:hover .ministry-img { transform: scale(1.05); }
        .ministry-card:hover .ministry-overlay { background: hsl(var(--surface-dark) / 0.35) !important; }
        .ministry-card:hover .ministry-accent { opacity: 1 !important; }
        .gallery-item:hover .gallery-overlay { opacity: 1; }
        .gallery-item:hover .gallery-img { transform: scale(1.05); }
      `}</style>
    </>
  );
}
