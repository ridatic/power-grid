import { useCallback, useEffect, useState, type PointerEvent as RPointerEvent } from 'react'
import './App.css'
import type { ElementType, ItemProps } from './core/types'
import { TEMPLATES, templateItems, type Template } from './core/layouts'
import { DEFAULT_SIZE, findSlot, newId, type Box } from './core/grid'
import { Canvas } from './components/Canvas'
import { CommandPalette, type PaletteAction } from './components/CommandPalette'
import { ExportDialog } from './components/ExportDialog'
import { PageBar } from './components/PageBar'
import { ColorsPanel, LayoutPanel, MediaPanel, NavPanel, TemplatesPanel, TextPanel, type PanelProps, type Tab } from './components/Panels'
import { ZoneToolbar } from './components/ZoneToolbar'
import { AppFooter } from './components/AppFooter'
import { Logo } from './components/Logo'
import { TAB_NAMES, type SettingEntry } from './searchIndex'
import { FORMAT_KEYS, THEME_KEYS, TAB_KEYS, defaultsOf, isChanged } from './resets'
import { useProject } from './store'
import type { Project } from './core/types'
import { PANEL_DEFAULT, PANEL_MAX, PANEL_MIN, loadPanel, savePref, type AppSettings, type PanelPref, type UiTheme } from './prefs'
import { Icon } from './components/Icon'
import { HeaderActions } from './components/HeaderActions'
import type { Account } from './account'
import type { DocKind, ModelStore, SavedModel } from './storage'
import { useFeedback } from './feedback'
import { duplicateModel } from './saveModel'
import { useFavorites } from './favorites'
import { ModelsLibrary } from './components/ModelsLibrary'
import { MediaLibrary, type MediaPick } from './components/MediaLibrary'
import { T, type Lang } from './i18n'

const sig = (list: { type: string; col: number; row: number; cs: number; rs: number }[]) => list.map((i) => `${i.type}${i.col}.${i.row}.${i.cs}.${i.rs}`).join('|')

