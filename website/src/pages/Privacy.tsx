import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PageShell, PageTitle, pageItem } from '../components/PageShell'
import { PRIVACY_EMAIL } from '../lib/constants'
import { iosSoft, iosViewport } from '../lib/ios'

const sections = [
  {
    title: 'What we collect',
    body: (
      <ul className="mt-2 list-disc space-y-2 pl-5">
        <li>
          Location coordinates when you check a place, search for a city, or use the map, used only
          to fetch air quality estimates for that point.
        </li>
        <li>
          App preferences such as theme, language, and notification settings, stored on your device.
        </li>
        <li>
          Anonymous usage events tied to a random device identifier, never sold to third parties.
        </li>
        <li>
          If you turn on alerts, a push token and the approximate area you want alerts for. You can
          turn alerts off at any time.
        </li>
      </ul>
    ),
  },
  {
    title: 'What we do not collect',
    body: (
      <ul className="mt-2 list-disc space-y-2 pl-5">
        <li>We do not require an account for basic use.</li>
        <li>We do not access contacts, photos, or messages.</li>
        <li>We do not track you across unrelated apps or websites.</li>
      </ul>
    ),
  },
  {
    title: 'How we use data',
    body: (
      <p className="mt-2">
        Predictions are computed on our servers using satellite and weather inputs. Coordinates are
        sent over HTTPS solely to return estimates, uncertainty ranges, and health guidance. Server
        logs are kept for up to 30 days for security and reliability, then aggregated or deleted.
      </p>
    ),
  },
  {
    title: 'Your choices',
    body: (
      <ul className="mt-2 list-disc space-y-2 pl-5">
        <li>Deny location permission and use city search instead.</li>
        <li>Enable Privacy mode in Settings to limit personal detail in on-screen labels.</li>
        <li>Clear app data from your device settings at any time.</li>
      </ul>
    ),
  },
  {
    title: 'Children',
    body: (
      <p className="mt-2">
        Mframapa is intended for general audiences. We do not knowingly collect personal information
        from children under 13.
      </p>
    ),
  },
  {
    title: 'Contact',
    body: (
      <p className="mt-2">
        Questions about privacy:{' '}
        <a
          className="font-medium text-mint-dark hover:underline"
          href={`mailto:${PRIVACY_EMAIL}`}
        >
          {PRIVACY_EMAIL}
        </a>
      </p>
    ),
  },
]

export function Privacy() {
  return (
    <PageShell narrow>
      <PageTitle title="Privacy Policy" sub="Mframapa, last updated 2026-07-24" />

      <motion.p variants={pageItem} className="mt-8 text-[15px] leading-relaxed text-muted">
        Mframapa AI respects your privacy. This policy explains what we collect, why we collect it,
        and how you can control your data.
      </motion.p>

      <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-muted">
        {sections.map((s) => (
          <motion.section
            key={s.title}
            initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={iosViewport}
            transition={iosSoft}
          >
            <h2 className="font-display text-lg font-bold text-ink">{s.title}</h2>
            {s.body}
          </motion.section>
        ))}
      </div>

      <motion.p
        variants={pageItem}
        className="mt-12 border-t border-line pt-6 text-sm text-muted"
      >
        <Link to="/terms" className="hover:text-ink">
          Terms
        </Link>
        <span className="mx-2 text-dim">/</span>
        <Link to="/" className="hover:text-ink">
          Home
        </Link>
      </motion.p>
    </PageShell>
  )
}
