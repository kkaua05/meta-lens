import { WrenchIcon } from "lucide-react";
import type { TechnicalAnalysis } from "@/types/analysis";
import { AuditSection } from "./audit-section";
import { AuditItem } from "./audit-item";

interface TechnicalSectionProps {
  technical: TechnicalAnalysis;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Technical signals: HTTPS, favicon, charset, robots, structured data, sitemap. */
export function TechnicalSection({ technical }: TechnicalSectionProps) {
  return (
    <AuditSection
      title="Técnico"
      description="Sinais técnicos e de infraestrutura da página."
      icon={<WrenchIcon className="size-4" />}
    >
      <AuditItem
        label="HTTPS"
        status={technical.isHttps ? "pass" : "fail"}
        detail={technical.isHttps ? "Conexão segura." : "O site não usa HTTPS."}
      />
      <AuditItem
        label="Favicon"
        status={technical.hasFavicon ? "pass" : "warn"}
        detail={technical.hasFavicon ? "Favicon presente." : "Favicon ausente."}
      />
      <AuditItem
        label="Charset"
        status={technical.hasCharset ? "pass" : "warn"}
        detail={technical.hasCharset ? "Codificação declarada." : "Codificação não declarada."}
      />
      <AuditItem
        label="robots.txt"
        status={technical.hasRobots ? "pass" : "warn"}
        detail={technical.hasRobots ? "Meta robots presente." : "Meta robots ausente."}
      />
      <AuditItem
        label="Dados estruturados"
        status={technical.hasStructuredData ? "pass" : "warn"}
        detail={
          technical.hasStructuredData
            ? "JSON-LD ou microdados presentes."
            : "Nenhum dado estruturado encontrado."
        }
      />
      <AuditItem
        label="Sitemap"
        status={technical.hasSitemap ? "pass" : "warn"}
        detail={technical.hasSitemap ? "Referência a sitemap encontrada." : "Sitemap não referenciado."}
      />
      <AuditItem
        label="Tamanho do HTML"
        status="warn"
        detail={formatBytes(technical.htmlSize)}
      />
      <AuditItem
        label="Tempo de resposta"
        status={technical.responseTimeMs < 1000 ? "pass" : "warn"}
        detail={`${technical.responseTimeMs} ms`}
      />
    </AuditSection>
  );
}