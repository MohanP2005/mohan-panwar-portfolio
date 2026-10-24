import type { Metadata } from "next";
import type { ReactNode } from "react";

import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import "./globals.css";
import "./sections.css";

export const metadata: Metadata = {
  title: "Mohan Panwar",
  description:
    "Mohan Panwar: building tablebid, trading systems, game bots and data projects. Based in New York.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
