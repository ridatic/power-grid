import type { ReactNode } from 'react'
import type { NavFrame, MenuStyle } from '../core/types'

const DARK = '#3F3F46'
const SOFT = '#E4E4E7'
const ACCENT = '#EA580C'

/** Schemas des cadres de navigation (neutres : la couleur appartient au rapport, pas a l'outil). */
export function NavThumb({ frame }: { frame: NavFrame }) {
  const body = (x: number, y: number): ReactNode => (
    <>
      <rect x={x} y={y} width={60 - x} height="6" rx="1.5" fill={SOFT} />
      <rect x={x} y={y + 9} width={(60 - x) / 2 - 1} height="14" rx="1.5" fill={SOFT} />
      <rect x={x + (60 - x) / 2 + 1} y={y + 9} width={(60 - x) / 2 - 1} height="14" rx="1.5" fill={SOFT} />
    </>
  )
  let shape: ReactNode
  switch (frame) {
    case 'sidebar':
      shape = <><rect x="2" y="2" width="12" height="36" rx="2" fill={DARK} /><rect x="4" y="10" width="8" height="3" rx="1" fill={ACCENT} />{body(18, 4)}</>
      break
    case 'floating':
      shape = <><rect x="4" y="5" width="12" height="30" rx="5" fill={DARK} /><rect x="6" y="12" width="8" height="3" rx="1" fill={ACCENT} />{body(20, 4)}</>
      break
    case 'rail':
      shape = <><rect x="2" y="2" width="7" height="36" rx="2" fill={DARK} /><circle cx="5.5" cy="12" r="1.8" fill={ACCENT} />{body(13, 4)}</>
      break
    case 'toprail':
      shape = <><rect x="2" y="2" width="60" height="7" rx="2" fill={DARK} /><rect x="2" y="11" width="7" height="27" rx="2" fill="#71717A" /><circle cx="5.5" cy="17" r="1.8" fill={ACCENT} />{body(13, 12)}</>
      break
    case 'tabs':
      shape = <><rect x="2" y="2" width="60" height="8" rx="2" fill={DARK} />{[5, 22, 39].map((x) => <rect key={x} x={x} y="4.5" width="14" height="3" rx="1" fill={x === 5 ? ACCENT : '#A1A1AA'} />)}{body(4, 14)}</>
      break
    case 'notch':
      shape = <><rect x="2" y="2" width="60" height="9" rx="2" fill={DARK} /><path d="M6 11V7Q6 4 9 4H20Q23 4 23 7V11Z" fill="#fff" />{body(4, 15)}</>
      break
    case 'folder':
      shape = <><path d="M3 11V6Q3 3 6 3H18Q21 3 21 6V11Z" fill={ACCENT} /><path d="M24 11V6Q24 3 27 3H38Q41 3 41 6V11Z" fill={DARK} /><path d="M44 11V6Q44 3 47 3H58Q61 3 61 6V11Z" fill={DARK} />{body(4, 15)}</>
      break
    case 'filter':
      shape = <><rect x="2" y="2" width="17" height="36" rx="2" fill={DARK} />{[6, 11].map((y) => <rect key={y} x="5" y={y} width="11" height="2.5" rx="1" fill={y === 6 ? ACCENT : '#A1A1AA'} />)}{[18, 25].map((y) => <rect key={y} x="5" y={y} width="11" height="5" rx="1.5" fill="#71717A" />)}{body(23, 4)}</>
      break
    case 'capsule':
      shape = <><rect x="14" y="4" width="36" height="9" rx="4.5" fill={DARK} /><rect x="16" y="5.5" width="11" height="6" rx="3" fill={ACCENT} />{body(4, 17)}</>
      break
    default:
      shape = <>{body(4, 6)}</>
  }
  return (
    <svg viewBox="0 0 64 40" width="100%" height="100%" aria-hidden="true">
      <rect width="64" height="40" fill="#FAFAFA" />
      {shape}
    </svg>
  )
}

/** Schemas des styles de menu principal. */
export function MenuThumb({ style }: { style: MenuStyle }) {
  const line = (x: number, y: number, w: number) => <rect key={`${x}${y}`} x={x} y={y} width={w} height="3" rx="1" fill={SOFT} />
  let shape: ReactNode
  switch (style) {
    case 'story':
      shape = <><rect x="2" y="2" width="20" height="36" rx="2" fill={DARK} /><rect x="27" y="8" width="22" height="4" rx="1" fill={ACCENT} />{[18, 24, 30].map((y) => line(27, y, 34))}</>
      break
    case 'banner':
      shape = <><rect x="2" y="2" width="60" height="15" rx="2" fill={DARK} /><rect x="6" y="7" width="20" height="3" rx="1" fill="#fff" />{[4, 24, 44].map((x) => <rect key={x} x={x} y="22" width="16" height="12" rx="2" fill={SOFT} />)}</>
      break
    case 'image':
      shape = <><rect x="2" y="2" width="26" height="36" rx="2" fill={DARK} />{[7, 16, 25].map((y) => <rect key={y} x="33" y={y} width="27" height="6" rx="2" fill={SOFT} />)}</>
      break
    case 'cover':
      shape = <><rect x="2" y="2" width="60" height="36" rx="2" fill={DARK} /><rect x="18" y="12" width="28" height="4" rx="1" fill="#fff" />{[8, 25, 42].map((x) => <rect key={x} x={x} y="26" width="14" height="5" rx="2.5" fill="#fff" opacity="0.4" />)}</>
      break
    case 'tiles':
      shape = <><rect x="5" y="4" width="22" height="4" rx="1" fill={DARK} />{[[4, 12], [34, 12], [4, 26], [34, 26]].map(([x, y]) => <rect key={`${x}${y}`} x={x} y={y} width="26" height="11" rx="2" fill={x === 4 && y === 12 ? ACCENT : SOFT} />)}</>
      break
    default:
      shape = <><rect x="2" y="2" width="30" height="36" rx="2" fill={DARK} /><rect x="6" y="14" width="20" height="4" rx="1" fill="#fff" />{[10, 19, 28].map((y) => <rect key={y} x="37" y={y} width="23" height="6" rx="2" fill={SOFT} />)}</>
  }
  return (
    <svg viewBox="0 0 64 40" width="100%" height="100%" aria-hidden="true">
      <rect width="64" height="40" fill="#FAFAFA" />
      {shape}
    </svg>
  )
}
