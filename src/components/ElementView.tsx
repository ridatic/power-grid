import { Fragment, type CSSProperties, type ReactNode } from 'react'
import type { Colors, GridItem } from '../core/types'
import { mix } from '../core/color'

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
}

/** Apercu fidele d'un visuel, dessine par-dessus la carte du fond. Toutes les tailles sont en pixels de page. */
export function ElementView({ item, colors: c, u, w, h }: Props) {
  const p = item.props ?? {}
  const f = (n: number) => `${n * u}px`
  const box: CSSProperties = { position: 'absolute', inset: 0, boxSizing: 'border-box', overflow: 'hidden', display: 'flex' }
  const head = (title: string, right?: ReactNode): ReactNode => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: f(11), fontWeight: 750, marginBottom: f(9), gap: f(8), color: c.text, flexShrink: 0 }}>
      <span>{title}</span>
      {right}
    </div>
  )
  const pill = (label: string): ReactNode => (
    <span style={{ border: `1px solid ${c.border}`, borderRadius: f(6), padding: `${f(5)} ${f(7)}`, fontSize: f(9), fontWeight: 500, color: c.muted }}>{label} ⌄</span>
  )

  if (item.type === 'kpi') {
    const pad = f(p.size === 'compact' ? 7 : p.size === 'large' ? 20 : 12)
    const align = p.align ?? 'left'
    const spark = p.spark ?? true
    return (
      <div style={{ ...box, flexDirection: 'column', justifyContent: 'center', padding: pad, textAlign: align }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: f(7), fontSize: f(10), color: c.muted, whiteSpace: 'nowrap', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}>
          <span style={{ display: 'grid', placeItems: 'center', width: f(26), height: f(26), borderRadius: f(8), background: `linear-gradient(135deg, ${mix(c.accent, '#ffffff', 0.78)}, ${mix(c.accent, '#ffffff', 0.45)})`, color: mix(c.accent, '#000000', 0.45), fontSize: f(13), flexShrink: 0 }}>{p.icon ?? '▤'}</span>
          {p.title ?? 'Indicateur'}
        </div>
        <div style={{ fontSize: f(19), fontWeight: 800, letterSpacing: '-0.02em', margin: `${f(10)} 0 ${f(6)}`, whiteSpace: 'nowrap', color: c.text }}>{p.value ?? '1 248'}</div>
        <div style={{ fontSize: f(10), fontWeight: 700, color: '#14a780' }}>
          ◆ {p.variation ?? '+4,2 %'}
          <small style={{ display: 'block', fontWeight: 400, color: c.muted, marginTop: f(2), fontSize: f(10) }}>{p.sub ?? 'vs. période précédente'}</small>
        </div>
        {spark && (
          <svg viewBox="0 0 50 20" style={{ position: 'absolute', right: pad, bottom: f(12), width: f(47), height: f(18) }}>
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
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center', fontSize: f(11), fontWeight: 800, color: c.text }}>
                1 248 320 €
                <small style={{ fontSize: f(9), color: c.muted, fontWeight: 400, marginTop: f(3) }}>Total</small>
              </div>
            </div>
            <div style={{ flex: 1, display: 'grid', gap: f(11), minWidth: 0 }}>
              {LEGEND.map(([name, pct], i) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: f(6), fontSize: f(9), color: c.muted, whiteSpace: 'nowrap' }}>
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
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: f(9), whiteSpace: 'nowrap' }}>
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
    return (
      <div
        style={{
          ...box,
          backgroundImage: `radial-gradient(${c.accent} 0 28%, transparent 30%), radial-gradient(${c.data[1]} 0 22%, transparent 24%), radial-gradient(${c.border} 0 12%, transparent 14%)`,
          backgroundSize: `22% 38%, 17% 28%, ${f(20)} ${f(20)}`,
          backgroundPosition: '28% 40%, 64% 62%, 0 0',
          opacity: 0.55,
        }}
      />
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

  if (item.type === 'text') {
    return (
      <div style={{ ...box, flexDirection: 'column', justifyContent: 'center', gap: f(8), padding: f(14), border: `1px dashed ${c.muted}`, borderRadius: 'inherit' }}>
        {[90, 60].map((x) => <Fragment key={x}><i style={{ display: 'block', width: `${x}%`, height: f(7), borderRadius: 3, background: c.muted, opacity: 0.5 }} /></Fragment>)}
      </div>
    )
  }

  return null
}
