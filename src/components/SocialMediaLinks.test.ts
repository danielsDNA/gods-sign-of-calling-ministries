import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { SocialMediaLinks } from './SocialMediaLinks';
import { getSocialMediaLinks } from '@/lib/social-media';

describe('getSocialMediaLinks', () => {
  it('returns configured secure social links with their platform labels', () => {
    expect(
      getSocialMediaLinks({
        facebook_url: 'https://facebook.com/grace',
        instagram_url: 'https://instagram.com/grace',
      }),
    ).toEqual([
      {
        platform: 'facebook',
        label: 'Facebook',
        href: 'https://facebook.com/grace',
      },
      {
        platform: 'instagram',
        label: 'Instagram',
        href: 'https://instagram.com/grace',
      },
    ]);
  });

  it('omits empty and non-HTTPS URLs', () => {
    expect(
      getSocialMediaLinks({
        facebook_url: 'javascript:alert(1)',
        instagram_url: 'http://instagram.com/grace',
        youtube_url: '',
      }),
    ).toEqual([]);
  });

  it('shows all platform logos, keeps unconfigured links disabled, and uses brand hover colors', () => {
    render(
      createElement(SocialMediaLinks, {
        settings: { facebook_url: 'https://facebook.com/grace', instagram_url: '#' },
        showLabels: true,
      }),
    );

    const facebook = screen.getByRole('link', { name: 'Facebook' });
    expect(facebook).toHaveAttribute(
      'href',
      'https://facebook.com/grace',
    );
    expect(facebook.style.getPropertyValue('--social-brand-color')).toBe('#1877F2');
    expect(facebook).toHaveClass('social-media-link');
    expect(screen.getByLabelText('Instagram link not configured')).toBeInTheDocument();
    expect(screen.getByLabelText('YouTube link not configured')).toBeInTheDocument();
    expect(screen.getByLabelText('X link not configured')).toBeInTheDocument();
  });
});
