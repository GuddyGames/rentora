// Resizes + compresses an image file in the browser before it's stored as
// base64 in Firestore. Keeps uploads small — important on mobile data and
// keeps individual docs well under Firestore's 1MB document limit.
const MAX_SOURCE_FILE_BYTES = 15 * 1024 * 1024 // 15MB — plenty for any real photo, small enough to not hang the browser

export function compressImage(file, { maxWidth = 900, quality = 0.7 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error("That doesn't look like an image file."))
      return
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      reject(new Error('That photo is too large (max 15MB) — try a smaller one.'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error("Couldn't read that image — try a different file."))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error("Couldn't read that file."))
    reader.readAsDataURL(file)
  })
}
