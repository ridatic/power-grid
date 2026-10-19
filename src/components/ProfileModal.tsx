import { useEffect, useState, type ChangeEvent } from 'react'
import { initialsOf, saveProfile, setNewPassword, type Account, type AccountProfile } from '../account'
import { imageToDataUrl } from '../files'
import type { ModelStore } from '../storage'
import { Icon } from './Icon'
import type { Lang } from '../i18n'

const MIN_PASSWORD = 8

interface Props {
  lang: Lang
  account: Account
  store: ModelStore
  onClose: () => void
  notify: (msg: string) => void
}

/**
 * Profil, comme Sira mais pour Power-Grid : les informations reprises dans les nouveaux fichiers,
 * le mot de passe, l'export de toutes les donnees et la demande de suppression du compte.
 */
export function ProfileModal({ lang, account, store, onClose, notify }: Props) {
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const [tab, setTab] = useState<'profile' | 'security' | 'data'>('profile')
  const [form, setForm] = useState<AccountProfile>({ name: account.name, role: account.role, company: account.company, photo: account.photo })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const dirty = form.name !== account.name || form.role !== account.role || form.company !== account.company
  const patch = (p: Partial<AccountProfile>) => setForm((f) => ({ ...f, ...p }))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const run = async (fn: () => Promise<void>, ok: string) => {
    setError('')
    setBusy(true)
    try {
      await fn()
      notify(ok)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const photo = await imageToDataUrl(f, 160, false)
    // La photo est enregistree tout de suite : elle apparait aussitot dans l'en-tete
    patch({ photo })
    await run(() => saveProfile({ name: account.name, role: account.role, company: account.company, photo }), tr('Photo enregistrée', 'Photo saved'))
  }

  const exportAll = () =>
    run(async () => {
      const [files, models] = await Promise.all([store.list('file'), store.list('model')])
      const payload = { exportedAt: new Date().toISOString(), account: account.email, files, models }
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'power-grid-mes-donnees.json'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, tr('Données exportées', 'Data exported'))

  const mail = `mailto:ridatic@gmail.com?subject=${encodeURIComponent(tr('Power-Grid : suppression de mon compte', 'Power-Grid: delete my account'))}&body=${encodeURIComponent(account.email)}`
  const TABS = [
    ['profile', 'user', tr('Mes informations', 'My information')],
    ['security', 'lock', tr('Sécurité', 'Security')],
    ['data', 'download', tr('Mes données', 'My data')],
  ] as const

  return (
    <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog profile" role="dialog" aria-modal="true" aria-label={tr('Mon profil', 'My profile')}>
        <div className="dialog-head">
          <h2>{tr('Mon profil', 'My profile')}</h2>
          <button className="icon-btn" aria-label={tr('Fermer', 'Close')} onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="profile-layout">
          <nav className="profile-nav" role="tablist" aria-orientation="vertical">
            {TABS.map(([id, icon, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} className={`profile-tab${tab === id ? ' on' : ''}`} onClick={() => { setTab(id); setError('') }}>
                <Icon name={icon} size={15} /> {label}
              </button>
            ))}
          </nav>
          <div className="profile-panel">
            {tab === 'profile' && (
              <>
                <label className="pf">
                  {tr('Adresse e-mail', 'Email address')}
                  <input value={account.email} readOnly disabled />
                </label>
                <div className="profile-avatar">
                  <div className="photo-preview">{form.photo ? <img src={form.photo} alt="" /> : initialsOf(form.name)}</div>
                  <div>
                    <b>{tr('Photo de profil', 'Profile photo')}</b>
                    <p>{tr('Affichée dans l\'en-tête et proposée pour l\'avatar des nouveaux fichiers.', 'Shown in the header and used for the avatar of new files.')}</p>
                    <div className="row">
                      <label className="btn file"><Icon name="upload" size={13} /> {tr('Choisir une photo', 'Choose a photo')}<input type="file" accept="image/*" onChange={onPhoto} /></label>
                      {form.photo && <button className="btn" onClick={() => { patch({ photo: '' }); void run(() => saveProfile({ name: account.name, role: account.role, company: account.company, photo: '' }), tr('Photo retirée', 'Photo removed')) }}>{tr('Retirer', 'Remove')}</button>}
                    </div>
                  </div>
                </div>
                <label className="pf">{tr('Nom complet', 'Full name')}<input value={form.name} placeholder={tr('Prénom Nom', 'First Last')} onChange={(e) => patch({ name: e.target.value })} /></label>
                <label className="pf">{tr('Fonction', 'Job title')}<input value={form.role} placeholder={tr('Ex. Analyste BI', 'E.g. BI analyst')} onChange={(e) => patch({ role: e.target.value })} /></label>
                <label className="pf">{tr('Entreprise', 'Company')}<input value={form.company} placeholder={tr('Nom affiché dans la navigation', 'Name shown in the navigation')} onChange={(e) => patch({ company: e.target.value })} /></label>
                <p className="hint">{tr('Ces informations préremplissent les nouveaux fichiers : nom et fonction en bas de la navigation, entreprise à côté du logo. Les fichiers existants ne changent pas.', 'These details prefill new files: name and job title at the bottom of the navigation, company next to the logo. Existing files do not change.')}</p>
                <div>
                  <button className="btn primary" disabled={busy || !dirty} onClick={() => void run(() => saveProfile(form), tr('Profil enregistré', 'Profile saved'))}>
                    <Icon name="save" size={14} /> {tr('Enregistrer', 'Save')}
                  </button>
                </div>
              </>
            )}
            {tab === 'security' && (
              <>
                <label className="pf">{tr('Nouveau mot de passe', 'New password')}<input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
                <label className="pf">{tr('Confirmer le mot de passe', 'Confirm password')}<input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
                <p className="hint">{tr(`Au moins ${MIN_PASSWORD} caractères.`, `At least ${MIN_PASSWORD} characters.`)}</p>
                <div>
                  <button
                    className="btn primary"
                    disabled={busy || password.length < MIN_PASSWORD || password !== confirm}
                    onClick={() => void run(async () => { await setNewPassword(password); setPassword(''); setConfirm('') }, tr('Mot de passe modifié', 'Password changed'))}
                  >
                    {tr('Changer le mot de passe', 'Change password')}
                  </button>
                </div>
              </>
            )}
            {tab === 'data' && (
              <>
                <div className="profile-data">
                  <div>
                    <b>{tr('Exporter mes données', 'Export my data')}</b>
                    <p>{tr('Tous vos fichiers et modèles dans un fichier JSON.', 'All your files and models in one JSON file.')}</p>
                  </div>
                  <button className="btn" disabled={busy} onClick={() => void exportAll()}><Icon name="download" size={13} /> {tr('Exporter', 'Export')}</button>
                </div>
                <div className="profile-data">
                  <div>
                    <b>{tr('Supprimer mon compte', 'Delete my account')}</b>
                    <p>{tr('Votre compte et tous vos fichiers et modèles seront supprimés. La demande est envoyée par e-mail.', 'Your account and all your files and models will be deleted. The request is sent by email.')}</p>
                  </div>
                  <a className="btn danger-outline" href={mail}>{tr('Demander la suppression', 'Request deletion')}</a>
                </div>
              </>
            )}
            {error && <p className="auth-error" role="alert">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
