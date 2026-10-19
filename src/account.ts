import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

/** Informations du compte, reprises dans un nouveau modele (nom et fonction dans la navigation, entreprise, photo). */
export interface AccountProfile {
  name: string
  role: string
  company: string
  photo: string // data URL, petite (photo de profil)
}

export interface Account extends AccountProfile {
  email: string
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

export function accountOf(session: Session | null): Account | null {
  if (!session) return null
  const meta = session.user.user_metadata ?? {}
  const prof = (meta.profile ?? {}) as Record<string, unknown>
  return { email: session.user.email ?? '', name: str(meta.full_name), role: str(prof.role), company: str(prof.company), photo: str(prof.photo) }
}

/** Enregistre le profil dans le compte Supabase (metadonnees de l'utilisateur, comme Sira). */
export async function saveProfile(p: AccountProfile) {
  if (!supabase) throw new Error('Service de comptes non configuré')
  const { error } = await supabase.auth.updateUser({ data: { full_name: p.name, profile: { role: p.role, company: p.company, photo: p.photo } } })
  if (error) throw error
  // La session garde les metadonnees : on la rafraichit pour que l'en-tete affiche aussitot la nouvelle photo
  await supabase.auth.refreshSession()
}

export async function setNewPassword(password: string) {
  if (!supabase) throw new Error('Service de comptes non configuré')
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export const initialsOf = (name: string, fallback = '·') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || fallback
