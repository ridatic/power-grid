import { useState } from 'react'
import type { Config, ElementType, GridItem, ItemProps } from '../core/types'
import { itemRect } from '../core/grid'
import type { Dict, Lang } from '../i18n'

const ZONE_TYPES: ElementType[] = ['kpi', 'chart', 'table', 'slicer', 'map', 'text', 'logo']
const ICONS = [['▤', 'Icône personnalisée', 'Custom icon'], ['€', 'Euro', 'Euro'], ['▣', 'Commandes', 'Orders'], ['♙', 'Client', 'Customer'], ['％', 'Pourcentage', 'Percent']]

interface Props {
  t: Dict
  lang: Lang
  cfg: Config
  item: GridItem
  rows?: number[]
  label: string
  onType: (type: ElementType) => void
  onProps: (patch: Partial<ItemProps>) => void
  onRemove: () => void
  onClose: () => void
}

/** Panneau de l'element selectionne : proprietes, style et coordonnees Power BI. */
export function Inspector({ t, lang, cfg, item, rows, label, onType, onProps, onRemove, onClose }: Props) {
  const [tab, setTab] = useState<'props' | 'style'>('props')
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const p = item.props ?? {}
  const r = itemRect(cfg, item, rows)
  const isKpi = item.type === 'kpi'
  const hasTitle = ['kpi', 'chart', 'table', 'slicer', 'logo'].includes(item.type)

  return (
    <>
      <div className="right-inner">
        <div className="inspector-head">
          <div className="inspector-icon">▤</div>
          <div>
            <small>{t.selectedElement}</small>
            <strong>{label}</strong>
          </div>
          <button className="close-inspector" aria-label={t.close} onClick={onClose}>×</button>
        </div>
        <div className="inspector-tabs">
          <button className={tab === 'props' ? 'active' : ''} onClick={() => setTab('props')}>{tr('Propriétés', 'Properties')}</button>
          <button className={tab === 'style' ? 'active' : ''} onClick={() => setTab('style')}>{tr('Style', 'Style')}</button>
        </div>
        <div className="inspector-body">
          {tab === 'props' && (
            <>
              {item.type !== 'header' && (
                <details className="prop-group" open>
                  <summary>{t.zoneType}</summary>
                  <div className="prop-field">
                    <select value={item.type} onChange={(e) => onType(e.target.value as ElementType)}>
                      {ZONE_TYPES.map((k) => <option key={k} value={k}>{t.types[k]} · {t.typeHint[k]}</option>)}
                    </select>
                  </div>
                  {item.type === 'chart' && (
                    <div className="prop-field">
                      <label>{tr('Type de graphique', 'Chart type')}</label>
                      <select value={p.variant ?? 'bar'} onChange={(e) => onProps({ variant: e.target.value })}>
                        <option value="bar">{tr('Barres', 'Bars')}</option>
                        <option value="line">{tr('Courbe', 'Line')}</option>
                        <option value="donut">{tr('Anneau', 'Donut')}</option>
                      </select>
                    </div>
                  )}
                </details>
              )}
              {hasTitle && (
                <details className="prop-group" open>
                  <summary>{tr('Contenu', 'Content')}</summary>
                  <div className="prop-field">
                    <label>{tr('Titre', 'Title')}</label>
                    <input value={p.title ?? ''} onChange={(e) => onProps({ title: e.target.value })} />
                  </div>
                  {isKpi && (
                    <>
                      <div className="prop-field"><label>{tr('Valeur', 'Value')}</label><input value={p.value ?? ''} onChange={(e) => onProps({ value: e.target.value })} /></div>
                      <div className="prop-field"><label>{tr('Variation', 'Change')}</label><input value={p.variation ?? ''} onChange={(e) => onProps({ variation: e.target.value })} /></div>
                      <div className="prop-field"><label>{tr('Texte secondaire', 'Secondary text')}</label><input value={p.sub ?? ''} onChange={(e) => onProps({ sub: e.target.value })} /></div>
                      <div className="prop-field">
                        <label>{tr('Icône', 'Icon')}</label>
                        <select value={p.icon ?? '▤'} onChange={(e) => onProps({ icon: e.target.value })}>
                          {ICONS.map(([g, fr, en]) => <option key={g} value={g}>{g} {tr(fr, en)}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </details>
              )}
              {item.type === 'header' && <p className="tiny-note">{tr('Le titre se règle dans « Textes et logo ».', 'Edit the title in "Text and logo".')}</p>}
            </>
          )}

          {tab === 'style' && (
            <>
              {isKpi && (
                <details className="prop-group" open>
                  <summary>{tr('Style', 'Style')}</summary>
                  <div className="prop-field">
                    <label>{tr('Taille de la carte', 'Card size')}</label>
                    <select value={p.size ?? 'medium'} onChange={(e) => onProps({ size: e.target.value as ItemProps['size'] })}>
                      <option value="medium">{tr('Moyenne', 'Medium')}</option>
                      <option value="compact">{tr('Compacte', 'Compact')}</option>
                      <option value="large">{tr('Grande', 'Large')}</option>
                    </select>
                  </div>
                  <div className="prop-field">
                    <label>{tr('Alignement du contenu', 'Content alignment')}</label>
                    <select value={p.align ?? 'left'} onChange={(e) => onProps({ align: e.target.value as ItemProps['align'] })}>
                      <option value="left">{tr('Gauche', 'Left')}</option>
                      <option value="center">{tr('Centre', 'Center')}</option>
                      <option value="right">{tr('Droite', 'Right')}</option>
                    </select>
                  </div>
                  <div className="toggle-row">
                    {tr('Afficher le graphique', 'Show the chart')}
                    <input className="toggle" type="checkbox" checked={p.spark ?? true} onChange={(e) => onProps({ spark: e.target.checked })} />
                  </div>
                </details>
              )}
              <details className="prop-group" open>
                <summary>{tr('Emplacement Power BI', 'Power BI location')}</summary>
                <p className="tiny-note" style={{ margin: '0 0 8px' }}>{t.cellsAt(item.col, item.col + item.cs - 1, item.row, item.row + item.rs - 1)}</p>
                <div className="prop-two">
                  {([['X', r.x], ['Y', r.y], [tr('Largeur', 'Width'), r.w], [tr('Hauteur', 'Height'), r.h]] as const).map(([k, v]) => (
                    <div key={k} className="prop-field"><label>{k}</label><input readOnly value={v} /></div>
                  ))}
                </div>
              </details>
            </>
          )}
          <button className="delete" onClick={onRemove}>▧ &nbsp; {t.remove}</button>
        </div>
      </div>
    </>
  )
}