const RAIL: { id: Tab; icon: string }[] = [
  { id: 'templates', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { id: 'colors', icon: 'M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A4.7 4.7 0 0 0 21 9.7C21 5.9 17 3 12 3zM7.5 11.5h.01M10 7.5h.01M15 7.5h.01' },
  { id: 'nav', icon: 'M4 4h6v16H4zM13 7h7M13 12h7M13 17h7' },
  { id: 'layout', icon: 'M3 4h18v5H3zM3 12h8v8H3zM14 12h7v8h-7z' },
  { id: 'text', icon: 'M5 6V4h14v2M12 4v16M9 20h6' },
  { id: 'media', icon: 'M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9h.01' },
]

export interface EditorProps {
  initial: Project
  name: string
  onSave: (project: Project, name: string) => Promise<void>
  onBack: () => void
  lang: Lang
  onLang: (l: Lang) => void
  uiTheme: UiTheme
  onUiTheme: (t: UiTheme) => void
  account: Account | null
  onProfile: () => void
  onSignOut: () => void
  store: ModelStore
  /** Ouvre un autre de mes modeles (depuis la bibliotheque). */
  onOpenDoc: (m: SavedModel) => void
  settings: AppSettings
  onSettings: () => void
  docId: string
  /** Document des recents, ou modele de Mes modeles. */
  kind: DocKind
}

/** En dessous de cette largeur, le panneau de reglages s'ouvre par-dessus la page (tablette, telephone). */
const NARROW = 900

type SaveState = 'saved' | 'saving' | 'error'

/** L'editeur d'un modele : reglages a gauche, apercu au centre, pages en bas. */
export function Editor({ initial, name: initialName, onSave, onBack, lang, onLang, uiTheme, onUiTheme, account, onProfile, onSignOut, store, onOpenDoc, settings, onSettings, docId, kind }: EditorProps) {
  const fb = useFeedback()
  const { project, dispatch, undo, redo, canUndo, canRedo } = useProject(initial)
  const [name, setName] = useState(initialName)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [tab, setTab] = useState<Tab>('templates')
  const [more, setMore] = useState<Record<Tab, boolean>>({ templates: false, colors: false, nav: false, layout: false, text: false, media: false })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [guides, setGuides] = useState(settings.showGrid)
  const [slots, setSlots] = useState(settings.showSlots)
  const [exporting, setExporting] = useState(false)
  const [searching, setSearching] = useState(false)
  const [focusOpt, setFocusOpt] = useState<string | null>(null)
  const [models, setModels] = useState(false)
  const [media, setMedia] = useState<{ mode: 'image' | 'icon' | 'image-only'; pick: (p: MediaPick) => void } | null>(null)

  const t = T(lang)
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const { cfg } = project
  const page = project.pages[project.active]
  const items = page.items
  const selected = items.find((i) => i.id === selectedId) ?? null
  const isMenuPage = page.kind === 'menu'

  // Le modele actif est celui dont les zones correspondent exactement a la page
  const templateId = TEMPLATES.find((tpl) => sig(tpl.cells) === sig(items))?.id ?? null

  const notify = useCallback((msg: string) => fb.toast(msg), [fb])

  // Panneau de reglages : largeur reglable a la souris, repliable ; garde dans ce navigateur
  const [panel, setPanel] = useState<PanelPref>(() => (window.innerWidth < NARROW ? { ...loadPanel(), open: false } : loadPanel()))
  useEffect(() => savePref('panel', JSON.stringify(panel)), [panel])
  const startPanelResize = (e: RPointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const x0 = e.clientX
    const w0 = panel.open ? panel.width : 0
    const onMove = (ev: PointerEvent) => {
      const w = w0 + ev.clientX - x0
      // tire tres a gauche : le panneau se replie
      setPanel((p) => (w < PANEL_MIN / 2 ? { open: false, width: w0 || p.width } : { open: true, width: Math.min(PANEL_MAX, Math.max(PANEL_MIN, w)) }))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.classList.remove('col-resizing')
    }
    document.body.classList.add('col-resizing')
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const openTab = (next: Tab) => {
    setTab(next)
    setSelectedId(null)
    setPanel((p) => (p.open ? p : { ...p, open: true }))
  }
  // Un clic sur l'onglet deja ouvert replie ou rouvre le panneau
  const railClick = (next: Tab) => (next === tab && panel.open ? setPanel((p) => ({ ...p, open: false })) : openTab(next))

  const applyTemplate = (tpl: Template) => {
    dispatch({ t: 'template', items: templateItems(tpl), rows: tpl.rows })
    setSelectedId(null)
  }

  const setType = (type: ElementType, props?: Partial<ItemProps>) => selected && dispatch({ t: 'update', id: selected.id, patch: { type, ...(props ? { props: { ...selected.props, ...props } } : {}) } })
  const moveItem = (id: string, box: Box) => dispatch({ t: 'update', id, patch: box })
  const addItem = (type: ElementType, props?: ItemProps) => {
    // une image ou une icone s'ajoute depuis la bibliotheque
    if (!props && (type === 'image' || type === 'icon')) {
      setMedia({ mode: type, pick: (p) => (p.kind === 'image' ? addItem('image', { src: p.src, fit: 'contain' }) : addItem('icon', { icon: p.name })) })
      return
    }
    const size = DEFAULT_SIZE[type]
    const slot = findSlot(items, { col: 1, row: 1, ...size }) ?? findSlot(items, { col: 1, row: 1, cs: 1, rs: 1 })
    if (!slot) return notify(tr('Plus de place libre sur la page : supprimez ou réduisez un élément.', 'No free room on the page: delete or shrink an element.'))
    const id = newId(type)
    dispatch({ t: 'add', item: { id, type, ...slot, ...(props ? { props } : {}) } })
    setSelectedId(id)
  }
  const setProps = (patch: Partial<ItemProps>) => selected && dispatch({ t: 'update', id: selected.id, patch: { props: { ...selected.props, ...patch } } })

  const removeSelected = () => {
    if (!selected) return
    dispatch({ t: 'remove', id: selected.id })
    setSelectedId(null)
  }

  const goPage = (index: number) => {
    dispatch({ t: 'setPage', index })
    setSelectedId(null)
  }

  const removePage = async (index: number) => {
    if (!(await fb.confirm({ title: tr(`Supprimer la page « ${project.pages[index].name} » ?`, `Delete the page "${project.pages[index].name}"?`), message: tr('Ses zones et ses réglages propres sont perdus. Vous pouvez annuler ensuite (Ctrl Z).', 'Its zones and settings are lost. You can undo afterwards (Ctrl Z).'), confirmLabel: tr('Supprimer', 'Delete'), danger: true }))) return
    dispatch({ t: 'removePage', index })
    setSelectedId(null)
  }

  // Enregistrement automatique si le parametre est actif ; sinon bouton Enregistrer (Ctrl S)
  const auto = settings.autosave
  const [savedSnap, setSavedSnap] = useState({ project, name })
  const doSave = useCallback(async () => {
    setSaveState('saving')
    try {
      await onSave(project, name.trim() || tr('Sans titre', 'Untitled'))
      setSaveState('saved')
      setSavedSnap({ project, name })
      return true
    } catch (err) {
      console.error(err)
      setSaveState('error')
      return false
    }
  }, [onSave, project, name]) // eslint-disable-line react-hooks/exhaustive-deps

  const changed = project !== savedSnap.project || name !== savedSnap.name
  useEffect(() => {
    if (!auto || !changed) return
    const id = window.setTimeout(() => void doSave(), 1000)
    return () => window.clearTimeout(id)
  }, [project, name]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sans enregistrement automatique, on compare au dernier etat enregistre
  const unsaved = !auto && changed
  const pending = auto && changed
  const dirty = unsaved || saveState === 'error'
  // Le navigateur previent avant de fermer ou d'actualiser une page aux modifications non enregistrees
  useEffect(() => {
    if (!dirty) return
    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [dirty])

  /** Avant de quitter : enregistrer ou non les modifications, ou rester. */
  const leave = async (then: () => void) => {
    // un enregistrement automatique encore en attente part tout de suite, pour ne rien perdre
    if (pending) await doSave()
    if (!dirty) return then()
    const choice = await fb.choose({
      title: tr('Enregistrer les modifications ?', 'Save your changes?'),
      message: tr('Les modifications ne sont pas enregistrées. Si vous quittez sans enregistrer, elles seront perdues.', 'Changes are not saved. If you leave without saving, they will be lost.'),
      cancelLabel: tr('Rester', 'Stay'),
      choices: [
        { id: 'discard', label: tr('Ne pas enregistrer', 'Don\'t save'), danger: true },
        { id: 'save', label: tr('Enregistrer', 'Save'), primary: true },
      ],
    })
    if (choice === 'discard') return then()
    if (choice === 'save' && (await doSave())) then()
  }

  /* Actions du modele ouvert : favori, dupliquer, supprimer */
  const fav = useFavorites(store, () => fb.toast(tr('Le favori n\'a pas pu être enregistré.', 'The favorite could not be saved.'), 'error'))
  const duplicate = async () => {
    try {
      await duplicateModel(store, fb, lang, project, name, isModel ? 'model' : 'file')
    } catch (e) {
      console.error(e)
      fb.toast(tr('La copie n\'a pas pu être créée.', 'The copy could not be created.'), 'error')
    }
  }
  // Un document devient un modele quand l'utilisateur l'ajoute a Mes modeles
  const [isModel, setIsModel] = useState(kind === 'model')
  // Mes modeles : un interrupteur, comme l'etoile
  const toggleModel = async () => {
    const next = !isModel
    setIsModel(next)
    try {
      await store.setKind(docId, next ? 'model' : 'file')
    } catch (e) {
      console.error(e)
      setIsModel(!next)
      fb.toast(tr('Mes modèles n\'a pas pu être mis à jour.', 'My models could not be updated.'), 'error')
    }
  }
  const removeModel = async () => {
    const ok = await fb.confirm({ title: tr(`Supprimer « ${name.trim() || initialName} » ?`, `Delete "${name.trim() || initialName}"?`), message: (isModel ? tr('Le modèle est supprimé définitivement, et vous revenez à l\'accueil.', 'The model is deleted for good, and you go back to the home page.') : tr('Le document est supprimé définitivement, et vous revenez à l\'accueil.', 'The document is deleted for good, and you go back to the home page.')), confirmLabel: tr('Supprimer', 'Delete'), danger: true })
    if (!ok) return
    try {
      await store.remove(docId)
      fav.forget(docId)
      onBack()
    } catch (e) {
      console.error(e)
      fb.toast(tr('La suppression a échoué. Réessayez.', 'Deleting failed. Try again.'), 'error')
    }
  }
  const starred = fav.isFav(docId)

  const resetTheme = () => {
    dispatch({ t: 'cfg', patch: defaultsOf(THEME_KEYS) })
  }

  // Bouton de remise a zero de l'onglet courant (n'apparait que si quelque chose a change)
  const tabReset = (() => {
    if (tab === 'media') return null
    if (tab === 'templates') {
      if (isMenuPage) return isChanged(cfg, ['menu']) ? { label: tr('Réinitialiser le menu principal', 'Reset the main menu'), run: () => dispatch({ t: 'cfg', patch: defaultsOf(['menu']) }) } : null
      if (isChanged(cfg, FORMAT_KEYS)) return { label: tr('Rétablir le format par défaut', 'Restore the default format'), run: () => dispatch({ t: 'cfg', patch: defaultsOf(FORMAT_KEYS) }) }
      return templateId === TEMPLATES[0].id ? null : { label: tr('Revenir au modèle par défaut', 'Back to the default template'), run: () => applyTemplate(TEMPLATES[0]) }
    }
    const keys = TAB_KEYS[tab]
    return isChanged(cfg, keys) ? { label: tr(`Réinitialiser « ${TAB_NAMES[tab].fr} »`, `Reset "${TAB_NAMES[tab].en}"`), run: () => dispatch({ t: 'cfg', patch: defaultsOf(keys) }) } : null
  })()

  const switchLang = (next: Lang) => onLang(next)

  // Recherche : ouvre l'onglet, deplie « Plus d'options » si besoin, puis met le reglage en evidence
  const pickSetting = (e: SettingEntry) => {
    setSelectedId(null)
    setTab(e.tab)
    if (e.more) setMore((m) => ({ ...m, [e.tab]: true }))
    setFocusOpt(e.id)
  }
  useEffect(() => {
    if (!focusOpt) return
    const id = window.setTimeout(() => {
      const el = document.querySelector(`[data-opt="${focusOpt}"]`)
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        el.classList.add('flash')
        window.setTimeout(() => el.classList.remove('flash'), 1600)
        ;(el.querySelector('input, select, button') as HTMLElement | null)?.focus({ preventScroll: true })
      }
      setFocusOpt(null)
    }, 60)
    return () => window.clearTimeout(id)
  }, [focusOpt, tab, more])

  const actions: PaletteAction[] = [
    { kind: 'action', id: 'export', fr: 'Exporter vers Power BI', en: 'Export to Power BI', keys: 'telecharger export png svg theme json', glyph: '⇩', run: () => setExporting(true) },
    { kind: 'action', id: 'addPage', fr: 'Ajouter une page', en: 'Add a page', keys: 'nouvelle page onglet', glyph: '+', run: () => dispatch({ t: 'addPage' }) },
    { kind: 'action', id: 'addMenu', fr: 'Ajouter un menu principal', en: 'Add a main menu', keys: 'accueil menu couverture', glyph: '☷', run: () => dispatch({ t: 'addPage', kind: 'menu' }) },
    { kind: 'action', id: 'grid', fr: 'Afficher ou masquer la grille', en: 'Toggle grid', keys: 'grille colonnes guides', glyph: '#', run: () => setGuides((v) => !v) },
    { kind: 'action', id: 'slots', fr: 'Afficher les emplacements Power BI', en: 'Show Power BI slots', keys: 'emplacements boutons positions coordonnees', glyph: '⌖', run: () => setSlots((v) => !v) },
    { kind: 'action', id: 'dark', fr: 'Basculer clair / sombre', en: 'Toggle light / dark', keys: 'mode sombre nuit clair', glyph: '◐', run: () => dispatch({ t: 'cfg', patch: { mode: cfg.mode === 'dark' ? 'light' : 'dark' } }) },
    { kind: 'action', id: 'lang', fr: 'Passer en anglais', en: 'Switch to French', keys: 'langue english francais language', glyph: '⇄', run: () => switchLang(lang === 'fr' ? 'en' : 'fr') },
    { kind: 'action', id: 'undo', fr: 'Annuler', en: 'Undo', keys: 'annuler retour ctrl z', glyph: '↶', run: undo },
    { kind: 'action', id: 'resetTheme', fr: 'Réinitialiser tout le thème', en: 'Reset the whole theme', keys: 'reinitialiser defaut theme valeurs par defaut reset', glyph: '↺', run: resetTheme },
    { kind: 'action', id: 'uiTheme', fr: 'Interface claire ou sombre', en: 'Light or dark interface', keys: 'interface sombre clair dark theme', glyph: '◑', run: () => onUiTheme(uiTheme === 'dark' ? 'light' : 'dark') },
    { kind: 'action', id: 'home', fr: 'Retour à l\'accueil', en: 'Back to home', keys: 'accueil modeles favoris recents bibliotheque nouveau', glyph: '⌂', run: () => void leave(onBack) },
  ]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      if (mod && k === 's') {
        e.preventDefault()
        if (dirty) void doSave()
        return
      }
      if (mod && k === 'k') {
        e.preventDefault()
        setSearching(true)
        return
      }
      if ((e.target as HTMLElement).closest?.('input, textarea, select, [contenteditable]')) return
      if (mod && k === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && k === 'y') {
        e.preventDefault()
        redo()
      } else if (selected && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault()
        removeSelected()
      } else if (e.key === 'Escape') {
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const panelProps: PanelProps = {
    project,
    dispatch,
    lang,
    more: more[tab],
    toggleMore: () => setMore((m) => ({ ...m, [tab]: !m[tab] })),
    notify,
    templateId,
    onTemplate: applyTemplate,
    store,
    onMedia: (mode, pick) => setMedia({ mode, pick }),
    onInsert: (type, props) => addItem(type, props),
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <button className="brand-link editor-logo" onClick={() => void leave(onBack)} aria-label={tr('Retour à l\'accueil', 'Back to home')} title={tr('Retour à l\'accueil', 'Back to home')}>
            <Logo height={32} />
          </button>
          <button className="icon-btn home-btn" onClick={() => void leave(onBack)} aria-label={tr('Accueil', 'Home')} title={tr('Retour à l\'accueil : récents, favoris, modèles', 'Back to home: recent, favorites, models')}>
            <Icon name="home" size={18} />
          </button>
          <div className="doc">
            <div className="doc-line">
              <input className="doc-name" value={name} aria-label={isModel ? tr('Nom du modèle', 'Model name') : tr('Nom du document', 'Document name')} title={tr('Renommer', 'Rename')} onChange={(e) => setName(e.target.value)} />
              <Icon name="pencil" size={13} />
            </div>
            <small className={`save-state ${saveState}`}>{saveState === 'saving' || (pending && saveState !== 'error') ? tr('Enregistrement…', 'Saving…') : saveState === 'error' ? tr('Échec de l\'enregistrement', 'Saving failed') : unsaved ? tr('Modifications non enregistrées', 'Unsaved changes') : tr('Enregistré', 'Saved')}</small>
          </div>
        </div>
        <button className="search" onClick={() => setSearching(true)}>
          <Icon name="search" size={15} />
          <span>{tr('Rechercher une option, une couleur, une action…', 'Search an option, a color, an action…')}</span>
          <kbd>Ctrl K</kbd>
        </button>
        <HeaderActions lang={lang} onLang={switchLang} uiTheme={uiTheme} onUiTheme={onUiTheme} account={account} onProfile={onProfile} onHome={() => void leave(onBack)} onModels={() => setModels(true)} onSignOut={() => void leave(onSignOut)} onSettings={onSettings} trailing={<button className="btn primary export-btn" onClick={() => setExporting(true)} title={tr('Exporter vers Power BI', 'Export to Power BI')}><Icon name="download" size={15} /><span className="lbl">{tr('Exporter', 'Export')}</span></button>}>
          <button className="icon-btn hist-btn" aria-label={t.undo} title={`${t.undo} (Ctrl Z)`} disabled={!canUndo} onClick={undo}><Icon name="undo" size={18} /></button>
          <button className="icon-btn hist-btn" aria-label={t.redo} title={`${t.redo} (Ctrl Y)`} disabled={!canRedo} onClick={redo}><Icon name="redo" size={18} /></button>
          <span className="bar-sep" />
          <button className={`btn save-btn${dirty ? ' primary' : ''}`} disabled={!dirty} title={`${tr('Enregistrer les modifications', 'Save changes')} (Ctrl S)`} onClick={() => void doSave()}>
            <Icon name="save" size={15} />
            <span className="lbl">{saveState === 'saving' ? tr('Enregistrement…', 'Saving…') : dirty ? tr('Enregistrer', 'Save') : tr('Enregistré', 'Saved')}</span>
          </button>
          <button className="icon-btn" aria-label={tr('Mes modèles', 'My models')} title={tr('Mes modèles : ouvrir un autre modèle', 'My models: open another model')} onClick={() => setModels(true)}><Icon name="layout" size={18} /></button>
          <span className="bar-sep" />
        </HeaderActions>
      </header>

      <div className="workspace">
        <nav className="rail" aria-label={tr('Réglages', 'Settings')}>
          {RAIL.map((r) => (
            <button key={r.id} className={tab === r.id && panel.open ? 'on' : ''} aria-current={tab === r.id ? 'page' : undefined} aria-expanded={tab === r.id ? panel.open : undefined} title={tab === r.id && panel.open ? tr('Cliquer pour replier le panneau', 'Click to collapse the panel') : undefined} onClick={() => railClick(r.id)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={r.icon} /></svg>
              <span>{TAB_NAMES[r.id][lang]}</span>
            </button>
          ))}
          <button className="rail-toggle" onClick={() => setPanel((p) => ({ ...p, open: !p.open }))} aria-label={panel.open ? tr('Replier le panneau', 'Collapse the panel') : tr('Déplier le panneau', 'Expand the panel')} title={panel.open ? tr('Replier le panneau', 'Collapse the panel') : tr('Déplier le panneau', 'Expand the panel')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={panel.open ? 'M4 4h16v16H4zM9 4v16M16 9l-3 3 3 3' : 'M4 4h16v16H4zM9 4v16M13 9l3 3-3 3'} /></svg>
          </button>
        </nav>

        {panel.open && <aside className="panel" style={{ width: panel.width }}>
          {tab === 'templates' && <TemplatesPanel {...panelProps} />}
          {tab === 'colors' && <ColorsPanel {...panelProps} />}
          {tab === 'nav' && <NavPanel {...panelProps} />}
          {tab === 'layout' && <LayoutPanel {...panelProps} />}
          {tab === 'text' && <TextPanel {...panelProps} />}
          {tab === 'media' && <MediaPanel {...panelProps} />}
          <div className="panel-foot">
            {tabReset && <button className="btn wide" onClick={tabReset.run}>{tabReset.label}</button>}
            {isChanged(cfg, THEME_KEYS) && <button className="link" onClick={() => void fb.confirm({ title: tr('Réinitialiser tout le thème ?', 'Reset the whole theme?'), message: tr('Couleurs, navigation et mise en page reviennent aux valeurs par défaut. Les textes sont conservés.', 'Colors, navigation and layout go back to defaults. Texts are kept.'), confirmLabel: tr('Réinitialiser', 'Reset') }).then((ok) => ok && resetTheme())}>{tr('Réinitialiser tout le thème', 'Reset the whole theme')}</button>}
          </div>
        </aside>}
        {panel.open && <div className="panel-backdrop" aria-hidden="true" onPointerDown={() => setPanel((p) => ({ ...p, open: false }))} />}
        <div className="panel-resizer" role="separator" aria-orientation="vertical" aria-label={tr('Largeur du panneau', 'Panel width')} title={tr('Glisser pour élargir ou réduire. Double-clic : largeur par défaut.', 'Drag to widen or narrow. Double-click: default width.')} onPointerDown={startPanelResize} onDoubleClick={() => setPanel({ open: true, width: PANEL_DEFAULT })} />

        <main className="main">
          <Canvas
            project={project}
            t={t}
            lang={lang}
            selectedId={selectedId}
            guides={guides}
            slots={slots}
            onSelect={setSelectedId}
            onOpenTab={openTab}
            onMove={moveItem}
            onAdd={addItem}
            tools={
              <>
                <button className={`tool-btn${guides ? ' on' : ''}`} aria-pressed={guides} onClick={() => setGuides(!guides)} title={tr('Afficher la grille', 'Show the grid')} aria-label={tr('Grille', 'Grid')}>
                  <Icon name="grid" size={17} />
                </button>
                <button className={`tool-btn${slots ? ' on' : ''}`} aria-pressed={slots} onClick={() => setSlots(!slots)} title={tr('Afficher les emplacements : où poser les boutons et visuels dans Power BI', 'Show slots: where to place buttons and visuals in Power BI')} aria-label={tr('Emplacements', 'Slots')}>
                  <Icon name="target" size={17} />
                </button>
                <span className="tools-sep" />
                <button className={`tool-btn fav${starred ? ' on' : ''}`} aria-pressed={starred} onClick={() => fav.toggle(docId)} title={starred ? tr('Retirer des favoris', 'Remove from favorites') : tr('Ajouter aux favoris', 'Add to favorites')} aria-label={starred ? tr('Retirer des favoris', 'Remove from favorites') : tr('Ajouter aux favoris', 'Add to favorites')}>
                  <Icon name="star" size={17} />
                </button>
                <button className={`tool-btn model-tg${isModel ? ' on' : ''}`} aria-pressed={isModel} onClick={() => void toggleModel()} title={isModel ? tr('Retirer de mes modèles', 'Remove from my models') : tr('Ajouter à mes modèles', 'Add to my models')} aria-label={isModel ? tr('Retirer de mes modèles', 'Remove from my models') : tr('Ajouter à mes modèles', 'Add to my models')}>
                  <Icon name="bookmarkPlus" size={17} />
                </button>
                <button className="tool-btn" onClick={() => void duplicate()} title={tr('Dupliquer : une copie sous un nouveau nom', 'Duplicate: a copy under a new name')} aria-label={tr('Dupliquer', 'Duplicate')}>
                  <Icon name="copy" size={17} />
                </button>
                <button className="tool-btn danger" onClick={() => void removeModel()} title={isModel ? tr('Supprimer ce modèle', 'Delete this model') : tr('Supprimer ce document', 'Delete this document')} aria-label={tr('Supprimer', 'Delete')}>
                  <Icon name="trash" size={17} />
                </button>
              </>
            }
            toolbar={selected && <ZoneToolbar key={selected.id} t={t} lang={lang} cfg={cfg} item={selected} rows={page.rows} onType={setType} onProps={setProps} onRemove={removeSelected} onMedia={(mode, pick) => setMedia({ mode, pick })} />}
          />
          <PageBar project={project} dispatch={dispatch} lang={lang} onPage={goPage} onRemovePage={removePage} />
        </main>
      </div>

      <AppFooter lang={lang} />

      {searching && <CommandPalette lang={lang} cfg={cfg} isMenuPage={isMenuPage} actions={actions} onPick={pickSetting} onClose={() => setSearching(false)} />}
      {exporting && (
        <ExportDialog
          project={project}
          t={t}
          lang={lang}
          onClose={() => setExporting(false)}
          onDone={() => notify(tr('Fichier téléchargé', 'File downloaded'))}
          onExtraTheme={(json, name) => dispatch({ t: 'cfg', patch: { extraTheme: json, extraThemeName: name } })}
        />
      )}
      {models && (
        <ModelsLibrary
          lang={lang}
          store={store}
          onClose={() => setModels(false)}
          currentId={docId}
          onOpen={(m) => void leave(() => onOpenDoc(m))}
        />
      )}
      {media && <MediaLibrary lang={lang} store={store} mode={media.mode} onPick={media.pick} onClose={() => setMedia(null)} />}
    </>
  )
}
