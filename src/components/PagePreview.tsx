import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { Project } from '../core/types'
import { isHidden, itemRect } from '../core/grid'
import { resolveColors } from '../core/layout'
import { buildPage } from '../core/svg'
import { normalizeProject } from '../store'
import { ElementView } from './ElementView'

/** Apercu reduit et fidele de la premiere page : le fond et le contenu des visuels, comme dans l'editeur. */
export function PagePreview({ project }: { project: Project }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [scale, setScale] = useState(0)
  const p = useMemo(() => normalizeProject(project), [project])
  const { cfg } = p
  const page = p.pages[0]
  const svg = useMemo(() => buildPage(cfg, p.pages, 0).svg, [cfg, p.pages])
  const colors = useMemo(() => resolveColors(cfg), [cfg])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => setScale(el.clientWidth / cfg.width)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [cfg.width])

  const g = itemRect(cfg, { col: 1, row: 1, cs: 12, rs: 8 }, page.rows)
  const u = Math.min(g.w / 1000, g.h / 660)
  const items = page.kind === 'menu' || cfg.labelZones ? [] : page.items.filter((it) => !isHidden(cfg, it))

  return (
    <span ref={ref} className="thumb" style={{ aspectRatio: `${cfg.width} / ${cfg.height}` }}>
      {scale > 0 && (
        <span className="thumb-inner" style={{ width: cfg.width, height: cfg.height, transform: `scale(${scale})`, fontFamily: `'${cfg.font}', 'Segoe UI', sans-serif` } as CSSProperties}>
          <span className="thumb-bg" dangerouslySetInnerHTML={{ __html: svg }} />
          {items.map((it) => {
            const r = itemRect(cfg, it, page.rows)
            return (
              <span key={it.id} className="thumb-item" style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
                <ElementView item={it} colors={colors} u={u} w={r.w} h={r.h} ts={cfg.cardSize / 12} />
              </span>
            )
          })}
        </span>
      )}
    </span>
  )
}
