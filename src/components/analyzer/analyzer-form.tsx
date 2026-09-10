"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SearchIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { WebsiteAnalysis } from "@/types/analysis";

const formSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Informe uma URL para analisar.")
    .max(2048, "A URL é muito longa."),
});

type FormValues = z.infer<typeof formSchema>;

interface AnalyzerFormProps {
  onResult: (result: WebsiteAnalysis) => void;
  onError: (message: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

export function AnalyzerForm({
  onResult,
  onError,
  onLoadingChange,
}: AnalyzerFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: "" },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    onLoadingChange(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: values.url }),
      });

      const data = await res.json();

      if (!res.ok) {
        onError(data?.message ?? "Não foi possível analisar o site.");
        return;
      }

      onResult(data as WebsiteAnalysis);
    } catch {
      onError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
      onLoadingChange(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-3 sm:flex-row sm:items-start"
      noValidate
    >
      <div className="flex-1">
        <Input
          type="url"
          placeholder="https://exemplo.com"
          aria-label="URL do site"
          aria-invalid={!!errors.url}
          disabled={loading}
          className={cn("h-11 text-base", errors.url && "border-destructive")}
          {...register("url")}
        />
        {errors.url && (
          <p className="mt-1.5 text-sm text-destructive">{errors.url.message}</p>
        )}
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="h-11 gap-2 px-5"
      >
        {loading ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <SearchIcon className="size-4" />
        )}
        {loading ? "Analisando…" : "Analisar"}
      </Button>
    </form>
  );
}