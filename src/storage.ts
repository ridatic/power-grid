import type { Project } from './core/types'
import { supabase } from './lib/supabase'

/** Un fichier (rapport en cours) ou un modele (point de depart reutilisable). */
export type DocKind = 'file' | 'model'

/** Un document enregistre par l'utilisateur. */
export interface SavedModel {
  id: string
  kind: DocKind
  name: string
  updatedAt: string
  data: Project
}

/** Une image de la bibliotheque de l'utilisateur. */
/** Vrai si l'erreur vient d'une base pas a jour (table ou colonne manquante). */
export const isSchemaError = (e: unknown) => e instanceof Error && /does not exist|schema cache|PGRST205/i.test(e.message)

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
    async save(id, name, data) {
      const { error } = await db.from('projects').update({ name, data }).eq('id', id)
      if (error) throw new Error(`projects.update : ${error.message}`)
    },
    async remove(id) {
      const { error } = await db.from('projects').delete().eq('id', id)
      if (error) throw new Error(`projects.delete : ${error.message}`)
    },
  }
}

/* ---------- Stockage de l'appareil (sans compte) ---------- */

const KEY = 'power-grid.models.v1'
const MEDIA_KEY = 'power-grid.media.v1'

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
  }
}

/** Le compte quand on est connecte, sinon l'appareil. */
export const modelStore = (signedIn: boolean): ModelStore => (supabase && signedIn ? cloudStore() : localStore())
