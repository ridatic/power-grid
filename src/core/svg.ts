import type { Config, ElementType, PageData, Rect } from './types'
import { COLS, colWidth, gapOf, gridRect, isHidden, itemRect, rowHeights, rowTops } from './grid'
import { cardFill, navSurface, resolveColors } from './layout'
import { buildNav, navInsets, px, type NavModel } from './nav'
import { drawIcon } from './icons'
import { buildMenu, imageLayer, titleSpans, type MenuModel } from './menu'
import { readableOn } from './color'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const BRANDED = ['sidebar', 'floating', 'filter']
const CARD_TYPES = new Set<ElementType>(['kpi', 'chart', 'table', 'slicer', 'map'])

export interface PageModel {
  svg: string
  nav: NavModel | null
  menu: MenuModel | null
}

/**
 * Fond d'une page : navigation, titre, cartes (ou menu principal).
 * Les visuels Power BI se posent par-dessus ; les boutons de page se posent sur les emplacements retournes.
 */
export interface BuildOptions {
  /** Apercu seulement : la grille, dessinee sous les cartes pour ne pas les chevaucher. */
  guides?: boolean
}

export function buildPage(cfg: Config, pages: PageData[], activeIndex: number, names?: Record<ElementType, string>, opts: BuildOptions = {}): PageModel {
  const page = pages[activeIndex]
  const c = resolveColors(cfg)
  const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${cfg.width}" height="${cfg.height}" viewBox="0 0 ${cfg.width} ${cfg.height}"><defs><filter id="sh" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="#1c3151" flood-opacity="0.16"/></filter></defs>`

  if (page.kind === 'menu') {
    const menu = buildMenu(cfg, pages)
    return { svg: `${head}${menu.svg}</svg>`, nav: null, menu }
  }

  const f = esc(cfg.font)
  const out: string[] = [head, `<rect width="100%" height="100%" fill="${c.bg}"/>`]
  const nav = buildNav(cfg, pages, activeIndex)
  const fill = cardFill(cfg)
  const S = navSurface(cfg)
  const texId = 'tex'
  if (cfg.texture === 'glow') {
    out.push(`<defs><radialGradient id="${texId}" cx="0.85" cy="0" r="0.9"><stop offset="0" stop-color="${c.accent}" stop-opacity="0.4"/><stop offset="1" stop-color="${c.accent}" stop-opacity="0"/></radialGradient></defs>`)
  } else if (cfg.texture === 'dots') {
    out.push(`<defs><pattern id="${texId}" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="${c.accent}" fill-opacity="0.38"/></pattern></defs>`)
  }

  out.push(nav.svg)

  if (opts.guides) {
    const g = gridRect(cfg)
    const cw = colWidth(cfg)
    const gap = gapOf(cfg)
    const tops = rowTops(cfg, page.rows)
    const hs = rowHeights(cfg, page.rows)
    const line = cfg.mode === 'dark' ? '#FFFFFF' : '#64748B'
    out.push(`<g fill="none" stroke="${line}" stroke-opacity="0.18" stroke-dasharray="4 4" stroke-width="1">`)
    for (let i = 0; i < COLS; i++) out.push(`<rect x="${g.x + i * (cw + gap)}" y="${g.y}" width="${cw}" height="${g.h}"/>`)
    for (let i = 0; i < tops.length; i++) out.push(`<line x1="${g.x}" x2="${g.x + g.w}" y1="${tops[i] + hs[i]}" y2="${tops[i] + hs[i]}"/>`)
    out.push('</g>')
  }

  for (const it of page.items) {
    if (isHidden(cfg, it)) continue
    const z = itemRect(cfg, it, page.rows)
    const variant = it.props?.variant
    if (it.type === 'slicer' && (variant === 'search' || variant === 'date')) {
      out.push(...pillSvg(cfg, z, variant, it.props?.title ?? ''))
      continue
    }
    if (it.type === 'image') {
      if (it.props?.src) out.push(imageSvg(z, it.props.src, it.props.fit ?? 'cover', cfg.radius, `img-${it.id}`))
      continue
    }
    if (it.type === 'icon') {
      const size = Math.min(z.w, z.h) * 0.8
      out.push(drawIcon(it.props?.icon ?? 'star', z.x + (z.w - size) / 2, z.y + (z.h - size) / 2, size, { style: cfg.iconStyle, weight: cfg.iconWeight, backing: cfg.iconBacking, color: c.accent, accent: c.accent }))
      continue
    }
    if (it.type === 'text') {
      if (it.props?.text) {
        const size = cfg.cardSize + 2
        const lines = it.props.text.split('\n')
        const align = it.props.align ?? 'left'
        const x = align === 'center' ? z.x + z.w / 2 : align === 'right' ? z.x + z.w : z.x
        const anchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start'
        const y0 = z.y + z.h / 2 - ((lines.length - 1) * size * 1.35) / 2 + size / 3
        lines.forEach((l, k) => out.push(`<text x="${x}" y="${y0 + k * size * 1.35}" text-anchor="${anchor}" font-size="${size}" font-family="${f}" fill="${c.text}">${esc(l)}</text>`))
      }
      continue
    }
    if (it.type === 'logo' && variant === 'avatar') {
      const r = Math.min(z.w, z.h) / 2
      if (it.props?.src) {
        out.push(imageSvg({ x: z.x + z.w / 2 - r, y: z.y + z.h / 2 - r, w: r * 2, h: r * 2 }, it.props.src, 'cover', r, `av-${it.id}`))
        continue
      }
      out.push(`<circle cx="${z.x + z.w / 2}" cy="${z.y + z.h / 2}" r="${r}" fill="#64748B"/><text x="${z.x + z.w / 2}" y="${z.y + z.h / 2 + cfg.textSize / 3}" text-anchor="middle" font-size="${cfg.textSize - 1}" font-weight="700" font-family="${f}" fill="#FFFFFF">${esc(it.props?.title ?? '')}</text>`)
      continue
    }
    if (it.type === 'header') {
      if (!cfg.showHeader) continue
      out.push(...headerSvg(cfg, z, S.bg, S.onBg))
      continue
    }
    if (!CARD_TYPES.has(it.type)) continue
    const r = cfg.radius
    const filter = cfg.shadow ? ' filter="url(#sh)"' : ''
    out.push(`<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="${r}" fill="${fill}" stroke="${c.border}"${filter}/>`)
    if (cfg.texture !== 'none') out.push(`<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="${r}" fill="url(#${texId})"/>`)
    if (cfg.cardStyle === 'band') {
      const b = Math.min(44, z.h)
      out.push(`<path d="M${z.x} ${z.y + b}V${z.y + r}a${r} ${r} 0 0 1 ${r}-${r}H${z.x + z.w - r}a${r} ${r} 0 0 1 ${r} ${r}V${z.y + b}Z" fill="${c.accent}" opacity="0.14"/>`)
    } else if (cfg.cardStyle === 'tick') {
      out.push(`<rect x="${z.x + 16}" y="${z.y + 16}" width="28" height="4" rx="2" fill="${c.accent}"/>`)
    }
    if (cfg.labelZones && names) {
      out.push(`<text x="${z.x + 16}" y="${z.y + (cfg.cardStyle === 'tick' ? 44 : 32)}" font-size="${cfg.cardSize}" font-weight="600" font-family="${f}" fill="${c.muted}">${esc(names[it.type])}</text>`)
    }
  }

  out.push(...footerSvg(cfg))
  out.push('</svg>')
  return { svg: out.join(''), nav, menu: null }
}

