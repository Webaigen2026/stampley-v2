import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/components/auth/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AIDES-T2D",
    template: "%s | AIDES-T2D",
  },

  description:
    "AIDES-T2D participant portal for study surveys, check-ins, and Stampley support.",

  icons: {
    icon: [
      {
        url: "/images/Stampley/favicon.ico",
        sizes: "any",
      },
      {
        url: "/images/Stampley/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/images/Stampley/favicon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        url: "/images/Stampley/favicon-64x64.png",
        sizes: "64x64",
        type: "image/png",
      },
      {
        url: "/images/Stampley/favicon-256.png",
        sizes: "256x256",
        type: "image/png",
      },
    ],

    shortcut: [
      {
        url: "/images/Stampley/favicon.ico",
      },
    ],

    apple: [
      {
        url: "/images/Stampley/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}