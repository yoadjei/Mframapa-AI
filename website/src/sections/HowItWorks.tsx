import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { PhoneMockup, type PhoneScreen } from '../components/PhoneMockup'
import { copy } from '../content/copy'
import { iosScreen, iosSoft } from '../lib/ios'
import { useSiteMotion } from '../lib/motionPreference'
import { useIsMobile } from '../hooks/useIsMobile'

/**
 * Desktop: tall sticky scroll-scrub.
 * Mobile: tap steps + auto-cycle (sticky 280vh fights mobile nav / viewport).
 */
export function HowItWorks() {
  const isMobile = useIsMobile()
  return isMobile ? <HowItWorksMobile /> : <HowItWorksDesktop />
}

function HowItWorksMobile() {
  const steps = copy.how.steps
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const step = steps[active]!

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      setActive((a) => (a + 1) % steps.length)
    }, 3600)
    return () => window.clearInterval(id)
  }, [paused, steps.length])

  useEffect(() => {
    if (!paused) return
    const id = window.setTimeout(() => setPaused(false), 8000)
    return () => window.clearTimeout(id)
  }, [paused])

  return (
    <section className="border-t border-line bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-5">
        <p className="text-[12px] font-semibold tracking-[0.16em] text-mint-dark uppercase">
          How it works
        </p>

        <div className="relative mx-auto mt-8 flex min-h-[360px] items-center justify-center">
          <div
            className="absolute inset-10 rounded-full bg-[radial-gradient(circle,rgba(0,200,150,0.14)_0%,transparent_68%)]"
            aria-hidden
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={iosScreen}
            >
              <PhoneMockup
                screen={step.screen as PhoneScreen}
                floating={false}
                size="md"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step chips — clear mobile navigation */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {steps.map((s, i) => {
            const on = i === active
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActive(i)
                  setPaused(true)
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  on
                    ? 'bg-ink text-white'
                    : 'bg-canvas text-muted ring-1 ring-line'
                }`}
              >
                {s.step}
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            className="mt-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={iosSoft}
          >
            <h3 className="font-display text-2xl font-bold tracking-tight text-ink">
              {step.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex gap-1.5">
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to ${s.step}`}
              onClick={() => {
                setActive(i)
                setPaused(true)
              }}
              className={`h-1.5 flex-1 rounded-full transition ${
                i === active ? 'bg-mint' : 'bg-line'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksDesktop() {
  const { intensity } = useSiteMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const steps = copy.how.steps
  const [active, setActive] = useState(0)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  const stepIndex = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], [0, 1, 2, 2])
  const phoneScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 1.04])
  const phoneY = useTransform(scrollYProgress, [0, 1], [40 * intensity, -20 * intensity])
  const dustOpacity = useTransform(scrollYProgress, [0.55, 0.9], [0, 0.55])
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  useEffect(() => {
    return stepIndex.on('change', (v) => {
      setActive(Math.min(2, Math.max(0, Math.round(v))))
    })
  }, [stepIndex])

  const step = steps[active]!

  return (
    <section ref={sectionRef} className="relative h-[280vh] bg-white">
      <div className="sticky top-0 flex min-h-dvh items-center overflow-hidden">
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(212,165,116,0.35),transparent_60%)]"
          style={{ opacity: dustOpacity }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-5 md:grid-cols-2 md:gap-16 md:px-8">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.16em] text-mint-dark uppercase">
              How it works
            </p>
            <div className="mt-6 space-y-8">
              {steps.map((s, i) => {
                const on = i === active
                return (
                  <motion.div
                    key={s.id}
                    animate={{
                      opacity: on ? 1 : 0.28,
                      x: on ? 0 : -12,
                      filter: on ? 'blur(0px)' : 'blur(1px)',
                    }}
                    transition={iosScreen}
                  >
                    <p className="text-[12px] font-semibold tracking-[0.14em] text-dim uppercase">
                      {s.step}
                    </p>
                    <h3
                      className={`mt-1.5 font-display text-2xl font-bold tracking-tight sm:text-3xl ${
                        on ? 'text-ink' : 'text-ink/50'
                      }`}
                    >
                      {s.title}
                    </h3>
                    <AnimatePresence mode="wait">
                      {on ? (
                        <motion.p
                          key={s.id}
                          className="mt-2 max-w-md text-[15px] leading-relaxed text-muted"
                          initial={{ opacity: 0, y: 12, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -8, height: 0 }}
                          transition={iosScreen}
                        >
                          {s.body}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>

            <div className="mt-10 h-1 overflow-hidden rounded-full bg-line">
              <motion.div className="h-full bg-mint" style={{ width: progressWidth }} />
            </div>
          </div>

          <motion.div
            className="relative flex min-h-[420px] items-center justify-center"
            style={{ scale: phoneScale, y: phoneY }}
          >
            <motion.div
              className="absolute inset-8 rounded-full bg-[radial-gradient(circle,rgba(0,200,150,0.16)_0%,transparent_68%)]"
              animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.85, 0.5] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 48, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -40, filter: 'blur(8px)' }}
                transition={iosScreen}
              >
                <PhoneMockup
                  screen={step.screen as PhoneScreen}
                  floating={false}
                  size="lg"
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
