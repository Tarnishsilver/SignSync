import { Navbar } from "@/components/navbar";
import { EntrySequence } from "@/components/landing/entry-sequence";
import { Hero } from "@/components/landing/hero";
import { Impact } from "@/components/landing/impact";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { DemoPreview } from "@/components/landing/demo-preview";
import { Learning } from "@/components/landing/learning";
import { UseCases } from "@/components/landing/use-cases";
import { ExtensionCTA } from "@/components/landing/extension-cta";
import { TechStack } from "@/components/landing/tech-stack";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="relative bg-black selection:bg-white selection:text-black">
      <Navbar />
      <EntrySequence />
      <Hero />
      <Impact />
      <Features />
      <HowItWorks />
      <DemoPreview />
      <ExtensionCTA />
      <Learning />
      <UseCases />
      <TechStack />
      <CTA />
      <Footer />
    </main>
  );
}
