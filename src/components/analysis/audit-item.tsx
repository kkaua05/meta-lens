import { CheckIcon, XIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuditStatus = "pass" | "fail" | "warn";

interface AuditItemProps {
  label: string;
  status: AuditStatus;
  detail?: string;
}

const statusStyles: Record<AuditStatus, { icon: React.ReactNode; className: string }> = {
  pass: {
    icon: <CheckIcon className="size-4" />,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  fail: {
    icon: <XIcon className="size-4" />,
    className: "text-destructive",
  },
  warn: {
    icon: <MinusIcon className="size-4" />,
    className: "text-amber-600 dark:text-amber-400",
  },
};

/** A single audit check row with a pass/fail/warn indicator. */
export function AuditItem({ label, status, detail }: AuditItemProps) {
  const { icon, className } = statusStyles[status];
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className={cn("mt-0.5 shrink-0", className)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {detail && (
          <p className="mt-0.5 break-words text-xs text-muted-foreground">
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}