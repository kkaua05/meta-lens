import type { ScoreResult } from "@/types/analysis";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
  score: ScoreResult;
}

function ringColor(percentage: number): string {
  if (percentage >= 90) return "text-emerald-500";
  if (percentage >= 75) return "text-lime-500";
  if (percentage >= 50) return "text-amber-500";
  if (percentage >= 25) return "text-orange-500";
  return "text-destructive";
}

/** Circular score display with the overall grade. */
export function ScoreCard({ score }: ScoreCardProps) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score.percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative size-36">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth="10"
            className="stroke-muted"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn("transition-all duration-700", ringColor(score.percentage))}
            stroke="currentColor"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums">
            {score.percentage}
          </span>
          <span className="text-xs text-muted-foreground">/ {score.max}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold">{score.grade}</p>
        <p className="text-xs text-muted-foreground">
          Pontuação estimada e transparente — não é a nota oficial do Google.
        </p>
      </div>
    </div>
  );
}