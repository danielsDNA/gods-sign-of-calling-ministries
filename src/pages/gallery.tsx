import { gallery as defaultGallery } from 'virtual:content';
/*
 * ============================================================
 * CHURCH GALLERY PAGE
 * ============================================================
 * Sections:
 *   1. Page Hero — title + breadcrumb + intro paragraph
 *   2. Category filter chips
 *   3. Masonry photo grid (CSS columns, AnimatePresence)
 *   4. Fullscreen lightbox with prev/next + keyboard nav
 *   5. Submit Your Photo CTA → /contact
 *
 * Photos load from the CMS API and fall back to src/content/pages/gallery.json.
 * ============================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Camera,
  Upload,
  Download,
} from 'lucide-react';

import { useCmsList } from '@/hooks/useCmsList';
import { usePageContent } from '@/hooks/usePageContent';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { buildPageSeoUrls } from '@/lib/seo-url';
import ScrollReveal from '@/components/ScrollReveal';
import { churchImageUrl } from '@/lib/church-image-url';

/* ── Types ── */
interface Photo {
  id: string;
  slot: string;
  alt: string;
  category: string;
  tall: boolean;
}

interface CmsGalleryImage {
  id: number;
  imageUrl: string;
  caption: string | null;
  category: string | null;
}

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loadedImageIds, setLoadedImageIds] = useState<Set<string>>(() => new Set());
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(() => new Set());

  const { content: gallery } = usePageContent('gallery', defaultGallery);
  const { items: cmsImages, loading } = useCmsList<CmsGalleryImage>('/api/gallery', []);
  const { settings } = useSiteSettings();
  const seoUrls = buildPageSeoUrls(useJsonLdSiteUrl(), '/gallery');
  const [downloadError, setDownloadError] = useState('');
  const photos: Photo[] = cmsImages.map(image => ({
      id: String(image.id),
      slot: image.imageUrl,
      alt: image.caption || `${settings.church_name} community`,
      category: image.category || 'General',
      tall: false,
    }));
  const categories = Array.from(new Set(['All', ...photos.map(photo => photo.category).filter(Boolean)]));
  const displayedCategory = categories.includes(activeCategory) ? activeCategory : 'All';
  const filtered = displayedCategory === 'All'
    ? (() => {
      const sampleLimit = 12;
      const selected = new Set<string>();
      const sample: Photo[] = [];
      for (const photo of photos) {
        if (!selected.has(photo.category)) {
          selected.add(photo.category);
          sample.push(photo);
        }
      }
      for (const photo of photos) {
        if (sample.length >= sampleLimit) break;
        if (!sample.some(item => item.id === photo.id)) sample.push(photo);
      }
      return sample.slice(0, sampleLimit);
    })()
    : photos.filter(photo => photo.category === displayedCategory);

  /* ── Lightbox helpers ── */
  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) =>
      i === null ? null : (i - 1 + filtered.length) % filtered.length
    );
  }, [filtered.length]);

  const goNext = useCallback(() => {
    setLightboxIndex((i) =>
      i === null ? null : (i + 1) % filtered.length
    );
  }, [filtered.length]);

  /* Keyboard navigation */
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, goPrev, goNext]);

  /* Lock body scroll when lightbox is open */
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxIndex]);

  const currentPhoto = lightboxIndex !== null ? filtered[lightboxIndex] : null;
  const downloadWatermarkedPhoto = async (photo: Photo) => {
    setDownloadError('');
    try {
      const loadImage = (src: string) => new Promise<InstanceType<typeof window.Image>>((resolve, reject) => {
        const image = new window.Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('The image or logo cannot be accessed for download.'));
        image.src = src;
      });

      const [source, logo] = await Promise.all([
        loadImage(churchImageUrl(photo.slot)),
        loadImage(settings.logo_url || '/airo-assets/images/logo/horizontal/dark'),
      ]);
      const canvas = document.createElement('canvas');
      canvas.width = source.naturalWidth;
      canvas.height = source.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image export is not supported by this browser.');

      context.drawImage(source, 0, 0);
      const padding = Math.max(12, Math.round(canvas.width * 0.02));
      const maxLogoWidth = canvas.width * 0.28;
      const maxLogoHeight = canvas.height * 0.14;
      const scale = Math.min(maxLogoWidth / logo.naturalWidth, maxLogoHeight / logo.naturalHeight);
      const logoWidth = logo.naturalWidth * scale;
      const logoHeight = logo.naturalHeight * scale;
      context.fillStyle = 'rgba(255,255,255,0.92)';
      context.beginPath();
      context.roundRect(padding, padding, logoWidth + padding * 2, logoHeight + padding * 2, padding * 0.4);
      context.fill();
      context.drawImage(logo, padding * 2, padding * 2, logoWidth, logoHeight);

      const blob = await new Promise<Parameters<typeof window.URL.createObjectURL>[0]>((resolve, reject) => {
        canvas.toBlob(result => result ? resolve(result) : reject(new Error('Unable to create the downloaded image.')), 'image/png');
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${photo.alt.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'church-gallery'}-with-logo.png`;
      link.click();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Unable to download this image with the church logo.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Gallery — {settings.church_name}</title>
        <meta
          name="description"
          content={`Browse photos from ${settings.church_name} — worship services, community events, baptisms, youth ministry, outreach, and more.`}
        />
        {seoUrls.pageUrl && <link rel="canonical" href={seoUrls.pageUrl} />}
        <meta property="og:title" content={`Gallery — ${settings.church_name}`} />
        <meta
          property="og:description"
          content={`Photos from ${settings.church_name} — moments of faith, community, and worship.`}
        />
        <meta property="og:type" content="website" />
        {seoUrls.pageUrl && <meta property="og:url" content={seoUrls.pageUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ImageGallery',
            '@id': seoUrls.webpageId,
            name: `Gallery — ${settings.church_name}`,
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
          {/* Decorative amber blob */}
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none"
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
              <span style={{ color: 'hsl(var(--primary))' }}>Gallery</span>
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
                Life at {settings.church_name}
              </p>
              <h1
                className="text-4xl sm:text-5xl font-bold mb-5"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'hsl(var(--foreground))',
                }}
              >
                Our Photo Gallery
              </h1>
              <p
                className="text-base sm:text-lg leading-relaxed"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                {gallery.intro}
              </p>
            </motion.div>
          </div>
        </section>


        {/* ================================================================
            SECTION 2: Category Filter + Masonry Grid
        ================================================================ */}
        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Filter chips */}
            <ScrollReveal>
              <div
                className="flex flex-wrap gap-2 mb-10"
                role="group"
                aria-label="Filter gallery by category"
              >
                {categories.map((cat) => {
                  const isActive = displayedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                      style={{
                        background: isActive
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--muted))',
                        color: isActive
                          ? 'hsl(var(--primary-foreground))'
                          : 'hsl(var(--muted-foreground))',
                        transform: isActive ? 'scale(1.04)' : 'scale(1)',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </ScrollReveal>

            {/* Photo count */}
            {!loading && <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {filtered.length} {filtered.length === 1 ? 'photo' : 'photos'}
              {displayedCategory !== 'All' && (
                <>
                  {' '}in{' '}
                  <span style={{ color: 'hsl(var(--primary))' }}>{displayedCategory}</span>
                </>
              )}
            </p>}

            {/* Masonry grid — CSS columns */}
            <AnimatePresence mode="wait">
              <motion.div
                key={displayedCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="masonry-grid"
              >
                {loading ? Array.from({ length: 8 }, (_, index) => (
                  <div
                    key={`gallery-skeleton-${index}`}
                    className="masonry-item animate-pulse rounded-xl bg-muted"
                    aria-hidden="true"
                    style={{ height: `${150 + (index % 3) * 55}px` }}
                  />
                )) : filtered.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                      ease: 'easeOut' as const,
                    }}
                    className="masonry-item group cursor-pointer relative overflow-hidden rounded-xl"
                    style={{ minHeight: photo.tall ? '280px' : '190px' }}
                    onClick={() => openLightbox(index)}
                    role="button"
                    tabIndex={0}
                    aria-label={`View photo: ${photo.alt}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openLightbox(index);
                    }}
                  >
                    {!loadedImageIds.has(photo.id) && !failedImageIds.has(photo.id) && (
                      <div
                        className="absolute inset-0 animate-pulse bg-muted"
                        role="status"
                        aria-label={`Loading ${photo.alt}`}
                      />
                    )}
                    {failedImageIds.has(photo.id) ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted px-4 text-center text-sm text-muted-foreground" role="img" aria-label={`${photo.alt} could not be loaded`}>
                        Photo unavailable
                      </div>
                    ) : (
                      <img
                        src={churchImageUrl(photo.slot)}
                        alt={photo.alt}
                        loading={index < 6 ? 'eager' : 'lazy'}
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ display: loadedImageIds.has(photo.id) ? 'block' : 'none' }}
                        onLoad={() => setLoadedImageIds(previous => new Set(previous).add(photo.id))}
                        onError={() => setFailedImageIds(previous => new Set(previous).add(photo.id))}
                      />
                    )}
                    {/* Hover overlay — pointer-events-none so clicks reach the card */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none"
                      style={{ background: 'var(--masonry-hover-gradient)' }}
                    >
                      <span
                        className="inline-block self-start px-2.5 py-1 rounded-full text-xs font-semibold mb-1"
                        style={{
                          background: 'hsl(var(--primary))',
                          color: 'hsl(var(--primary-foreground))',
                        }}
                      >
                        {photo.category}
                      </span>
                      <p
                        className="text-xs line-clamp-2"
                        style={{ color: 'hsl(var(--white))' }}
                      >
                        {photo.alt}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-20">
                <Camera
                  size={40}
                  className="mx-auto mb-4"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <p
                  className="text-base font-medium"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  No photos in this category yet.
                </p>
              </div>
            )}
          </div>
        </section>


        {/* ================================================================
            SECTION 3: Submit Your Photo CTA
        ================================================================ */}
        <section className="py-xl" style={{ background: 'hsl(var(--surface-alt))' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <div
                className="rounded-2xl p-10"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'hsl(var(--primary) / 0.12)' }}
                >
                  <Upload size={24} style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <h2
                  className="text-2xl sm:text-3xl font-bold mb-3"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  Have a Photo to Share?
                </h2>
                <p
                  className="text-base mb-7 max-w-md mx-auto"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  Captured a special moment with {settings.church_name}? We'd love to feature it here.
                  Send us your photo and help tell our story.
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
                  style={{
                    background: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                  }}
                >
                  <Camera size={16} />
                  Submit Your Photo
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

      </main>


      {/* ================================================================
          LIGHTBOX
      ================================================================ */}
      <AnimatePresence>
        {lightboxIndex !== null && currentPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: 'hsl(var(--lightbox-bg))' }}
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label={`Photo lightbox: ${currentPhoto.alt}`}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
              style={{
                background: 'hsl(var(--lightbox-btn-bg))',
                color: 'hsl(var(--white))',
              }}
              aria-label="Close lightbox"
            >
              <X size={20} />
            </button>

            <button
              onClick={(event) => {
                event.stopPropagation();
                void downloadWatermarkedPhoto(currentPhoto);
              }}
              className="absolute top-4 left-4 z-10 inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium"
              style={{ background: 'hsl(var(--lightbox-btn-bg))', color: 'hsl(var(--white))' }}
              aria-label="Download photo with church logo"
            >
              <Download size={17} />
              Download
            </button>

            {/* Prev */}
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-200"
              style={{
                background: 'hsl(var(--lightbox-btn-bg))',
                color: 'hsl(var(--white))',
              }}
              aria-label="Previous photo"
            >
              <ChevronLeft size={22} />
            </button>

            {/* Next */}
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-200"
              style={{
                background: 'hsl(var(--lightbox-btn-bg))',
                color: 'hsl(var(--white))',
              }}
              aria-label="Next photo"
            >
              <ChevronRightIcon size={22} />
            </button>

            {/* Image + caption */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhoto.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22 }}
                className="relative max-w-5xl w-full mx-16 flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={churchImageUrl(currentPhoto.slot)}
                  alt={currentPhoto.alt}
                  className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain"
                  style={{ boxShadow: 'var(--lightbox-shadow)' }}
                />
                {/* Caption */}
                <div className="mt-4 text-center">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2"
                    style={{
                      background: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                    }}
                  >
                    {currentPhoto.category}
                  </span>
                  <p
                    className="text-sm"
                    style={{ color: 'hsl(var(--white-85))' }}
                  >
                    {currentPhoto.alt}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'hsl(var(--lightbox-caption-muted))' }}
                  >
                    {(lightboxIndex ?? 0) + 1} / {filtered.length}
                  </p>
                  {downloadError && <p role="alert" className="mt-2 text-sm text-red-300">{downloadError}</p>}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Masonry CSS */}
      <style>{`
        .masonry-grid {
          column-count: 2;
          column-gap: 12px;
        }
        @media (min-width: 640px) {
          .masonry-grid { column-count: 3; column-gap: 14px; }
        }
        @media (min-width: 1024px) {
          .masonry-grid { column-count: 4; column-gap: 16px; }
        }
        .masonry-item {
          break-inside: avoid;
          margin-bottom: 12px;
        }
        @media (min-width: 640px) {
          .masonry-item { margin-bottom: 14px; }
        }
        @media (min-width: 1024px) {
          .masonry-item { margin-bottom: 16px; }
        }
        .masonry-item img {
          min-height: 140px;
        }
        .lightbox-btn-hover:hover {
          background: hsl(var(--lightbox-btn-hover)) !important;
        }
      `}</style>
    </>
  );
}
