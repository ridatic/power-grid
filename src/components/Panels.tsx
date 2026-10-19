import { useEffect, useState, type ChangeEvent } from 'react'
import type { Config, ElementType, ItemProps, MenuConfig, NavFrame, Project } from '../core/types'
import type { Action } from '../store'
import { DEFAULT_CONFIG } from '../store'
import { defaultsOf, isChanged } from '../resets'
import { FEELINGS, FONTS, INDUSTRIES, PALETTES, TONES, paletteFromAccent, paletteFromImage } from '../core/palettes'
import { ICONS, ICON_SETS } from '../core/icons'
import { NAV_FRAMES, pageIcon } from '../core/nav'
import { TEMPLATES, type Template } from '../core/layouts'
import { imageToDataUrl } from '../files'
import type { MediaItem, ModelStore } from '../storage'
import type { MediaPick } from './MediaLibrary'
import { Card, Group, More, Opt, PanelHead, Seg, Switch } from './ui'
import { MenuThumb, NavThumb } from './thumbs'
import { Icon } from './Icon'
import type { Lang } from '../i18n'

export type Tab = 'templates' | 'colors' | 'nav' | 'layout' | 'text' | 'media'

export interface PanelProps {
  project: Project
  dispatch: (a: Action) => void
  lang: Lang
  more: boolean
  toggleMore: () => void
  notify: (msg: string) => void
  templateId: string | null
  onTemplate: (tpl: Template) => void
  store: ModelStore
  /** Ouvre la bibliotheque (images et icones). */
  onMedia: (mode: 'image' | 'icon' | 'image-only', pick: (p: MediaPick) => void) => void
  /** Ajoute un element sur la page active, a la premiere place libre. */
  onInsert: (type: ElementType, props: ItemProps) => void
}

const SIZES = [
  { w: 1440, h: 900, label: '1440 × 900 (16:10)' },
  { w: 1280, h: 720, label: '1280 × 720 (16:9, Power BI par défaut)' },
  { w: 1920, h: 1080, label: '1920 × 1080 (16:9)' },
  { w: 1920, h: 1280, label: '1920 × 1280 (3:2)' },
  { w: 960, h: 720, label: '960 × 720 (4:3)' },
]

const navNames = (lang: Lang): Record<NavFrame, string> => {
  const fr = lang === 'fr'
  return {
    sidebar: fr ? 'Barre latérale' : 'Sidebar',
    floating: fr ? 'Panneau flottant' : 'Floating',
    rail: fr ? 'Rail d\'icônes' : 'Icon rail',
    toprail: fr ? 'Haut + rail' : 'Top + rail',
    tabs: fr ? 'Onglets' : 'Tabs',
    notch: fr ? 'Onglet encoché' : 'Notch tabs',
    folder: fr ? 'Onglets dossier' : 'Folder tabs',
    filter: fr ? 'Panneau de filtres' : 'Filter panel',
    capsule: fr ? 'Capsule' : 'Capsule',
    none: fr ? 'Aucune' : 'None',
  }
}

function useKit(p: PanelProps) {
  const tr = (fr: string, en: string) => (p.lang === 'fr' ? fr : en)
  const cfg = p.project.cfg
  const set = (patch: Partial<Config>) => p.dispatch({ t: 'cfg', patch })
  /** Remise a la valeur par defaut, proposee seulement si le reglage a change. */
  const r = (...keys: (keyof Config)[]) => (isChanged(cfg, keys) ? () => set(defaultsOf(keys)) : undefined)
  const rt = tr('Revenir à la valeur par défaut', 'Back to default')
  return { tr, cfg, set, r, rt }
}

/* ---------- Disposition : modele de page et format ---------- */

