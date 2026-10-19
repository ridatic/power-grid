import { useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import type { Account } from '../account'
import type { UiTheme } from '../prefs'
import type { Lang } from '../i18n'

interface Props {
  lang: Lang
  onLang: (l: Lang) => void
  uiTheme: UiTheme
  onUiTheme: (t: UiTheme) => void
  account: Account | null
  onProfile: () => void
  onHome: () => void
  onModels: () => void
  onSettings: () => void
  onSignOut: () => void
  children?: ReactNode
  /** Bouton principal, place en dernier (Exporter). */
  trailing?: ReactNode
}

/** Boutons communs de l'en-tete, comme Sira : theme, langue, compte (profil, accueil, deconnexion). */
export function HeaderActions({ lang, onLang, uiTheme, onUiTheme, account, onProfile, onHome, onModels, onSettings, onSignOut, children, trailing }: Props) {
  const [menu, setMenu] = useState(false)
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const themeLabel = uiTheme === 'dark' ? tr('Passer en thème clair', 'Switch to light theme') : tr('Passer en thème sombre', 'Switch to dark theme')
  const langLabel = lang === 'fr' ? 'Switch to English' : 'Passer en français'

  return (
    <div className="actions">
      {children}
      <button className="icon-btn" title={tr('Paramètres', 'Settings')} aria-label={tr('Paramètres', 'Settings')} onClick={onSettings}>
        <Icon name="settings" size={18} />
      </button>
      <button className="icon-btn" title={themeLabel} aria-label={themeLabel} onClick={() => onUiTheme(uiTheme === 'dark' ? 'light' : 'dark')}>
        <Icon name={uiTheme === 'dark' ? 'moon' : 'sun'} size={18} />
      </button>
      <button className="icon-btn lang-btn" title={langLabel} aria-label={langLabel} onClick={() => onLang(lang === 'fr' ? 'en' : 'fr')}>
        <Icon name="globe" size={18} />
        <span>{lang.toUpperCase()}</span>
      </button>
      {account && (
        <div className="account-box">
          <button className={`icon-btn avatar-btn${menu ? ' active' : ''}`} title={account.name || account.email} aria-label={account.name || account.email} aria-expanded={menu} onClick={() => setMenu(!menu)}>
            {account.photo ? <img src={account.photo} alt="" /> : <Icon name="user" size={18} />}
          </button>
          {menu && (
            <div className="account-menu" onMouseLeave={() => setMenu(false)}>
              <div className="account-email">
                {account.name && <strong>{account.name}</strong>}
                <span>{account.email}</span>
              </div>
              <button className="account-item" onClick={() => { setMenu(false); onProfile() }}><Icon name="user" size={14} /> {tr('Mon profil', 'My profile')}</button>
              <button className="account-item" onClick={() => { setMenu(false); onHome() }}><Icon name="file" size={14} /><span><b>{tr('Accueil', 'Home')}</b><small>{tr('Récents, favoris, modèles', 'Recent, favorites, models')}</small></span></button>
              <button className="account-item" onClick={() => { setMenu(false); onModels() }}><Icon name="layout" size={14} /><span><b>{tr('Mes modèles', 'My models')}</b><small>{tr('Vos points de départ réutilisables', 'Your reusable starting points')}</small></span></button>
              <button className="account-item" onClick={() => { setMenu(false); onSettings() }}><Icon name="settings" size={14} /> {tr('Paramètres', 'Settings')}</button>
              <button className="account-item" onClick={() => { setMenu(false); onSignOut() }}><Icon name="logout" size={14} /> {tr('Se déconnecter', 'Sign out')}</button>
            </div>
          )}
        </div>
      )}
      {trailing}
    </div>
  )
}
