import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AI_STATUS,
  BuiltinPromptAI,
  checkBuiltinAvailability,
  builtinPromptAI,
} from '../src/ai/BuiltinPromptAI.js'
import { generateText } from '../src/ai/generateText.js'

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  delete globalThis.LanguageModel
  builtinPromptAI.destroySession()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  delete globalThis.LanguageModel
  builtinPromptAI.destroySession()
})

describe('checkBuiltinAvailability', () => {
  it('returns unavailable when LanguageModel is missing', async () => {
    const result = await checkBuiltinAvailability()
    expect(result.status).toBe(AI_STATUS.UNAVAILABLE)
    expect(result.reason).toBe('no-api')
  })

  it('maps availability strings', async () => {
    globalThis.LanguageModel = {
      availability: vi.fn(async () => 'available'),
    }
    expect((await checkBuiltinAvailability()).status).toBe(AI_STATUS.AVAILABLE)

    globalThis.LanguageModel.availability.mockResolvedValueOnce('downloadable')
    expect((await checkBuiltinAvailability()).status).toBe(AI_STATUS.DOWNLOADABLE)

    globalThis.LanguageModel.availability.mockResolvedValueOnce('downloading')
    expect((await checkBuiltinAvailability()).status).toBe(AI_STATUS.DOWNLOADING)

    globalThis.LanguageModel.availability.mockResolvedValueOnce('nope')
    expect((await checkBuiltinAvailability()).status).toBe(AI_STATUS.UNAVAILABLE)

    globalThis.LanguageModel.availability.mockRejectedValueOnce(new Error('boom'))
    const failed = await checkBuiltinAvailability()
    expect(failed.status).toBe(AI_STATUS.UNAVAILABLE)
    expect(failed.reason).toContain('boom')
  })
})

describe('BuiltinPromptAI.generateText', () => {
  it('creates a session, prompts, and returns text', async () => {
    const prompt = vi.fn(async () => 'hello nano')
    const destroy = vi.fn()
    const addEventListener = vi.fn((evt, cb) => {
      if (evt === 'downloadprogress') cb({ loaded: 0.5 })
    })
    globalThis.LanguageModel = {
      availability: vi.fn(async () => 'available'),
      create: vi.fn(async ({ monitor }) => {
        monitor?.({ addEventListener })
        return { prompt, destroy }
      }),
    }

    const onDownloadProgress = vi.fn()
    const ai = new BuiltinPromptAI()
    const text = await ai.generateText('p', { onDownloadProgress })
    expect(text).toBe('hello nano')
    expect(globalThis.LanguageModel.create).toHaveBeenCalled()
    expect(prompt).toHaveBeenCalledWith('p', expect.any(Object))
    expect(onDownloadProgress).toHaveBeenCalledWith(0.5)

    await ai.generateText('again')
    expect(globalThis.LanguageModel.create).toHaveBeenCalledTimes(1)
    ai.destroySession()
    expect(destroy).toHaveBeenCalled()
  })

  it('throws when create is unavailable', async () => {
    globalThis.LanguageModel = {}
    const ai = new BuiltinPromptAI()
    await expect(ai.generateText('x')).rejects.toThrow(/unavailable/i)
  })

  it('stringifies non-string prompt results', async () => {
    globalThis.LanguageModel = {
      create: vi.fn(async () => ({
        prompt: vi.fn(async () => null),
        destroy: vi.fn(),
      })),
    }
    const ai = new BuiltinPromptAI()
    await expect(ai.generateText('x')).resolves.toBe('')
  })
})

describe('generateText facade', () => {
  it('delegates to builtinPromptAI and never fetches chat completions', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    globalThis.LanguageModel = {
      create: vi.fn(async () => ({
        prompt: vi.fn(async () => '[{"data":{"text":"a"},"children":[]}]'),
        destroy: vi.fn(),
      })),
    }
    const text = await generateText('prompt')
    expect(text).toContain('data')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})


describe('BuiltinPromptAI edge cases', () => {
  it('checkAvailability delegates and destroySession swallows destroy errors', async () => {
    globalThis.LanguageModel = {
      availability: vi.fn(async () => 'available'),
      create: vi.fn(async () => ({
        prompt: vi.fn(async () => ({ nested: true })),
        destroy: vi.fn(() => {
          throw new Error('destroy boom')
        }),
      })),
    }
    const ai = new BuiltinPromptAI()
    expect((await ai.checkAvailability()).status).toBe(AI_STATUS.AVAILABLE)
    const text = await ai.generateText('x')
    expect(text).toBe('[object Object]')
    expect(() => ai.destroySession()).not.toThrow()
  })
})


describe('BuiltinPromptAI monitor branches', () => {
  it('covers nullish prompt, empty availability, string throw, and monitor edges', async () => {
    globalThis.LanguageModel = {
      availability: vi.fn(async () => ''),
    }
    expect((await checkBuiltinAvailability()).status).toBe(AI_STATUS.UNAVAILABLE)

    globalThis.LanguageModel.availability.mockRejectedValueOnce('bare')
    expect((await checkBuiltinAvailability()).reason).toBe('bare')

    const prompt = vi.fn(async () => 'ok')
    globalThis.LanguageModel = {
      create: vi.fn(async ({ monitor }) => {
        monitor(null)
        monitor({})
        monitor({
          addEventListener: (evt, cb) => {
            if (evt === 'downloadprogress') {
              cb({})
              cb({ loaded: 0.8 })
            }
          },
        })
        return { prompt, destroy: vi.fn() }
      }),
    }
    const ai = new BuiltinPromptAI()
    await ai.generateText(null, { onDownloadProgress: () => {} })
    await ai.generateText(undefined)
    // create without progress callback
    ai.destroySession()
    globalThis.LanguageModel.create.mockClear()
    await ai.generateText('x')
    expect(prompt).toHaveBeenCalled()
  })
})
