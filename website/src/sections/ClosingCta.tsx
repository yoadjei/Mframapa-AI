import { motion, useReducedMotion } from 'framer-motion'
import { APP_URL } from '../lib/constants'
import { copy } from '../content/copy'
import { viewportOnce } from '../lib/motion'

/** Mentismint-style closing band — one line + one CTA. */
export function ClosingCta() {
  const reduce = useReducedMotion()

  return (
    <section className="border-t border-line bg-white py-20 sm:py-24 md:py-28">
      <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
        <motion.h2
          className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-[2.75rem] md:leading-tight"
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.65 }}
        >
          {copy.closing.title}
        </motion.h2>
        <motion.div
          className="mt-9"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ delay: 0.12, duration: 0.5 }}
        >
          <motion.a
            href={APP_URL}
            className="inline-flex items-center justify-center rounded-full bg-ink px-9 py-3.5 text-[15px] font-semibold text-white shadow-[0_16px_40px_-16px_rgba(10,10,10,0.5)]"
            whileHover={reduce ? undefined : { scale: 1.03, y: -2 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
          >
            {copy.closing.cta}
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
