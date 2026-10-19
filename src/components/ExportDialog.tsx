import { useEffect, useState, type ChangeEvent } from 'react'
import type { Project } from '../core/types'
import { downloadAll, downloadPng, downloadPositions, downloadSvg, downloadTheme, positions } from '../core/export'
import { readJsonObject } from '../files'
import { useFeedback } from '../feedback'
import type { Dict, Lang } from '../i18n'

interface Props {
  project: Project
  t: Dict
  lang: Lang
  onClose: () => void
  onDone: () => void
  onExtraTheme: (json: Record<string, unknown> | null, name: string) => void
}

/** Export en trois etapes, dans l'ordre ou on les fait dans Power BI. */
export function ExportDialog({ project, t, lang, onClose, onDone, onExtraTheme }: Props) {
  const fb = useFeedback()
  const [page, setPage] = useState(project.active)
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const d = t.exportDlg
  const names = t.types
  const rows = positions(project, page, names)
  const { cfg } = project

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onTheme = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const json = await readJsonObject(f)
    if (json) onExtraTheme(json, f.name)
    else fb.toast(tr('Ce fichier n\'est pas un JSON valide.', 'This file is not valid JSON.'), 'error')
  }

  return (
    <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={d.title}>
        <div className="dialog-head">
          <h2>{d.title}</h2>
          <button className="btn" onClick={onClose}>{d.close}</button>
        </div>
        <div className="dialog-body">
          <div className="steps">
            <section>
              <h3><span className="num">1</span>{d.step1}</h3>
              <p className="hint">{d.themeHint}</p>
              <button className="btn primary" onClick={() => { downloadTheme(project); onDone() }}>{d.theme}</button>
              <details className="extra">
                <summary>{cfg.extraTheme ? tr(`Réglages ajoutés : ${cfg.extraThemeName}`, `Added settings: ${cfg.extraThemeName}`) : tr('Ajouter des réglages au thème (.json, ex. licence ZoomCharts)', 'Add settings to the theme (.json, e.g. ZoomCharts license)')}</summary>
                <div className="row">
                  <label className="btn file">{tr('Choisir un fichier', 'Choose a file')}<input type="file" accept="application/json,.json" onChange={onTheme} /></label>
                  {cfg.extraTheme && <button className="btn" onClick={() => onExtraTheme(null, '')}>{tr('Retirer', 'Remove')}</button>}
                </div>
                <p className="hint">{tr('Le fichier est fusionné dans le thème et reste dans votre navigateur.', 'The file is merged into the theme and stays in your browser.')}</p>
              </details>
            </section>
            <section>
              <h3><span className="num">2</span>{d.step2}</h3>
              <div className="chips">
                {project.pages.map((p, i) => (
                  <button key={p.id} className={i === page ? 'on' : ''} onClick={() => setPage(i)}>{p.name}</button>
                ))}
              </div>
              <div className="row">
                <button className="btn primary" onClick={() => void downloadPng(project, page, names, 2).then(onDone)}>{d.png}</button>
                <button className="btn" onClick={() => { downloadSvg(project, page, names); onDone() }}>{d.svg}</button>
              </div>
              <button className="link" onClick={() => void downloadAll(project, names).then(onDone)}>{d.all}</button>
            </section>
            <section>
              <h3><span className="num">3</span>{d.howTitle}</h3>
              <ol className="steps-list">{d.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </section>
          </div>
          <div>
            <div className="table-head">
              <h3>{d.table}</h3>
              <button className="btn" onClick={() => { downloadPositions(project, page, names); onDone() }}>{d.csv}</button>
            </div>
            <div className="table-box">
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
    </div>
  )
}
