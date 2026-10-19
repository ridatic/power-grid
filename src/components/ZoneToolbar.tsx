import { useState } from 'react'
import type { Config, ElementType, GridItem, ItemProps } from '../core/types'
import { itemRect } from '../core/grid'
import type { MediaPick } from './MediaLibrary'
import type { Dict, Lang } from '../i18n'

/** Types de visuels interchangeables : ils occupent une carte et deviennent un visuel Power BI. */
const VISUALS: ElementType[] = ['kpi', 'chart', 'table', 'slicer', 'map']
const KPI_ICONS = ['▤', '€', '▣', '♙', '％']

interface Props {
  t: Dict
  lang: Lang
  cfg: Config
  item: GridItem
  rows?: number[]
  onType: (type: ElementType, props?: Partial<ItemProps>) => void
  onProps: (patch: Partial<ItemProps>) => void
  onRemove: () => void
  /** Ouvre la bibliotheque (images et icones). */
  onMedia: (mode: 'image' | 'icon' | 'image-only', pick: (p: MediaPick) => void) => void
}

/** Barre contextuelle de l'element selectionne : seulement les actions qui ont du sens pour son type. */
export function ZoneToolbar({ t, lang, cfg, item, rows, onType, onProps, onRemove, onMedia }: Props) {
  const [pop, setPop] = useState<'text' | null>(null)
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const p = item.props ?? {}
  const r = itemRect(cfg, item, rows)
  const variant = p.variant
  const isPill = item.type === 'slicer' && (variant === 'search' || variant === 'date')
  const isAvatar = item.type === 'logo' && variant === 'avatar'
  const isVisual = VISUALS.includes(item.type) && !isPill
  const toggle = (k: 'text') => setPop(pop === k ? null : k)

  // Une image ou une icone choisie dans la bibliotheque remplace le contenu de l'element
  const fromLibrary = (p: MediaPick) => {
    if (p.kind === 'image') return item.type === 'image' || isAvatar ? onProps({ src: p.src }) : onType('image', { src: p.src, fit: 'contain' })
    return item.type === 'icon' ? onProps({ icon: p.name }) : onType('icon', { icon: p.name })
  }

  return (
    <div className="ctx-inner" onPointerDown={(e) => e.stopPropagation()}>
      <div className="ctx-bar">
        <span className="ctx-kind">{isAvatar ? tr('Photo de profil', 'Profile photo') : isPill ? (variant === 'search' ? tr('Recherche', 'Search') : tr('Période', 'Period')) : t.types[item.type]}</span>

        {isVisual && (
          <label className="ctx-type">
            <span className="sr">{tr('Type de visuel', 'Visual type')}</span>
            <select value={item.type} onChange={(e) => onType(e.target.value as ElementType)} title={tr('Changer le type de visuel', 'Change the visual type')}>
              {VISUALS.map((k) => <option key={k} value={k}>{t.types[k]}</option>)}
            </select>
          </label>
        )}
        {item.type === 'chart' && (
          <select className="ctx-select" aria-label={tr('Type de graphique', 'Chart type')} value={variant ?? 'bar'} onChange={(e) => onProps({ variant: e.target.value })}>
            <option value="bar">{tr('Barres', 'Bars')}</option>
            <option value="line">{tr('Courbe', 'Line')}</option>
            <option value="donut">{tr('Anneau', 'Donut')}</option>
          </select>
        )}

        {(isVisual || isPill || item.type === 'text') && (
          <button className={pop === 'text' ? 'on' : ''} aria-expanded={pop === 'text'} onClick={() => toggle('text')}>{tr('Modifier le texte', 'Edit text')}</button>
        )}

        {(item.type === 'image' || isAvatar || item.type === 'logo') && (
          <button onClick={() => onMedia(isAvatar ? 'image-only' : 'image', fromLibrary)}>{p.src ? tr('Changer l\'image', 'Change image') : tr('Choisir une image', 'Choose an image')}</button>
        )}
        {item.type === 'image' && p.src && (
          <select className="ctx-select" aria-label={tr('Ajustement', 'Fit')} value={p.fit ?? 'cover'} onChange={(e) => onProps({ fit: e.target.value as ItemProps['fit'] })}>
            <option value="cover">{tr('Remplir', 'Fill')}</option>
            <option value="contain">{tr('Contenir', 'Fit')}</option>
          </select>
        )}
        {item.type === 'icon' && <button onClick={() => onMedia('icon', fromLibrary)}>{tr('Changer l\'icône', 'Change icon')}</button>}

        <span className="ctx-sep" />
        <button className="danger" onClick={onRemove}>{tr('Supprimer', 'Delete')}</button>
      </div>

      {pop === 'text' && (
        <div className="ctx-pop">
          {item.type === 'text' ? (
            <>
              <label>{tr('Texte', 'Text')}<textarea rows={3} value={p.text ?? ''} placeholder={tr('Votre texte…', 'Your text…')} onChange={(e) => onProps({ text: e.target.value })} /></label>
              <label>{tr('Alignement', 'Alignment')}
                <select value={p.align ?? 'left'} onChange={(e) => onProps({ align: e.target.value as ItemProps['align'] })}>
                  <option value="left">{tr('Gauche', 'Left')}</option>
                  <option value="center">{tr('Centre', 'Center')}</option>
                  <option value="right">{tr('Droite', 'Right')}</option>
                </select>
              </label>
            </>
          ) : (
            <label>{tr('Titre', 'Title')}<input value={p.title ?? ''} onChange={(e) => onProps({ title: e.target.value })} /></label>
          )}
          {item.type === 'kpi' && (
            <>
              <label>{tr('Valeur', 'Value')}<input value={p.value ?? ''} onChange={(e) => onProps({ value: e.target.value })} /></label>
              <label>{tr('Variation', 'Change')}<input value={p.variation ?? ''} onChange={(e) => onProps({ variation: e.target.value })} /></label>
              <label>{tr('Texte secondaire', 'Secondary text')}<input value={p.sub ?? ''} onChange={(e) => onProps({ sub: e.target.value })} /></label>
              <div className="ctx-two">
                <label>{tr('Icône', 'Icon')}
                  <select value={p.icon ?? '▤'} onChange={(e) => onProps({ icon: e.target.value })}>{KPI_ICONS.map((g) => <option key={g}>{g}</option>)}</select>
                </label>
                <label>{tr('Alignement', 'Alignment')}
                  <select value={p.align ?? 'left'} onChange={(e) => onProps({ align: e.target.value as ItemProps['align'] })}>
                    <option value="left">{tr('Gauche', 'Left')}</option>
                    <option value="center">{tr('Centre', 'Center')}</option>
                    <option value="right">{tr('Droite', 'Right')}</option>
                  </select>
                </label>
              </div>
              <label className="ctx-check"><input type="checkbox" checked={p.spark ?? true} onChange={(e) => onProps({ spark: e.target.checked })} />{tr('Petite courbe', 'Sparkline')}</label>
            </>
          )}
          <p className="ctx-coords">{tr('Position Power BI', 'Power BI position')} : X {r.x} · Y {r.y} · {tr('L', 'W')} {r.w} · H {r.h}</p>
        </div>
      )}

    </div>
  )
}
