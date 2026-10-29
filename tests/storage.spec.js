import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  SETTINGS_KEY,
  MINDMAP_KEY,
  MINDMAP_SAVE_DEBOUNCE_MS,
  loadSettings,
  saveSettings,
  loadMindMapData,
  saveMindMapData,
  scheduleMindMapSave,
  flushMindMapSave,
  setPendingEditorAction,
  consumePendingEditorAction,
  PENDING_EDITOR_KEY,
  resetMindMapSaveState,
  isExtensionContext,
  hydrateFromChromeStorage,
} from '../src/storage.js'

afterEach(() => {
  resetMindMapSaveState()
  sessionStorage.clear()
  vi.restoreAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('loadSettings', () => {
  it('returns a copy of defaults when the key is missing', () => {
    const defaults = { temperature: 0.5, depth: 4 }
    const loaded = loadSettings(defaults)
    expect(loaded).toEqual(defaults)
    expect(loaded).not.toBe(defaults)
  })

  it('merges saved JSON and coerces temperature/depth', () => {
    sessionStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ api: 'https://api.example', secret: 'sk', model: 'm', temperature: '3', extra: true }),
    )
    const loaded = loadSettings({ temperature: 0.1, depth: 9 })
    expect(loaded.api).toBeUndefined()
    expect(loaded.secret).toBeUndefined()
    expect(loaded.model).toBeUndefined()
    expect(loaded.temperature).toBe(3)
    expect(loaded.depth).toBe(9)
    expect(loaded.extra).toBe(true)
  })

  it('falls back to 0.7 / 3 when temperature and depth are invalid', () => {
    sessionStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ temperature: 'nope', depth: undefined }),
    )
    const loaded = loadSettings({})
    expect(loaded.temperature).toBe(0.7)
    expect(loaded.depth).toBe(3)
  })

  it('uses default temperature/depth as fallback when saved values are NaN', () => {
    sessionStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ temperature: 'NaN', depth: {} }),
    )
    const loaded = loadSettings({ temperature: 0.2, depth: 8 })
    expect(loaded.temperature).toBe(0.2)
    expect(loaded.depth).toBe(8)
  })

  it('returns a copy of defaults when JSON is damaged', () => {
    sessionStorage.setItem(SETTINGS_KEY, '{not-json')
    const defaults = { language: 'fallback' }
    const loaded = loadSettings(defaults)
    expect(loaded).toEqual(defaults)
    expect(loaded).not.toBe(defaults)
    expect(console.warn).toHaveBeenCalled()
  })
})

describe('saveSettings', () => {
  it('writes SETTINGS_KEY with normalized numbers', () => {
    saveSettings({ api: 'a', secret: 's', model: 'm', temperature: '1.5', depth: '4' })
    const saved = JSON.parse(sessionStorage.getItem(SETTINGS_KEY))
    expect(saved.api).toBeUndefined()
    expect(saved.secret).toBeUndefined()
    expect(saved.model).toBeUndefined()
    expect(saved.temperature).toBe(1.5)
    expect(saved.depth).toBe(4)
  })

  it('persists SimpleChat key only when chatRememberKey is true', () => {
    saveSettings({
      chatApiBaseUrl: 'https://api.example/v1',
      chatApiKey: 'sk-secret',
      chatModel: 'm1',
      chatRememberKey: true,
      temperature: 0.5,
      depth: 2,
    })
    let saved = JSON.parse(sessionStorage.getItem(SETTINGS_KEY))
    expect(saved.chatApiKey).toBe('sk-secret')
    expect(saved.chatRememberKey).toBe(true)
    expect(saved.chatApiBaseUrl).toBe('https://api.example/v1')
    expect(saved.chatModel).toBe('m1')

    saveSettings({
      chatApiBaseUrl: 'https://api.example/v1',
      chatApiKey: 'sk-secret',
      chatModel: 'm1',
      chatRememberKey: false,
      temperature: 0.5,
      depth: 2,
    })
    saved = JSON.parse(sessionStorage.getItem(SETTINGS_KEY))
    expect(saved.chatApiKey).toBeUndefined()
    expect(saved.chatRememberKey).toBe(false)
  })

  it('uses 0.7 / 3 when numbers are missing', () => {
    saveSettings({})
    const saved = JSON.parse(sessionStorage.getItem(SETTINGS_KEY))
    expect(saved.temperature).toBe(0.7)
    expect(saved.depth).toBe(3)
  })

  it('rethrows when setItem throws', () => {
    const boom = new Error('quota')
    vi.spyOn(window.sessionStorage.__proto__, 'setItem').mockImplementation(() => {
      throw boom
    })
    expect(() => saveSettings({ language: 'zh-CN' })).toThrow(boom)
    expect(console.error).toHaveBeenCalled()
  })
})

