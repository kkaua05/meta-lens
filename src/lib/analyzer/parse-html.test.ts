import { describe, expect, it } from "vitest";
import { parseHtml } from "./parse-html";

const FULL_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Página de exemplo</title>
  <meta name="description" content="Uma descrição de exemplo para a página." />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://example.com/" />
  <link rel="icon" href="/favicon.ico" />
  <meta property="og:title" content="Título OG" />
  <meta property="og:description" content="Descrição OG" />
  <meta property="og:image" content="https://example.com/og.png" />
  <meta name="twitter:card" content="summary" />
  <script type="application/ld+json">{"@context":"https://schema.org"}</script>
  <link rel="sitemap" href="/sitemap.xml" />
</head>
<body>
  <h1>Título principal</h1>
  <h2>Subtítulo</h2>
  <img src="/a.png" alt="Imagem A" width="100" height="100" loading="lazy" />
  <img src="/b.png" alt="" />
  <img src="/c.png" />
  <a href="/interno">Link interno</a>
  <a href="https://outro.com" rel="nofollow noopener" target="_blank">Externo</a>
  <a href="#">Vazio</a>
</body>
</html>`;

describe("parseHtml", () => {
  it("parses metadata correctly", () => {
    const { metadata } = parseHtml(FULL_HTML, "https://example.com/", 1000, 150);
    expect(metadata.title).toBe("Página de exemplo");
    expect(metadata.description).toBe("Uma descrição de exemplo para a página.");
    expect(metadata.canonical).toBe("https://example.com/");
    expect(metadata.language).toBe("pt-BR");
    expect(metadata.charset).toBe("utf-8");
    expect(metadata.hasFavicon).toBe(true);
    expect(metadata.faviconUrl).toBe("https://example.com/favicon.ico");
  });

  it("parses social metadata correctly", () => {
    const { social } = parseHtml(FULL_HTML, "https://example.com/", 1000, 150);
    expect(social.ogTitle).toBe("Título OG");
    expect(social.ogDescription).toBe("Descrição OG");
    expect(social.ogImage).toBe("https://example.com/og.png");
    expect(social.twitterCard).toBe("summary");
  });

  it("parses headings correctly", () => {
    const { headings } = parseHtml(FULL_HTML, "https://example.com/", 1000, 150);
    expect(headings.h1Count).toBe(1);
    expect(headings.h2Count).toBe(1);
    expect(headings.firstH1).toBe("Título principal");
    expect(headings.hasSingleH1).toBe(true);
  });

  it("parses images and alt attributes correctly", () => {
    const { images } = parseHtml(FULL_HTML, "https://example.com/", 1000, 150);
    expect(images.totalImages).toBe(3);
    expect(images.imagesWithAlt).toBe(1);
    expect(images.imagesWithEmptyAlt).toBe(1);
    expect(images.imagesWithoutAlt).toBe(1);
    expect(images.lazyLoadedImages).toBe(1);
    expect(images.imagesWithDimensions).toBe(1);
  });

  it("parses links and classifies internal/external", () => {
    const { links } = parseHtml(FULL_HTML, "https://example.com/", 1000, 150);
    expect(links.totalLinks).toBe(3);
    expect(links.internalLinks).toBe(1);
    expect(links.externalLinks).toBe(1);
    expect(links.brokenLinks).toBe(1);
    expect(links.nofollowLinks).toBe(1);
    expect(links.noopenerLinks).toBe(1);
    expect(links.targetBlankLinks).toBe(1);
  });

  it("parses technical signals correctly", () => {
    const { technical } = parseHtml(FULL_HTML, "https://example.com/", 1000, 150);
    expect(technical.isHttps).toBe(true);
    expect(technical.hasViewport).toBe(true);
    expect(technical.hasFavicon).toBe(true);
    expect(technical.hasCharset).toBe(true);
    expect(technical.hasRobots).toBe(true);
    expect(technical.hasCanonical).toBe(true);
    expect(technical.hasLanguage).toBe(true);
    expect(technical.hasStructuredData).toBe(true);
    expect(technical.hasSitemap).toBe(true);
    expect(technical.htmlSize).toBe(1000);
    expect(technical.responseTimeMs).toBe(150);
  });

  it("handles an empty document gracefully", () => {
    const result = parseHtml("", "https://example.com/", 0, 0);
    expect(result.metadata.title).toBe("");
    expect(result.headings.h1Count).toBe(0);
    expect(result.images.totalImages).toBe(0);
    expect(result.links.totalLinks).toBe(0);
  });
});