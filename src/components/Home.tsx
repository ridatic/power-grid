import { useEffect, useMemo, useState } from 'react'
import type { Project } from '../core/types'
import { PRESETS, blankProject } from '../core/presets'
import type { DocKind, ModelStore, SavedModel } from '../storage'
import type { Account } from '../account'
import { useFeedback } from '../feedback'
import { saveAsModel } from '../saveModel'
import { Logo } from './Logo'
import { Icon } from './Icon'
import { HeaderActions } from './HeaderActions'
import { AppFooter } from './AppFooter'
import { PagePreview } from './PagePreview'
import type { AppSettings, UiTheme } from '../prefs'
import type { Lang } from '../i18n'

interface Props {
  lang: Lang
  onLang: (l: Lang) => void
  uiTheme: UiTheme
  onUiTheme: (t: UiTheme) => void
  store: ModelStore
  account: Account | null
  onProfile: () => void
  onSignOut: () => void
  onOpen: (doc: SavedModel) => void
  settings: AppSettings
  onSettings: () => void
}

/** Les informations du profil remplissent un nouveau fichier (nom, fonction, entreprise, photo de l'avatar). */
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
 * Accueil en deux colonnes :
 * a gauche ce qui appartient a l'utilisateur (fichiers, modeles), a droite les points de depart.
 */
