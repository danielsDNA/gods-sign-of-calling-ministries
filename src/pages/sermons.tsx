import { sermons as defaultSermons } from 'virtual:content';
/*
 * ============================================================
 * SERMONS / MESSAGES PAGE
 * ============================================================
 * Sections:
 *   1. Page Hero  — breadcrumb + intro
 *   2. Featured Sermon — large card with inline embed toggle
 *   3. Filter Bar — search, series chips, speaker chips
 *   4. Sermon Grid — cards with image, meta, play/listen CTAs
 *   5. Scripture / Subscribe CTA banner
 *
 * Content driven from src/content/pages/sermons.json
 * Published sermons are loaded from the CMS API with authored fallback content.
 * ============================================================
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight,
  Search,
  Play,
  Clock,
  BookOpen,
  User,
  Calendar,
  X,
  ArrowRight,
  Headphones,
  Filter,
} from 'lucide-react';

import { useCmsList } from '@/hooks/useCmsList';
import { usePageContent } from '@/hooks/usePageContent';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { buildPageSeoUrls } from '@/lib/seo-url';
import ScrollReveal from '@/components/ScrollReveal';
import RichTextContent from '@/components/RichTextContent';
import { SocialPlatformIcon } from '@/components/SocialMediaLinks';
import { getSocialMediaLinks } from '@/lib/social-media';
import { resolveSermonMedia } from '@/lib/media-urls';

/* ── Types ── */
interface Sermon {
  id: string;
  title: string;
  series: string;
  speaker: string;
  date: string;
  duration: string;
  scripture: string;
  description: string;
  image: string;
  videoUrl: string;
  audioUrl: string;
  tags: string[];
}

interface SeriesItem {
  id: string;
  name: string;
}

interface SpeakerItem {
  id: string;
  name: string;
}

interface CmsSermon {
  id: number;
  title: string;
  speaker: string | null;
  series: string | null;
  scripture: string | null;
  description: string | null;
  preachedOn: string | null;
  mediaType: string | null;
  mediaUrl: string;
  thumbnailUrl: string | null;
}

/* ── Tag pill ── */
function SermonTag({ label }: { label: string }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: 'hsl(var(--primary) / 0.12)',
        color: 'hsl(var(--primary-dark))',
      }}
    >
      {label}
    </span>
  );
}

/* ── Embed placeholder ── */
function EmbedPlaceholder() {
  return (
    <div
      className="rounded-xl flex items-center justify-center"
      style={{ background: 'hsl(var(--surface-dark))', aspectRatio: '16/9' }}
    >
      <div className="text-center px-4">
        <Play size={28} style={{ color: 'hsl(var(--primary))', margin: '0 auto 8px' }} />
        <p className="text-xs" style={{ color: 'hsl(var(--surface-dark-muted))' }}>
          Add a video URL to enable playback
        </p>
      </div>
    </div>
  );
}

