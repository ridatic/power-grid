import { useState, type ChangeEvent } from 'react'
import type { Config, ElementType, MenuConfig, Project } from '../core/types'
import type { Action } from '../store'
import { MAX_PAGES } from '../store'
import { FEELINGS, FONTS, INDUSTRIES, PALETTES, TONES, paletteFromAccent, paletteFromImage } from '../core/palettes'
import { ICON_NAMES } from '../core/icons'
import { NAV_FRAMES, pageIcon } from '../core/nav'
import { TEMPLATES, type Template } from '../core/layouts'
import { Check, Choice, Field, Radios, Section } from './ui'
import { MenuThumb, NavThumb } from './thumbs'
import type { Lang } from '../i18n'

interface Props {
  project: Project
  dispatch: (a: Action) => void
  lang: Lang
  templateId: string | null
  onTemplate: (tpl: Template) => void
  onRemovePage: (index: number) => void
  notify: (msg: string) => void
}

const SIZES = [
  { w: 1920, h: 1080, label: '16:9 · 1920 × 1080' },
  { w: 1280, h: 720, label: '16:9 · 1280 × 720' },
  { w: 1440, h: 900, label: '16:10 · 1440 × 900' },
  { w: 1920, h: 1280, label: '3:2 · 1920 × 1280' },
  { w: 960, h: 720, label: '4:3 · 960 × 720' },
]

const swatchBg = (c: string[]) => `linear-gradient(135deg, ${c[0]} 0 48%, ${c[1]} 48% 74%, ${c[2]} 74%)`

/** Lit une image, la reduit et la renvoie en data URL (le PNG garde la transparence pour les logos). */
function imageToDataUrl(file: File, maxSide: number, keepAlpha: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * k)
      canvas.height = Math.round(img.height * k)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(keepAlpha ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.86))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image'))
    }
    img.src = url
  })
}

