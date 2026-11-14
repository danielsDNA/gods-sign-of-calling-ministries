/**
 * @vitest-environment jsdom
 */
import { act, render } from '@testing-library/react';
import React from 'react';
import { type RouteObject } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';

// Swap createBrowserRouter for createMemoryRouter so we can navigate in tests.
// The capture happens when App.tsx is imported (module-level router init).
let testRouter: { navigate: (path: string) => Promise<void> };
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    createBrowserRouter: (routes: RouteObject[]) => {
      const r = actual.createMemoryRouter(routes);
      testRouter = r;
      return r;
    },
  };
});

// Stub layout/UI dependencies so the test is fast and focused.
vi.mock('../layouts/RootLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));
vi.mock('../components/Spinner', () => ({ default: () => null }));
vi.mock('@/components/CookieBannerErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));
vi.mock('../routes', () => ({
  routes: [{ path: '*', element: React.createElement('span') }] as RouteObject[],
}));
vi.mock('../../export-plugins/AiroErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));
vi.mock('@/components/CookieBanner', () => ({ default: () => null }));

beforeEach(() => {
  vi.resetModules();
  window.__GOOGLE_ANALYTICS_CONSENT__ = true;
  window.gtag = vi.fn();
});

it('sends a Google Analytics page view when the route changes', async () => {
  const { default: App } = await import('../App');
  render(<App />);

  await act(async () => {
    await testRouter.navigate('/contact');
  });

  // Length assertion also covers the non-idle guard: without it, the subscriber
  // fires twice per navigation (once while loading, once when idle).
  expect(window.gtag).toHaveBeenCalledTimes(1);
  expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', { page_path: '/contact' });
});

it('does not track when analytics consent is not given', async () => {
  window.__GOOGLE_ANALYTICS_CONSENT__ = false;
  const { default: App } = await import('../App');
  render(<App />);

  await act(async () => {
    await testRouter.navigate('/contact');
  });

  expect(window.gtag).not.toHaveBeenCalled();
});

it('stops tracking after consent is revoked', async () => {
  const { default: App } = await import('../App');
  render(<App />);

  await act(async () => {
    await testRouter.navigate('/contact');
  });

  window.__GOOGLE_ANALYTICS_CONSENT__ = false;

  await act(async () => {
    await testRouter.navigate('/about');
  });

  expect(window.gtag).toHaveBeenCalledTimes(1);
  expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', { page_path: '/contact' });
});

it('does not push a duplicate when navigating to the same pathname twice', async () => {
  const { default: App } = await import('../App');
  render(<App />);

  await act(async () => {
    await testRouter.navigate('/about');
  });
  await act(async () => {
    await testRouter.navigate('/about');
  });

  expect(window.gtag).toHaveBeenCalledTimes(1);
  expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', { page_path: '/about' });
});
