/**
 * Capture Alerts notification-settings sheet from the PWA (local or live).
 * Seeds localStorage so splash/onboarding is skipped.
 */
import { chromium } from 'playwright'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'mockups', 'alerts-light.png')
const url = process.env.PWA_URL || 'http://127.0.0.1:5173'

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: 'light',
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})

await context.addInitScript(() => {
  localStorage.setItem(
    'mframapa:v2:pwa-state',
    JSON.stringify({
      onboardingComplete: true,
      onboardingPhase: 'done',
      preferences: {
        theme: 'light',
        language: 'en',
        notificationsEnabled: true,
        textScale: 1,
        liteMode: false,
        dataAnalytics: true,
        locationSharing: 'off',
      },
      ui: { activeScreen: 'notifications', screenStack: [] },
      profile: {},
      homeSummary: { city: 'Accra', lat: 5.6037, lon: -0.187 },
      savedCities: [],
      notifications: [],
    }),
  )
})

const page = await context.newPage()
console.log('opening', url)
await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 })
await page.waitForTimeout(2000)

const title = await page.title()
const bodyText = await page.locator('body').innerText().catch(() => '')
console.log('title:', title)
console.log('snippet:', bodyText.slice(0, 120).replace(/\s+/g, ' '))

// Tap Alerts in tab bar if needed
for (const label of ['Alerts', 'Notifications']) {
  const tab = page.getByText(label, { exact: true }).first()
  if (await tab.isVisible().catch(() => false)) {
    await tab.click()
    await page.waitForTimeout(800)
    break
  }
}

// Open settings gear
const gear = page.locator('button[aria-label*="settings" i], button[aria-label*="Notification" i]').first()
if (await gear.isVisible().catch(() => false)) {
  await gear.click()
  await page.waitForTimeout(1000)
}

// Must see the sheet master toggle label
const marker = page.getByText(/All notifications|Air quality alerts|notif_prefs/i).first()
await marker.waitFor({ state: 'visible', timeout: 15000 })

await page.screenshot({ path: out, fullPage: false })
console.log('wrote', out)
await browser.close()
