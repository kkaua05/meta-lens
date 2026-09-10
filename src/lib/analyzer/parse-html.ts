import * as cheerio from "cheerio";
import type {
  HeadingAnalysis,
  ImageAnalysis,
  LinkAnalysis,
  PageMetadata,
  SocialMetadata,
  TechnicalAnalysis,
} from "@/types/analysis";
import { parseHeadings } from "./headings";
import { parseImages } from "./images";
import { parseLinks } from "./links";
import { parseMetadata, parseSocialMetadata } from "./metadata";

/**
 * HTML parsing utilities built on Cheerio.
 */

/**
 * Extracts the text content of a meta tag by name or property.
 *
 * Matching is case-insensitive on the attribute value, since HTML meta
 * names/properties are case-insensitive per the HTML spec.
 */
export function getMetaContent(
  $: cheerio.CheerioAPI,
  key: string,
): string {
  const lowerKey = key.toLowerCase();
  const byName = $("meta[name]")
    .filter((_, el) => ($(el).attr("name") ?? "").toLowerCase() === lowerKey)
    .first()
    .attr("content");
  if (byName !== undefined) return byName;
  const byProperty = $("meta[property]")
    .filter((_, el) => ($(el).attr("property") ?? "").toLowerCase() === lowerKey)
    .first()
    .attr("content");
  if (byProperty !== undefined) return byProperty;
  return "";
}

/**
 * Parses the full HTML document into structured analysis data.
 *
 * @param html The raw HTML string.
 * @param finalUrl The final URL (used to resolve relative links).
 * @param size The size of the HTML in bytes.
 * @param responseTimeMs The fetch time in milliseconds.
 */
export function parseHtml(
  html: string,
  finalUrl: string,
  size: number,
  responseTimeMs: number,
): {
  metadata: PageMetadata;
  social: SocialMetadata;
  headings: HeadingAnalysis;
  images: ImageAnalysis;
  links: LinkAnalysis;
  technical: TechnicalAnalysis;
} {
  const $ = cheerio.load(html);

  const metadata = parseMetadata($, finalUrl);
  const social = parseSocialMetadata($);
  const headings = parseHeadings($);
  const images = parseImages($);
  const links = parseLinks($, finalUrl);

  const technical: TechnicalAnalysis = {
    isHttps: finalUrl.startsWith("https://"),
    hasViewport: metadata.viewport.length > 0,
    hasFavicon: metadata.hasFavicon,
    hasCharset: metadata.charset.length > 0,
    hasRobots: metadata.robots.length > 0,
    hasCanonical: metadata.canonical.length > 0,
    hasLanguage: metadata.language.length > 0,
    hasStructuredData: $('script[type="application/ld+json"]').length > 0,
    hasSitemap:
      $('link[rel="sitemap"]').length > 0 ||
      $('a[href$="sitemap.xml"]').length > 0,
    htmlSize: size,
    responseTimeMs,
  };

  return { metadata, social, headings, images, links, technical };
}