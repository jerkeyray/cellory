"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Atom01Icon, MusicNote01Icon, CallIcon, Analytics01Icon, BookOpen01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
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
  { href: "/transcripts", label: "Recordings", icon: MusicNote01Icon },
  { href: "/calls", label: "Calls", icon: CallIcon },
  { href: "/insights", label: "Insights", icon: Analytics01Icon },
  { href: "/playbooks", label: "Playbooks", icon: BookOpen01Icon },
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

  const userInitials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const isActive = (href: string) => {
    if (href === "/calls") {
      return pathname === "/calls" || pathname?.startsWith("/calls/");
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  // Mobile Menu
  const MobileMenu = () => (
    <div className="fixed left-4 top-4 z-50 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg bg-white/95 backdrop-blur-md border-stone-200/60">
            <HugeiconsIcon icon={Menu01Icon} className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-white/95 backdrop-blur-md p-0">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2.5 border-b border-stone-300/80 px-6">
              <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-900">
                  <HugeiconsIcon icon={Atom01Icon} size={18} color="#ff6b35" strokeWidth={1.5} />
                </div>
                <span className="text-xl font-bold text-foreground">Cellory</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1 p-4">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      active
                        ? "bg-stone-100 text-[#ea580c]"
                        : "text-foreground hover:bg-stone-100 hover:text-[#ff6b35]"
                    }`}
                  >
                    <HugeiconsIcon icon={link.icon} className="h-5 w-5 flex-shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Profile */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                  <AvatarFallback className="text-xs font-medium">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">{user.name}</span>
                  {user.email && (
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  )}
                </div>
              </div>
              <Button onClick={() => signOut()} variant="outline" className="w-full">
                Sign out
              </Button>
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
      <aside className="hidden lg:fixed left-3 top-3 bottom-3 z-50 w-64 rounded-xl border border-stone-300/80 bg-white/95 backdrop-blur-md lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2.5 border-b border-stone-300/80 px-6">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-900">
                <HugeiconsIcon icon={Atom01Icon} size={18} color="#ff6b35" strokeWidth={1.5} />
              </div>
              <span className="text-xl font-bold text-foreground">Cellory</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 p-4">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-stone-100 text-[#ea580c]"
                      : "text-foreground hover:bg-stone-100 hover:text-[#ff6b35]"
                  }`}
                >
                  <HugeiconsIcon icon={link.icon} className="h-5 w-5 flex-shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full gap-3 text-left hover:bg-stone-100 px-3 justify-start"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                    <AvatarFallback className="text-xs font-medium">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex w-full flex-col items-start overflow-hidden text-left">
                    <span className="w-full truncate text-left text-sm font-medium">{user.name}</span>
                    {user.email && (
                      <span className="w-full truncate text-left text-xs text-muted-foreground">{user.email}</span>
                    )}
                  </div>
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
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </>
  );
}
