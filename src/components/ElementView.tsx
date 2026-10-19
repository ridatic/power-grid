import { Fragment, type CSSProperties, type ReactNode } from 'react'
import type { Colors, GridItem } from '../core/types'
import { mix } from '../core/color'
import { CITIES, LAND_PATHS, project } from './worldMap'

const BARS = [45, 70, 55, 90, 65, 80, 50, 75]

const PRODUCTS = [
  ['💻', 'MacBook Pro 14″', 'Électronique', '1 245', '497 000 €', '+18,2 %'],
  ['🪑', 'Chaise design', 'Maison & Jardin', '982', '245 500 €', '+12,7 %'],
  ['🧥', 'Veste en cuir', 'Mode', '876', '196 800 €', '+9,4 %'],
  ['🧘', 'Tapis de yoga', 'Sport', '743', '148 600 €', '+6,1 %'],
  ['🎧', 'Casque audio', 'Électronique', '612', '122 400 €', '+4,8 %'],
]

const LEGEND = [
  ['Électronique', '34,2 %'],
  ['Maison & Jardin', '22,8 %'],
  ['Mode', '18,5 %'],
  ['Sport', '12,4 %'],
  ['Autres', '12,1 %'],
]

const LINE = [136, 122, 114, 116, 115, 91, 98, 78, 66, 61, 43, 37]
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

interface Props {
  item: GridItem
  colors: Colors
  u: number // unite : largeur de la grille / 1192
  w: number
  h: number
  ts?: number // echelle du texte (1 = taille par defaut)
}

