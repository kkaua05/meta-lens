import { HeadingIcon } from "lucide-react";
import type { HeadingAnalysis } from "@/types/analysis";
import { AuditSection } from "./audit-section";
import { AuditItem } from "./audit-item";

interface StructureSectionProps {
  headings: HeadingAnalysis;
}

/** Heading structure (h1–h6) analysis. */
export function StructureSection({ headings }: StructureSectionProps) {
  const h1Status = headings.h1Count === 1 ? "pass" : headings.h1Count === 0 ? "fail" : "warn";
  const h1Detail =
    headings.h1Count === 0
      ? "Nenhum H1 encontrado."
      : headings.h1Count === 1
        ? headings.firstH1 || "Um único H1 presente."
        : `${headings.h1Count} H1s encontrados — deve haver apenas um.`;

  return (
    <AuditSection
      title="Estrutura de Títulos"
      description="Hierarquia de cabeçalhos da página."
      icon={<HeadingIcon className="size-4" />}
    >
      <AuditItem label="H1" status={h1Status} detail={h1Detail} />
      <AuditItem
        label="H2"
        status={headings.h2Count > 0 ? "pass" : "warn"}
        detail={`${headings.h2Count} H2(s) encontrados.`}
      />
      <AuditItem
        label="H3"
        status={headings.h3Count > 0 ? "pass" : "warn"}
        detail={`${headings.h3Count} H3(s) encontrados.`}
      />
      <AuditItem
        label="H4–H6"
        status="warn"
        detail={`${headings.h4Count + headings.h5Count + headings.h6Count} título(s) de nível 4 a 6.`}
      />
    </AuditSection>
  );
}