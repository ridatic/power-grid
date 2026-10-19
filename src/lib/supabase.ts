import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/**
 * Client Supabase (comme Sira), ou null si les variables d'environnement manquent :
 * l'ecran de connexion propose alors de continuer avec le stockage de l'appareil.
 * La cle « publishable » est publique par conception ; l'acces aux donnees est protege par les regles RLS de la base.
 */
export const supabase = url && key ? createClient(url, key) : null
