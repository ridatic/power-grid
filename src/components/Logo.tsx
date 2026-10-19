import { useId } from 'react'

/** L'eclair de Power-Grid, sur une grille de 24. */
export const BOLT_D = 'M13.4 1.6 3.9 13.4c-.4.5 0 1.2.6 1.2h6.1l-1.3 7.4c-.1.7.8 1.1 1.2.5l9.6-12c.4-.5 0-1.2-.6-1.2h-6.1l1.2-7.2c.1-.7-.8-1.1-1.2-.5z'

/**
 * Logo de Power-Grid : l'eclair suivi du nom en ecriture manuscrite, en degrade, sans cadre ni fond (comme Sira).
 * Le degrade vient des variables CSS --logo-main et --logo-accent, qui suivent le theme.
 */
export function Logo({ height = 40 }: { height?: number }) {
  const g = `pg-${useId().replace(/:/g, '')}`
  return (
    <svg className="logo" viewBox="0 0 172 40" height={height} width={(height * 172) / 40} role="img" aria-label="Power-Grid">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" className="l-from" />
          <stop offset="1" className="l-to" />
        </linearGradient>
      </defs>
      <path d={BOLT_D} transform="translate(0 4) scale(1.35)" fill={`url(#${g})`} />
      <text x="34" y="29" fontFamily="'Dancing Script', cursive" fontWeight="700" fontSize="29" fill={`url(#${g})`}>Power-Grid</text>
    </svg>
  )
}
