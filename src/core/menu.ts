import type { Config, MenuConfig, PageData, Rect } from './types'
import { drawIcon } from './icons'
import { navSurface, resolveColors } from './layout'
import { darken, mix, readableOn } from './color'
import { pageIcon, px } from './nav'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const DARKEN = { light: 0.25, medium: 0.45, heavy: 0.68 }
const BLUR = { none: 0, soft: 6, strong: 18 }

export interface MenuModel {
  svg: string
  buttons: (Rect & { label: string; page: number })[]
}

let uid = 0

/** Image de menu recadree dans un rectangle : flou, assombrissement, ajustement. */
export function imageLayer(m: MenuConfig, r: Rect, fallbackColors: string[]): string {
  const id = `mi${uid++}`
  const blur = BLUR[m.blur]
  const parts: string[] = []
  parts.push(`<clipPath id="${id}c"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/></clipPath>`)
  if (blur) parts.push(`<filter id="${id}f" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${blur}"/></filter>`)
  parts.push(`<g clip-path="url(#${id}c)">`)
  if (m.image) {
    parts.push(`<image href="${m.image}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" preserveAspectRatio="${m.fit === 'fit' ? 'xMidYMid meet' : 'xMidYMid slice'}"${blur ? ` filter="url(#${id}f)"` : ''}/>`)
  } else {
    parts.push(`<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${fallbackColors[0]}"/><stop offset="1" stop-color="${fallbackColors[1]}"/></linearGradient>`)
    parts.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="url(#${id}g)"/>`)
  }
  parts.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="#000" opacity="${DARKEN[m.darken]}"/>`)
  parts.push('</g>')
  return parts.join('')
}

/** Titre avec le mot entre asterisques colorie. */
export function titleSpans(title: string, color: string): string {
  return title
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((s) => (s.startsWith('*') && s.endsWith('*') ? `<tspan fill="${color}">${esc(s.slice(1, -1))}</tspan>` : esc(s)))
    .join('')
}

