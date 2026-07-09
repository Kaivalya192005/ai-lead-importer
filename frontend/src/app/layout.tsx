import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI CRM Lead Importer | GrowEasy",
  description: "Upload any CSV, let generative AI map, sanitize, and validate lead contacts into CRM fields in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;750;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full antialiased font-sans select-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
