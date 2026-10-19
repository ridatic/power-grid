import { useEffect, useState } from 'react'
import { useFeedback } from '../feedback'
import type { ModelStore, SavedModel } from '../storage'
import { Icon } from './Icon'
import { PagePreview } from './PagePreview'
import type { Lang } from '../i18n'

interface Props {
  lang: Lang
  store: ModelStore
  /** Cree un nouveau fichier a partir du modele et l'ouvre. */
  onNewFile: (m: SavedModel) => void
  /** Remplace le contenu du fichier ouvert par celui du modele (dans l'editeur seulement). */
  onApply?: (m: SavedModel) => void
  onClose: () => void
  /** Modele ouvert dans l'editeur : ni supprimable ni applicable a lui-meme. */
  currentId?: string
}

/** Mes modeles : la bibliotheque des points de depart de l'utilisateur, a consulter et reutiliser. */
export function ModelsLibrary({ lang, store, onNewFile, onApply, onClose, currentId }: Props) {
  const fb = useFeedback()
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const [models, setModels] = useState<SavedModel[] | null>(null)
  const fmt = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const refresh = () =>
    store
      .list('model')
      .then(setModels)
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
    void refresh()
  }

  const remove = async (m: SavedModel) => {
    if (!(await fb.confirm({ title: tr(`Supprimer « ${m.name} » ?`, `Delete "${m.name}"?`), message: tr('Le modèle disparaît de votre bibliothèque. Les fichiers déjà créés à partir de lui ne changent pas.', 'The model leaves your library. Files already created from it do not change.'), confirmLabel: tr('Supprimer', 'Delete'), danger: true }))) return
    await store.remove(m.id)
    fb.toast(tr('Modèle supprimé', 'Model deleted'))
    void refresh()
  }

  const apply = async (m: SavedModel) => {
    if (!onApply) return
    if (!(await fb.confirm({ title: tr(`Appliquer « ${m.name} » à ce fichier ?`, `Apply "${m.name}" to this file?`), message: tr('Le thème, la navigation et les pages du fichier sont remplacés par ceux du modèle. Vous pouvez annuler ensuite (Ctrl Z).', 'The file theme, navigation and pages are replaced by the model ones. You can undo afterwards (Ctrl Z).'), confirmLabel: tr('Appliquer', 'Apply') }))) return
    onApply(m)
    onClose()
  }

  return (
    <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog models" role="dialog" aria-modal="true" aria-label={tr('Mes modèles', 'My models')}>
        <div className="dialog-head">
          <div>
            <h2>{tr('Mes modèles', 'My models')}</h2>
            <p className="hint">{tr('Vos points de départ réutilisables. Un nouveau fichier en est une copie : le modèle ne change pas.', 'Your reusable starting points. A new file is a copy: the model does not change.')}</p>
          </div>
          <button className="icon-btn" aria-label={tr('Fermer', 'Close')} onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="models-body">
          {models === null ? (
            <p className="muted">{tr('Chargement…', 'Loading…')}</p>
          ) : models.length === 0 ? (
            <div className="empty">
              <b>{tr('Votre bibliothèque est vide', 'Your library is empty')}</b>
              <span>{tr('Dans un fichier, utilisez « Enregistrer comme modèle » pour l\'ajouter ici.', 'In a file, use "Save as model" to add it here.')}</span>
            </div>
          ) : (
            <div className="grid-cards">
              {models.map((m) => (
                <article key={m.id} className="model-card">
                  <button className="model-open" onClick={() => onNewFile(m)} aria-label={`${tr('Nouveau fichier depuis', 'New file from')} ${m.name}`}><PagePreview project={m.data} /></button>
                  <div className="model-meta">
                    <b title={m.name}>{m.name}</b>
                    <small>{fmt.format(new Date(m.updatedAt))}</small>
                  </div>
                  <div className="model-actions">
                    <button className="use" onClick={() => onNewFile(m)}>{tr('Nouveau fichier', 'New file')}</button>
                    {m.id === currentId && <span className="tag">{tr('Ouvert', 'Open')}</span>}
                    {onApply && m.id !== currentId && <button className="ic" title={tr('Appliquer à ce fichier', 'Apply to this file')} aria-label={tr('Appliquer à ce fichier', 'Apply to this file')} onClick={() => void apply(m)}><Icon name="download" size={15} /></button>}
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
