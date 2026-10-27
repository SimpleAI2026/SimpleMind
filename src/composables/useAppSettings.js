import { computed, ref, watch } from 'vue'
import { loadSettings, saveSettings } from '../storage.js'
import { getThemeList } from '../utils.js'
import { ENV_API, ENV_SECRET, ENV_MODEL } from '../utils.js'
import { DEFAULT_MODEL } from '../const.js'

const DEFAULT_CANVAS_BACKGROUND = '#f5f5f5'
const DEFAULT_LINE_COLOR = '#549688'

const defaults = {
  api: ENV_API || '',
  secret: ENV_SECRET || '',
  model: ENV_MODEL || DEFAULT_MODEL,
  temperature: 0.6,
  systemPrompt: '',
  depth: 5,
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
}

/** Shared settings for Home / Editor (sessionStorage backed). */
export function useAppSettings() {
  const themeList = getThemeList()
  const settings = ref(loadSettings({ ...defaults }))

  const persist = () => {
    try {
      saveSettings(settings.value)
    } catch (e) {
      console.warn('保存设置失败：', e)
    }
  }

  watch(
    () => [settings.value.language, settings.value.theme],
    () => {
      const target = themeList.find((item) => item.value === settings.value.theme)
      if (target?.theme) {
        settings.value.backgroundColor = target.theme.backgroundColor || DEFAULT_CANVAS_BACKGROUND
        settings.value.lineColor = target.theme.lineColor || DEFAULT_LINE_COLOR
        if (target.theme.lineWidth != null) settings.value.lineWidth = target.theme.lineWidth
        const fillColor = target.theme?.root?.fillColor
        settings.value.themeRootFillColor =
          fillColor === '#fff' || fillColor === 'rgb(255, 255, 255)'
            ? '#00c0b8'
            : fillColor || settings.value.themeRootFillColor || '#00c0b8'
      }
      persist()
    },
  )

  const homeCssVars = computed(() => {
    const target = themeList.find((item) => item.value === settings.value.theme)
    const theme = target?.theme || {}
    const bg = theme.backgroundColor || settings.value.backgroundColor || DEFAULT_CANVAS_BACKGROUND
    const line = theme.lineColor || settings.value.lineColor || DEFAULT_LINE_COLOR
    let accent = theme?.root?.fillColor || settings.value.themeRootFillColor || '#00c0b8'
    if (accent === '#fff' || accent === 'rgb(255, 255, 255)') accent = '#00c0b8'
    const dark = !!target?.dark
    return {
      '--home-bg': bg,
      '--home-accent': accent,
      '--home-line': line,
      '--home-fg': dark ? '#f5f5f5' : '#1f2937',
      '--home-muted': dark ? 'rgba(255,255,255,0.65)' : 'rgba(31,41,55,0.65)',
      '--home-card-bg': dark ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.92)',
      '--home-card-border': dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
      '--home-grid': dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
      '--color-primary': accent,
    }
  })

  return {
    settings,
    themeList,
    homeCssVars,
    persist,
    DEFAULT_CANVAS_BACKGROUND,
  }
}
