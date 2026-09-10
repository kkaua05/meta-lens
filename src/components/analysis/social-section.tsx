import { Share2Icon } from "lucide-react";
import type { SocialMetadata } from "@/types/analysis";
import { AuditSection } from "./audit-section";
import { AuditItem } from "./audit-item";

interface SocialSectionProps {
  social: SocialMetadata;
}

/** Open Graph and Twitter Card metadata. */
export function SocialSection({ social }: SocialSectionProps) {
  const hasOg = social.ogTitle || social.ogDescription || social.ogImage;
  const hasTwitter = social.twitterCard || social.twitterTitle || social.twitterDescription;

  return (
    <AuditSection
      title="Redes Sociais"
      description="Metadados Open Graph e Twitter Card para compartilhamento."
      icon={<Share2Icon className="size-4" />}
    >
      <AuditItem
        label="Open Graph"
        status={hasOg ? "pass" : "fail"}
        detail={
          hasOg
            ? [social.ogTitle, social.ogDescription, social.ogImage]
                .filter(Boolean)
                .join(" · ")
            : "Nenhum metadado Open Graph encontrado."
        }
      />
      <AuditItem
        label="Twitter Card"
        status={hasTwitter ? "pass" : "fail"}
        detail={
          hasTwitter
            ? social.twitterCard || "Metadados Twitter presentes."
            : "Nenhum metadado Twitter Card encontrado."
        }
      />
    </AuditSection>
  );
}