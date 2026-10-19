import type { Config, NavFrame, PageData, Rect } from './types'
import { AUTO_ICONS, drawIcon } from './icons'
import { navSurface, resolveColors, type Surface } from './layout'
import { darken, lighten, mix, readableOn } from './color'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const scale = (cfg: Config) => Math.max(0.6, cfg.width / 1920)
/** Une taille de reference (page 1920 de large) adaptee a la largeur de la page. */
export const px = (cfg: Config, n: number) => Math.round(n * scale(cfg))

export interface Insets {
  left: number
  top: number
}

export const NAV_FRAMES: NavFrame[] = ['sidebar', 'floating', 'rail', 'toprail', 'tabs', 'notch', 'folder', 'filter', 'capsule', 'none']

/** Espace pris par la navigation autour de la grille. */
export function navInsets(cfg: Config): Insets {
  const W = cfg.width
  switch (cfg.navFrame) {
    case 'sidebar': return { left: Math.round(W * 0.13), top: 0 }
    case 'floating': return { left: px(cfg, 16) + Math.round(W * 0.115), top: 0 }
    case 'rail': return { left: px(cfg, 80), top: 0 }
    case 'toprail': return { left: px(cfg, 80), top: px(cfg, 60) }
    case 'tabs': return { left: 0, top: px(cfg, 60) }
    case 'notch': return { left: 0, top: px(cfg, 64) }
    case 'folder': return { left: 0, top: px(cfg, 48) }
    case 'filter': return { left: Math.round(W * 0.17), top: 0 }
    case 'capsule': return { left: 0, top: px(cfg, 16) + px(cfg, 52) + px(cfg, 8) }
    default: return { left: 0, top: 0 }
  }
}

export interface NavItemRect extends Rect {
  label: string
  page: number
}

export interface NavModel {
  svg: string
  items: NavItemRect[]
  slots: Rect[] // emplacements de segments du panneau de filtres
  logo: Rect | null
}

const CORNER = { sm: 4, md: 10, lg: 18, round: 999 }

const topRounded = (x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.min(r, w / 2, h)
  return `M${x} ${y + h}V${y + rr}Q${x} ${y} ${x + rr} ${y}H${x + w - rr}Q${x + w} ${y} ${x + w} ${y + rr}V${y + h}Z`
}

export const pageIcon = (p: PageData, i: number) => p.icon ?? AUTO_ICONS[i % AUTO_ICONS.length]

type Mode = 'list' | 'tab' | 'icon'

interface Ctx {
  cfg: Config
  S: Surface
  pages: PageData[]
  active: number
  out: string[]
  items: NavItemRect[]
}

