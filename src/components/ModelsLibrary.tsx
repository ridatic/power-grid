import { useEffect, useState } from 'react'
import { useFeedback } from '../feedback'
import { listDocs, type ModelStore, type SavedModel } from '../storage'
import { Icon } from './Icon'
import { PagePreview } from './PagePreview'
import { useFavorites } from '../favorites'
import type { Lang } from '../i18n'

interface Props {
  lang: Lang
  store: ModelStore
  /** Ouvre le modele pour le modifier. */
  onOpen: (m: SavedModel) => void
  onClose: () => void
  /** Modele ouvert dans l'editeur : il est deja affiche, et se supprime depuis la zone de dessin. */
  currentId?: string
}

/** Mes modeles : la bibliotheque des points de depart de l'utilisateur, a consulter et reutiliser. */
export function ModelsLibrary({ lang, store, onOpen, onClose, currentId }: Props) {
  const fb = useFeedback()
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const [models, setModels] = useState<SavedModel[] | null>(null)
  const fav = useFavorites(store, () => fb.toast(tr('Le favori n\'a pas pu être enregistré.', 'The favorite could not be saved.'), 'error'))
  const fmt = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const refresh = () =>
    store
    listDocs(store)
      .then((d) => setModels(d.filter((m) => m.kind === 'model')))
      .catch((e: unknown) => {
        console.error(e)
        setModels([])
        fb.toast(tr('Impossible de charger vos modèles.', 'Could not load your models.'), 'error')
      })

  useEffect(() => {
    void refresh()
  }, [store]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const rename = async (m: SavedModel) => {
    const name = await fb.prompt({ title: tr('Renommer le modèle', 'Rename the model'), label: tr('Nom du modèle', 'Model name'), value: m.name, confirmLabel: tr('Renommer', 'Rename') })
    if (!name || name === m.name) return
    await store.save(m.id, name, m.data)
    setModels((list) => (list ?? []).map((x) => (x.id === m.id ? { ...x, name } : x)))
  }

  const remove = async (m: SavedModel) => {
    if (!(await fb.confirm({ title: tr(`Supprimer « ${m.name} » ?`, `Delete "${m.name}"?`), message: tr('Le modèle est supprimé définitivement.', 'The model is deleted for good.'), confirmLabel: tr('Supprimer', 'Delete'), danger: true }))) return
    await store.remove(m.id)
    setModels((list) => (list ?? []).filter((x) => x.id !== m.id))
    fav.forget(m.id)
  }

  return (
    <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog models" role="dialog" aria-modal="true" aria-label={tr('Mes modèles', 'My models')}>
        <div className="dialog-head">
          <div>
            <h2>{tr('Mes modèles', 'My models')}</h2>
            <p className="hint">{tr('Ouvrez un autre de vos modèles pour le modifier.', 'Open another of your models to edit it.')}</p>
          </div>
          <button className="icon-btn" aria-label={tr('Fermer', 'Close')} onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="models-body">
          {models === null ? (
            <p className="muted">{tr('Chargement…', 'Loading…')}</p>
          ) : models.length === 0 ? (
            <div className="empty">
              <b>{tr('Votre bibliothèque est vide', 'Your library is empty')}</b>
              <span>{tr('Utilisez « Ajouter à mes modèles » sur un document ou un modèle prédéfini.', 'Use "Add to my models" on a document or a ready-made model.')}</span>
            </div>
          ) : (
            <div className="grid-cards">
              {models.map((m) => (
                <article key={m.id} className="model-card">
                  <button className="model-open" disabled={m.id === currentId} onClick={() => onOpen(m)} aria-label={`${tr('Modifier', 'Edit')} : ${m.name}`}><PagePreview project={m.data} /></button>
                  <div className="model-meta">
                    <b title={m.name}>{m.name}</b>
                    <small>{fmt.format(new Date(m.updatedAt))}</small>
                  </div>
                  <div className="model-actions">
                    {m.id === currentId ? <span className="tag">{tr('Ouvert', 'Open')}</span> : <button className="use" onClick={() => onOpen(m)}>{tr('Modifier', 'Edit')}</button>}
                    <button className={`ic fav${fav.isFav(m.id) ? ' on' : ''}`} aria-pressed={fav.isFav(m.id)} title={fav.isFav(m.id) ? tr('Retirer des favoris', 'Remove from favorites') : tr('Ajouter aux favoris', 'Add to favorites')} aria-label={fav.isFav(m.id) ? tr('Retirer des favoris', 'Remove from favorites') : tr('Ajouter aux favoris', 'Add to favorites')} onClick={() => fav.toggle(m.id)}><Icon name="star" size={15} /></button>
                    <button className="ic" title={tr('Renommer', 'Rename')} aria-label={tr('Renommer', 'Rename')} onClick={() => void rename(m)}><Icon name="pencil" size={15} /></button>
                    <button className="ic danger" disabled={m.id === currentId} title={m.id === currentId ? tr('Modèle en cours de modification : fermez-le avant de le supprimer', 'Model being edited: close it before deleting it') : tr('Supprimer', 'Delete')} aria-label={tr('Supprimer', 'Delete')} onClick={() => void remove(m)}><Icon name="trash" size={15} /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
