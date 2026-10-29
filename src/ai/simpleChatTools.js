/**
 * Minimal SimpleChat host tools for SimpleMind.
 * Permissions: read selection + write children under selection only.
 */

/**
 * @param {{ getMindMap: () => any, getActiveNodes: () => any[] }} deps
 * @returns {Array<{ name: string, description?: string, parameters?: object, handler: Function }>}
 */
export function createMindChatTools({ getMindMap, getActiveNodes }) {
  return [
    {
      name: 'get_selected_node',
      description:
        'Read the currently selected mind-map node (text, note, nextSystemPrompt, uid). Call this before editing the map.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      handler: async () => {
        const nodes = getActiveNodes?.() || []
        const node = nodes[0]
        if (!node) {
          return { ok: false, error: 'No node selected. Ask the user to select a node first.' }
        }
        const raw = node.getData ? node.getData() : { data: node.data || {}, children: node.children || [] }
        const data = raw?.data || {}
        return {
          ok: true,
          text: data.text || '',
          note: data.note || '',
          nextSystemPrompt: data.nextSystemPrompt || '',
          uid: data.uid || null,
          childCount: Array.isArray(raw?.children) ? raw.children.length : (node.children?.length ?? 0),
        }
      },
    },
    {
      name: 'add_child_nodes',
      description:
        'Add one or more child nodes under the currently selected mind-map node. Only inserts children; does not delete or move nodes.',
      parameters: {
        type: 'object',
        properties: {
          children: {
            type: 'array',
            description: 'Child nodes to insert under the selection',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'Short node title' },
                note: { type: 'string', description: 'Optional longer description' },
                nextSystemPrompt: {
                  type: 'string',
                  description: 'Optional hint for further expansion',
                },
              },
              required: ['text'],
              additionalProperties: false,
            },
            minItems: 1,
          },
        },
        required: ['children'],
        additionalProperties: false,
      },
      handler: async (args = {}) => {
        const mm = getMindMap?.()
        const nodes = getActiveNodes?.() || []
        const target = nodes[0]
        if (!mm) return { ok: false, error: 'Mind map is not ready' }
        if (!target) {
          return { ok: false, error: 'No node selected. Select a parent node first.' }
        }
        const list = Array.isArray(args.children) ? args.children : []
        if (!list.length) return { ok: false, error: 'No children provided' }

        const ideas = list.map((c) => {
          const text = String(c?.text ?? '').trim() || '未命名'
          const data = { text }
          if (c?.note != null && String(c.note).trim()) data.note = String(c.note).trim()
          if (c?.nextSystemPrompt != null && String(c.nextSystemPrompt).trim()) {
            data.nextSystemPrompt = String(c.nextSystemPrompt).trim()
          }
          return { data, children: [] }
        })

        mm.execCommand('INSERT_MULTI_CHILD_NODE', [target], ideas)
        return { ok: true, added: ideas.length, texts: ideas.map((n) => n.data.text) }
      },
    },
  ]
}

export const DEFAULT_CHAT_SYSTEM_PROMPT = `你是 SimpleMind 脑图助手。用户在右侧聊天；你可以通过工具读取选中节点并在其下添加子节点。
规则：
- 需要了解当前节点时先调用 get_selected_node
- 添加子节点只用 add_child_nodes（仅写入选中节点的子节点）
- 回复简洁；需要改图时优先用工具而不是只给文字列表
- 不要删除、移动或重命名已有节点（当前未开放这些工具）`

/**
 * Build SimpleChat system prompt from SimpleMind context (auto-injected).
 * @param {{
 *   knowledgeBase?: string,
 *   language?: string,
 *   thinkingModelLabel?: string,
 *   thinkingModelDescription?: string,
 *   selectedText?: string,
 *   selectedHint?: string,
 * }} ctx
 */
export function buildAutoChatSystemPrompt(ctx = {}) {
  const parts = [DEFAULT_CHAT_SYSTEM_PROMPT]
  const lang = ctx.language || 'zh-CN'
  parts.push(`## Output language\nPrefer responding in ${lang === 'en-US' ? 'English' : '中文'}.`)

  if (ctx.thinkingModelLabel && ctx.thinkingModelLabel !== '任意') {
    let block = `## Thinking model\nUse "${ctx.thinkingModelLabel}"`
    if (ctx.thinkingModelDescription) block += `: ${ctx.thinkingModelDescription}`
    parts.push(block)
  }

  const kb = String(ctx.knowledgeBase || '').trim()
  if (kb) {
    parts.push(`## Knowledge base (from SimpleMind settings)\n<context>\n${kb.slice(0, 6000)}\n</context>`)
  }

  const sel = String(ctx.selectedText || '').trim()
  if (sel) {
    let selBlock = `## Current selected node\n- text: ${sel}`
    const hint = String(ctx.selectedHint || '').trim()
    if (hint) selBlock += `\n- nextSystemPrompt: ${hint}`
    parts.push(selBlock)
  }

  return parts.join('\n\n')
}