export function TemplatesPanel(p: PanelProps) {
  const { tr, cfg, set, r, rt } = useKit(p)
  const page = p.project.pages[p.project.active]
  const setMenu = (patch: Partial<MenuConfig>) => set({ menu: { ...cfg.menu, ...patch } })

  if (page.kind === 'menu') {
    return (
      <>
        <PanelHead title={tr('Menu principal', 'Main menu')} desc={tr('La page d\'accueil du rapport, qui mène aux autres pages.', 'The report home page, leading to the other pages.')} />
        <Opt id="menuStyle" label={tr('Style', 'Style')}>
          <div className="cards">
            {([['story', tr('Récit', 'Story')], ['banner', tr('Bannière', 'Banner')], ['image', tr('Panneau image', 'Image panel')], ['cover', tr('Couverture', 'Cover')], ['tiles', tr('Tuiles', 'Tiles')], ['split', tr('Scindé', 'Split')]] as const).map(([v, label]) => (
              <Card key={v} selected={cfg.menu.style === v} onClick={() => setMenu({ style: v })} thumb={<MenuThumb style={v} />} label={label} isDefault={v === DEFAULT_CONFIG.menu.style} />
            ))}
          </div>
        </Opt>
        <Group title={tr('Image de fond', 'Background image')} />
        <Opt id="menuImage" hint={tr('Utilisée par les styles Récit, Bannière, Panneau image, Couverture et Scindé.', 'Used by the Story, Banner, Image panel, Cover and Split styles.')}>
          <div className="row">
            <button className="btn" onClick={() => p.onMedia('image-only', (pick) => pick.kind === 'image' && setMenu({ image: pick.src }))}><Icon name="image" size={14} /> {cfg.menu.image ? tr('Changer l\'image', 'Change image') : tr('Choisir une image', 'Choose an image')}</button>
            {cfg.menu.image && <button className="btn" onClick={() => setMenu({ image: null })}>{tr('Retirer', 'Remove')}</button>}
          </div>
        </Opt>
        {cfg.menu.image && (
          <>
            <Opt id="menuBlur" label={tr('Flou', 'Blur')}>
              <Seg value={cfg.menu.blur} def={DEFAULT_CONFIG.menu.blur} onChange={(blur) => setMenu({ blur })} options={[{ v: 'none', label: tr('Aucun', 'None') }, { v: 'soft', label: tr('Léger', 'Soft') }, { v: 'strong', label: tr('Fort', 'Strong') }]} />
            </Opt>
            <Opt id="menuDarken" label={tr('Assombrir (lisibilité du texte)', 'Darken (text readability)')}>
              <Seg value={cfg.menu.darken} def={DEFAULT_CONFIG.menu.darken} onChange={(darken) => setMenu({ darken })} options={[{ v: 'light', label: tr('Léger', 'Light') }, { v: 'medium', label: tr('Moyen', 'Medium') }, { v: 'heavy', label: tr('Fort', 'Heavy') }]} />
            </Opt>
            <Opt id="menuFit" label={tr('Cadrage', 'Framing')}>
              <Seg value={cfg.menu.fit} def={DEFAULT_CONFIG.menu.fit} onChange={(fit) => setMenu({ fit })} options={[{ v: 'fill', label: tr('Remplir (recadre)', 'Fill (crops)') }, { v: 'fit', label: tr('Entière', 'Whole') }]} />
            </Opt>
          </>
        )}
        <Opt id="menuSide" label={tr('Côté de l\'image', 'Image side')}>
          <Seg value={cfg.menu.side} def={DEFAULT_CONFIG.menu.side} onChange={(side) => setMenu({ side })} options={[{ v: 'left', label: tr('Gauche', 'Left') }, { v: 'right', label: tr('Droite', 'Right') }]} />
        </Opt>
        <Group title={tr('Boutons vers les pages', 'Buttons to pages')} />
        <Opt id="menuLabels" label={tr('Nom des pages sur les boutons', 'Page names on buttons')} hint={tr('« Vides » laisse la place aux boutons que vous ajouterez dans Power BI.', '"Empty" leaves room for the buttons you will add in Power BI.')}>
          <Seg value={cfg.menu.labels} def={DEFAULT_CONFIG.menu.labels} onChange={(labels) => setMenu({ labels })} options={[{ v: 'baked', label: tr('Écrits', 'Written') }, { v: 'blank', label: tr('Vides', 'Empty') }]} />
        </Opt>
        <Opt id="menuLabelColor" label={tr('Couleur du texte sur l\'image', 'Text color on the image')}>
          <Seg value={cfg.menu.labelColor} def={DEFAULT_CONFIG.menu.labelColor} onChange={(labelColor) => setMenu({ labelColor })} options={[{ v: 'auto', label: 'Auto' }, { v: 'white', label: tr('Blanc', 'White') }, { v: 'palette', label: tr('Couleur principale', 'Main color') }]} />
        </Opt>
        <Opt id="menuUseOn" label={tr('Image aussi sur les autres pages', 'Image on other pages too')} hint={tr('Place l\'image dans le bandeau du titre de chaque page (option « Titre sur un bandeau » de l\'onglet Textes).', 'Puts the image in each page title band ("Title on a band" in the Text tab).')}>
          <Seg value={cfg.menu.useOn} def={DEFAULT_CONFIG.menu.useOn} onChange={(useOn) => setMenu({ useOn })} options={[{ v: 'menu', label: tr('Non', 'No') }, { v: 'all', label: tr('Oui', 'Yes') }]} />
        </Opt>
      </>
    )
  }

  return (
    <>
      <PanelHead title={tr('Disposition', 'Layout')} desc={tr("Où se placent les visuels sur la page. Ensuite, déplacez-les ou ajoutez-en d'autres directement sur l'aperçu.", 'Where visuals sit on the page. Then move them or add more right on the preview.')} />
      <Opt id="template" label={tr('Modèle de la page', 'Page template')}>
        <div className="tpls">
          {TEMPLATES.map((tpl) => (
            <button key={tpl.id} className={`tpl${p.templateId === tpl.id ? ' on' : ''}`} aria-pressed={p.templateId === tpl.id} onClick={() => p.onTemplate(tpl)}>
              <span className="tpl-grid">
                {tpl.cells.map((c, i) => (
                  <i key={i} className={`tpl-cell ${c.type}`} style={{ gridColumn: `${c.col} / span ${c.cs}`, gridRow: `${c.row} / span ${c.rs}` }} />
                ))}
              </span>
              <b>{tpl.name[p.lang]}</b>
              <small>{tpl.desc[p.lang]}</small>
            </button>
          ))}
        </div>
      </Opt>
      <Opt id="copyAll">
        <button className="btn wide" onClick={() => { p.dispatch({ t: 'copyToAll' }); p.notify(tr('Disposition appliquée à toutes les pages', 'Layout applied to all pages')) }}>{tr('Utiliser cette disposition sur toutes les pages', 'Use this layout on all pages')}</button>
      </Opt>
      <Group title={tr('Format de la page', 'Page format')} />
      <Opt id="size" label={tr('Taille', 'Size')} reset={r('width', 'height')} resetTitle={rt} hint={tr('Choisissez la même taille que la page de votre rapport Power BI.', 'Pick the same size as your Power BI report page.')}>
        <select value={`${cfg.width}x${cfg.height}`} onChange={(e) => { const [w, h] = e.target.value.split('x').map(Number); set({ width: w, height: h }) }}>
          {SIZES.map((z) => <option key={z.label} value={`${z.w}x${z.h}`}>{z.label}</option>)}
        </select>
      </Opt>
      <Opt id="margin" label={tr('Marge autour du contenu', 'Margin around content')} aside={<span className="val">{cfg.margin} px</span>} reset={r('margin')} resetTitle={rt}>
        <input type="range" min={8} max={48} value={cfg.margin} onChange={(e) => set({ margin: +e.target.value })} />
      </Opt>
      <Opt id="density" label={tr('Espace entre les cartes', 'Space between cards')} reset={r('density')} resetTitle={rt}>
        <Seg value={cfg.density} def={DEFAULT_CONFIG.density} onChange={(density) => set({ density })} options={[{ v: 'comfortable', label: tr('Large', 'Wide') }, { v: 'balanced', label: tr('Moyen', 'Medium') }, { v: 'dense', label: tr('Serré', 'Tight') }]} />
      </Opt>
    </>
  )
}