export function Home({ lang, onLang, uiTheme, onUiTheme, store, account, onProfile, onSignOut, onOpen, settings, onSettings }: Props) {
  const fb = useFeedback()
  const [files, setFiles] = useState<SavedModel[] | null>(null)
  const [models, setModels] = useState<SavedModel[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const fmt = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  // Base pas a jour (colonne ou table manquante) : on le dit clairement plutot qu'un message generique
  const explain = (e: unknown, fallback: string) =>
    e instanceof Error && /does not exist|schema cache/i.test(e.message)
      ? tr('La base de données n\'est pas à jour : rejouez le script supabase/schema.sql dans l\'éditeur SQL de Supabase.', 'The database is not up to date: run supabase/schema.sql again in the Supabase SQL editor.')
      : fallback

  const refresh = () =>
    Promise.all([store.list('file'), store.list('model')])
      .then(([f, m]) => {
        setFiles(f)
        setModels(m)
        setError(null)
      })
      .catch((e: unknown) => {
        console.error(e)
        setError(explain(e, tr('Impossible de charger vos fichiers et modèles. Vérifiez votre connexion puis réessayez.', 'Could not load your files and models. Check your connection and try again.')))
        setFiles([])
        setModels([])
      })

  useEffect(() => {
    void refresh()
  }, [store]) // eslint-disable-line react-hooks/exhaustive-deps

  const guard = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      console.error(e)
      fb.toast(explain(e, tr('L\'opération a échoué. Réessayez.', 'The operation failed. Try again.')), 'error')
    } finally {
      setBusy(false)
    }
  }

  const createFile = (name: string, data: Project) => guard(async () => onOpen(await store.create('file', name, data)))

  const duplicate = (d: SavedModel) =>
    guard(async () => {
      await store.create('file', `${d.name} ${tr('(copie)', '(copy)')}`, d.data)
      fb.toast(tr('Fichier dupliqué', 'File duplicated'))
      await refresh()
    })

  const keepModel = (name: string, data: Project) =>
    guard(async () => {
      if (await saveAsModel(store, fb, lang, data, name)) await refresh()
    })

  const rename = (d: SavedModel) =>
    guard(async () => {
      const name = await fb.prompt({ title: d.kind === 'model' ? tr('Renommer le modèle', 'Rename the model') : tr('Renommer le fichier', 'Rename the file'), label: tr('Nom', 'Name'), value: d.name, confirmLabel: tr('Renommer', 'Rename') })
      if (!name || name === d.name) return
      await store.save(d.id, name, d.data)
      await refresh()
    })

  const remove = (d: SavedModel) =>
    guard(async () => {
      const isModel = d.kind === 'model'
      const ok = await fb.confirm({
        title: tr(`Supprimer « ${d.name} » ?`, `Delete "${d.name}"?`),
        message: isModel ? tr('Le modèle disparaît de votre bibliothèque. Les fichiers créés à partir de lui ne changent pas.', 'The model leaves your library. Files created from it do not change.') : tr('Le fichier est supprimé définitivement.', 'The file is deleted for good.'),
        confirmLabel: tr('Supprimer', 'Delete'),
        danger: true,
      })
      if (!ok) return
      await store.remove(d.id)
      fb.toast(isModel ? tr('Modèle supprimé', 'Model deleted') : tr('Fichier supprimé', 'File deleted'))
      await refresh()
    })

  const empty = (title: string, text: string) => (
    <div className="empty">
      <b>{title}</b>
      <span>{text}</span>
    </div>
  )
  const card = (d: SavedModel, kind: DocKind) => (
    <article key={d.id} className="model-card">
      <button className="model-open" onClick={() => (kind === 'file' ? onOpen(d) : void createFile(d.name, d.data))} aria-label={kind === 'file' ? `${tr('Ouvrir', 'Open')} ${d.name}` : `${tr('Nouveau fichier depuis', 'New file from')} ${d.name}`}>
        <PagePreview project={d.data} />
      </button>
      <div className="model-meta">
        <b title={d.name}>{d.name}</b>
        <small>{kind === 'file' ? tr('Modifié', 'Edited') : tr('Modèle', 'Model') + ' ·'} {fmt.format(new Date(d.updatedAt))}</small>
      </div>
      <div className="model-actions">
        {kind === 'file' ? (
          <>
            <button className="use" onClick={() => onOpen(d)}>{tr('Ouvrir', 'Open')}</button>
            <button className="ic" title={tr('Dupliquer', 'Duplicate')} aria-label={tr('Dupliquer', 'Duplicate')} onClick={() => void duplicate(d)}><Icon name="copy" size={15} /></button>
            <button className="ic" title={tr('Enregistrer comme modèle', 'Save as model')} aria-label={tr('Enregistrer comme modèle', 'Save as model')} onClick={() => void keepModel(d.name, d.data)}><Icon name="save" size={15} /></button>
          </>
        ) : (
          <>
            <button className="use" disabled={busy} onClick={() => void createFile(d.name, d.data)}>{tr('Nouveau fichier', 'New file')}</button>
            <button className="ic" title={tr('Modifier le modèle', 'Edit the model')} aria-label={tr('Modifier le modèle', 'Edit the model')} onClick={() => onOpen(d)}><Icon name="layout" size={15} /></button>
          </>
        )}
        <button className="ic" title={tr('Renommer', 'Rename')} aria-label={tr('Renommer', 'Rename')} onClick={() => void rename(d)}><Icon name="pencil" size={15} /></button>
        <button className="ic danger" title={tr('Supprimer', 'Delete')} aria-label={tr('Supprimer', 'Delete')} onClick={() => void remove(d)}><Icon name="trash" size={15} /></button>
      </div>
    </article>
  )

  return (
    <div className="home">
      <header className="topbar">
        <button className="brand brand-link" onClick={() => void refresh()} aria-label={tr('Accueil Power-Grid', 'Power-Grid home')}>
          <Logo height={40} />
        </button>
        <HeaderActions
          lang={lang}
          onLang={onLang}
          uiTheme={uiTheme}
          onUiTheme={onUiTheme}
          account={account}
          onProfile={onProfile}
          onHome={() => document.getElementById('col-files')?.scrollIntoView({ behavior: 'smooth' })}
          onModels={() => document.getElementById('col-models')?.scrollIntoView({ behavior: 'smooth' })}
          onSignOut={onSignOut}
          onSettings={onSettings}
        />
      </header>

      {error && <p className="auth-error home-error" role="alert">{error}</p>}

      <main className="home-cols">
        <div className="home-col mine">
          <section id="col-files">
            <div className="home-head">
              <div>
                <h1><Icon name="file" size={17} /> {tr('Mes fichiers', 'My files')}</h1>
                <p>{tr('Vos rapports en cours, du plus récent au plus ancien.', 'Your reports in progress, most recent first.')}</p>
              </div>
            </div>
            <div className="col-list">
              {files === null ? <p className="muted">{tr('Chargement…', 'Loading…')}</p> : files.length === 0 ? empty(tr('Aucun fichier pour l\'instant', 'No file yet'), tr('Créez un fichier vierge ou partez d\'un modèle, à droite.', 'Create a blank file or start from a model, on the right.')) : files.map((d) => card(d, 'file'))}
            </div>
          </section>

          <section id="col-models">
            <div className="home-head">
              <div>
                <h2><Icon name="layout" size={17} /> {tr('Mes modèles', 'My models')}</h2>
                <p>{tr('Vos points de départ réutilisables : chaque nouveau fichier en est une copie, le modèle ne change pas.', 'Your reusable starting points: each new file is a copy, the model stays unchanged.')}</p>
              </div>
            </div>
            <div className="col-list">
              {models === null ? <p className="muted">{tr('Chargement…', 'Loading…')}</p> : models.length === 0 ? empty(tr('Bibliothèque vide', 'Empty library'), tr('Dans un fichier, cliquez sur « Enregistrer comme modèle ».', 'In a file, click "Save as model".')) : models.map((d) => card(d, 'model'))}
            </div>
          </section>
        </div>

        <aside className="home-col start" id="col-presets">
          <div className="home-head">
            <div>
              <h2><Icon name="plus" size={17} /> {tr('Commencer', 'Get started')}</h2>
              <p>{tr('Une page vierge, ou un rapport complet prêt à personnaliser.', 'A blank page, or a complete report ready to customize.')}</p>
            </div>
          </div>
          <div className="start-list">
            <button className="start-blank" disabled={busy} onClick={() => void createFile(tr('Nouveau fichier', 'New file'), withProfile(blankProject({ size: settings.newSize, paletteId: settings.newPalette, font: settings.newFont }), account))}>
              <span className="start-plus"><Icon name="plus" size={20} /></span>
              <span>
                <b>{tr('Fichier vierge', 'Blank file')}</b>
                <small>{tr('Une page libre avec vos réglages par défaut', 'A free page with your default settings')}</small>
              </span>
            </button>
            <h3 className="start-sub">{tr('Modèles prédéfinis', 'Ready-made models')}</h3>
            {PRESETS.map((pr) => (
              <PresetCard
                key={pr.id}
                name={pr.name[lang]}
                desc={pr.desc[lang]}
                build={pr.build}
                busy={busy}
                useLabel={tr('Nouveau fichier', 'New file')}
                keepLabel={tr('Ajouter à mes modèles', 'Add to my models')}
                onUse={(data) => void createFile(pr.name[lang], withProfile(data, account))}
                onKeep={(data) => void keepModel(pr.name[lang], data)}
              />
            ))}
          </div>
        </aside>
      </main>
      <AppFooter lang={lang} />
    </div>
  )
}

function PresetCard({ name, desc, build, busy, useLabel, keepLabel, onUse, onKeep }: { name: string; desc: string; build: () => Project; busy: boolean; useLabel: string; keepLabel: string; onUse: (p: Project) => void; onKeep: (p: Project) => void }) {
  const preview = useMemo(() => build(), [build])
  return (
    <article className="model-card preset">
      <button className="model-open" disabled={busy} onClick={() => onUse(build())} aria-label={`${useLabel} : ${name}`}><PagePreview project={preview} /></button>
      <div className="model-meta">
        <b>{name}</b>
        <small>{desc}</small>
      </div>
      <div className="model-actions">
        <button className="use" disabled={busy} onClick={() => onUse(build())}>{useLabel}</button>
        <button className="ic" disabled={busy} title={keepLabel} aria-label={keepLabel} onClick={() => onKeep(preview)}><Icon name="save" size={15} /></button>
      </div>
    </article>
  )
}
