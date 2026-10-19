import { useEffect, useMemo, useRef, useState } from 'react'
import { ICONS, ICON_SETS } from '../core/icons'
import { imageToDataUrl } from '../files'
import { useFeedback } from '../feedback'
import { isSchemaError, type MediaItem, type ModelStore } from '../storage'
import { Icon } from './Icon'
import type { Lang } from '../i18n'

export type MediaPick = { kind: 'image'; src: string } | { kind: 'icon'; name: string }

interface Props {
  lang: Lang
  store: ModelStore
  /** Onglet ouvert au depart ; 'image' seul masque les icones (photo de profil par exemple). */
  mode: 'image' | 'icon' | 'image-only'
  onPick: (p: MediaPick) => void
  onClose: () => void
}

/**
 * Bibliotheque : les images de l'utilisateur (gardees pour les reutiliser) et les icones fournies, classees par theme.
 * Une image importee depuis l'ordinateur est ajoutee a la bibliotheque puis inseree.
 */
export function MediaLibrary({ lang, store, mode, onPick, onClose }: Props) {
  const fb = useFeedback()
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const [tab, setTab] = useState<'image' | 'icon'>(mode === 'icon' ? 'icon' : 'image')
  const [media, setMedia] = useState<MediaItem[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const [set, setSet] = useState('all')
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    store
      .listMedia()
      .then(setMedia)
      .catch((e: unknown) => {
        console.error(e)
        setMedia([])
        fb.toast(isSchemaError(e) ? tr('La bibliothèque d\'images n\'existe pas encore dans la base : rejouez le script supabase/schema.sql dans l\'éditeur SQL de Supabase.', 'The image library does not exist in the database yet: run supabase/schema.sql again in the Supabase SQL editor.') : tr('Impossible de charger vos images.', 'Could not load your images.'), 'error')
      })
  }, [store]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /** Pourquoi l'enregistrement dans la bibliotheque a echoue, en clair. */
  const reason = (e: unknown) => {
    const msg = e instanceof Error ? e.message : ''
    if (isSchemaError(e)) return tr('la bibliothèque n\'existe pas encore dans la base (rejouez supabase/schema.sql)', 'the library does not exist in the database yet (run supabase/schema.sql again)')
    if (/check constraint|media_data_url_check/i.test(msg)) return tr('image trop lourde', 'image too heavy')
    if (/JWT|row-level security|permission/i.test(msg)) return tr('session expirée, reconnectez-vous', 'session expired, sign in again')
    if (/fetch|network/i.test(msg)) return tr('connexion impossible', 'could not connect')
    return msg || tr('erreur inconnue', 'unknown error')
  }

  // Comme dans Sira : l'image est lue et allegee d'abord ; si l'enregistrement dans la bibliotheque echoue,
  // elle reste utilisee sur la page, et on dit pourquoi elle n'a pas ete gardee.
  const upload = async (f: File | undefined) => {
    if (!f) return
    if (!/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(f.type)) return fb.toast(tr('Format non pris en charge : PNG, JPEG, WebP, GIF ou SVG.', 'Unsupported format: PNG, JPEG, WebP, GIF or SVG.'), 'error')
    setBusy(true)
    try {
      let dataUrl: string
      try {
        dataUrl = await imageToDataUrl(f, 1400, true)
      } catch (e) {
        const big = e instanceof Error && e.message === 'image-too-large'
        return fb.toast(big ? tr('Image trop lourde, même réduite. Essayez une image plus petite.', 'Image too heavy, even reduced. Try a smaller image.') : tr('Ce fichier n\'a pas pu être lu comme une image.', 'This file could not be read as an image.'), 'error')
      }
      // Deja dans la bibliotheque : pas de doublon
      const existing = media?.find((m) => m.dataUrl === dataUrl)
      if (!existing) {
        try {
          const item = await store.addMedia(f.name.replace(/\.[^.]+$/, ''), dataUrl)
          setMedia((m) => [item, ...(m ?? [])])
        } catch (e) {
          console.error(e)
          fb.toast(tr(`Image ajoutée à la page, mais pas gardée dans votre bibliothèque : ${reason(e)}.`, `Image added to the page, but not kept in your library: ${reason(e)}.`), 'error')
        }
      }
      onPick({ kind: 'image', src: dataUrl })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const remove = async (m: MediaItem) => {
    if (!(await fb.confirm({ title: tr('Supprimer cette image ?', 'Delete this image?'), message: tr('Elle disparaît de la bibliothèque. Les modèles qui l\'utilisent déjà la gardent.', 'It leaves the library. Models already using it keep it.'), confirmLabel: tr('Supprimer', 'Delete'), danger: true }))) return
    await store.removeMedia(m.id)
    setMedia((list) => (list ?? []).filter((x) => x.id !== m.id))
  }

  const icons = useMemo(() => {
    const pool = set === 'all' ? ICON_SETS.flatMap((s) => s.icons) : ICON_SETS.find((s) => s.id === set)?.icons ?? []
    const words = q.trim().toLowerCase()
    return pool.filter((n, i) => pool.indexOf(n) === i && (!words || n.toLowerCase().includes(words)))
  }, [q, set])

  return (
    <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog media" role="dialog" aria-modal="true" aria-label={tr('Bibliothèque', 'Library')}>
        <div className="dialog-head">
          <h2>{tr('Bibliothèque', 'Library')}</h2>
          <button className="icon-btn" aria-label={tr('Fermer', 'Close')} onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        {mode !== 'image-only' && (
          <div className="media-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'image'} className={tab === 'image' ? 'on' : ''} onClick={() => setTab('image')}><Icon name="image" size={15} /> {tr('Mes images', 'My images')}</button>
            <button role="tab" aria-selected={tab === 'icon'} className={tab === 'icon' ? 'on' : ''} onClick={() => setTab('icon')}><Icon name="star" size={15} /> {tr('Icônes', 'Icons')}</button>
          </div>
        )}

        {tab === 'image' ? (
          <div className="media-body">
            <p className="hint">{tr('Logos, photos, captures : importez-les une fois depuis votre ordinateur, puis réutilisez-les dans tous vos modèles.', 'Logos, photos, screenshots: import them once from your computer, then reuse them in all your models.')}</p>
            <div className="media-grid">
              <button className="media-add" disabled={busy} onClick={() => file.current?.click()}>
                <Icon name="upload" size={22} />
                <span>{busy ? tr('Import…', 'Importing…') : tr('Importer depuis l\'ordinateur', 'Import from computer')}</span>
              </button>
              <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" hidden onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = '' }} />
              {media === null && <p className="muted">{tr('Chargement…', 'Loading…')}</p>}
              {media?.map((m) => (
                <div key={m.id} className="media-tile">
                  <button className="media-pick" title={m.name} onClick={() => { onPick({ kind: 'image', src: m.dataUrl }); onClose() }}>
                    <img src={m.dataUrl} alt={m.name} />
                  </button>
                  <button className="media-del" aria-label={tr('Supprimer', 'Delete')} title={tr('Supprimer', 'Delete')} onClick={() => void remove(m)}><Icon name="trash" size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="media-body">
            <div className="media-search">
              <Icon name="search" size={15} />
              <input autoFocus value={q} placeholder={tr('Rechercher une icône (en anglais : cart, user, chart…)', 'Search an icon (cart, user, chart…)')} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="chips">
              <button className={set === 'all' ? 'on' : ''} onClick={() => setSet('all')}>{tr('Toutes', 'All')}</button>
              {ICON_SETS.map((s) => <button key={s.id} className={set === s.id ? 'on' : ''} onClick={() => setSet(s.id)}>{s[lang]}</button>)}
            </div>
            <div className="icon-lib">
              {icons.map((n) => (
                <button key={n} title={n} aria-label={n} onClick={() => { onPick({ kind: 'icon', name: n }); onClose() }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[n]} /></svg>
                  <span>{n}</span>
                </button>
              ))}
              {icons.length === 0 && <p className="muted">{tr('Aucune icône ne correspond.', 'No matching icon.')}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
