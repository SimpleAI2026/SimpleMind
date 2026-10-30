<template>
  <a-config-provider
    :theme="{
      token: {
        colorPrimary: settings.themeRootFillColor || '#00c0b8',
        borderRadius: 8,
      },
    }"
  >
    <div
      class="app-shell"
      :style="{ '--color-primary': settings.themeRootFillColor || '#00c0b8' }"
    >
    <div class="toolbar">
        <div class="toolbar-inner">
            <div class="toolbar-group">
                <a-button size="small" :icon="h(HomeOutlined)" @click="goHome" :title="t('backHome')"></a-button>
            </div>
            <div class="toolbar-group zoom-control mobile-hide">
                <a-button class="mobile-hide" size="small" shape="circle" :icon="h(MinusOutlined)" @click="zoomOut" />
                <span class="zoom-percent mobile-hide">{{ Math.round(zoom * 100) }}%</span>
                <a-button class="mobile-hide" size="small" shape="circle" :icon="h(PlusOutlined)" @click="zoomIn" />
            </div>

            <div class="toolbar-group">
                <a-button size="small" :icon="h(LeftOutlined)" @click="back" :title="t('back')"></a-button>
                <a-button size="small" :icon="h(RightOutlined)" @click="forward" :title="t('forward')"></a-button>
            </div>
            <div class="toolbar-group">
                <a-button size="small" :icon="h(FileAddOutlined)" @click="newMap" :title="t('new')"></a-button>
                <a-button size="small" :icon="h(PlusOutlined)" @click="addChildNode" :title="t('addChildNode')"></a-button>
                <a-button size="small" :icon="h(DeleteOutlined)" @click="removeCurrentNode" :title="t('removeCurrentNode')"></a-button>
            </div>
            <div class="toolbar-group">
                <a-button size="small" :icon="h(CloudDownloadOutlined)" @click="openExportPanel" :title="t('export')+t('import')"></a-button>
            </div>
            <div class="toolbar-group">
                <a-button
                    size="small"
                    :icon="h(SisternodeOutlined)"
                    @click="toggleMindMapMode"
                    :title="t('toggleMode')"
                    :type="isDetailMode ? 'primary' : 'default'"
                ></a-button>
                <a-button size="small" :icon="h(AppstoreOutlined)" @click="showCardModal" :title="t('cardView')"></a-button>
            </div>
            <div class="toolbar-group">
                <a-button size="small" :icon="h(SettingOutlined)" @click="toggleSettings" :title="t('settings')"></a-button>
            </div>
            <div class="toolbar-group">
                <a-button
                    class="toolbar-ai-btn"
                    size="small"
                    :icon="h(BulbOutlined)"
                    type="primary"
                    @click="aiGenerate"
                    :title="t('aiGenerate')"
                    :disabled="isGenerating"
                    :loading="isGenerating"
                >
                    <span class="mobile-hide-text">{{ isGenerating ? t('generating') : t('aiGenerate') }}</span>
                </a-button>
            </div>
        </div>
    </div>
    
    <div id="mindMapContainer" :class="{ 'with-ai-panel': aiPanelOpen }"></div>

    <button
        v-if="!aiPanelOpen"
        type="button"
        class="ai-panel-edge-toggle"
        :title="t('aiPanel')"
        @click="aiPanelOpen = true"
    >
        <span class="ai-panel-edge-dot" :class="'status-' + aiStatus"></span>
        {{ t('aiPanel') }}
    </button>

    <aside
        v-if="aiPanelOpen"
        class="ai-side-panel ai-side-panel--chat"
        aria-label="SimpleChat"
        :style="{ '--ai-panel-width': aiPanelWidthPx }"
    >
        <div class="ai-side-panel-chat">
            <SimpleChatSidebar
                ref="chatSidebarRef"
                :key="chatStorageKey"
                :open="aiPanelOpen"
                layout="panel"
                position="right"
                :config="simpleChatConfig"
                :tools="mindChatTools"
                :storage-key="chatStorageKey"
                :theme-style="simpleChatThemeStyle"
                :theme-css="simpleChatThemeCss"
                @close="onAiPanelClose"
                @update:open="onAiPanelOpenUpdate"
                @resize="onChatPanelResize"
            />
        </div>
    </aside>

    <div
        v-if="show"
        class="context-menu"
        :style="{ left: `${left}px`, top: `${top}px` }"
    >
        <div class="menu-item" @click="addChildNode">{{ t('addChildNode') }}</div>
        <div class="menu-item" @click="removeCurrentNode">{{ t('removeCurrentNode') }}</div>
        <div class="menu-item" @click="removeNode">{{ t('removeNodeWithChildren') }}</div>
        <div class="menu-item" @click="copyNode">{{ t('copyNode') }}</div>
        <div class="menu-item" @click="cutNode">{{ t('cutNode') }}</div>
        <div
            class="menu-item"
            :class="{ disabled: !clipboardData }"
            @click="clipboardData ? pasteNode() : null"
        >
            {{ t('pasteNode') }}
        </div>
        <div class="menu-item" @click="markNode(true)">{{ t('markNode') }}</div>
        <div class="menu-item" @click="markNode(false)">{{ t('unmarkNode') }}</div>
    </div>

    <a-modal
        v-model:open="settingsOpen"
        width="min(800px, calc(100vw - 32px))"
        wrap-class-name="settings-modal-wrap"
        :title="null"
        :footer="null"
        @cancel="saveSettings"
    >
        <a-tabs class="settings-tabs" v-model:activeKey="activeKey" centered type="line">
            <a-tab-pane :key="'settings'" :tab="t('settings')">
                <div class="settings-section">
                    <label class="field-row">
                        <span class="field-label">{{ t('language') }}：</span>
                        <a-select
                            class="field-control-narrow"
                            v-model:value="settings.language"
                            :options="languageOptions"
                        />
                    </label>

                    <label class="field-row">
                        <span class="field-label">{{ t('childCountRange') }}：</span>
                        <a-input-number class="field-control-narrow" name="depth" v-model:value="settings.depth" :min="1" :max="4" :step="1" />
                    </label>

                </div>

                <div class="settings-section">
                    <div class="field-row">
                        <span class="field-label">{{ t('theme') }}：</span>
                        <a-select class="field-control" v-model:value="settings.theme">
                            <a-select-option
                                v-for="item in themeList"
                                :key="item.value"
                                :value="item.value"
                                :style="{
                                    backgroundColor: item.theme?.backgroundColor || DEFAULT_CANVAS_BACKGROUND,
                                    color: item.dark ? '#ffffff' : 'inherit'
                                }"
                            >
                                {{ item.name }}
                            </a-select-option>
                        </a-select>
                    </div>

                    <div class="field-row">
                        <span class="field-label">{{ t('fontFamily') }}：</span>
                        <a-select class="field-control" v-model:value="settings.fontFamily">
                            <a-select-option v-for="font in fontFamilyOptions" :key="font.value" :value="font.value">
                                {{ font.label }}
                            </a-select-option>
                        </a-select>
                    </div>

                    <div class="field-row">
                        <span class="field-label">{{ t('lineStyle') }}：</span>
                        <a-select class="field-control" v-model:value="settings.lineStyle">
                            <a-select-option value="curve">{{ t('curve') }}</a-select-option>
                            <a-select-option value="straight">{{ t('straight') }}</a-select-option>
                            <a-select-option value="direct">{{ t('direct') }}</a-select-option>
                        </a-select>
                    </div>

                    <div class="field-row field-row-top">
                        <span class="field-label">{{ t('layout') }}：</span>
                        <div class="chart-list field-control">
                            <a-button
                                v-for="l in layouts"
                                :key="l.key"
                                class="layout-btn"
                                size="small"
                                :type="settings?.layout === l.key ? 'primary' : 'default'"
                                @click="applyLayout(l.key)"
                            >
                                <span class="layout-btn-icon" v-html="l.icon"></span>
                                {{ l.name }}
                            </a-button>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="field-row field-row-top">
                        <span class="field-label">{{ t('simpleChat') }}：</span>
                        <div class="field-control builtin-ai-panel">
                            <p class="builtin-ai-hint">{{ t('simpleChatHint') }}</p>
                            <p class="builtin-ai-hint">{{ t('simpleChatCloudHint') }}</p>
                            <p class="builtin-ai-hint">{{ t('builtinAIInChatHint') }}</p>
                            <p class="builtin-ai-hint" style="margin-top: 6px;">{{ t('simpleChatAutoPromptHint') }}</p>
                        </div>
                    </div>
                </div>
            </a-tab-pane>

            <a-tab-pane :key="'prompt'" :tab="t('systemPrompt')">
                <label class="field">
                    <span>{{ t('systemPrompt') }}：{{ t('systemPromptUsage') }}</span>
                    <a-textarea
                        v-model:value="settings.systemPrompt"
                        :placeholder="t('systemPromptPlaceholder')"
                        :auto-size="{ minRows: 8, maxRows: 20 }"
                    />
                    <div class="prompt-actions">
                        <a-upload
                            :show-upload-list="false"
                            :before-upload="handleParsePromptUpload"
                            accept=".md,.txt,.csv,.pdf"
                            :max-count="1"
                        >
                            <a-button size="small" type="primary">{{ t('uploadHint') }}</a-button>
                        </a-upload>
                        <a-button
                            size="small"
                            :loading="isExpanding"
                            @click="expandSystemPrompt"
                        >
                            {{ t('aiExpand') }}
                        </a-button>
                    </div>
                </label>
            </a-tab-pane>

            <a-tab-pane :key="'export'" :tab="t('export')">
                <div class="field">
                    <span>{{ t('selectExportFormat') }}</span>
                </div>
                <div class="chart-list">
                    <a-button size="small" @click="exportMap('smm')">.smm</a-button>
                    <a-button size="small" @click="exportMap('json')">.json</a-button>
                    <a-button size="small" @click="exportMap('svg')">.svg</a-button>
                    <a-button size="small" @click="exportMap('png')">.png</a-button>
                    <a-button size="small" @click="exportMap('pdf')">.pdf</a-button>
                    <a-button size="small" @click="exportMap('md')">.md</a-button>
                    <a-button size="small" @click="exportMap('xmind')">.xmind</a-button>
                    <a-button size="small" @click="exportMap('txt')">.txt</a-button>
                    <a-button size="small" type="primary" @click="exportMap('cardhtml')">card.html</a-button>
                </div>
            </a-tab-pane>

            <a-tab-pane :key="'import'" :tab="t('import')">
                <div class="field">
                    <span>{{ t('importSupportedFormats') }}</span>
                    <a-upload
                        :accept="'.smm,.json,.xmind,.xlsx,.md'"
                        :before-upload="handleBeforeUpload"
                        :show-upload-list="false"
                    >
                        <a-button type="primary">{{ t('chooseFile') }}</a-button>
                    </a-upload>
                </div>
            </a-tab-pane>

            <a-tab-pane :key="'moreSettings'" :tab="t('moreSettings')">
                <div class="field-row">
                    <span class="field-label">{{ t('backgroundColor') }}：</span>
                    <div class="field-control-group">
                        <input type="color" class="color-input" v-model="settings.backgroundColor" />
                        <a-button size="small" :icon="h(UndoOutlined)" @click="settings.backgroundColor = DEFAULT_CANVAS_BACKGROUND" :title="t('reset')"></a-button>
                    </div>
                </div>
                <div class="field-row">
                    <span class="field-label">{{ t('lineColor') }}：</span>
                    <div class="field-control-group">
                        <input type="color" class="color-input" v-model="settings.lineColor" />
                        <a-button size="small" :icon="h(UndoOutlined)" @click="settings.lineColor = DEFAULT_LINE_COLOR" :title="t('reset')"></a-button>
                    </div>
                </div>
                <div class="field-row">
                    <span class="field-label">{{ t('lineWidth') }}：</span>
                    <div class="field-control-group">
                        <a-input-number v-model:value="settings.lineWidth" :min="1" :max="10" class="field-control-narrow" />
                        <a-button size="small" :icon="h(UndoOutlined)" @click="settings.lineWidth = 2" :title="t('reset')"></a-button>
                    </div>
                </div>
                <div class="field-row">
                    <span class="field-label">{{ t('githubFollow') }}</span>
                    <a href="https://github.com/linkxzhou/SimpleMind" target="_blank" rel="noopener noreferrer">SimpleMind</a>
                </div>
            </a-tab-pane>
        </a-tabs>
    </a-modal>

    <a-modal
        v-model:open="cardModalOpen"
        :title="t('cardView')"
        width="min(1000px, calc(100vw - 32px))"
        wrap-class-name="card-modal-wrap"
        :footer="null"
        :body-style="{ padding: '0px' }"
    >
        <div v-if="isCardLoading" class="card-loading">
            <LoadingOutlined spin style="font-size: 24px;" />
            <p class="card-loading-text">{{ t('loading') }}</p>
        </div>
        <iframe
            v-else-if="cardHtmlUrl"
            class="card-view-frame"
            :src="cardHtmlUrl"
            title="card-view"
        ></iframe>
    </a-modal>

    <a-modal
        v-model:open="aiPromptOpen"
        :title="t('aiPromptTitle')"
        width="min(720px, calc(100vw - 32px))"
        wrap-class-name="ai-prompt-modal-wrap"
        :mask-closable="!isGenerating"
        :closable="!isGenerating"
        :keyboard="!isGenerating"
        @cancel="closeAiPromptModal"
    >
        <p class="ai-prompt-hint">{{ t('aiPromptHint') }}</p>
        <a-textarea
            class="ai-prompt-textarea"
            v-model:value="aiPromptText"
            :placeholder="t('aiPromptPlaceholder')"
            :disabled="isGenerating"
            :auto-size="{ minRows: 8, maxRows: 16 }"
        />
        <template #footer>
            <a-button :disabled="isGenerating" @click="closeAiPromptModal">{{ t('cancel') }}</a-button>
            <a-button
                type="primary"
                :loading="isGenerating"
                @click="confirmAiGenerate"
            >
                {{ isGenerating ? t('generating') : t('aiPromptConfirm') }}
            </a-button>
        </template>
    </a-modal>
    </div>
  </a-config-provider>
