import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({ subsets: ["latin"] });
// ... (removing unused fonts) ...

export const metadata: Metadata = {
  title: "Property App",
  description: "Resident Portal",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} font-sans`} suppressHydrationWarning>
        <Sidebar />
        <main className="min-h-screen bg-background text-foreground pb-16 md:pb-0 md:ml-20 transition-[margin]">
          {children}
        </main>
        <MobileNav />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
