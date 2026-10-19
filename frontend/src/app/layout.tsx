import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ErrorBoundary } from "@/components/error-boundary";

const manrope = localFont({
  src: [
    { path: "../../public/fonts/manrope-thin.otf", weight: "100", style: "normal" },
    { path: "../../public/fonts/manrope-light.otf", weight: "300", style: "normal" },
    { path: "../../public/fonts/manrope-regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/manrope-medium.otf", weight: "500", style: "normal" },
    { path: "../../public/fonts/manrope-semibold.otf", weight: "600", style: "normal" },
    { path: "../../public/fonts/manrope-bold.otf", weight: "700", style: "normal" },
    { path: "../../public/fonts/manrope-extrabold.otf", weight: "800", style: "normal" },
  ],
  variable: "--font-manrope",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "SignSync — Real-Time Sign Language Translator",
  description:
    "A premium AI-powered platform for real-time sign language translation and learning. Bridge the gap between sign language and speech.",
  openGraph: {
    title: "SignSync — Real-Time Sign Language Translator",
    description:
      "Bridge the communication gap for 466M+ deaf and hard-of-hearing people with real-time AI sign language translation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${manrope.variable} font-manrope antialiased bg-black`}>
        <ErrorBoundary>
          <SmoothScroll>{children}</SmoothScroll>
        </ErrorBoundary>
      </body>
    </html>
  );
}
