import { useState, type FormEvent } from 'react'
import { resetPassword, signIn, signUp } from '../auth'
import { supabase } from '../lib/supabase'
import { Logo } from './Logo'
import { AppFooter } from './AppFooter'
import type { Lang } from '../i18n'

type Mode = 'signin' | 'signup' | 'reset'

const MIN_PASSWORD = 8

/** Message d'erreur Supabase traduit en langage courant. */
function explain(message: string, lang: Lang): string {
  const fr = lang === 'fr'
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return fr ? 'Adresse e-mail ou mot de passe incorrect.' : 'Wrong email or password.'
  if (m.includes('email not confirmed')) return fr ? 'Confirmez d\'abord votre adresse avec le lien reçu par e-mail.' : 'Confirm your address first with the link you received.'
  if (m.includes('already registered')) return fr ? 'Un compte existe déjà avec cette adresse. Connectez-vous.' : 'An account already exists with this address. Sign in.'
  if (m.includes('rate limit')) return fr ? 'Trop de tentatives. Réessayez dans quelques minutes.' : 'Too many attempts. Try again in a few minutes.'
  if (m.includes('failed to fetch')) return fr ? 'Connexion au serveur impossible. Vérifiez votre réseau.' : 'Cannot reach the server. Check your network.'
  return message
}

/** Connexion, creation de compte et mot de passe oublie. */
export function AuthPage({ lang, onLang, onLocal }: { lang: Lang; onLang: (l: Lang) => void; onLocal: () => void }) {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (mode !== 'reset' && password.length < MIN_PASSWORD) return setError(tr(`Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`, `The password must be at least ${MIN_PASSWORD} characters.`))
    if (mode === 'signup' && password !== confirm) return setError(tr('Les deux mots de passe ne sont pas identiques.', 'The two passwords do not match.'))
    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error: err } = await signIn(email, password)
        if (err) setError(explain(err.message, lang))
      } else if (mode === 'signup') {
        const { data, error: err } = await signUp(email, password)
        if (err) setError(explain(err.message, lang))
        else if (!data.session) setInfo(tr('Compte créé. Ouvrez le lien reçu par e-mail pour l\'activer, puis connectez-vous.', 'Account created. Open the link sent by email to activate it, then sign in.'))
      } else {
        const { error: err } = await resetPassword(email)
        if (err) setError(explain(err.message, lang))
        else setInfo(tr('Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d\'être envoyé.', 'If an account exists with this address, a reset email has just been sent.'))
      }
    } finally {
      setBusy(false)
    }
  }

  const title = mode === 'signin' ? tr('Connexion', 'Sign in') : mode === 'signup' ? tr('Créer un compte', 'Create an account') : tr('Mot de passe oublié', 'Forgot password')

  return (
    <div className="auth">
      <div className="auth-top">
        <button className="link" onClick={() => onLang(lang === 'fr' ? 'en' : 'fr')}>{lang === 'fr' ? 'English' : 'Français'}</button>
      </div>
      <main className="auth-main">
        <div className="auth-card">
          <Logo height={46} />
          <p className="auth-tagline">{tr('Des maquettes Power BI prêtes à l\'emploi, en quelques minutes.', 'Ready-to-use Power BI layouts, in minutes.')}</p>

          {supabase ? (
            <>
              <h1>{title}</h1>
              <form onSubmit={submit} className="auth-form">
                <label>
                  {tr('Adresse e-mail', 'Email address')}
                  <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                {mode !== 'reset' && (
                  <label>
                    {tr('Mot de passe', 'Password')}
                    <input type="password" required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </label>
                )}
                {mode === 'signup' && (
                  <label>
                    {tr('Confirmer le mot de passe', 'Confirm password')}
                    <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                  </label>
                )}
                {error && <p className="auth-error" role="alert">{error}</p>}
                {info && <p className="auth-info" role="status">{info}</p>}
                <button className="btn primary wide" disabled={busy}>
                  {busy ? tr('Un instant…', 'One moment…') : mode === 'signin' ? tr('Se connecter', 'Sign in') : mode === 'signup' ? tr('Créer mon compte', 'Create my account') : tr('Envoyer le lien', 'Send the link')}
                </button>
              </form>
              <div className="auth-links">
                {mode === 'signin' && (
                  <>
                    <button className="link" onClick={() => setMode('reset')}>{tr('Mot de passe oublié ?', 'Forgot password?')}</button>
                    <span>{tr('Pas encore de compte ?', 'No account yet?')} <button className="link" onClick={() => setMode('signup')}>{tr('Créer un compte', 'Create an account')}</button></span>
                  </>
                )}
                {mode !== 'signin' && <button className="link" onClick={() => setMode('signin')}>{tr('Retour à la connexion', 'Back to sign in')}</button>}
              </div>
            </>
          ) : (
            <>
              <h1>{tr('Connexion indisponible', 'Sign-in unavailable')}</h1>
              <p className="auth-info">
                {tr('Le service de comptes n\'est pas encore configuré (fichier .env.local). Vous pouvez travailler sans compte : vos modèles restent dans ce navigateur.', 'The account service is not configured yet (.env.local file). You can work without an account: your models stay in this browser.')}
              </p>
              <button className="btn primary wide" onClick={onLocal}>{tr('Continuer sans compte', 'Continue without an account')}</button>
            </>
          )}
        </div>
      </main>
      <AppFooter lang={lang} compact />
    </div>
  )
}