function drawItem(ctx: Ctx, r: Rect, i: number, mode: Mode, opt: { ink?: string; activeBg?: string; topTab?: boolean } = {}) {
  const { cfg, S, pages, active, out } = ctx
  const p = pages[i]
  const isActive = i === active
  const accentActive = isActive && cfg.navActive === 'accent' && !opt.topTab
  const ink = accentActive ? readableOn(resolveColors(cfg).accent) : (opt.ink ?? S.ink)
  const radius = Math.min(CORNER[cfg.tabCorner], r.h / 2)
  const label = p.name
  ctx.items.push({ ...r, label, page: i })

  if (isActive) {
    if (accentActive) {
      out.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${radius}" fill="url(#navact)"/>`)
    } else if (opt.topTab) {
      out.push(`<path d="${topRounded(r.x, r.y, r.w, r.h + px(cfg, 2), CORNER[cfg.tabCorner])}" fill="${opt.activeBg}"/>`)
      if (cfg.navActive === 'edge') out.push(`<rect x="${r.x + px(cfg, 14)}" y="${r.y}" width="${r.w - px(cfg, 28)}" height="${px(cfg, 4)}" rx="2" fill="${resolveColors(cfg).accent}"/>`)
    } else if (cfg.navActive === 'fill' || cfg.navActive === 'accent') {
      out.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${radius}" fill="${ink}" opacity="0.18"/>`)
    } else if (mode === 'tab') {
      out.push(`<rect x="${r.x + px(cfg, 12)}" y="${r.y + r.h - px(cfg, 4)}" width="${r.w - px(cfg, 24)}" height="${px(cfg, 4)}" rx="2" fill="${ink}"/>`)
    } else {
      out.push(`<rect x="${r.x}" y="${r.y + px(cfg, 8)}" width="${px(cfg, 4)}" height="${r.h - px(cfg, 16)}" rx="2" fill="${ink}"/>`)
    }
  }

  const op = isActive ? 1 : 0.72
  const isz = mode === 'icon' ? px(cfg, 26) : px(cfg, 22)
  const ix = mode === 'icon' ? r.x + (r.w - isz) / 2 : r.x + px(cfg, 16)
  const iy = r.y + (r.h - isz) / 2
  out.push(`<g opacity="${op}">`)
  if (cfg.navIcons) {
    out.push(drawIcon(pageIcon(p, i), ix, iy, isz, { style: cfg.iconStyle, weight: cfg.iconWeight, backing: cfg.iconBacking, color: ink, accent: ink }))
  }
  if (cfg.navLabels === 'fixed' && mode !== 'icon') {
    const tx = cfg.navIcons ? ix + isz + px(cfg, 12) : r.x + px(cfg, 16)
    out.push(`<text x="${tx}" y="${r.y + r.h / 2 + cfg.textSize / 3}" font-size="${cfg.textSize + 1}" font-weight="${isActive ? 700 : 500}" font-family="${esc(cfg.font)}" fill="${ink}">${esc(label)}</text>`)
  }
  out.push('</g>')
}

function logoSvg(cfg: Config, S: Surface, r: Rect): string {
  const cx = r.x + r.w / 2
  const cy = r.y + r.h / 2
  switch (cfg.logoKind) {
    case 'bolt':
      return `<path d="M13 2 4 14h7l-1 8 9-12h-7z" transform="translate(${r.x} ${r.y}) scale(${r.w / 24})" fill="${lighten(resolveColors(cfg).accent, 0.3)}"/>`
    case 'mark':
      return `<circle cx="${cx}" cy="${cy}" r="${r.w / 2}" fill="${S.ink}"/><circle cx="${cx}" cy="${cy}" r="${r.w * 0.22}" fill="${S.bg}"/>`
    case 'letter': {
      const letter = (cfg.company || cfg.title.replace(/\*/g, '')).trim().charAt(0).toUpperCase() || 'P'
      return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.w * 0.26}" fill="${S.ink}"/><text x="${cx}" y="${cy + r.w * 0.17}" text-anchor="middle" font-size="${r.w * 0.5}" font-weight="800" font-family="${esc(cfg.font)}" fill="${S.bg}">${esc(letter)}</text>`
    }
    case 'icon':
      return drawIcon(cfg.logoIcon, r.x, r.y, r.w, { style: cfg.iconStyle, weight: cfg.iconWeight, backing: 'square', color: S.ink, accent: S.ink })
    case 'upload':
      return cfg.logoImage ? `<image href="${cfg.logoImage}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" preserveAspectRatio="xMidYMid meet"/>` : ''
    default:
      return ''
  }
}

function startY(cfg: Config, top: number, h: number, n: number, ih: number, gap: number, topPad: number) {
  const total = n * ih + (n - 1) * gap
  if (cfg.navPos === 'middle') return top + (h - total) / 2
  if (cfg.navPos === 'bottom') return top + h - total - px(cfg, 28)
  return top + topPad
}

