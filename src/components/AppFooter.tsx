import { COMPANY, footerLinks } from '../lib/links'
import type { Lang } from '../i18n'

const YEAR = new Date().getFullYear()

const LABELS: Record<(typeof footerLinks)[number]['key'], { fr: string; en: string }> = {
  help: { fr: 'Aide', en: 'Help' },
  privacy: { fr: 'Confidentialité', en: 'Privacy' },
  data: { fr: 'Données personnelles (RGPD)', en: 'Personal data (GDPR)' },
  terms: { fr: 'Conditions d’utilisation', en: 'Terms of use' },
  legal: { fr: 'Mentions légales', en: 'Legal notice' },
  cookies: { fr: 'Cookies', en: 'Cookies' },
}

/** Pied de page : droits reserves et pages legales (meme structure que Sira). */
export function AppFooter({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  // compact : une seule ligne discrete, centree (pages de connexion), avec les liens essentiels
  const links = compact ? footerLinks.filter((l) => ['privacy', 'legal', 'cookies'].includes(l.key)) : footerLinks
  return (
    <footer className={`app-footer${compact ? ' compact' : ''}`}>
      <span className="copyright">
        © {YEAR}{' '}
        <a href={COMPANY.site} target="_blank" rel="noopener noreferrer">
          {COMPANY.name}
        </a>
        . {lang === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
      </span>
      <nav aria-label={lang === 'fr' ? 'Informations légales et aide' : 'Legal information and help'}>
        {links.map((l) => (
          <a key={l.key} href={l.href} target="_blank" rel="noopener noreferrer">
            {LABELS[l.key][lang]}
          </a>
        ))}
      </nav>
    </footer>
  )
}
