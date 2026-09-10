import type { WebsiteAnalysis } from "@/types/analysis";
import { GeneralOverview } from "./general-overview";
import { ScoreCard } from "./score-card";
import { SeoSection } from "./seo-section";
import { SocialSection } from "./social-section";
import { StructureSection } from "./structure-section";
import { ImagesSection } from "./images-section";
import { TechnicalSection } from "./technical-section";

interface AnalysisResultProps {
  result: WebsiteAnalysis;
}

/** Full analysis result layout: score + overview + detailed sections. */
export function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <div className="mt-8 grid w-full gap-6">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <ScoreCard score={result.score} />
        <GeneralOverview request={result.request} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SeoSection metadata={result.metadata} seo={result.seo} />
        <SocialSection social={result.social} />
        <StructureSection headings={result.headings} />
        <ImagesSection images={result.images} />
        <TechnicalSection technical={result.technical} />
      </div>
    </div>
  );
}