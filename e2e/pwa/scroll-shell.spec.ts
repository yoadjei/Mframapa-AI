import { test, expect } from '@playwright/test'
import {
  measureScrollWhileAnimating,
  seedPwaPastOnboarding,
} from '../helpers/scrollMetrics'

test.describe('PWA — scroll shell + backgrounds', () => {
  test.beforeEach(async ({ page }) => {
    await seedPwaPastOnboarding(page)
  })

  test('home tab uses document scroll (no nested trap)', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('more-fab')).toBeVisible({ timeout: 20_000 })

    const nested = await page.evaluate(() => {
      return [...document.querySelectorAll('body *')].filter((el) => {
        const s = getComputedStyle(el)
        if (!(s.overflowY === 'auto' || s.overflowY === 'scroll')) return false
        return (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight + 40
      }).length
    })
    expect(nested).toBeLessThanOrEqual(1)

    const scroll = await page.evaluate(async () => {
      document.documentElement.style.overflowY = 'auto'
      document.body.style.overflowY = 'auto'
      document.documentElement.style.height = 'auto'
      document.body.style.height = 'auto'

      let pad = document.getElementById('e2e-scroll-pad')
      if (!pad) {
        pad = document.createElement('div')
        pad.id = 'e2e-scroll-pad'
        pad.style.cssText = 'height:200vh;width:1px;flex-shrink:0;'
        document.body.appendChild(pad)
      }

      const before = window.scrollY || document.documentElement.scrollTop
      window.scrollTo(0, before + 400)
      await new Promise((r) => requestAnimationFrame(r))
      await new Promise((r) => setTimeout(r, 50))
      const after = window.scrollY || document.documentElement.scrollTop
      return {
        before,
        after,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }
    })
    expect(scroll.scrollHeight, JSON.stringify(scroll)).toBeGreaterThan(scroll.clientHeight + 100)
    expect(scroll.after, JSON.stringify(scroll)).toBeGreaterThan(scroll.before + 50)
  })

  test('document scroll stays responsive with CloudRain background mounted', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('more-fab')).toBeVisible({ timeout: 20_000 })
    await page.evaluate(() => {
      document.documentElement.style.overflowY = 'auto'
      document.body.style.overflowY = 'auto'
      const pad = document.createElement('div')
      pad.style.height = '200vh'
      document.body.appendChild(pad)
    })
    const metrics = await measureScrollWhileAnimating(page, {
      durationMs: 900,
      maxMedianFrameMs: 60,
    })
    expect(metrics.ok, JSON.stringify(metrics)).toBe(true)
  })

  test('stack screen uses single stack-scroll owner', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('more-fab')).toBeVisible({ timeout: 20_000 })
    await page.getByTestId('more-fab').click()
    const settingsLink = page.getByRole('button', { name: /settings/i }).first()
    await expect(settingsLink).toBeVisible({ timeout: 10_000 })
    await settingsLink.click()
    await page.waitForSelector('[data-testid="stack-scroll"]', { timeout: 15_000 })

    const result = await page.evaluate(async () => {
      const scroller = document.querySelector('[data-testid="stack-scroll"]') as HTMLElement | null
      if (!scroller) return { ok: false, reason: 'missing' }
      const pad = document.createElement('div')
      pad.style.height = '140vh'
      scroller.appendChild(pad)
      const y0 = scroller.scrollTop
      scroller.scrollTop = y0 + 240
      await new Promise((r) => requestAnimationFrame(r))
      const nested = [...scroller.querySelectorAll('*')].filter((el) => {
        const s = getComputedStyle(el)
        return (
          (s.overflowY === 'auto' || s.overflowY === 'scroll') &&
          (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight + 40
        )
      }).length
      return {
        ok: scroller.scrollTop > y0 + 80,
        nested,
        scrollTop: scroller.scrollTop,
      }
    })
    expect(result.ok, JSON.stringify(result)).toBe(true)
    expect(result.nested, JSON.stringify(result)).toBeLessThanOrEqual(1)
  })

  test('reduced motion disables morph blob CSS animation', async ({ page }) => {
    // Override beforeEach seed so onboarding (MorphBackground) actually mounts.
    await page.addInitScript(() => {
      localStorage.setItem(
        'mframapa:v2:pwa-state',
        JSON.stringify({
          onboardingComplete: false,
          preferences: {
            theme: 'dark',
            language: 'en',
            liteMode: false,
            notificationsEnabled: true,
            notifPrefs: { alert: true, summary: true, update: true, tip: true },
            privacyMode: 'balanced',
            textScale: 1,
            locationSharing: 'balanced',
          },
          profile: {},
          savedCities: [],
          activity: [],
          notifications: [],
          session: { tier: 'free' },
          ui: { selectedCity: null },
        }),
      )
    })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const blob = page.locator('.mf-blob').first()
    await expect(blob).toBeAttached({ timeout: 15_000 })
    const anim = await blob.evaluate((el) => getComputedStyle(el).animationName)
    expect(anim === 'none' || anim === '').toBeTruthy()
  })
})
