"use client";

import Link from "next/link";
import { Zap, Upload, BarChart3, GitCompare, LineChart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const actions = [
  {
    name: "Upload Audio",
    description: "Upload new call recordings",
    href: "/transcripts",
    icon: Upload,
  },
  {
    name: "Analyze Call",
    description: "Create new call analysis",
    href: "/calls/new",
    icon: BarChart3,
  },
  {
    name: "Compare Outcomes",
    description: "View success vs failure patterns",
    href: "/compare",
    icon: GitCompare,
  },
  {
    name: "View Analytics",
    description: "See trends and insights",
    href: "/analytics",
    icon: LineChart,
  },
];

export default function QuickActionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Quick Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <DropdownMenuItem key={action.name} asChild>
                <Link href={action.href} className="flex items-start gap-3 cursor-pointer">
                  <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{action.name}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
