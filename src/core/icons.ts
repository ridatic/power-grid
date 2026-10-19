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
  // general
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16v-4M12 8h.01',
  check: 'M20 6 9 17l-5-5',
  alert: 'M12 3 2 20h20zM12 9v5M12 17h.01',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
  flag: 'M4 22V4M4 4h13l-2 4 2 4H4',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  mail: 'M3 5h18v14H3zM3 7l9 6 9-6',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  // finance
  euro: 'M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10h9M4 14h9',
  wallet: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7V6a2 2 0 0 1 2-2h11M16 13h.01',
  card: 'M2 6h20v12H2zM2 10h20M6 15h4',
  bank: 'M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18',
  coins: 'M8 8a6 3 0 1 0 12 0 6 3 0 1 0-12 0M8 8v4c0 1.7 2.7 3 6 3s6-1.3 6-3V8M4 12c0 1.7 2.7 3 6 3M4 12v4c0 1.7 2.7 3 6 3',
  receipt: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6',
  percent: 'M19 5 5 19M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  trendUp: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  trendDown: 'M3 7l6 6 4-4 8 8M15 17h6v-6',
  // commerce
  cart: 'M3 4h2l2.4 11h11l2-8H6.2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  bag: 'M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2',
  tag: 'M3 12V3h9l9 9-9 9zM7.5 7.5h.01',
  store: 'M4 10v10h16V10M3 4h18l-1 6H4zM9 20v-6h6v6',
  truck: 'M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  gift: 'M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7S10 3 7.5 3a2 2 0 0 0 0 4M12 7s2-4 4.5-4a2 2 0 0 1 0 4',
  // donnees
  pie: 'M12 3v9h9A9 9 0 1 1 12 3zM15 3.5A9 9 0 0 1 20.5 9H15z',
  lineChart: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  database: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  layers: 'M12 3 2 8l10 5 10-5zM2 13l10 5 10-5M2 17.5l10 5 10-5',
  gauge: 'M4 18a8 8 0 1 1 16 0M12 18l4-6',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  report: 'M6 2h9l5 5v15H6zM9 13v5M12 10v8M15 15v3',
  // personnes
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  userPlus: 'M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M8.5 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM19 8v6M22 11h-6',
  briefcase: 'M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2',
  graduation: 'M22 10 12 5 2 10l10 5 10-5zM6 12v5c3 3 9 3 12 0v-5',
  award: 'M12 1a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM8.2 13.9 7 23l5-3 5 3-1.2-9.1',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  smile: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
  // lieux et operations
  building: 'M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 9h4a2 2 0 0 1 2 2v10M9 8h2M9 12h2M9 16h2',
  factory: 'M2 21h20M4 21V10l6 4V10l6 4V6h4v15',
  plane: 'M2 16l20-6-20-6 4 6zM6 10h8',
  tool: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z',
  leaf: 'M11 20A7 7 0 0 1 4 13c0-6 7-10 16-10 0 9-4 16-10 16zM4 21c3-5 7-8 11-10',
  health: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
}

/** Bibliotheques d'icones, classees par theme, pour les tableaux de bord. */
export const ICON_SETS: { id: string; fr: string; en: string; icons: string[] }[] = [
  { id: 'general', fr: 'Général', en: 'General', icons: ['home', 'star', 'settings', 'search', 'bell', 'info', 'check', 'alert', 'heart', 'flag', 'bookmark', 'calendar', 'clock', 'mail', 'link', 'globe', 'lock', 'filter', 'target', 'bolt'] },
  { id: 'finance', fr: 'Finance', en: 'Finance', icons: ['dollar', 'euro', 'wallet', 'card', 'bank', 'coins', 'receipt', 'percent', 'trendUp', 'trendDown'] },
  { id: 'commerce', fr: 'Commerce', en: 'Retail', icons: ['cart', 'bag', 'tag', 'store', 'box', 'truck', 'gift'] },
  { id: 'data', fr: 'Données', en: 'Data', icons: ['chart', 'lineChart', 'pie', 'table', 'database', 'layers', 'gauge', 'grid', 'file', 'report'] },
  { id: 'people', fr: 'Personnes', en: 'People', icons: ['users', 'user', 'userPlus', 'briefcase', 'graduation', 'award', 'chat', 'smile'] },
  { id: 'places', fr: 'Lieux et opérations', en: 'Places and operations', icons: ['map', 'building', 'factory', 'plane', 'tool', 'leaf', 'health'] },
]

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
