import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { FeedbackContext, type ChoiceOptions, type ConfirmOptions, type Feedback, type PromptOptions, type ToastKind } from '../feedback'
import { Icon } from './Icon'
import type { Lang } from '../i18n'

type Ask =
  | { type: 'confirm'; o: ConfirmOptions; done: (v: boolean) => void }
  | { type: 'prompt'; o: PromptOptions; done: (v: string | null) => void }
  | { type: 'choose'; o: ChoiceOptions; done: (v: string | null) => void }

interface Toast {
  id: number
  message: string
  kind: ToastKind
}

/** Fournit les messages (toasts) et les fenetres de confirmation, de saisie et de choix. */
export function FeedbackProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [ask, setAsk] = useState<Ask | null>(null)
  const [value, setValue] = useState('')
  const counter = useRef(0)
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = ++counter.current
    setToasts((t) => [...t.slice(-2), { id, message, kind }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 5000 : 2400)
  }, [])

  const api: Feedback = useMemo(
    () => ({
      toast,
      confirm: (o) => new Promise<boolean>((done) => setAsk({ type: 'confirm', o, done })),
      prompt: (o) =>
        new Promise<string | null>((done) => {
          setValue(o.value)
          setAsk({ type: 'prompt', o, done })
        }),
      choose: (o) => new Promise<string | null>((done) => setAsk({ type: 'choose', o, done })),
    }),
    [toast],
  )

  const close = (result: boolean | string | null) => {
    if (!ask) return
    if (ask.type === 'confirm') ask.done(result === true)
    else ask.done(typeof result === 'string' ? result : null)
    setAsk(null)
  }

  useEffect(() => {
    if (!ask) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(ask.type === 'confirm' ? false : null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const ok = () => {
    if (!ask) return
    if (ask.type === 'prompt') {
      if (value.trim()) close(value.trim())
    } else close(true)
  }

  return (
    <FeedbackContext.Provider value={api}>
      {children}

      {ask && (
        <div className="overlay" onPointerDown={(e) => e.target === e.currentTarget && close(ask.type === 'confirm' ? false : null)}>
          <div className="ask" role="alertdialog" aria-modal="true" aria-labelledby="ask-title">
            <div className={`ask-icon${ask.type === 'confirm' && ask.o.danger ? ' danger' : ''}`}>
              <Icon name={ask.type === 'confirm' && ask.o.danger ? 'trash' : ask.type === 'prompt' ? 'pencil' : 'layout'} size={18} />
            </div>
            <div className="ask-body">
              <h2 id="ask-title">{ask.o.title}</h2>
              {ask.o.message && <p>{ask.o.message}</p>}
              {ask.type === 'prompt' && (
                <label className="ask-field">
                  {ask.o.label}
                  <input autoFocus value={value} onFocus={(e) => e.target.select()} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ok()} />
                </label>
              )}
              <div className="ask-actions">
                <button className="btn" onClick={() => close(ask.type === 'confirm' ? false : null)}>{ask.o.cancelLabel ?? tr('Annuler', 'Cancel')}</button>
                {ask.type === 'choose' ? (
                  ask.o.choices.map((c) => (
                    <button key={c.id} autoFocus={c.primary} className={`btn${c.primary ? ' primary' : ''}${c.danger ? ' danger-solid' : ''}`} onClick={() => close(c.id)}>{c.label}</button>
                  ))
                ) : (
                  <button autoFocus={ask.type === 'confirm'} className={`btn ${ask.type === 'confirm' && ask.o.danger ? 'danger-solid' : 'primary'}`} disabled={ask.type === 'prompt' && !value.trim()} onClick={ok}>
                    {ask.o.confirmLabel ?? tr('Confirmer', 'Confirm')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item ${t.kind}`}>
            <span className="toast-ic"><Icon name={t.kind === 'error' ? 'x' : t.kind === 'info' ? 'info' : 'check'} size={13} /></span>
            {t.message}
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  )
}
