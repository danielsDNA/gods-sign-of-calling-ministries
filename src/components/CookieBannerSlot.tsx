import CookieBannerErrorBoundary from './CookieBannerErrorBoundary';
import CookieBanner from './CookieBanner';

export default function CookieBannerSlot() {
  return (
    <CookieBannerErrorBoundary>
      <CookieBanner />
    </CookieBannerErrorBoundary>
  );
}