/* ---------- Couleurs ---------- */

const SUGGESTED = ['ember', 'sun', 'navy', 'ocean', 'forest', 'mono']

export function ColorsPanel(p: PanelProps) {
  const { tr, cfg, set, r, rt } = useKit(p)
  const [all, setAll] = useState(false)
  const [by, setBy] = useState<'industry' | 'feeling' | 'tone'>('industry')
  const [val, setVal] = useState('all')
  const [brand, setBrand] = useState(cfg.colors[0])
  const [busy, setBusy] = useState(false)
  const pick = (id: string, colors: string[]) => {
    set({ paletteId: id, colors })
  }
  const groups = by === 'industry' ? INDUSTRIES : by === 'feeling' ? FEELINGS : TONES
  const list = all ? PALETTES.filter((x) => val === 'all' || x[by] === val) : PALETTES.filter((x) => SUGGESTED.includes(x.id))
  const onImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setBusy(true)
    try {
      pick('image', await paletteFromImage(f))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PanelHead title={tr('Couleurs', 'Colors')} desc={tr('Les couleurs de vos graphiques Power BI, de la navigation et du fond.', 'Colors of your Power BI charts, the navigation and the background.')} />
      <Opt id="palette" label={all ? tr('Toutes les palettes', 'All palettes') : tr('Palettes suggérées', 'Suggested palettes')} reset={r('paletteId', 'colors')} resetTitle={rt}>
        {all && (
          <div className="filters">
            <Seg value={by} onChange={(v) => { setBy(v); setVal('all') }} options={[{ v: 'industry', label: tr('Secteur', 'Industry') }, { v: 'feeling', label: tr('Ressenti', 'Feeling') }, { v: 'tone', label: tr('Ton', 'Tone') }]} />
            <div className="chips">
              <button className={val === 'all' ? 'on' : ''} onClick={() => setVal('all')}>{tr('Toutes', 'All')}</button>
              {groups.map((g) => <button key={g.id} className={val === g.id ? 'on' : ''} onClick={() => setVal(g.id)}>{g[p.lang]}</button>)}
            </div>
          </div>
        )}
        <div className="palettes">
          {list.map((x) => (
            <button key={x.id} className={`pal${cfg.paletteId === x.id ? ' on' : ''}`} aria-pressed={cfg.paletteId === x.id} onClick={() => pick(x.id, x.colors)}>
              <span className="sw">{x.colors.slice(0, 5).map((c) => <i key={c} style={{ background: c }} />)}</span>
              <span>{x.name[p.lang]}{x.id === DEFAULT_CONFIG.paletteId && <i className="def-dot" aria-hidden="true" />}</span>
            </button>
          ))}
        </div>
        <button className="link" onClick={() => setAll(!all)}>{all ? tr('Voir les suggestions', 'Show suggestions') : tr(`Voir les ${PALETTES.length} palettes`, `See all ${PALETTES.length} palettes`)}</button>
      </Opt>
      <Opt id="brand" label={tr('Partir de ma couleur de marque', 'Start from my brand color')} hint={tr('Crée une palette complète autour de cette couleur.', 'Builds a full palette around this color.')}>
        <div className="row">
          <label className="color-field">
            <input type="color" aria-label={tr('Couleur de marque', 'Brand color')} value={brand} onChange={(e) => setBrand(e.target.value)} />
            <span>{brand.toUpperCase()}</span>
          </label>
          <button className="btn" onClick={() => pick('brand', paletteFromAccent(brand))}>{tr('Générer', 'Generate')}</button>
        </div>
      </Opt>
      <Opt id="imagePalette" label={tr('Ou depuis une image (logo, charte)', 'Or from an image (logo, brand guide)')}>
        <label className="btn file wide">{busy ? tr('Analyse…', 'Analyzing…') : tr('Choisir une image', 'Choose an image')}<input type="file" accept="image/*" onChange={onImage} /></label>
      </Opt>
      <Group title={tr('Réglage fin', 'Fine tuning')} />
      <Opt id="colors8" label={tr('Les 8 couleurs du thème', 'The 8 theme colors')} reset={r('paletteId', 'colors')} resetTitle={rt} hint={tr('La première est la couleur principale (boutons, page active). Les suivantes colorent les séries de vos graphiques, dans l\'ordre de Power BI.', 'The first is the main color (buttons, active page). The next ones color your chart series, in Power BI order.')}>
        <div className="slots">
          {cfg.colors.map((c, i) => (
            <label key={i} className="slot" style={{ background: c }} title={c}>
              <input type="color" aria-label={`${tr('Couleur', 'Color')} ${i + 1}`} value={c} onChange={(e) => set({ paletteId: 'custom', colors: cfg.colors.map((x, k) => (k === i ? e.target.value : x)) })} />
            </label>
          ))}
        </div>
      </Opt>
      <Opt id="mode" label={tr('Fond du rapport', 'Report background')} reset={r('mode')} resetTitle={rt}>
        <Seg value={cfg.mode} def={DEFAULT_CONFIG.mode} onChange={(mode) => set({ mode })} options={[{ v: 'light', label: tr('Clair', 'Light') }, { v: 'dark', label: tr('Sombre', 'Dark') }]} />
      </Opt>
      {cfg.mode === 'light' && (
        <Opt id="pageBg" label={tr('Teinte du fond clair', 'Light background shade')} reset={r('pageBg')} resetTitle={rt}>
          <Seg value={cfg.pageBg} def={DEFAULT_CONFIG.pageBg} onChange={(pageBg) => set({ pageBg })} options={[{ v: 'soft', label: tr('Gris doux', 'Soft grey') }, { v: 'plain', label: tr('Blanc', 'White') }, { v: 'warm', label: tr('Ivoire', 'Ivory') }]} />
        </Opt>
      )}
    </>
  )
}

