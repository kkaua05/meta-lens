import type {
  HeadingAnalysis,
  ImageAnalysis,
  PageMetadata,
  ScoreItem,
  ScoreResult,
  SeoAnalysis,
  SocialMetadata,
  TechnicalAnalysis,
} from "@/types/analysis";

/**
 * Score engine.
 *
 * Computes a transparent, weighted SEO score out of 100 points. The weights
 * are intentionally simple and documented so the result is explainable —
 * this is NOT an official Google ranking score.
 */

/** Input data required to compute the score. */
export interface ScoreInput {
  metadata: PageMetadata;
  seo: SeoAnalysis;
  headings: HeadingAnalysis;
  social: SocialMetadata;
  images: ImageAnalysis;
  technical: TechnicalAnalysis;
}

/** A single scoring rule. */
interface Rule {
  id: string;
  label: string;
  weight: number;
  evaluate: (input: ScoreInput) => { earned: number; passed: boolean; detail: string };
}

const TITLE_MIN = 10;
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 160;

/** The full list of scoring rules. Total weight = 100. */
const RULES: Rule[] = [
  {
    id: "title",
    label: "Título (title)",
    weight: 10,
    evaluate: ({ metadata }) => {
      const len = metadata.title.length;
      if (len === 0) {
        return { earned: 0, passed: false, detail: "A tag <title> está ausente." };
      }
      if (len < TITLE_MIN || len > TITLE_MAX) {
        return {
          earned: 5,
          passed: false,
          detail: `O título tem ${len} caracteres (ideal: ${TITLE_MIN}–${TITLE_MAX}).`,
        };
      }
      return {
        earned: 10,
        passed: true,
        detail: `O título tem ${len} caracteres, dentro do ideal.`,
      };
    },
  },
  {
    id: "description",
    label: "Meta description",
    weight: 10,
    evaluate: ({ metadata }) => {
      const len = metadata.description.length;
      if (len === 0) {
        return { earned: 0, passed: false, detail: "A meta description está ausente." };
      }
      if (len < DESCRIPTION_MIN || len > DESCRIPTION_MAX) {
        return {
          earned: 5,
          passed: false,
          detail: `A description tem ${len} caracteres (ideal: ${DESCRIPTION_MIN}–${DESCRIPTION_MAX}).`,
        };
      }
      return {
        earned: 10,
        passed: true,
        detail: `A description tem ${len} caracteres, dentro do ideal.`,
      };
    },
  },
  {
    id: "h1",
    label: "Heading H1",
    weight: 10,
    evaluate: ({ headings }) => {
      if (headings.h1Count === 1) {
        return { earned: 10, passed: true, detail: "A página tem exatamente um <h1>." };
      }
      if (headings.h1Count === 0) {
        return { earned: 0, passed: false, detail: "A página não tem nenhum <h1>." };
      }
      return {
        earned: 5,
        passed: false,
        detail: `A página tem ${headings.h1Count} <h1> (ideal: apenas 1).`,
      };
    },
  },
  {
    id: "canonical",
    label: "URL canônica",
    weight: 10,
    evaluate: ({ metadata }) => {
      if (metadata.canonical.length > 0) {
        return { earned: 10, passed: true, detail: "A URL canônica está definida." };
      }
      return { earned: 0, passed: false, detail: "A URL canônica está ausente." };
    },
  },
  {
    id: "https",
    label: "HTTPS",
    weight: 10,
    evaluate: ({ technical }) => {
      if (technical.isHttps) {
        return { earned: 10, passed: true, detail: "O site é servido via HTTPS." };
      }
      return { earned: 0, passed: false, detail: "O site não usa HTTPS." };
    },
  },
  {
    id: "lang",
    label: "Atributo lang",
    weight: 5,
    evaluate: ({ metadata }) => {
      if (metadata.language.length > 0) {
        return {
          earned: 5,
          passed: true,
          detail: `O atributo lang está definido como "${metadata.language}".`,
        };
      }
      return { earned: 0, passed: false, detail: "O atributo lang está ausente." };
    },
  },
  {
    id: "viewport",
    label: "Viewport",
    weight: 5,
    evaluate: ({ metadata }) => {
      if (metadata.viewport.length > 0) {
        return { earned: 5, passed: true, detail: "A meta viewport está definida." };
      }
      return { earned: 0, passed: false, detail: "A meta viewport está ausente." };
    },
  },
  {
    id: "favicon",
    label: "Favicon",
    weight: 5,
    evaluate: ({ metadata }) => {
      if (metadata.hasFavicon) {
        return { earned: 5, passed: true, detail: "O site possui favicon." };
      }
      return { earned: 0, passed: false, detail: "Nenhum favicon foi encontrado." };
    },
  },
  {
    id: "og",
    label: "Open Graph",
    weight: 10,
    evaluate: ({ social }) => {
      const hasTitle = social.ogTitle.length > 0;
      const hasDescription = social.ogDescription.length > 0;
      const hasImage = social.ogImage.length > 0;
      const count = [hasTitle, hasDescription, hasImage].filter(Boolean).length;

      if (count === 3) {
        return { earned: 10, passed: true, detail: "Open Graph completo (title, description e image)." };
      }
      if (count > 0) {
        return {
          earned: 5,
          passed: false,
          detail: `Open Graph parcial (${count}/3 tags presentes).`,
        };
      }
      return { earned: 0, passed: false, detail: "Nenhuma tag Open Graph encontrada." };
    },
  },
  {
    id: "images-alt",
    label: "Alt em imagens",
    weight: 10,
    evaluate: ({ images }) => {
      if (images.totalImages === 0) {
        return { earned: 10, passed: true, detail: "A página não possui imagens." };
      }
      const ratio = images.imagesWithAlt / images.totalImages;
      const earned = Math.round(ratio * 10);
      if (ratio === 1) {
        return {
          earned: 10,
          passed: true,
          detail: "Todas as imagens possuem atributo alt.",
        };
      }
      return {
        earned,
        passed: false,
        detail: `${images.imagesWithAlt} de ${images.totalImages} imagens possuem alt.`,
      };
    },
  },
];

/**
 * Computes the SEO score from the analysis data.
 */
export function computeScore(input: ScoreInput): ScoreResult {
  const items: ScoreItem[] = RULES.map((rule) => {
    const { earned, passed, detail } = rule.evaluate(input);
    return {
      id: rule.id,
      label: rule.label,
      weight: rule.weight,
      earned,
      passed,
      detail,
    };
  });

  const total = items.reduce((sum, item) => sum + item.earned, 0);
  const max = items.reduce((sum, item) => sum + item.weight, 0);
  const percentage = max > 0 ? Math.round((total / max) * 100) : 0;

  return {
    total,
    max,
    percentage,
    grade: gradeForPercentage(percentage),
    items,
  };
}

/**
 * Maps a percentage score to a qualitative grade.
 */
export function gradeForPercentage(percentage: number): string {
  if (percentage >= 90) return "Excelente";
  if (percentage >= 75) return "Bom";
  if (percentage >= 50) return "Regular";
  if (percentage >= 25) return "Ruim";
  return "Crítico";
}