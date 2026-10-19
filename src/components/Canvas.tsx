import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { Project, Rect } from '../core/types'
import { COLS, ROWS, colWidth, gapOf, gridRect, isHidden, itemRect, rowHeights, rowTops } from '../core/grid'
import { resolveColors } from '../core/layout'
import { buildPage } from '../core/svg'
import { ElementView } from './ElementView'
import type { Dict } from '../i18n'

interface Props {
  project: Project
  t: Dict
  selectedId: string | null
  guides: boolean
  slots: boolean
  onSelect: (id: string | null) => void
}

const PAD = 4

/** Apercu en direct de la page. Un clic sur une zone la selectionne et ouvre ses proprietes. */
export function Canvas({ project, t, selectedId, guides, slots, onSelect }: Props) {
  const { cfg } = project
  const page = project.pages[project.active]
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const fit = () => {
      const w = el.clientWidth - PAD * 2
      const h = el.clientHeight - PAD * 2
      if (w > 0 && h > 0) setScale(Math.min(w / cfg.width, h / cfg.height))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [cfg.width, cfg.height])

  const colors = useMemo(() => resolveColors(cfg), [cfg])
  const model = useMemo(() => buildPage(cfg, project.pages, project.active, t.types), [cfg, project.pages, project.active, t.types])
  const g = gridRect(cfg)
  const cw = colWidth(cfg)
  const hs = rowHeights(cfg, page.rows)
  const tops = rowTops(cfg, page.rows)
  const GAP = gapOf(cfg)
  const u = Math.min(g.w / 1000, g.h / 660)
  const isMenu = page.kind === 'menu'

  const counts: Record<string, number> = {}
  const named = isMenu
    ? []
    : page.items.filter((it) => !isHidden(cfg, it)).map((it) => {
        counts[it.type] = (counts[it.type] ?? 0) + 1
        return { it, label: it.props?.title && it.type === 'kpi' ? it.props.title : `${t.types[it.type]} ${counts[it.type]}` }
      })

  const slotRects: (Rect & { label: string })[] = [
    ...(model.nav?.items ?? []),
    ...(model.nav?.slots ?? []).map((s, i) => ({ ...s, label: `${t.types.slicer} ${i + 1}` })),
    ...(model.nav?.logo ? [{ ...model.nav.logo, label: 'Logo' }] : []),
    ...(model.menu?.buttons ?? []),
  ]

  return (
    <div className="stage" ref={stageRef} onPointerDown={(e) => e.target === e.currentTarget && onSelect(null)}>
      <div className="page" style={{ width: cfg.width * scale, height: cfg.height * scale }}>
        <div
          className="page-inner"
          style={{ width: cfg.width, height: cfg.height, transform: `scale(${scale})`, '--s': scale } as CSSProperties}
          onPointerDown={(e) => (e.target as HTMLElement).closest('.item') === null && onSelect(null)}
        >
          <div className="bg" dangerouslySetInnerHTML={{ __html: model.svg }} />

          {guides && !isMenu && (
            <>
              {Array.from({ length: COLS }, (_, i) => (
                <div key={`gc${i}`} className="g-col" style={{ left: g.x + i * (cw + GAP), top: g.y, width: cw, height: g.h }} />
              ))}
              {Array.from({ length: ROWS }, (_, i) => (
                <div key={`gr${i}`} className="g-row" style={{ left: g.x, top: tops[i], width: g.w, height: hs[i] }} />
              ))}
            </>
          )}

          {slots &&
            slotRects.map((r, i) => (
              <div key={`${r.label}${i}`} className="slot-box" style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
                <span>{r.label}</span>
              </div>
            ))}

          {named.map(({ it, label }) => {
            const r = itemRect(cfg, it, page.rows)
            const isCard = ['kpi', 'chart', 'table', 'map'].includes(it.type) || (it.type === 'slicer' && !it.props?.variant)
            return (
              <div
                key={it.id}
                className={`item${it.id === selectedId ? ' selected' : ''}`}
                style={{ left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: isCard ? cfg.radius : 8 }}
                onPointerDown={() => onSelect(it.id)}
              >
                <ElementView item={it} colors={colors} u={u} w={r.w} h={r.h} />
                <span className="chip">{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
