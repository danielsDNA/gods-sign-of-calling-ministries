import { Link } from '../router';
import { Helmet } from '@dr.pogodin/react-helmet';

/**
 * 404 Not Found page component
 *
 * Displays a user-friendly error page when a route is not found.
 * Includes navigation to available pages and a back button.
 * The layout (header/footer) is handled by RootLayout in App.tsx.
 */
export default function NotFoundPage() {
  return (
    <main className="min-h-[65vh] flex items-center py-16" style={{ background: 'linear-gradient(135deg, hsl(var(--surface-alt)), hsl(var(--muted)))' }}>
      <Helmet>
        <title>Page not found</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="rounded-3xl border p-8 sm:p-12 text-center shadow-xl" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <p className="text-sm font-bold uppercase tracking-[0.2em] mb-3" style={{ color: 'hsl(var(--primary))' }}>404 · Page not found</p>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
            This page has wandered off
          </h1>
          <p className="max-w-xl mx-auto mb-8 text-base sm:text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
            The address may have changed, or the page may no longer be here. Start again from a page that can help.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Link to="/" className="rounded-lg px-6 py-3 font-semibold text-white transition-transform hover:-translate-y-0.5" style={{ background: 'hsl(var(--primary))' }}>
              Back to home
            </Link>
            <Link to="/contact" className="rounded-lg border px-6 py-3 font-semibold transition-colors hover:bg-muted" style={{ color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }}>
              Contact us
            </Link>
          </div>
          <nav aria-label="Helpful pages" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/events" className="underline underline-offset-4" style={{ color: 'hsl(var(--primary))' }}>Events</Link>
            <Link to="/sermons" className="underline underline-offset-4" style={{ color: 'hsl(var(--primary))' }}>Sermons</Link>
            <Link to="/ministries" className="underline underline-offset-4" style={{ color: 'hsl(var(--primary))' }}>Ministries</Link>
            <Link to="/about" className="underline underline-offset-4" style={{ color: 'hsl(var(--primary))' }}>About</Link>
          </nav>
        </div>
      </div>
    </main>
  );
}
