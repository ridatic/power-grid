/** Lit une image, la reduit et la renvoie en data URL (le PNG garde la transparence pour les logos). */
export function imageToDataUrl(file: File, maxSide: number, keepAlpha: boolean, maxChars = 1_400_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const draw = (side: number) => {
        const k = Math.min(1, side / Math.max(img.width, img.height))
        canvas.width = Math.max(1, Math.round(img.width * k))
        canvas.height = Math.max(1, Math.round(img.height * k))
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      draw(maxSide)
      // PNG seulement si l'image a vraiment de la transparence (logo detoure) ; sinon JPEG, bien plus leger
      const alpha = keepAlpha && hasTransparency(ctx, canvas.width, canvas.height)
      const encode = () => (alpha ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.86))
      // Reduit la taille jusqu'a tenir dans la limite de la base
      let side = maxSide
      let out = encode()
      while (out.length > maxChars && side > 240) {
        side = Math.round(side * 0.8)
        draw(side)
        out = encode()
      }
      if (out.length > maxChars) reject(new Error('image-too-large'))
      else resolve(out)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image-unreadable'))
    }
    img.src = url
  })
}

/** Vrai si au moins un pixel n'est pas totalement opaque. */
function hasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const data = ctx.getImageData(0, 0, w, h).data
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true
  return false
}

/** Lit un fichier JSON objet, ou renvoie null s'il n'est pas valide. */
export async function readJsonObject(file: File): Promise<Record<string, unknown> | null> {
  try {
    const json = JSON.parse(await file.text()) as unknown
    return typeof json === 'object' && json !== null && !Array.isArray(json) ? (json as Record<string, unknown>) : null
  } catch {
    return null
  }
}
