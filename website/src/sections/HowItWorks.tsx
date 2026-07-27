import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PhoneMockup, type PhoneScreen } from '../components/PhoneMockup'
import { copy } from '../content/copy'
import { iosScreen, iosSoft } from '../lib/ios'
import { useIsMobile } from '../hooks/useIsMobile'

/**
 * Desktop: two-column scrub list + phone.
 * Mobile: phone first, then chips + one active step (no faded stack).
 */
export function HowItWorks() {
  const isMobile = useIsMobile()
  return isMobile ? <HowItWorksMobile /> : <HowItWorksDesktop />
}

function useHowSteps() {
  const steps = copy.how.steps
  const [active, setActive] = useState(0)
  const step = steps[active]!

  const go = useCallback(
    (index: number) => {
      setActive(((index % steps.length) + steps.length) % steps.length)
    },
    [steps.length],
  )

  const onClipEnded = useCallback(() => {
    setActive((a) => (a + 1) % steps.length)
  }, [steps.length])

  return { steps, active, step, go, onClipEnded }
}

function HowItWorksMobile() {
  const { steps, active, step, go, onClipEnded } = useHowSteps()

  return (
    <section className="border-t border-line bg-white py-14">
      <div className="mx-auto max-w-lg px-4">
        <p className="text-center text-[12px] font-semibold tracking-[0.16em] text-mint-dark uppercase">
          How it works
        </p>

        {/* Phone first — primary content on a phone viewport. */}
        <div className="relative mt-8 flex min-h-[300px] items-center justify-center">
          <div
            className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(0,200,150,0.14)_0%,transparent_68%)]"
            aria-hidden
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              className="relative z-10 flex w-full justify-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={iosScreen}
            >
              <PhoneMockup
                screen={step.screen as PhoneScreen}
                floating
                frame
                media="video"
                size="md"
                onEnded={onClipEnded}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step chips — one row, clear tap targets. */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {steps.map((s, i) => {
            const on = i === active
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  on ? 'bg-ink text-white' : 'bg-canvas text-muted ring-1 ring-line'
                }`}
              >
                {s.step}
              </button>
            )
          })}
        </div>

        {/* Only the active step copy — no faded stack. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            className="mt-5 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={iosSoft}
          >
            <h3 className="font-display text-2xl font-bold tracking-tight text-ink">
              {step.title}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
              {step.body}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex gap-1.5">
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to ${s.step}`}
              onClick={() => go(i)}
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
  const { steps, active, step, go, onClipEnded } = useHowSteps()

  return (
    <section className="border-t border-line bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-5 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.16em] text-mint-dark uppercase">
            How it works
          </p>

          <div className="mt-6 space-y-5 lg:space-y-7">
            {steps.map((s, i) => {
              const on = i === active
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(i)}
                  className="block w-full text-left"
                >
                  <motion.div
                    animate={{
                      opacity: on ? 1 : 0.34,
                      x: on ? 0 : -8,
                    }}
                    transition={iosScreen}
                  >
                    <p className="text-[12px] font-semibold tracking-[0.14em] text-dim uppercase">
                      {s.step}
                    </p>
                    <h3
                      className={`mt-1.5 font-display text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl ${
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
                          initial={{ opacity: 0, y: 10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -6, height: 0 }}
                          transition={iosSoft}
                        >
                          {s.body}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                </button>
              )
            })}
          </div>

          <div className="mt-8 flex gap-1.5">
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to ${s.step}`}
                onClick={() => go(i)}
                className={`h-1.5 flex-1 rounded-full transition ${
                  i === active ? 'bg-mint' : 'bg-line'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[320px] items-center justify-center overflow-visible lg:min-h-[420px]">
          <div
            className="absolute inset-8 rounded-full bg-[radial-gradient(circle,rgba(0,200,150,0.14)_0%,transparent_68%)]"
            aria-hidden
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              className="relative z-10 flex w-full justify-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={iosScreen}
            >
              <PhoneMockup
                screen={step.screen as PhoneScreen}
                floating={false}
                frame
                media="video"
                size="lg"
                onEnded={onClipEnded}
                className="lg:max-w-[340px]"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
