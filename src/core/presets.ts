import type { Config, PageData, Project } from './types'
import { newId } from './grid'
import { PALETTES } from './palettes'
import { TEMPLATES, templateItems } from './layouts'
import { DEFAULT_CONFIG } from '../store'

export interface Preset {
  id: string
  name: { fr: string; en: string }
  desc: { fr: string; en: string }
  build: () => Project
}

const palette = (id: string) => {
  const p = PALETTES.find((x) => x.id === id) ?? PALETTES[0]
  return { paletteId: p.id, colors: p.colors }
}

const pagesOf = (names: string[], templateId: string): PageData[] => {
  const tpl = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0]
  return names.map((name) => ({ id: newId('page'), name, kind: 'content', icon: null, items: templateItems(tpl), ...(tpl.rows ? { rows: tpl.rows } : {}) }))
}

const make = (cfg: Partial<Config>, pages: PageData[]): Project => ({ cfg: { ...DEFAULT_CONFIG, ...cfg, menu: { ...DEFAULT_CONFIG.menu, ...cfg.menu } }, pages, active: 0 })

/** Un modele vierge : le theme par defaut et une page libre. */
export const blankProject = (o: { size?: string; paletteId?: string; font?: string } = {}): Project => {
  const [width, height] = (o.size ?? '1440x900').split('x').map(Number)
  return make({ title: 'Mon rapport', subtitle: '', company: 'Mon entreprise', width, height, ...(o.paletteId ? palette(o.paletteId) : {}), ...(o.font ? { font: o.font } : {}) }, pagesOf(['Page 1'], 'free'))
}

/** Modeles prets a l'emploi : un point de depart complet (theme, navigation, pages). */
export const PRESETS: Preset[] = [
  {
    id: 'ember',
    name: { fr: 'Tableau de bord des ventes', en: 'Sales dashboard' },
    desc: { fr: 'Barre latérale marine, KPI, courbe, anneau, tableau', en: 'Navy sidebar, KPIs, line, donut, table' },
    build: () => make({}, pagesOf(['Accueil', 'Ventes', 'Clients', 'Produits', 'Régions', 'Rapports'], 'sales')),
  },
  {
    id: 'sun',
    name: { fr: 'Ventes, version dorée', en: 'Sales, gold edition' },
    desc: { fr: 'La maquette d\'origine, aux couleurs solaires', en: 'The original mockup, in sunny colors' },
    build: () => make({ ...palette('sun') }, pagesOf(['Accueil', 'Ventes', 'Clients', 'Produits'], 'sales')),
  },
  {
    id: 'finance',
    name: { fr: 'Pilotage financier', en: 'Financial steering' },
    desc: { fr: 'Onglets en haut, ton marine, vue exécutive', en: 'Top tabs, navy tone, executive view' },
    build: () => make({ ...palette('navy'), navFrame: 'tabs', navTone: 'brand', navFill: 'solid', title: 'Pilotage *financier*', subtitle: 'Revenus, charges et trésorerie', company: 'Finance' }, pagesOf(['Synthèse', 'Revenus', 'Charges', 'Trésorerie'], 'executive')),
  },
  {
    id: 'ops',
    name: { fr: 'Opérations, mode sombre', en: 'Operations, dark mode' },
    desc: { fr: 'Rail d\'icônes, fond sombre, filtres en tête', en: 'Icon rail, dark background, filters on top' },
    build: () => make({ ...palette('cyber'), mode: 'dark', navFrame: 'rail', navTone: 'brand', title: 'Suivi des *opérations*', subtitle: 'Production, délais et qualité', company: 'Opérations' }, pagesOf(['Vue d\'ensemble', 'Production', 'Qualité'], 'analyst')),
  },
  {
    id: 'geo',
    name: { fr: 'Ventes par région', en: 'Sales by region' },
    desc: { fr: 'Panneau de filtres, grande carte', en: 'Filter panel, large map' },
    build: () => make({ ...palette('ocean'), navFrame: 'filter', navTone: 'tint', filterSlots: 3, title: 'Ventes par *région*', subtitle: 'Répartition géographique', company: 'Commercial' }, pagesOf(['Carte', 'Pays', 'Villes'], 'geo')),
  },
  {
    id: 'minimal',
    name: { fr: 'Minimaliste', en: 'Minimalist' },
    desc: { fr: 'Capsule flottante, fond blanc, un grand graphique', en: 'Floating capsule, white background, one large chart' },
    build: () => make({ ...palette('mono'), navFrame: 'capsule', navTone: 'paper', pageBg: 'plain', shadow: false, radius: 4, title: 'Indicateur *clé*', subtitle: '', company: 'Direction' }, pagesOf(['Résumé', 'Détail'], 'focus')),
  },
  {
    id: 'menu',
    name: { fr: 'Rapport avec menu d\'accueil', en: 'Report with a home menu' },
    desc: { fr: 'Page de couverture, puis trois pages', en: 'Cover page, then three pages' },
    build: () => {
      const pages = pagesOf(['Ventes', 'Clients', 'Produits'], 'trio')
      const menu: PageData = { id: newId('page'), name: 'Accueil', kind: 'menu', icon: null, items: [] }
      return make({ ...palette('violet'), title: 'Rapport *annuel*', subtitle: 'Choisissez une page pour commencer', menu: { ...DEFAULT_CONFIG.menu, style: 'tiles' } }, [menu, ...pages])
    },
  },
]