/** Apercu fidele d'un visuel, dessine par-dessus la carte du fond. Toutes les tailles sont en pixels de page. */
export function ElementView({ item, colors: c, u, w, h, ts = 1 }: Props) {
  const p = item.props ?? {}
  const f = (n: number) => `${n * u}px`
  // taille du texte, suivant le reglage « Taille du texte des visuels »
  const ft = (n: number) => `${n * u * ts}px`
  const box: CSSProperties = { position: 'absolute', inset: 0, boxSizing: 'border-box', overflow: 'hidden', display: 'flex' }
  const head = (title: string, right?: ReactNode): ReactNode => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: ft(11), fontWeight: 750, marginBottom: f(9), gap: f(8), color: c.text, flexShrink: 0 }}>
      <span>{title}</span>
      {right}
    </div>
  )
  const pill = (label: string): ReactNode => (
    <span style={{ border: `1px solid ${c.border}`, borderRadius: f(6), padding: `${f(5)} ${f(7)}`, fontSize: ft(9), fontWeight: 500, color: c.muted }}>{label} ⌄</span>
  )

  if (item.type === 'kpi') {
    const title = p.title ?? 'Indicateur'
    const value = p.value ?? '1 248'
    const padU = p.size === 'compact' ? 7 : p.size === 'large' ? 20 : 12
    // Le contenu s'adapte a la place disponible : on retire d'abord le texte secondaire, puis l'icone, puis la variation.
    const levels = [
      { sub: true, icon: true, varia: true, need: 94 },
      { sub: false, icon: true, varia: true, need: 79 },
      { sub: false, icon: false, varia: true, need: 64 },
      { sub: false, icon: false, varia: false, need: 45 },
    ]
    const fitH = (need: number) => h / ((need + padU * 2) * u)
    const lvl = levels.find((l) => fitH(l.need) >= 0.9) ?? levels[levels.length - 1]
    const needW = Math.max(value.length * 11.5, title.length * 5.4 + (lvl.icon ? 33 : 0)) + padU * 2 + 8
    const k = Math.max(0.4, Math.min(1, fitH(lvl.need), w / (needW * u)))
    const fk = (n: number) => `${n * u * k * ts}px`
    const pad = fk(padU)
    const align = p.align ?? 'left'
    const spark = (p.spark ?? true) && w / (u * k) > 150 && lvl.varia
    return (
      <div style={{ ...box, flexDirection: 'column', justifyContent: 'center', padding: pad, textAlign: align }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: fk(7), fontSize: fk(10), color: c.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}>
          {lvl.icon && <span style={{ display: 'grid', placeItems: 'center', width: fk(26), height: fk(26), borderRadius: fk(8), background: `linear-gradient(135deg, ${mix(c.accent, '#ffffff', 0.78)}, ${mix(c.accent, '#ffffff', 0.45)})`, color: mix(c.accent, '#000000', 0.45), fontSize: fk(13), flexShrink: 0 }}>{p.icon ?? '▤'}</span>}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        </div>
        <div style={{ fontSize: fk(19), lineHeight: 1.25, fontWeight: 800, letterSpacing: '-0.02em', margin: `${fk(lvl.icon ? 10 : 6)} 0 ${fk(lvl.varia ? 6 : 0)}`, whiteSpace: 'nowrap', color: c.text }}>{value}</div>
        {lvl.varia && (
          <div style={{ fontSize: fk(10), lineHeight: 1.3, fontWeight: 700, color: '#14a780', whiteSpace: 'nowrap' }}>
            ◆ {p.variation ?? '+4,2 %'}
            {lvl.sub && <small style={{ display: 'block', fontWeight: 400, color: c.muted, marginTop: fk(2), fontSize: fk(10), overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.sub ?? 'vs. période précédente'}</small>}
          </div>
        )}
        {spark && (
          <svg viewBox="0 0 50 20" style={{ position: 'absolute', right: pad, bottom: pad, width: fk(47), height: fk(18) }}>
            <path d="M1 17 L10 12 L18 15 L27 6 L34 10 L42 3 L49 1" fill="none" stroke={c.accent} strokeWidth="1.8" />
          </svg>
        )}
      </div>
    )
  }

  if (item.type === 'chart') {
    const variant = p.variant ?? 'bar'
    const title = p.title ?? ''
    const inner = f(13)
    if (variant === 'line') {
      return (
        <div style={{ ...box, flexDirection: 'column', padding: inner }}>
          {head(title, pill(p.sub ?? 'Mensuel'))}
          <svg viewBox="0 0 430 175" preserveAspectRatio="none" style={{ width: '100%', flex: 1, minHeight: 0, display: 'block' }}>
            <defs>
              <linearGradient id={`area-${item.id}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={c.accent} stopOpacity="0.28" />
                <stop offset="1" stopColor={c.accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            <g stroke={c.border} strokeWidth="1">
              <path d="M36 20H420 M36 55H420 M36 90H420 M36 125H420 M36 160H420" />
            </g>
            <g fill={c.muted} fontSize="9">
              {['200 k', '150 k', '100 k', '50 k', '0'].map((t, i) => (
                <text key={t} x={t === '0' ? 23 : t.length === 4 ? 9 : 1} y={23 + i * 35}>{t}</text>
              ))}
            </g>
            <path d={`M36 ${LINE[0]} ${LINE.map((y, i) => `L${36 + i * 34.9} ${y}`).join(' ')} L420 160 L36 160Z`} fill={`url(#area-${item.id})`} />
            <path d={`M36 ${LINE[0]} ${LINE.map((y, i) => `L${36 + i * 34.9} ${y}`).join(' ')}`} fill="none" stroke={c.accent} strokeWidth="2.4" strokeLinejoin="round" />
            <g fill={c.accent} stroke={c.border === '#2A3350' ? '#1A2132' : '#fff'} strokeWidth="1.5">
              {LINE.map((y, i) => <circle key={i} cx={36 + i * 34.9} cy={y} r="3" />)}
            </g>
            <g fill={c.muted} fontSize="9" textAnchor="middle">
              {MONTHS.map((m, i) => <text key={m} x={36 + i * 34.9} y="173">{m}</text>)}
            </g>
          </svg>
        </div>
      )
    }
    if (variant === 'donut') {
      const col = [c.data[0], c.data[1], c.data[2], c.data[3], c.data[6] ?? '#c4cde0']
      const size = Math.min(h - 60 * u, w * 0.45, 150 * u)
      return (
        <div style={{ ...box, flexDirection: 'column', padding: inner }}>
          {head(title, <span style={{ color: c.muted }}>•••</span>)}
          <div style={{ display: 'flex', alignItems: 'center', gap: f(14), flex: 1, minHeight: 0 }}>
            <div style={{ position: 'relative', width: size, height: size, borderRadius: '50%', flexShrink: 0, background: `conic-gradient(${col[0]} 0 34%, ${col[1]} 34% 52.5%, ${col[2]} 52.5% 71%, ${col[3]} 71% 83.4%, ${col[4]} 83.4%)` }}>
              <div style={{ position: 'absolute', inset: size * 0.2, borderRadius: '50%', background: c.border === '#2A3350' ? '#1A2132' : '#fff' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center', fontSize: ft(11), fontWeight: 800, color: c.text }}>
                1 248 320 €
                <small style={{ fontSize: ft(9), color: c.muted, fontWeight: 400, marginTop: f(3) }}>Total</small>
              </div>
            </div>
            <div style={{ flex: 1, display: 'grid', gap: f(11), minWidth: 0 }}>
              {LEGEND.map(([name, pct], i) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: f(6), fontSize: ft(9), color: c.muted, whiteSpace: 'nowrap' }}>
                  <i style={{ width: f(7), height: f(7), borderRadius: '50%', background: col[i], flexShrink: 0, display: 'block' }} />
                  {name}
                  <b style={{ marginLeft: 'auto', fontWeight: 600 }}>{pct}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
    return (
      <div style={{ ...box, flexDirection: 'column', padding: inner }}>
        {title && head(title)}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: f(10), minHeight: 0 }}>
          {BARS.map((b, i) => <i key={i} style={{ flex: 1, height: `${b}%`, background: c.data[i % c.data.length], borderRadius: f(3), display: 'block' }} />)}
        </div>
      </div>
    )
  }

  if (item.type === 'table') {
    const rows = Math.max(1, Math.min(PRODUCTS.length, Math.floor((h / u - 84) / 27)))
    const th: CSSProperties = { textAlign: 'left', background: c.border === '#2A3350' ? '#222B40' : '#f5f7fb', color: c.muted, padding: `${f(9)} ${f(8)}`, fontWeight: 700 }
    const td: CSSProperties = { padding: f(8), borderBottom: `1px solid ${c.border}`, color: c.text, opacity: 0.85 }
    return (
      <div style={{ ...box, flexDirection: 'column', padding: `${f(12)} ${f(13)}` }}>
        {head(p.title ?? 'Tableau', <span style={{ color: c.muted }}>•••</span>)}
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: ft(9), whiteSpace: 'nowrap' }}>
          <thead>
            <tr>{['Produit', 'Catégorie', 'Ventes', 'CA', 'Évolution'].map((t) => <th key={t} style={th}>{t}</th>)}</tr>
          </thead>
          <tbody>
            {PRODUCTS.slice(0, rows).map((r) => (
              <tr key={r[1]}>
                <td style={td}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: f(8) }}>
                    <span style={{ width: f(20), height: f(20), borderRadius: f(5), background: c.border, display: 'inline-grid', placeItems: 'center' }}>{r[0]}</span>
                    {r[1]}
                  </span>
                </td>
                <td style={td}>{r[2]}</td>
                <td style={td}>{r[3]}</td>
                <td style={td}>{r[4]}</td>
                <td style={{ ...td, color: '#15a57f', fontWeight: 700, opacity: 1 }}>◆ {r[5]} ▲</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (item.type === 'slicer') {
    if (p.variant === 'search' || p.variant === 'date') return null
    return (
      <div style={{ ...box, flexDirection: 'column', justifyContent: 'center', padding: f(12), gap: f(8) }}>
        <i style={{ display: 'block', width: '35%', height: f(7), borderRadius: 3, background: c.muted, opacity: 0.45 }} />
        <div style={{ display: 'flex', gap: f(8) }}>
          <i style={{ display: 'block', width: '28%', height: f(16), borderRadius: 99, background: c.accent, opacity: 0.9 }} />
          <i style={{ display: 'block', width: '28%', height: f(16), borderRadius: 99, background: c.border }} />
          <i style={{ display: 'block', width: '28%', height: f(16), borderRadius: 99, background: c.border }} />
        </div>
      </div>
    )
  }

  if (item.type === 'map') {
    const dark = c.border === '#2A3350'
    const land = dark ? '#334063' : '#D3DAE5'
    const sea = dark ? '#151B2A' : '#EEF3F9'
    const ctrl: CSSProperties = { width: f(18), height: f(18), display: 'grid', placeItems: 'center', fontSize: ft(12), fontWeight: 700, color: c.muted, background: dark ? '#1A2132' : '#fff' }
    return (
      <div style={{ ...box, flexDirection: 'column', padding: f(12) }}>
        {head(p.title ?? 'Ventes par pays')}
        <div style={{ position: 'relative', flex: 1, minHeight: 0, borderRadius: f(6), overflow: 'hidden', background: sea }}>
          <svg viewBox="-4 8 368 140" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block' }}>
            <g fill={land} stroke={sea} strokeWidth="0.6" strokeLinejoin="round">
              {LAND_PATHS.map((d, i) => <path key={i} d={d} />)}
            </g>
            {CITIES.map(([lon, lat, size], i) => {
              const [x, y] = project(lon, lat)
              const col = c.data[i % 2 === 0 ? 0 : 1]
              return <circle key={i} cx={x} cy={y} r={3 + size * 7} fill={col} fillOpacity="0.45" stroke={col} strokeWidth="1" />
            })}
          </svg>
          <div style={{ position: 'absolute', right: f(6), top: f(6), display: 'flex', flexDirection: 'column', borderRadius: f(4), overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }}>
            <span style={ctrl}>+</span>
            <span style={{ ...ctrl, borderTop: `1px solid ${c.border}` }}>−</span>
          </div>
        </div>
      </div>
    )
  }

  if (item.type === 'logo') {
    if (p.variant === 'avatar') return null
    return (
      <div style={{ ...box, alignItems: 'center', justifyContent: 'center', border: `1px dashed ${c.muted}`, borderRadius: 'inherit' }}>
        <i style={{ display: 'block', width: '46%', aspectRatio: '1', borderRadius: '50%', background: c.accent, opacity: 0.8 }} />
      </div>
    )
  }

  if (item.type === 'icon') return null
  if (item.type === 'image') {
    if (p.src) return null
    return (
      <div style={{ ...box, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: f(6), border: `${Math.max(1, u)}px dashed ${c.muted}`, borderRadius: 'inherit', color: c.muted, fontSize: ft(10), textAlign: 'center', padding: f(8) }}>
        <svg width={18 * u} height={18 * u} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></svg>
        Image
      </div>
    )
  }
  if (item.type === 'text' && p.text) return null
  if (item.type === 'text') {
    return (
      <div style={{ ...box, flexDirection: 'column', justifyContent: 'center', gap: f(8), padding: f(14), border: `1px dashed ${c.muted}`, borderRadius: 'inherit' }}>
        {[90, 60].map((x) => <Fragment key={x}><i style={{ display: 'block', width: `${x}%`, height: f(7), borderRadius: 3, background: c.muted, opacity: 0.5 }} /></Fragment>)}
      </div>
    )
  }

  return null
}
