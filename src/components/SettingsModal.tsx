import { useEffect } from 'react'
import { PALETTES, FONTS } from '../core/palettes'
import { useFeedback } from '../feedback'
import type { AppSettings, UiTheme } from '../prefs'
import type { ModelStore } from '../storage'
import { Icon } from './Icon'
import { Seg, Switch } from './ui'
import type { Lang } from '../i18n'

const SIZES = ['1440x900', '1280x720', '1920x1080', '1920x1280', '960x720']

interface Props {
  lang: Lang
  onLang: (l: Lang) => void
  uiTheme: UiTheme
  onUiTheme: (t: UiTheme) => void
  settings: AppSettings
  onSettings: (s: AppSettings) => void
  store: ModelStore
  onClose: () => void
}

/** Parametres de l'application : interface, editeur, pages vierges, donnees. */
export function SettingsModal({ lang, onLang, uiTheme, onUiTheme, settings, onSettings, store, onClose }: Props) {
  const fb = useFeedback()
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const set = (patch: Partial<AppSettings>) => onSettings({ ...settings, ...patch })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const clearLocal = async () => {
    const ok = await fb.confirm({
      title: tr('Effacer les données de ce navigateur ?', 'Clear this browser data?'),
      message: tr('Les modèles, favoris et images gardés sans compte sur cet appareil, ainsi que vos préférences, sont supprimés. Les données de votre compte ne sont pas touchées.', 'Models, favorites and images kept without an account on this device, and your preferences, are deleted. Your account data is not touched.'),
      confirmLabel: tr('Effacer', 'Clear'),
      danger: true,
    })
    if (!ok) return
    Object.keys(localStorage).filter((k) => k.startsWith('power-grid.')).forEach((k) => localStorage.removeItem(k))
    fb.toast(tr('Données de ce navigateur effacées', 'Browser data cleared'))
    window.location.reload()
  }

  return (
    <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog settings" role="dialog" aria-modal="true" aria-label={tr('Paramètres', 'Settings')}>
        <div className="dialog-head">
          <h2>{tr('Paramètres', 'Settings')}</h2>
          <button className="icon-btn" aria-label={tr('Fermer', 'Close')} onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="settings-body">
          <section>
            <h3>{tr('Interface', 'Interface')}</h3>
            <div className="set-row">
              <div><b>{tr('Langue', 'Language')}</b><small>{tr('Langue des menus et des messages.', 'Language of menus and messages.')}</small></div>
              <Seg value={lang} onChange={onLang} options={[{ v: 'fr', label: 'Français' }, { v: 'en', label: 'English' }]} />
            </div>
            <div className="set-row">
              <div><b>{tr('Thème', 'Theme')}</b><small>{tr('Apparence de l\'application (pas celle de vos rapports).', 'App appearance (not your reports).')}</small></div>
              <Seg value={uiTheme} onChange={onUiTheme} options={[{ v: 'light', label: tr('Clair', 'Light') }, { v: 'dark', label: tr('Sombre', 'Dark') }]} />
            </div>
          </section>

          <section>
            <h3>{tr('Éditeur', 'Editor')}</h3>
            <Switch id="set-autosave" checked={settings.autosave} onChange={(autosave) => set({ autosave })} label={tr('Enregistrer automatiquement (une seconde après chaque modification)', 'Save automatically (one second after each change)')} />
            <p className="hint">{tr('Désactivé : utilisez le bouton « Enregistrer » (Ctrl S). Dans tous les cas, l\'application vous prévient avant de quitter des modifications non enregistrées.', 'Off: use the "Save" button (Ctrl S). Either way, the app warns you before leaving unsaved changes.')}</p>
            <Switch id="set-grid" checked={settings.showGrid} onChange={(showGrid) => set({ showGrid })} label={tr('Afficher la grille à l\'ouverture', 'Show the grid when opening')} />
            <Switch id="set-slots" checked={settings.showSlots} onChange={(showSlots) => set({ showSlots })} label={tr('Afficher les emplacements Power BI à l\'ouverture', 'Show Power BI slots when opening')} />
          </section>

          <section>
            <h3>{tr('Pages vierges', 'Blank pages')}</h3>
            <div className="set-row">
              <div><b>{tr('Taille de la page', 'Page size')}</b></div>
              <select value={settings.newSize} onChange={(e) => set({ newSize: e.target.value })}>{SIZES.map((z) => <option key={z} value={z}>{z.replace('x', ' × ')}</option>)}</select>
            </div>
            <div className="set-row">
              <div><b>{tr('Palette', 'Palette')}</b></div>
              <select value={settings.newPalette} onChange={(e) => set({ newPalette: e.target.value })}>{PALETTES.map((p) => <option key={p.id} value={p.id}>{p.name[lang]}</option>)}</select>
            </div>
            <div className="set-row">
              <div><b>{tr('Police', 'Font')}</b></div>
              <select value={settings.newFont} onChange={(e) => set({ newFont: e.target.value })}>{FONTS.map((f) => <option key={f}>{f}</option>)}</select>
            </div>
          </section>

          <section>
            <h3>{tr('Données', 'Data')}</h3>
            <div className="set-row">
              <div>
                <b>{tr('Où sont gardés vos modèles', 'Where your models are kept')}</b>
                <small>{store.kind === 'cloud' ? tr('Dans votre compte : disponibles sur tous vos appareils.', 'In your account: available on all your devices.') : tr('Dans ce navigateur seulement (sans compte).', 'In this browser only (no account).')}</small>
              </div>
              <span className="tag">{store.kind === 'cloud' ? tr('Compte', 'Account') : tr('Cet appareil', 'This device')}</span>
            </div>
            <div className="set-row">
              <div><b>{tr('Données de ce navigateur', 'This browser data')}</b><small>{tr('Préférences, et modèles gardés sans compte.', 'Preferences, and models kept without an account.')}</small></div>
              <button className="btn danger-outline" onClick={() => void clearLocal()}>{tr('Effacer', 'Clear')}</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
