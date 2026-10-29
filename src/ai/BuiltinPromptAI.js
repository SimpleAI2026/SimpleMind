/** Chrome Built-in AI (Prompt API / LanguageModel) adapter — no cloud keys. */

export const AI_STATUS = Object.freeze({
  UNKNOWN: 'unknown',
  UNAVAILABLE: 'unavailable',
  DOWNLOADABLE: 'downloadable',
  DOWNLOADING: 'downloading',
  AVAILABLE: 'available',
})

function getLanguageModel() {
  return globalThis.LanguageModel || null
}

/**
 * @returns {Promise<{ status: string, reason?: string, raw?: string }>}
 */
export async function checkBuiltinAvailability() {
  const LM = getLanguageModel()
  if (!LM || typeof LM.availability !== 'function') {
    return {
      status: AI_STATUS.UNAVAILABLE,
      reason: 'no-api',
    }
  }
  try {
    const raw = await LM.availability()
    const normalized = String(raw || '').toLowerCase()
    if (normalized === 'available') return { status: AI_STATUS.AVAILABLE, raw: normalized }
    if (normalized === 'downloadable') return { status: AI_STATUS.DOWNLOADABLE, raw: normalized }
    if (normalized === 'downloading') return { status: AI_STATUS.DOWNLOADING, raw: normalized }
    return { status: AI_STATUS.UNAVAILABLE, reason: 'unsupported', raw: normalized }
  } catch (err) {
    return {
      status: AI_STATUS.UNAVAILABLE,
      reason: err && err.message ? err.message : String(err),
    }
  }
}

export class BuiltinPromptAI {
  constructor() {
    this._session = null
  }

  async checkAvailability() {
    return checkBuiltinAvailability()
  }

  /**
   * Ensure a session exists (may trigger model download).
   * @param {{ signal?: AbortSignal, onDownloadProgress?: (loaded: number) => void }} [options]
   */
  async ensureSession(options = {}) {
    const { signal, onDownloadProgress } = options
    const LM = getLanguageModel()
    if (!LM || typeof LM.create !== 'function') {
      throw new Error('Built-in AI is unavailable. Use Chrome 138+ with Prompt API support.')
    }

    if (this._session) return this._session

    this._session = await LM.create({
      signal,
      monitor(m) {
        if (!onDownloadProgress) return
        if (!m || typeof m.addEventListener !== 'function') return
        m.addEventListener('downloadprogress', (e) => {
          const loaded = e && typeof e.loaded === 'number' ? e.loaded : 0
          onDownloadProgress(loaded)
        })
      },
    })
    return this._session
  }

  destroySession() {
    try {
      if (this._session && typeof this._session.destroy === 'function') {
        this._session.destroy()
      }
    } catch {
      /* ignore */
    }
    this._session = null
  }

  /**
   * @param {string} prompt
   * @param {{ signal?: AbortSignal, onDownloadProgress?: (loaded: number) => void }} [options]
   * @returns {Promise<string>}
   */
  async generateText(prompt, options = {}) {
    const session = await this.ensureSession(options)
    const result = await session.prompt(String(prompt == null ? '' : prompt), {
      signal: options.signal,
    })
    if (typeof result === 'string') return result
    if (result == null) return ''
    return String(result)
  }
}

export const builtinPromptAI = new BuiltinPromptAI()