</template>

<script setup>
import {
    Button as AButton,
    Input as AInput,
    InputNumber as AInputNumber,
    Textarea as ATextarea,
    Select as ASelect,
    SelectOption as ASelectOption,
    Modal as AModal,
    Tabs as ATabs,
    TabPane as ATabPane,
    Upload as AUpload,
    ConfigProvider as AConfigProvider,
    Progress as AProgress,
    Checkbox as ACheckbox,
} from 'ant-design-vue'
const AInputPassword = AInput.Password
import {
    MinusOutlined,
    PlusOutlined,
    LeftOutlined,
    RightOutlined,
    SettingOutlined,
    BulbOutlined,
    FileAddOutlined,
    DeleteOutlined,
    CloudDownloadOutlined,
    SisternodeOutlined,
    HomeOutlined,
    UndoOutlined,
    AppstoreOutlined,
    LoadingOutlined,
} from '@ant-design/icons-vue'
import { ref, shallowRef, onMounted, onUnmounted, h, watch, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MindMap from "simple-mind-map"
import { showError, exportMindMap, importFileToMindMap, switchTextNoteMode, getThemeList, buildCardHtml, debugLog } from '../utils.js'
import { buildPrompt as libBuildPrompt, extractIdeas as libExtractIdeas, expandPrompt, NANO_MAX_COUNT } from '../libai.js'
import { SimpleChatSidebar } from '../components/SimpleChatSidebar.js'
import { loadSidebarWidth, clampSidebarWidth, SC_WIDTH_DEFAULT } from '../vendor/simplechat/index.js'
import { createMindChatTools, buildAutoChatSystemPrompt } from '../ai/simpleChatTools.js'
import { loadSettings as loadSettingsFromStorage, saveSettings as saveSettingsToStorage, loadMindMapData, saveMindMapData, scheduleMindMapSave, flushMindMapSave, consumePendingEditorAction } from '../storage.js'
import { layouts as layoutOptions, languageOptions, messages, fontFamilyOptions, iconList, loadExampleTemplate, thinkingModels } from '../const.js'
import { parseFileAsPrompt } from '../parser.js'

const THEME_CONFIG_DEBOUNCE_MS = 120
const DEFAULT_CANVAS_BACKGROUND = '#f5f5f5'
const DEFAULT_LINE_COLOR = '#549688'

// -----------------------------------------------------------------------------
// 1. 状态定义 (State Definitions)
// -----------------------------------------------------------------------------

// 核心状态
const mindMapRef = ref(null)
const activeNodes = ref([])
const themeList = getThemeList()

const router = useRouter()
const route = useRoute()

const goHome = () => {
    try { flushMindMapSave() } catch {}
    try { saveSettingsToStorage(settings.value) } catch {}
    router.push({ name: 'home' })
}


// UI 状态
const settingsOpen = ref(false)
const activeKey = ref('settings')
const isDetailMode = ref(false)
const isGenerating = ref(false)
const zoom = ref(1)

const cardModalOpen = ref(false)
const cardHtmlUrl = ref('')
const isCardLoading = ref(false)
const aiPromptOpen = ref(false)
const aiPromptText = ref('')

// 右键菜单状态
const type = ref('')                 // 当前右键类型
const currentNode = shallowRef(null) // 当前右键节点
const left = ref(0)                  // 菜单X坐标
const top = ref(0)                   // 菜单Y坐标
const show = ref(false)              // 是否显示菜单
const clipboardData = ref(null)      // 剪贴板数据

// 设置状态
const settings = ref({
    temperature: 0.6,
    systemPrompt: '',
    depth: 3,
    thinkingModel: 'default',
    language: 'zh-CN',
    layout: 'mindMap',
    backgroundColor: DEFAULT_CANVAS_BACKGROUND,
    lineColor: DEFAULT_LINE_COLOR,
    lineWidth: 2,
    lineStyle: 'curve',
    fontFamily: '微软雅黑, Microsoft YaHei',
    themeRootFillColor: '#00c0b8',
    theme: 'mint',
    promptLayers: 1,
    chatApiBaseUrl: 'https://api.siliconflow.cn/v1',
    chatApiKey: '',
    chatModel: 'zai-org/GLM-5.3-Flash',
    chatRememberKey: false,
})

// Built-in AI availability (Chrome Prompt API)
const aiStatus = ref('unknown')
const aiProgress = ref(0)
const aiChecking = ref(false)
const AI_PANEL_OPEN_KEY = 'simplemind-ai-panel-open'

/** Persist AI side panel open/closed. Missing/invalid preference → closed. */
const panelStorage = () => {
    try {
        return typeof window !== 'undefined' ? window.localStorage : null
    } catch {
        return null
    }
}

const loadAiPanelOpen = () => {
    try {
        const store = panelStorage()
        if (!store) return false
        const raw = store.getItem(AI_PANEL_OPEN_KEY)
        if (raw == null || raw === '') return false
        if (raw === '0' || raw === 'false') return false
        if (raw === '1' || raw === 'true') return true
        return false
    } catch {
        return false
    }
}

const persistAiPanelOpen = (open) => {
    try {
        panelStorage()?.setItem(AI_PANEL_OPEN_KEY, open ? '1' : '0')
    } catch {}
}

const aiPanelOpen = ref(loadAiPanelOpen())
/** Ignore spurious sc-close / open=false during first paint / remount. */
const aiPanelCloseArmed = ref(false)
const aiPanelWidth = ref(typeof loadSidebarWidth === 'function' ? loadSidebarWidth() : SC_WIDTH_DEFAULT)
const aiPanelWidthPx = computed(() => `${aiPanelWidth.value}px`)

const applyAiPanelWidth = (width, { resizeMap = true } = {}) => {
    const next = clampSidebarWidth(Number(width) || SC_WIDTH_DEFAULT)
    aiPanelWidth.value = next
    try {
        document.documentElement.style.setProperty('--ai-panel-width', `${next}px`)
    } catch {}
    if (resizeMap) {
        try {
            mindMapRef.value?.resize?.()
            window.dispatchEvent(new Event('resize'))
        } catch {}
    }
}

const armAiPanelClose = async () => {
    aiPanelCloseArmed.value = false
    await nextTick()
    // Second tick: custom element connectedCallback + Vue listeners settled
    await nextTick()
    aiPanelCloseArmed.value = true
}

const onAiPanelClose = () => {
    if (!aiPanelCloseArmed.value) return
    aiPanelOpen.value = false
}

const onAiPanelOpenUpdate = (v) => {
    if (!v) onAiPanelClose()
}

const onChatPanelResize = (payload) => {
    const w = payload?.width ?? payload?.detail?.width
    applyAiPanelWidth(w)
}


// SimpleChat (cloud, optional) — toolbar「AI生成」opens this panel
const mapChatId = ref('default')
const chatStorageKey = computed(() => `simplemind-chat-${mapChatId.value || 'default'}`)

const selectedNodeForChat = computed(() => {
    const nodes = activeNodes.value || []
    if (nodes.length) return nodes[0]
    return currentNode.value || null
})

const autoChatSystemPrompt = computed(() => {
    const node = selectedNodeForChat.value
    const tm = thinkingModels.find((m) => m.value === settings.value.thinkingModel) || thinkingModels[0]
    return buildAutoChatSystemPrompt({
        knowledgeBase: settings.value.systemPrompt,
        language: settings.value.language,
        thinkingModelLabel: tm?.label,
        thinkingModelDescription: tm?.description,
        selectedText: getNodeText(node),
        selectedHint: getNodeSystemPrompt(node),
    })
})

const chatSidebarRef = ref(null)

/** Chat ⚙ owns apiBaseUrl/apiKey/model (localStorage). Host only injects auto systemPrompt + temperature. */
const simpleChatConfig = computed(() => ({
    systemPrompt: autoChatSystemPrompt.value,
    temperature: settings.value.temperature,
}))


/** Map SimpleMind theme tokens → SimpleChat --sc-* (host inline style overrides :host defaults). */
const simpleChatThemeStyle = computed(() => {
    const target = themeList.find((item) => item.value === settings.value.theme)
    const theme = target?.theme || {}
    const dark = !!target?.dark
    let primary = settings.value.themeRootFillColor || theme?.root?.fillColor || '#00c0b8'
    if (primary === '#fff' || primary === '#ffffff' || primary === 'rgb(255, 255, 255)') {
        primary = '#00c0b8'
    }
    const panelBg = dark ? '#0f172a' : '#ffffff'
    const fg = dark ? '#f5f5f5' : '#1f2937'
    const muted = dark ? 'rgba(255,255,255,0.65)' : '#737373'
    const mutedBg = dark ? 'rgba(255,255,255,0.08)' : (settings.value.backgroundColor || theme.backgroundColor || '#f5f5f5')
    const border = dark ? 'rgba(255,255,255,0.14)' : '#e5e5e5'
    return {
        '--sc-background': panelBg,
        '--sc-foreground': fg,
        '--sc-muted': muted,
        '--sc-muted-bg': mutedBg,
        '--sc-border': border,
        '--sc-primary': primary,
        '--sc-primary-fg': '#fafafa',
        '--sc-assistant-bg': panelBg,
        '--sc-assistant-border': border,
        '--sc-ring': primary,
    }
})

const simpleChatThemeCss = computed(() => {
    const s = simpleChatThemeStyle.value
    const lines = Object.entries(s).map(([k, v]) => `  ${k}: ${v};`)
    return [':host {', ...lines, '}'].join('\n')
})
const mindChatTools = createMindChatTools({
    getMindMap: () => mindMapRef.value,
    getActiveNodes: () => {
        const fromActive = activeNodes.value || []
        if (fromActive.length) return fromActive
        if (currentNode.value) return [currentNode.value]
        return []
    },
})
const refreshMapChatId = () => {
    try {
        const data = mindMapRef.value?.getData?.(false)
        const uid = data?.data?.uid
        mapChatId.value = uid ? String(uid) : 'default'
    } catch {
        mapChatId.value = 'default'
    }
}


const refreshAiAvailability = async () => {
    aiChecking.value = true
    try {
        const { checkBuiltinAvailability } = await import('../ai/generateText.js')
        const result = await checkBuiltinAvailability()
        aiStatus.value = result.status
        if (result.status === 'available') aiProgress.value = 1
        return result
    } catch (err) {
        aiStatus.value = 'unavailable'
        return { status: 'unavailable', reason: err?.message || String(err) }
    } finally {
        aiChecking.value = false
    }
}

const ensureAiReady = async () => {
    await refreshAiAvailability()
    if (aiStatus.value === 'available') return true
    if (aiStatus.value === 'downloadable' || aiStatus.value === 'downloading') {
        aiStatus.value = 'downloading'
        aiProgress.value = 0
        try {
            const { builtinPromptAI } = await import('../ai/generateText.js')
            await builtinPromptAI.ensureSession({
                onDownloadProgress: (loaded) => {
                    aiProgress.value = loaded
                    aiStatus.value = 'downloading'
                },
            })
            aiStatus.value = 'available'
            aiProgress.value = 1
            return true
        } catch (err) {
            aiStatus.value = 'unavailable'
            console.error(err)
            return false
        }
    }
    return false
}

// —— One-time migrate legacy host chat API fields into SimpleChat localStorage ——
const migrateHostChatSettingsOnce = (storageKey) => {
    try {
        const lsKey = `${storageKey || 'simplechat'}:settings`
        if (localStorage.getItem(lsKey)) return
        const base = String(settings.value.chatApiBaseUrl || '').trim().replace(/\/+$/, '')
        const model = String(settings.value.chatModel || '').trim()
        const apiKey = String(settings.value.chatApiKey || '').trim()
        const rememberKey = !!settings.value.chatRememberKey
        if (!base && !model && !apiKey) return
        const payload = {
            apiBaseUrl: base,
            model,
            rememberKey,
            systemPrompt: '',
        }
        if (rememberKey && apiKey) payload.apiKey = apiKey
        localStorage.setItem(lsKey, JSON.stringify(payload))
    } catch (e) {
        console.warn('migrateHostChatSettingsOnce failed:', e)
    }
}

/** Clear Mind host settings slot (no longer inject Nano card; SimpleChat owns Chrome AI UI). */
const clearChatHostSettingsSlot = async () => {
    await nextTick()
    let sidebar = chatSidebarRef.value
    if (!sidebar) {
        await nextTick()
        sidebar = chatSidebarRef.value
    }
    if (!sidebar) return
    migrateHostChatSettingsOnce(chatStorageKey.value)
    const el = typeof sidebar.getElement === 'function' ? sidebar.getElement() : null
    if (!el || typeof el.setHostSettingsSlot !== 'function') return
    el.setHostSettingsSlot(null)
}

watch(
    [aiPanelOpen, chatStorageKey],
    async ([open]) => {
        if (!open) return
        await clearChatHostSettingsSlot()
        await armAiPanelClose()
    },
    { flush: 'post' },
)


// -----------------------------------------------------------------------------
// 2. 工具函数 (Helper Functions)
// -----------------------------------------------------------------------------

// 翻译辅助
const t = (key) => messages[settings.value.language]?.[key] ?? key

// 节点数据获取
const getNodeText = (node) => node?.data?.text || (node?.getData?.()?.text) || ''
const getNodeSystemPrompt = (node) => node?.data?.nextSystemPrompt || (node?.getData?.()?.nextSystemPrompt) || ''

// 深拷贝节点数据 (去除uid)
const clonePlain = (value) => {
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(value)
        } catch {
            // DOM-ish values fall back to JSON
        }
    }
    return JSON.parse(JSON.stringify(value))
}

