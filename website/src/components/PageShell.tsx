import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { iosFadeUp, iosSoft, iosStagger } from '../lib/ios'

type Props = {
  children: ReactNode
  /** Wider legal/reading column vs marketing grid */
  narrow?: boolean
}

/**
 * Shared motion chrome for About / Support / Privacy / Terms —
 * same energy as Home: blur-in, stagger, soft ambient wash.
 */
export function PageShell({ children, narrow = false }: Props) {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <motion.div
          className="absolute -top-24 left-[-10%] h-[340px] w-[340px] rounded-full bg-mint/15 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 24, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[40%] right-[-8%] h-[300px] w-[300px] rounded-full bg-accent/10 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className={`relative z-10 mx-auto px-5 py-16 md:px-8 md:py-24 ${
          narrow ? 'max-w-2xl' : 'max-w-6xl'
        }`}
        variants={iosStagger}
        initial="hidden"
        animate="show"
      >
        {children}
      </motion.div>
    </div>
  )
}

export function PageTitle({
  label,
  title,
  sub,
}: {
  label?: string
  title: string
  sub?: string
}) {
  return (
    <>
      {label ? (
        <motion.p
          variants={iosFadeUp}
          className="mb-3 text-xs font-semibold tracking-[0.18em] text-mint-dark uppercase"
        >
          {label}
        </motion.p>
      ) : null}
      <motion.h1
        variants={iosFadeUp}
        className="font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl"
        transition={iosSoft}
      >
        {title}
      </motion.h1>
      {sub ? (
        <motion.p variants={iosFadeUp} className="mt-3 text-lg text-muted">
          {sub}
        </motion.p>
      ) : null}
    </>
  )
}

export const pageItem = iosFadeUp
