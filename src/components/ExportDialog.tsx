import { useEffect, useState } from 'react'
import type { Project } from '../core/types'
import { downloadAll, downloadPng, downloadPositions, downloadSvg, downloadTheme, positions } from '../core/export'
import type { Dict } from '../i18n'

export function ExportDialog({ project, t, onClose, onDone }: { project: Project; t: Dict; onClose: () => void; onDone: () => void }) {
  const [page, setPage] = useState(project.active)
  const d = t.exportDlg
  const names = t.types
  const rows = positions(project, page, names)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={d.title}>
        <div className="dialog-head">
          <h2>{d.title}</h2>
          <button className="btn" onClick={onClose}>{d.close}</button>
        </div>
        <div className="dialog-body">
          <div>
            <div className="eyebrow">{d.step1}</div>
            <button className="btn primary wide" onClick={() => { downloadTheme(project); onDone() }}>{d.theme}</button>
            <p className="hint">{d.themeHint}</p>

            <div className="eyebrow">{d.step2}</div>
            <div className="chips">
              {project.pages.map((p, i) => (
                <button key={p.id} className={i === page ? 'on' : ''} onClick={() => setPage(i)}>{p.name}</button>
              ))}
            </div>
            <div className="row wrap">
              <button className="btn primary" onClick={() => void downloadPng(project, page, names, 2).then(onDone)}>{d.png}</button>
              <button className="btn" onClick={() => { downloadSvg(project, page, names); onDone() }}>{d.svg}</button>
              <button className="btn" onClick={() => { downloadPositions(project, page, names); onDone() }}>{d.csv}</button>
            </div>
            <button className="btn wide" onClick={() => void downloadAll(project, names).then(onDone)}>{d.all}</button>

            <div className="eyebrow">{d.howTitle}</div>
            <ol className="steps-list">{d.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </div>
          <div>
            <div className="eyebrow">{d.table}</div>
            <table>
              <thead><tr>{d.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name}><td>{r.name}</td><td>{r.x}</td><td>{r.y}</td><td>{r.w}</td><td>{r.h}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