const cloneNodeData = (node) => {
    const raw = node?.getData ? node.getData() : { data: node?.data || {}, children: node?.children || [] }
    const copy = clonePlain(raw)
    const stripUid = (n) => {
        if (n?.data) delete n.data.uid
        if (Array.isArray(n?.children)) n.children.forEach(stripUid)
    }
    stripUid(copy)
    return copy
}

const showCardModal = async () => {
    if (!mindMapRef.value) {
        showError(t('createMapFirst'))
        return
    }
    isCardLoading.value = true
    try {
        const data = mindMapRef.value.getData(true)
        const content = buildCardHtml(data?.root || {})
        const blob = new Blob([content], { type: 'text/html' })
        cardHtmlUrl.value = URL.createObjectURL(blob)
        cardModalOpen.value = true
    } catch (e) {
        showError(t('cardViewFailed') || 'Card View Failed', String(e?.message || e))
    } finally {
        isCardLoading.value = false
    }
}

watch(cardModalOpen, (val) => {
    if (!val && cardHtmlUrl.value) {
        URL.revokeObjectURL(cardHtmlUrl.value)
        cardHtmlUrl.value = ''
    }
})

// 校验是否选中节点
const validateTargetNode = () => {
    if (!mindMapRef.value) {
        showError(t('createMapFirst'))
        return false
    }
    const target = currentNode.value || activeNodes.value?.[0]
    if (!target) {
        showError('未选择节点')
        return false
    }
    return true
}

