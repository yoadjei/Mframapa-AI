import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PageShell, PageTitle, pageItem } from '../components/PageShell'
import { CityMarquee } from '../sections/CityMarquee'
import { APP_URL } from '../lib/constants'
import { copy } from '../content/copy'
import { iosSoft } from '../lib/ios'

export function About() {
  return (
    <>
      <PageShell>
        <PageTitle label={copy.about.label} title={copy.about.title} />

        <motion.div className="mt-12 grid gap-10 md:grid-cols-2">
          <motion.div
            variants={pageItem}
            className="space-y-5 text-base leading-relaxed text-muted"
          >
            {copy.about.left.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </motion.div>
          <motion.div
            variants={pageItem}
            className="space-y-5 text-base leading-relaxed text-muted"
          >
            {copy.about.right.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <Link
              to="/support"
              className="inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              {copy.about.cta}
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={pageItem}
          whileHover={{ y: -4 }}
          transition={iosSoft}
          className="mt-16 rounded-3xl border border-line bg-white/90 p-8 shadow-sm backdrop-blur-sm"
        >
          <p className="font-display text-xl font-bold text-ink">{copy.about.tryTitle}</p>
          <p className="mt-2 max-w-xl text-sm text-muted">{copy.about.tryBody}</p>
          <a
            href={APP_URL}
            className="mt-5 inline-flex text-sm font-semibold text-mint-dark hover:underline"
          >
            {copy.about.tryLink}
          </a>
        </motion.div>
      </PageShell>
      <CityMarquee />
    </>
  )
}
