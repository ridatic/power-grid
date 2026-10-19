import type { Palette } from './types'
import { hexToRgb, hslToHex, rgbToHsl } from './color'

type Scheme = 'analogous' | 'complementary' | 'triad' | 'mono'

const OFFSETS: Record<Scheme, number[]> = {
  analogous: [0, 28, -28, 56, -56, 150, 180, 210],
  complementary: [0, 180, 24, 204, -24, 156, 48, 228],
  triad: [0, 120, 240, 30, 150, 270, 60, 180],
  mono: [0, 0, 0, 0, 0, 0, 180, 30],
}

/** 8 couleurs de donnees a partir d'une couleur de base : la premiere est la couleur de base. */
export function generate(base: string, scheme: Scheme = 'analogous'): string[] {
  const [h, s, l] = rgbToHsl(hexToRgb(base))
  const sat = Math.min(0.8, Math.max(0.35, s))
  const lights = scheme === 'mono' ? [l, 0.3, 0.45, 0.6, 0.72, 0.84, 0.5, 0.58] : [l, 0.55, 0.42, 0.62, 0.34, 0.5, 0.58, 0.45]
  return OFFSETS[scheme].map((off, i) => (i === 0 ? base.toUpperCase() : hslToHex(h + off, scheme === 'mono' && i < 6 ? sat * 0.7 : sat, lights[i])))
}

export type Industry = 'finance' | 'health' | 'retail' | 'tech' | 'energy' | 'education' | 'industry' | 'realestate' | 'travel' | 'public'
export type Feeling = 'trust' | 'energetic' | 'calm' | 'luxury' | 'natural' | 'warm'
export type Tone = 'cool' | 'warm' | 'neutral' | 'vivid' | 'pastel'

export const INDUSTRIES: { id: Industry; fr: string; en: string }[] = [
  { id: 'finance', fr: 'Finance', en: 'Finance' },
  { id: 'health', fr: 'Santé', en: 'Health' },
  { id: 'retail', fr: 'Commerce', en: 'Retail' },
  { id: 'tech', fr: 'Technologie', en: 'Tech' },
  { id: 'energy', fr: 'Énergie', en: 'Energy' },
  { id: 'education', fr: 'Éducation', en: 'Education' },
  { id: 'industry', fr: 'Industrie', en: 'Industry' },
  { id: 'realestate', fr: 'Immobilier', en: 'Real estate' },
  { id: 'travel', fr: 'Voyage', en: 'Travel' },
  { id: 'public', fr: 'Secteur public', en: 'Public sector' },
]
export const FEELINGS: { id: Feeling; fr: string; en: string }[] = [
  { id: 'trust', fr: 'Confiance', en: 'Trust' },
  { id: 'energetic', fr: 'Énergie', en: 'Energetic' },
  { id: 'calm', fr: 'Calme', en: 'Calm' },
  { id: 'luxury', fr: 'Prestige', en: 'Luxury' },
  { id: 'natural', fr: 'Naturel', en: 'Natural' },
  { id: 'warm', fr: 'Chaleureux', en: 'Warm' },
]
export const TONES: { id: Tone; fr: string; en: string }[] = [
  { id: 'cool', fr: 'Froid', en: 'Cool' },
  { id: 'warm', fr: 'Chaud', en: 'Warm' },
  { id: 'neutral', fr: 'Neutre', en: 'Neutral' },
  { id: 'vivid', fr: 'Vif', en: 'Vivid' },
  { id: 'pastel', fr: 'Pastel', en: 'Pastel' },
]

const P = (id: string, fr: string, en: string, base: string, scheme: Scheme, industry: Industry, feeling: Feeling, tone: Tone): Palette => ({
  id,
  name: { fr, en },
  colors: generate(base, scheme),
  industry,
  feeling,
  tone,
})

const E = (id: string, fr: string, en: string, colors: string[], industry: Industry, feeling: Feeling, tone: Tone): Palette => ({ id, name: { fr, en }, colors, industry, feeling, tone })

