import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SidebarWrapper from "./components/SidebarWrapper";
import MainContent from "./components/MainContent";
import { Toaster } from "sonner";
import { Providers } from "./components/Providers";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cellory — Financial Audio Intelligence",
  description: "Convert unstructured call recordings into structured, auditable insights and reusable behavioral guidance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <SidebarWrapper />
          <MainContent>
            {children}
          </MainContent>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
