import { Helmet } from '@dr.pogodin/react-helmet';
import { type ReactNode } from 'react';
import { ScrollRestoration, useLocation } from 'react-router';

import HomepageSameAsJsonLd from '@/components/HomepageSameAsJsonLd';
import Footer from '@/layouts/parts/Footer';
import Header from '@/layouts/parts/Header';
import Website from '@/layouts/Website';
import { churchConfig } from '@/config/church';

/**
 * Root layout component that wraps all pages with consistent header and footer.
 *
 * To customize the header or footer, directly edit the Header.tsx and Footer.tsx
 * files in the layouts/parts directory.
 *
 * Site-wide <title> and <meta> live in the <Helmet> below. Individual pages can
 * override them by rendering their own <Helmet> — last-mounted wins.
 *
 * The /admin route renders without header/footer (standalone layout).
 */
interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <>
        <ScrollRestoration />
        {children}
      </>
    );
  }

  return (
    <Website>
      <Helmet>
        <title>{churchConfig.name} | Official Website</title>
        <meta name="description" content={churchConfig.tagline} />
        <link rel="icon" href="/favicon.svg" />
      </Helmet>
      <HomepageSameAsJsonLd />
      <ScrollRestoration />
      <Header />
      {children}
      <Footer />
    </Website>
  );
}
