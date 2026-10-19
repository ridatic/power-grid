export type IconStyle = 'outline' | 'duotone'
export type IconWeight = 'thin' | 'regular' | 'bold'
export type IconBacking = 'none' | 'square' | 'circle'

/** Icones sur une grille de 24 x 24, tracees au trait. */
export const ICONS: Record<string, string> = {
  home: 'M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  table: 'M3 5h18v14H3zM3 10h18M3 15h18M9 5v14',
  users: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5M21 19c0-2.5-1.5-4.4-4-5',
  map: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.2 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2.2.6a7 7 0 0 0-1.6-.9L14.8 4h-4.6l-.4 2.7a7 7 0 0 0-1.6.9L6 7 4 11l2 1a7 7 0 0 0 0 1.8L4 15l2 4 2.2-.6c.5.4 1 .7 1.6.9l.4 2.7h4.6l.4-2.7c.6-.2 1.1-.5 1.6-.9L18 19l2-4-2-1.2c.1-.6.1-1.200 0-1.800z',
  dollar: 'M12 3v18M16.5 7.5C15.5 6.4 14 6 12 6c-2.600 0-4 1.100-4 2.800 0 4 8.500 1.700 8.500 6C16.500 16.500 15 18 12 18c-2 0-3.700-.6-4.800-1.800',
  box: 'M3 7.500 12 3l9 4.500v9L12 21l-9-4.500zM3 7.500 12 12l9-4.500M12 12v9',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.500a4.500 4.500 0 1 0 0-9 4.500 4.500 0 0 0 0 9zM12 12.800a.8.8 0 1 0 0-1.600.8.8 0 0 0 0 1.600z',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
}

export const ICON_NAMES = Object.keys(ICONS)
export const AUTO_ICONS = ['home', 'chart', 'users', 'box', 'map', 'table', 'calendar', 'target']

const WEIGHT: Record<IconWeight, number> = { thin: 1.2, regular: 1.8, bold: 2.6 }

export interface IconOptions {
  style: IconStyle
  weight: IconWeight
  backing: IconBacking
  color: string // couleur du trait
  accent: string // couleur du remplissage duotone et du fond
}

/** Icone dessinee en SVG, centree dans le carre (x, y, size). */
export function drawIcon(name: string, x: number, y: number, size: number, o: IconOptions): string {
  const d = ICONS[name] ?? ICONS.home
  const out: string[] = []
  const pad = o.backing === 'none' ? 0 : size * 0.22
  if (o.backing === 'square') out.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.22}" fill="${o.accent}" opacity="0.2"/>`)
  if (o.backing === 'circle') out.push(`<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" fill="${o.accent}" opacity="0.2"/>`)
  const inner = size - pad * 2
  const k = inner / 24
  const duo = o.style === 'duotone'
  out.push(
    `<g transform="translate(${x + pad} ${y + pad}) scale(${k})"><path d="${d}" fill="${duo ? o.accent : 'none'}" fill-opacity="${duo ? 0.28 : 1}" stroke="${o.color}" stroke-width="${WEIGHT[o.weight]}" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  )
  return out.join('')
}
