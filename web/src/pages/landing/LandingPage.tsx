import { NavbarSection }        from './sections/NavbarSection'
import { HeroSection }          from './sections/HeroSection'
import { ProblemSection }       from './sections/ProblemSection'
import { StatsSection }         from './sections/StatsSection'
import { HowItWorksSection }    from './sections/HowItWorksSection'
import { ArchitectureSection }  from './sections/ArchitectureSection'
import { LiveFeedSection }      from './sections/LiveFeedSection'
import { CTASection }           from './sections/CTASection'
import { FooterSection }        from './sections/FooterSection'
import { ScrollProgressBar }    from './components/ScrollProgressBar'

export default function LandingPage() {
  return (
    <>
      <ScrollProgressBar />
      <NavbarSection />
      <main>
        <HeroSection />
        <ProblemSection />
        <StatsSection />
        <HowItWorksSection />
        <ArchitectureSection />
        <LiveFeedSection />
        <CTASection />
      </main>
      <FooterSection />
    </>
  )
}
