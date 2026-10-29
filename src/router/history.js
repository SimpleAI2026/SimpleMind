import { createWebHistory, createWebHashHistory } from 'vue-router'

/** Prefer hash history inside the Chrome extension (no server for deep links). */
export function createAppHistory(base = import.meta.env.BASE_URL) {
  const flagged = import.meta.env.VITE_EXTENSION === 'true'
  let extensionRuntime = false
  try {
    extensionRuntime = typeof chrome !== 'undefined' && !!chrome?.runtime?.id
  } catch {
    extensionRuntime = false
  }
  if (flagged || extensionRuntime) {
    return createWebHashHistory(base)
  }
  return createWebHistory(base)
}
