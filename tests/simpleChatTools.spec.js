import { describe, it, expect, vi } from 'vitest'
import { createMindChatTools, DEFAULT_CHAT_SYSTEM_PROMPT, buildAutoChatSystemPrompt } from '../src/ai/simpleChatTools.js'

describe('createMindChatTools', () => {
  it('exports a usable default system prompt', () => {
    expect(DEFAULT_CHAT_SYSTEM_PROMPT).toContain('get_selected_node')
    expect(DEFAULT_CHAT_SYSTEM_PROMPT).toContain('add_child_nodes')
  })

  it('get_selected_node returns error when nothing selected', async () => {
    const tools = createMindChatTools({
      getMindMap: () => ({}),
      getActiveNodes: () => [],
    })
    const get = tools.find((t) => t.name === 'get_selected_node')
    await expect(get.handler({})).resolves.toMatchObject({ ok: false })
  })

  it('get_selected_node reads node data', async () => {
    const tools = createMindChatTools({
      getMindMap: () => ({}),
      getActiveNodes: () => [
        {
          getData: () => ({
            data: { text: '主题', note: 'n', nextSystemPrompt: 'p', uid: 'u1' },
            children: [{}, {}],
          }),
        },
      ],
    })
    const get = tools.find((t) => t.name === 'get_selected_node')
    await expect(get.handler({})).resolves.toEqual({
      ok: true,
      text: '主题',
      note: 'n',
      nextSystemPrompt: 'p',
      uid: 'u1',
      childCount: 2,
    })
  })

  it('add_child_nodes inserts under selection', async () => {
    const execCommand = vi.fn()
    const target = { data: { text: 'parent' } }
    const tools = createMindChatTools({
      getMindMap: () => ({ execCommand }),
      getActiveNodes: () => [target],
    })
    const add = tools.find((t) => t.name === 'add_child_nodes')
    const result = await add.handler({
      children: [{ text: 'A', note: 'na' }, { text: '  ' }, { text: 'B' }],
    })
    expect(result.ok).toBe(true)
    expect(result.added).toBe(3)
    expect(execCommand).toHaveBeenCalledWith(
      'INSERT_MULTI_CHILD_NODE',
      [target],
      [
        { data: { text: 'A', note: 'na' }, children: [] },
        { data: { text: '未命名' }, children: [] },
        { data: { text: 'B' }, children: [] },
      ],
    )
  })

  it('add_child_nodes requires selection and children', async () => {
    const tools = createMindChatTools({
      getMindMap: () => ({ execCommand: vi.fn() }),
      getActiveNodes: () => [],
    })
    const add = tools.find((t) => t.name === 'add_child_nodes')
    await expect(add.handler({ children: [{ text: 'x' }] })).resolves.toMatchObject({ ok: false })
    await expect(add.handler({ children: [] })).resolves.toMatchObject({ ok: false })
  })
})

describe('buildAutoChatSystemPrompt', () => {
  it('injects knowledge base, selection, and thinking model', () => {
    const prompt = buildAutoChatSystemPrompt({
      knowledgeBase: 'KB content here',
      language: 'zh-CN',
      thinkingModelLabel: '第一性原理',
      thinkingModelDescription: '拆解本质',
      selectedText: '主题节点',
      selectedHint: '扩展方向',
    })
    expect(prompt).toContain('get_selected_node')
    expect(prompt).toContain('KB content here')
    expect(prompt).toContain('主题节点')
    expect(prompt).toContain('扩展方向')
    expect(prompt).toContain('第一性原理')
    expect(prompt).toContain('中文')
  })

  it('works with empty context', () => {
    const prompt = buildAutoChatSystemPrompt({})
    expect(prompt).toContain('add_child_nodes')
    expect(prompt).not.toContain('Knowledge base')
  })
})
