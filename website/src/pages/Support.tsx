import { motion } from 'framer-motion'
import { CircleHelp, Info } from 'lucide-react'
import { PageShell, PageTitle, pageItem } from '../components/PageShell'
import { CityMarquee } from '../sections/CityMarquee'
import { CONTACT_EMAIL } from '../lib/constants'
import { copy } from '../content/copy'
import { iosSoft } from '../lib/ios'

const icons = [CircleHelp, Info]

export function Support() {
  return (
    <>
      <PageShell>
        <PageTitle
          label={copy.support.label}
          title={copy.support.title}
          sub={copy.support.sub}
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {copy.support.cards.map(({ title, body, cta }, i) => {
            const Icon = icons[i]!
            const subject = encodeURIComponent(title)
            return (
              <motion.a
                key={title}
                href={`mailto:${CONTACT_EMAIL}?subject=${subject}`}
                variants={pageItem}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={iosSoft}
                className="rounded-3xl border border-line bg-white/90 p-8 no-underline shadow-sm backdrop-blur-sm"
              >
                <motion.div
                  className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-mint/15 text-mint-dark"
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 2.8 + i * 0.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Icon size={20} />
                </motion.div>
                <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
                <p className="mt-2 text-muted">{body}</p>
                <p className="mt-8 text-sm font-semibold text-ink">{cta}</p>
              </motion.a>
            )
          })}
        </div>
      </PageShell>
      <CityMarquee />
    </>
  )
}
