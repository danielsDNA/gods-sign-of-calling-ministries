import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router';

import { useSiteSettings } from '@/hooks/useSiteSettings';
import ScrollReveal from '@/components/ScrollReveal';

export default function PrivacyPage() {
  const { settings } = useSiteSettings();
  const churchName = settings.church_name || "God's Sign of Calling Revival Ministries";

  return (
    <>
      <Helmet>
        <title>Privacy Policy — {churchName}</title>
        <meta
          name="description"
          content={`Learn how ${churchName} handles information submitted through this website and manages optional analytics.`}
        />
      </Helmet>
      <main>
        <section className="relative overflow-hidden py-20 sm:py-28" style={{ background: 'hsl(var(--surface-alt))' }}>
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'hsl(var(--primary))' }}>Your information</p>
              <h1 className="mb-6 text-4xl font-bold sm:text-5xl" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>Privacy Policy</h1>
              <p className="mb-10 max-w-2xl text-lg leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                This notice explains what information may be handled when you use the {churchName} website and how to contact us with a privacy question.
              </p>
            </ScrollReveal>

            <div className="space-y-8 rounded-2xl border p-6 sm:p-10" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <section>
                <h2 className="mb-2 text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Information you provide</h2>
                <p className="leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  If you send a contact or prayer request, we receive the details you submit, such as your name, contact information, and message. We use them to respond and support church activities.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Cookies and optional analytics</h2>
                <p className="leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Essential cookies support basic site features. If you accept cookies, Google Analytics may use analytics cookies to process usage information and help us understand site traffic. You can choose essential cookies only and continue to use the site.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Storage, providers, and security</h2>
                <p className="leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Information is processed by the services used to host this website, store its content, and deliver messages. We use reasonable safeguards and limit access to administrative functions. No method of online storage or transmission can be guaranteed completely secure.
                </p>
              </section>
              <section>
                <h2 className="mb-2 text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>Your choices and questions</h2>
                <p className="leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  You may decline analytics and may contact us to ask about information you submitted or request a correction. For contact details, see our <Link to="/contact" className="font-semibold underline underline-offset-4" style={{ color: 'hsl(var(--primary))' }}>Contact page</Link>.
                </p>
              </section>
              <p className="border-t pt-5 text-sm" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
                This notice may be updated as our website and services change. Please review it periodically.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
