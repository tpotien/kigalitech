import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KigaliTech" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="KigaliTech" />
        <meta name="format-detection" content="telephone=no" />

        {/* Viewport safe area for iPhone notch */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Exo+2:wght@600;700;800&family=Montserrat:wght@700;800;900&family=Barlow:ital,wght@0,600;0,700;1,700&display=swap"
          rel="stylesheet"
        />

        {/* Preload hero image for fast LCP */}
        <link
          rel="preload"
          as="image"
          href="https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=85"
        />

        {/* Default OG */}
        <meta property="og:site_name" content="KigaliTech" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
