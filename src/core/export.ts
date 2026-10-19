import type { ElementType, Project } from './types'
import { isHidden, itemRect } from './grid'
import { buildPage } from './svg'
import { buildTheme } from './theme'

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page'

type Names = Record<ElementType, string>
const svgOf = (p: Project, i: number, names?: Names) => buildPage(p.cfg, p.pages, i, names).svg

export const downloadTheme = (p: Project) =>
  download(new Blob([JSON.stringify(buildTheme(p.cfg), null, 2)], { type: 'application/json' }), 'power-grid-theme.json')

export const downloadSvg = (p: Project, i: number, names?: Names) =>
  download(new Blob([svgOf(p, i, names)], { type: 'image/svg+xml' }), `fond-${slug(p.pages[i].name)}.svg`)

/** PNG a 1x ou 2x (2x pour un fond net sur les ecrans haute densite). */
export function downloadPng(p: Project, i: number, names?: Names, factor = 2): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = p.cfg.width * factor
      canvas.height = p.cfg.height * factor
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((b) => {
        if (!b) return reject(new Error('PNG'))
        download(b, `fond-${slug(p.pages[i].name)}${factor === 2 ? '@2x' : ''}.png`)
        resolve()
      }, 'image/png')
    }
    img.onerror = () => reject(new Error('SVG'))
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgOf(p, i, names))
  })
}

export interface PositionRow {
  name: string
  x: number
  y: number
  w: number
  h: number
}

/** Positions a saisir dans Format > General > Properties. */
export function positions(p: Project, i: number, names?: Names): PositionRow[] {
  const model = buildPage(p.cfg, p.pages, i, names)
  const rows: PositionRow[] = []
  model.nav?.items.forEach((n) => rows.push({ name: `nav: ${n.label}`, x: n.x, y: n.y, w: n.w, h: n.h }))
  model.nav?.slots.forEach((s, k) => rows.push({ name: `filtre ${k + 1}`, x: s.x, y: s.y, w: s.w, h: s.h }))
  if (model.nav?.logo) rows.push({ name: 'logo', ...model.nav.logo })
  model.menu?.buttons.forEach((b) => rows.push({ name: `menu: ${b.label}`, x: b.x, y: b.y, w: b.w, h: b.h }))
  const counts: Record<string, number> = {}
  for (const it of p.pages[i].items) {
    if (isHidden(p.cfg, it)) continue
    counts[it.type] = (counts[it.type] ?? 0) + 1
    const r = itemRect(p.cfg, it, p.pages[i].rows)
    rows.push({ name: `${names?.[it.type] ?? it.type} ${counts[it.type]}`, x: r.x, y: r.y, w: r.w, h: r.h })
  }
  return rows.map((r) => ({ ...r, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) }))
}

export const positionsCsv = (p: Project, i: number, names?: Names) =>
  ['name,x,y,width,height', ...positions(p, i, names).map((r) => `${r.name},${r.x},${r.y},${r.w},${r.h}`)].join('\n')

export const downloadPositions = (p: Project, i: number, names?: Names) =>
  download(new Blob([positionsCsv(p, i, names)], { type: 'text/csv' }), `positions-${slug(p.pages[i].name)}.csv`)

/** Toutes les pages, un fichier chacune (le navigateur peut demander d'autoriser les telechargements multiples). */
export async function downloadAll(p: Project, names?: Names) {
  downloadTheme(p)
  for (let i = 0; i < p.pages.length; i++) {
    await new Promise((r) => setTimeout(r, 250))
    downloadSvg(p, i, names)
    await new Promise((r) => setTimeout(r, 250))
    downloadPositions(p, i, names)
  }
}
