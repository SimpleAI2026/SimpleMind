import { thinkingModels } from './const.js'
import { jsonrepair } from 'jsonrepair'
import { generateText } from './ai/generateText.js'

/** Cap first-level width for on-device Nano context windows. */
export const NANO_MAX_COUNT = 4

/**
 * Build a mind-map generation prompt tuned for Chrome Built-in AI (Gemini Nano).
 * @param {string} topic
 * @param {number} count
 * @param {string} nextSystemPrompt
 * @param {string} systemPrompt
 * @param {object} [settings]
 */
export function buildPrompt(topic, count, nextSystemPrompt, systemPrompt, settings = {}) {
    const thinkingModel = settings.thinkingModel || 'default'
    const model = thinkingModels.find(m => m.value === thinkingModel) || thinkingModels[0]
    const language = settings.language || '中文'
    const layers = Number(settings.promptLayers) === 2 ? 2 : 1
    const safeCount = Math.max(1, Math.min(NANO_MAX_COUNT, Number(count) || 3))

    if (!nextSystemPrompt || nextSystemPrompt.trim().length === 0) {
        nextSystemPrompt = "Most relevant key points"
    }
    let contextBlock = ''
    if (systemPrompt && systemPrompt.trim().length > 0) {
        // Keep knowledge base short for Nano context limits
        const trimmed = String(systemPrompt).trim().slice(0, 4000)
        contextBlock = "## Context & Data\n<context>\n" + trimmed + "\n</context>\n\n"
    }

    let thinkingPrompt = ""
    if (model.prompt && model.prompt.trim() !== '') {
        let label = model.label || 'Any'
        thinkingPrompt = `## Thinking Model 
<context>
Use ${label} thinking model, ${model.description || ''}
Reference principles: ${model.prompt}
</context>`
    }

    const structureRule = layers === 2
        ? `- Generate a 2-layer mind map: first-level array plus each item's \`children\` array.
- Each \`children\` array must have at least ${safeCount} and at most ${safeCount * 2} elements.`
        : `- Generate a **1-layer** mind map only: a JSON array of leaf nodes (each \`children\` must be \`[]\`).
- Do not nest deeper levels.`

    return `${contextBlock}## Role Definition   
You are an expert in organizing mind maps, proficient in knowledge related to "${topic}".

${thinkingPrompt}

## Output Examples
<examples>
\`\`\`json
[
    {
        "data": {
            "text": "Relevant Key Point 1",
            "note": "Short description",
            "nextSystemPrompt": "Prompt for child key points",
            "color": "#8B0A50"
        },
        "children": []
    }
]
\`\`\`
</examples>
 
## Rules
Please strictly follow these rules:
<rules>
- Output in JSON array format only (no markdown prose outside the JSON fence if used)
- Output Language: ${language}
${structureRule}
- The first level JSON array must have at least ${safeCount} elements and at most ${safeCount * 2} elements.
- Thinking Direction: ${nextSystemPrompt}
- JSON field \`children\` is an array of child key points. Each element has \`data\` and \`children\`.
- JSON field \`text\` is a brief title, 8-30 words, not empty.
- JSON field \`note\` is a short description, 20-80 words, not empty.
- JSON field \`nextSystemPrompt\` summarizes keywords for the next level, 15-40 words.
- JSON field \`color\` is a Hex color (avoid light colors; each RGB < 200), e.g. \`#8B0A50\`.
</rules>

## Task
Based on "${topic}", output the mind map JSON following the rules. Keep the response compact.
`
}

export function extractIdeas(raw) {
    // 1) 提取可能存在的内容字段或直接使用字符串
    const content = raw?.choices?.[0]?.message?.content
        ?? raw?.output_text
        ?? raw?.text
        ?? (typeof raw === 'string' ? raw : '')

    // 2) 去掉 ```json 开头与尾部 ```（仅按要求处理首尾围栏）
    const cleaned = String(content)
        .replace(/^\s*```json(?:\s*|\r?\n)/i, '') // 仅替换开头的 ```json（允许后接空白或换行）
        .replace(/```[\s\n]*$/i, '')              // 仅替换结尾的 ```（允许末尾空白/换行）
        .trim()

    // 3) 校验并解析 JSON，不是 JSON 就抛错
    let parsed = null;
    if (import.meta.env?.DEV) console.log('AI返回:', cleaned)
    try {
        parsed = JSON.parse(cleaned)
    } catch (err) {
       console.error('JSON解析错误:', err)
        try {
            const repaired = jsonrepair(cleaned)
            parsed = JSON.parse(repaired)
            console.warn('已自动修复无效 JSON 并解析成功')
        } catch (repairErr) {
            console.error('JSON修复失败:', repairErr)
            throw new Error('返回内容不是有效 JSON，且无法自动修复')
        }
    }

    // 判断是否为Object
    if (parsed && typeof parsed === 'object' && (parsed.children || parsed.data)) {
        console.warn("返回数据是Object，返回children数组或data数组")
        return parsed.children || parsed.data
    }

    return parsed;
}

/**
 * Expand knowledge-base text via Built-in AI only.
 * @param {{ currentPrompt: string, language?: string, signal?: AbortSignal, onDownloadProgress?: Function }} opts
 */
export async function expandPrompt({
    currentPrompt,
    language = '中文',
    signal,
    onDownloadProgress,
} = {}) {
    const prompt = `
## Role Definition   
You are an encyclopedic knowledge expert. Based on "${currentPrompt}", please optimize and expand the detailed content.

## Task
- Optimize and expand the detailed content, ensuring it is rich, structured, and meets the requirements for generating a mind map.
- Output Language: ${language}
- Output plain text only (no JSON).
`

    const content = await generateText(prompt, { signal, onDownloadProgress })
    return String(content || '').trim()
}
