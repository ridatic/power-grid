import type { Colors, Config } from './types'
import { darken, lighten, mix, readableOn } from './color'

export function resolveColors(cfg: Config): Colors {
  const dark = cfg.mode === 'dark'
  return {
    bg: dark ? '#0F1420' : cfg.pageBg === 'plain' ? '#FFFFFF' : cfg.pageBg === 'warm' ? '#FBF6EC' : '#F3F5F8',
    card: dark ? '#1A2132' : '#FFFFFF',
    border: dark ? '#2A3350' : '#E9EDF5',
    text: dark ? '#F1F5F9' : '#1B2330',
    muted: dark ? '#94A3B8' : '#64748B',
    accent: cfg.colors[0],
    data: cfg.colors,
  }
}

export interface Surface {
  bg: string
  bg2: string // seconde couleur du degrade
  ink: string // texte et icones
  activeInk: string
  onBg: string // lisible sur bg
}

/** Couleurs de la navigation selon le ton, l'encre et le remplissage choisis. */
export function navSurface(cfg: Config): Surface {
  const c = resolveColors(cfg)
  const dark = cfg.mode === 'dark'
  const accent = c.accent
  const bg =
    cfg.navTone === 'navy' ? (dark ? '#0F1A2E' : '#172740')
    : cfg.navTone === 'brand' ? darken(accent, dark ? 0.62 : 0.5)
    : cfg.navTone === 'color' ? accent
    : cfg.navTone === 'tint' ? mix(c.card, accent, dark ? 0.22 : 0.12)
    : c.card
  // le degrade glisse vers la couleur principale (ou la deuxieme couleur), pour qu'on le voie vraiment
  const bg2 = cfg.navFill !== 'gradient' ? bg : cfg.navTone === 'navy' || cfg.navTone === 'brand' ? mix(bg, accent, 0.45) : mix(bg, cfg.colors[1], 0.55)
  const base = readableOn(bg)
  const ink =
    cfg.navInk === 'auto' ? base
    : cfg.navInk === 'mono' ? mix(base, bg, 0.38)
    : readableOn(bg) === '#FFFFFF' ? lighten(accent, 0.55) : darken(accent, 0.15)
  return { bg, bg2, ink, activeInk: ink, onBg: base }
}

/** Fond d'une carte selon la couleur de carte choisie. */
export function cardFill(cfg: Config): string {
  const c = resolveColors(cfg)
  const dark = cfg.mode === 'dark'
  if (cfg.cardColor === 'tint') return mix(c.card, c.accent, dark ? 0.18 : 0.1)
  if (cfg.cardColor === 'color') return mix(c.card, c.accent, dark ? 0.42 : 0.24)
  if (cfg.cardColor === 'nav') return navSurface(cfg).bg
  return c.card
}
