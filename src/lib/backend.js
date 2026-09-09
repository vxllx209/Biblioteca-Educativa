/**
 * Backend local: cuentas en localStorage, PDFs (blobs) en IndexedDB.
 * Cuando se conecte Supabase, este es el único módulo a reemplazar por
 * llamadas a supabase-js — el resto de la app siempre llama a `backend.*`.
 */
const DB_NAME = 'biblioteca_educativa'
const DB_VERSION = 1
const LS_USERS = 'be_local_users'
const LS_SESSION = 'be_local_session'

let authListeners = []

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('pdfs')) {
        const store = db.createObjectStore('pdfs', { keyPath: 'id' })
        store.createIndex('subject', 'subject')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbTx(storeName, mode, fn) {
  const db = await abrirDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const result = fn(store)
    tx.oncomplete = () =>
      resolve(result && result.result !== undefined ? result.result : result)
    tx.onerror = () => reject(tx.error)
  })
}

function idbRequest(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function leerUsuariosLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_USERS)) || []
  } catch {
    return []
  }
}
function guardarUsuariosLocal(users) {
  localStorage.setItem(LS_USERS, JSON.stringify(users))
}
function leerSesionLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_SESSION)) || null
  } catch {
    return null
  }
}
function guardarSesionLocal(session) {
  if (session) localStorage.setItem(LS_SESSION, JSON.stringify(session))
  else localStorage.removeItem(LS_SESSION)
  authListeners.forEach((cb) => cb(session ? 'SIGNED_IN' : 'SIGNED_OUT', session))
}

export const backend = {
  auth: {
    async signUp({ email, password }) {
      const users = leerUsuariosLocal()
      if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return { data: null, error: { message: 'Ya existe una cuenta con ese correo.' } }
      }
      const user = { id: crypto.randomUUID(), email, password }
      users.push(user)
      guardarUsuariosLocal(users)
      const session = { user: { id: user.id, email: user.email } }
      guardarSesionLocal(session)
      return { data: { session }, error: null }
    },
    async signInWithPassword({ email, password }) {
      const users = leerUsuariosLocal()
      const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
      )
      if (!user) return { error: { message: 'Correo o contraseña incorrectos.' } }
      const session = { user: { id: user.id, email: user.email } }
      guardarSesionLocal(session)
      return { error: null }
    },
    async signOut() {
      guardarSesionLocal(null)
      return {}
    },
    async getSession() {
      return { data: { session: leerSesionLocal() } }
    },
    onAuthStateChange(cb) {
      authListeners.push(cb)
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners = authListeners.filter((f) => f !== cb)
            },
          },
        },
      }
    },
  },
  pdfs: {
    async listBySubject(subject) {
      const registros = await idbTx('pdfs', 'readonly', (store) =>
        idbRequest(store.index('subject').getAll(subject)),
      )
      return registros.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    },
    async countBySubject(subject) {
      const registros = await idbTx('pdfs', 'readonly', (store) =>
        idbRequest(store.index('subject').getAll(subject)),
      )
      return registros.length
    },
    async upload({ subject, title, file, userId, userName }) {
      const registro = {
        id: crypto.randomUUID(),
        subject,
        title,
        blob: file,
        uploaded_by: userId,
        uploader_name: userName,
        created_at: new Date().toISOString(),
      }
      await idbTx('pdfs', 'readwrite', (store) => store.add(registro))
    },
    async remove(id) {
      await idbTx('pdfs', 'readwrite', (store) => store.delete(id))
    },
    getUrl(registro) {
      return URL.createObjectURL(registro.blob)
    },
  },
}
