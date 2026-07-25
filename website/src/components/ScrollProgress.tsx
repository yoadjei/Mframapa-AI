import { motion, useScroll, useSpring } from 'framer-motion'

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 })

  return (
    <motion.div
      className="fixed top-0 right-0 left-0 z-[70] h-[3px] origin-left bg-mint"
      style={{ scaleX }}
      aria-hidden
    />
  )
}