/* ---------- Navigation ---------- */

export function NavPanel(p: PanelProps) {
  const { tr, cfg, set, r, rt } = useKit(p)
  const names = navNames(p.lang)
  const pages = p.project.pages
  const list = ['sidebar', 'floating', 'rail', 'toprail', 'filter'].includes(cfg.navFrame)
  const panel = ['sidebar', 'floating', 'filter'].includes(cfg.navFrame)
  return (
    <>
      <PanelHead title={tr('Navigation', 'Navigation')} desc={tr('La barre qui permet de passer d\'une page à l\'autre du rapport.', 'The bar used to move between report pages.')} />
      <Opt id="frame" label={tr('Forme', 'Shape')} reset={r('navFrame')} resetTitle={rt}>
        <div className="cards three">
          {NAV_FRAMES.map((f) => (
            <Card key={f} selected={cfg.navFrame === f} onClick={() => set({ navFrame: f })} thumb={<NavThumb frame={f} />} label={names[f]} isDefault={f === DEFAULT_CONFIG.navFrame} />
          ))}
        </div>
      </Opt>
      {cfg.navFrame !== 'none' && (
        <>
          <Group title={tr('Couleurs de la barre', 'Bar colors')} />
          <Opt id="tone" label={tr('Fond', 'Background')} reset={r('navTone')} resetTitle={rt}>
            <Seg value={cfg.navTone} def={DEFAULT_CONFIG.navTone} onChange={(navTone) => set({ navTone })} options={[{ v: 'navy', label: tr('Marine', 'Navy') }, { v: 'brand', label: tr('Foncé', 'Dark') }, { v: 'color', label: tr('Couleur', 'Color') }, { v: 'tint', label: tr('Clair', 'Light') }, { v: 'paper', label: tr('Blanc', 'White') }]} />
          </Opt>
          <Opt id="fill" label={tr('Effet', 'Effect')} reset={r('navFill')} resetTitle={rt}>
            <Seg value={cfg.navFill} def={DEFAULT_CONFIG.navFill} onChange={(navFill) => set({ navFill })} options={[{ v: 'solid', label: tr('Uni', 'Solid') }, { v: 'gradient', label: tr('Dégradé', 'Gradient') }]} />
          </Opt>
          <Opt id="ink" label={tr('Couleur du texte et des icônes', 'Text and icon color')} reset={r('navInk')} resetTitle={rt}>
            <Seg value={cfg.navInk} def={DEFAULT_CONFIG.navInk} onChange={(navInk) => set({ navInk })} options={[{ v: 'auto', label: tr('Contrasté', 'Contrasted') }, { v: 'accent', label: tr('Couleur principale', 'Main color') }, { v: 'mono', label: tr('Atténué', 'Muted') }]} />
          </Opt>
          {panel && cfg.navTone === 'navy' && <Switch id="decor" checked={cfg.navDecor} onChange={(navDecor) => set({ navDecor })} label={tr('Vague décorative en bas de la barre', 'Decorative wave at the bottom of the bar')} reset={r('navDecor')} resetTitle={rt} />}

          <Group title={tr('Boutons des pages', 'Page buttons')} />
          <Opt id="active" label={tr('Page affichée', 'Current page')} reset={r('navActive')} resetTitle={rt} hint={tr('Comment le bouton de la page affichée se distingue des autres.', 'How the current page button stands out.')}>
            <Seg value={cfg.navActive} def={DEFAULT_CONFIG.navActive} onChange={(navActive) => set({ navActive })} options={[{ v: 'accent', label: tr('Fond coloré', 'Colored') }, { v: 'fill', label: tr('Fond léger', 'Subtle') }, { v: 'edge', label: tr('Trait', 'Bar') }]} />
          </Opt>
          <Opt id="corners" label={tr('Arrondi des boutons', 'Button roundness')} reset={r('tabCorner')} resetTitle={rt}>
            <Seg value={cfg.tabCorner} def={DEFAULT_CONFIG.tabCorner} onChange={(tabCorner) => set({ tabCorner })} options={[{ v: 'sm', label: tr('Petit', 'Small') }, { v: 'md', label: tr('Moyen', 'Medium') }, { v: 'lg', label: tr('Grand', 'Large') }, { v: 'round', label: tr('Pilule', 'Pill') }]} />
          </Opt>
          {list && (
            <Opt id="position" label={tr('Position verticale', 'Vertical position')} reset={r('navPos')} resetTitle={rt}>
              <Seg value={cfg.navPos} def={DEFAULT_CONFIG.navPos} onChange={(navPos) => set({ navPos })} options={[{ v: 'top', label: tr('En haut', 'Top') }, { v: 'middle', label: tr('Au milieu', 'Middle') }, { v: 'bottom', label: tr('En bas', 'Bottom') }]} />
            </Opt>
          )}
          <Switch id="labels" checked={cfg.navLabels === 'fixed'} onChange={(v) => set({ navLabels: v ? 'fixed' : 'powerbi' })} label={tr('Écrire le nom des pages', 'Write page names')} reset={r('navLabels')} resetTitle={rt} />
          <p className="panel-note">{tr('Désactivez si vous posez des boutons de navigation Power BI par-dessus : leurs textes suivront vos vrais noms de page.', 'Turn off if you place Power BI navigation buttons on top: their text will follow your real page names.')}</p>
          {cfg.navFrame === 'filter' && (
            <Opt id="slots" label={tr('Nombre de cases de filtre', 'Number of filter boxes')} reset={r('filterSlots')} resetTitle={rt}>
              <Seg value={cfg.filterSlots} def={DEFAULT_CONFIG.filterSlots} onChange={(filterSlots) => set({ filterSlots })} options={[2, 3, 4, 5].map((n) => ({ v: n, label: String(n) }))} />
            </Opt>
          )}

          <Group title={tr('Icônes des pages', 'Page icons')} />
          <Switch id="icons" checked={cfg.navIcons} onChange={(navIcons) => set({ navIcons })} label={tr('Afficher une icône par page', 'Show an icon per page')} reset={r('navIcons')} resetTitle={rt} />
          {cfg.navIcons && (
            <>
              <Opt id="pageIcons" label={tr('Icône de chaque page', 'Icon of each page')}>
                <div className="page-icons">
                  {pages.map((pg, i) => pg.kind === 'content' && (
                    <div key={pg.id} className="page-icon-row">
                      <span>{pg.name}</span>
                      <button className="icon-pick" title={tr('Changer l\'icône', 'Change icon')} onClick={() => p.onMedia('icon', (pick) => pick.kind === 'icon' && p.dispatch({ t: 'pagePatch', index: i, patch: { icon: pick.name } }))}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[pageIcon(pg, i)]} /></svg>
                      </button>
                      {pg.icon && <button className="link" onClick={() => p.dispatch({ t: 'pagePatch', index: i, patch: { icon: null } })}>{tr('Auto', 'Auto')}</button>}
                    </div>
                  ))}
                </div>
              </Opt>
              <More open={p.more} onToggle={p.toggleMore} label={tr('Style des icônes', 'Icon style')}>
                <Opt id="iconStyle" label={tr('Dessin', 'Drawing')} reset={r('iconStyle')} resetTitle={rt}>
                  <Seg value={cfg.iconStyle} def={DEFAULT_CONFIG.iconStyle} onChange={(iconStyle) => set({ iconStyle })} options={[{ v: 'outline', label: tr('Contour', 'Outline') }, { v: 'duotone', label: tr('Contour et remplissage', 'Outline and fill') }]} />
                </Opt>
                <Opt id="iconWeight" label={tr('Épaisseur du trait', 'Stroke weight')} reset={r('iconWeight')} resetTitle={rt}>
                  <Seg value={cfg.iconWeight} def={DEFAULT_CONFIG.iconWeight} onChange={(iconWeight) => set({ iconWeight })} options={[{ v: 'thin', label: tr('Fine', 'Thin') }, { v: 'regular', label: tr('Normale', 'Regular') }, { v: 'bold', label: tr('Épaisse', 'Bold') }]} />
                </Opt>
                <Opt id="iconBacking" label={tr('Pastille derrière l\'icône', 'Badge behind the icon')} reset={r('iconBacking')} resetTitle={rt}>
                  <Seg value={cfg.iconBacking} def={DEFAULT_CONFIG.iconBacking} onChange={(iconBacking) => set({ iconBacking })} options={[{ v: 'none', label: tr('Aucune', 'None') }, { v: 'square', label: tr('Carrée', 'Square') }, { v: 'circle', label: tr('Ronde', 'Round') }]} />
                </Opt>
              </More>
            </>
          )}
        </>
      )}
    </>
  )
}

