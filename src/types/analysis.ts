/**
 * Core domain types for the MetaLens website analysis.
 * These types describe the full result returned by the `/api/analyze` endpoint.
 */

/** Information about the original request made by the user. */
export interface RequestInfo {
  /** The URL as provided by the user (before normalization). */
  originalUrl: string;
  /** The normalized URL that was actually fetched. */
  normalizedUrl: string;
  /** The final URL after following redirects. */
  finalUrl: string;
  /** ISO 8601 timestamp of when the analysis was performed. */
  analyzedAt: string;
}

/** Metadata extracted from the `<head>` of the page. */
export interface PageMetadata {
  /** Content of the `<title>` tag. */
  title: string;
  /** Content of the `<meta name="description">` tag. */
  description: string;
  /** Content of the `<link rel="canonical">` tag. */
  canonical: string;
  /** Content of the `<html lang>` attribute. */
  language: string;
  /** Content of the `<meta name="viewport">` tag. */
  viewport: string;
  /** Content of the `<meta name="robots">` tag. */
  robots: string;
  /** Content of the `<meta name="keywords">` tag. */
  keywords: string;
  /** Content of the `<meta name="author">` tag. */
  author: string;
  /** Content of the `<meta name="generator">` tag. */
  generator: string;
  /** Content of the `<meta charset>` tag. */
  charset: string;
  /** Whether a favicon was found (any `<link rel="icon">` or `/favicon.ico`). */
  hasFavicon: boolean;
  /** The resolved favicon URL, if found. */
  faviconUrl: string;
}

/** SEO-related analysis results. */
export interface SeoAnalysis {
  /** Whether a `<title>` tag is present. */
  hasTitle: boolean;
  /** Length of the title in characters. */
  titleLength: number;
  /** Whether a meta description is present. */
  hasDescription: boolean;
  /** Length of the description in characters. */
  descriptionLength: number;
  /** Whether a canonical URL is present. */
  hasCanonical: boolean;
  /** Whether the page is served over HTTPS. */
  isHttps: boolean;
  /** Whether the `<html lang>` attribute is present. */
  hasLanguage: boolean;
  /** Whether a viewport meta tag is present. */
  hasViewport: boolean;
  /** Whether a favicon is present. */
  hasFavicon: boolean;
  /** Whether Open Graph tags are present. */
  hasOpenGraph: boolean;
}

/** Analysis of heading structure (h1-h6). */
export interface HeadingAnalysis {
  /** Number of `<h1>` elements. */
  h1Count: number;
  /** Number of `<h2>` elements. */
  h2Count: number;
  /** Number of `<h3>` elements. */
  h3Count: number;
  /** Number of `<h4>` elements. */
  h4Count: number;
  /** Number of `<h5>` elements. */
  h5Count: number;
  /** Number of `<h6>` elements. */
  h6Count: number;
  /** The text content of the first `<h1>`, if any. */
  firstH1: string;
  /** Whether the page has exactly one `<h1>`. */
  hasSingleH1: boolean;
}

/** Social media metadata (Open Graph and Twitter Cards). */
export interface SocialMetadata {
  /** Open Graph title. */
  ogTitle: string;
  /** Open Graph description. */
  ogDescription: string;
  /** Open Graph image URL. */
  ogImage: string;
  /** Open Graph type. */
  ogType: string;
  /** Open Graph URL. */
  ogUrl: string;
  /** Open Graph site name. */
  ogSiteName: string;
  /** Twitter card type. */
  twitterCard: string;
  /** Twitter title. */
  twitterTitle: string;
  /** Twitter description. */
  twitterDescription: string;
  /** Twitter image URL. */
  twitterImage: string;
}

/** Analysis of images on the page. */
export interface ImageAnalysis {
  /** Total number of `<img>` elements. */
  totalImages: number;
  /** Number of images with a non-empty `alt` attribute. */
  imagesWithAlt: number;
  /** Number of images missing an `alt` attribute. */
  imagesWithoutAlt: number;
  /** Number of images with an empty `alt` attribute. */
  imagesWithEmptyAlt: number;
  /** Number of images with a `loading="lazy"` attribute. */
  lazyLoadedImages: number;
  /** Number of images with explicit `width` and `height` attributes. */
  imagesWithDimensions: number;
}

/** Analysis of links on the page. */
export interface LinkAnalysis {
  /** Total number of `<a>` elements. */
  totalLinks: number;
  /** Number of internal links (same host). */
  internalLinks: number;
  /** Number of external links (different host). */
  externalLinks: number;
  /** Number of links with a `rel="nofollow"` attribute. */
  nofollowLinks: number;
  /** Number of links with a `rel="noopener"` attribute. */
  noopenerLinks: number;
  /** Number of links with a `target="_blank"` attribute. */
  targetBlankLinks: number;
  /** Number of links with an empty or missing `href`. */
  brokenLinks: number;
}

/** Technical analysis results. */
export interface TechnicalAnalysis {
  /** Whether the page uses HTTPS. */
  isHttps: boolean;
  /** Whether a viewport meta tag is present. */
  hasViewport: boolean;
  /** Whether a favicon is present. */
  hasFavicon: boolean;
  /** Whether the page has a `<meta charset>` tag. */
  hasCharset: boolean;
  /** Whether the page has a `<meta name="robots">` tag. */
  hasRobots: boolean;
  /** Whether the page has a canonical URL. */
  hasCanonical: boolean;
  /** Whether the page has a `<html lang>` attribute. */
  hasLanguage: boolean;
  /** Whether the page has structured data (JSON-LD). */
  hasStructuredData: boolean;
  /** Whether the page has a sitemap reference. */
  hasSitemap: boolean;
  /** The size of the HTML document in bytes. */
  htmlSize: number;
  /** The time taken to fetch the page in milliseconds. */
  responseTimeMs: number;
}

/** A single scored criterion with its weight and earned points. */
export interface ScoreItem {
  /** Unique identifier for the criterion. */
  id: string;
  /** Human-readable label (pt-BR). */
  label: string;
  /** Maximum points for this criterion. */
  weight: number;
  /** Points earned for this criterion. */
  earned: number;
  /** Whether the criterion passed. */
  passed: boolean;
  /** A short explanation of the result. */
  detail: string;
}

/** The overall score result. */
export interface ScoreResult {
  /** Total score out of 100. */
  total: number;
  /** Maximum possible score (always 100). */
  max: number;
  /** Percentage score (0-100). */
  percentage: number;
  /** A qualitative grade (e.g. "Ótimo", "Bom", "Regular", "Ruim"). */
  grade: string;
  /** The individual scored criteria. */
  items: ScoreItem[];
}

/** The complete result of a website analysis. */
export interface WebsiteAnalysis {
  /** Information about the request. */
  request: RequestInfo;
  /** Page metadata. */
  metadata: PageMetadata;
  /** SEO analysis. */
  seo: SeoAnalysis;
  /** Heading structure analysis. */
  headings: HeadingAnalysis;
  /** Social media metadata. */
  social: SocialMetadata;
  /** Image analysis. */
  images: ImageAnalysis;
  /** Link analysis. */
  links: LinkAnalysis;
  /** Technical analysis. */
  technical: TechnicalAnalysis;
  /** The overall score. */
  score: ScoreResult;
}