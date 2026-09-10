import { ImageIcon } from "lucide-react";
import type { ImageAnalysis } from "@/types/analysis";
import { AuditSection } from "./audit-section";
import { AuditItem } from "./audit-item";

interface ImagesSectionProps {
  images: ImageAnalysis;
}

/** Image accessibility and optimization analysis. */
export function ImagesSection({ images }: ImagesSectionProps) {
  const altRatio =
    images.totalImages === 0
      ? 1
      : images.imagesWithAlt / images.totalImages;

  return (
    <AuditSection
      title="Imagens"
      description="Acessibilidade (alt) e otimização de imagens."
      icon={<ImageIcon className="size-4" />}
    >
      <AuditItem
        label="Total de imagens"
        status={images.totalImages > 0 ? "pass" : "warn"}
        detail={`${images.totalImages} imagem(ns) encontradas.`}
      />
      <AuditItem
        label="Imagens com alt"
        status={altRatio >= 0.8 ? "pass" : altRatio > 0 ? "warn" : "fail"}
        detail={`${images.imagesWithAlt} de ${images.totalImages} com texto alternativo.`}
      />
      <AuditItem
        label="Imagens sem alt"
        status={images.imagesWithoutAlt === 0 ? "pass" : "warn"}
        detail={`${images.imagesWithoutAlt} imagem(ns) sem texto alternativo.`}
      />
      <AuditItem
        label="Lazy loading"
        status={images.lazyLoadedImages > 0 ? "pass" : "warn"}
        detail={`${images.lazyLoadedImages} imagem(ns) com carregamento preguiçoso.`}
      />
    </AuditSection>
  );
}