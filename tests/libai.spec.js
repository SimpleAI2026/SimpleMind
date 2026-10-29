import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPrompt, extractIdeas, expandPrompt, NANO_MAX_COUNT } from '../src/libai.js'

vi.mock('../src/ai/generateText.js', () => ({
  generateText: vi.fn(async () => 'expanded-text'),
}))

import { generateText } from '../src/ai/generateText.js'

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  generateText.mockReset()
  generateText.mockResolvedValue('expanded-text')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('buildPrompt', () => {
  it('uses the default thinking model and language', () => {
    const prompt = buildPrompt('Topic', 3, '', '')
    expect(prompt).toContain('Topic')
    expect(prompt).toContain('Use 任意 thinking model')
    expect(prompt).toContain('Output Language: 中文')
    expect(prompt).toContain('1-layer')
  })

  it('applies a named thinking model, language, and nextSystemPrompt', () => {
    const prompt = buildPrompt('主题', 2, '方向', '', {
      thinkingModel: 'note-taking',
      language: 'English',
      promptLayers: 2,
    })
    expect(prompt).toContain('Use 读书笔记 thinking model')
    expect(prompt).toContain('Output Language: English')
    expect(prompt).toContain('方向')
    expect(prompt).toContain('2-layer')
  })

  it('falls back for unknown model and empty nextSystemPrompt, includes context', () => {
    const prompt = buildPrompt('T', 1, '   ', '知识库内容', { thinkingModel: 'unknown-model' })
    expect(prompt).toContain('知识库内容')
    expect(prompt).toContain('Use 任意 thinking model')
    expect(prompt).toContain('Most relevant key points')
  })

  it('covers empty thinking prompt and truncated context', () => {
    const prompt = buildPrompt('T', 2, 'n', 'x' + 'y'.repeat(5000), {
      thinkingModel: 'default',
      promptLayers: 2,
      language: 'English',
    })
    expect(prompt).toContain('2-layer')
    expect(prompt.length).toBeLessThan(20000)
  })

  it('caps count at NANO_MAX_COUNT', () => {
    const prompt = buildPrompt('T', 99, 'n', '')
    expect(prompt).toContain(`at least ${NANO_MAX_COUNT}`)
    expect(NANO_MAX_COUNT).toBe(4)
  })
})

describe('extractIdeas', () => {
  it('parses OpenAI-like envelope and plain JSON array', () => {
    const ideas = extractIdeas({
      choices: [{ message: { content: '[{"data":{"text":"a"},"children":[]}]' } }],
    })
    expect(ideas[0].data.text).toBe('a')
    expect(extractIdeas('[{"data":{"text":"b"},"children":[]}]')[0].data.text).toBe('b')
  })

  it('strips json fences and repairs invalid JSON', () => {
    const fenced = '```json\n[{"data":{"text":"x"},"children":[]}]\n```'
    expect(extractIdeas(fenced)[0].data.text).toBe('x')
    const repaired = extractIdeas('{data:{text:"fixed"},children:[]}')
    expect(repaired).toBeTruthy()
  })

  it('returns children/data when payload is an object node', () => {
    expect(
      extractIdeas('{"data":{"text":"root"},"children":[{"data":{"text":"c"}}]}'),
    ).toEqual([{ data: { text: 'c' } }])
    expect(
      extractIdeas('{"data":[{"data":{"text":"d"}}]}'),
    ).toEqual([{ data: { text: 'd' } }])
  })

  it('reads output_text and text fields', () => {
    expect(extractIdeas({ output_text: '[{"data":{"text":"o"},"children":[]}]' })[0].data.text).toBe('o')
    expect(extractIdeas({ text: '[{"data":{"text":"t"},"children":[]}]' })[0].data.text).toBe('t')
  })

  it('throws when content is not valid JSON and cannot be repaired', () => {
    expect(() => extractIdeas('not json at all {{{')).toThrow(/不是有效 JSON/)
  })

  it('uses an empty string when content fields are missing on a non-string payload', () => {
    expect(() => extractIdeas({ nope: true })).toThrow(/不是有效 JSON/)
  })
})

describe('expandPrompt', () => {
  it('calls generateText and returns trimmed content', async () => {
    generateText.mockResolvedValueOnce('  expanded  ')
    await expect(expandPrompt({ currentPrompt: 'base', language: 'English' })).resolves.toBe('expanded')
    expect(generateText).toHaveBeenCalled()
    const promptArg = generateText.mock.calls[0][0]
    expect(promptArg).toContain('base')
    expect(promptArg).toContain('English')
  })

  it('returns empty string when generateText yields empty', async () => {
    generateText.mockResolvedValueOnce('')
    await expect(expandPrompt({ currentPrompt: 'x' })).resolves.toBe('')
  })

  it('does not call fetch / chat completions', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    await expandPrompt({ currentPrompt: 'x' })
    expect(fetchSpy).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