/** Image recadree dans un rectangle aux coins arrondis. */
function imageSvg(z: Rect, src: string, fit: 'cover' | 'contain', radius: number, id: string): string {
  return `<clipPath id="${id}"><rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="${radius}"/></clipPath><image href="${src}" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" preserveAspectRatio="${fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}" clip-path="url(#${id})"/>`
}

/** Zone de recherche ou de dates : une pastille, sans carte. */
function pillSvg(cfg: Config, z: Rect, variant: 'search' | 'date', label: string): string[] {
  const c = resolveColors(cfg)
  const f = esc(cfg.font)
  const dark = cfg.mode === 'dark'
  const h = Math.min(z.h, px(cfg, 44))
  const y = z.y + (z.h - h) / 2
  const out: string[] = []
  const ty = y + h / 2 + cfg.textSize / 3
  if (variant === 'search') {
    out.push(`<rect x="${z.x}" y="${y}" width="${z.w}" height="${h}" rx="${Math.min(10, h / 2)}" fill="${dark ? c.card : '#F4F6FA'}"/>`)
    const cx = z.x + px(cfg, 20)
    out.push(`<circle cx="${cx}" cy="${y + h / 2 - 1}" r="${px(cfg, 6)}" fill="none" stroke="${c.muted}" stroke-width="1.8"/><path d="M${cx + px(cfg, 4.5)} ${y + h / 2 + px(cfg, 3.5)}l${px(cfg, 5)} ${px(cfg, 5)}" stroke="${c.muted}" stroke-width="1.8" stroke-linecap="round"/>`)
    out.push(`<text x="${z.x + px(cfg, 40)}" y="${ty}" font-size="${cfg.textSize}" font-family="${f}" fill="${c.muted}">${esc(label)}</text>`)
  } else {
    out.push(`<rect x="${z.x}" y="${y}" width="${z.w}" height="${h}" rx="${Math.min(10, h / 2)}" fill="${dark ? c.card : '#FFFFFF'}" stroke="${c.border}"/>`)
    out.push(drawIcon('calendar', z.x + px(cfg, 14), y + (h - px(cfg, 18)) / 2, px(cfg, 18), { style: 'outline', weight: 'regular', backing: 'none', color: c.muted, accent: c.muted }))
    out.push(`<text x="${z.x + px(cfg, 42)}" y="${ty}" font-size="${cfg.textSize}" font-family="${f}" fill="${c.muted}">${esc(label)}</text>`)
    const cx = z.x + z.w - px(cfg, 18)
    out.push(`<path d="M${cx - 4} ${y + h / 2 - 2}l4 4 4-4" fill="none" stroke="${c.muted}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`)
  }
  return out
}

