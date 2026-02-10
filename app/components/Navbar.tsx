"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Atom01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
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
  { href: "/transcripts", label: "Recordings" },
  { href: "/calls", label: "Calls" },
  { href: "/insights", label: "Insights" },
  { href: "/playbooks", label: "Playbooks" },
];

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  return (
    <nav className={`sticky top-0 z-50 pt-6 pb-2 transition-all duration-300 ${
      isScrolled
        ? "bg-gradient-to-b from-background via-background/98 to-background/0"
        : "bg-gradient-to-b from-background/98 via-background/95 to-background/0"
    }`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className={`flex items-center justify-between rounded-full border pl-6 h-14 pr-1.5 py-1 transition-all duration-300 ${
          isScrolled
            ? "border-stone-200/80 bg-white/95 backdrop-blur-md"
            : "border-stone-200/60 bg-white/90 backdrop-blur-sm"
        }`}>
          {/* Logo */}
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-85"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-900">
              <HugeiconsIcon icon={Atom01Icon} size={18} color="#ff6b35" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold text-foreground">Cellory</span>
          </Link>

          {/* Desktop Navigation Links - Always visible */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-[#ff6b35] text-white"
                      : "text-foreground hover:bg-stone-100 hover:text-[#ff6b35]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side: User Menu */}
          <div className="flex items-center gap-2">
            {/* Desktop User Dropdown */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-stone-100">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                      <AvatarFallback className="text-xs font-medium">{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-xl border-stone-200/60">
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

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-stone-100">
                    <HugeiconsIcon icon={Menu01Icon} className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64 bg-white/95 backdrop-blur-xl">
                  <div className="flex flex-col gap-6 pt-6">
                    {/* User Info */}
                    <div className="flex items-center gap-3 border-b pb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                        <AvatarFallback className="font-medium">{userInitials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.name}</span>
                        {user.email && (
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        )}
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-col gap-2">
                      {navLinks.map((link) => {
                        const active = isActive(link.href);
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              active
                                ? "bg-[#ff6b35] text-white"
                                : "text-foreground hover:bg-stone-100 hover:text-[#ff6b35]"
                            }`}
                          >
                            {link.label}
                          </Link>
                        );
                      })}
                    </nav>

                    {/* Sign Out */}
                    <div className="mt-auto border-t pt-4">
                      <Button onClick={() => signOut()} variant="outline" className="w-full">
                        Sign out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
