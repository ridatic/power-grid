import type { Project } from './core/types'
import { supabase } from './lib/supabase'

/** Un document (« file » : visible dans les recents) ou un modele (« model » : ajoute a Mes modeles par l'utilisateur). */
export type DocKind = 'file' | 'model'

/** Un document enregistre par l'utilisateur. */
export interface SavedModel {
  id: string
  kind: DocKind
  name: string
  updatedAt: string
  data: Project
}

/** Vrai si l'erreur vient d'une base pas a jour (table ou colonne manquante). */
export const isSchemaError = (e: unknown) => e instanceof Error && /does not exist|schema cache|PGRST205/i.test(e.message)

/** Une image de la bibliotheque de l'utilisateur. */
export interface MediaItem {
  id: string
  name: string
  dataUrl: string
}

export interface ModelStore {
  kind: 'cloud' | 'local'
  list(kind: DocKind): Promise<SavedModel[]>
  get(id: string): Promise<SavedModel | null>
  listMedia(): Promise<MediaItem[]>
  addMedia(name: string, dataUrl: string): Promise<MediaItem>
  removeMedia(id: string): Promise<void>
  create(kind: DocKind, name: string, data: Project): Promise<SavedModel>
  save(id: string, name: string, data: Project): Promise<void>
  remove(id: string): Promise<void>
  /** Ajoute un document a Mes modeles (ou l'en retire). */
  setKind(id: string, kind: DocKind): Promise<void>
  /**
   * Listes d'identifiants gardees avec le compte :
   * favoris (mes documents, ou `preset:<id>` pour un modele predefini) et recents (documents ouverts, du dernier au premier).
   */
  getList(list: IdList): Promise<string[]>
  setList(list: IdList, ids: string[]): Promise<void>
}

export type IdList = 'favorites' | 'recents'

/** Identifiant de favori d'un modele predefini. */
export const presetFav = (id: string) => `preset:${id}`

/** Tous les documents de l'utilisateur (documents et modeles), du plus recemment modifie au plus ancien. */
export async function listDocs(store: ModelStore): Promise<SavedModel[]> {
  const [models, files] = await Promise.all([store.list('model'), store.list('file')])
  return [...models, ...files].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** Note l'ouverture d'un document : il passe en tete des recents. */
export async function markOpened(store: ModelStore, id: string) {
  const ids = await store.getList('recents')
  await store.setList('recents', [id, ...ids.filter((x) => x !== id)].slice(0, 60))
}

/**
 * Recents : les documents ouverts, du dernier au premier,
 * puis les documents jamais ouverts qui ne sont pas des modeles (pour qu'aucun document ne soit introuvable).
 */
export function recentDocs(docs: SavedModel[], recentIds: string[]): SavedModel[] {
  const byId = new Map(docs.map((d) => [d.id, d]))
  const opened = recentIds.flatMap((id) => byId.get(id) ?? [])
  const seen = new Set(opened.map((d) => d.id))
  return [...opened, ...docs.filter((d) => d.kind === 'file' && !seen.has(d.id))]
}

/** Un nom libre : « Nom », sinon « Nom 2 », « Nom 3 »... */
export function uniqueName(name: string, docs: SavedModel[]): string {
  const taken = new Set(docs.map((d) => d.name.trim().toLowerCase()))
  if (!taken.has(name.trim().toLowerCase())) return name
  for (let i = 2; ; i++) if (!taken.has(`${name} ${i}`.toLowerCase())) return `${name} ${i}`
}

/* ---------- Compte Supabase ---------- */

interface Row {
  id: string
  kind: DocKind
  name: string
  updated_at: string
  data: Project
}

const fromRow = (r: Row): SavedModel => ({ id: r.id, kind: r.kind, name: r.name, updatedAt: r.updated_at, data: r.data })

const COLS = 'id, kind, name, updated_at, data'

function cloudStore(): ModelStore {
  const db = supabase!
  return {
    kind: 'cloud',
    async list(kind) {
      const { data, error } = await db.from('projects').select(COLS).eq('kind', kind).order('updated_at', { ascending: false })
      if (error) throw new Error(`projects.select : ${error.message}`)
      return (data as Row[]).map(fromRow)
    },
    async get(id) {
      const { data, error } = await db.from('projects').select(COLS).eq('id', id).maybeSingle()
      if (error) throw new Error(`projects.get : ${error.message}`)
      return data ? fromRow(data as Row) : null
    },
    async listMedia() {
      const { data, error } = await db.from('media').select('id, name, data_url').order('created_at', { ascending: false })
      if (error) throw new Error(`media.select : ${error.message}`)
      return (data as { id: string; name: string; data_url: string }[]).map((r) => ({ id: r.id, name: r.name, dataUrl: r.data_url }))
    },
    async addMedia(name, dataUrl) {
      const { data, error } = await db.from('media').insert({ name, data_url: dataUrl }).select('id, name, data_url').single()
      if (error) throw new Error(`media.insert : ${error.message}`)
      const r = data as { id: string; name: string; data_url: string }
      return { id: r.id, name: r.name, dataUrl: r.data_url }
    },
    async removeMedia(id) {
      const { error } = await db.from('media').delete().eq('id', id)
      if (error) throw new Error(`media.delete : ${error.message}`)
    },
    async create(kind, name, data) {
      const { data: row, error } = await db.from('projects').insert({ kind, name, data }).select(COLS).single()
      if (error) throw new Error(`projects.insert : ${error.message}`)
      return fromRow(row as Row)
    },
    // Supabase ne signale pas une ligne refusee par les regles d'acces : on verifie qu'une ligne a bien ete touchee
    async save(id, name, data) {
      const { data: rows, error } = await db.from('projects').update({ name, data }).eq('id', id).select('id')
      if (error) throw new Error(`projects.update : ${error.message}`)
      if (!rows?.length) throw new Error('projects.update : aucune ligne modifiée (document introuvable ou accès refusé)')
    },
    async remove(id) {
      const { data: rows, error } = await db.from('projects').delete().eq('id', id).select('id')
      if (error) throw new Error(`projects.delete : ${error.message}`)
      if (!rows?.length) throw new Error('projects.delete : aucune ligne supprimée (document introuvable ou accès refusé)')
    },
    async setKind(id, kind) {
      const { data: rows, error } = await db.from('projects').update({ kind }).eq('id', id).select('id')
      if (error) throw new Error(`projects.kind : ${error.message}`)
      if (!rows?.length) throw new Error('projects.kind : aucune ligne modifiée (document introuvable ou accès refusé)')
    },
    // Favoris et recents sont gardes dans le profil du compte : pas de table en plus
    async getList(list) {
      const { data } = await db.auth.getUser()
      const v = data.user?.user_metadata?.[list] as unknown
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
    },
    async setList(list, ids) {
      const { error } = await db.auth.updateUser({ data: { [list]: ids } })
      if (error) throw new Error(`${list} : ${error.message}`)
    },
  }
}

/* ---------- Stockage de l'appareil (sans compte) ---------- */

const KEY = 'power-grid.models.v1'
const MEDIA_KEY = 'power-grid.media.v1'
const listKey = (list: IdList) => `power-grid.${list}.v1`

function readMedia(): MediaItem[] {
  try {
    return JSON.parse(localStorage.getItem(MEDIA_KEY) ?? '[]') as MediaItem[]
  } catch {
    return []
  }
}

function readLocal(): SavedModel[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SavedModel[]) : []
  } catch {
    return []
  }
}

