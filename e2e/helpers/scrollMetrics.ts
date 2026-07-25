import type { Page } from '@playwright/test'

/** Advance document scroll via scrollBy (works on mobile emulation where wheel is flaky). */
export async function assertDocumentScrollAdvances(page: Page, steps = 6, delta = 500) {
  let prev = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop)
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => {
      window.scrollBy(0, d)
      document.documentElement.scrollTop += d
      document.body.scrollTop += d
    }, delta)
    await page.waitForFunction(
      (p) => (window.scrollY || document.documentElement.scrollTop) > p + 20,
      prev,
      { timeout: 2500 },
    )
    prev = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop)
  }
  return prev
}

/**
 * While scrolling, sample rAF frame gaps. Fail if median gap > maxMs
 * (animation / compositor stalled) or if scrollY freezes.
 */
export async function measureScrollWhileAnimating(
  page: Page,
  opts: { durationMs?: number; maxMedianFrameMs?: number } = {},
) {
  const durationMs = opts.durationMs ?? 900
  const maxMedianFrameMs = opts.maxMedianFrameMs ?? 48

  return page.evaluate(
    async ({ durationMs, maxMedianFrameMs }) => {
      const gaps: number[] = []
      const scrolls: number[] = []
      let last = performance.now()
      const t0 = last
      let frames = 0

      await new Promise<void>((resolve) => {
        const tick = (now: number) => {
          gaps.push(now - last)
          last = now
          frames += 1
          window.scrollBy(0, 18)
          scrolls.push(window.scrollY || document.documentElement.scrollTop)
          if (now - t0 < durationMs) {
            requestAnimationFrame(tick)
          } else {
            resolve()
          }
        }
        requestAnimationFrame(tick)
      })

      const sorted = [...gaps].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)] ?? 999
      const scrollAdvanced = (scrolls.at(-1) ?? 0) - (scrolls[0] ?? 0) > 80

      return {
        frames,
        medianFrameMs: median,
        scrollAdvanced,
        scrollDelta: (scrolls.at(-1) ?? 0) - (scrolls[0] ?? 0),
        ok: frames >= 20 && median <= maxMedianFrameMs && scrollAdvanced,
      }
    },
    { durationMs, maxMedianFrameMs },
  )
}

export async function seedPwaPastOnboarding(page: Page) {
  await page.addInitScript(() => {
    const state = {
      onboardingComplete: true,
      onboardingPhase: 'done',
      profile: { fullName: '', email: '', organization: '', avatar: null },
      preferences: {
        theme: 'dark',
        language: 'en',
        notificationsEnabled: true,
        notifPrefs: { alert: true, summary: true, update: true, tip: true },
        privacyMode: 'balanced',
        liteMode: false,
        textScale: 1,
        locationSharing: 'balanced',
      },
      savedCities: [],
      homeSummary: {
        city: null,
        aqiCategory: 'Unknown',
        pm25: null,
        lastUpdated: null,
        degraded: false,
      },
      activity: [],
      notifications: [],
      session: { tier: 'free' },
      ui: { selectedCity: null },
    }
    localStorage.setItem('mframapa:v2:pwa-state', JSON.stringify(state))
    localStorage.setItem('mframapa:push-prompt-seen', '1')
    localStorage.setItem('mframapa:install-dismissed-at', String(Date.now()))
  })
}
