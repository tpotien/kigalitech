import Head from 'next/head';

const DEFAULT_IMAGE = 'https://electronics-shop-amber.vercel.app/logo.png';
const DEFAULT_DESCRIPTION =
  'Premium electronics in Rwanda — phones, laptops, TVs, audio and more. Fast delivery, real warranties.';
const SITE_NAME = 'KigaliTech';

/**
 * SEOMeta — drop-in OpenGraph + Twitter Card meta tags.
 *
 * Props:
 *   title       {string}  Page title (also used for og:title / twitter:title)
 *   description {string}  Page description
 *   image       {string}  Absolute image URL (defaults to site logo)
 *   url         {string}  Canonical page URL
 *   type        {string}  og:type value (default: 'website')
 */
export default function SEOMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
}) {
  const resolvedImage = image || DEFAULT_IMAGE;

  return (
    <Head>
      {title && <title>{title}</title>}
      <meta name="description" content={description} />

      {/* Open Graph */}
      {title && <meta property="og:title" content={title} />}
      <meta property="og:description" content={description} />
      <meta property="og:image" content={resolvedImage} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      {title && <meta name="twitter:title" content={title} />}
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImage} />
    </Head>
  );
}
