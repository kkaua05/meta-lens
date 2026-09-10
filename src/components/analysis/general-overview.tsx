import { GlobeIcon, ClockIcon, LinkIcon } from "lucide-react";
import type { RequestInfo } from "@/types/analysis";
import { Card, CardContent } from "@/components/ui/card";

interface GeneralOverviewProps {
  request: RequestInfo;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** Overview of the analyzed URL and request details. */
export function GeneralOverview({ request }: GeneralOverviewProps) {
  const rows = [
    {
      icon: <GlobeIcon className="size-4" />,
      label: "URL analisada",
      value: request.finalUrl,
    },
    {
      icon: <LinkIcon className="size-4" />,
      label: "URL original",
      value: request.originalUrl,
    },
    {
      icon: <ClockIcon className="size-4" />,
      label: "Analisado em",
      value: formatDate(request.analyzedAt),
    },
  ];

  return (
    <Card>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0 text-muted-foreground">
              {row.icon}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="break-all text-sm font-medium">{row.value}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}