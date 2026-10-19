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
