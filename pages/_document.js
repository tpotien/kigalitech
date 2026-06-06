import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Brand fonts: Bebas Neue (JBL), Exo 2 (ASUS/Anker/Nikon), Montserrat (Samsung/Bose/Beats), Barlow (Sony/Xiaomi/GoPro) */}
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
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
