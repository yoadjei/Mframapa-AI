import { Hero } from '../sections/Hero'
import { CityMarquee } from '../sections/CityMarquee'
import { Story } from '../sections/Story'
import { HelpsYou } from '../sections/HelpsYou'
import { HowItWorks } from '../sections/HowItWorks'
import { Locations } from '../sections/Locations'
import { ClosingCta } from '../sections/ClosingCta'

export function Home() {
  return (
    <>
      <Hero />
      <CityMarquee />
      <Story />
      <HelpsYou />
      <HowItWorks />
      <Locations />
      <ClosingCta />
    </>
  )
}
