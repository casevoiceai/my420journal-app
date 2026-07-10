import MarketingLayout from './MarketingLayout'
import { HeroSection } from './MarketingHero'
import { ProcessSection } from './MarketingProcess'
import { FeatureGrid } from './MarketingFeatures'
import { AboutSection } from './MarketingAbout'
import { FAQSection } from './MarketingFAQ'
import { ContactSection } from './MarketingContact'

export default function MarketingHome() {
  return (
    <MarketingLayout>
      <HeroSection />
      <ProcessSection />
      <FeatureGrid />
      <AboutSection id="about" tone="surface" />
      <FAQSection id="faq" tone="surface" />
      <ContactSection id="contact" tone="base" />
    </MarketingLayout>
  )
}
