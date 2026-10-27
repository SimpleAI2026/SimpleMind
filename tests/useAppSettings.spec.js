import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

const storageMocks = vi.hoisted(() => ({
  loadSettings: vi.fn((defaults) => ({ ...defaults, theme: '', language: 'zh-CN' })),
  saveSettings: vi.fn(),
}))

vi.mock('../src/storage.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    loadSettings: storageMocks.loadSettings,
    saveSettings: storageMocks.saveSettings,
  }
})

vi.mock('../src/utils.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getThemeList: vi.fn(() => [
      {
        name: '默认',
        value: '',
        theme: { backgroundColor: '#f5f5f5', lineColor: '#549688', lineWidth: 2 },
      },
      {
        name: 'mint',
        value: 'mint',
        theme: {
          backgroundColor: '#e0f2f1',
          lineColor: '#43a047',
          lineWidth: 2,
          root: { fillColor: '#fff' },
        },
      },
      {
        name: 'dark',
        value: 'dark',
        dark: true,
        theme: {
          backgroundColor: '#111',
          lineColor: '#eee',
          lineWidth: 1,
          root: { fillColor: 'rgb(255, 255, 255)' },
        },
      },
      {
        name: 'accent',
        value: 'accent',
        theme: {
          backgroundColor: '#222',
          lineColor: '#333',
          root: { fillColor: '#abcdef' },
        },
      },
      {
        name: 'empty-theme',
        value: 'empty-theme',
        theme: {},
      },
      {
        name: 'no-theme',
        value: 'no-theme',
      },
    ]),
  }
})

describe('useAppSettings', () => {
  beforeEach(() => {
    storageMocks.loadSettings.mockImplementation((defaults) => ({
      ...defaults,
      theme: '',
      language: 'zh-CN',
    }))
    storageMocks.saveSettings.mockReset()
  })

  it('maps theme colors into css vars and persists theme changes', async () => {
    const { useAppSettings } = await import('../src/composables/useAppSettings.js')
    const { settings, homeCssVars, persist } = useAppSettings()
    expect(homeCssVars.value['--home-bg']).toBeTruthy()

    settings.value.theme = 'mint'
    await nextTick()
    expect(settings.value.themeRootFillColor).toBe('#00c0b8')
    expect(storageMocks.saveSettings).toHaveBeenCalled()

    settings.value.theme = 'dark'
    await nextTick()
    expect(homeCssVars.value['--home-fg']).toBe('#f5f5f5')

    settings.value.theme = 'accent'
    await nextTick()
    expect(settings.value.themeRootFillColor).toBe('#abcdef')

    storageMocks.saveSettings.mockImplementationOnce(() => {
      throw new Error('fail')
    })
    persist()
    expect(console.warn).toHaveBeenCalled()
  })

  it('covers theme fallback branches', async () => {
    const { useAppSettings } = await import('../src/composables/useAppSettings.js')
    const { settings, homeCssVars } = useAppSettings()

    settings.value.theme = 'empty-theme'
    await nextTick()
    expect(homeCssVars.value['--home-bg']).toBeTruthy()

    settings.value.theme = 'no-theme'
    await nextTick()
    expect(homeCssVars.value['--home-accent']).toBeTruthy()

    settings.value.theme = 'missing'
    await nextTick()
    expect(homeCssVars.value['--home-line']).toBeTruthy()
  })
})
