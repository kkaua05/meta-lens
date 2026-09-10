import { FileTextIcon } from "lucide-react";
import type { PageMetadata, SeoAnalysis } from "@/types/analysis";
import { AuditSection } from "./audit-section";
import { AuditItem, type AuditStatus } from "./audit-item";

interface SeoSectionProps {
  metadata: PageMetadata;
  seo: SeoAnalysis;
}

function titleStatus(length: number): { status: AuditStatus; detail: string } {
  if (length === 0) return { status: "fail", detail: "Nenhum título encontrado." };
  if (length < 10) return { status: "warn", detail: `${length} caracteres — muito curto (ideal: 10–60).` };
  if (length > 60) return { status: "warn", detail: `${length} caracteres — muito longo (ideal: 10–60).` };
  return { status: "pass", detail: `${length} caracteres — dentro do ideal.` };
}

function descriptionStatus(length: number): { status: AuditStatus; detail: string } {
  if (length === 0) return { status: "fail", detail: "Nenhuma descrição encontrada." };
  if (length < 50) return { status: "warn", detail: `${length} caracteres — muito curta (ideal: 50–160).` };
  if (length > 160) return { status: "warn", detail: `${length} caracteres — muito longa (ideal: 50–160).` };
  return { status: "pass", detail: `${length} caracteres — dentro do ideal.` };
}

/** SEO fundamentals: title, description, canonical, language, viewport. */
export function SeoSection({ metadata, seo }: SeoSectionProps) {
  const title = titleStatus(seo.titleLength);
  const description = descriptionStatus(seo.descriptionLength);

  return (
    <AuditSection
      title="SEO Básico"
      description="Elementos essenciais de otimização para mecanismos de busca."
      icon={<FileTextIcon className="size-4" />}
    >
      <AuditItem label="Título (title)" status={title.status} detail={title.detail} />
      <AuditItem
        label="Meta descrição"
        status={description.status}
        detail={description.detail}
      />
      <AuditItem
        label="URL canônica"
        status={seo.hasCanonical ? "pass" : "fail"}
        detail={seo.hasCanonical ? metadata.canonical : "Tag canonical ausente."}
      />
      <AuditItem
        label="Idioma (lang)"
        status={seo.hasLanguage ? "pass" : "fail"}
        detail={seo.hasLanguage ? metadata.language : "Atributo lang ausente."}
      />
      <AuditItem
        label="Viewport responsivo"
        status={seo.hasViewport ? "pass" : "fail"}
        detail={seo.hasViewport ? "Meta viewport presente." : "Meta viewport ausente."}
      />
    </AuditSection>
  );
}