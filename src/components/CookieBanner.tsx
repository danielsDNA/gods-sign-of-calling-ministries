import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const COOKIE_CONSENT_KEY = 'website_analytics_consent';
const COOKIE_CONSENT_EXPIRES_DAYS = 365;

interface CookieConsent {
  analytics: boolean;
  timestamp: number;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __GOOGLE_ANALYTICS_LOADED__?: boolean;
    __GOOGLE_ANALYTICS_CONSENT__?: boolean;
    revokeAnalyticsConsent?: () => void;
  }
}

function setAnalyticsConsent(granted: boolean): void {
  window.__GOOGLE_ANALYTICS_CONSENT__ = granted;
  const measurementId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
  if (!measurementId || !/^G-[A-Z0-9]+$/i.test(measurementId)) return;
  if (!granted && !window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
  window.gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
  if (!granted || window.__GOOGLE_ANALYTICS_LOADED__) return;

  window.__GOOGLE_ANALYTICS_LOADED__ = true;
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { anonymize_ip: true });

  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.async = true;
  script.dataset.analytics = 'google';
  document.head.appendChild(script);
}

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      setShowBanner(true);
      setIsLoaded(true);
      return;
    }

    try {
      const consent: unknown = JSON.parse(stored);
      if (
        typeof consent !== 'object'
        || consent === null
        || typeof (consent as CookieConsent).analytics !== 'boolean'
        || !Number.isFinite((consent as CookieConsent).timestamp)
      ) {
        throw new Error('Invalid consent record');
      }

      const record = consent as CookieConsent;
      const elapsedDays = (Date.now() - record.timestamp) / (1000 * 60 * 60 * 24);
      if (elapsedDays < 0 || elapsedDays > COOKIE_CONSENT_EXPIRES_DAYS) {
        localStorage.removeItem(COOKIE_CONSENT_KEY);
        setShowBanner(true);
      } else {
        setAnalyticsConsent(record.analytics);
      }
    } catch {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      setShowBanner(true);
    }
    setIsLoaded(true);
  }, []);

  function saveConsent(analytics: boolean): void {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ analytics, timestamp: Date.now() }));
    setAnalyticsConsent(analytics);
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { consented: analytics } }));
    setShowBanner(false);
  }

  function revokeConsent(): void {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    setAnalyticsConsent(false);
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { consented: false } }));
    setShowBanner(true);
  }

  useEffect(() => {
    window.revokeAnalyticsConsent = revokeConsent;
    return () => { delete window.revokeAnalyticsConsent; };
  }, []);

  if (!isLoaded || !showBanner) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg"
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent"
      aria-describedby="cookie-banner-description"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex-1">
            <h2 className="mb-1 text-sm font-semibold text-gray-900">Cookie preferences</h2>
            <p id="cookie-banner-description" className="text-sm text-gray-600">
            Necessary cookies keep the site working. Optional analytics cookies are only activated when you accept them.
            </p>
          <details className="mt-2 text-sm text-gray-700">
            <summary className="cursor-pointer font-medium">Cookie categories</summary>
            <ul className="mt-2 space-y-1.5 pl-4">
              <li><strong>Necessary:</strong> Required for secure sign-in and saved cookie preferences; always active.</li>
              <li><strong>Functional:</strong> Support optional embedded or social features; none are activated by this banner.</li>
              <li><strong>Analytics:</strong> Google Analytics measures visits and traffic sources; activated only after acceptance.</li>
              <li><strong>Advertising:</strong> No advertising cookies are currently enabled.</li>
            </ul>
            <a className="mt-2 inline-block text-sm font-medium underline" href="/privacy">Read our Privacy Policy</a>
          </details>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
          <Button size="sm" variant="secondary" onClick={() => saveConsent(false)} className="whitespace-nowrap">Reject optional</Button>
          <Button size="sm" onClick={() => saveConsent(true)} className="whitespace-nowrap">Accept all</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