/** Page de menu principal : six styles. Les boutons Power BI se posent sur les rectangles retournes. */
export function buildMenu(cfg: Config, pages: PageData[]): MenuModel {
  const c = resolveColors(cfg)
  const S = navSurface(cfg)
  const m = cfg.menu
  const W = cfg.width
  const H = cfg.height
  const f = esc(cfg.font)
  const out: string[] = []
  const buttons: MenuModel['buttons'] = []
  const links = pages.map((p, i) => ({ p, i })).filter(({ p }) => p.kind !== 'menu')
  const n = Math.max(1, links.length)
  const dark = cfg.mode === 'dark'
  const grad = [darken(c.accent, 0.35), c.data[1]]
  const onImage = m.labelColor === 'palette' ? c.accent : m.labelColor === 'white' ? '#FFFFFF' : '#FFFFFF'
  const baked = m.labels === 'baked'
  const title = (x: number, y: number, size: number, color: string, accent: string, anchor = 'start') =>
    out.push(`<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="800" font-family="${f}" fill="${color}">${titleSpans(cfg.title, accent)}</text>`)
  const sub = (x: number, y: number, color: string, anchor = 'start') => {
    if (cfg.subtitle) out.push(`<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${cfg.textSize + 6}" font-family="${f}" fill="${color}">${esc(cfg.subtitle)}</text>`)
  }
  const label = (r: Rect, i: number, text: string, color: string, size = cfg.textSize + 6) => {
    if (baked) out.push(`<text x="${r.x + px(cfg, 24)}" y="${r.y + r.h / 2 + size / 3}" font-size="${size}" font-weight="600" font-family="${f}" fill="${color}">${esc(text)}</text>`)
    buttons.push({ ...r, label: text, page: i })
  }
  const bg = c.bg
  out.push(`<rect width="100%" height="100%" fill="${bg}"/>`)
  const fb = (rr: Rect) => imageLayer(m, rr, grad)
  const mg = px(cfg, 64)
  const ts = Math.round(cfg.titleSize * 2.2)

  if (m.style === 'story') {
    const imgW = Math.round(W * 0.34)
    const ix = m.side === 'left' ? 0 : W - imgW
    out.push(fb({ x: ix, y: 0, w: imgW, h: H }))
    const x0 = m.side === 'left' ? imgW + mg : mg
    title(x0, H * 0.3, ts, c.text, c.accent)
    sub(x0, H * 0.3 + ts * 0.6, c.muted)
    const rowH = px(cfg, 64)
    const w = W - imgW - mg * 2
    links.forEach(({ p, i }, k) => {
      const r = { x: x0, y: H * 0.45 + k * (rowH + px(cfg, 10)), w, h: rowH }
      out.push(`<rect x="${r.x}" y="${r.y + r.h}" width="${r.w}" height="1" fill="${c.border}"/>`)
      out.push(`<text x="${r.x}" y="${r.y + r.h / 2 + 8}" font-size="${cfg.textSize + 4}" font-weight="700" font-family="${f}" fill="${c.accent}">${String(k + 1).padStart(2, '0')}</text>`)
      label({ ...r, x: r.x + px(cfg, 56), w: r.w - px(cfg, 56) }, i, p.name, c.text)
    })
  } else if (m.style === 'banner') {
    const bh = Math.round(H * 0.4)
    out.push(fb({ x: 0, y: 0, w: W, h: bh }))
    title(mg, bh * 0.55, ts, '#FFFFFF', m.labelColor === 'palette' ? lightColor(c.accent) : lightColor(c.accent))
    sub(mg, bh * 0.55 + ts * 0.6, 'rgba(255,255,255,0.85)')
    const cols = Math.min(n, 4)
    const gap = px(cfg, 20)
    const cw = (W - mg * 2 - gap * (cols - 1)) / cols
    const ch = px(cfg, 120)
    links.forEach(({ p, i }, k) => {
      const r = { x: Math.round(mg + (k % cols) * (cw + gap)), y: Math.round(bh + px(cfg, 56) + Math.floor(k / cols) * (ch + gap)), w: Math.round(cw), h: ch }
      out.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${cfg.radius}" fill="${c.card}" stroke="${c.border}"/>`)
      out.push(`<rect x="${r.x}" y="${r.y + r.h - 5}" width="${r.w}" height="5" fill="${c.data[k % c.data.length]}"/>`)
      label(r, i, p.name, c.text)
    })
  } else if (m.style === 'image') {
    const imgW = Math.round(W * 0.42)
    const ix = m.side === 'left' ? 0 : W - imgW
    out.push(fb({ x: ix, y: 0, w: imgW, h: H }))
    title(ix + mg * 0.8, H - mg * 1.6, Math.round(ts * 0.8), onImage, lightColor(c.accent))
    sub(ix + mg * 0.8, H - mg * 1.6 + ts * 0.5, 'rgba(255,255,255,0.85)')
    const x0 = m.side === 'left' ? imgW + mg : mg
    const w = W - imgW - mg * 2
    const ih = px(cfg, 76)
    links.forEach(({ p, i }, k) => {
      const r = { x: x0, y: Math.round(H * 0.2 + k * (ih + px(cfg, 14))), w, h: ih }
      out.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${cfg.radius}" fill="${c.card}" stroke="${c.border}"/>`)
      out.push(drawIcon(pageIcon(p, i), r.x + px(cfg, 22), r.y + (ih - px(cfg, 30)) / 2, px(cfg, 30), { style: cfg.iconStyle, weight: cfg.iconWeight, backing: cfg.iconBacking, color: c.accent, accent: c.accent }))
      label({ ...r, x: r.x + px(cfg, 50), w: r.w - px(cfg, 50) }, i, p.name, c.text)
    })
  } else if (m.style === 'cover') {
    out.push(fb({ x: 0, y: 0, w: W, h: H }))
    title(W / 2, H * 0.42, Math.round(ts * 1.15), onImage, lightColor(c.accent), 'middle')
    sub(W / 2, H * 0.42 + ts * 0.7, 'rgba(255,255,255,0.88)', 'middle')
    const bw = px(cfg, 220)
    const gap = px(cfg, 18)
    const total = n * bw + (n - 1) * gap
    links.forEach(({ p, i }, k) => {
      const r = { x: Math.round((W - total) / 2 + k * (bw + gap)), y: Math.round(H * 0.68), w: bw, h: px(cfg, 64) }
      out.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.h / 2}" fill="#FFFFFF" opacity="0.16" stroke="#FFFFFF" stroke-opacity="0.6"/>`)
      if (baked) out.push(`<text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 7}" text-anchor="middle" font-size="${cfg.textSize + 5}" font-weight="600" font-family="${f}" fill="${m.labelColor === 'palette' ? lightColor(c.accent) : '#FFFFFF'}">${esc(p.name)}</text>`)
      buttons.push({ ...r, label: p.name, page: i })
    })
  } else if (m.style === 'tiles') {
    title(mg, mg + ts, ts * 0.9, c.text, c.accent)
    sub(mg, mg + ts + ts * 0.5, c.muted)
    const cols = n <= 4 ? 2 : 3
    const gap = px(cfg, 24)
    const top = mg + ts * 2.2
    const rows = Math.ceil(n / cols)
    const cw = (W - mg * 2 - gap * (cols - 1)) / cols
    const ch = Math.min(px(cfg, 260), (H - top - mg - gap * (rows - 1)) / rows)
    links.forEach(({ p, i }, k) => {
      const col = c.data[k % c.data.length]
      const r = { x: Math.round(mg + (k % cols) * (cw + gap)), y: Math.round(top + Math.floor(k / cols) * (ch + gap)), w: Math.round(cw), h: Math.round(ch) }
      out.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${cfg.radius + 4}" fill="${col}"/>`)
      out.push(drawIcon(pageIcon(p, i), r.x + px(cfg, 28), r.y + px(cfg, 28), px(cfg, 44), { style: cfg.iconStyle, weight: cfg.iconWeight, backing: cfg.iconBacking, color: readableOn(col), accent: readableOn(col) }))
      if (baked) out.push(`<text x="${r.x + px(cfg, 28)}" y="${r.y + r.h - px(cfg, 28)}" font-size="${cfg.textSize + 10}" font-weight="700" font-family="${f}" fill="${readableOn(col)}">${esc(p.name)}</text>`)
      buttons.push({ ...r, label: p.name, page: i })
    })
  } else {
    // split : deux moities
    const lw = Math.round(W * 0.5)
    const left = m.side === 'left'
    out.push(`<rect x="${left ? 0 : W - lw}" y="0" width="${lw}" height="${H}" fill="${S.bg}"/>`)
    if (m.image) out.push(fb({ x: left ? lw : 0, y: 0, w: W - lw, h: H }))
    const tx = (left ? 0 : W - lw) + mg
    title(tx, H * 0.4, ts, S.onBg, mix(c.accent, S.onBg, dark ? 0.1 : 0.55))
    sub(tx, H * 0.4 + ts * 0.6, S.onBg)
    const rx = left ? lw + mg : mg
    const w = W - lw - mg * 2
    const rh = px(cfg, 72)
    links.forEach(({ p, i }, k) => {
      const r = { x: rx, y: Math.round(H * 0.3 + k * (rh + px(cfg, 12))), w, h: rh }
      if (!m.image) out.push(`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${cfg.radius}" fill="${c.card}" stroke="${c.border}"/>`)
      label(r, i, p.name, m.image ? '#FFFFFF' : c.text)
    })
  }

  return { svg: out.join(''), buttons }
}

const lightColor = (hex: string) => mix(hex, '#FFFFFF', 0.5)
