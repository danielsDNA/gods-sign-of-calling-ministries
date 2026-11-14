/**
 * @vitest-environment jsdom
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CookieBanner from '../CookieBanner';

const CONSENT_KEY = 'website_analytics_consent';

describe('CookieBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    document.head.querySelectorAll('script[data-analytics="google"]').forEach(script => script.remove());
    delete window.__GOOGLE_ANALYTICS_LOADED__;
    delete window.gtag;
    delete window.dataLayer;
  });

  it('asks before enabling analytics', () => {
    render(<CookieBanner />);
    expect(screen.getByRole('dialog', { name: /cookie consent/i })).toBeInTheDocument();
    expect(document.querySelector('script[data-analytics="google"]')).toBeNull();
  });

  it('saves the visitor preference and notifies consent listeners', async () => {
    const user = userEvent.setup();
    const listener = vi.fn();
    window.addEventListener('cookie-consent-changed', listener);
    render(<CookieBanner />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /essential cookies only/i }));
    });

    expect(JSON.parse(localStorage.getItem(CONSENT_KEY) || '{}')).toMatchObject({ analytics: false });
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { consented: false } }));
    expect(document.querySelector('script[data-analytics="google"]')).toBeNull();
    window.removeEventListener('cookie-consent-changed', listener);
  });

  it('does not show the banner for a valid saved preference', () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: false, timestamp: Date.now() }));
    render(<CookieBanner />);
    expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();
  });

  it('shows the banner again for an expired preference', () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true, timestamp: Date.now() - 366 * 86400000 }));
    render(<CookieBanner />);
    expect(screen.getByRole('dialog', { name: /cookie consent/i })).toBeInTheDocument();
  });
});
