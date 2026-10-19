import { useEffect, useState } from 'react'
import './App.css'
import type { ElementType, ItemProps } from './core/types'
import { TEMPLATES, templateItems, type Template } from './core/layouts'
import { Canvas } from './components/Canvas'
import { Inspector } from './components/Inspector'
import { Options } from './components/Options'
import { ExportDialog } from './components/ExportDialog'
import { Icon } from './components/Icon'
import { pageIcon } from './core/nav'
import { useProject } from './store'
import { T, type Lang } from './i18n'

function loadLang(): Lang {
  try {
    return localStorage.getItem('power-grid.lang') === 'en' ? 'en' : 'fr'
  } catch {
    return 'fr'
  }
}

const sig = (list: { type: string; col: number; row: number; cs: number; rs: number }[]) => list.map((i) => `${i.type}${i.col}.${i.row}.${i.cs}.${i.rs}`).join('|')

export default function App() {
  const { project, dispatch, undo, redo, canUndo, canRedo } = useProject()
  const [lang, setLang] = useState<Lang>(loadLang)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [guides, setGuides] = useState(false)
  const [slots, setSlots] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const t = T(lang)
  const { cfg } = project
  const page = project.pages[project.active]
  const items = page.items
  const selected = items.find((i) => i.id === selectedId) ?? null

  // Le modele actif est celui dont les zones correspondent exactement a la page
  const templateId = TEMPLATES.find((tpl) => sig(tpl.cells) === sig(items))?.id ?? null

  const notify = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast((m) => (m === msg ? null : m)), 1800)
  }

  const applyTemplate = (tpl: Template) => {
    dispatch({ t: 'template', items: templateItems(tpl), rows: tpl.rows })
    setSelectedId(null)
    notify(t.toastTemplate)
  }

  const setType = (type: ElementType) => selected && dispatch({ t: 'update', id: selected.id, patch: { type } })
  const setProps = (patch: Partial<ItemProps>) => selected && dispatch({ t: 'update', id: selected.id, patch: { props: { ...selected.props, ...patch } } })

  const removeSelected = () => {
    if (!selected) return
    dispatch({ t: 'remove', id: selected.id })
    setSelectedId(null)
  }

  const removePage = (index: number) => {
    if (!window.confirm(t.confirmRemovePage)) return
    dispatch({ t: 'removePage', index })
    setSelectedId(null)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
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

  const switchLang = (next: Lang) => {
    setLang(next)
    try {
      localStorage.setItem('power-grid.lang', next)
    } catch {
      /* preference non sauvegardee */
    }
  }

  const label = selected ? `${t.types[selected.type]}${selected.props?.title && selected.type !== 'header' ? ' · ' + selected.props.title : ''}` : ''

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="logo" aria-hidden="true">ϟ</div>
          <div>
            <strong>Power-Grid</strong>
            <small>{t.appSub}</small>
          </div>
        </div>
        <nav className="tabs" aria-label="Pages">
          {project.pages.map((p, i) => (
            <button
              key={p.id}
              className={`tab${i === project.active ? ' active' : ''}`}
              aria-current={i === project.active ? 'page' : undefined}
              onClick={() => {
                dispatch({ t: 'setPage', index: i })
                setSelectedId(null)
              }}
            >
              <Icon name={p.kind === 'menu' ? 'star' : pageIcon(p, i)} size={14} />
              &nbsp;{p.name}
            </button>
          ))}
        </nav>
        <div className="actions">
          <button className="btn" disabled={!canUndo} onClick={undo}>↶ <span className="undo-label">{t.undo}</span></button>
          <button className="btn" disabled={!canRedo} onClick={redo}>↷ <span className="undo-label">{t.redo}</span></button>
          <button className="btn" onClick={() => window.confirm(t.confirmReset) && dispatch({ t: 'reset' })}>{t.newProject}</button>
          <div className="btn lang" role="group" aria-label="Language">
            <button className={lang === 'fr' ? 'active' : ''} aria-pressed={lang === 'fr'} onClick={() => switchLang('fr')}>FR</button>
            <button className={lang === 'en' ? 'active' : ''} aria-pressed={lang === 'en'} onClick={() => switchLang('en')}>EN</button>
          </div>
          <button className="btn primary" onClick={() => setExporting(true)}>⇩ {t.export}</button>
        </div>
      </header>

      <div className="workspace">
        <aside className={`left${collapsed ? ' collapsed' : ''}`}>
          <div className="panel-top">
            <strong>{t.personalize}</strong>
            <span className="hint" style={{ fontSize: 10, color: '#94a0b4' }}>{t.sectionsCount}</span>
            <button className="collapse" aria-label={collapsed ? t.expand : t.collapse} title={collapsed ? t.expand : t.collapse} onClick={() => setCollapsed(!collapsed)}>{collapsed ? '»' : '«'}</button>
          </div>
          {!collapsed && <Options project={project} dispatch={dispatch} lang={lang} templateId={templateId} onTemplate={applyTemplate} onRemovePage={removePage} notify={notify} />}
        </aside>

        <main className="main">
          <div className="canvas-toolbar">
            <button className={`btn${guides ? ' selected' : ''}`} aria-pressed={guides} onClick={() => setGuides(!guides)}>▦ {t.guides}</button>
            <button className={`btn${slots ? ' selected' : ''}`} aria-pressed={slots} onClick={() => setSlots(!slots)}>⌖ {t.slots}</button>
            <span className="spacer" />
            <span className="badge"><i className="dot" />{t.liveBadge}</span>
          </div>
          <Canvas project={project} t={t} selectedId={selectedId} guides={guides} slots={slots} onSelect={setSelectedId} />
          <div className="statusline">
            <i className="dot" /> {t.liveStatus}
            <span style={{ marginLeft: 'auto' }}>▣ &nbsp;{cfg.width} × {cfg.height}</span>
          </div>
        </main>

        <aside className={`right${selected ? ' open' : ''}`}>
          {selected && <Inspector t={t} lang={lang} cfg={cfg} item={selected} rows={page.rows} label={label} onType={setType} onProps={setProps} onRemove={removeSelected} onClose={() => setSelectedId(null)} />}
        </aside>
      </div>

      {exporting && <ExportDialog project={project} t={t} onClose={() => setExporting(false)} onDone={() => notify(t.toastExport)} />}
      <div className={`toast${toast ? ' show' : ''}`} role="status">{toast}</div>
    </>
  )
}
