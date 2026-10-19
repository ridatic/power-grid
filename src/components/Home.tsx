import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Project } from '../core/types'
import { PRESETS, blankProject, type Preset } from '../core/presets'
import { listDocs, presetFav, recentDocs, uniqueName, type ModelStore, type SavedModel } from '../storage'
import type { Account } from '../account'
import { useFeedback } from '../feedback'
import { useFavorites } from '../favorites'
import { duplicateModel } from '../saveModel'
import { Logo } from './Logo'
import { Icon } from './Icon'
import { HeaderActions } from './HeaderActions'
import { AppFooter } from './AppFooter'
import { PagePreview } from './PagePreview'
import type { AppSettings, UiTheme } from '../prefs'
import type { Lang } from '../i18n'

/** Recents affiches avant « Tout afficher ». */
const RECENT = 6

interface Props {
  lang: Lang
  onLang: (l: Lang) => void
  uiTheme: UiTheme
  onUiTheme: (t: UiTheme) => void
  store: ModelStore
  account: Account | null
  onProfile: () => void
  onSignOut: () => void
  /** Ouvre un document ou un modele dans l'editeur, pour le modifier. */
  onOpen: (doc: SavedModel) => void
  /** Cree un nouveau document a partir de ce contenu (modele ou page vierge), puis l'ouvre. */
  onStart: (name: string, data: Project) => void
  settings: AppSettings
  onSettings: () => void
}

/** Les informations du profil remplissent un nouveau modele (nom, fonction, entreprise, photo de l'avatar). */
function withProfile(p: Project, account: Account | null): Project {
  if (!account) return p
  const cfg = { ...p.cfg }
  if (account.name) cfg.userName = account.name
  if (account.role) cfg.userRole = account.role
  if (account.company) cfg.company = account.company
  const pages = account.photo
    ? p.pages.map((pg) => ({ ...pg, items: pg.items.map((it) => (it.type === 'logo' && it.props?.variant === 'avatar' ? { ...it, props: { ...it.props, src: account.photo } } : it)) }))
    : p.pages
  return { ...p, cfg, pages }
}

/**
 * Accueil en deux colonnes.
 * A gauche ce qui est a moi : les documents ouverts recemment, les favoris, et Mes modeles (ajoutes a la main).
 * A droite les points de depart : page vierge et modeles predefinis, qui creent un nouveau document.
 */