// -----------------------------------------------------------------------------
// 3. 设置与主题管理 (Settings & Theme Management)
// -----------------------------------------------------------------------------

// 加载/保存设置
const loadSettings = () => {
    try {
        settings.value = loadSettingsFromStorage(settings.value)
        // Cap depth for on-device Nano
        const d = Number(settings.value.depth)
        settings.value.depth = Number.isFinite(d) ? Math.max(1, Math.min(NANO_MAX_COUNT, d)) : 3
        if (settings.value.promptLayers !== 2) settings.value.promptLayers = 1
    } catch (e) {
        console.warn('加载设置失败：', e)
    }
}

const saveSettings = () => {
    try {
        saveSettingsToStorage(settings.value)
        debugLog('设置已保存到 sessionStorage')
    } catch (e) {
        console.error('保存设置失败：', e)
    }
    settingsOpen.value = false
}

// 监听主题变化
let themeConfigTimer = null

watch(
    () => [
        settings.value.backgroundColor,
        settings.value.lineColor,
        settings.value.lineWidth,
        settings.value.lineStyle,
        settings.value.fontFamily,
        settings.value.theme
    ],
    ([bgColor, lineColor, lineWidth, lineStyle, fontFamily, theme], 
    [oldBg, oldLine, oldWidth, oldStyle, oldFont, oldTheme]) => {
        if (mindMapRef.value) {
            if (theme !== oldTheme) {
                if (themeConfigTimer != null) {
                    clearTimeout(themeConfigTimer)
                    themeConfigTimer = null
                }
                mindMapRef.value.setTheme(theme)
                const targetTheme = themeList.find(item => item.value === theme)
                debugLog('targetTheme', targetTheme?.theme)
                if (targetTheme && targetTheme.theme) {
                    settings.value.backgroundColor = targetTheme.theme.backgroundColor
                    settings.value.lineColor = targetTheme.theme.lineColor
                    settings.value.lineWidth = targetTheme.theme.lineWidth
                    const fillColor = targetTheme.theme?.root?.fillColor
                    settings.value.themeRootFillColor = (fillColor == '#fff' || 
                        fillColor == 'rgb(255, 255, 255)' ? '#00c0b8' : fillColor)
                    return
                }
            }
            const applyThemeConfig = () => {
                if (!mindMapRef.value) return
                mindMapRef.value.setThemeConfig({
                    backgroundColor: bgColor,
                    lineColor: lineColor,
                    lineWidth: lineWidth,
                    lineStyle: lineStyle,
                    fontFamily: fontFamily
                })
            }
            if (themeConfigTimer != null) clearTimeout(themeConfigTimer)
            themeConfigTimer = setTimeout(() => {
                themeConfigTimer = null
                applyThemeConfig()
            }, THEME_CONFIG_DEBOUNCE_MS)
        }
    }
)