function headerSvg(cfg: Config, z: Rect, bandBg: string, bandInk: string): string[] {
  const c = resolveColors(cfg)
  const f = esc(cfg.font)
  const out: string[] = []
  const band = cfg.headerBand
  const ink = band ? bandInk : c.text
  const sub = band ? bandInk : c.muted
  if (band) {
    if (cfg.menu.useOn === 'all' && cfg.menu.image) {
      out.push(imageLayer(cfg.menu, z, [bandBg, bandBg]))
    } else {
      out.push(`<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="${cfg.radius}" fill="${bandBg}"/>`)
    }
  }
  const pad = band ? px(cfg, 24) : 0
  const hasSub = !!cfg.subtitle
  const ty = z.y + (hasSub ? z.h * 0.46 : z.h * 0.6) + cfg.titleSize * 0.15
  const accent = band ? readableOn(bandBg) : c.accent
  out.push(`<text x="${z.x + pad}" y="${ty}" font-size="${cfg.titleSize}" font-weight="700" font-family="${f}" fill="${ink}">${titleSpans(cfg.title, accent)}</text>`)
  if (hasSub) out.push(`<text x="${z.x + pad}" y="${ty + cfg.textSize + 16}" font-size="${cfg.textSize + 2}" font-family="${f}" fill="${sub}" opacity="${band ? 0.85 : 1}">${esc(cfg.subtitle)}</text>`)
  if (cfg.company && !BRANDED.includes(cfg.navFrame)) out.push(`<text x="${z.x + z.w - pad}" y="${z.y + z.h / 2 + cfg.textSize / 3}" text-anchor="end" font-size="${cfg.textSize + 2}" font-weight="600" font-family="${f}" fill="${band ? bandInk : c.muted}">${esc(cfg.company)}</text>`)
  return out
}

function footerSvg(cfg: Config): string[] {
  const c = resolveColors(cfg)
  const f = esc(cfg.font)
  const out: string[] = []
  const y = cfg.height - px(cfg, 16)
  const x0 = navInsets(cfg).left + 24
  if (cfg.footer) out.push(`<text x="${x0}" y="${y}" font-size="${cfg.textSize - 1}" font-family="${f}" fill="${c.muted}">${esc(cfg.footer)}</text>`)
  const right = [cfg.linkedin, cfg.website].filter(Boolean).join('   |   ')
  if (right) out.push(`<text x="${cfg.width - 24}" y="${y}" text-anchor="end" font-size="${cfg.textSize - 1}" font-family="${f}" fill="${c.muted}">${esc(right)}</text>`)
  return out
}

/** Raccourci : seulement le SVG. */
export const renderSvg = (cfg: Config, pages: PageData[], activeIndex: number, names?: Record<ElementType, string>) => buildPage(cfg, pages, activeIndex, names).svg
