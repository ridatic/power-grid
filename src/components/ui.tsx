import { useId, type ReactNode } from 'react'

/** Section repliable : une seule ouverte a la fois, avec un resume du choix courant. */
export function Section({ id, icon, title, summary, open, onToggle, children }: { id: string; icon: string; title: string; summary?: string; open: boolean; onToggle: (id: string) => void; children: ReactNode }) {
  return (
    <div className={`accordion${open ? ' open' : ''}`}>
      <button className="acc-head" aria-expanded={open} onClick={() => onToggle(id)}>
        <span className="acc-icon" aria-hidden="true">{icon}</span>
        {title}
        <span className="summary">{summary}</span>
        <span className="chev" aria-hidden="true">⌄</span>
      </button>
      {open && <div className="acc-body">{children}</div>}
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <>
      <span className="field-label">{label}</span>
      {children}
      {hint && <p className="tiny-note">{hint}</p>}
    </>
  )
}

/** Choix exclusif, presente comme les boutons radio de la maquette. */
export function Radios<T extends string | number>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label?: string }) {
  const name = useId()
  return (
    <div className="radio-list" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <label key={String(o.v)} className="radio">
          <input type="radio" name={name} checked={o.v === value} onChange={() => onChange(o.v)} />
          {o.label}
        </label>
      ))}
    </div>
  )
}

export function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="radio check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

/** Carte de choix avec un schema et un nom, comme la grille de navigation de la maquette. */
export function Choice({ selected, onClick, diagram, label }: { selected: boolean; onClick: () => void; diagram: ReactNode; label: string }) {
  return (
    <button className={`layout-choice${selected ? ' active' : ''}`} aria-pressed={selected} onClick={onClick}>
      <span className="diagram-box">{diagram}</span>
      <span className="choice-name">{selected ? '✓ ' : ''}{label}</span>
    </button>
  )
}
