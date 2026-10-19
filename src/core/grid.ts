import type { Config, GridItem, Rect } from './types'

import { navInsets, px } from './nav'

export const COLS = 12
export const ROWS = 8
export const GAP_BY_DENSITY = { comfortable: 16, balanced: 12, dense: 8 }
export const gapOf = (cfg: Config) => GAP_BY_DENSITY[cfg.density]
export const isHidden = (cfg: Config, it: Pick<GridItem, 'type'>) => cfg.hide.includes(it.type)

export const hasFooter = (cfg: Config) => !!(cfg.footer || cfg.linkedin || cfg.website)

/** Zone de la page occupee par la grille (hors navigation, marges et pied de page). */
export function gridRect(cfg: Config): Rect {
  const ins = navInsets(cfg)
  const bottom = hasFooter(cfg) ? px(cfg, 34) : 0
  return {
    x: ins.left + cfg.margin,
    y: ins.top + cfg.margin,
    w: cfg.width - ins.left - 2 * cfg.margin,
    h: cfg.height - ins.top - 2 * cfg.margin - bottom,
  }
}

export const colWidth = (cfg: Config) => (gridRect(cfg).w - gapOf(cfg) * (COLS - 1)) / COLS

/** Hauteur de chacune des 8 lignes, d'apres les poids de la page (egaux par defaut). */
export function rowHeights(cfg: Config, weights?: number[]): number[] {
  const w = weights && weights.length === ROWS ? weights : Array<number>(ROWS).fill(1)
  const total = w.reduce((a, b) => a + b, 0)
  const free = gridRect(cfg).h - gapOf(cfg) * (ROWS - 1)
  return w.map((x) => (free * x) / total)
}

/** Position verticale du haut de chaque ligne. */
export function rowTops(cfg: Config, weights?: number[]): number[] {
  const hs = rowHeights(cfg, weights)
  const tops: number[] = []
  let y = gridRect(cfg).y
  for (const h of hs) {
    tops.push(y)
    y += h + gapOf(cfg)
  }
  return tops
}

export function itemRect(cfg: Config, it: Pick<GridItem, 'col' | 'row' | 'cs' | 'rs'>, weights?: number[]): Rect {
  const g = gridRect(cfg)
  const GAP = gapOf(cfg)
  const cw = colWidth(cfg)
  const hs = rowHeights(cfg, weights)
  const tops = rowTops(cfg, weights)
  const last = Math.min(ROWS, it.row + it.rs - 1) - 1
  return {
    x: Math.round(g.x + (it.col - 1) * (cw + GAP)),
    y: Math.round(tops[it.row - 1]),
    w: Math.round(it.cs * cw + (it.cs - 1) * GAP),
    h: Math.round(tops[last] + hs[last] - tops[it.row - 1]),
  }
}

let counter = 0
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}`

export type Box = Pick<GridItem, 'col' | 'row' | 'cs' | 'rs'>

/** Taille proposee quand on ajoute un element. */
export const DEFAULT_SIZE: Record<GridItem['type'], { cs: number; rs: number }> = {
  kpi: { cs: 3, rs: 1 },
  chart: { cs: 6, rs: 3 },
  table: { cs: 12, rs: 2 },
  slicer: { cs: 3, rs: 1 },
  map: { cs: 6, rs: 3 },
  text: { cs: 4, rs: 1 },
  logo: { cs: 2, rs: 1 },
  header: { cs: 12, rs: 1 },
  image: { cs: 3, rs: 2 },
  icon: { cs: 1, rs: 1 },
}

export const overlaps = (a: Box, b: Box) => a.col < b.col + b.cs && b.col < a.col + a.cs && a.row < b.row + b.rs && b.row < a.row + a.rs

/** Garde un bloc entierement dans la grille. */
export function clampBox(b: Box): Box {
  const cs = Math.min(Math.max(1, b.cs), COLS)
  const rs = Math.min(Math.max(1, b.rs), ROWS)
  return { cs, rs, col: Math.min(Math.max(1, b.col), COLS - cs + 1), row: Math.min(Math.max(1, b.row), ROWS - rs + 1) }
}

export const isFree = (items: GridItem[], b: Box, ignoreId?: string) => !items.some((i) => i.id !== ignoreId && overlaps(i, b))

/** La place libre la plus proche de la position souhaitee, ou null s'il n'y en a aucune. */
export function findSlot(items: GridItem[], want: Box, ignoreId?: string): Box | null {
  const w = clampBox(want)
  let best: Box | null = null
  let bestD = Infinity
  for (let row = 1; row <= ROWS - w.rs + 1; row++) {
    for (let col = 1; col <= COLS - w.cs + 1; col++) {
      const b = { col, row, cs: w.cs, rs: w.rs }
      if (!isFree(items, b, ignoreId)) continue
      const d = Math.abs(col - w.col) + Math.abs(row - w.row) * 1.5
      if (d < bestD) {
        bestD = d
        best = b
      }
    }
  }
  return best
}

/** Colonne et ligne (a partir de 1) sous un point de la page, bornees a la grille. */
export function cellAt(cfg: Config, weights: number[] | undefined, x: number, y: number): { col: number; row: number } {
  const g = gridRect(cfg)
  const step = colWidth(cfg) + gapOf(cfg)
  const col = Math.min(COLS, Math.max(1, Math.floor((x - g.x) / step) + 1))
  const tops = rowTops(cfg, weights)
  let row = 1
  for (let i = 0; i < tops.length; i++) if (y >= tops[i] - gapOf(cfg) / 2) row = i + 1
  return { col, row }
}
