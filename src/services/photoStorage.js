export const MAX_PHOTO_SIZE = 10 * 1024 * 1024
export const ALLOWED_PHOTO_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp'])

const DATABASE_NAME = 'lavadero-photo-files-v1'
const STORE_NAME = 'photoFiles'
const DATABASE_VERSION = 1

export function validatePhotoFile(file) {
  if (!file || typeof file !== 'object') throw new Error('Selecciona una fotografía válida.')
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) throw new Error('Formato no permitido. Usa JPEG, PNG o WEBP.')
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_PHOTO_SIZE) throw new Error('La fotografía debe pesar más de 0 y hasta 10 MB.')
  return true
}

function openPhotoDatabase() {
  if (!globalThis.indexedDB) return Promise.reject(new Error('El almacenamiento local de fotografías no está disponible en este navegador.'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacenamiento local de fotografías.'))
  })
}

async function withPhotoStore(mode, operation) {
  const database = await openPhotoDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    let result
    try {
      result = operation(store)
    } catch (error) {
      database.close()
      reject(error)
      return
    }
    transaction.oncomplete = () => {
      database.close()
      resolve(result?.result)
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('No se pudo guardar la fotografía localmente.'))
    }
    transaction.onabort = () => {
      database.close()
      reject(transaction.error ?? new Error('Se canceló el almacenamiento de la fotografía.'))
    }
  })
}

export function storePhotoFile(id, file) {
  validatePhotoFile(file)
  return withPhotoStore('readwrite', (store) => store.put({ id, file }))
}

export async function readPhotoFile(id) {
  const database = await openPhotoDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve(request.result?.file ?? null)
    request.onerror = () => reject(request.error ?? new Error('No se pudo leer la fotografía local.'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('No se pudo leer la fotografía local.'))
    }
  })
}

export function removePhotoFile(id) {
  return withPhotoStore('readwrite', (store) => store.delete(id))
}
