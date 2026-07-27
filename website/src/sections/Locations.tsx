import { motion } from 'framer-motion'
import { SectionLabel } from '../components/SectionLabel'
import { copy } from '../content/copy'
import { iosFadeUp, iosSoft, iosStagger, iosViewport } from '../lib/ios'

const ACCRA_IMAGE = '/images/accra-independence-square.jpg'

export function Locations() {
  return (
    <section className="py-20 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={iosViewport}
          transition={iosSoft}
        >
          <SectionLabel>{copy.locations.label}</SectionLabel>
          <h2 className="max-w-2xl whitespace-pre-line font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-[2.75rem]">
            {copy.locations.title}
          </h2>
        </motion.div>

        <motion.div
          className="mt-14 grid gap-4 md:grid-cols-2 md:gap-5"
          variants={iosStagger}
          initial="hidden"
          whileInView="show"
          viewport={iosViewport}
        >
          <motion.div
            variants={iosFadeUp}
            whileHover={{ y: -6 }}
            transition={iosSoft}
            className="flex min-h-[280px] flex-col justify-between rounded-[1.75rem] bg-white p-8 ring-1 ring-line sm:min-h-[340px] sm:rounded-[2rem] sm:p-10 md:min-h-[380px]"
          >
            <h3 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Ghana
            </h3>
            <div className="space-y-1.5 text-[15px] text-muted">
              <p>mframapa</p>
              <p>Accra</p>
              <p>Greater Accra</p>
              <p>Ghana</p>
            </div>
          </motion.div>

          <motion.div
            variants={iosFadeUp}
            whileHover={{ scale: 1.015 }}
            className="relative min-h-[280px] overflow-hidden rounded-[1.75rem] sm:min-h-[340px] sm:rounded-[2rem] md:min-h-[380px]"
          >
            <motion.img
              src={ACCRA_IMAGE}
              alt="Independence Square, Accra, Ghana"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              initial={{ scale: 1.12 }}
              whileInView={{ scale: 1 }}
              viewport={iosViewport}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <p className="text-sm font-semibold text-white">Independence Square, Accra</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
