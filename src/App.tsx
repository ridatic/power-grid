import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { useSession, signOut } from './auth'
import { accountOf } from './account'
import { supabase } from './lib/supabase'
import { listDocs, markOpened, modelStore, uniqueName, type SavedModel } from './storage'
import type { Project } from './core/types'
import { useFeedback } from './feedback'
import { AuthPage } from './components/AuthPage'
import { Home } from './components/Home'
import { ProfileModal } from './components/ProfileModal'
import { FeedbackProvider } from './components/FeedbackProvider'
import { Editor } from './Editor'
import { loadLang, loadSettings, loadTheme, saveSettings, savePref, type AppSettings, type UiTheme } from './prefs'
import { SettingsModal } from './components/SettingsModal'
import type { Lang } from './i18n'

const DOC_HASH = /^#\/doc\/([\w-]+)$/

/** Racine : preferences d'interface et messages, puis l'application. */
export default function App() {
  const [lang, setLang] = useState<Lang>(loadLang)
  const [uiTheme, setUiTheme] = useState<UiTheme>(loadTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = uiTheme
    savePref('ui-theme', uiTheme)
  }, [uiTheme])
  useEffect(() => {
    document.documentElement.lang = lang
    savePref('lang', lang)
  }, [lang])

  return (
    <FeedbackProvider lang={lang}>
      <Shell lang={lang} onLang={setLang} uiTheme={uiTheme} onUiTheme={setUiTheme} />
    </FeedbackProvider>
  )
}

/** Connexion obligatoire, puis accueil (recents, favoris, modeles) ou editeur. Le modele ouvert est garde dans l'adresse. */
function Shell({ lang, onLang, uiTheme, onUiTheme }: { lang: Lang; onLang: (l: Lang) => void; uiTheme: UiTheme; onUiTheme: (t: UiTheme) => void }) {
  const fb = useFeedback()
  const { session, loading } = useSession()
  // Le choix « continuer sans compte » tient le temps de la session du navigateur (actualisation comprise)
  const [local, setLocalState] = useState(() => sessionStorage.getItem('power-grid.local') === '1')
  const setLocal = (v: boolean) => {
    setLocalState(v)
    sessionStorage.setItem('power-grid.local', v ? '1' : '0')
  }
  const [open, setOpen] = useState<SavedModel | null>(null)
  const [restoring, setRestoring] = useState(() => DOC_HASH.test(window.location.hash))
  const [profile, setProfile] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings)
  const setSettings = (s: AppSettings) => {
    setSettingsState(s)
    saveSettings(s)
  }
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)

  const signedIn = !!session
  const account = accountOf(session)
  const store = useMemo(() => modelStore(signedIn), [signedIn])
  const ready = !loading && (signedIn || (local && !supabase))

  const openDoc = (d: SavedModel) => {
    markOpened(store, d.id).catch((e: unknown) => console.error(e))
    setOpen(d)
    window.history.replaceState(null, '', `#/doc/${d.id}`)
  }
  const back = () => {
    setOpen(null)
    window.history.replaceState(null, '', window.location.pathname)
  }

  // Apres une actualisation, on rouvre le document qui etait affiche
  useEffect(() => {
    if (!ready || !restoring) return
    const id = DOC_HASH.exec(window.location.hash)?.[1] ?? ''
    store
      .get(id)
      .then((d) => {
        if (d) setOpen(d)
        else window.history.replaceState(null, '', window.location.pathname)
      })
      .catch((e: unknown) => console.error(e))
      .finally(() => setRestoring(false))
  }, [ready, restoring, store])

  /** Partir d'un modele (predefini ou a soi) ou d'une page vierge : un nouveau document dans les recents, ouvert aussitot. */
  const startFrom = async (name: string, data: Project) => {
    try {
      const finalName = uniqueName(name, await listDocs(store))
      openDoc(await store.create('file', finalName, data))
    } catch (e) {
      console.error(e)
      fb.toast(tr('Le document n\'a pas pu être créé. Réessayez.', 'The document could not be created. Try again.'), 'error')
    }
  }

  const leave = () => {
    void signOut()
    back()
    setProfile(false)
  }

  if (loading) return <div className="splash" aria-busy="true" />
  // Sans service de comptes configure, on peut continuer sur cet appareil ; sinon la connexion est obligatoire.
  if (!ready) return <AuthPage lang={lang} onLang={onLang} onLocal={() => setLocal(true)} />
  if (restoring) return <div className="splash" aria-busy="true" />

  return (
    <>
      {open ? (
        <Editor
          key={open.id}
          initial={open.data}
          name={open.name}
          onSave={(project, name) => store.save(open.id, name, project)}
          store={store}
          onOpenDoc={openDoc}
          onBack={back}
          lang={lang}
          onLang={onLang}
          uiTheme={uiTheme}
          onUiTheme={onUiTheme}
          account={account}
          onProfile={() => setProfile(true)}
          onSignOut={leave}
          settings={settings}
          onSettings={() => setSettingsOpen(true)}
          docId={open.id}
          kind={open.kind}
        />
      ) : (
        <Home lang={lang} onLang={onLang} uiTheme={uiTheme} onUiTheme={onUiTheme} store={store} account={account} onProfile={() => setProfile(true)} onSignOut={leave} onOpen={openDoc} onStart={(n, d) => void startFrom(n, d)} settings={settings} onSettings={() => setSettingsOpen(true)} />
      )}
      {settingsOpen && <SettingsModal lang={lang} onLang={onLang} uiTheme={uiTheme} onUiTheme={onUiTheme} settings={settings} onSettings={setSettings} store={store} onClose={() => setSettingsOpen(false)} />}
      {profile && account && <ProfileModal lang={lang} account={account} store={store} onClose={() => setProfile(false)} notify={(m) => fb.toast(m)} />}
    </>
  )
}
