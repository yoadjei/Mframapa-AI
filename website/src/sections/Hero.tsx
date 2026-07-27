import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { HeroStage } from '../components/HeroStage'
import { PhoneMockup } from '../components/PhoneMockup'
import { StoreBadges } from '../components/StoreBadges'
import { APP_URL } from '../lib/constants'
import { copy } from '../content/copy'
import { useSiteMotion } from '../lib/motionPreference'
import { useIsMobile } from '../hooks/useIsMobile'
import { iosFadeUp, iosSoft, iosStagger } from '../lib/ios'

export function Hero() {
  const { intensity, soft } = useSiteMotion()
  const isMobile = useIsMobile()
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, 120 * intensity])
  const phoneRotate = useTransform(scrollYProgress, [0, 1], [0, -8 * intensity])
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -40 * intensity])

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      <motion.div
        className="relative z-20 mx-auto max-w-3xl px-5 pt-10 pb-4 text-center sm:pt-14 md:pt-16"
        style={{ y: titleY }}
        variants={iosStagger}
        initial="hidden"
        animate="show"
      >
        <motion.h1
          variants={iosFadeUp}
          className="font-display text-[2.35rem] leading-[1.08] font-extrabold tracking-[-0.035em] text-ink sm:text-5xl md:text-[3.75rem]"
        >
          {copy.hero.title}
        </motion.h1>
        <motion.p
          variants={iosFadeUp}
          className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:text-lg"
        >
          {copy.hero.sub}
        </motion.p>
        <motion.div variants={iosFadeUp} className="mt-8">
          <motion.a
            href={APP_URL}
            className="inline-flex items-center justify-center rounded-full bg-ink px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_16px_40px_-16px_rgba(10,10,10,0.5)]"
            whileHover={{ y: -3, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={iosSoft}
          >
            {copy.hero.cta}
          </motion.a>
        </motion.div>
      </motion.div>

      <div className="relative flex min-h-[52vh] items-center justify-center px-4 pt-4 pb-4 sm:min-h-[62vh] sm:pt-6 sm:pb-6 md:min-h-[72vh] md:pb-10">
        <HeroStage />

        <motion.div
          className="absolute top-[16%] right-[6%] z-20 hidden w-[178px] rounded-2xl border border-white/80 bg-white/85 p-3.5 shadow-[0_20px_50px_-24px_rgba(10,10,10,0.45)] backdrop-blur-xl lg:block xl:right-[12%]"
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{
            opacity: 1,
            y: soft ? [0, -6, 0] : [0, -14, 0],
            scale: 1,
          }}
          transition={{
            opacity: { ...iosSoft, delay: 0.4 },
            scale: { ...iosSoft, delay: 0.4 },
            y: {
              delay: 1,
              duration: soft ? 5 : 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        >
          <div className="flex items-center gap-2.5">
            <motion.span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff4e5] text-sm font-bold text-[#8B6E06]"
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              !
            </motion.span>
            <div className="min-w-0 text-left">
              <p className="text-xs font-semibold text-ink">{copy.floats.askTitle}</p>
              <p className="text-[10px] text-muted">{copy.floats.askSub}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="relative z-10 w-full max-w-[min(92vw,340px)]"
          style={isMobile ? undefined : { y: phoneY, rotate: phoneRotate }}
          initial={false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...iosSoft, delay: 0.1 }}
        >
          <PhoneMockup
            screen="home"
            floating={!isMobile}
            frame
            tilted={!isMobile}
            size={isMobile ? 'md' : 'lg'}
          />
        </motion.div>
      </div>

      <motion.div
        className="relative z-10 mx-auto max-w-2xl px-5 pb-16 text-center sm:pb-20"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...iosSoft, delay: 0.3 }}
      >
        <StoreBadges />
      </motion.div>
    </section>
  )
}
