"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hasSidebar, setHasSidebar] = useState(false);

  useEffect(() => {
    // Check if sidebar actually exists in the DOM
    const checkSidebar = () => {
      const sidebar = document.querySelector('aside');
      setHasSidebar(!!sidebar);
    };

    // Check immediately
    checkSidebar();

    // Check again after a short delay to ensure DOM is fully rendered
    const timeout = setTimeout(checkSidebar, 100);

    return () => clearTimeout(timeout);
  }, [pathname]);

  // Auth pages never have sidebar
  const isAuthPage = pathname?.startsWith("/auth");

  // Only add margin if not an auth page AND sidebar exists in DOM
  const needsMargin = !isAuthPage && hasSidebar;

  return (
    <main className={`min-h-screen transition-all duration-300 ${needsMargin ? "lg:ml-64" : ""}`}>
      {children}
    </main>
  );
}
