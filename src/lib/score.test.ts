import { describe, expect, it } from "vitest";
import { computeScore, gradeForPercentage } from "./score";
import type { ScoreInput } from "./score";

function makeInput(overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    metadata: {
      title: "Um título de exemplo",
      description: "Uma descrição de exemplo com tamanho razoável para SEO.",
      canonical: "https://example.com/",
      language: "pt-BR",
      viewport: "width=device-width, initial-scale=1",
      robots: "index, follow",
      keywords: "",
      author: "",
      generator: "",
      charset: "utf-8",
      hasFavicon: true,
      faviconUrl: "https://example.com/favicon.ico",
    },
    seo: {
      hasTitle: true,
      titleLength: 22,
      hasDescription: true,
      descriptionLength: 55,
      hasCanonical: true,
      isHttps: true,
      hasLanguage: true,
      hasViewport: true,
      hasFavicon: true,
      hasOpenGraph: true,
    },
    headings: {
      h1Count: 1,
      h2Count: 2,
      h3Count: 0,
      h4Count: 0,
      h5Count: 0,
      h6Count: 0,
      firstH1: "Título principal",
      hasSingleH1: true,
    },
    social: {
      ogTitle: "Título OG",
      ogDescription: "Descrição OG",
      ogImage: "https://example.com/og.png",
      ogType: "website",
      ogUrl: "https://example.com/",
      ogSiteName: "Example",
      twitterCard: "summary",
      twitterTitle: "",
      twitterDescription: "",
      twitterImage: "",
    },
    images: {
      totalImages: 2,
      imagesWithAlt: 2,
      imagesWithoutAlt: 0,
      imagesWithEmptyAlt: 0,
      lazyLoadedImages: 0,
      imagesWithDimensions: 2,
    },
    technical: {
      isHttps: true,
      hasViewport: true,
      hasFavicon: true,
      hasCharset: true,
      hasRobots: true,
      hasCanonical: true,
      hasLanguage: true,
      hasStructuredData: true,
      hasSitemap: true,
      htmlSize: 10000,
      responseTimeMs: 200,
    },
    ...overrides,
  };
}

describe("computeScore", () => {
  it("returns a perfect score for a fully optimized page", () => {
    const result = computeScore(makeInput());
    expect(result.total).toBe(85);
    expect(result.max).toBe(85);
    expect(result.percentage).toBe(100);
    expect(result.grade).toBe("Excelente");
  });

  it("returns zero for a completely empty page", () => {
    const result = computeScore(
      makeInput({
        metadata: {
          title: "",
          description: "",
          canonical: "",
          language: "",
          viewport: "",
          robots: "",
          keywords: "",
          author: "",
          generator: "",
          charset: "",
          hasFavicon: false,
          faviconUrl: "",
        },
        headings: {
          h1Count: 0,
          h2Count: 0,
          h3Count: 0,
          h4Count: 0,
          h5Count: 0,
          h6Count: 0,
          firstH1: "",
          hasSingleH1: false,
        },
        social: {
          ogTitle: "",
          ogDescription: "",
          ogImage: "",
          ogType: "",
          ogUrl: "",
          ogSiteName: "",
          twitterCard: "",
          twitterTitle: "",
          twitterDescription: "",
          twitterImage: "",
        },
        images: {
          totalImages: 0,
          imagesWithAlt: 0,
          imagesWithoutAlt: 0,
          imagesWithEmptyAlt: 0,
          lazyLoadedImages: 0,
          imagesWithDimensions: 0,
        },
        technical: {
          isHttps: false,
          hasViewport: false,
          hasFavicon: false,
          hasCharset: false,
          hasRobots: false,
          hasCanonical: false,
          hasLanguage: false,
          hasStructuredData: false,
          hasSitemap: false,
          htmlSize: 0,
          responseTimeMs: 0,
        },
      }),
    );
    // images-alt awards no points when there are no images to evaluate.
    expect(result.total).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.grade).toBe("Crítico");
  });

  it("awards partial points for a title outside the ideal range", () => {
    const result = computeScore(
      makeInput({
        metadata: {
          title: "curto",
          description: "Uma descrição de exemplo com tamanho razoável para SEO.",
          canonical: "https://example.com/",
          language: "pt-BR",
          viewport: "width=device-width, initial-scale=1",
          robots: "index, follow",
          keywords: "",
          author: "",
          generator: "",
          charset: "utf-8",
          hasFavicon: true,
          faviconUrl: "https://example.com/favicon.ico",
        },
      }),
    );
    const titleItem = result.items.find((i) => i.id === "title");
    expect(titleItem?.earned).toBe(5);
    expect(titleItem?.passed).toBe(false);
  });

  it("awards partial points for multiple h1 headings", () => {
    const result = computeScore(
      makeInput({
        headings: {
          h1Count: 2,
          h2Count: 0,
          h3Count: 0,
          h4Count: 0,
          h5Count: 0,
          h6Count: 0,
          firstH1: "Primeiro",
          hasSingleH1: false,
        },
      }),
    );
    const h1Item = result.items.find((i) => i.id === "h1");
    expect(h1Item?.earned).toBe(5);
  });

  it("awards no points for images when there are no images", () => {
    const result = computeScore(
      makeInput({
        images: {
          totalImages: 0,
          imagesWithAlt: 0,
          imagesWithoutAlt: 0,
          imagesWithEmptyAlt: 0,
          lazyLoadedImages: 0,
          imagesWithDimensions: 0,
        },
      }),
    );
    const imagesItem = result.items.find((i) => i.id === "images-alt");
    expect(imagesItem?.earned).toBe(0);
    expect(imagesItem?.passed).toBe(false);
  });

  it("produces a score with exactly 10 items", () => {
    const result = computeScore(makeInput());
    expect(result.items).toHaveLength(10);
  });
});

describe("gradeForPercentage", () => {
  it("maps percentages to grades", () => {
    expect(gradeForPercentage(95)).toBe("Excelente");
    expect(gradeForPercentage(90)).toBe("Excelente");
    expect(gradeForPercentage(80)).toBe("Bom");
    expect(gradeForPercentage(75)).toBe("Bom");
    expect(gradeForPercentage(60)).toBe("Regular");
    expect(gradeForPercentage(50)).toBe("Regular");
    expect(gradeForPercentage(30)).toBe("Ruim");
    expect(gradeForPercentage(25)).toBe("Ruim");
    expect(gradeForPercentage(10)).toBe("Crítico");
  });
});