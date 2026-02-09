"use client";

import { usePathname } from "next/navigation";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that don't need sidebar margin (landing page, auth pages)
  const noSidebarPages = ["/", "/auth/signin"];
  const needsMargin = !noSidebarPages.includes(pathname);

  return (
    <main className={`min-h-screen transition-all duration-300 ${needsMargin ? "lg:ml-64" : ""}`}>
      {children}
    </main>
  );
}
