import type { Project } from './core/types'
import type { Feedback } from './feedback'
import { listDocs, type DocKind, type ModelStore, type SavedModel } from './storage'
import type { Lang } from './i18n'

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * « Dupliquer » : une nouvelle copie, de meme nature que l'original (document ou modele), sous un nom demande et libre.
 * Renvoie la copie, ou null si l'utilisateur a renonce.
 */
export async function duplicateModel(store: ModelStore, fb: Feedback, lang: Lang, project: Project, name: string, kind: DocKind): Promise<SavedModel | null> {
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const models = await listDocs(store)
  let suggestion = `${name.trim() || tr('Sans titre', 'Untitled')} ${tr('(copie)', '(copy)')}`
  let message = kind === 'model' ? tr('La copie est ajoutée à « Mes modèles ». L\'original ne change pas.', 'The copy is added to "My models". The original does not change.') : tr('La copie apparaît dans vos récents. L\'original ne change pas.', 'The copy shows in your recent items. The original does not change.')
  for (;;) {
    const chosen = await fb.prompt({ title: tr('Dupliquer', 'Duplicate'), message, label: tr('Nom de la copie', 'Copy name'), value: suggestion, confirmLabel: tr('Dupliquer', 'Duplicate') })
    if (!chosen) return null
    if (!models.some((m) => same(m.name, chosen))) {
      const created = await store.create(kind, chosen, project)
      fb.toast(tr(`Copie « ${chosen} » créée`, `Copy "${chosen}" created`))
      return created
    }
    suggestion = chosen
    message = tr(`« ${chosen} » existe déjà. Choisissez un autre nom.`, `"${chosen}" already exists. Pick another name.`)
  }
}
