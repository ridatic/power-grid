import type { Config } from './types'
import { resolveColors } from './layout'

type Json = Record<string, unknown>
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Fusionne b dans a : les objets sont fusionnes, le reste est remplace. */
export function deepMerge(a: Json, b: Json): Json {
  const out: Json = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k] as Json, v) : v
  return out
}

/** Theme Power BI (Affichage > Themes > Parcourir les themes). Les visuels sont transparents : les cartes sont dessinees dans le fond. */
export function buildTheme(cfg: Config): Json {
  const c = resolveColors(cfg)
  const text = (size: number, bold = false) => ({
    fontSize: size,
    fontFace: cfg.font,
    color: c.text,
    ...(bold ? { fontWeight: 'bold' } : {}),
  })
  const base: Json = {
    name: `Power-Grid ${cfg.paletteId} ${cfg.mode}`,
    dataColors: c.data,
    background: c.card,
    foreground: c.text,
    tableAccent: c.accent,
    good: '#2E9E6B',
    neutral: '#E0A100',
    bad: '#D64545',
    maximum: c.data[0],
    center: c.data[3],
    minimum: c.data[2],
    textClasses: {
      callout: text(cfg.titleSize + 8, true),
      title: text(cfg.cardSize + 2, true),
      header: text(cfg.cardSize + 2, true),
      label: text(cfg.textSize),
    },
    visualStyles: {
      '*': {
        '*': {
          background: [{ show: false }],
          border: [{ show: false }],
          title: [{ show: true, fontColor: { solid: { color: c.text } }, fontFamily: cfg.font, fontSize: cfg.cardSize + 2 }],
        },
      },
      page: {
        '*': {
          background: [{ color: { solid: { color: c.bg } }, transparency: 0 }],
          outspace: [{ color: { solid: { color: c.bg } } }],
        },
      },
    },
  }
  return cfg.extraTheme ? deepMerge(base, cfg.extraTheme) : base
}