function SermonPlayer({ sermon }: { sermon: Sermon }) {
  if (sermon.audioUrl) {
    return <audio controls className="w-full" src={sermon.audioUrl}>Your browser does not support audio playback.</audio>;
  }
  const media = resolveSermonMedia(sermon.videoUrl, 'video');
  if (media.kind === 'empty') return <EmbedPlaceholder />;
  if (media.kind === 'embed') {
    return (
      <iframe
        title={sermon.title}
        src={media.url}
        className="w-full rounded-xl"
        style={{ aspectRatio: '16/9' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }
  if (media.kind === 'video') {
    return <video controls className="w-full rounded-xl" src={media.url}>Your browser does not support video playback.</video>;
  }
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium underline"
      style={{ color: 'hsl(var(--primary))' }}
    >
      Open sermon on its source
    </a>
  );
}

/* ── Main Component ── */
export default function SermonsPage() {
  const { content: sermons } = usePageContent('sermons', defaultSermons);
  const { items: cmsSermons } = useCmsList<CmsSermon>('/api/sermons', []);
  const { settings } = useSiteSettings();
  const seoUrls = buildPageSeoUrls(useJsonLdSiteUrl(), '/sermons');
  const youtubeLink = getSocialMediaLinks(settings).find(link => link.platform === 'youtube');
  const sermonList: Sermon[] = cmsSermons.map(sermon => ({
      id: String(sermon.id),
      title: sermon.title,
      series: sermon.series || 'Sermon',
      speaker: sermon.speaker || '',
      date: sermon.preachedOn ? new Date(`${sermon.preachedOn}T00:00:00`).toLocaleDateString() : '',
      duration: '',
      scripture: sermon.scripture || '',
      description: sermon.description || '',
      image: sermon.thumbnailUrl || '/airo-assets/images/sermons/sermon-1',
      videoUrl: sermon.mediaType === 'audio' ? '' : sermon.mediaUrl,
      audioUrl: sermon.mediaType === 'audio' ? sermon.mediaUrl : '',
      tags: sermon.series ? [sermon.series] : [],
    }));
  const seriesList: SeriesItem[] = [...new Set(sermonList.map(sermon => sermon.series))]
    .map((name, index) => ({ id: String(index), name }));
  const speakerList: SpeakerItem[] = [...new Set(sermonList.map(sermon => sermon.speaker).filter(Boolean))]
    .map((name, index) => ({ id: String(index), name }));

  const [query, setQuery] = useState('');
  const [activeSeries, setActiveSeries] = useState('All');
  const [activeSpeaker, setActiveSpeaker] = useState('All');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return sermonList.filter((s) => {
      const matchesQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.speaker.toLowerCase().includes(q) ||
        s.scripture.toLowerCase().includes(q) ||
        s.series.toLowerCase().includes(q);
      const matchesSeries = activeSeries === 'All' || s.series === activeSeries;
      const matchesSpeaker = activeSpeaker === 'All' || s.speaker === activeSpeaker;
      return matchesQuery && matchesSeries && matchesSpeaker;
    });
  }, [sermonList, query, activeSeries, activeSpeaker]);

  const hasActiveFilters = query !== '' || activeSeries !== 'All' || activeSpeaker !== 'All';

  function clearFilters() {
    setQuery('');
    setActiveSeries('All');
    setActiveSpeaker('All');
  }

  const featured = sermonList[0];

  return (
    <>
      <Helmet>
        <title>Sermons &amp; Messages — {settings.church_name}</title>
        <meta
          name="description"
          content={`Browse the full sermon library at ${settings.church_name}. Search by speaker, series, or scripture and be equipped by the Word of God.`}
        />
        {seoUrls.pageUrl && <link rel="canonical" href={seoUrls.pageUrl} />}
        <meta property="og:title" content={`Sermons & Messages — ${settings.church_name}`} />
        <meta
          property="og:description"
          content={`Explore messages from ${settings.church_name}. Every sermon rooted in Scripture and delivered to equip you for everyday life.`}
        />
        <meta property="og:type" content="website" />
        {seoUrls.pageUrl && <meta property="og:url" content={seoUrls.pageUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': seoUrls.webpageId,
            name: `Sermons & Messages — ${settings.church_name}`,
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
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'hsl(var(--primary) / 0.07)' }}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm mb-6">
              <Link
                to="/"
                className="transition-colors duration-200 hover:underline"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                Home
              </Link>
              <ChevronRight size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span style={{ color: 'hsl(var(--primary))' }}>Sermons</span>
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
                Messages from {settings.church_name}
              </p>
              <h1
                className="text-4xl sm:text-5xl font-bold mb-5"
                style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
              >
                Sermons &amp; Messages
              </h1>
              <p
                className="text-base sm:text-lg leading-relaxed"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                {sermons.intro}
              </p>
            </motion.div>
          </div>
        </section>


        {/* ================================================================
            SECTION 2: Featured / Latest Sermon
        ================================================================ */}
        <section className="py-xl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {featured ? <ScrollReveal>
              <div
                className="rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                {/* Thumbnail */}
                <div className="relative overflow-hidden" style={{ minHeight: '280px' }}>
                  <img
                    src={featured.image}
                    alt={featured.title}
                    loading="eager"
                    fetchPriority="high"
                    className="w-full h-full object-cover"
                    style={{ minHeight: '280px' }}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ background: 'hsl(var(--surface-dark) / 0.45)' }}
                  >
                    <button
                      className="w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110 pointer-events-auto"
                      style={{ background: 'hsl(var(--primary))' }}
                      onClick={() => setPlayingId(playingId === featured.id ? null : featured.id)}
                      aria-label={`Play ${featured.title}`}
                    >
                      <Play size={24} fill="white" style={{ color: 'white', marginLeft: '3px' }} />
                    </button>
                  </div>
                  <div className="absolute top-4 left-4 pointer-events-none">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                      style={{
                        background: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                      }}
                    >
                      Latest Message
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-8 flex flex-col justify-center gap-4">
                  <div className="flex flex-wrap gap-2">
                    {featured.tags.map((tag) => (
                      <SermonTag key={tag} label={tag} />
                    ))}
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ color: 'hsl(var(--primary))' }}
                    >
                      {featured.series}
                    </p>
                    <h2
                      className="text-2xl sm:text-3xl font-bold leading-snug mb-3"
                      style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                    >
                      {featured.title}
                    </h2>
                    <RichTextContent value={featured.description} className="text-sm leading-relaxed"
                      style={{ color: 'hsl(var(--muted-foreground))' }} />
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <span className="flex items-center gap-1.5">
                      <User size={13} style={{ color: 'hsl(var(--primary))' }} />
                      {featured.speaker}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} style={{ color: 'hsl(var(--primary))' }} />
                      {featured.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} style={{ color: 'hsl(var(--primary))' }} />
                      {featured.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={13} style={{ color: 'hsl(var(--primary))' }} />
                      {featured.scripture}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => setPlayingId(playingId === featured.id ? null : featured.id)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
                      style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                    >
                      <Play size={14} />
                      Watch Message
                    </button>
                    <button
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-80"
                      style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                    >
                      <Headphones size={14} />
                      Listen
                    </button>
                  </div>
                  <AnimatePresence>
                    {playingId === featured.id && (
                      <motion.div
                        key="featured-embed"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' as const }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2">
                          <SermonPlayer sermon={featured} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </ScrollReveal> : null}
          </div>
        </section>


        {/* ================================================================
            SECTION 3: Filter Bar
        ================================================================ */}
        <div
          className="sticky top-16 z-30 py-4 border-b"
          style={{
            background: 'hsl(var(--background) / 0.95)',
            backdropFilter: 'blur(12px)',
            borderColor: 'hsl(var(--border))',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
              {/* Search */}
              <div className="relative min-w-0 w-full sm:w-56">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <input
                  id="sermon-search"
                  name="sermonSearch"
                  aria-label="Search sermons"
                  type="search"
                  placeholder="Search sermons…"
                  value={query}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                  style={{
                    background: 'hsl(var(--muted))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
              </div>

              {/* Series filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                {['All', ...seriesList.map((s) => s.name)].map((name) => (
                  <button
                    key={name}
                    onClick={() => setActiveSeries(name)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                    style={
                      activeSeries === name
                        ? { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }
                        : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                    }
                  >
                    {name}
                  </button>
                ))}
              </div>

              {/* Speaker filter */}
              <div className="flex items-center gap-2 flex-wrap">
                {['All', ...speakerList.map((s) => s.name)].map((name) => (
                  <button
                    key={name}
                    onClick={() => setActiveSpeaker(name)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                    style={
                      activeSpeaker === name
                        ? { background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }
                        : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                    }
                  >
                    {name === 'All' ? 'All Speakers' : name.replace('Pastor ', '')}
                  </button>
                ))}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-medium hover:underline shrink-0"
                  style={{ color: 'hsl(var(--destructive))' }}
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>


        {/* ================================================================
            SECTION 4: Sermon Grid
        ================================================================ */}
        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {filtered.length === sermonList.length
                  ? `${sermonList.length} messages`
                  : `${filtered.length} of ${sermonList.length} messages`}
              </p>
            </div>

            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-24"
                >
                  <BookOpen size={40} className="mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <p className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                    {sermonList.length === 0 ? 'There are no sermons available right now.' : 'No sermons found'}
                  </p>
                  <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {sermonList.length === 0
                      ? <>You can <Link to="/contact" className="underline underline-offset-2">request prayer or reach out to us</Link>.</>
                      : 'Try adjusting your search or filters.'}
                  </p>
                  {sermonList.length > 0 && <button
                    onClick={clearFilters}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  >
                    Clear Filters
                  </button>}
                </motion.div>
              ) : (
                <motion.div key="grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((sermon, index) => (
                    <motion.div
                      key={sermon.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' as const }}
                      className="group flex flex-col rounded-2xl overflow-hidden"
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
                      {/* Thumbnail */}
                      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                        <img
                          src={sermon.image}
                          alt={sermon.title}
                          loading={index < 3 ? 'eager' : 'lazy'}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{ background: 'hsl(var(--surface-dark) / 0.5)' }}
                        >
                          <button
                            className="w-12 h-12 rounded-full flex items-center justify-center pointer-events-auto"
                            style={{ background: 'hsl(var(--primary))' }}
                            onClick={() => setPlayingId(playingId === sermon.id ? null : sermon.id)}
                            aria-label={`Play ${sermon.title}`}
                          >
                            <Play size={18} fill="white" style={{ color: 'white', marginLeft: '2px' }} />
                          </button>
                        </div>
                        <div className="absolute bottom-3 left-3 pointer-events-none">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: 'hsl(var(--surface-dark) / 0.75)',
                              color: 'hsl(var(--surface-dark-fg))',
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            {sermon.series}
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="flex flex-col flex-1 p-5 gap-3">
                        <h3
                          className="text-base font-bold leading-snug"
                          style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                        >
                          {sermon.title}
                        </h3>
                        <RichTextContent value={sermon.description} className="text-xs leading-relaxed line-clamp-2 flex-1"
                          style={{ color: 'hsl(var(--muted-foreground))' }} />
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          <span className="flex items-center gap-1">
                            <User size={11} style={{ color: 'hsl(var(--primary))' }} />
                            {sermon.speaker.replace('Pastor ', 'Ptr. ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={11} style={{ color: 'hsl(var(--primary))' }} />
                            {sermon.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} style={{ color: 'hsl(var(--primary))' }} />
                            {sermon.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen size={11} style={{ color: 'hsl(var(--primary))' }} />
                            {sermon.scripture}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sermon.tags.map((tag) => (
                            <SermonTag key={tag} label={tag} />
                          ))}
                        </div>
                        <div className="border-t" style={{ borderColor: 'hsl(var(--border))' }} />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPlayingId(playingId === sermon.id ? null : sermon.id)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:opacity-90"
                            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                          >
                            <Play size={12} />
                            Watch
                          </button>
                          <button
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:opacity-80"
                            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                          >
                            <Headphones size={12} />
                            Listen
                          </button>
                        </div>
                        <AnimatePresence>
                          {playingId === sermon.id && (
                            <motion.div
                              key={`embed-${sermon.id}`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: 'easeOut' as const }}
                              className="overflow-hidden"
                            >
                              <EmbedPlaceholder />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>


        {/* ================================================================
            SECTION 5: Subscribe / CTA Banner
        ================================================================ */}
        <section className="relative py-xxl overflow-hidden">
          <img
            src="/airo-assets/images/pages/home/scripture-banner"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'hsl(var(--surface-dark) / 0.80)' }}
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: 'easeOut' as const }}
              >
                <div className="w-10 h-0.5 mx-auto mb-6 rounded-full" style={{ background: 'hsl(var(--primary))' }} />
                <h2
                  className="text-2xl sm:text-3xl font-bold mb-4"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--white))' }}
                >
                  Never Miss a Message
                </h2>
                <p className="text-base leading-relaxed mb-8" style={{ color: 'hsl(var(--surface-dark-muted))' }}>
                  Join us every Sunday at 9:00 AM and 11:00 AM, or watch online. New sermons are added to this library each week.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  >
                    Plan Your Visit
                    <ArrowRight size={15} />
                  </Link>
                  {youtubeLink && (
                    <a
                      href={youtubeLink.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-80"
                      style={{
                        background: 'hsl(var(--glass-dark-bg))',
                        color: 'hsl(var(--surface-dark-fg))',
                        border: '1px solid hsl(var(--glass-dark-border))',
                      }}
                    >
                      <SocialPlatformIcon platform="youtube" size={18} />
                      Watch on YouTube
                    </a>
                  )}
                </div>
                <div className="w-10 h-0.5 mx-auto mt-8 rounded-full" style={{ background: 'hsl(var(--primary))' }} />
              </motion.div>
            </ScrollReveal>
          </div>
        </section>

      </main>
    </>
  );
}
