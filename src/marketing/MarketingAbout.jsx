import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

export function AboutSection({ id = undefined, tone = 'base' }) {
  return (
    <>
      <style>{originStoryStyles}</style>
      <section
        id={id}
        className={`marketing-section marketing-section-bg-${tone}`}
      >
        <div
          className="marketing-section-inner origin-story-shell"
          style={{
            maxWidth: '1180px',