function writeLocal(list: SavedModel[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    throw new Error('stockage local plein ou indisponible')
  }
}

function localStore(): ModelStore {
  return {
    kind: 'local',
    async list(kind) {
      return readLocal()
        .map((m) => ({ ...m, kind: m.kind ?? 'file' }))
        .filter((m) => m.kind === kind)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },
    async get(id) {
      const m = readLocal().find((x) => x.id === id)
      return m ? { ...m, kind: m.kind ?? 'file' } : null
    },
    async listMedia() {
      return readMedia()
    },
    async addMedia(name, dataUrl) {
      const item = { id: crypto.randomUUID(), name, dataUrl }
      try {
        localStorage.setItem(MEDIA_KEY, JSON.stringify([item, ...readMedia()]))
      } catch {
        throw new Error('stockage local plein ou indisponible')
      }
      return item
    },
    async removeMedia(id) {
      localStorage.setItem(MEDIA_KEY, JSON.stringify(readMedia().filter((m) => m.id !== id)))
    },
    async create(kind, name, data) {
      const m: SavedModel = { id: crypto.randomUUID(), kind, name, updatedAt: new Date().toISOString(), data }
      writeLocal([m, ...readLocal()])
      return m
    },
    async save(id, name, data) {
      writeLocal(readLocal().map((m) => (m.id === id ? { ...m, name, data, updatedAt: new Date().toISOString() } : m)))
    },
    async remove(id) {
      writeLocal(readLocal().filter((m) => m.id !== id))
    },
    async setKind(id, kind) {
      writeLocal(readLocal().map((m) => (m.id === id ? { ...m, kind } : m)))
    },
    async getList(list) {
      try {
        const v = JSON.parse(localStorage.getItem(listKey(list)) ?? '[]') as unknown
        return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
      } catch {
        return []
      }
    },
    async setList(list, ids) {
      try {
        localStorage.setItem(listKey(list), JSON.stringify(ids))
      } catch {
        throw new Error('stockage local plein ou indisponible')
      }
    },
  }
}

/** Le compte quand on est connecte, sinon l'appareil. */
export const modelStore = (signedIn: boolean): ModelStore => (supabase && signedIn ? cloudStore() : localStore())
