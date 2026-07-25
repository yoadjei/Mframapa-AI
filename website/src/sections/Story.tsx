import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { copy } from '../content/copy'
import { useSiteMotion } from '../lib/motionPreference'

export function Story() {
  const { intensity } = useSiteMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [60 * intensity, -40 * intensity])
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0.4])
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.94, 1, 1, 0.98])
  // No scroll-linked CSS filter:blur — that forces expensive paints and stalls Lenis.

  return (
    <section ref={ref} className="relative overflow-hidden border-t border-line bg-white py-24 sm:py-32">
      <motion.p
        className="relative z-10 mx-auto max-w-3xl px-5 text-center font-display text-2xl leading-snug font-bold tracking-tight text-ink sm:text-3xl md:text-[2.35rem] md:leading-[1.25]"
        style={{ y, opacity, scale }}
      >
        {copy.story.body}
      </motion.p>
    </section>
  )
}
