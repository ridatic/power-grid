import type { ReactNode } from 'react'

/** En-tete d'un onglet : un titre et une phrase qui dit a quoi il sert. */
export function PanelHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="panel-head">
      <h2>{title}</h2>
      <p>{desc}</p>
    </div>
  )
}

/** Un reglage : son nom, son controle, une aide courte. data-opt sert a la recherche. */
export function Opt({ id, label, hint, children, aside, reset, resetTitle }: { id: string; label?: string; hint?: string; children: ReactNode; aside?: ReactNode; reset?: () => void; resetTitle?: string }) {
  return (
    <div className="opt" data-opt={id}>
      {label && (
        <div className="opt-label">
          <span>{label}</span>
          <span className="opt-aside">
            {aside}
            {reset && (
              <button className="reset" onClick={reset} title={resetTitle} aria-label={resetTitle}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" /></svg>
              </button>
            )}
          </span>
        </div>
      )}
      {children}
      {hint && <p className="opt-hint">{hint}</p>}
    </div>
  )
}

/** Choix exclusif sur une ligne ; un point marque la valeur par defaut. */
export function Seg<T extends string | number>({ value, options, onChange, label, def }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label?: string; def?: T }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.v)} role="radio" aria-checked={o.v === value} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>
          {o.label}
          {o.v === def && <i className="def-dot" aria-hidden="true" />}
        </button>
      ))}
    </div>
  )
}

export function Switch({ id, checked, onChange, label, reset, resetTitle }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; reset?: () => void; resetTitle?: string }) {
  return (
    <div className="opt switch-row" data-opt={id}>
      <button className={`switch${checked ? ' on' : ''}`} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
        <span>{label}</span>
        <i aria-hidden="true" />
      </button>
      {reset && (
        <button className="reset" onClick={reset} title={resetTitle} aria-label={resetTitle}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" /></svg>
        </button>
      )}
    </div>
  )
}

/** Carte cliquable avec un apercu et un nom. */
export function Card({ selected, onClick, thumb, label, disabled, isDefault }: { selected: boolean; onClick: () => void; thumb: ReactNode; label: string; disabled?: boolean; isDefault?: boolean }) {
  return (
    <button className={`card${selected ? ' on' : ''}`} aria-pressed={selected} onClick={onClick} disabled={disabled}>
      <span className="card-thumb">{thumb}</span>
      <span className="card-name">
        {label}
        {isDefault && <i className="def-dot" aria-hidden="true" />}
      </span>
    </button>
  )
}

/** Reglages secondaires, caches par defaut. */
export function More({ open, onToggle, label, children }: { open: boolean; onToggle: () => void; label: string; children: ReactNode }) {
  return (
    <div className={`more${open ? ' open' : ''}`}>
      <button className="more-head" aria-expanded={open} onClick={onToggle}>
        <span>{label}</span>
        <i aria-hidden="true">›</i>
      </button>
      {open && <div className="more-body">{children}</div>}
    </div>
  )
}

/** Sous-titre d'un groupe de reglages dans un onglet. */
export function Group({ title }: { title: string }) {
  return <h3 className="group-title">{title}</h3>
}
