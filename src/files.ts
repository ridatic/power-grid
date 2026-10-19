/** Lit une image, la reduit et la renvoie en data URL (le PNG garde la transparence pour les logos). */
export function imageToDataUrl(file: File, maxSide: number, keepAlpha: boolean): Promise<string> {
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

/** Lit un fichier JSON objet, ou renvoie null s'il n'est pas valide. */
export async function readJsonObject(file: File): Promise<Record<string, unknown> | null> {
  try {
    const json = JSON.parse(await file.text()) as unknown
    return typeof json === 'object' && json !== null && !Array.isArray(json) ? (json as Record<string, unknown>) : null
  } catch {
    return null
  }
}
