import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useSiteMotion } from '../lib/motionPreference'

const HeroCanvas = lazy(() =>
  import('./HeroCanvas').then((m) => ({ default: m.HeroCanvas })),
)

function HeroCanvasBridge({
  intensity,
  scrollBoost,
}: {
  intensity: number
  scrollBoost: MotionValue<number>
}) {
  const [boost, setBoost] = useState(0)
  useEffect(() => scrollBoost.on('change', setBoost), [scrollBoost])
  return <HeroCanvas intensity={intensity} scrollBoost={boost} />
}

export function HeroStage() {
  const { intensity } = useSiteMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const scrollBoost = useTransform(scrollYProgress, [0, 1], [0, 1])
  const stageY = useTransform(scrollYProgress, [0, 1], [0, 80 * intensity])
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 0.92])
  const stageOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35])

  return (
    <motion.div
      ref={ref}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ y: stageY, scale: stageScale, opacity: stageOpacity }}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_40%,#ffffff_0%,transparent_72%)]" />
      <Suspense fallback={null}>
        <HeroCanvasBridge intensity={intensity} scrollBoost={scrollBoost} />
      </Suspense>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-canvas to-transparent" />
    </motion.div>
  )
}
