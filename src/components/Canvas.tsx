import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPE, type ReactNode } from 'react'
import type { ElementType, GridItem, Project, Rect } from '../core/types'
import { COLS, ROWS, cellAt, findSlot, isFree, isHidden, itemRect, type Box } from '../core/grid'
import type { GridItem as Item } from '../core/types'
import { resolveColors } from '../core/layout'
import { navInsets } from '../core/nav'
import { buildPage } from '../core/svg'
import { ElementView } from './ElementView'
import type { Tab } from './Panels'
import type { Dict, Lang } from '../i18n'

interface Props {
  project: Project
  t: Dict
  lang: Lang
  selectedId: string | null
  guides: boolean
  slots: boolean
  onSelect: (id: string | null) => void
  onOpenTab: (tab: Tab) => void
  onMove: (id: string, box: Box) => void
  onAdd: (type: ElementType) => void
  toolbar: ReactNode
  /** Actions du document (favori, enregistrer comme modele, dupliquer), a cote du bouton Ajouter. */
  tools?: ReactNode
}

type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
const EDGES: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

/**
 * Le plus grand bloc libre entre la taille d'origine et la taille demandee :
 * si un voisin gene, l'element s'agrandit jusqu'a lui au lieu de rester bloque.
 */
function growFree(items: Item[], id: string, from: Box, want: Box): Box {
  const L0 = from.col, R0 = from.col + from.cs - 1, T0 = from.row, B0 = from.row + from.rs - 1
  const L1 = want.col, R1 = want.col + want.cs - 1, T1 = want.row, B1 = want.row + want.rs - 1
  const range = (a: number, b: number) => { const out: number[] = []; for (let v = a; a <= b ? v <= b : v >= b; v += a <= b ? 1 : -1) out.push(v); return out }
  let best: Box = from
  let bestArea = 0
  for (const l of range(L1, L0)) for (const r of range(R1, R0)) for (const t of range(T1, T0)) for (const b of range(B1, B0)) {
    if (r < l || b < t) continue
    const box = { col: l, row: t, cs: r - l + 1, rs: b - t + 1 }
    const area = box.cs * box.rs
    if (area > bestArea && isFree(items, box, id)) { best = box; bestArea = area }
  }
  return best
}

interface Drag {
  id: string
  mode: 'move' | 'resize'
  edge?: Edge
  sx: number
  sy: number
  offCol: number
  offRow: number
  moved: boolean
  target: Box | null
}

const PAD = 28
/** Hauteur reservee a la barre d'outils, pour qu'elle ne recouvre jamais la page. */
const TOOLS_H = 52
/** Paliers du zoom (1 = taille reelle de la page). */
const ZOOMS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 2]
const ADDABLE: ElementType[] = ['kpi', 'chart', 'table', 'slicer', 'map', 'text', 'image', 'icon']

/**
 * Apercu en direct de la page.
 * Un clic sur la navigation ou le titre ouvre leurs reglages ; un visuel se selectionne, se deplace et se redimensionne
 * en restant aimante a la grille.
 */