// -----------------------------------------------------------------------------
// 4. UI 交互控制 (UI Interaction Control)
// -----------------------------------------------------------------------------

const toggleSettings = () => {
    settingsOpen.value = !settingsOpen.value
}

const isExpanding = ref(false)

const expandSystemPrompt = async () => {
    if (isExpanding.value) return

    isExpanding.value = true
    try {
        const ready = await ensureAiReady()
        if (!ready) {
            showError(t('builtinAIUnavailable'))
            return
        }
        const content = await expandPrompt({
            currentPrompt: settings.value.systemPrompt,
            language: settings.value.language,
            onDownloadProgress: (loaded) => {
                aiProgress.value = loaded
                aiStatus.value = 'downloading'
            },
        })

        if (content) {
            settings.value.systemPrompt = content
        }
    } catch (e) {
        console.error(e)
        showError(t('aiGenerateFailed').replace('{msg}', e?.message || String(e)))
    } finally {
        isExpanding.value = false
    }
}

const openExportPanel = () => {
    settingsOpen.value = true
    activeKey.value = 'export'
}

const hideContextMenu = () => { show.value = false }

// -----------------------------------------------------------------------------
// 5. 视图与布局控制 (View & Layout Control)
// -----------------------------------------------------------------------------

// 缩放控制
const applyZoom = (next) => {
    const mm = mindMapRef.value
    const clamped = Math.min(2, Math.max(0.2, Number(next) || 1))
    zoom.value = clamped
    if (!mm) return
    const v = mm.view

    if (v && typeof v.setScale === 'function') {
        v.setScale(clamped)
        return
    }
    if (v && typeof v.scale === 'function') {
        v.scale(clamped)
        return
    }
    const el = document.getElementById('mindMapContainer')
    if (el) {
        el.style.transform = `scale(${clamped})`
        el.style.transformOrigin = 'top left'
    }
}

