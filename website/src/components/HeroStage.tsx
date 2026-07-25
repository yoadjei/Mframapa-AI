import { lazy, Suspense, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useSiteMotion } from '../lib/motionPreference'
import { useIsMobile } from '../hooks/useIsMobile'

const HeroCanvas = lazy(() =>
  import('./HeroCanvas').then((m) => ({ default: m.HeroCanvas })),
)

/**
 * Pass scroll boost via ref — never setState on scroll.
 * setState was remounting/re-rendering WebGL every frame → blink on mobile GPUs.
 */
function HeroCanvasBridge({
  intensity,
  scrollBoost,
}: {
  intensity: number
  scrollBoost: MotionValue<number>
}) {
  const boostRef = useRef(0)
  useEffect(() => scrollBoost.on('change', (v) => {
    boostRef.current = v
  }), [scrollBoost])
  return <HeroCanvas intensity={intensity} scrollBoostRef={boostRef} />
}

export function HeroStage() {
  const { intensity } = useSiteMotion()
  const isMobile = useIsMobile()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const scrollBoost = useTransform(scrollYProgress, [0, 1], [0, 1])
  const stageY = useTransform(scrollYProgress, [0, 1], [0, 80 * intensity])
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 0.92])
  // Opacity on the WebGL layer blinks on mobile — only fade soft wash, not the canvas parent.
  const washOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.5])

  return (
    <motion.div
      ref={ref}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={isMobile ? undefined : { y: stageY, scale: stageScale }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_40%,#ffffff_0%,transparent_72%)]"
        style={{ opacity: washOpacity }}
      />

      {/* Soft CSS atmosphere on mobile — no WebGL (avoids blink / context loss). */}
      {isMobile ? (
        <>
          <div data-testid="hero-glow" className="hero-glow hero-glow--mint" />
          <div className="hero-glow hero-glow--blue" />
        </>
      ) : (
        <Suspense fallback={null}>
          <HeroCanvasBridge intensity={intensity} scrollBoost={scrollBoost} />
        </Suspense>
      )}

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-canvas to-transparent" />
    </motion.div>
  )
}