describe('loadMindMapData / saveMindMapData', () => {
  it('returns defaults when there is no stored map', () => {
    const defaults = { data: { text: '主题' }, children: [] }
    expect(loadMindMapData(defaults)).toBe(defaults)
  })

  it('returns null when missing and no defaults are given', () => {
    expect(loadMindMapData()).toBeNull()
  })

  it('rejects payloads that are missing a data object', () => {
    sessionStorage.setItem(MINDMAP_KEY, JSON.stringify({ children: [] }))
    const defaults = { data: { text: 'd' }, children: [] }
    expect(loadMindMapData(defaults)).toBe(defaults)
  })

  it('rejects payloads whose data field is not an object', () => {
    sessionStorage.setItem(MINDMAP_KEY, JSON.stringify({ data: 'nope' }))
    expect(loadMindMapData(null)).toBeNull()
  })

  it('returns saved data when the map is valid', () => {
    const map = { data: { text: 'root' }, children: [] }
    sessionStorage.setItem(MINDMAP_KEY, JSON.stringify(map))
    expect(loadMindMapData()).toEqual(map)
  })

  it('returns defaults when JSON is damaged', () => {
    sessionStorage.setItem(MINDMAP_KEY, '[[[')
    const defaults = { data: { text: 'd' }, children: [] }
    expect(loadMindMapData(defaults)).toBe(defaults)
    expect(console.warn).toHaveBeenCalled()
  })

  it('returns null when JSON is damaged and no defaults are given', () => {
    sessionStorage.setItem(MINDMAP_KEY, '[[[')
    expect(loadMindMapData()).toBeNull()
  })

  it('serializes mind map data', () => {
    const map = { data: { text: 'root' }, children: [{ data: { text: 'c' } }] }
    saveMindMapData(map)
    expect(JSON.parse(sessionStorage.getItem(MINDMAP_KEY))).toEqual(map)
  })

  it('rethrows QuotaExceeded from saveMindMapData', () => {
    const quota = new Error('full')
    quota.name = 'QuotaExceededError'
    vi.spyOn(window.sessionStorage.__proto__, 'setItem').mockImplementation(() => {
      throw quota
    })
    expect(() => saveMindMapData({ data: { text: 'x' } })).toThrow(quota)
    expect(console.error).toHaveBeenCalled()
  })

  it('skips a write when the serialized payload is unchanged', () => {
    const map = { data: { text: 'same' }, children: [] }
    saveMindMapData(map)
    const spy = vi.spyOn(Storage.prototype, 'setItem')
    saveMindMapData(map)
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('scheduleMindMapSave / flushMindMapSave', () => {
  it('debounces writes and flushes the latest payload', () => {
    vi.useFakeTimers()
    const a = { data: { text: 'a' }, children: [] }
    const b = { data: { text: 'b' }, children: [] }
    scheduleMindMapSave(a)
    scheduleMindMapSave(b)
    expect(sessionStorage.getItem(MINDMAP_KEY)).toBeNull()
    vi.advanceTimersByTime(MINDMAP_SAVE_DEBOUNCE_MS)
    expect(JSON.parse(sessionStorage.getItem(MINDMAP_KEY))).toEqual(b)
    vi.useRealTimers()
  })

  it('flushMindMapSave writes immediately and is a no-op without pending data', () => {
    vi.useFakeTimers()
    scheduleMindMapSave({ data: { text: 'pending' }, children: [] })
    flushMindMapSave()
    expect(JSON.parse(sessionStorage.getItem(MINDMAP_KEY)).data.text).toBe('pending')
    flushMindMapSave()
    vi.useRealTimers()
  })
})


describe('pending editor action', () => {
  it('sets, consumes, and clears pending actions', () => {
    setPendingEditorAction({ type: 'create' })
    expect(JSON.parse(sessionStorage.getItem(PENDING_EDITOR_KEY))).toEqual({ type: 'create' })
    expect(consumePendingEditorAction()).toEqual({ type: 'create' })
    expect(sessionStorage.getItem(PENDING_EDITOR_KEY)).toBeNull()
    expect(consumePendingEditorAction()).toBeNull()

    setPendingEditorAction(null)
    expect(sessionStorage.getItem(PENDING_EDITOR_KEY)).toBeNull()

    sessionStorage.setItem(PENDING_EDITOR_KEY, '{bad')
    expect(consumePendingEditorAction()).toBeNull()
  })

  it('warns when pending write fails', () => {
    vi.spyOn(window.sessionStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new Error('nope')
    })
    setPendingEditorAction({ type: 'create' })
    expect(console.warn).toHaveBeenCalled()
  })
})


describe('extension storage helpers', () => {
  it('reports non-extension context by default', () => {
    expect(isExtensionContext()).toBe(false)
  })

  it('hydrateFromChromeStorage is a no-op outside extension', async () => {
    await expect(hydrateFromChromeStorage()).resolves.toBeUndefined()
  })

  it('uses chrome.storage.local when extension context is present', async () => {
    const store = {}
    vi.stubGlobal('chrome', {
      runtime: { id: 'ext-id' },
      storage: {
        local: {
          get: vi.fn(async (keys) => {
            const out = {}
            for (const k of keys) {
              if (store[k] != null) out[k] = store[k]
            }
            return out
          }),
          set: vi.fn(async (obj) => { Object.assign(store, obj) }),
          remove: vi.fn(async (key) => { delete store[key] }),
        },
      },
    })
    expect(isExtensionContext()).toBe(true)
    saveSettings({ language: 'en-US', depth: 2 })
    expect(store[SETTINGS_KEY]).toBeTruthy()
    store[SETTINGS_KEY] = JSON.stringify({ language: 'zh-CN', depth: 3 })
    await hydrateFromChromeStorage()
    const loaded = loadSettings({ language: 'en-US', depth: 1 })
    expect(loaded.language).toBe('zh-CN')
    expect(loaded.depth).toBe(3)
    vi.unstubAllGlobals()
  })
})


describe('extension storage error paths', () => {
  it('warns when chrome.storage set/remove/get throw', async () => {
    vi.stubGlobal('chrome', {
      runtime: { id: 'ext-id' },
      storage: {
        local: {
          get: vi.fn(async () => { throw new Error('get fail') }),
          set: vi.fn(() => { throw new Error('set fail') }),
          remove: vi.fn(() => { throw new Error('remove fail') }),
        },
      },
    })
    expect(isExtensionContext()).toBe(true)
    saveSettings({ language: 'en-US' })
    expect(console.warn).toHaveBeenCalled()
    setPendingEditorAction(null)
    await hydrateFromChromeStorage()
    expect(console.warn).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('isExtensionContext returns false when chrome access throws', () => {
    vi.stubGlobal('chrome', {
      get runtime() {
        throw new Error('denied')
      },
    })
    expect(isExtensionContext()).toBe(false)
    vi.unstubAllGlobals()
  })
})


describe('extension storage removeWeb / consume nested failures', () => {
  it('swallows removeWeb failures and nested consume remove failures', async () => {
    const store = {}
    vi.stubGlobal('chrome', {
      runtime: { id: 'ext-id' },
      storage: {
        local: {
          get: vi.fn(async () => ({})),
          set: vi.fn(async (obj) => Object.assign(store, obj)),
          remove: vi.fn(async (key) => { delete store[key] }),
        },
      },
    })
    const proto = window.sessionStorage.__proto__
    vi.spyOn(proto, 'removeItem').mockImplementation(() => {
      throw new Error('remove web fail')
    })
    setPendingEditorAction(null)
    sessionStorage.setItem(PENDING_EDITOR_KEY, '{bad')
    // force readRaw path via memory empty + web throw on remove during consume
    expect(consumePendingEditorAction()).toBeNull()
    vi.unstubAllGlobals()
  })
})