/* ---------- Cartes ---------- */

export function LayoutPanel(p: PanelProps) {
  const { tr, cfg, set, r, rt } = useKit(p)
  const toggleHide = (type: ElementType, shown: boolean) => set({ hide: shown ? cfg.hide.filter((x) => x !== type) : [...cfg.hide, type] })
  return (
    <>
      <PanelHead title={tr('Cartes', 'Cards')} desc={tr('Les cadres derrière vos visuels Power BI : forme, couleur, relief.', 'The frames behind your Power BI visuals: shape, color, depth.')} />
      <Group title={tr('Forme', 'Shape')} />
      <Opt id="radius" label={tr('Arrondi des coins', 'Corner roundness')} aside={<span className="val">{cfg.radius} px</span>} reset={r('radius')} resetTitle={rt}>
        <input type="range" min={0} max={24} value={cfg.radius} onChange={(e) => set({ radius: +e.target.value })} />
      </Opt>
      <Opt id="cardStyle" label={tr('En-tête de carte', 'Card header')} reset={r('cardStyle')} resetTitle={rt} hint={tr('Bandeau : une bande colorée en haut de chaque carte. Repère : un petit trait coloré.', 'Band: a colored strip on top of each card. Tick: a small colored line.')}>
        <Seg value={cfg.cardStyle} def={DEFAULT_CONFIG.cardStyle} onChange={(cardStyle) => set({ cardStyle })} options={[{ v: 'plain', label: tr('Aucun', 'None') }, { v: 'band', label: tr('Bandeau', 'Band') }, { v: 'tick', label: tr('Repère', 'Tick') }]} />
      </Opt>
      <Group title={tr('Apparence', 'Look')} />
      <Opt id="cardColor" label={tr('Fond des cartes', 'Card background')} reset={r('cardColor')} resetTitle={rt}>
        <Seg value={cfg.cardColor} def={DEFAULT_CONFIG.cardColor} onChange={(cardColor) => set({ cardColor })} options={[{ v: 'paper', label: tr('Blanc', 'White') }, { v: 'tint', label: tr('Teinté', 'Tinted') }, { v: 'color', label: tr('Coloré', 'Colored') }, { v: 'nav', label: tr('Comme la barre', 'Like the bar') }]} />
      </Opt>
      <Switch id="shadow" checked={cfg.shadow} onChange={(shadow) => set({ shadow })} label={tr('Ombre portée', 'Drop shadow')} reset={r('shadow')} resetTitle={rt} />
      <Opt id="texture" label={tr('Motif dans les cartes', 'Pattern in cards')} reset={r('texture')} resetTitle={rt}>
        <Seg value={cfg.texture} def={DEFAULT_CONFIG.texture} onChange={(texture) => set({ texture })} options={[{ v: 'none', label: tr('Aucun', 'None') }, { v: 'glow', label: tr('Halo coloré', 'Glow') }, { v: 'dots', label: tr('Points', 'Dots') }]} />
      </Opt>
      <Opt id="cardSize" label={tr('Taille du texte des visuels', 'Visual text size')} aside={<span className="val">{cfg.cardSize} px</span>} reset={r('cardSize')} resetTitle={rt} hint={tr('Utilisée par le thème Power BI pour les titres et étiquettes des visuels.', 'Used by the Power BI theme for visual titles and labels.')}>
        <input type="range" min={10} max={20} value={cfg.cardSize} onChange={(e) => set({ cardSize: +e.target.value })} />
      </Opt>
      <Group title={tr('Contenu de l\'aperçu', 'Preview content')} />
      <Opt id="visible" label={tr('Cartes affichées', 'Cards shown')} reset={r('hide')} resetTitle={rt}>
        <div className="checks">
          {([['kpi', tr('KPI', 'KPIs')], ['chart', tr('Graphiques', 'Charts')], ['table', tr('Tableaux', 'Tables')]] as const).map(([k, label]) => (
            <label key={k}><input type="checkbox" checked={!cfg.hide.includes(k)} onChange={(e) => toggleHide(k, e.target.checked)} />{label}</label>
          ))}
        </div>
      </Opt>
      <Switch id="labelZones" checked={cfg.labelZones} onChange={(labelZones) => set({ labelZones })} label={tr('Plan simple : le nom de chaque zone au lieu des exemples', 'Simple plan: each zone name instead of samples')} reset={r('labelZones')} resetTitle={rt} />
      <p className="panel-note">{tr('Le nom (« Graphique », « Tableau »…) est aussi écrit dans le fond exporté.', 'The name ("Chart", "Table"…) is also written in the exported background.')}</p>
    </>
  )
}

