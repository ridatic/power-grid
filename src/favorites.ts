import { useEffect, useState } from 'react'
import type { ModelStore } from './storage'

/**
 * Favoris de l'utilisateur (mes modeles et modeles predefinis).
 * L'etoile change tout de suite a l'ecran ; l'enregistrement suit, et l'etat revient en arriere s'il echoue.
 */
export function useFavorites(store: ModelStore, onError: () => void) {
  const [favs, setFavs] = useState<string[]>([])

  useEffect(() => {
    store.getList('favorites').then(setFavs).catch((e: unknown) => console.error(e))
  }, [store])

  const write = (prev: string[], next: string[], silent = false) => {
    setFavs(next)
    store.setList('favorites', next).catch((e: unknown) => {
      console.error(e)
      setFavs(prev)
      if (!silent) onError()
    })
  }

  const toggle = (id: string) => write(favs, favs.includes(id) ? favs.filter((x) => x !== id) : [id, ...favs])

  /** Retire le favori d'un modele supprime, sans message. */
  const forget = (id: string) => {
    if (favs.includes(id)) write(favs, favs.filter((x) => x !== id), true)
  }

  return { favs, isFav: (id: string) => favs.includes(id), toggle, forget }
}
