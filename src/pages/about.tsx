import { about as defaultAbout } from 'virtual:content';
/*
 * ============================================================
 * ABOUT US PAGE
 * ============================================================
 * Sections:
 *   1. Page Hero        — full-width image, breadcrumb, heading
 *   2. Impact Stats     — shared with the homepage and CMS-editable
 *   3. Our Story        — 3-paragraph narrative, community photo
 *   4. Mission & Vision — stacked graphic rows
 *   5. Core Values      — 6-card grid with icons
 *   6. Leadership Team  — 6-card grid with photos, bios
 *   7. Scripture Banner — Psalm 27:1
 *   8. Come As You Are  — CTA strip linking to /contact
 *
 * Authored copy falls back to src/content/pages/about.json; CMS settings and leadership override it.
 * ============================================================
 */

import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import {
  ChevronRight,
  BookOpen,
  Heart,
  Users,
  Globe,
  Star,
  Zap,
  ArrowRight,
} from 'lucide-react';

import { useCmsList } from '@/hooks/useCmsList';
import { usePageContent } from '@/hooks/usePageContent';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useJsonLdSiteUrl } from '@/lib/json-ld-site-url-context';
import { buildPageSeoUrls } from '@/lib/seo-url';
import ScrollReveal from '@/components/ScrollReveal';
import ChurchImpactStats from '@/components/ChurchImpactStats';

/* ── Icon map for values ── */
const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen size={22} />,
  Heart:    <Heart    size={22} />,
  Users:    <Users    size={22} />,
  Globe:    <Globe    size={22} />,
  Star:     <Star     size={22} />,
  Zap:      <Zap      size={22} />,
};

/* ── Types ── */
interface StoryParagraph { id: string; text: string; }
type AboutMission = typeof defaultAbout.mission & Partial<Record<
  'evangelism' | 'evangelismReference' | 'worship' | 'worshipReference' |
  'discipleship' | 'discipleshipReference' | 'missions' | 'missionsReference',
  string
>>;
interface Value { id: string; icon: string; title: string; description: string; }
interface Stat  { id: string; value: string; label: string; }
interface TeamMember { id: string; name: string; role: string; bio: string; image: string; }
interface CmsLeader { id: number; name: string; title: string | null; bio: string | null; imageUrl: string | null; }