/* ---------- Textes ---------- */

export function TextPanel(p: PanelProps) {
  const { tr, cfg, set, r, rt } = useKit(p)
  const onLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) set({ logoKind: 'upload', logoImage: await imageToDataUrl(f, 512, true) })
  }
  const field = (id: string, key: 'title' | 'subtitle' | 'company' | 'userName' | 'userRole' | 'footer' | 'linkedin' | 'website', label: string, hint?: string) => (
    <Opt id={id} label={label} hint={hint} reset={r(key)} resetTitle={rt}>
      <input type="text" value={cfg[key]} onChange={(e) => set({ [key]: e.target.value })} />
    </Opt>
  )
  const size = (id: string, key: 'titleSize' | 'textSize', label: string, min: number, max: number) => (
    <Opt id={id} label={label} aside={<span className="val">{cfg[key]} px</span>} reset={r(key)} resetTitle={rt}>
      <input type="range" min={min} max={max} value={cfg[key]} onChange={(e) => set({ [key]: +e.target.value })} />
    </Opt>
  )
  const nav = cfg.navFrame !== 'none'
  return (
    <>
      <PanelHead title={tr('Textes', 'Text')} desc={tr('Le titre des pages, les noms affichés et la police.', 'Page title, displayed names and font.')} />
      <Group title={tr('Titre des pages', 'Page title')} />
      <Switch id="showTitle" checked={cfg.showHeader} onChange={(showHeader) => set({ showHeader })} label={tr('Afficher le titre', 'Show the title')} reset={r('showHeader')} resetTitle={rt} />
      {cfg.showHeader && (
        <>
          {field('title', 'title', tr('Titre', 'Title'), tr('Mettez un mot entre *astérisques* pour l\'écrire dans la couleur principale.', 'Put a word between *asterisks* to write it in the main color.'))}
          {field('subtitle', 'subtitle', tr('Sous-titre', 'Subtitle'))}
          {size('titleSize', 'titleSize', tr('Taille du titre', 'Title size'), 16, 56)}
          <Switch id="band" checked={cfg.headerBand} onChange={(headerBand) => set({ headerBand })} label={tr('Titre sur un bandeau coloré', 'Title on a colored band')} reset={r('headerBand')} resetTitle={rt} />
        </>
      )}
      {nav && (
        <>
          <Group title={tr('Dans la navigation', 'In the navigation')} />
          {field('company', 'company', tr('Nom à côté du logo', 'Name next to the logo'), tr('Visible avec les formes Barre latérale, Panneau flottant et Panneau de filtres.', 'Shown with the Sidebar, Floating and Filter panel shapes.'))}
          <Opt id="logo" label={tr('Logo', 'Logo')} reset={r('logoKind', 'logoIcon', 'logoImage')} resetTitle={rt}>
            <Seg value={cfg.logoKind} def={DEFAULT_CONFIG.logoKind} onChange={(logoKind) => set({ logoKind })} options={[{ v: 'bolt', label: tr('Éclair', 'Bolt') }, { v: 'letter', label: tr('Initiale', 'Initial') }, { v: 'icon', label: tr('Icône', 'Icon') }, { v: 'upload', label: tr('Image', 'Image') }, { v: 'slot', label: tr('Aucun', 'None') }]} />
            {cfg.logoKind === 'icon' && <button className="btn" style={{ marginTop: 8 }} onClick={() => p.onMedia('icon', (pick) => pick.kind === 'icon' && set({ logoIcon: pick.name }))}><Icon name="star" size={14} /> {tr('Choisir l\'icône', 'Choose the icon')}</button>}
            {cfg.logoKind === 'upload' && (
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => p.onMedia('image-only', (pick) => pick.kind === 'image' && set({ logoImage: pick.src }))}><Icon name="image" size={14} /> {tr('Depuis ma bibliothèque', 'From my library')}</button>
                <label className="btn file">{tr('Depuis l\'ordinateur', 'From computer')}<input type="file" accept="image/*" onChange={onLogo} /></label>
              </div>
            )}
          </Opt>
          {['sidebar', 'floating'].includes(cfg.navFrame) && (
            <>
              <Switch id="user" checked={cfg.navUser} onChange={(navUser) => set({ navUser })} label={tr('Afficher l\'utilisateur en bas de la barre', 'Show the user at the bottom of the bar')} reset={r('navUser')} resetTitle={rt} />
              {cfg.navUser && (
                <>
                  {field('userName', 'userName', tr('Nom de l\'utilisateur', 'User name'))}
                  {field('userRole', 'userRole', tr('Fonction', 'Job title'))}
                </>
              )}
            </>
          )}
        </>
      )}
      <Group title={tr('Bas de page', 'Page footer')} />
      {field('footer', 'footer', tr('Texte en bas à gauche', 'Text at the bottom left'), tr('Par exemple la source des données. Laissez vide pour ne rien afficher.', 'For example the data source. Leave empty to show nothing.'))}
      {field('linkedin', 'linkedin', 'LinkedIn')}
      {field('website', 'website', tr('Site web', 'Website'))}
      <Group title={tr('Police', 'Font')} />
      <Opt id="font" label={tr('Police du rapport', 'Report font')} reset={r('font')} resetTitle={rt} hint={tr('Choisissez une police installée sur les postes qui ouvriront le rapport.', 'Pick a font installed on the computers that will open the report.')}>
        <select value={cfg.font} style={{ fontFamily: cfg.font }} onChange={(e) => set({ font: e.target.value })}>{FONTS.map((f) => <option key={f} style={{ fontFamily: f }}>{f}</option>)}</select>
      </Opt>
      {size('textSize', 'textSize', tr('Taille du texte (navigation, sous-titre)', 'Text size (navigation, subtitle)'), 10, 22)}
    </>
  )
}

