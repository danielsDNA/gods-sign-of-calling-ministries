import type { RouteObject } from 'react-router';
import { Loader2 } from 'lucide-react';
import HomePage from './pages/index';
import EventsPage from './pages/events';
import ContactPage from './pages/contact';
import GalleryPage from './pages/gallery';
import MinistriesPage from './pages/ministries';
import SermonsPage from './pages/sermons';
import AboutPage from './pages/about';
import PrivacyPage from './pages/privacy';
// Eager import the small 404 page so SSR can render unmatched routes immediately.
import ProdNotFoundPage from './pages/_404';

const NotFoundPage = ProdNotFoundPage;

function AdminRouteFallback() {
  return (
    <div className="admin-loading" role="status">
      <Loader2 size={32} className="admin-spin" />
    </div>
  );
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/events',
    element: <EventsPage />,
  },
  {
    path: '/contact',
    element: <ContactPage />,
  },
  {
    path: '/gallery',
    element: <GalleryPage />,
  },
  {
    path: '/ministries',
    element: <MinistriesPage />,
  },
  {
    path: '/sermons',
    element: <SermonsPage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/privacy',
    element: <PrivacyPage />,
  },
  {
    path: '/admin',
    hydrateFallbackElement: <AdminRouteFallback />,
    lazy: async () => {
      const { default: AdminPage } = await import('./pages/admin');
      return { Component: AdminPage };
    },
  },
  {
    id: 'airo-not-found',
    path: '*',
    element: <NotFoundPage />,
  },
];

// Types for type-safe navigation
export type Path = '/' | '/events' | '/contact' | '/gallery' | '/ministries' | '/sermons' | '/about' | '/privacy' | '/admin';

export type Params = Record<string, string | undefined>;
