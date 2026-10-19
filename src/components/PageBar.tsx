import { useState } from 'react'
import type { Project } from '../core/types'
import type { Action } from '../store'
import { MAX_PAGES } from '../store'
import type { Lang } from '../i18n'

interface Props {
  project: Project
  dispatch: (a: Action) => void
  lang: Lang
  guides: boolean
  slots: boolean
  onGuides: (v: boolean) => void
  onSlots: (v: boolean) => void
  onPage: (index: number) => void
  onRemovePage: (index: number) => void
}

/** Onglets de pages en bas de l'apercu, comme dans Power BI. */
export function PageBar({ project, dispatch, lang, guides, slots, onGuides, onSlots, onPage, onRemovePage }: Props) {
  const [renaming, setRenaming] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const full = project.pages.length >= MAX_PAGES
  const hasMenu = project.pages.some((p) => p.kind === 'menu')

  return (
    <div className="pagebar">
      <div className="ptabs" role="tablist" aria-label={tr('Pages', 'Pages')}>
        {project.pages.map((p, i) => (
          <div key={p.id} className={`ptab${i === project.active ? ' on' : ''}`}>
            {renaming === i ? (
              <input
                autoFocus
                aria-label={tr('Nom de la page', 'Page name')}
                defaultValue={p.name}
                onFocus={(e) => e.target.select()}
                onBlur={(e) => {
                  dispatch({ t: 'pagePatch', index: i, patch: { name: e.target.value.trim() || p.name } })
                  setRenaming(null)
                }}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === 'Escape') && e.currentTarget.blur()}
              />
            ) : (
              <button role="tab" aria-selected={i === project.active} title={tr('Double-cliquez pour renommer', 'Double-click to rename')} onClick={() => onPage(i)} onDoubleClick={() => setRenaming(i)}>
                {p.kind === 'menu' && <span className="ptag">{tr('Menu', 'Menu')}</span>}
                {p.name}
              </button>
            )}
            {i === project.active && project.pages.length > 1 && renaming !== i && (
              <button className="ptab-x" aria-label={tr('Supprimer la page', 'Delete page')} title={tr('Supprimer la page', 'Delete page')} onClick={() => onRemovePage(i)}>×</button>
            )}
          </div>
        ))}
      </div>
      <div className="padd-wrap">
        <button className="padd" disabled={full} aria-expanded={adding} onClick={() => setAdding(!adding)}>+ {tr('Page', 'Page')}</button>
        {adding && (
          <div className="menu-pop" onPointerLeave={() => setAdding(false)}>
            <button onClick={() => { dispatch({ t: 'addPage' }); setAdding(false) }}>
              <b>{tr('Page de contenu', 'Content page')}</b>
              <small>{tr('KPI, graphiques, tableaux', 'KPIs, charts, tables')}</small>
            </button>
            <button disabled={hasMenu} onClick={() => { dispatch({ t: 'addPage', kind: 'menu' }); setAdding(false) }}>
              <b>{tr('Menu principal', 'Main menu')}</b>
              <small>{hasMenu ? tr('Déjà présent', 'Already added') : tr('Page d\'accueil qui mène aux autres', 'Home page leading to others')}</small>
            </button>
          </div>
        )}
      </div>
      <div className="pagebar-right">
        <button className={`toggle-txt${guides ? ' on' : ''}`} aria-pressed={guides} onClick={() => onGuides(!guides)}>{tr('Grille', 'Grid')}</button>
        <button className={`toggle-txt${slots ? ' on' : ''}`} aria-pressed={slots} onClick={() => onSlots(!slots)} title={tr('Montre où poser les boutons et visuels dans Power BI', 'Shows where to place buttons and visuals in Power BI')}>{tr('Emplacements', 'Slots')}</button>
        <span className="sep" />
        <span className="muted">{project.cfg.width} × {project.cfg.height}</span>
      </div>
    </div>
  )
}
