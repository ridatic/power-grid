import type { IconBacking, IconStyle, IconWeight } from './icons'

export type Mode = 'light' | 'dark'
export type PageBg = 'soft' | 'plain' | 'warm'
export type Density = 'comfortable' | 'balanced' | 'dense'
export type ElementType = 'kpi' | 'chart' | 'table' | 'slicer' | 'map' | 'text' | 'logo' | 'header'

export type NavFrame = 'sidebar' | 'floating' | 'rail' | 'toprail' | 'tabs' | 'notch' | 'folder' | 'filter' | 'capsule' | 'none'
export type NavTone = 'navy' | 'brand' | 'color' | 'tint' | 'paper'
export type NavInk = 'auto' | 'accent' | 'mono'
export type NavFill = 'solid' | 'gradient'
export type NavActive = 'accent' | 'fill' | 'edge'
export type NavPos = 'top' | 'middle' | 'bottom'
export type TabCorner = 'sm' | 'md' | 'lg' | 'round'

export type MenuStyle = 'story' | 'banner' | 'image' | 'cover' | 'tiles' | 'split'
export type MenuBlur = 'none' | 'soft' | 'strong'
export type MenuDarken = 'light' | 'medium' | 'heavy'

export type CardStyle = 'plain' | 'band' | 'tick'
export type CardColor = 'paper' | 'tint' | 'color' | 'nav'
export type Texture = 'none' | 'glow' | 'dots'
export type LogoKind = 'bolt' | 'slot' | 'mark' | 'letter' | 'icon' | 'upload'

export interface Palette {
  id: string
  name: { fr: string; en: string }
  colors: string[] // 8 couleurs de donnees, la premiere sert d'accent
  industry: string
  feeling: string
  tone: string
}

export interface MenuConfig {
  style: MenuStyle
  image: string | null // data URL
  blur: MenuBlur
  darken: MenuDarken
  fit: 'fill' | 'fit'
  side: 'left' | 'right'
  useOn: 'menu' | 'all'
  labels: 'baked' | 'blank'
  labelColor: 'auto' | 'white' | 'palette'
}

/** Reglages communs a toutes les pages du rapport. */
export interface Config {
  width: number
  height: number
  mode: Mode
  margin: number // marge interieure de la page
  pageBg: PageBg
  density: Density // espace entre les zones
  hide: ElementType[] // types de zones masques

  paletteId: string // identifiant d'une palette, ou 'custom'
  colors: string[] // les 8 couleurs du theme, la premiere est l'accent

  navFrame: NavFrame
  navTone: NavTone
  navInk: NavInk
  navFill: NavFill
  navActive: NavActive
  navPos: NavPos
  tabCorner: TabCorner
  filterSlots: number // 2 a 5
  navLabels: 'powerbi' | 'fixed'
  navIcons: boolean
  navDecor: boolean // motif dore en bas de la navigation
  navUser: boolean // utilisateur affiche en bas de la navigation
  userName: string
  userRole: string
  headerBand: boolean

  title: string // un mot entre astérisques est colorie
  company: string // nom de l'espace, affiche a cote du logo
  subtitle: string
  footer: string
  linkedin: string
  website: string
  showHeader: boolean
  font: string
  textSize: number
  titleSize: number
  cardSize: number

  iconStyle: IconStyle
  iconWeight: IconWeight
  iconBacking: IconBacking
  logoKind: LogoKind
  logoIcon: string
  logoImage: string | null

  cardStyle: CardStyle
  cardColor: CardColor
  radius: number
  shadow: boolean
  texture: Texture
  labelZones: boolean

  menu: MenuConfig
  extraTheme: Record<string, unknown> | null
  extraThemeName: string
}

/** Textes et reglages d'un visuel, utilises pour l'apercu. */
export interface ItemProps {
  title?: string
  value?: string
  variation?: string
  sub?: string
  icon?: string
  variant?: string // line, donut, bar, search, date, avatar
  align?: 'left' | 'center' | 'right'
  size?: 'compact' | 'medium' | 'large'
  spark?: boolean
}

/** Un element pose sur la grille. col et row commencent a 1. */
export interface GridItem {
  id: string
  type: ElementType
  col: number
  row: number
  cs: number // nombre de colonnes
  rs: number // nombre de lignes
  props?: ItemProps
}

export interface PageData {
  id: string
  name: string
  kind: 'content' | 'menu'
  icon: string | null // null : icone automatique
  items: GridItem[]
  rows?: number[] // poids de hauteur des 8 lignes (egaux si absent)
}

export interface Project {
  cfg: Config
  pages: PageData[]
  active: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Colors {
  bg: string
  card: string
  border: string
  text: string
  muted: string
  accent: string
  data: string[]
}