export default function AboutPage() {
  const { content: about } = usePageContent('about', defaultAbout);
  const storyBody  = about.story.body    as StoryParagraph[];
  const values     = about.values        as Value[];
  const stats      = about.stats         as Stat[];
  const mission = about.mission as AboutMission;
  const { settings } = useSiteSettings();
  const seoUrls = buildPageSeoUrls(useJsonLdSiteUrl(), '/about');
  const { items: cmsLeaders, usingFallback } = useCmsList<CmsLeader>('/api/leadership', []);
  const staticTeam = about.team as TeamMember[];
  const team: TeamMember[] = usingFallback && cmsLeaders.length === 0
    ? staticTeam
    : cmsLeaders.map(leader => ({
      id: String(leader.id),
      name: leader.name,
      role: leader.title || '',
      bio: leader.bio || '',
      image: leader.imageUrl || '/airo-assets/images/leadership/pastor',
    }));
  const displayedStory = storyBody;
  const missionObjectives: Array<{ title: string; description: string; reference: string }> = [
    { title: 'EVANGELISM', description: mission.evangelism || '', reference: mission.evangelismReference || '' },
    { title: 'WORSHIP', description: mission.worship || '', reference: mission.worshipReference || '' },
    { title: 'DISCIPLESHIP', description: mission.discipleship || '', reference: mission.discipleshipReference || '' },
    { title: 'MISSIONS', description: mission.missions || '', reference: mission.missionsReference || '' },
  ];

  return (
    <>
      <Helmet>
        <title>About Us — {settings.church_name}</title>
        <meta
          name="description"
          content={`Learn the story, mission, vision, and values of ${settings.church_name}. Meet our leadership team and discover what makes us who we are.`}
        />
        {seoUrls.pageUrl && <link rel="canonical" href={seoUrls.pageUrl} />}
        <meta property="og:title"       content={`About Us — ${settings.church_name}`} />
        <meta property="og:description" content={`The story, mission, and people behind ${settings.church_name}.`} />
        <meta property="og:type"        content="website" />
        {seoUrls.pageUrl && <meta property="og:url" content={seoUrls.pageUrl} />}
        <meta name="twitter:card"       content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            '@id': seoUrls.webpageId,
            name: `About Us — ${settings.church_name}`,
            url: seoUrls.pageUrl,
            isPartOf: { '@id': seoUrls.websiteId },
            about: { '@id': seoUrls.organizationId },
          }).replace(/</g, '\u003c')}
        </script>
      </Helmet>

      <main>

        {/* ================================================================
            SECTION 1: Page Hero
        ================================================================ */}
        <section className="relative min-h-[420px] flex items-center overflow-hidden" style={{ background: 'hsl(var(--surface-alt))' }}>
          <img
            src={settings.about_image_url || settings.about_bg_url || '/community.png'}
            alt="God's Sign of Calling Revival Ministries community"
            loading="eager"
            fetchPriority="high"
            className="absolute inset-y-0 right-0 h-full w-full object-cover lg:w-[72%]"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--surface-alt)) 0%, hsl(var(--surface-alt) / 0.98) 34%, hsl(var(--surface-alt) / 0.84) 50%, hsl(var(--surface-alt) / 0.4) 72%, transparent 100%)',
            }}
          />

          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm mb-5">
              <Link
                to="/"
                className="transition-colors duration-200 hover:underline"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                Home
              </Link>
              <ChevronRight size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span style={{ color: 'hsl(var(--foreground))' }}>About Us</span>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' as const }}
              className="max-w-2xl lg:max-w-[58%]"
            >
              <p
                className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] mb-3"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                {about.hero.eyebrow}
              </p>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
                style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
              >
                {about.hero.heading}
              </h1>
              <p
                className="text-base sm:text-lg leading-relaxed"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                {about.hero.subheading}
              </p>
            </motion.div>
          </div>
        </section>


        {/* ================================================================
            SECTION 2: Stats Bar
        ================================================================ */}
        <section>
          <ChurchImpactStats stats={stats} />
        </section>


        {/* ================================================================
            SECTION 3: Our Story
        ================================================================ */}
        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

              {/* Text */}
              <ScrollReveal>
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-widest mb-3"
                    style={{ color: 'hsl(var(--primary))' }}
                  >
                    Our history
                  </p>
                  <h2
                    className="text-3xl sm:text-4xl font-bold mb-8"
                    style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                  >
                    {about.story.heading}
                  </h2>
                  <div className="flex flex-col gap-5">
                    {displayedStory.map((para) => (
                      <p
                        key={para.id}
                        className="text-base leading-relaxed"
                        style={{ color: 'hsl(var(--muted-foreground))', whiteSpace: 'pre-line' }}
                      >
                        {para.text}
                      </p>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Image */}
              <ScrollReveal>
                <div className="relative">
                  <div
                    className="absolute -top-4 -left-4 w-full h-full rounded-2xl pointer-events-none"
                    style={{ background: 'hsl(var(--primary) / 0.12)', borderRadius: '1rem' }}
                  />
                  <img
                    src={settings.about_image_url || '/community.png'}
                    alt="God's Sign of Calling Revival Ministries community gathered together"
                    loading="lazy"
                    className="relative rounded-2xl w-full object-cover"
                    style={{ aspectRatio: '4/3' }}
                  />
                  {/* Scripture pull-quote */}
                  <div
                    className="absolute -bottom-6 -right-4 max-w-xs p-5 rounded-xl shadow-lg"
                    style={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <p
                      className="text-sm italic leading-relaxed mb-2"
                      style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                    >
                      &ldquo;{about.scripture.text}&rdquo;
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: 'hsl(var(--primary))' }}
                    >
                      — {about.scripture.reference}
                    </p>
                  </div>
                </div>
              </ScrollReveal>

            </div>
          </div>
        </section>


        {/* ================================================================
            SECTION 4: Mission & Vision
        ================================================================ */}
        <section className="py-xxl" style={{ background: 'hsl(var(--surface-dark))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center max-w-2xl mx-auto mb-14">
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'hsl(var(--primary-light))' }}
                >
                  Purpose &amp; direction
                </p>
                <h2
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--surface-dark-fg))' }}
                >
                  Why We Exist &amp; Where We Are Going
                </h2>
              </div>
            </ScrollReveal>

            <div className="mission-showcase">
              <ScrollReveal>
                <article className="mission-showcase__row">
                  <div className="mission-showcase__icon mission-showcase__icon--mission" aria-hidden="true">
                    <Heart size={34} />
                  </div>
                  <div>
                    <p className="mission-showcase__eyebrow">OUR</p>
                    <h3 className="mission-showcase__title">MISSION</h3>
                    <p className="mission-showcase__heading">{about.mission.heading}</p>
                    <p className="mission-showcase__statement">
                      &ldquo;{about.mission.statement}&rdquo;
                    </p>
                    <p className="mission-showcase__description">{about.mission.description}</p>
                    <div className="mt-5 space-y-4">
                      {missionObjectives.filter(objective => objective.description).map(objective => (
                        <p key={objective.title} className="mission-showcase__description">
                          <strong>{objective.title}: </strong>{objective.description}{objective.reference ? ` (${objective.reference})` : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                </article>
              </ScrollReveal>
              <ScrollReveal delay={0.12}>
                <article className="mission-showcase__row">
                  <div className="mission-showcase__icon mission-showcase__icon--vision" aria-hidden="true">
                    <Globe size={34} />
                  </div>
                  <div>
                    <p className="mission-showcase__eyebrow">OUR</p>
                    <h3 className="mission-showcase__title">VISION</h3>
                    <p className="mission-showcase__heading">{about.vision.heading}</p>
                    <p className="mission-showcase__statement">
                      &ldquo;{about.vision.statement}&rdquo;
                    </p>
                    <p className="mission-showcase__description">{about.vision.description}</p>
                  </div>
                </article>
              </ScrollReveal>
            </div>
          </div>
        </section>


        {/* ================================================================
            SECTION 5: Core Values
        ================================================================ */}
        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center max-w-2xl mx-auto mb-14">
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'hsl(var(--primary))' }}
                >
                  What shapes us
                </p>
                <h2
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                >
                  Our Core Values
                </h2>
              </div>
            </ScrollReveal>

            <div className="core-values-grid">
              {values.map((val, i) => (
                <ScrollReveal key={val.id} className="core-value-slot h-full">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07, ease: 'easeOut' as const }}
                    className="core-value-card h-full"
                  >
                    <div
                      className="core-value-card__icon w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    >
                      {iconMap[val.icon] ?? <Star size={22} />}
                    </div>
                    <div>
                      <h3
                        className="text-base font-bold mb-2"
                      >
                        {val.title}
                      </h3>
                      <p className="text-sm leading-relaxed opacity-80">
                        {val.description}
                      </p>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>


        {/* ================================================================
            SECTION 6: Leadership Team
        ================================================================ */}
        {team.length > 0 && (
        <section className="py-xxl" style={{ background: 'hsl(var(--surface-alt))' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center max-w-2xl mx-auto mb-14">
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: 'hsl(var(--primary))' }}
                >
                  The people behind the mission
                </p>
                <h2
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                >
                  Meet Our Leadership Team
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {team.map((member, i) => (
                <ScrollReveal key={member.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.08, ease: 'easeOut' as const }}
                    className="group rounded-2xl overflow-hidden flex flex-col"
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
                    {/* Photo */}
                    <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                      <img
                        src={member.image}
                        alt={member.name}
                        loading={i < 3 ? 'eager' : 'lazy'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Brand accent bar */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1"
                        style={{ background: 'hsl(var(--primary))' }}
                      />
                    </div>

                    {/* Details */}
                    <div className="p-6 flex flex-col gap-2 flex-1">
                      <div>
                        <h3
                          className="text-lg font-bold leading-snug"
                          style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                        >
                          {member.name}
                        </h3>
                        <p
                          className="text-xs font-semibold uppercase tracking-widest mt-0.5"
                          style={{ color: 'hsl(var(--primary))' }}
                        >
                          {member.role}
                        </p>
                      </div>
                      <p
                        className="text-sm leading-relaxed flex-1"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        {member.bio}
                      </p>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
        )}


        {/* ================================================================
            SECTION 7: Scripture Banner
        ================================================================ */}
        <section className="relative py-xxl overflow-hidden">
          <img
            src={settings.scripture_banner_image_url || '/airo-assets/images/pages/home/scripture-banner'}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'hsl(var(--surface-dark) / 0.82)' }}
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
                  className="w-10 h-0.5 mx-auto mb-8 rounded-full"
                  style={{ background: 'hsl(var(--primary))' }}
                />
                <p
                  className="scripture-quote text-2xl sm:text-3xl font-bold italic leading-relaxed mb-5"
                  style={{ fontFamily: 'var(--font-heading)', color: 'white' }}
                >
                  &ldquo;{about.scripture.text}&rdquo;
                </p>
                <p
                  className="scripture-reference text-sm font-semibold uppercase tracking-widest"
                  style={{ color: 'hsl(var(--primary))' }}
                >
                  {about.scripture.reference}
                </p>
                <div
                  className="w-10 h-0.5 mx-auto mt-8 rounded-full"
                  style={{ background: 'hsl(var(--primary))' }}
                />
              </motion.div>
            </ScrollReveal>
          </div>
        </section>


        {/* ================================================================
            SECTION 8: Come As You Are CTA
        ================================================================ */}
        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: 'easeOut' as const }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
                >
                  <Heart size={26} />
                </div>
                <h2
                  className="text-3xl sm:text-4xl font-bold mb-5"
                  style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                >
                  {about.cta.heading}
                </h2>
                <p
                  className="text-base sm:text-lg leading-relaxed mb-8"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {about.cta.body}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  >
                    Plan Your Visit
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    to="/sermons"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-80"
                    style={{
                      background: 'hsl(var(--muted))',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    Watch a Sermon
                  </Link>
                </div>
              </motion.div>
            </ScrollReveal>
          </div>
        </section>

      </main>
    </>
  );
}
