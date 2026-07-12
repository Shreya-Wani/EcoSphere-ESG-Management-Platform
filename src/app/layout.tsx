import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Serif display face used for landing-page headings (moss-green marketing site).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EcoSphere — ESG Management Platform",
  description:
    "ESG data, employee action and gamified engagement — in one system of record.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <head>
        {/* Apply the persisted theme before paint to avoid a flash of the
            wrong palette. Presentational only — reads localStorage, sets a
            class; no data or behavior involved. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('es-theme')==='dark'){document.documentElement.classList.add('app-dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
