import type { ElementType, GridItem, ItemProps } from './types'
import { newId } from './grid'

export interface Cell {
  type: ElementType
  col: number
  row: number
  cs: number
  rs: number
  props?: ItemProps
}

export interface Template {
  id: string
  name: { fr: string; en: string }
  desc: { fr: string; en: string }
  cells: Cell[]
  rows?: number[] // poids de hauteur des 8 lignes
}

const c = (type: ElementType, col: number, row: number, cs: number, rs: number, props?: ItemProps): Cell => ({ type, col, row, cs, rs, props })

const KPI = (col: number, title: string, value: string, variation: string, icon: string): Cell =>
  c('kpi', col, 3, 3, 1, { title, value, variation, sub: 'vs. année précédente', icon, spark: true })

/** Le tableau de bord de la maquette : recherche et date, titre, 4 KPI, courbe et anneau, tableau. */
const SALES: Template = {
  id: 'sales',
  name: { fr: 'Tableau de bord des ventes', en: 'Sales dashboard' },
  desc: { fr: 'Le modèle de référence : KPI, courbe, anneau, tableau', en: 'The reference model: KPIs, line, donut, table' },
  rows: [0.5, 0.8, 1.7, 1.0, 1.0, 1.0, 1.1, 1.1],
  cells: [
    c('slicer', 1, 1, 3, 1, { variant: 'search', title: 'Rechercher…' }),
    c('slicer', 9, 1, 3, 1, { variant: 'date', title: '1 janv. 2024 – 31 déc. 2024' }),
    c('logo', 12, 1, 1, 1, { variant: 'avatar', title: 'NR' }),
    c('header', 1, 2, 12, 1),
    KPI(1, 'Chiffre d’affaires', '1 248 320 €', '+12,5 %', '▤'),
    KPI(4, 'Nombre de commandes', '8 742', '+8,3 %', '▣'),
    KPI(7, 'Panier moyen', '142,8 €', '+5,7 %', '♙'),
    KPI(10, 'Taux de conversion', '3,6 %', '+0,8 pt', '％'),
    c('chart', 1, 4, 7, 3, { variant: 'line', title: 'Évolution du chiffre d’affaires', sub: 'Mensuel' }),
    c('chart', 8, 4, 5, 3, { variant: 'donut', title: 'Répartition des ventes par catégorie' }),
    c('table', 1, 7, 12, 2, { title: 'Top 5 des produits' }),
  ],
}

export const TEMPLATES: Template[] = [
  SALES,
  {
    id: 'executive',
    name: { fr: 'Exécutif', en: 'Executive' },
    desc: { fr: 'KPI en tête, deux graphiques, un tableau', en: 'KPIs on top, two charts, one table' },
    cells: [c('header', 1, 1, 12, 1), c('kpi', 1, 2, 3, 1), c('kpi', 4, 2, 3, 1), c('kpi', 7, 2, 3, 1), c('kpi', 10, 2, 3, 1), c('chart', 1, 3, 8, 3), c('chart', 9, 3, 4, 3), c('table', 1, 6, 12, 3)],
  },
  {
    id: 'analyst',
    name: { fr: 'Analyste', en: 'Analyst' },
    desc: { fr: 'Segments, KPI, deux graphiques, tableau', en: 'Slicers, KPIs, two charts, table' },
    cells: [c('header', 1, 1, 12, 1), c('slicer', 1, 2, 3, 1), c('slicer', 4, 2, 3, 1), c('slicer', 7, 2, 3, 1), c('slicer', 10, 2, 3, 1), c('kpi', 1, 3, 4, 1), c('kpi', 5, 3, 4, 1), c('kpi', 9, 3, 4, 1), c('chart', 1, 4, 6, 3), c('chart', 7, 4, 6, 3), c('table', 1, 7, 12, 2)],
  },
  {
    id: 'geo',
    name: { fr: 'Géographique', en: 'Geographic' },
    desc: { fr: 'Grande carte, graphique et tableau', en: 'Large map, chart and table' },
    cells: [c('header', 1, 1, 12, 1), c('kpi', 1, 2, 4, 1), c('kpi', 5, 2, 4, 1), c('kpi', 9, 2, 4, 1), c('map', 1, 3, 7, 4), c('chart', 8, 3, 5, 4), c('chart', 1, 7, 6, 2), c('table', 7, 7, 6, 2)],
  },
  {
    id: 'trio',
    name: { fr: 'Trio', en: 'Trio' },
    desc: { fr: 'Trois graphiques côte à côte, tableau', en: 'Three charts side by side, table' },
    cells: [c('header', 1, 1, 12, 1), c('kpi', 1, 2, 3, 1), c('kpi', 4, 2, 3, 1), c('kpi', 7, 2, 3, 1), c('kpi', 10, 2, 3, 1), c('chart', 1, 3, 4, 3), c('chart', 5, 3, 4, 3), c('chart', 9, 3, 4, 3), c('table', 1, 6, 12, 3)],
  },
  {
    id: 'sidepanel',
    name: { fr: 'Panneau de filtres', en: 'Filter panel' },
    desc: { fr: 'Segments à gauche, visuels à droite', en: 'Slicers on the left, visuals on the right' },
    cells: [c('header', 1, 1, 12, 1), c('slicer', 1, 2, 3, 1), c('slicer', 1, 3, 3, 1), c('slicer', 1, 4, 3, 1), c('text', 1, 5, 3, 4), c('kpi', 4, 2, 3, 1), c('kpi', 7, 2, 3, 1), c('kpi', 10, 2, 3, 1), c('chart', 4, 3, 9, 3), c('table', 4, 6, 9, 3)],
  },
  {
    id: 'free',
    name: { fr: 'Libre', en: 'Free' },
    desc: { fr: 'Aucune zone : fond, navigation et en-tête seulement', en: 'No zones: background, navigation and header only' },
    cells: [c('header', 1, 1, 12, 1)],
  },
  {
    id: 'focus',
    name: { fr: 'Focus', en: 'Focus' },
    desc: { fr: 'Un message, un grand graphique', en: 'One message, one large chart' },
    cells: [c('header', 1, 1, 12, 1), c('kpi', 1, 2, 6, 1), c('kpi', 7, 2, 6, 1), c('chart', 1, 3, 12, 6)],
  },
]

export function templateItems(t: Template): GridItem[] {
  return t.cells.map(({ type, col, row, cs, rs, props }) => ({ id: newId(type), type, col, row, cs, rs, ...(props ? { props: { ...props } } : {}) }))
}