export function Home({ lang, onLang, uiTheme, onUiTheme, store, account, onProfile, onSignOut, onOpen, onStart, settings, onSettings }: Props) {
  const fb = useFeedback()
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const [docs, setDocs] = useState<SavedModel[] | null>(null)
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [allRecent, setAllRecent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fav = useFavorites(store, () => fb.toast(tr('Le favori n\'a pas pu être enregistré.', 'The favorite could not be saved.'), 'error'))
  const fmt = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  // Base pas a jour (colonne ou table manquante) : on le dit clairement plutot qu'un message generique
  const explain = (e: unknown, fallback: string) =>
    e instanceof Error && /does not exist|schema cache/i.test(e.message)
      ? tr('La base de données n\'est pas à jour : rejouez le script supabase/schema.sql dans l\'éditeur SQL de Supabase.', 'The database is not up to date: run supabase/schema.sql again in the Supabase SQL editor.')
      : fallback

  useEffect(() => {
    Promise.all([listDocs(store), store.getList('recents')])
      .then(([d, r]) => {
        setDocs(d)
        setRecentIds(r)
        setError(null)
      })
      .catch((e: unknown) => {
        console.error(e)
        setError(explain(e, tr('Impossible de charger vos modèles. Vérifiez votre connexion puis réessayez.', 'Could not load your models. Check your connection and try again.')))
        setDocs([])
      })
  }, [store]) // eslint-disable-line react-hooks/exhaustive-deps

  const fail = (e: unknown) => {
    console.error(e)
    fb.toast(explain(e, tr('L\'opération a échoué. Réessayez.', 'The operation failed. Try again.')), 'error')
  }

  // Chaque action met l'ecran a jour tout de suite, sans attendre un nouveau chargement
  const duplicate = async (m: SavedModel) => {
    try {
      const copy = await duplicateModel(store, fb, lang, m.data, m.name, m.kind)
      if (copy) setDocs((list) => [copy, ...(list ?? [])])
    } catch (e) {
      fail(e)
    }
  }

  // Mes modeles : un interrupteur, comme l'etoile. Retire, le document reste dans les recents.
  const toggleModel = async (m: SavedModel) => {
    const kind = m.kind === 'model' ? 'file' : 'model'
    try {
      await store.setKind(m.id, kind)
      setDocs((list) => (list ?? []).map((x) => (x.id === m.id ? { ...x, kind } : x)))
    } catch (e) {
      fail(e)
    }
  }

  const addPreset = async (pr: Preset) => {
    try {
      const created = await store.create('model', uniqueName(pr.name[lang], docs ?? []), withProfile(pr.build(), account))
      setDocs((list) => [created, ...(list ?? [])])
    } catch (e) {
      fail(e)
    }
  }

  const rename = async (m: SavedModel) => {
    const name = await fb.prompt({ title: tr('Renommer', 'Rename'), label: tr('Nom', 'Name'), value: m.name, confirmLabel: tr('Renommer', 'Rename') })
    if (!name || name === m.name) return
    try {
      await store.save(m.id, name, m.data)
      setDocs((list) => (list ?? []).map((x) => (x.id === m.id ? { ...x, name } : x)))
    } catch (e) {
      fail(e)
    }
  }

  const remove = async (m: SavedModel) => {
    const ok = await fb.confirm({
      title: tr(`Supprimer « ${m.name} » ?`, `Delete "${m.name}"?`),
      message: m.kind === 'model' ? tr('Le modèle est supprimé définitivement, de Mes modèles comme des récents et des favoris.', 'The model is deleted for good, from My models as well as recent items and favorites.') : tr('Le document est supprimé définitivement.', 'The document is deleted for good.'),
      confirmLabel: tr('Supprimer', 'Delete'),
      danger: true,
    })
    if (!ok) return
    try {
      await store.remove(m.id)
      setDocs((list) => (list ?? []).filter((x) => x.id !== m.id))
      fav.forget(m.id)
      const next = recentIds.filter((x) => x !== m.id)
      setRecentIds(next)
      store.setList('recents', next).catch((err: unknown) => console.error(err))
    } catch (e) {
      fail(e)
    }
  }

  const blank = () => withProfile(blankProject({ size: settings.newSize, paletteId: settings.newPalette, font: settings.newFont }), account)

  const star = (id: string) => {
    const on = fav.isFav(id)
    const label = on ? tr('Retirer des favoris', 'Remove from favorites') : tr('Ajouter aux favoris', 'Add to favorites')
    return (
      <button className={`ic fav${on ? ' on' : ''}`} aria-pressed={on} title={label} aria-label={label} onClick={() => fav.toggle(id)}>
        <Icon name="star" size={15} />
      </button>
    )
  }

  const card = (m: SavedModel, where: string) => (
    <article key={`${where}-${m.id}`} className="model-card">
      <button className="model-open" onClick={() => onOpen(m)} aria-label={`${tr('Modifier', 'Edit')} : ${m.name}`}>
        <PagePreview project={m.data} />
      </button>
      <div className="model-meta">
        <b title={m.name}>{m.name}</b>
        <small>{m.kind === 'model' && <span className="tag sm">{tr('Modèle', 'Model')}</span>} {tr('Modifié le', 'Edited')} {fmt.format(new Date(m.updatedAt))}</small>
      </div>
      <div className="model-actions">
        <button className="use" onClick={() => onOpen(m)}>{tr('Modifier', 'Edit')}</button>
        {star(m.id)}
        <button className={`ic model-tg${m.kind === 'model' ? ' on' : ''}`} aria-pressed={m.kind === 'model'} title={m.kind === 'model' ? tr('Retirer de mes modèles', 'Remove from my models') : tr('Ajouter à mes modèles', 'Add to my models')} aria-label={m.kind === 'model' ? tr('Retirer de mes modèles', 'Remove from my models') : tr('Ajouter à mes modèles', 'Add to my models')} onClick={() => void toggleModel(m)}><Icon name="bookmarkPlus" size={15} /></button>
        <button className="ic" title={tr('Dupliquer', 'Duplicate')} aria-label={tr('Dupliquer', 'Duplicate')} onClick={() => void duplicate(m)}><Icon name="copy" size={15} /></button>
        <button className="ic" title={tr('Renommer', 'Rename')} aria-label={tr('Renommer', 'Rename')} onClick={() => void rename(m)}><Icon name="pencil" size={15} /></button>
        <button className="ic danger" title={tr('Supprimer', 'Delete')} aria-label={tr('Supprimer', 'Delete')} onClick={() => void remove(m)}><Icon name="trash" size={15} /></button>
      </div>
    </article>
  )

  const presetCard = (pr: Preset, where: string) => (
    <PresetCard key={`${where}-${pr.id}`} preset={pr} lang={lang} star={star(presetFav(pr.id))} onUse={() => onStart(pr.name[lang], withProfile(pr.build(), account))} onKeep={() => void addPreset(pr)} />
  )

  // Favoris : mes modeles et modeles predefinis, du plus recemment ajoute au plus ancien
  const favorites = fav.favs.flatMap((id) => {
    if (id.startsWith('preset:')) {
      const pr = PRESETS.find((x) => presetFav(x.id) === id)
      return pr ? [presetCard(pr, 'fav')] : []
    }
    const m = docs?.find((x) => x.id === id)
    return m ? [card(m, 'fav')] : []
  })
  const loading = <p className="muted">{tr('Chargement…', 'Loading…')}</p>
  const mine = (docs ?? []).filter((m) => m.kind === 'model')
  const recents = recentDocs(docs ?? [], recentIds)

  return (
    <div className="home">
      <header className="topbar">
        <button className="brand brand-link" onClick={() => document.getElementById('col-recent')?.scrollIntoView({ behavior: 'smooth' })} aria-label={tr('Accueil Power-Grid', 'Power-Grid home')}>
          <Logo height={40} />
        </button>
        <HeaderActions
          lang={lang}
          onLang={onLang}
          uiTheme={uiTheme}
          onUiTheme={onUiTheme}
          account={account}
          onProfile={onProfile}
          onHome={() => document.getElementById('col-recent')?.scrollIntoView({ behavior: 'smooth' })}
          onModels={() => document.getElementById('col-models')?.scrollIntoView({ behavior: 'smooth' })}
          onSignOut={onSignOut}
          onSettings={onSettings}
        />
      </header>

      {error && <p className="auth-error home-error" role="alert">{error}</p>}

      <main className="home-cols">
        <div className="home-col mine">
          <section id="col-recent">
            <div className="home-head">
              <div>
                <h1><Icon name="file" size={17} /> {tr('Récents', 'Recent')}</h1>
                <p>{tr('Les documents que vous avez ouverts, du plus récent au plus ancien.', 'The documents you opened, most recent first.')}</p>
              </div>
            </div>
            <div className="col-list">
              {docs === null ? loading : recents.length === 0 ? (
                <div className="empty">
                  <b>{tr('Rien pour l\'instant', 'Nothing yet')}</b>
                  <span>{tr('Partez d\'une page vierge ou d\'un modèle prédéfini, à droite.', 'Start from a blank page or a ready-made model, on the right.')}</span>
                </div>
              ) : (allRecent ? recents : recents.slice(0, RECENT)).map((m) => card(m, 'recent'))}
              {recents.length > RECENT && <button className="link more-link" onClick={() => setAllRecent(!allRecent)}>{allRecent ? tr('Afficher moins', 'Show less') : tr(`Tout afficher (${recents.length})`, `Show all (${recents.length})`)}</button>}
            </div>
          </section>

          <section id="col-favs">
            <div className="home-head">
              <div>
                <h2><Icon name="star" size={17} /> {tr('Favoris', 'Favorites')}</h2>
                <p>{tr('Les modèles que vous utilisez le plus, à vous ou prédéfinis.', 'The models you use most, yours or ready-made.')}</p>
              </div>
            </div>
            <div className="col-list">
              {favorites.length ? favorites : <p className="hint fav-hint">{tr('Cliquez sur l\'étoile d\'un modèle pour le retrouver ici.', 'Click the star of a model to find it here.')}</p>}
            </div>
          </section>

          <section id="col-models">
            <div className="home-head">
              <div>
                <h2><Icon name="layout" size={17} /> {tr('Mes modèles', 'My models')}</h2>
                <p>{tr('Les documents et modèles prédéfinis que vous avez ajoutés avec le bouton « Mes modèles ».', 'The documents and ready-made models you added with the "My models" button.')}</p>
              </div>
            </div>
            <div className="col-list">
              {docs === null ? loading : mine.length === 0 ? <p className="hint fav-hint">{tr('Ajoutez un document ou un modèle prédéfini avec le bouton « Ajouter à mes modèles » (signet).', 'Add a document or a ready-made model with the "Add to my models" button (bookmark).')}</p> : mine.map((m) => card(m, 'mine'))}
            </div>
          </section>
        </div>

        <aside className="home-col start" id="col-presets">
          <div className="home-head">
            <div>
              <h2><Icon name="plus" size={17} /> {tr('Commencer', 'Get started')}</h2>
              <p>{tr('Une page vierge, ou un modèle prédéfini : un nouveau document est créé dans vos récents.', 'A blank page, or a ready-made model: a new document is created in your recent items.')}</p>
            </div>
          </div>
          <div className="start-list">
            <button className="start-blank" onClick={() => onStart(tr('Mon rapport', 'My report'), blank())}>
              <span className="start-plus"><Icon name="plus" size={20} /></span>
              <span>
                <b>{tr('Page vierge', 'Blank page')}</b>
                <small>{tr('Une page libre avec vos réglages par défaut', 'A free page with your default settings')}</small>
              </span>
            </button>
            <h3 className="start-sub">{tr('Modèles prédéfinis', 'Ready-made models')}</h3>
            {PRESETS.map((pr) => presetCard(pr, 'preset'))}
          </div>
        </aside>
      </main>
      <AppFooter lang={lang} />
    </div>
  )
}

function PresetCard({ preset, lang, star, onUse, onKeep }: { preset: Preset; lang: Lang; star: ReactNode; onUse: () => void; onKeep: () => void }) {
  const preview = useMemo(() => preset.build(), [preset])
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  return (
    <article className="model-card preset">
      <button className="model-open" onClick={onUse} aria-label={`${tr('Utiliser ce modèle', 'Use this model')} : ${preset.name[lang]}`}><PagePreview project={preview} /></button>
      <div className="model-meta">
        <b>{preset.name[lang]}</b>
        <small>{preset.desc[lang]}</small>
      </div>
      <div className="model-actions">
        <button className="use" onClick={onUse}>{tr('Utiliser ce modèle', 'Use this model')}</button>
        {star}
        <button className="ic" title={tr('Ajouter à mes modèles', 'Add to my models')} aria-label={tr('Ajouter à mes modèles', 'Add to my models')} onClick={onKeep}><Icon name="bookmarkPlus" size={15} /></button>
      </div>
    </article>
  )
}
