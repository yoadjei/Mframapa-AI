import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PageShell, PageTitle, pageItem } from '../components/PageShell'
import { iosSoft, iosViewport } from '../lib/ios'

const sections = [
  {
    title: 'Service description',
    body: (
      <p className="mt-2">
        Mframapa provides estimated PM2.5 and air quality categories for locations across Africa,
        derived from satellite data and machine learning models. Estimates are informational, not
        certified measurements for medical, legal, or regulatory decisions.
      </p>
    ),
  },
  {
    title: 'Acceptable use',
    body: (
      <ul className="mt-2 list-disc space-y-2 pl-5">
        <li>Use the app for personal, educational, research, or advocacy purposes.</li>
        <li>Do not scrape, reverse engineer, or overload our APIs.</li>
        <li>Do not misrepresent estimates as ground-truth monitor readings.</li>
      </ul>
    ),
  },
  {
    title: 'Accuracy and limitations',
    body: (
      <p className="mt-2">
        Cloud cover, sparse calibration stations, and model uncertainty can affect results. We may
        change models or coverage without notice.
      </p>
    ),
  },
  {
    title: 'Availability',
    body: (
      <p className="mt-2">
        We strive for high uptime but do not guarantee uninterrupted service. Features may differ
        between mobile and web versions.
      </p>
    ),
  },
  {
    title: 'Liability',
    body: (
      <p className="mt-2">
        To the fullest extent permitted by law, Mframapa and its contributors are not liable for
        health or financial decisions made based on app outputs.
      </p>
    ),
  },
  {
    title: 'Changes',
    body: (
      <p className="mt-2">
        We may update these terms. Continued use after updates constitutes acceptance.
      </p>
    ),
  },
]

export function Terms() {
  return (
    <PageShell narrow>
      <PageTitle title="Terms of Service" sub="Mframapa, last updated 2026-07-24" />

      <motion.p variants={pageItem} className="mt-8 text-[15px] leading-relaxed text-muted">
        By using Mframapa AI you agree to these terms. If you do not agree, please stop using the
        service.
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
        <Link to="/privacy" className="hover:text-ink">
          Privacy
        </Link>
        <span className="mx-2 text-dim">/</span>
        <Link to="/" className="hover:text-ink">
          Home
        </Link>
      </motion.p>
    </PageShell>
  )
}