export function Canvas({ project, t, lang, selectedId, guides, slots, onSelect, onOpenTab, onMove, onAdd, toolbar, tools }: Props) {
  const { cfg } = project
  const page = project.pages[project.active]
  const stageRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(0.5)
  // Zoom choisi ; null = la page tient entierement dans la zone
  const [zoom, setZoom] = useState<number | null>(null)
  const scale = zoom ?? fitScale
  const [drag, setDrag] = useState<Drag | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const [adding, setAdding] = useState(false)
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const fit = () => {
      const w = el.clientWidth - PAD * 2
      const h = el.clientHeight - PAD * 2 - 24 - TOOLS_H
      if (w > 0 && h > 0) setFitScale(Math.min(w / cfg.width, h / cfg.height))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [cfg.width, cfg.height])

  // Le zoom part de l'echelle courante ; lue par reference pour la molette et le clavier
  const fitRef = useRef(fitScale)
  useEffect(() => {
    fitRef.current = fitScale
  }, [fitScale])
  const zoomStep = (dir: 1 | -1) =>
    setZoom((z) => {
      const cur = z ?? fitRef.current
      const next = dir > 0 ? ZOOMS.find((v) => v > cur + 0.001) : [...ZOOMS].reverse().find((v) => v < cur - 0.001)
      return next ?? cur
    })
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      zoomStep(e.deltaY < 0 ? 1 : -1)
    }
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || (e.target as HTMLElement).closest?.('input, textarea, select')) return
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomStep(1) }
      else if (e.key === '-') { e.preventDefault(); zoomStep(-1) }
      else if (e.key === '0') { e.preventDefault(); setZoom(null) }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const showGuides = guides || !!drag?.moved
  const colors = useMemo(() => resolveColors(cfg), [cfg])
  const model = useMemo(() => buildPage(cfg, project.pages, project.active, t.types, { guides: showGuides }), [cfg, project.pages, project.active, t.types, showGuides])
  const isMenu = page.kind === 'menu'
  const g = itemRect(cfg, { col: 1, row: 1, cs: 12, rs: 8 }, page.rows)
  const u = Math.min(g.w / 1000, g.h / 660)

  const shown = isMenu ? [] : page.items.filter((it) => !isHidden(cfg, it))
  const selected = shown.find((i) => i.id === selectedId)
  const selRect = selected && !drag?.moved ? itemRect(cfg, selected, page.rows) : null

  // Position de la souris en pixels de page
  const toPage = (clientX: number, clientY: number) => {
    const r = pageRef.current!.getBoundingClientRect()
    return { x: (clientX - r.left) / scale, y: (clientY - r.top) / scale }
  }

  const setDragState = (d: Drag | null) => {
    dragRef.current = d
    setDrag(d)
  }

  const startDrag = (e: RPE, it: GridItem, mode: Drag['mode'], edge?: Edge) => {
    if (e.button !== 0) return
    e.stopPropagation()
    onSelect(it.id)
    const p = toPage(e.clientX, e.clientY)
    const c = cellAt(cfg, page.rows, p.x, p.y)
    setDragState({ id: it.id, mode, edge, sx: e.clientX, sy: e.clientY, offCol: Math.max(0, Math.min(it.cs - 1, c.col - it.col)), offRow: Math.max(0, Math.min(it.rs - 1, c.row - it.row)), moved: false, target: null })
  }

  const dragging = drag !== null
  useEffect(() => {
    if (!dragging) return
    const onMoveEvt = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const it = page.items.find((i) => i.id === d.id)
      if (!it) return
      const moved = d.moved || Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4
      if (!moved) return
      const p = toPage(e.clientX, e.clientY)
      const c = cellAt(cfg, page.rows, p.x, p.y)
      let target: Box | null
      if (d.mode === 'move') {
        target = findSlot(page.items, { col: c.col - d.offCol, row: c.row - d.offRow, cs: it.cs, rs: it.rs }, it.id)
      } else {
        // chaque bord suit la souris selon la poignee tenue, sans jamais inverser l'element
        const edge = d.edge ?? 'se'
        let l = it.col, r = it.col + it.cs - 1, t = it.row, b = it.row + it.rs - 1
        if (edge.includes('w')) l = Math.max(1, Math.min(c.col, r))
        if (edge.includes('e')) r = Math.min(COLS, Math.max(c.col, l))
        if (edge.includes('n')) t = Math.max(1, Math.min(c.row, b))
        if (edge.includes('s')) b = Math.min(ROWS, Math.max(c.row, t))
        target = growFree(page.items, it.id, it, { col: l, row: t, cs: r - l + 1, rs: b - t + 1 })
      }
      setDragState({ ...d, moved: true, target })
    }
    const onUp = () => {
      const d = dragRef.current
      setDragState(null)
      if (d?.moved && d.target) onMove(d.id, d.target)
    }
    window.addEventListener('pointermove', onMoveEvt)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMoveEvt)
      window.removeEventListener('pointerup', onUp)
    }
    // les autres valeurs sont lues au moment de l'evenement
  }, [dragging]) // eslint-disable-line react-hooks/exhaustive-deps

  // Zone cliquable de la navigation
  const ins = navInsets(cfg)
  const navHit: Rect | null = isMenu || cfg.navFrame === 'none' ? null : ins.left ? { x: 0, y: 0, w: ins.left, h: cfg.height } : { x: 0, y: 0, w: cfg.width, h: ins.top }

  const slotRects: (Rect & { label: string })[] = [
    ...(model.nav?.items ?? []),
    ...(model.nav?.slots ?? []).map((s, i) => ({ ...s, label: `${t.types.slicer} ${i + 1}` })),
    ...(model.nav?.logo ? [{ ...model.nav.logo, label: 'Logo' }] : []),
    ...(model.menu?.buttons ?? []),
  ]
  const ghost = drag?.moved && drag.target ? itemRect(cfg, drag.target, page.rows) : null

  return (
    <div className={`stage${drag?.moved ? ' dragging' : ''}`} ref={stageRef} onPointerDown={(e) => e.target === e.currentTarget && onSelect(null)}>
      <div className="canvas-tools">
        {!isMenu && (
          <div className="add-wrap">
            <button className="tool-btn add" aria-expanded={adding} onClick={() => setAdding(!adding)} title={tr('Ajouter un élément sur la page', 'Add an element to the page')} aria-label={tr('Ajouter un élément', 'Add an element')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
            {adding && (
              <div className="add-menu" onPointerLeave={() => setAdding(false)}>
                {ADDABLE.map((type) => (
                  <button key={type} onClick={() => { onAdd(type); setAdding(false) }}>{t.types[type]}</button>
                ))}
              </div>
            )}
          </div>
        )}
        {tools && <span className="tools-sep" />}
        {tools}
      </div>
      <div className="stage-scroll" ref={scrollRef} onPointerDown={(e) => e.target === e.currentTarget && onSelect(null)}>
      <div className="page-wrap" style={{ width: cfg.width * scale, height: cfg.height * scale }}>
        <div className="page" ref={pageRef}>
          <div
            className="page-inner"
            style={{ width: cfg.width, height: cfg.height, transform: `scale(${scale})`, '--s': scale, fontFamily: `'${cfg.font}', 'Segoe UI', sans-serif` } as CSSProperties}
            onPointerDown={(e) => (e.target as HTMLElement).closest('.item, .hit') === null && onSelect(null)}
          >
            <div className="bg" dangerouslySetInnerHTML={{ __html: model.svg }} />

            {navHit && (
              <button className="hit" style={{ left: navHit.x, top: navHit.y, width: navHit.w, height: navHit.h }} aria-label={tr('Modifier la navigation', 'Edit navigation')} onClick={() => onOpenTab('nav')}>
                <span className="hit-tip">{tr('Cliquez pour modifier la navigation', 'Click to edit the navigation')}</span>
              </button>
            )}

            {isMenu && (
              <button className="hit" style={{ left: 0, top: 0, width: cfg.width, height: cfg.height }} aria-label={tr('Modifier le menu principal', 'Edit main menu')} onClick={() => onOpenTab('templates')}>
                <span className="hit-tip">{tr('Cliquez pour changer le style du menu', 'Click to change the menu style')}</span>
              </button>
            )}

            {slots &&
              slotRects.map((r, i) => (
                <div key={`${r.label}${i}`} className="slot-box" style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
                  <span>{r.label}</span>
                </div>
              ))}

            {shown.map((it) => {
              const r = itemRect(cfg, it, page.rows)
              const isHeader = it.type === 'header'
              const isCard = ['kpi', 'chart', 'table', 'map'].includes(it.type) || (it.type === 'slicer' && !it.props?.variant)
              const isSel = it.id === selectedId
              return (
                <div
                  key={it.id}
                  className={`item${isSel ? ' selected' : ''}${drag?.moved && drag.id === it.id ? ' lifted' : ''}`}
                  style={{ left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: isCard ? cfg.radius : 8 }}
                  onPointerDown={(e) => (isHeader ? onOpenTab('text') : startDrag(e, it, 'move'))}
                  title={isHeader ? tr('Cliquez pour modifier le titre', 'Click to edit the title') : undefined}
                >
                  {/* en plan simple, la carte n'affiche que le nom de la zone (ecrit dans le fond) */}
                  {!(cfg.labelZones && isCard) && <ElementView item={it} colors={colors} u={u} w={r.w} h={r.h} ts={cfg.cardSize / 12} />}
                  {isSel && !isHeader && EDGES.map((ed) => <i key={ed} className={`resize ${ed}`} title={tr('Glisser pour redimensionner', 'Drag to resize')} onPointerDown={(e) => startDrag(e, it, 'resize', ed)} />)}
                </div>
              )
            })}

            {ghost && <div className="drop-ghost" style={{ left: ghost.x, top: ghost.y, width: ghost.w, height: ghost.h, borderRadius: cfg.radius }} />}
          </div>
        </div>

        {selRect && (
          <div className="ctx" style={{ left: Math.max(0, selRect.x * scale), top: selRect.y * scale > 52 ? selRect.y * scale - 46 : (selRect.y + selRect.h) * scale + 8 }}>
            {toolbar}
          </div>
        )}
      </div>
      </div>
      <div className="zoom-box" role="group" aria-label={tr('Zoom', 'Zoom')}>
        <button onClick={() => zoomStep(-1)} title={tr('Réduire (Ctrl -)', 'Zoom out (Ctrl -)')} aria-label={tr('Réduire', 'Zoom out')}>−</button>
        <button className="zoom-val" onClick={() => setZoom(zoom === null ? 1 : null)} title={zoom === null ? tr('Taille réelle (100 %)', 'Actual size (100%)') : tr('Ajuster à la zone (Ctrl 0)', 'Fit to area (Ctrl 0)')}>{Math.round(scale * 100)} %</button>
        <button onClick={() => zoomStep(1)} title={tr('Agrandir (Ctrl +)', 'Zoom in (Ctrl +)')} aria-label={tr('Agrandir', 'Zoom in')}>+</button>
        <button className={`zoom-fit${zoom === null ? ' on' : ''}`} onClick={() => setZoom(null)} title={tr('Ajuster à la zone (Ctrl 0)', 'Fit to area (Ctrl 0)')} aria-label={tr('Ajuster à la zone', 'Fit to area')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
        </button>
      </div>
    </div>
  )
}