const zoomIn = () => applyZoom(zoom.value + 0.1)
const zoomOut = () => applyZoom(zoom.value - 0.1)

// 布局控制
const layouts = layoutOptions
const applyLayout = (key) => {
    if (!mindMapRef.value) return
    mindMapRef.value.setLayout(key)
    mindMapRef.value.view.reset()
    settings.value.layout = key
}

// 模式切换
const toggleMindMapMode = () => {
    const mm = mindMapRef.value
    if (!mm) {
        showError('请先创建一个思维导图')
        return
    }
    const nextMode = isDetailMode.value ? 'simple' : 'detail'
    switchTextNoteMode(mindMapRef.value, nextMode)
    isDetailMode.value = !isDetailMode.value
}

// 历史记录
const back = () => {
    if (!mindMapRef.value) return
    mindMapRef.value.execCommand('BACK')
}

const forward = () => {
    if (!mindMapRef.value) return
    mindMapRef.value.execCommand('FORWARD')
}

// -----------------------------------------------------------------------------
// 6. 节点操作 (Node Operations)
// -----------------------------------------------------------------------------

const addChildNode = () => {
    if (!validateTargetNode()) return
    const target = currentNode.value || activeNodes.value?.[0]
    mindMapRef.value.execCommand('INSERT_CHILD_NODE', false, [target])
    hideContextMenu()
}

