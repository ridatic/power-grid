import type { Lang } from './i18n'

/** Preferences de l'interface, gardees dans ce navigateur. */
export type UiTheme = 'light' | 'dark'

export function loadTheme(): UiTheme {
  try {
    const v = localStorage.getItem('power-grid.ui-theme')
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* stockage indisponible */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function loadLang(): Lang {
  try {
    return localStorage.getItem('power-grid.lang') === 'en' ? 'en' : 'fr'
  } catch {
    return 'fr'
  }
}

export function savePref(key: 'ui-theme' | 'lang' | 'settings' | 'panel', value: string) {
  try {
    localStorage.setItem(`power-grid.${key}`, value)
  } catch {
    /* preference non sauvegardee */
  }
}

/** Panneau de reglages de l'editeur : largeur choisie et ouvert ou replie. */
export interface PanelPref {
  width: number
  open: boolean
}
export const PANEL_MIN = 260
export const PANEL_MAX = 560
export const PANEL_DEFAULT = 300

export function loadPanel(): PanelPref {
  try {
    const v = JSON.parse(localStorage.getItem('power-grid.panel') ?? '{}') as Partial<PanelPref>
    const width = typeof v.width === 'number' ? Math.min(PANEL_MAX, Math.max(PANEL_MIN, v.width)) : PANEL_DEFAULT
    return { width, open: v.open !== false }
  } catch {
    return { width: PANEL_DEFAULT, open: true }
  }
}

/** Parametres de l'application (gardes dans ce navigateur). */
export interface AppSettings {
  autosave: boolean // fichiers enregistres automatiquement
  showGrid: boolean // grille affichee a l'ouverture de l'editeur
  showSlots: boolean // emplacements Power BI affiches a l'ouverture
  newSize: string // taille des nouveaux fichiers vierges, ex. 1440x900
  newPalette: string // palette des nouveaux fichiers vierges
  newFont: string // police des nouveaux fichiers vierges
}

export const DEFAULT_SETTINGS: AppSettings = { autosave: true, showGrid: false, showSlots: false, newSize: '1440x900', newPalette: 'ember', newFont: 'Segoe UI' }

export function loadSettings(): AppSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem('power-grid.settings') ?? '{}') as Partial<AppSettings>) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(s: AppSettings) {
  savePref('settings', JSON.stringify(s))
}
