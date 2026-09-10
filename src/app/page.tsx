"use client";

import { useState } from "react";
import { SearchIcon } from "lucide-react";
import { AnalyzerForm } from "@/components/analyzer/analyzer-form";
import { AnalyzerLoading } from "@/components/analyzer/analyzer-loading";
import { AnalysisResult } from "@/components/analysis/analysis-result";
import type { WebsiteAnalysis } from "@/types/analysis";

export default function Home() {
  const [result, setResult] = useState<WebsiteAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleResult(data: WebsiteAnalysis) {
    setResult(data);
    setError(null);
  }

  function handleError(message: string) {
    setError(message);
    setResult(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-12 sm:py-16">
      <section className="flex w-full flex-col items-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <SearchIcon className="size-6" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          MetaLens
        </h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Analise metadados, SEO, acessibilidade e sinais técnicos de qualquer
          site com uma pontuação transparente.
        </p>
      </section>

      <section className="mt-8 w-full max-w-2xl">
        <AnalyzerForm
          onResult={handleResult}
          onError={handleError}
          onLoadingChange={setLoading}
        />
        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </section>

      {loading && <AnalyzerLoading />}
      {!loading && result && <AnalysisResult result={result} />}
    </div>
  );
}