/* ---------- Medias : images et icones a ajouter sur la page ---------- */

export function MediaPanel(p: PanelProps) {
  const tr = (fr: string, en: string) => (p.lang === 'fr' ? fr : en)
  const [media, setMedia] = useState<MediaItem[] | null>(null)
  const [set, setSet] = useState('general')
  const isMenu = p.project.pages[p.project.active].kind === 'menu'

  const reload = () => p.store.listMedia().then(setMedia).catch(() => setMedia([]))
  useEffect(() => {
    void reload()
  }, [p.store]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PanelHead title={tr('Médias', 'Media')} desc={tr('Images et icônes à ajouter sur la page : cliquez pour les poser à la première place libre.', 'Images and icons to add to the page: click to place them in the first free spot.')} />
      {isMenu && <p className="panel-note">{tr('Sélectionnez une page de contenu pour y ajouter des médias.', 'Select a content page to add media.')}</p>}
      <Group title={tr('Mes images', 'My images')} />
      <div className="media-mini">
        <button className="media-add" disabled={isMenu} onClick={() => p.onMedia('image', (pick) => { void reload(); return pick.kind === 'image' ? p.onInsert('image', { src: pick.src, fit: 'contain' }) : p.onInsert('icon', { icon: pick.name }) })}>
          <Icon name="upload" size={18} />
          <span>{tr('Importer ou parcourir', 'Import or browse')}</span>
        </button>
        {media?.slice(0, 8).map((m) => (
          <button key={m.id} className="media-thumb" disabled={isMenu} title={m.name} onClick={() => p.onInsert('image', { src: m.dataUrl, fit: 'contain' })}>
            <img src={m.dataUrl} alt={m.name} />
          </button>
        ))}
      </div>
      <Group title={tr('Icônes', 'Icons')} />
      <select value={set} onChange={(e) => setSet(e.target.value)} aria-label={tr('Thème des icônes', 'Icon theme')}>
        {ICON_SETS.map((s) => <option key={s.id} value={s.id}>{s[p.lang]}</option>)}
      </select>
      <div className="icon-mini">
        {(ICON_SETS.find((s) => s.id === set)?.icons ?? []).map((n) => (
          <button key={n} disabled={isMenu} title={n} aria-label={n} onClick={() => p.onInsert('icon', { icon: n })}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[n]} /></svg>
          </button>
        ))}
      </div>
      <button className="link" onClick={() => p.onMedia('icon', (pick) => (pick.kind === 'icon' ? p.onInsert('icon', { icon: pick.name }) : p.onInsert('image', { src: pick.src, fit: 'contain' })))}>{tr('Voir toutes les icônes et chercher', 'See all icons and search')}</button>
    </>
  )
}
