import { motion } from 'framer-motion'
import { AFRICAN_CITIES } from '../content/cities'

/** Slow ticker of major African cities — capitals and metros only. */
export function CityMarquee() {
  const row = [...AFRICAN_CITIES, ...AFRICAN_CITIES]
  // Calm crawl: ~1.8s per city name
  const duration = Math.max(90, AFRICAN_CITIES.length * 1.8)

  return (
    <div className="overflow-hidden border-y border-line bg-white py-4" aria-hidden>
      <motion.div
        className="flex w-max gap-10 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
      >
        {row.map((city, i) => (
          <span
            key={`${city}-${i}`}
            className="font-display text-sm font-bold tracking-[0.14em] text-ink/40 uppercase"
          >
            {city}
            <span className="mx-4 text-mint">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}