export function Options({ project, dispatch, lang, templateId, onTemplate, onRemovePage, notify }: Props) {
  const { cfg, pages } = project
  const [open, setOpen] = useState('nav')
  const [by, setBy] = useState<'industry' | 'feeling' | 'tone'>('industry')
  const [val, setVal] = useState<string>('all')
  const [brand, setBrand] = useState(cfg.colors[0])
  const [busy, setBusy] = useState(false)
  const tr = (fr: string, en: string) => (lang === 'fr' ? fr : en)
  const toggle = (id: string) => setOpen(open === id ? '' : id)
  const set = (patch: Partial<Config>) => dispatch({ t: 'cfg', patch })
  const setMenu = (patch: Partial<MenuConfig>) => set({ menu: { ...cfg.menu, ...patch } })
  const menuIndex = pages.findIndex((p) => p.kind === 'menu')
  const activeIsMenu = pages[project.active].kind === 'menu'
  const hasListNav = ['sidebar', 'floating', 'rail', 'toprail', 'filter'].includes(cfg.navFrame)
  const contentPages = pages.map((p, i) => ({ p, i })).filter(({ p }) => p.kind === 'content')

  const groups = by === 'industry' ? INDUSTRIES : by === 'feeling' ? FEELINGS : TONES
  const shown = PALETTES.filter((p) => val === 'all' || p[by] === val)
  const paletteName = PALETTES.find((p) => p.id === cfg.paletteId)?.name[lang] ?? (cfg.paletteId === 'image' ? tr('Depuis une image', 'From an image') : cfg.paletteId === 'brand' ? tr('Couleur de marque', 'Brand color') : tr('Personnalisée', 'Custom'))
  const navName = {
    sidebar: tr('Barre latérale', 'Sidebar'), floating: tr('Panneau flottant', 'Floating panel'), rail: tr('Rail d\'icônes', 'Icon rail'),
    toprail: tr('Haut + rail', 'Top + rail'), tabs: tr('Onglets', 'Top tabs'), notch: tr('Onglet encoché', 'Notch tabs'),
    folder: tr('Onglets dossier', 'Folder tabs'), filter: tr('Panneau de filtres', 'Filter panel'), capsule: tr('Capsule', 'Capsule'), none: tr('Aucune', 'None'),
  }

  const pickColors = (id: string, colors: string[]) => {
    set({ paletteId: id, colors })
    notify(tr('Palette mise à jour', 'Palette updated'))
  }
  const setColor = (i: number, hex: string) => set({ paletteId: 'custom', colors: cfg.colors.map((c, k) => (k === i ? hex : c)) })
  const toggleHide = (type: ElementType, shown: boolean) => set({ hide: shown ? cfg.hide.filter((x) => x !== type) : [...cfg.hide, type] })

  const onImagePalette = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setBusy(true)
    try {
      pickColors('image', await paletteFromImage(f))
    } finally {
      setBusy(false)
    }
  }
  const onMenuImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) setMenu({ image: await imageToDataUrl(f, 1800, false) })
  }
  const onLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) set({ logoKind: 'upload', logoImage: await imageToDataUrl(f, 512, true) })
  }
  const onTheme = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const json = JSON.parse(await f.text()) as unknown
      if (typeof json === 'object' && json !== null && !Array.isArray(json)) set({ extraTheme: json as Record<string, unknown>, extraThemeName: f.name })
    } catch {
      window.alert(tr('Ce fichier n\'est pas un JSON valide.', 'This file is not valid JSON.'))
    }
  }
  const onLabels = (value: string) => {
    const names = value.split(',').map((x) => x.trim())
    contentPages.forEach(({ i }, k) => names[k] && dispatch({ t: 'pagePatch', index: i, patch: { name: names[k] } }))
  }

  const slider = (key: 'textSize' | 'titleSize' | 'cardSize', label: string, min: number, max: number) => (
    <Field label={`${label} : ${cfg[key]}`}>
      <input className="field" type="range" min={min} max={max} value={cfg[key]} onChange={(e) => set({ [key]: +e.target.value })} />
    </Field>
  )

  return (
    <div className="panel-scroll">
      <Section id="format" icon="▣" title={tr('Format', 'Format')} summary={`${cfg.width} × ${cfg.height}`} open={open === 'format'} onToggle={toggle}>
        <Field label={tr('Format du canevas', 'Canvas format')}>
          <select className="select" value={`${cfg.width}x${cfg.height}`} onChange={(e) => { const [w, h] = e.target.value.split('x').map(Number); set({ width: w, height: h }) }}>
            {SIZES.map((z) => <option key={z.label} value={`${z.w}x${z.h}`}>{z.label}</option>)}
          </select>
        </Field>
        <Field label={tr('Marge intérieure', 'Inner margin')}>
          <input className="field" type="range" min={8} max={36} value={cfg.margin} onChange={(e) => set({ margin: +e.target.value })} />
        </Field>
        <Field label={tr('Mode', 'Mode')}>
          <Radios value={cfg.mode} onChange={(mode) => set({ mode })} options={[{ v: 'light', label: tr('Clair', 'Light') }, { v: 'dark', label: tr('Sombre', 'Dark') }]} />
        </Field>
      </Section>

      <Section id="colors" icon="◉" title={tr('Couleurs', 'Colors')} summary={paletteName} open={open === 'colors'} onToggle={toggle}>
        <Field label={tr('Trouver une palette', 'Find a palette')}>
          <div className="two">
            <select className="select" value={by} onChange={(e) => { setBy(e.target.value as typeof by); setVal('all') }}>
              <option value="industry">{tr('Par secteur', 'By industry')}</option>
              <option value="feeling">{tr('Par ressenti', 'By feeling')}</option>
              <option value="tone">{tr('Par ton', 'By tone')}</option>
            </select>
            <select className="select" value={val} onChange={(e) => setVal(e.target.value)}>
              <option value="all">{tr('Toutes', 'All')}</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g[lang]}</option>)}
            </select>
          </div>
        </Field>
        <Field label={tr('Palette', 'Palette')}>
          <div className="color-row">
            {shown.map((p) => (
              <button key={p.id} className={`swatch${cfg.paletteId === p.id ? ' active' : ''}`} title={p.name[lang]} aria-label={p.name[lang]} aria-pressed={cfg.paletteId === p.id} style={{ background: swatchBg(p.colors) }} onClick={() => pickColors(p.id, p.colors)} />
            ))}
          </div>
        </Field>
        <Field label={tr('Style de fond', 'Background style')}>
          <select className="select" value={cfg.pageBg} onChange={(e) => set({ pageBg: e.target.value as Config['pageBg'] })}>
            <option value="soft">{tr('Dégradé subtil', 'Subtle')}</option>
            <option value="plain">{tr('Blanc pur', 'Pure white')}</option>
            <option value="warm">{tr('Ivoire chaud', 'Warm ivory')}</option>
          </select>
        </Field>
        <Field label={tr('Partir de ma couleur de marque', 'Start from my brand color')}>
          <div className="two">
            <input className="field color" type="color" aria-label={tr('Couleur de marque', 'Brand color')} value={brand} onChange={(e) => setBrand(e.target.value)} />
            <button className="btn" onClick={() => pickColors('brand', paletteFromAccent(brand))}>{tr('Générer', 'Generate')}</button>
          </div>
        </Field>
        <Field label={tr('Ou depuis une image', 'Or from an image')}>
          <label className="btn file wide">
            {busy ? tr('Analyse...', 'Analyzing...') : tr('Choisir une image', 'Choose an image')}
            <input type="file" accept="image/*" onChange={onImagePalette} />
          </label>
        </Field>
        <Field label={tr('Les 8 couleurs du thème', 'The 8 theme colors')} hint={tr('Cliquez une couleur pour la modifier. Même ordre que dans Power BI.', 'Click a color to edit it. Same order as in Power BI.')}>
          <div className="color-row">
            {cfg.colors.map((c, i) => (
              <label key={i} className="swatch edit" style={{ background: c }} title={c}>
                <input type="color" aria-label={`${tr('Couleur', 'Color')} ${i + 1}`} value={c} onChange={(e) => setColor(i, e.target.value)} />
              </label>
            ))}
          </div>
        </Field>
      </Section>

      <Section id="nav" icon="◈" title={tr('Navigation', 'Navigation')} summary={navName[cfg.navFrame]} open={open === 'nav'} onToggle={toggle}>
        <div className="mini-grid" id="layouts">
          {NAV_FRAMES.map((f) => (
            <Choice key={f} selected={cfg.navFrame === f} diagram={<NavThumb frame={f} />} label={navName[f]} onClick={() => { set({ navFrame: f }); notify(tr('Navigation : ', 'Navigation: ') + navName[f]) }} />
          ))}
        </div>
        {cfg.navFrame !== 'none' && (
          <>
            <Field label={tr('Style de navigation', 'Navigation style')}>
              <Radios value={cfg.navTone} onChange={(navTone) => set({ navTone })} options={[{ v: 'navy', label: tr('Marine', 'Navy') }, { v: 'brand', label: tr('Marque', 'Brand') }, { v: 'color', label: tr('Couleur', 'Color') }, { v: 'tint', label: tr('Teinte', 'Tint') }, { v: 'paper', label: tr('Papier', 'Paper') }]} />
            </Field>
            <Field label={tr('Remplissage', 'Fill')}>
              <Radios value={cfg.navFill} onChange={(navFill) => set({ navFill })} options={[{ v: 'solid', label: tr('Uni', 'Solid') }, { v: 'gradient', label: tr('Dégradé', 'Gradient') }]} />
            </Field>
            <Field label={tr('Texte et icônes', 'Text and icons')}>
              <Radios value={cfg.navInk} onChange={(navInk) => set({ navInk })} options={[{ v: 'auto', label: 'Auto' }, { v: 'accent', label: tr('Accent', 'Accent') }, { v: 'mono', label: tr('Mono', 'Mono') }]} />
            </Field>
            <Field label={tr('Page active', 'Active page')}>
              <Radios value={cfg.navActive} onChange={(navActive) => set({ navActive })} options={[{ v: 'accent', label: tr('Doré plein', 'Accent fill') }, { v: 'fill', label: tr('Voile', 'Tinted') }, { v: 'edge', label: tr('Barre', 'Edge bar') }]} />
            </Field>
            <Field label={tr('Coins', 'Corners')}>
              <Radios value={cfg.tabCorner} onChange={(tabCorner) => set({ tabCorner })} options={[{ v: 'sm', label: tr('Petits', 'Small') }, { v: 'md', label: tr('Moyens', 'Medium') }, { v: 'lg', label: tr('Grands', 'Large') }, { v: 'round', label: tr('Ronds', 'Round') }]} />
            </Field>
            {hasListNav && (
              <Field label={tr('Position des boutons', 'Button position')}>
                <Radios value={cfg.navPos} onChange={(navPos) => set({ navPos })} options={[{ v: 'top', label: tr('Haut', 'Top') }, { v: 'middle', label: tr('Milieu', 'Middle') }, { v: 'bottom', label: tr('Bas', 'Bottom') }]} />
              </Field>
            )}
            {cfg.navFrame === 'filter' && (
              <Field label={tr('Segments du panneau', 'Panel slicers')}>
                <Radios value={cfg.filterSlots} onChange={(filterSlots) => set({ filterSlots })} options={[2, 3, 4, 5].map((n) => ({ v: n, label: String(n) }))} />
              </Field>
            )}
            <Field label={tr('Libellés des pages', 'Page labels')} hint={cfg.navLabels === 'fixed' ? tr('Dessinés dans le fond : à utiliser si vous ne posez pas de boutons.', 'Drawn in the background: use if you will not add buttons.') : tr('Laissés aux boutons Power BI : ils suivent les vrais noms de page.', 'Left to Power BI buttons: they follow your real page names.')}>
              <Radios value={cfg.navLabels} onChange={(navLabels) => set({ navLabels })} options={[{ v: 'fixed', label: tr('Fixes', 'Fixed') }, { v: 'powerbi', label: tr('Boutons Power BI', 'Power BI buttons') }]} />
            </Field>
            <Check checked={cfg.navIcons} onChange={(navIcons) => set({ navIcons })} label={tr('Afficher les icônes', 'Show icons')} />
            {cfg.navTone === 'navy' && ['sidebar', 'floating', 'filter'].includes(cfg.navFrame) && <Check checked={cfg.navDecor} onChange={(navDecor) => set({ navDecor })} label={tr('Motif doré en bas', 'Gold shape at the bottom')} />}
            {['sidebar', 'floating'].includes(cfg.navFrame) && <Check checked={cfg.navUser} onChange={(navUser) => set({ navUser })} label={tr('Afficher l\'utilisateur', 'Show the user')} />}
            {cfg.navIcons && (
              <>
                <Field label={tr('Style des icônes', 'Icon style')}>
                  <Radios value={cfg.iconStyle} onChange={(iconStyle) => set({ iconStyle })} options={[{ v: 'outline', label: tr('Contour', 'Outline') }, { v: 'duotone', label: 'Duotone' }]} />
                </Field>
                <Field label={tr('Épaisseur', 'Weight')}>
                  <Radios value={cfg.iconWeight} onChange={(iconWeight) => set({ iconWeight })} options={[{ v: 'thin', label: tr('Fine', 'Thin') }, { v: 'regular', label: tr('Normale', 'Regular') }, { v: 'bold', label: tr('Forte', 'Bold') }]} />
                </Field>
                <Field label={tr('Support', 'Backing')}>
                  <Radios value={cfg.iconBacking} onChange={(iconBacking) => set({ iconBacking })} options={[{ v: 'none', label: tr('Aucun', 'None') }, { v: 'square', label: tr('Carré', 'Square') }, { v: 'circle', label: tr('Rond', 'Circle') }]} />
                </Field>
              </>
            )}
          </>
        )}
      </Section>

      <Section id="pages" icon="▤" title={tr('Pages', 'Pages')} summary={`${pages.length} ${tr('pages', 'pages')}`} open={open === 'pages'} onToggle={toggle}>
        <Field label={tr('Pages du rapport', 'Report pages')}>
          <div className="page-list">
            {pages.map((p, i) => (
              <div key={p.id} className="page-row">
                <input className="field" type="text" aria-label={tr('Nom de la page', 'Page name')} value={p.name} onChange={(e) => dispatch({ t: 'pagePatch', index: i, patch: { name: e.target.value } })} />
                {p.kind === 'menu' ? (
                  <span className="tag">{tr('Menu', 'Menu')}</span>
                ) : (
                  <select className="select" aria-label={tr('Icône', 'Icon')} value={p.icon ?? ''} onChange={(e) => dispatch({ t: 'pagePatch', index: i, patch: { icon: e.target.value || null } })}>
                    <option value="">{tr('Auto', 'Auto')} · {pageIcon(p, i)}</option>
                    {ICON_NAMES.map((n) => <option key={n}>{n}</option>)}
                  </select>
                )}
                <button className="x" aria-label={tr('Supprimer la page', 'Delete page')} disabled={pages.length <= 1} onClick={() => onRemovePage(i)}>×</button>
              </div>
            ))}
          </div>
        </Field>
        <button className="btn wide" style={{ marginTop: 10 }} disabled={pages.length >= MAX_PAGES} onClick={() => dispatch({ t: 'addPage' })}>＋ {tr('Ajouter une page', 'Add a page')}</button>
        {menuIndex < 0 && <button className="btn wide" style={{ marginTop: 8 }} disabled={pages.length >= MAX_PAGES} onClick={() => { dispatch({ t: 'addPage', kind: 'menu' }); setOpen('menu') }}>＋ {tr('Ajouter un menu principal', 'Add a main menu')}</button>}
        {pages.some((p) => p.icon) && <button className="btn wide" style={{ marginTop: 8 }} onClick={() => pages.forEach((p, i) => p.icon && dispatch({ t: 'pagePatch', index: i, patch: { icon: null } }))}>{tr('Icônes automatiques', 'Reset icons')}</button>}
        <button className="btn wide" style={{ marginTop: 8 }} disabled={activeIsMenu} onClick={() => { dispatch({ t: 'copyToAll' }); notify(tr('Disposition appliquée à toutes les pages', 'Layout applied to all pages')) }}>{tr('Appliquer cette disposition à toutes les pages', 'Use this layout on all pages')}</button>
      </Section>

      <Section id="menu" icon="☷" title={tr('Menu principal', 'Main menu')} summary={menuIndex < 0 ? `${contentPages.length} ${tr('éléments', 'items')}` : `${contentPages.length} ${tr('éléments', 'items')} · ${cfg.menu.style}`} open={open === 'menu'} onToggle={toggle}>
        <Field label={tr('Libellés de navigation', 'Navigation labels')} hint={tr('Séparez les éléments par des virgules.', 'Separate items with commas.')}>
          <input className="field" type="text" value={contentPages.map(({ p }) => p.name).join(', ')} onChange={(e) => onLabels(e.target.value)} />
        </Field>
        {menuIndex < 0 ? (
          <button className="btn wide" disabled={pages.length >= MAX_PAGES} onClick={() => dispatch({ t: 'addPage', kind: 'menu' })}>＋ {tr('Ajouter une page de menu principal', 'Add a main menu page')}</button>
        ) : (
          <>
            <Field label={tr('Style du menu principal', 'Main menu style')}>
              <div className="mini-grid">
                {([['story', tr('Récit', 'Story')], ['banner', tr('Bannière', 'Banner')], ['image', tr('Panneau image', 'Image panel')], ['cover', tr('Couverture', 'Cover')], ['tiles', tr('Tuiles', 'Tiles')], ['split', tr('Scindé', 'Split')]] as const).map(([v, label]) => (
                  <Choice key={v} selected={cfg.menu.style === v} diagram={<MenuThumb style={v} />} label={label} onClick={() => { setMenu({ style: v }); dispatch({ t: 'setPage', index: menuIndex }) }} />
                ))}
              </div>
            </Field>
            <Field label={tr('Image', 'Image')}>
              <label className="btn file wide">{cfg.menu.image ? tr('Changer l\'image', 'Change image') : tr('Ajouter une image', 'Add an image')}<input type="file" accept="image/*" onChange={onMenuImage} /></label>
              {cfg.menu.image && <button className="btn wide" style={{ marginTop: 8 }} onClick={() => setMenu({ image: null })}>{tr('Retirer l\'image', 'Remove image')}</button>}
            </Field>
            <Field label={tr('Flou', 'Blur')}>
              <Radios value={cfg.menu.blur} onChange={(blur) => setMenu({ blur })} options={[{ v: 'none', label: tr('Aucun', 'None') }, { v: 'soft', label: tr('Léger', 'Soft') }, { v: 'strong', label: tr('Fort', 'Strong') }]} />
            </Field>
            <Field label={tr('Assombrir', 'Darken')}>
              <Radios value={cfg.menu.darken} onChange={(darken) => setMenu({ darken })} options={[{ v: 'light', label: tr('Léger', 'Light') }, { v: 'medium', label: tr('Moyen', 'Medium') }, { v: 'heavy', label: tr('Fort', 'Heavy') }]} />
            </Field>
            <Field label={tr('Ajustement', 'Fit')}>
              <Radios value={cfg.menu.fit} onChange={(fit) => setMenu({ fit })} options={[{ v: 'fill', label: tr('Remplir', 'Fill') }, { v: 'fit', label: tr('Contenir', 'Fit') }]} />
            </Field>
            <Field label={tr('Côté de l\'image', 'Image side')}>
              <Radios value={cfg.menu.side} onChange={(side) => setMenu({ side })} options={[{ v: 'left', label: tr('Gauche', 'Left') }, { v: 'right', label: tr('Droite', 'Right') }]} />
            </Field>
            <Field label={tr('Utiliser l\'image sur', 'Use image on')} hint={tr('« Toutes les pages » place l\'image dans le bandeau du titre (option « Titre sur un bandeau »).', '"Every page" puts the image in the title band ("Title on a band" option).')}>
              <Radios value={cfg.menu.useOn} onChange={(useOn) => setMenu({ useOn })} options={[{ v: 'menu', label: tr('Menu', 'Menu') }, { v: 'all', label: tr('Toutes les pages', 'Every page') }]} />
            </Field>
            <Field label={tr('Textes des boutons', 'Button text')}>
              <Radios value={cfg.menu.labels} onChange={(labels) => setMenu({ labels })} options={[{ v: 'baked', label: tr('Dans l\'image', 'In the image') }, { v: 'blank', label: tr('Emplacements vides', 'Blank slots') }]} />
            </Field>
            <Field label={tr('Couleur du texte sur l\'image', 'Text color on image')}>
              <Radios value={cfg.menu.labelColor} onChange={(labelColor) => setMenu({ labelColor })} options={[{ v: 'auto', label: 'Auto' }, { v: 'white', label: tr('Blanc', 'White') }, { v: 'palette', label: tr('Palette', 'Palette') }]} />
            </Field>
          </>
        )}
      </Section>

      <Section id="zones" icon="▦" title={tr('Zones et cartes', 'Zones and cards')} summary={`${(TEMPLATES.find((x) => x.id === templateId)?.cells.length ?? pages[project.active].items.length)} ${tr('zones', 'zones')}`} open={open === 'zones'} onToggle={toggle}>
        {activeIsMenu && <p className="tiny-note">{tr('Sélectionnez une page de contenu pour choisir sa disposition.', 'Select a content page to choose its layout.')}</p>}
        <Field label={tr('Modèle de disposition', 'Layout model')}>
          <div className="mini-grid">
            {TEMPLATES.map((tpl) => (
              <button key={tpl.id} disabled={activeIsMenu} className={`layout-choice${templateId === tpl.id ? ' active' : ''}`} aria-pressed={templateId === tpl.id} onClick={() => onTemplate(tpl)}>
                <span className="tpl-grid">
                  {tpl.cells.map((c, i) => (
                    <i key={i} className={`tpl-cell ${c.type}`} style={{ gridColumn: `${c.col} / span ${c.cs}`, gridRow: `${c.row} / span ${c.rs}` }} />
                  ))}
                </span>
                <span className="choice-name">{templateId === tpl.id ? '✓ ' : ''}{tpl.name[lang]}</span>
              </button>
            ))}
          </div>
        </Field>
        <Check checked={!cfg.hide.includes('kpi')} onChange={(v) => toggleHide('kpi', v)} label={tr('Afficher les cartes KPI', 'Show KPI cards')} />
        <Check checked={!cfg.hide.includes('chart')} onChange={(v) => toggleHide('chart', v)} label={tr('Afficher les graphiques', 'Show charts')} />
        <Check checked={!cfg.hide.includes('table')} onChange={(v) => toggleHide('table', v)} label={tr('Afficher le tableau', 'Show the table')} />
        <Check checked={cfg.showHeader} onChange={(showHeader) => set({ showHeader })} label={tr('Afficher le titre', 'Show the title')} />
        <Check checked={cfg.headerBand} onChange={(headerBand) => set({ headerBand })} label={tr('Titre sur un bandeau', 'Title on a band')} />
        <Check checked={cfg.labelZones} onChange={(labelZones) => set({ labelZones })} label={tr('Nommer chaque zone', 'Label every zone')} />
        <Field label={tr('Rayon des cartes', 'Card radius')}>
          <input className="field" type="range" min={0} max={22} value={cfg.radius} onChange={(e) => set({ radius: +e.target.value })} />
        </Field>
        <Field label={tr('Style des cartes', 'Card style')}>
          <Radios value={cfg.cardStyle} onChange={(cardStyle) => set({ cardStyle })} options={[{ v: 'plain', label: tr('Simple', 'Plain') }, { v: 'band', label: tr('Bandeau', 'Title band') }, { v: 'tick', label: tr('Repère', 'Tick') }]} />
        </Field>
        <Field label={tr('Couleur des cartes', 'Card color')}>
          <Radios value={cfg.cardColor} onChange={(cardColor) => set({ cardColor })} options={[{ v: 'paper', label: tr('Papier', 'Paper') }, { v: 'tint', label: tr('Teinte', 'Tint') }, { v: 'color', label: tr('Couleur', 'Color') }, { v: 'nav', label: tr('Navigation', 'Nav') }]} />
        </Field>
        <Field label={tr('Texture', 'Texture')}>
          <Radios value={cfg.texture} onChange={(texture) => set({ texture })} options={[{ v: 'none', label: tr('Aucune', 'None') }, { v: 'glow', label: tr('Lueur', 'Glow') }, { v: 'dots', label: tr('Points', 'Dots') }]} />
        </Field>
        <Check checked={cfg.shadow} onChange={(shadow) => set({ shadow })} label={tr('Ombre', 'Shadow')} />
      </Section>

      <Section id="text" icon="A′" title={tr('Textes et logo', 'Text and logo')} summary={tr('Logo + textes', 'Logo + text')} open={open === 'text'} onToggle={toggle}>
        <Field label={tr('Titre du tableau de bord', 'Dashboard title')} hint={tr('Entourez un mot de *astérisques* pour le colorer.', 'Wrap a word in *asterisks* to color it.')}>
          <input className="field" type="text" value={cfg.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label={tr('Sous-titre', 'Subtitle')}><input className="field" type="text" value={cfg.subtitle} onChange={(e) => set({ subtitle: e.target.value })} /></Field>
        <Field label={tr('Nom de l\'espace', 'Workspace name')}><input className="field" type="text" value={cfg.company} onChange={(e) => set({ company: e.target.value })} /></Field>
        <Field label={tr('Utilisateur', 'User')}><input className="field" type="text" value={cfg.userName} onChange={(e) => set({ userName: e.target.value })} /></Field>
        <Field label={tr('Rôle', 'Role')}><input className="field" type="text" value={cfg.userRole} onChange={(e) => set({ userRole: e.target.value })} /></Field>
        <Field label={tr('Pied de page', 'Footer')}><input className="field" type="text" value={cfg.footer} onChange={(e) => set({ footer: e.target.value })} /></Field>
        <Field label="LinkedIn"><input className="field" type="text" value={cfg.linkedin} onChange={(e) => set({ linkedin: e.target.value })} /></Field>
        <Field label={tr('Site web', 'Website')}><input className="field" type="text" value={cfg.website} onChange={(e) => set({ website: e.target.value })} /></Field>
        <Field label={tr('Police', 'Font')}>
          <select className="select" value={cfg.font} onChange={(e) => set({ font: e.target.value })}>{FONTS.map((f) => <option key={f}>{f}</option>)}</select>
        </Field>
        {slider('titleSize', tr('Taille du titre', 'Title size'), 16, 56)}
        {slider('textSize', tr('Taille du texte', 'Text size'), 10, 22)}
        {slider('cardSize', tr('Taille des cartes', 'Card size'), 10, 22)}
        <Field label={tr('Logo', 'Logo')} hint={tr('Placé en haut de la navigation.', 'Placed at the top of the navigation.')}>
          <Radios value={cfg.logoKind} onChange={(logoKind) => set({ logoKind })} options={[{ v: 'bolt', label: tr('Éclair', 'Bolt') }, { v: 'slot', label: tr('Vide', 'Slot') }, { v: 'mark', label: tr('Pastille', 'Mark') }, { v: 'letter', label: tr('Lettre', 'Letter') }, { v: 'icon', label: tr('Icône', 'Icon') }, { v: 'upload', label: tr('Image', 'Image') }]} />
        </Field>
        {cfg.logoKind === 'icon' && (
          <Field label={tr('Icône du logo', 'Logo icon')}>
            <select className="select" value={cfg.logoIcon} onChange={(e) => set({ logoIcon: e.target.value })}>{ICON_NAMES.map((n) => <option key={n}>{n}</option>)}</select>
          </Field>
        )}
        {cfg.logoKind === 'upload' && (
          <label className="btn file wide">{cfg.logoImage ? tr('Changer le logo', 'Change logo') : tr('Choisir un logo', 'Choose a logo')}<input type="file" accept="image/*" onChange={onLogo} /></label>
        )}
      </Section>

      <Section id="advanced" icon="⚙" title={tr('Avancé', 'Advanced')} summary={cfg.extraThemeName || tr('Options avancées', 'Advanced options')} open={open === 'advanced'} onToggle={toggle}>
        <Field label={tr('Densité', 'Density')}>
          <select className="select" value={cfg.density} onChange={(e) => set({ density: e.target.value as Config['density'] })}>
            <option value="comfortable">{tr('Confortable', 'Comfortable')}</option>
            <option value="balanced">{tr('Équilibrée', 'Balanced')}</option>
            <option value="dense">{tr('Dense', 'Dense')}</option>
          </select>
        </Field>
        <Field label={tr('Ajouter des réglages de thème (.json)', 'Add theme settings (.json)')} hint={tr('Fusionnés dans le thème exporté, par exemple une licence ZoomCharts. Le fichier reste dans votre navigateur.', 'Merged into the exported theme, for example a ZoomCharts license. The file stays in your browser.')}>
          <label className="btn file wide">{tr('Choisir un fichier', 'Choose a file')}<input type="file" accept="application/json,.json" onChange={onTheme} /></label>
          {cfg.extraTheme && <button className="btn wide" style={{ marginTop: 8 }} onClick={() => set({ extraTheme: null, extraThemeName: '' })}>{tr('Retirer', 'Remove')}</button>}
        </Field>
      </Section>
    </div>
  )
}
