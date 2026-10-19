import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignTube — YouTube to Sign Language Translator",
  description:
    "Real-time YouTube video to American Sign Language (ASL) translation using a 3D avatar with SiGML animations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-black text-white">{children}</body>
    </html>
  );
}
