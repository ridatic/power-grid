import type { Project } from './core/types'
import type { Feedback } from './feedback'
import type { ModelStore } from './storage'
import type { Lang } from './i18n'

/** Contenu comparable : sans identifiants ni page active, pour reperer deux modeles identiques. */
const fingerprint = (p: Project) => JSON.stringify({ ...p, active: 0 }, (k, v) => (k === 'id' ? undefined : v))

/**
 * Enregistre un fichier comme modele, apres avoir demande le nom.
 * Evite les doublons : un modele identique n'est pas recree, un nom deja pris propose de remplacer ou de changer de nom.
 * Renvoie true si un modele a ete enregistre.
 */
export async function saveAsModel(store: ModelStore, fb: Feedback, lang: Lang, project: Project, suggested: string): Promise<boolean> {
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const models = await store.list('model')
  const same = models.find((m) => fingerprint(m.data) === fingerprint(project))
  if (same) {
    fb.toast(tr(`Ce modèle est déjà dans votre bibliothèque : « ${same.name} »`, `This model is already in your library: "${same.name}"`), 'info')
    return false
  }
  let name = await fb.prompt({
    title: tr('Enregistrer comme modèle', 'Save as model'),
    message: tr('Le modèle garde le thème, la navigation et les pages de ce fichier. Vous pourrez créer de nouveaux fichiers à partir de lui, depuis « Mes modèles ».', 'The model keeps this file theme, navigation and pages. You can create new files from it, from "My models".'),
    label: tr('Nom du modèle', 'Model name'),
    value: suggested,
    confirmLabel: tr('Enregistrer', 'Save'),
  })
  while (name) {
    const clash = models.find((m) => m.name.trim().toLowerCase() === name!.toLowerCase())
    if (!clash) {
      await store.create('model', name, project)
      fb.toast(tr(`Modèle « ${name} » enregistré dans votre bibliothèque`, `Model "${name}" saved to your library`))
      return true
    }
    const choice = await fb.choose({
      title: tr(`Un modèle s'appelle déjà « ${clash.name} »`, `A model is already called "${clash.name}"`),
      message: tr('Remplacer ce modèle par le contenu du fichier, ou choisir un autre nom ?', 'Replace that model with this file content, or pick another name?'),
      choices: [
        { id: 'rename', label: tr('Choisir un autre nom', 'Pick another name') },
        { id: 'replace', label: tr('Remplacer', 'Replace'), primary: true },
      ],
    })
    if (choice === 'replace') {
      await store.save(clash.id, clash.name, project)
      fb.toast(tr(`Modèle « ${clash.name} » mis à jour`, `Model "${clash.name}" updated`))
      return true
    }
    if (choice !== 'rename') return false
    name = await fb.prompt({ title: tr('Enregistrer comme modèle', 'Save as model'), label: tr('Nom du modèle', 'Model name'), value: `${name} 2`, confirmLabel: tr('Enregistrer', 'Save') })
  }
  return false
}