export const PALETTES: Palette[] = [
  E('ember', 'Braise', 'Ember', ['#EA580C', '#1E3A8A', '#F59E0B', '#0EA5E9', '#10B981', '#E11D48', '#94A3B8', '#334155'], 'energy', 'energetic', 'warm'),
  E('sun', 'Solaire', 'Sun', ['#F6B91A', '#7856E8', '#3976F6', '#8CA7F8', '#19A985', '#F17B53', '#C4CDE0', '#14223C'], 'energy', 'energetic', 'warm'),
  P('navy', 'Bleu marine', 'Navy', '#1F3A5F', 'complementary', 'finance', 'trust', 'cool'),
  P('bank', 'Banque', 'Banking', '#0B5394', 'analogous', 'finance', 'trust', 'cool'),
  P('gold', 'Or et nuit', 'Gold and night', '#B8892B', 'complementary', 'finance', 'luxury', 'warm'),
  P('clinic', 'Clinique', 'Clinic', '#0E8F8F', 'analogous', 'health', 'calm', 'cool'),
  P('care', 'Soin', 'Care', '#3FA796', 'triad', 'health', 'natural', 'pastel'),
  P('market', 'Marché', 'Market', '#E4572E', 'complementary', 'retail', 'energetic', 'vivid'),
  P('boutique', 'Boutique', 'Boutique', '#C2185B', 'analogous', 'retail', 'luxury', 'vivid'),
  P('orange', 'Orange vif', 'Bright orange', '#F28C28', 'triad', 'retail', 'warm', 'warm'),
  P('violet', 'Violet moderne', 'Modern violet', '#5B3FD1', 'analogous', 'tech', 'energetic', 'vivid'),
  P('cyber', 'Cyan numérique', 'Digital cyan', '#0891B2', 'complementary', 'tech', 'trust', 'cool'),
  P('slate', 'Ardoise', 'Slate', '#475569', 'mono', 'tech', 'calm', 'neutral'),
  P('solar', 'Solaire', 'Solar', '#F5B700', 'complementary', 'energy', 'energetic', 'warm'),
  P('wind', 'Éolien', 'Wind', '#2A9D8F', 'analogous', 'energy', 'natural', 'cool'),
  P('grid', 'Réseau', 'Grid', '#1D4ED8', 'triad', 'energy', 'trust', 'vivid'),
  P('campus', 'Campus', 'Campus', '#7C3AED', 'triad', 'education', 'energetic', 'vivid'),
  P('school', 'Tableau noir', 'Chalkboard', '#2F5D50', 'analogous', 'education', 'calm', 'neutral'),
  P('steel', 'Acier', 'Steel', '#4B5563', 'complementary', 'industry', 'trust', 'neutral'),
  P('safety', 'Sécurité', 'Safety', '#F59E0B', 'analogous', 'industry', 'energetic', 'warm'),
  P('estate', 'Immobilier', 'Estate', '#8B6F47', 'analogous', 'realestate', 'warm', 'warm'),
  P('skyline', 'Horizon', 'Skyline', '#3B6EA8', 'analogous', 'realestate', 'calm', 'cool'),
  P('ocean', 'Océan', 'Ocean', '#0B6E99', 'analogous', 'travel', 'calm', 'cool'),
  P('sunset', 'Coucher de soleil', 'Sunset', '#D1495B', 'triad', 'travel', 'warm', 'warm'),
  P('civic', 'Civique', 'Civic', '#27548A', 'complementary', 'public', 'trust', 'cool'),
  P('forest', 'Forêt', 'Forest', '#2D6A4F', 'analogous', 'public', 'natural', 'neutral'),
  P('mint', 'Menthe', 'Mint', '#66C2A5', 'analogous', 'health', 'calm', 'pastel'),
  P('blush', 'Rose poudré', 'Blush', '#E58FAE', 'analogous', 'retail', 'warm', 'pastel'),
  P('mono', 'Monochrome', 'Mono', '#111827', 'mono', 'finance', 'luxury', 'neutral'),
]

export const FONTS = ['Segoe UI', 'Arial', 'Calibri', 'Verdana', 'Tahoma', 'Georgia', 'Trebuchet MS']

/** Palette a partir d'une couleur de marque. */
export const paletteFromAccent = (hex: string) => generate(hex, 'analogous')

/** Palette extraite d'une image : couleurs dominantes, les plus vives en premier. */
export async function paletteFromImage(file: File): Promise<string[]> {
  const bmp = await createImageBitmap(file)
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bmp, 0, 0, size, size)
  const data = ctx.getImageData(0, 0, size, size).data
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>()
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue
    const key = ((data[i] >> 5) << 6) | ((data[i + 1] >> 5) << 3) | (data[i + 2] >> 5)
    const b = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    b.n++
    b.r += data[i]
    b.g += data[i + 1]
    b.b += data[i + 2]
    buckets.set(key, b)
  }
  const cols = [...buckets.values()]
    .map((b) => {
      const hex = '#' + [b.r, b.g, b.b].map((v) => Math.round(v / b.n).toString(16).padStart(2, '0')).join('')
      const [, s, l] = rgbToHsl(hexToRgb(hex))
      return { hex, score: b.n * (0.35 + s) * (1 - Math.abs(l - 0.5)) }
    })
    .sort((a, b) => b.score - a.score)
  const picked: string[] = []
  for (const c of cols) {
    const [h] = rgbToHsl(hexToRgb(c.hex))
    const far = picked.every((p) => {
      const [ph] = rgbToHsl(hexToRgb(p))
      const d = Math.abs(h - ph)
      return Math.min(d, 360 - d) > 18
    })
    if (far) picked.push(c.hex)
    if (picked.length === 8) break
  }
  const out = picked.length ? picked : [cols[0]?.hex ?? '#2563eb']
  return out.length >= 8 ? out : [...out, ...generate(out[0], 'analogous').slice(out.length, 8)]
}
