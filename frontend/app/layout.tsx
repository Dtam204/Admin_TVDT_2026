import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import ScrollToTop from "@/components/common/ScrollToTop";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Metadata for Admin Panel
export const metadata: Metadata = {
  title: {
    default: "Admin Panel - Thư viện TN",
    template: "%s | Admin Panel",
  },
  description: "Admin Panel for Thư viện TN",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      {/* Next.js sẽ tự động tạo <head> và inject metadata vào đó */}
      <body
        className={`${plusJakarta.className} min-h-screen bg-white antialiased`}
      >
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
