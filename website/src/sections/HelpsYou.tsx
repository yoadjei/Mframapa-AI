import { motion } from 'framer-motion'
import { Bell, CalendarDays, MapPinned, WifiOff } from 'lucide-react'
import { copy } from '../content/copy'
import { iosFadeUp, iosSoft, iosStagger, iosViewport } from '../lib/ios'

const icons = [MapPinned, CalendarDays, Bell, WifiOff]

export function HelpsYou() {
  return (
    <section className="py-20 sm:py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8">
        <motion.h2
          className="max-w-xl font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-[2.75rem]"
          initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={iosViewport}
          transition={iosSoft}
        >
          {copy.helps.title}
        </motion.h2>

        <motion.div
          className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5"
          variants={iosStagger}
          initial="hidden"
          whileInView="show"
          viewport={iosViewport}
        >
          {copy.helps.items.map(({ title, body }, i) => {
            const Icon = icons[i]!
            return (
              <motion.article
                key={title}
                variants={iosFadeUp}
                whileHover={{ y: -8, scale: 1.015 }}
                transition={iosSoft}
                className="rounded-[1.5rem] bg-white p-7 ring-1 ring-line sm:rounded-[1.75rem] sm:p-8"
              >
                <motion.div
                  className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/15 text-mint-dark"
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 2.8 + i * 0.35,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.15,
                  }}
                >
                  <Icon size={22} strokeWidth={2.1} />
                </motion.div>
                <h3 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                  {title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{body}</p>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
