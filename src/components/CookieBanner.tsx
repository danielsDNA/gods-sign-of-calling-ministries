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
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="mb-1 text-sm font-semibold text-gray-900">Cookie preferences</h2>
            <p id="cookie-banner-description" className="text-sm text-gray-600">
              Essential cookies keep the website working. Accepting cookies also allows Google Analytics cookies to measure site visits. You can choose essential cookies only.
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <Button size="sm" variant="secondary" onClick={() => saveConsent(false)} className="whitespace-nowrap">Essential cookies only</Button>
            <Button size="sm" onClick={() => saveConsent(true)} className="whitespace-nowrap">Accept cookies</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
