import { builtinPromptAI, checkBuiltinAvailability, AI_STATUS } from './BuiltinPromptAI.js'

/**
 * Abstract text generation — Built-in AI only (no cloud / chat completions).
 * @param {string} prompt
 * @param {{ signal?: AbortSignal, onDownloadProgress?: (loaded: number) => void }} [options]
 * @returns {Promise<string>}
 */
export async function generateText(prompt, options = {}) {
  return builtinPromptAI.generateText(prompt, options)
}

export { checkBuiltinAvailability, AI_STATUS, builtinPromptAI }
