/**
 * Local Vue 3 wrapper for vendored <simple-chat>.
 * Side-effect import registers the custom element from src/vendor/simplechat.
 */
import {
  defineComponent,
  h,
  onMounted,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'
import '@/vendor/simplechat/simplechat.min.js'

export const SimpleChatSidebar = defineComponent({
  name: 'SimpleChatSidebar',
  props: {
    open: { type: Boolean, default: true },
    config: { type: Object, default: () => ({}) },
    tools: { type: Array, default: () => [] },
    storageKey: { type: String, default: 'simplechat' },
    layout: { type: String, default: 'sidebar' },
    position: { type: String, default: 'right' },
    className: { type: String, default: '' },
    themeId: { type: String, default: '' },
    theme: { type: String, default: '' },
    themeCss: { type: String, default: '' },
    themeStyle: { type: Object, default: () => ({}) },
  },
  emits: ['update:open', 'close', 'resize'],
  setup(props, { emit, expose }) {
    const elRef = ref(null)
    let syncedToolKey = ''

    function resolvedThemeId() {
      return (props.themeId || props.theme || '').trim()
    }

    function getElement() {
      return elRef.value
    }

    function toolsKey(tools) {
      return (tools || []).map((t) => t.name).join('\0')
    }

    function syncTools(el, force = false) {
      const key = toolsKey(props.tools)
      if (!force && key === syncedToolKey) return
      syncedToolKey = key
      for (const t of props.tools || []) el.registerTool(t)
    }

    function applyConfigAndTheme() {
      const el = elRef.value
      if (!el) return
      const cfg = props.config || {}
      if (typeof el.setConfig === 'function') {
        el.setConfig({
          apiBaseUrl: cfg.apiBaseUrl ?? '',
          apiKey: cfg.apiKey ?? '',
          model: cfg.model ?? '',
          systemPrompt: cfg.systemPrompt,
          temperature: cfg.temperature,
          maxTokens: cfg.maxTokens,
          headers: cfg.headers,
        })
      }
      if (cfg.apiKey) el.apiKey = cfg.apiKey
      if (cfg.systemPrompt != null) el.systemPrompt = cfg.systemPrompt

      const tid = resolvedThemeId()
      if (tid && typeof el.setTheme === 'function') {
        el.setTheme(tid, { persist: false })
      } else if (tid) {
        el.setAttribute('theme-id', tid)
      }

      if (typeof el.applyThemeCss === 'function') {
        el.applyThemeCss(props.themeCss || '')
      }
    }

    function applyAll(forceTools = false) {
      const el = elRef.value
      if (!el) return
      applyConfigAndTheme()
      syncTools(el, forceTools)
      el.open = props.open
    }

    function onClose() {
      emit('update:open', false)
      emit('close')
    }

    function onResize(e) {
      const detail = e?.detail
      const width = Number(detail?.width)
      if (Number.isFinite(width)) emit('resize', { width })
    }

    onMounted(() => {
      applyAll(true)
      // sc-close is handled via vnode onScClose only (avoid double emit → open flicker)
      elRef.value?.addEventListener('sc-resize', onResize)
    })

    onBeforeUnmount(() => {
      elRef.value?.removeEventListener('sc-resize', onResize)
    })

    watch(
      () => [
        props.config?.apiBaseUrl,
        props.config?.apiKey,
        props.config?.model,
        props.config?.systemPrompt,
        props.open,
        props.themeCss,
        props.themeId,
        props.theme,
      ],
      () => applyConfigAndTheme(),
    )

    watch(
      () => props.open,
      (v) => {
        if (elRef.value) elRef.value.open = v
      },
    )

    watch(
      () => (props.tools || []).map((t) => t.name).join('\0'),
      () => {
        if (elRef.value) syncTools(elRef.value, true)
      },
    )

    expose({
      getElement,
      setTheme: (id) => elRef.value?.setTheme?.(id),
      setToolStyle: (style, opts) => elRef.value?.setToolStyle?.(style, opts),
      getUiStyle: () => elRef.value?.getUiStyle?.(),
      getToolStyle: () => elRef.value?.getToolStyle?.(),
      setHostSettingsSlot: (el) => elRef.value?.setHostSettingsSlot?.(el),
      getWidth: () => elRef.value?.getWidth?.(),
      setWidth: (width, opts) => elRef.value?.setWidth?.(width, opts),
    })

    return () =>
      h('simple-chat', {
        ref: elRef,
        class: props.className,
        style: props.themeStyle || undefined,
        open: props.open,
        layout: props.layout,
        position: props.position,
        'storage-key': props.storageKey,
        'api-base-url': props.config?.apiBaseUrl ?? '',
        model: props.config?.model ?? '',
        'theme-id': resolvedThemeId() || undefined,
        onScClose: onClose,
      })
  },
})

export default SimpleChatSidebar
