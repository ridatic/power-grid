import { useCallback, useEffect, useReducer } from 'react'
import type { Config, GridItem, PageData, Project } from './core/types'
import { newId } from './core/grid'
import { TEMPLATES, templateItems } from './core/layouts'
import { PALETTES } from './core/palettes'

const KEY = 'power-grid.project.v4'
const LIMIT = 100
export const MAX_PAGES = 8

export const DEFAULT_CONFIG: Config = {
  width: 1440,
  height: 900,
  mode: 'light',
  margin: 22,
  pageBg: 'soft',
  density: 'comfortable',
  hide: [],
  paletteId: PALETTES[0].id,
  colors: PALETTES[0].colors,
  navFrame: 'sidebar',
  navTone: 'navy',
  navInk: 'auto',
  navFill: 'gradient',
  navActive: 'accent',
  navPos: 'top',
  tabCorner: 'md',
  filterSlots: 3,
  navLabels: 'fixed',
  navIcons: true,
  navDecor: true,
  navUser: true,
  userName: 'Noureddine Rida',
  userRole: 'Analyste BI',
  headerBand: false,
  title: 'Tableau de bord des ventes',
  company: 'Sales Dashboard',
  subtitle: 'Performances, tendances et opportunités',
  footer: '',
  linkedin: '',
  website: '',
  showHeader: true,
  font: 'Segoe UI',
  textSize: 12,
  titleSize: 22,
  cardSize: 12,
  iconStyle: 'outline',
  iconWeight: 'regular',
  iconBacking: 'none',
  logoKind: 'bolt',
  logoIcon: 'chart',
  logoImage: null,
  cardStyle: 'plain',
  cardColor: 'paper',
  radius: 10,
  shadow: true,
  texture: 'none',
  labelZones: false,
  menu: {
    style: 'story',
    image: null,
    blur: 'none',
    darken: 'medium',
    fit: 'fill',
    side: 'left',
    useOn: 'menu',
    labels: 'baked',
    labelColor: 'auto',
  },
  extraTheme: null,
  extraThemeName: '',
}

const makePage = (name: string, kind: PageData['kind'], items: GridItem[] = [], rows?: number[]): PageData => ({ id: newId('page'), name, kind, icon: null, items, ...(rows ? { rows } : {}) })

function initialProject(): Project {
  const tpl = TEMPLATES[0]
  const names = ['Accueil', 'Ventes', 'Clients', 'Produits', 'Régions', 'Rapports']
  return { cfg: DEFAULT_CONFIG, pages: names.map((n) => makePage(n, 'content', templateItems(tpl), tpl.rows)), active: 0 }
}

function load(): Project {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Project
      if (p?.cfg && Array.isArray(p.pages) && p.pages.length) {
        return { cfg: { ...DEFAULT_CONFIG, ...p.cfg, menu: { ...DEFAULT_CONFIG.menu, ...p.cfg.menu } }, pages: p.pages, active: Math.min(p.active ?? 0, p.pages.length - 1) }
      }
    }
  } catch {
    /* stockage indisponible : on repart d'un projet neuf */
  }
  return initialProject()
}

export type Action =
  | { t: 'cfg'; patch: Partial<Config> }
  | { t: 'add'; item: GridItem }
  | { t: 'update'; id: string; patch: Partial<GridItem> }
  | { t: 'remove'; id: string }
  | { t: 'template'; items: GridItem[]; rows?: number[] }
  | { t: 'clear' }
  | { t: 'addPage'; kind?: PageData['kind'] }
  | { t: 'pagePatch'; index: number; patch: Partial<Pick<PageData, 'name' | 'kind' | 'icon'>> }
  | { t: 'removePage'; index: number }
  | { t: 'setPage'; index: number }
  | { t: 'copyToAll' }
  | { t: 'undo' }
  | { t: 'redo' }
  | { t: 'reset' }

interface State {
  past: Project[]
  present: Project
  future: Project[]
}

const withItems = (p: Project, fn: (items: GridItem[]) => GridItem[]): Project => ({
  ...p,
  pages: p.pages.map((pg, i) => (i === p.active ? { ...pg, items: fn(pg.items) } : pg)),
})

function apply(p: Project, a: Action): Project {
  switch (a.t) {
    case 'cfg':
      return { ...p, cfg: { ...p.cfg, ...a.patch } }
    case 'add':
      return withItems(p, (items) => [...items, a.item])
    case 'update':
      return withItems(p, (items) => items.map((i) => (i.id === a.id ? { ...i, ...a.patch } : i)))
    case 'remove':
      return withItems(p, (items) => items.filter((i) => i.id !== a.id))
    case 'template':
      return { ...p, pages: p.pages.map((pg, i) => (i === p.active ? { ...pg, items: a.items, rows: a.rows } : pg)) }
    case 'clear':
      return withItems(p, () => [])
    case 'addPage': {
      if (p.pages.length >= MAX_PAGES) return p
      const kind = a.kind ?? 'content'
      const name = kind === 'menu' ? 'Menu' : `Page ${p.pages.filter((x) => x.kind === 'content').length + 1}`
      const pg = makePage(name, kind)
      // le menu principal passe en premier
      const pages = kind === 'menu' ? [pg, ...p.pages] : [...p.pages, pg]
      return { ...p, pages, active: kind === 'menu' ? 0 : pages.length - 1 }
    }
    case 'pagePatch':
      return { ...p, pages: p.pages.map((pg, i) => (i === a.index ? { ...pg, ...a.patch } : pg)) }
    case 'removePage': {
      if (p.pages.length <= 1) return p
      const pages = p.pages.filter((_, i) => i !== a.index)
      return { ...p, pages, active: Math.min(p.active > a.index ? p.active - 1 : p.active, pages.length - 1) }
    }
    case 'setPage':
      return { ...p, active: Math.min(Math.max(0, a.index), p.pages.length - 1) }
    case 'copyToAll': {
      const src = p.pages[p.active]
      return { ...p, pages: p.pages.map((pg) => (pg.kind === 'content' && pg.id !== src.id ? { ...pg, rows: src.rows, items: src.items.map((i) => ({ ...i, id: newId(i.type) })) } : pg)) }
    }
    default:
      return p
  }
}

function reducer(s: State, a: Action): State {
  if (a.t === 'undo') {
    const prev = s.past[s.past.length - 1]
    return prev ? { past: s.past.slice(0, -1), present: prev, future: [s.present, ...s.future] } : s
  }
  if (a.t === 'redo') {
    const next = s.future[0]
    return next ? { past: [...s.past, s.present], present: next, future: s.future.slice(1) } : s
  }
  if (a.t === 'reset') return { past: [...s.past, s.present].slice(-LIMIT), present: initialProject(), future: [] }
  const present = apply(s.present, a)
  if (present === s.present) return s
  if (a.t === 'setPage') return { ...s, present }
  return { past: [...s.past, s.present].slice(-LIMIT), present, future: [] }
}

export function useProject() {
  const [s, dispatch] = useReducer(reducer, undefined, () => ({ past: [], present: load(), future: [] }))

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s.present))
    } catch {
      /* quota ou mode prive : la sauvegarde automatique est simplement ignoree */
    }
  }, [s.present])

  const undo = useCallback(() => dispatch({ t: 'undo' }), [])
  const redo = useCallback(() => dispatch({ t: 'redo' }), [])
  return { project: s.present, dispatch, undo, redo, canUndo: s.past.length > 0, canRedo: s.future.length > 0 }
}
