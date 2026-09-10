import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuditSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}

/** A titled card section grouping related audit items. */
export function AuditSection({
  title,
  description,
  icon,
  children,
}: AuditSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <CardTitle>{title}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}