const removeCurrentNode = () => {
    if (!validateTargetNode()) return
    const target = currentNode.value || activeNodes.value?.[0]
    mindMapRef.value.execCommand('REMOVE_CURRENT_NODE', false, [target])
    hideContextMenu()
}

const removeNode = () => {
    if (!validateTargetNode()) return
    const target = currentNode.value || activeNodes.value?.[0]
    mindMapRef.value.execCommand('REMOVE_NODE', false, [target])
    hideContextMenu()
}

const copyNode = () => {
    if (!validateTargetNode()) return
    const target = currentNode.value || activeNodes.value?.[0]
    clipboardData.value = cloneNodeData(target)
    hideContextMenu()
}

const cutNode = () => {
    if (!validateTargetNode()) return
    const target = currentNode.value || activeNodes.value?.[0]
    clipboardData.value = cloneNodeData(target)
    mindMapRef.value.execCommand('REMOVE_NODE', false, [target])
    hideContextMenu()
}

const pasteNode = () => {
    if (!validateTargetNode() || !clipboardData.value) return
    const { data, children = [] } = clipboardData.value
    const target = currentNode.value || activeNodes.value?.[0]
    mindMapRef.value.execCommand('INSERT_CHILD_NODE', false, [target], data, children)
    hideContextMenu()
}

const markNode = (isMarked = false) => {
    if (!validateTargetNode()) return
    const target = currentNode.value || activeNodes.value?.[0]
    const icons = isMarked ? ['icon_mark'] : []
    mindMapRef.value.execCommand('SET_NODE_ICON', target, icons)
    hideContextMenu()
}

// -----------------------------------------------------------------------------
// 7. 文件与数据操作 (File & Data Operations)
// -----------------------------------------------------------------------------

const newMap = async (tpl) => {
    if (!mindMapRef.value) {
        showError(t('createMapFirst'))
        return
    }
    try {
        let data = { data: { text: '主题' }, children: [] }
        if (typeof tpl === 'string') {
            const s = tpl.trim()
            if (s.startsWith('{') || s.startsWith('[')) {
                data = JSON.parse(s)
            } else {
                const loaded = await loadExampleTemplate(s)
                if (loaded) {
                    data = loaded
                } else {
                    const res = await fetch(s)
                    if (!res.ok) throw new Error(`模板加载失败，HTTP ${res.status}`)
                    const text = await res.text()
                    data = JSON.parse(text)
                }
            }
        } else if (tpl && typeof tpl === 'object') {
            data = (tpl && tpl.data) || { data: { text: '主题' }, children: [] }
        }
        mindMapRef.value.setData(data)
        mindMapRef.value.view.reset()
        refreshMapChatId()
    } catch (e) {
        showError(t('templateImportFailed'), String(e?.message || e))
    }
    isDetailMode.value = false
}

const exportMap = (type) => {
    return exportMindMap(mindMapRef.value, type)
}

const handleBeforeUpload = async (file) => {
    await importFileToMindMap(file, mindMapRef.value)
    return false
}

const handleParsePromptUpload = async (file) => {
    try {
        const content = await parseFileAsPrompt(file)
        settings.value.systemPrompt = content
    } catch (e) {
        showError(t('parseFailed'), String(e?.message || e))
    }
    return false
}

// -----------------------------------------------------------------------------
// 8. AI 生成功能 (AI Generation)
// -----------------------------------------------------------------------------

const buildCurrentAiPrompt = () => {
    const baseNode = activeNodes.value?.[0]
    const baseText = getNodeText(baseNode)
    const nodeSystemPrompt = getNodeSystemPrompt(baseNode)
    const count = Math.max(1, Math.min(NANO_MAX_COUNT, Number(settings.value.depth) || 3))
    return {
        baseText,
        count,
        prompt: libBuildPrompt(
            baseText,
            count,
            nodeSystemPrompt,
            settings.value.systemPrompt,
            settings.value
        ),
    }
}

/** Toolbar「AI生成」: open / focus SimpleChat sidebar (primary UX). */
const aiGenerate = () => {
    aiPanelOpen.value = true
}

/** Secondary: open BuiltinPromptAI prompt modal (kept for confirmAiGenerate flow). */
const openBuiltinAiPrompt = async () => {
    if (isGenerating.value) return
    aiPanelOpen.value = true

    if (!mindMapRef.value) {
        showError(t('createMapFirst'))
        return
    }

    const avail = await refreshAiAvailability()
    if (aiStatus.value === 'unavailable') {
        showError(t('builtinAIUnavailable'))
        return
    }

    const { baseText, prompt } = buildCurrentAiPrompt()
    if (!baseText || baseText.trim().length === 0) {
        showError('请先选择一个节点或者输入一个主题')
        return
    }

    aiPromptText.value = prompt
    aiPromptOpen.value = true
}

const closeAiPromptModal = () => {
    if (isGenerating.value) {
        aiPromptOpen.value = true
        return
    }
    aiPromptOpen.value = false
}

