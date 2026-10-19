import type { Config } from './core/types'
import type { Tab } from './components/Panels'
import { DEFAULT_CONFIG } from './store'

type Key = keyof Config

/** Reglages de chaque onglet, pour les remettre a leur valeur par defaut. */
export const TAB_KEYS: Record<Exclude<Tab, 'templates' | 'media'>, Key[]> = {
  colors: ['paletteId', 'colors', 'mode', 'pageBg'],
  nav: ['navFrame', 'navTone', 'navInk', 'navFill', 'navActive', 'navPos', 'tabCorner', 'filterSlots', 'navLabels', 'navIcons', 'navDecor', 'navUser', 'iconStyle', 'iconWeight', 'iconBacking'],
  layout: ['radius', 'cardStyle', 'cardColor', 'shadow', 'texture', 'cardSize', 'hide', 'labelZones'],
  text: ['showHeader', 'headerBand', 'title', 'subtitle', 'company', 'font', 'logoKind', 'logoIcon', 'logoImage', 'userName', 'userRole', 'footer', 'linkedin', 'website', 'titleSize', 'textSize'],
}

/** Format de la page, regle dans l'onglet Disposition. */
export const FORMAT_KEYS: Key[] = ['width', 'height', 'margin', 'density']

/** Le theme : tout ce qui touche a l'apparence, sans les textes saisis. */
export const THEME_KEYS: Key[] = [...TAB_KEYS.colors, ...TAB_KEYS.nav, ...TAB_KEYS.layout, ...FORMAT_KEYS, 'showHeader', 'headerBand', 'font', 'titleSize', 'textSize', 'logoKind', 'logoIcon', 'menu']

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

export const isChanged = (cfg: Config, keys: Key[]) => keys.some((k) => !same(cfg[k], DEFAULT_CONFIG[k]))

export const defaultsOf = (keys: Key[]): Partial<Config> => Object.fromEntries(keys.map((k) => [k, DEFAULT_CONFIG[k]]))
