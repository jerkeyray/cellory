"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { FileAudio, Phone, TrendingUp, BookOpen, Bot, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/transcripts", label: "Recordings", icon: FileAudio },
  { href: "/calls", label: "Calls", icon: Phone },
  { href: "/insights", label: "Insights", icon: TrendingUp },
  { href: "/playbooks", label: "Playbooks", icon: BookOpen },
  { href: "/agent", label: "Agents", icon: Bot },
];

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const userInitials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const isActive = (href: string) => {
    if (href === "/calls") {
      return pathname === "/calls" || pathname?.startsWith("/calls/");
    }
    if (href === "/agent") {
      return pathname === "/agent" || pathname?.startsWith("/agent/");
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  // Mobile Menu
  const MobileMenu = () => (
    <div className="fixed left-4 top-4 z-50 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg bg-white/95 backdrop-blur-md border-stone-200/60 shadow-sm">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-white/95 backdrop-blur-md p-0">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-stone-200/60 px-6">
              <Link href="/" className="text-xl font-bold text-foreground hover:text-[#ff6b35] transition-colors">
                Cellory
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1 p-4">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      active
                        ? "bg-[#ff6b35] text-white shadow-md"
                        : "text-foreground hover:bg-stone-100 hover:text-[#ff6b35]"
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Profile */}
            <div className="border-t border-stone-200/60 p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                  <AvatarFallback className="text-xs font-semibold">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">{user.name}</span>
                  {user.email && (
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  )}
                </div>
              </div>
              <form action="/api/auth/signout" method="POST">
                <Button type="submit" variant="outline" className="w-full">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <MobileMenu />

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:fixed left-0 top-0 z-50 h-screen border-r border-stone-200/60 bg-white/95 backdrop-blur-md transition-all duration-300 lg:block ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
      <div className="flex h-full flex-col">
        {/* Logo & Collapse Button */}
        <div className="flex h-16 items-center justify-between border-b border-stone-200/60 px-6">
          {!collapsed && (
            <Link href="/" className="text-xl font-bold text-foreground hover:text-[#ff6b35] transition-colors">
              Cellory
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 rounded-lg hover:bg-stone-100"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 p-4">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[#ff6b35] text-white shadow-md"
                    : "text-foreground hover:bg-stone-100 hover:text-[#ff6b35]"
                }`}
                title={collapsed ? link.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-stone-200/60 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full gap-3 text-left hover:bg-stone-100 ${
                  collapsed ? "px-0 justify-center" : "px-3 justify-start"
                }`}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                  <AvatarFallback className="text-xs font-semibold">{userInitials}</AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex w-full flex-col items-start overflow-hidden text-left">
                    <span className="w-full truncate text-left text-sm font-medium">{user.name}</span>
                    {user.email && (
                      <span className="w-full truncate text-left text-xs text-muted-foreground">{user.email}</span>
                    )}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-56 bg-white/95 backdrop-blur-xl border-stone-200/60">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  {user.email && (
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action="/api/auth/signout" method="POST">
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full cursor-pointer">
                    Sign out
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
    </>
  );
}