const confirmAiGenerate = async () => {
    if (isGenerating.value) return

    const prompt = (aiPromptText.value || '').trim()
    if (!prompt) {
        showError(t('aiPromptEmpty'))
        return
    }
    if (!mindMapRef.value) {
        showError(t('createMapFirst'))
        return
    }

    isGenerating.value = true
    debugLog('AI Prompt:', prompt)
    try {
        const ready = await ensureAiReady()
        if (!ready) {
            showError(t('builtinAIUnavailable'))
            return
        }

        const { generateText } = await import('../ai/generateText.js')
        let text = await generateText(prompt, {
            onDownloadProgress: (loaded) => {
                aiProgress.value = loaded
                aiStatus.value = 'downloading'
            },
        })

        let ideas
        try {
            ideas = libExtractIdeas(text)
        } catch (parseErr) {
            // Nano fallback: retry once with forced 1-layer / smaller count
            if (settings.value.promptLayers !== 1) {
                settings.value.promptLayers = 1
            }
            const retryPrompt = libBuildPrompt(
                getNodeText(activeNodes.value?.[0]),
                2,
                getNodeSystemPrompt(activeNodes.value?.[0]),
                settings.value.systemPrompt,
                { ...settings.value, promptLayers: 1 },
            )
            text = await generateText(retryPrompt, {
                onDownloadProgress: (loaded) => {
                    aiProgress.value = loaded
                    aiStatus.value = 'downloading'
                },
            })
            ideas = libExtractIdeas(text)
        }

        debugLog('解析到子节点：', ideas?.length)
        if (ideas?.length) {
            mindMapRef.value.execCommand('INSERT_MULTI_CHILD_NODE', [], ideas)
            aiPromptOpen.value = false
            aiStatus.value = 'available'
        } else {
            showError(t('aiNoContent'))
        }
    } catch (err) {
        const msg = err?.message || String(err)
        showError(t('aiGenerateFailed').replace('{msg}', msg))
        console.error('AI生成失败：', err)
    } finally {
        isGenerating.value = false
    }
}

// -----------------------------------------------------------------------------
// 9. 生命周期 (Lifecycle)
// -----------------------------------------------------------------------------


watch(aiPanelOpen, (open) => {
    persistAiPanelOpen(open)
    if (open) {
        applyAiPanelWidth(aiPanelWidth.value || loadSidebarWidth())
    } else {
        aiPanelCloseArmed.value = false
    }
}, { immediate: true })

onMounted(async () => {
    loadSettings()
    applyAiPanelWidth(loadSidebarWidth(), { resizeMap: false })
    refreshAiAvailability()
    if (aiPanelOpen.value) {
        void clearChatHostSettingsSlot()
        void armAiPanelClose()
    }
    const blankData = {
        data: { text: '主题' },
        children: []
    }
    let initialData = loadMindMapData(blankData)
    let initialLayout = settings.value.layout || 'mindMap'
    const pending = consumePendingEditorAction()
    if (pending?.type === 'create') {
        initialData = blankData
        try { saveMindMapData(blankData) } catch {}
    } else if (pending?.type === 'template' && pending.content) {
        try {
            const loaded = await loadExampleTemplate(pending.content)
            if (loaded) {
                initialData = loaded
                try { saveMindMapData(loaded) } catch {}
            }
            if (pending.layout) {
                initialLayout = pending.layout
                settings.value.layout = pending.layout
            }
            if (pending.thinkingModel) {
                settings.value.thinkingModel = pending.thinkingModel
            }
            saveSettings()
        } catch (e) {
            console.warn('加载模板失败：', e)
        }
    } else if (route.query?.template) {
        try {
            const loaded = await loadExampleTemplate(String(route.query.template))
            if (loaded) {
                initialData = loaded
                try { saveMindMapData(loaded) } catch {}
            }
            if (route.query.layout) {
                initialLayout = String(route.query.layout)
                settings.value.layout = initialLayout
            }
        } catch (e) {
            console.warn('加载模板失败：', e)
        }
    }

    const mindMap = new MindMap({
        el: document.getElementById('mindMapContainer'),
        enableFreeDrag: true,
        mousewheelAction: 'zoom',
        mousewheelZoomActionReverse: true,
        layout: initialLayout || 'mindMap',
        theme: settings.value.theme || '',
        data: initialData,
        iconList: iconList,
    });
    mindMapRef.value = mindMap

    // 初始化主题设置
    mindMap.setThemeConfig({
        backgroundColor: settings.value.backgroundColor,
        lineColor: settings.value.lineColor,
        lineWidth: settings.value.lineWidth,
        lineStyle: settings.value.lineStyle,
        fontFamily: settings.value.fontFamily
    })

    // 初始化缩放
    try {
        const v = mindMapRef.value?.view
        const initialScale = (v && typeof v.scale === 'number') ? v.scale : 1
        applyZoom(initialScale || 1)
    } catch {
        applyZoom(1)
    }

    refreshMapChatId()

    mindMap.on('node_active', (node, activeNodeList) => {
        activeNodes.value = activeNodeList || (node ? [node] : [])
    })

    // 节点右键菜单
    mindMap.on('node_contextmenu', (e, node) => {
        e.preventDefault?.()
        e.stopPropagation?.()
        type.value = 'node'
        left.value = e.clientX + 10
        top.value = e.clientY + 10
        show.value = true
        currentNode.value = node
    })

    const flushPendingMindMap = () => {
        try {
            flushMindMapSave()
        } catch (e) {
            console.warn('写入 sessionStorage 失败：', e)
        }
    }

    const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') flushPendingMindMap()
    }

    // 数据变更时防抖写入 sessionStorage，隐藏标签页时立即 flush
    mindMap.on('data_change', (data) => {
        try {
            scheduleMindMapSave(data)
        } catch (e) {
            console.warn('写入 sessionStorage 失败：', e)
        }
    })

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', flushPendingMindMap)

    // 点击其他位置关闭右键菜单
    document.addEventListener('click', hideContextMenu)

    onUnmounted(() => {
        if (themeConfigTimer != null) {
            clearTimeout(themeConfigTimer)
            themeConfigTimer = null
        }
        flushPendingMindMap()
        document.removeEventListener('visibilitychange', onVisibilityChange)
        window.removeEventListener('pagehide', flushPendingMindMap)
        document.removeEventListener('click', hideContextMenu)
    })
})
</script>