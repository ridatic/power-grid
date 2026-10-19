import type { ElementType } from './core/types'

export type Lang = 'fr' | 'en'

const dict = {
  fr: {
    types: { kpi: 'KPI', chart: 'Graphique', table: 'Tableau', slicer: 'Segment', map: 'Carte', text: 'Zone de texte', logo: 'Logo', header: 'Titre', image: 'Image', icon: 'Icône' } as Record<ElementType, string>,
    undo: 'Annuler',
    redo: 'Rétablir',
    confirmReset: 'Repartir de zéro ? Le projet actuel sera remplacé (vous pouvez annuler).',
    confirmRemovePage: 'Supprimer cette page ?',
    exportDlg: {
      title: 'Exporter vers Power BI',
      step1: 'Le thème, une fois pour tout le rapport',
      themeHint: 'Couleurs, polices et visuels transparents.',
      step2: 'Le fond de chaque page',
      theme: 'Télécharger le thème (.json)',
      png: 'Fond en PNG',
      svg: 'Fond en SVG',
      csv: 'Télécharger (.csv)',
      all: 'Tout télécharger, toutes les pages',
      howTitle: 'Dans Power BI Desktop',
      steps: [
        'Affichage > Thèmes > Parcourir les thèmes, puis choisissez le .json.',
        'Format de la page > Arrière-plan du canevas > Image : le fond, ajustement Adapter, transparence 0 %.',
        'Placez boutons et visuels avec Format > Général > Propriétés (X, Y, Largeur, Hauteur) d\'après le tableau.',
      ],
      table: 'Positions des visuels',
      cols: ['Zone', 'X', 'Y', 'Larg.', 'Haut.'],
      close: 'Fermer',
    },
  },
  en: {
    types: { kpi: 'KPI', chart: 'Chart', table: 'Table', slicer: 'Slicer', map: 'Map', text: 'Text box', logo: 'Logo', header: 'Title', image: 'Image', icon: 'Icon' } as Record<ElementType, string>,
    undo: 'Undo',
    redo: 'Redo',
    confirmReset: 'Start over? The current project will be replaced (you can undo).',
    confirmRemovePage: 'Delete this page?',
    exportDlg: {
      title: 'Export to Power BI',
      step1: 'The theme, once for the whole report',
      themeHint: 'Colors, fonts and transparent visuals.',
      step2: 'The background of each page',
      theme: 'Download the theme (.json)',
      png: 'PNG background',
      svg: 'SVG background',
      csv: 'Download (.csv)',
      all: 'Download everything, all pages',
      howTitle: 'In Power BI Desktop',
      steps: [
        'View > Themes > Browse for themes, then pick the .json.',
        'Format page > Canvas background > Image: the background, Fit, 0% transparency.',
        'Place buttons and visuals with Format > General > Properties (X, Y, Width, Height) using the table.',
      ],
      table: 'Visual positions',
      cols: ['Zone', 'X', 'Y', 'Width', 'Height'],
      close: 'Close',
    },
  },
}

export const T = (l: Lang) => dict[l]
export type Dict = (typeof dict)['fr']
