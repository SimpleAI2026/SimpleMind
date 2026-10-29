export const SETTINGS_KEY = 'mindlessSettings'
export const MINDMAP_KEY = 'mindMapData'
export const PENDING_EDITOR_KEY = 'pendingEditorAction'
export const MINDMAP_SAVE_DEBOUNCE_MS = 400

/** In-memory mirror used when chrome.storage.local is available (extension). */
const memoryStore = new Map()

export function isExtensionContext() {
    try {
        return typeof chrome !== 'undefined'
            && !!chrome?.runtime?.id
            && !!chrome?.storage?.local
    } catch {
        return false
    }
}

function readWeb(key) {
    try {
        return sessionStorage.getItem(key)
    } catch {
        return null
    }
}

function writeWeb(key, value) {
    sessionStorage.setItem(key, value)
}

function removeWeb(key) {
    sessionStorage.removeItem(key)
}

function readRaw(key) {
    if (isExtensionContext()) {
        if (memoryStore.has(key)) return memoryStore.get(key)
        // Before hydrate, fall back to sessionStorage for same-session continuity
        return readWeb(key)
    }
    return readWeb(key)
}

function writeRaw(key, value) {
    if (isExtensionContext()) {
        memoryStore.set(key, value)
        try {
            chrome.storage.local.set({ [key]: value })
        } catch (e) {
            console.warn('chrome.storage.local.set failed:', e)
        }
        try {
            writeWeb(key, value)
        } catch {
            /* ignore */
        }
        return
    }
    writeWeb(key, value)
}

function removeRaw(key) {
    if (isExtensionContext()) {
        memoryStore.delete(key)
        try {
            chrome.storage.local.remove(key)
        } catch (e) {
            console.warn('chrome.storage.local.remove failed:', e)
        }
        try {
            removeWeb(key)
        } catch {
            /* ignore */
        }
        return
    }
    removeWeb(key)
}

/**
 * Load chrome.storage.local into the sync memory mirror. Call once at startup in extension.
 */
export async function hydrateFromChromeStorage() {
    if (!isExtensionContext()) return
    const keys = [SETTINGS_KEY, MINDMAP_KEY, PENDING_EDITOR_KEY]
    try {
        const data = await chrome.storage.local.get(keys)
        for (const key of keys) {
            if (data[key] != null) {
                const raw = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key])
                memoryStore.set(key, raw)
            }
        }
    } catch (e) {
        console.warn('hydrateFromChromeStorage failed:', e)
    }
}

const toNumberOr = (val, fallback) => {
    const n = Number(val)
    return Number.isFinite(n) ? n : fallback
}

/** Strip legacy Builtin cloud API fields; optionally drop chat API key. */
function scrubSettings(saved = {}) {
    const {
        api: _api,
        secret: _secret,
        model: _model,
        chatApiKey,
        chatRememberKey,
        ...rest
    } = saved || {}
    const out = { ...rest }
    // SimpleChat optional cloud config — only persist key when user opted in
    if (chatRememberKey && chatApiKey) {
        out.chatRememberKey = true
        out.chatApiKey = chatApiKey
    } else {
        out.chatRememberKey = false
    }
    return out
}

export function loadSettings(defaults = {}) {
    try {
        const raw = readRaw(SETTINGS_KEY)
        if (!raw) return { ...defaults }
        const saved = scrubSettings(JSON.parse(raw))
        return {
            ...defaults,
            ...saved,
            temperature: toNumberOr(saved?.temperature, toNumberOr(defaults?.temperature, 0.7)),
            depth: toNumberOr(saved?.depth, toNumberOr(defaults?.depth, 3)),
        }
    } catch (e) {
        console.warn('加载设置失败：', e)
        return { ...defaults }
    }
}

export function saveSettings(settings) {
    const scrubbed = scrubSettings(settings)
    const payload = {
        ...scrubbed,
        temperature: toNumberOr(scrubbed?.temperature, 0.7),
        depth: toNumberOr(scrubbed?.depth, 3),
    }

    try {
        writeRaw(SETTINGS_KEY, JSON.stringify(payload))
    } catch (e) {
        console.error('保存设置失败：', e)
        throw e
    }
}

const isValidMindMap = (d) => d && typeof d === 'object' && d.data && typeof d.data === 'object'

export function loadMindMapData(defaults = null) {
    try {
        const raw = readRaw(MINDMAP_KEY)
        if (!raw) return defaults
        const saved = JSON.parse(raw)
        return isValidMindMap(saved) ? saved : (defaults ?? null)
    } catch (e) {
        console.warn('加载导图数据失败：', e)
        return defaults ?? null
    }
}

let saveTimer = null
let pendingMapData = undefined
let lastSavedJson = ''

const clearSaveTimer = () => {
    if (saveTimer != null) {
        clearTimeout(saveTimer)
        saveTimer = null
    }
}

export function resetMindMapSaveState() {
    clearSaveTimer()
    pendingMapData = undefined
    lastSavedJson = ''
}

export function saveMindMapData(mapData) {
    try {
        const json = JSON.stringify(mapData)
        if (json === lastSavedJson) return
        writeRaw(MINDMAP_KEY, json)
        lastSavedJson = json
    } catch (e) {
        console.error('保存导图数据失败：', e)
        throw e
    }
}

export function flushMindMapSave() {
    clearSaveTimer()
    if (pendingMapData === undefined) return
    const data = pendingMapData
    pendingMapData = undefined
    saveMindMapData(data)
}

export function scheduleMindMapSave(mapData, delay = MINDMAP_SAVE_DEBOUNCE_MS) {
    pendingMapData = mapData
    clearSaveTimer()
    saveTimer = setTimeout(() => {
        saveTimer = null
        flushMindMapSave()
    }, delay)
}

export function setPendingEditorAction(action) {
    try {
        if (!action) {
            removeRaw(PENDING_EDITOR_KEY)
            return
        }
        writeRaw(PENDING_EDITOR_KEY, JSON.stringify(action))
    } catch (e) {
        console.warn('写入 pendingEditorAction 失败：', e)
    }
}

export function consumePendingEditorAction() {
    try {
        const raw = readRaw(PENDING_EDITOR_KEY)
        removeRaw(PENDING_EDITOR_KEY)
        if (!raw) return null
        return JSON.parse(raw)
    } catch (e) {
        console.warn('读取 pendingEditorAction 失败：', e)
        try {
            removeRaw(PENDING_EDITOR_KEY)
        } catch {
            /* ignore */
        }
        return null
    }
}
