import type { Config } from './core/types'
import type { Tab } from './components/Panels'

export interface SettingEntry {
  kind: 'setting'
  id: string // data-opt du reglage
  tab: Tab
  more?: boolean // range dans « Plus d'options »
  menu?: boolean // visible seulement sur une page de menu principal
  fr: string
  en: string
  keys: string // mots proches, pour la recherche
  value?: (cfg: Config) => string
}

const S = (id: string, tab: Tab, fr: string, en: string, keys: string, value?: SettingEntry['value'], more = false, menu = false): SettingEntry => ({ kind: 'setting', id, tab, more, menu, fr, en, keys, value })

/** Tous les reglages de l'application, avec leur emplacement. */
export const SETTINGS: SettingEntry[] = [
  S('template', 'templates', 'Modèle de disposition', 'Layout template', 'modele disposition gabarit template layout zones visuels'),
  S('copyAll', 'templates', 'Utiliser la disposition sur toutes les pages', 'Use layout on all pages', 'copier appliquer toutes pages dupliquer'),
  S('menuStyle', 'templates', 'Style du menu principal', 'Main menu style', 'menu accueil couverture banniere tuiles', undefined, false, true),
  S('menuImage', 'templates', 'Image du menu principal', 'Main menu image', 'photo image fond menu', (c) => (c.menu.image ? '✓' : ''), false, true),
  S('menuBlur', 'templates', 'Flou de l\'image du menu', 'Menu image blur', 'flou blur image', undefined, true, true),
  S('menuDarken', 'templates', 'Assombrir l\'image du menu', 'Darken menu image', 'sombre assombrir image', undefined, true, true),
  S('menuFit', 'templates', 'Ajustement de l\'image du menu', 'Menu image fit', 'ajuster remplir contenir', undefined, true, true),
  S('menuSide', 'templates', 'Côté de l\'image du menu', 'Menu image side', 'gauche droite cote', undefined, true, true),
  S('menuUseOn', 'templates', 'Image sur toutes les pages', 'Image on every page', 'image bandeau toutes pages', undefined, true, true),
  S('menuLabels', 'templates', 'Textes des boutons du menu', 'Menu button text', 'libelles boutons texte', undefined, true, true),
  S('menuLabelColor', 'templates', 'Couleur du texte sur l\'image', 'Text color on image', 'couleur texte blanc', undefined, true, true),

  S('size', 'templates', 'Taille de la page', 'Page size', 'taille format dimensions resolution 16:9', (c) => `${c.width} × ${c.height}`),
  S('margin', 'templates', 'Marge autour du contenu', 'Margin around content', 'marge bord espace', (c) => `${c.margin} px`),
  S('density', 'templates', 'Espace entre les cartes', 'Space between cards', 'densite espacement gouttiere ecart'),

  S('palette', 'colors', 'Palette de couleurs', 'Color palette', 'palette couleurs theme secteur ressenti ton', undefined),
  S('brand', 'colors', 'Couleur de marque', 'Brand color', 'marque brand accent principale charte', (c) => c.colors[0]),
  S('mode', 'colors', 'Fond du rapport clair ou sombre', 'Light or dark report background', 'sombre clair dark light nuit', undefined),
  S('colors8', 'colors', 'Les 8 couleurs du thème', 'The 8 theme colors', 'couleurs donnees graphiques series modifier'),
  S('imagePalette', 'colors', 'Palette depuis une image', 'Palette from an image', 'image photo extraire logo'),
  S('pageBg', 'colors', 'Teinte du fond clair', 'Light background shade', 'fond arriere-plan blanc ivoire gris'),

  S('frame', 'nav', 'Type de navigation', 'Navigation type', 'navigation menu barre laterale onglets rail capsule filtres sidebar tabs', undefined),
  S('tone', 'nav', 'Fond de la navigation', 'Navigation background', 'couleur navigation marine fond'),
  S('labels', 'nav', 'Écrire le nom des pages', 'Write page names', 'libelles noms pages texte boutons', (c) => (c.navLabels === 'fixed' ? '✓' : '')),
  S('active', 'nav', 'Page active', 'Active page', 'active selection surbrillance affichee'),
  S('fill', 'nav', 'Remplissage de la navigation', 'Navigation fill', 'degrade uni remplissage gradient effet'),
  S('ink', 'nav', 'Texte et icônes de la navigation', 'Navigation text and icons', 'encre texte couleur icones'),
  S('corners', 'nav', 'Coins des boutons', 'Button corners', 'coins arrondi rond onglets boutons pilule'),
  S('position', 'nav', 'Position des boutons', 'Button position', 'position haut milieu bas verticale'),
  S('slots', 'nav', 'Nombre de filtres', 'Number of filters', 'filtres segments panneau slicers', (c) => String(c.filterSlots)),
  S('icons', 'nav', 'Afficher les icônes', 'Show icons', 'icones pictogrammes', (c) => (c.navIcons ? '✓' : '')),
  S('iconStyle', 'nav', 'Style des icônes', 'Icon style', 'icones contour duotone', undefined, true),
  S('iconWeight', 'nav', 'Épaisseur des icônes', 'Icon weight', 'icones epaisseur trait', undefined, true),
  S('iconBacking', 'nav', 'Fond des icônes', 'Icon backing', 'icones fond carre rond', undefined, true),
  S('pageIcons', 'nav', 'Icône de chaque page', 'Icon of each page', 'icone page pictogramme'),
  S('decor', 'nav', 'Vague décorative', 'Decorative wave', 'motif decor forme doree vague'),
  S('user', 'text', 'Utilisateur dans la navigation', 'User in navigation', 'utilisateur avatar profil'),

  S('radius', 'layout', 'Arrondi des cartes', 'Card corners', 'coins arrondi rayon radius cartes', (c) => `${c.radius} px`),
  S('cardStyle', 'layout', 'En-tête de carte', 'Card header', 'carte bandeau repere style entete'),
  S('cardColor', 'layout', 'Fond des cartes', 'Card background', 'carte fond teinte couleur'),
  S('texture', 'layout', 'Motif dans les cartes', 'Pattern in cards', 'texture lueur halo points motif'),
  S('cardSize', 'layout', 'Taille du texte des visuels', 'Visual text size', 'taille cartes texte visuels', (c) => `${c.cardSize} px`),
  S('shadow', 'layout', 'Ombre des cartes', 'Card shadow', 'ombre relief shadow', (c) => (c.shadow ? '✓' : '')),
  S('showTitle', 'text', 'Afficher le titre', 'Show title', 'titre entete afficher masquer', (c) => (c.showHeader ? '✓' : '')),
  S('visible', 'layout', 'Cartes affichées (KPI, graphiques, tableaux)', 'Cards shown (KPIs, charts, tables)', 'afficher masquer kpi graphiques tableau zones'),
  S('band', 'text', 'Titre sur un bandeau coloré', 'Title on a colored band', 'bandeau entete titre couleur', (c) => (c.headerBand ? '✓' : '')),
  S('labelZones', 'layout', 'Plan simple (nom des zones)', 'Simple plan (zone names)', 'nommer etiquette zones libelle plan filaire wireframe', (c) => (c.labelZones ? '✓' : '')),

  S('title', 'text', 'Titre du rapport', 'Report title', 'titre nom rapport tableau de bord', (c) => c.title),
  S('subtitle', 'text', 'Sous-titre', 'Subtitle', 'sous-titre description', (c) => c.subtitle),
  S('company', 'text', 'Nom dans la navigation', 'Name in navigation', 'entreprise societe espace marque nom', (c) => c.company),
  S('font', 'text', 'Police', 'Font', 'police font typographie caracteres', (c) => c.font),
  S('logo', 'text', 'Logo', 'Logo', 'logo marque image', undefined),
  S('userName', 'text', 'Nom de l\'utilisateur', 'User name', 'utilisateur nom profil', (c) => c.userName),
  S('userRole', 'text', 'Rôle de l\'utilisateur', 'User role', 'role poste fonction', (c) => c.userRole),
  S('footer', 'text', 'Pied de page', 'Footer', 'pied de page bas mentions', (c) => c.footer),
  S('linkedin', 'text', 'LinkedIn', 'LinkedIn', 'linkedin reseau social', (c) => c.linkedin),
  S('website', 'text', 'Site web', 'Website', 'site web url internet', (c) => c.website),
  S('titleSize', 'text', 'Taille du titre', 'Title size', 'taille titre police grand', (c) => `${c.titleSize} px`),
  S('textSize', 'text', 'Taille du texte', 'Text size', 'taille texte police', (c) => `${c.textSize} px`),
]

export const TAB_NAMES: Record<Tab, { fr: string; en: string }> = {
  templates: { fr: 'Disposition', en: 'Layout' },
  colors: { fr: 'Couleurs', en: 'Colors' },
  nav: { fr: 'Navigation', en: 'Navigation' },
  layout: { fr: 'Cartes', en: 'Cards' },
  text: { fr: 'Textes', en: 'Text' },
  media: { fr: 'Médias', en: 'Media' },
}

export const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Vrai si tous les mots de la requete apparaissent dans le texte. */
export function matches(query: string, haystack: string): boolean {
  const h = normalize(haystack)
  return normalize(query).split(/\s+/).filter(Boolean).every((w) => h.includes(w))
}
