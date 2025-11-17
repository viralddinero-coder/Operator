export async function sanitizeImage(file: File): Promise<Blob> {
  const type = file.type.toLowerCase()
  if (type.includes('jpeg') || type.includes('jpg') || type.includes('png')) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = dataUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const outType = type.includes('png') ? 'image/png' : 'image/jpeg'
    const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), outType, 0.92))
    return blob
  }
  return file
}