export function buildNav(cfg: Config, pages: PageData[], active: number): NavModel {
  const S = navSurface(cfg)
  const c = resolveColors(cfg)
  const W = cfg.width
  const H = cfg.height
  const frame = cfg.navFrame
  const ctx: Ctx = { cfg, S, pages, active, out: [], items: [] }
  const out = ctx.out
  const slots: Rect[] = []
  let logo: Rect | null = null
  const n = pages.length
  const fill = cfg.navFill === 'gradient' ? 'url(#navg)' : S.bg
  const defs = cfg.navFill === 'gradient' ? `<defs><linearGradient id="navg" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${S.bg}"/><stop offset="1" stop-color="${S.bg2}"/></linearGradient></defs>` : ''
  out.push(defs)
  const acc = resolveColors(cfg).accent
  out.push(`<defs><linearGradient id="navact" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${lighten(acc, 0.28)}"/><stop offset="1" stop-color="${darken(acc, 0.08)}"/></linearGradient></defs>`)
  const ls = px(cfg, 44)
  const addLogo = (r: Rect) => {
    logo = r
    out.push(logoSvg(cfg, S, r))
  }
  const sideLine = (x: number, h: number) => out.push(`<rect x="${x - 1}" y="0" width="1" height="${h}" fill="${c.border}"/>`)

  if (frame === 'sidebar' || frame === 'floating' || frame === 'filter') {
    const floating = frame === 'floating'
    const m = floating ? px(cfg, 16) : 0
    const pw = frame === 'filter' ? Math.round(W * 0.17) : floating ? Math.round(W * 0.115) : Math.round(W * 0.13)
    const ph = H - 2 * m
    if (floating) out.push(`<rect x="${m}" y="${m}" width="${pw}" height="${ph}" rx="${px(cfg, 22)}" fill="${fill}" filter="url(#sh)"/>`)
    else out.push(`<rect x="0" y="0" width="${pw}" height="${ph}" fill="${fill}"/>`)
    if (!floating && cfg.navTone === 'paper') sideLine(pw, H)
    if (cfg.navDecor && cfg.navTone === 'navy') {
      const k = pw / 164
      out.push(`<defs><clipPath id="navclip"><rect x="${m}" y="${m}" width="${pw}" height="${ph}" rx="${floating ? px(cfg, 22) : 0}"/></clipPath><linearGradient id="navdec" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(acc, 0.3)}"/><stop offset="1" stop-color="${acc}"/></linearGradient></defs>`)
      out.push(`<g clip-path="url(#navclip)"><ellipse cx="${m + 70 * k}" cy="${m + ph - 21 * k}" rx="${140 * k}" ry="${75 * k}" transform="rotate(-23 ${m + 70 * k} ${m + ph - 21 * k})" fill="url(#navdec)" opacity="0.78"/></g>`)
    }
    if (cfg.company) {
      const bs = px(cfg, 34)
      const bx = m + px(cfg, 18)
      const by = m + px(cfg, 26)
      addLogo({ x: bx, y: by, w: bs, h: bs })
      out.push(`<text x="${bx + bs + px(cfg, 10)}" y="${by + bs / 2 + cfg.textSize / 3}" font-size="${cfg.textSize + 3}" font-weight="750" font-family="${esc(cfg.font)}" fill="${S.onBg}">${esc(cfg.company)}</text>`)
    } else {
      addLogo({ x: m + (pw - ls) / 2, y: m + px(cfg, 28), w: ls, h: ls })
    }
    if (cfg.navUser && frame !== 'filter') {
      const uy = m + ph - px(cfg, 62)
      const as = px(cfg, 30)
      const initials = cfg.userName.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join('')
      out.push(`<rect x="${m + px(cfg, 14)}" y="${uy - px(cfg, 10)}" width="${pw - px(cfg, 28)}" height="1" fill="#FFFFFF" opacity="0.1"/>`)
      out.push(`<circle cx="${m + px(cfg, 14) + as / 2}" cy="${uy + as / 2 + px(cfg, 2)}" r="${as / 2}" fill="#65748D"/><text x="${m + px(cfg, 14) + as / 2}" y="${uy + as / 2 + px(cfg, 2) + cfg.textSize / 3}" text-anchor="middle" font-size="${cfg.textSize - 1}" font-weight="700" font-family="${esc(cfg.font)}" fill="#FFFFFF">${esc(initials)}</text>`)
      out.push(`<text x="${m + px(cfg, 14) + as + px(cfg, 10)}" y="${uy + as / 2 - px(cfg, 1)}" font-size="${cfg.textSize - 1}" font-weight="700" font-family="${esc(cfg.font)}" fill="${S.onBg}">${esc(cfg.userName)}</text>`)
      out.push(`<text x="${m + px(cfg, 14) + as + px(cfg, 10)}" y="${uy + as / 2 + px(cfg, 15)}" font-size="${cfg.textSize - 2}" font-family="${esc(cfg.font)}" fill="${S.onBg}" opacity="0.6">${esc(cfg.userRole)}</text>`)
    }
    const ih = frame === 'filter' ? px(cfg, 40) : px(cfg, 46)
    const gap = px(cfg, 8)
    const ix = m + px(cfg, 12)
    const iw = pw - px(cfg, 24)
    const y0 = startY(cfg, m, ph, n, ih, gap, px(cfg, 110))
    pages.forEach((_, i) => drawItem(ctx, { x: ix, y: y0 + i * (ih + gap), w: iw, h: ih }, i, 'list'))
    if (frame === 'filter') {
      const top = Math.max(y0 + n * (ih + gap), px(cfg, 110) + n * (ih + gap)) + px(cfg, 16)
      const count = Math.min(5, Math.max(2, cfg.filterSlots))
      const avail = H - top - px(cfg, 24)
      const sh = Math.min(px(cfg, 120), (avail - gap * (count - 1)) / count)
      out.push(`<rect x="${ix}" y="${top - px(cfg, 8)}" width="${iw}" height="1" fill="${S.ink}" opacity="0.25"/>`)
      for (let i = 0; i < count; i++) {
        const r = { x: ix, y: Math.round(top + i * (sh + gap)), w: iw, h: Math.round(sh) }
        slots.push(r)
        out.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${cfg.radius}" fill="${S.ink}" opacity="0.12"/>`)
      }
    }
  } else if (frame === 'rail' || frame === 'toprail') {
    const pw = px(cfg, 80)
    const topH = frame === 'toprail' ? px(cfg, 60) : 0
    if (frame === 'toprail') {
      out.push(`<rect x="0" y="0" width="${W}" height="${topH}" fill="${fill}"/>`)
      out.push(`<rect x="0" y="${topH}" width="${pw}" height="${H - topH}" fill="${mix(S.bg, S.onBg === '#FFFFFF' ? '#000000' : '#FFFFFF', 0.1)}"/>`)
      addLogo({ x: px(cfg, 20), y: (topH - px(cfg, 36)) / 2, w: px(cfg, 36), h: px(cfg, 36) })
    } else {
      out.push(`<rect x="0" y="0" width="${pw}" height="${H}" fill="${fill}"/>`)
      if (cfg.navTone === 'paper') sideLine(pw, H)
      addLogo({ x: (pw - ls) / 2, y: px(cfg, 28), w: ls, h: ls })
    }
    const ih = px(cfg, 56)
    const gap = px(cfg, 10)
    const y0 = startY(cfg, topH, H - topH, n, ih, gap, frame === 'rail' ? px(cfg, 110) : px(cfg, 24))
    pages.forEach((_, i) => drawItem(ctx, { x: px(cfg, 10), y: y0 + i * (ih + gap), w: pw - px(cfg, 20), h: ih }, i, 'icon'))
  } else if (frame === 'tabs' || frame === 'notch' || frame === 'folder') {
    const barH = frame === 'tabs' ? px(cfg, 60) : frame === 'notch' ? px(cfg, 64) : px(cfg, 48)
    if (frame === 'folder') out.push(`<rect x="0" y="${barH - 1}" width="${W}" height="1" fill="${c.border}"/>`)
    else out.push(`<rect x="0" y="0" width="${W}" height="${barH}" fill="${fill}"/>`)
    const hasLogo = frame !== 'folder'
    let x0 = px(cfg, 24)
    if (hasLogo) {
      const s = px(cfg, 36)
      addLogo({ x: x0, y: (barH - s) / 2, w: s, h: s })
      x0 += s + px(cfg, 20)
    }
    const iw = px(cfg, 170)
    const gap = px(cfg, 6)
    const ih = frame === 'tabs' ? barH - px(cfg, 20) : frame === 'notch' ? barH - px(cfg, 14) : barH - px(cfg, 8)
    const y = frame === 'tabs' ? px(cfg, 10) : barH - ih
    pages.forEach((_, i) => {
      const r = { x: x0 + i * (iw + gap), y, w: iw, h: ih }
      if (frame === 'tabs') drawItem(ctx, r, i, 'tab')
      else if (frame === 'notch') drawItem(ctx, r, i, 'tab', { activeBg: c.bg, ink: i === active ? c.text : S.ink, topTab: true })
      else {
        out.push(`<path d="${topRounded(r.x, r.y, r.w, r.h, CORNER[cfg.tabCorner])}" fill="${i === active ? c.card : fill}" opacity="${i === active ? 1 : 0.92}" stroke="${c.border}"/>`)
        drawItem(ctx, r, i, 'tab', { ink: i === active ? c.text : S.ink, activeBg: c.card, topTab: false })
      }
    })
  } else if (frame === 'capsule') {
    const ih = px(cfg, 52)
    const iw = px(cfg, 138)
    const pad = px(cfg, 8)
    const pw = n * iw + pad * 2
    const y = px(cfg, 16)
    const x = (W - pw) / 2
    out.push(`<rect x="${x}" y="${y}" width="${pw}" height="${ih}" rx="${ih / 2}" fill="${fill}" filter="url(#sh)"/>`)
    const s = px(cfg, 36)
    addLogo({ x: px(cfg, 24), y: y + (ih - s) / 2, w: s, h: s })
    pages.forEach((_, i) => drawItem(ctx, { x: x + pad + i * iw, y: y + pad / 2, w: iw, h: ih - pad }, i, 'tab'))
  }

  return { svg: out.join(''), items: ctx.items, slots, logo }
}
