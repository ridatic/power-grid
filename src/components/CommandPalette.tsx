import { useEffect, useMemo, useRef, useState } from 'react'
import type { Config } from '../core/types'
import { SETTINGS, TAB_NAMES, matches, type SettingEntry } from '../searchIndex'
import type { Lang } from '../i18n'

export interface PaletteAction {
  kind: 'action'
  id: string
  fr: string
  en: string
  keys: string
  glyph: string
  run: () => void
}

type Entry = SettingEntry | PaletteAction

interface Props {
  lang: Lang
  cfg: Config
  isMenuPage: boolean
  actions: PaletteAction[]
  onPick: (e: SettingEntry) => void
  onClose: () => void
}

const GLYPH: Record<string, string> = { templates: '▦', colors: '◐', nav: '☰', layout: '▭', text: 'T' }

/** Recherche de n'importe quel reglage ou action (Ctrl K). */
export function CommandPalette({ lang, cfg, isMenuPage, actions, onPick, onClose }: Props) {
  const [q, setQ] = useState('')
  const [index, setIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)

  const results = useMemo(() => {
    const settings = SETTINGS.filter((s) => (s.menu ? isMenuPage : true))
    const all: Entry[] = [...settings, ...actions]
    if (!q.trim()) return all.slice(0, 9)
    return all.filter((e) => matches(q, `${e.fr} ${e.en} ${e.keys} ${e.kind === 'setting' ? TAB_NAMES[e.tab].fr : ''}`)).slice(0, 12)
  }, [q, actions, isMenuPage])

  useEffect(() => {
    listRef.current?.querySelector('.on')?.scrollIntoView({ block: 'nearest' })
  }, [index])

  const choose = (e: Entry | undefined) => {
    if (!e) return
    onClose()
    if (e.kind === 'action') e.run()
    else onPick(e)
  }

  const settings = results.filter((r): r is SettingEntry => r.kind === 'setting')
  const acts = results.filter((r): r is PaletteAction => r.kind === 'action')
  const ordered: Entry[] = [...settings, ...acts]

  const row = (e: Entry) => {
    const i = ordered.indexOf(e)
    const on = i === index
    const name = lang === 'fr' ? e.fr : e.en
    const where = e.kind === 'setting' ? `${TAB_NAMES[e.tab][lang]}${e.more ? ` › ${tr('Plus d\'options', 'More options')}` : ''}` : tr('Action', 'Action')
    const value = e.kind === 'setting' ? e.value?.(cfg) : ''
    return (
      <button key={e.id + e.kind} className={`cmd-row${on ? ' on' : ''}`} onMouseEnter={() => setIndex(i)} onClick={() => choose(e)}>
        <span className="cmd-glyph" aria-hidden="true">{e.kind === 'setting' ? GLYPH[e.tab] : e.glyph}</span>
        <span className="cmd-text">
          <b>{name}</b>
          <small>{where}</small>
        </span>
        {value && <span className="cmd-value">{value}</span>}
      </button>
    )
  }

  return (
    <div className="overlay top" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cmd" role="dialog" aria-modal="true" aria-label={tr('Rechercher', 'Search')}>
        <div className="cmd-input">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            autoFocus
            value={q}
            placeholder={tr('Rechercher une option, une couleur, une action…', 'Search an option, a color, an action…')}
            onChange={(e) => {
              setQ(e.target.value)
              setIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setIndex((i) => Math.min(ordered.length - 1, i + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setIndex((i) => Math.max(0, i - 1))
              } else if (e.key === 'Enter') {
                choose(ordered[index])
              } else if (e.key === 'Escape') {
                onClose()
              }
            }}
          />
          <kbd>Échap</kbd>
        </div>
        <div className="cmd-list" ref={listRef}>
          {ordered.length === 0 && <p className="cmd-empty">{tr('Aucun résultat. Essayez « couleur », « titre », « coins »…', 'No result. Try "color", "title", "corners"…')}</p>}
          {settings.length > 0 && <div className="cmd-group">{tr('Réglages', 'Settings')}</div>}
          {settings.map(row)}
          {acts.length > 0 && <div className="cmd-group">{tr('Actions', 'Actions')}</div>}
          {acts.map(row)}
        </div>
        <div className="cmd-foot">
          <span>↑ ↓ {tr('pour choisir', 'to move')}</span>
          <span>{tr('Entrée pour ouvrir', 'Enter to open')}</span>
        </div>
      </div>
    </div>
  )
}
