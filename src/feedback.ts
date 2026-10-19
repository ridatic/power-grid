import { createContext, useContext } from 'react'

export type ToastKind = 'info' | 'success' | 'error'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export interface PromptOptions {
  title: string
  message?: string
  label: string
  value: string
  confirmLabel?: string
  cancelLabel?: string
}

export interface ChoiceOptions {
  title: string
  message?: string
  choices: { id: string; label: string; primary?: boolean; danger?: boolean }[]
  cancelLabel?: string
}

/** Messages et fenetres de l'application, au style de Power-Grid (jamais les boites du navigateur). */
export interface Feedback {
  toast: (message: string, kind?: ToastKind) => void
  confirm: (o: ConfirmOptions) => Promise<boolean>
  prompt: (o: PromptOptions) => Promise<string | null>
  choose: (o: ChoiceOptions) => Promise<string | null>
}

export const FeedbackContext = createContext<Feedback | null>(null)

export function useFeedback(): Feedback {
  const f = useContext(FeedbackContext)
  if (!f) throw new Error('FeedbackProvider manquant')
  return f
}
