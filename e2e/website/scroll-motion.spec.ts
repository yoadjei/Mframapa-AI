import { test, expect } from '@playwright/test'
import {
  assertDocumentScrollAdvances,
  measureScrollWhileAnimating,
} from '../helpers/scrollMetrics'

test.describe('marketing site — scroll + motion', () => {
  test('Lenis is active and wheel scroll advances continuously', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.waitForFunction(() => document.documentElement.classList.contains('lenis'), null, {
      timeout: 10_000,
    })

    // Mobile emulation often ignores mouse.wheel; drive Lenis via WheelEvent + settle.
    let prev = await page.evaluate(() => window.scrollY)
    for (let i = 0; i < 5; i++) {
      if (testInfo.project.name.includes('mobile')) {
        await page.evaluate(() => {
          window.dispatchEvent(
            new WheelEvent('wheel', { deltaY: 900, bubbles: true, cancelable: true }),
          )
        })
      } else {
        await page.mouse.wheel(0, 900)
      }
      await page.waitForFunction((p) => window.scrollY > p + 30, prev, { timeout: 4000 })
      prev = await page.evaluate(() => window.scrollY)
    }
    expect(prev).toBeGreaterThan(200)
  })

  test('scroll stays smooth while hero/decorative motion runs', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // Force full motion so CSS loops are active even if OS reduce is on in CI.
    await page.evaluate(() => localStorage.setItem('mframapa:motion', 'full'))
    await page.reload()
    await page.waitForFunction(() => document.documentElement.classList.contains('lenis'))

    const metrics = await measureScrollWhileAnimating(page, {
      durationMs: 1000,
      maxMedianFrameMs: 55,
    })
    expect(metrics.scrollAdvanced, JSON.stringify(metrics)).toBe(true)
    expect(metrics.frames, JSON.stringify(metrics)).toBeGreaterThanOrEqual(20)
    expect(metrics.medianFrameMs, JSON.stringify(metrics)).toBeLessThanOrEqual(55)
  })

  test('how-it-works sticky scrub does not lock the page', async ({ page }) => {
    await page.goto('/')
    const how = page.getByText(/how it works|step 1|open a city/i).first()
    await how.scrollIntoViewIfNeeded().catch(() => undefined)
    const before = await page.evaluate(() => window.scrollY)
    for (let i = 0; i < 18; i++) {
      await page.mouse.wheel(0, 700)
    }
    await page.waitForFunction((b) => window.scrollY > b + 1200, before, { timeout: 8000 })
    const after = await page.evaluate(() => window.scrollY)
    expect(after).toBeGreaterThan(before + 1200)
  })

  test('hero glow or canvas is present without trapping pointer scroll', async ({ page }) => {
    await page.goto('/')
    const hero = page.locator('[data-testid="hero-glow"], [data-testid="hero-canvas"]').first()
    // Mobile = glow, desktop = canvas (may take a moment to lazy-load).
    await expect(hero).toBeAttached({ timeout: 15_000 })
    const pe = await hero.evaluate((el) => getComputedStyle(el).pointerEvents)
    expect(pe).toBe('none')
    await assertDocumentScrollAdvances(page, 3, 600)
  })
})
