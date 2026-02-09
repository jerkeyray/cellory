import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: { href: string; label: string };
  actions?: ReactNode;
}

export function PageHeader({ title, description, backLink, actions }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {backLink && (
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={backLink.href} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              {backLink.label}
            </Link>
          </Button>
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
