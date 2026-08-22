// Web-only root HTML shell wrapping every statically-rendered page (Expo Router).
// Beyond the Expo default (scroll reset + charset/viewport) this adds the title,
// description, theme colour and social-share (Open Graph + Twitter) tags so a
// shared link to the student app unfurls with real text instead of a blank card.
// Runs only in Node during static rendering - no DOM/browser APIs here.

import { ScrollViewStyleReset } from 'expo-router/html';

const TITLE = 'MELDA Student';
const DESCRIPTION =
  'Practice, review and watch your mastery grow. MELDA helps you learn every topic at your own pace, even on a slow connection.';
// Known ceiling: og:image reuses the square app icon copied to public/og.png,
// not a bespoke 1200x630 share image, and the path is root-relative. A real
// deploy needs an absolute URL (https://.../og.png) and landscape art; until
// then Twitter uses the square-friendly "summary" card, not "large".
const OG_IMAGE = '/og.png';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="theme-color" content="#1439FF" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MELDA" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE} />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />

        {/* Disable body scrolling on web so ScrollView behaves like native. */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

