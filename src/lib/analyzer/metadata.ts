import * as cheerio from "cheerio";
import type { PageMetadata, SocialMetadata } from "@/types/analysis";
import { getMetaContent } from "./parse-html";

/**
 * Parses page metadata (title, description, canonical, etc.) from the `<head>`.
 */
export function parseMetadata(
  $: cheerio.CheerioAPI,
  finalUrl: string,
): PageMetadata {
  const title = $("title").first().text().trim();
  const description = getMetaContent($, "description");
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() ?? "";
  const language = $("html").attr("lang")?.trim() ?? "";
  const viewport = getMetaContent($, "viewport");
  const robots = getMetaContent($, "robots");
  const keywords = getMetaContent($, "keywords");
  const author = getMetaContent($, "author");
  const generator = getMetaContent($, "generator");
  const charset = $("meta[charset]").attr("charset")?.trim() ?? "";

  // Favicon detection: explicit <link rel="icon"> or default /favicon.ico.
  const faviconLink = $('link[rel~="icon"]').first().attr("href");
  const hasFavicon = faviconLink !== undefined;
  const faviconUrl = faviconLink
    ? new URL(faviconLink, finalUrl).toString()
    : "";

  return {
    title,
    description,
    canonical,
    language,
    viewport,
    robots,
    keywords,
    author,
    generator,
    charset,
    hasFavicon,
    faviconUrl,
  };
}

/**
 * Parses social media metadata (Open Graph and Twitter Cards).
 */
export function parseSocialMetadata($: cheerio.CheerioAPI): SocialMetadata {
  return {
    ogTitle: getMetaContent($, "og:title"),
    ogDescription: getMetaContent($, "og:description"),
    ogImage: getMetaContent($, "og:image"),
    ogType: getMetaContent($, "og:type"),
    ogUrl: getMetaContent($, "og:url"),
    ogSiteName: getMetaContent($, "og:site_name"),
    twitterCard: getMetaContent($, "twitter:card"),
    twitterTitle: getMetaContent($, "twitter:title"),
    twitterDescription: getMetaContent($, "twitter:description"),
    twitterImage: getMetaContent($, "twitter:image"),
  };
}