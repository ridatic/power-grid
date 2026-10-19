/** Liens du pied de page. Les pages legales sont publiees par le projet « Privacy-Policies » (GitHub Pages, dossier power-grid/), comme pour Sira. */
export const COMPANY = { name: 'RIDATIC', site: 'https://ridatic.com' }

const LEGAL_BASE = 'https://ridatic.github.io/privacy-policies/power-grid'

export const footerLinks = [
  { key: 'help', href: `${LEGAL_BASE}/aide/` },
  { key: 'privacy', href: `${LEGAL_BASE}/confidentialite/` },
  { key: 'data', href: `${LEGAL_BASE}/donnees/` },
  { key: 'terms', href: `${LEGAL_BASE}/conditions/` },
  { key: 'legal', href: `${LEGAL_BASE}/mentions-legales/` },
  { key: 'cookies', href: `${LEGAL_BASE}/cookies/` },
] as const
