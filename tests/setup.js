import { vi } from 'vitest'

/** Node 25 may expose a broken global localStorage (--localstorage-file unset). Prefer a Map-backed mock. */
;(function ensureLocalStorage() {
  const hasApi = (store) =>
    store
    && typeof store.getItem === 'function'
    && typeof store.setItem === 'function'
    && typeof store.removeItem === 'function'
  try {
    if (typeof window !== 'undefined' && hasApi(window.localStorage)) {
      window.localStorage.setItem('__sm_ls_probe__', '1')
      window.localStorage.removeItem('__sm_ls_probe__')
      return
    }
  } catch {
    /* fall through to mock */
  }
  const mem = new Map()
  const mock = {
    getItem: (k) => (mem.has(String(k)) ? mem.get(String(k)) : null),
    setItem: (k, v) => { mem.set(String(k), String(v)) },
    removeItem: (k) => { mem.delete(String(k)) },
    clear: () => { mem.clear() },
    key: (i) => [...mem.keys()][i] ?? null,
    get length() { return mem.size },
  }
  try {
    Object.defineProperty(window, 'localStorage', { value: mock, configurable: true })
  } catch {
    /* ignore */
  }
  try {
    Object.defineProperty(globalThis, 'localStorage', { value: mock, configurable: true })
  } catch {
    /* ignore */
  }
})()


if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = vi.fn(() => 'blob:test')
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = vi.fn()
}

vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
