import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import HomeView from '../src/views/HomeView.vue'

const storageMocks = vi.hoisted(() => ({
  loadSettings: vi.fn((defaults) => ({ ...defaults, theme: 'mint', language: 'zh-CN' })),
  saveSettings: vi.fn(),
  setPendingEditorAction: vi.fn(),
  consumePendingEditorAction: vi.fn(() => null),
}))

vi.mock('../src/storage.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    loadSettings: storageMocks.loadSettings,
    saveSettings: storageMocks.saveSettings,
    setPendingEditorAction: storageMocks.setPendingEditorAction,
    consumePendingEditorAction: storageMocks.consumePendingEditorAction,
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
          root: { fillColor: '#00c0b8' },
        },
      },
    ]),
  }
})

const mountHome = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/map', name: 'editor', component: { template: '<div>editor</div>' } },
    ],
  })
  await router.push('/')
  await router.isReady()
  const wrapper = mount(HomeView, {
    attachTo: document.body,
    global: { plugins: [router] },
  })
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => {
  storageMocks.loadSettings.mockImplementation((defaults) => ({
    ...defaults,
    theme: 'mint',
    language: 'zh-CN',
  }))
  storageMocks.saveSettings.mockReset()
  storageMocks.setPendingEditorAction.mockReset()
  document.body.innerHTML = ''
})

describe('HomeView', () => {
  it('renders brand left, language/theme controls, create card first, then templates', async () => {
    const { wrapper } = await mountHome()
    expect(wrapper.find('.home-brand').text()).toBe('SimpleMind')
    expect(wrapper.find('.home-controls').exists()).toBe(true)
    const cards = wrapper.findAll('.home-card')
    expect(cards.length).toBeGreaterThan(1)
    expect(cards[0].classes()).toContain('home-card-create')
    expect(cards[0].text()).toContain('创建')
    expect(wrapper.find('.home-card-plus').exists()).toBe(true)
    wrapper.unmount()
  })

  it('navigates to editor on create and template clicks', async () => {
    const { wrapper, router } = await mountHome()
    await wrapper.find('.home-card-create').trigger('click')
    await flushPromises()
    expect(storageMocks.setPendingEditorAction).toHaveBeenCalledWith({ type: 'create' })
    expect(router.currentRoute.value.name).toBe('editor')

    await router.push('/')
    await flushPromises()
    storageMocks.setPendingEditorAction.mockClear()
    const templateCard = wrapper.findAll('.home-card').find((c) => !c.classes().includes('home-card-create'))
    await templateCard.trigger('click')
    await flushPromises()
    expect(storageMocks.setPendingEditorAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'template', content: expect.any(String) }),
    )
    expect(router.currentRoute.value.name).toBe('editor')
    expect(router.currentRoute.value.query.template).toBeTruthy()
    wrapper.unmount()
  })

  it('does not expose thinking-template drawer UI', async () => {
    const { wrapper } = await mountHome()
    expect(wrapper.text()).not.toContain('设置思考模版')
    expect(wrapper.findComponent({ name: 'ADrawer' }).exists()).toBe(false)
    wrapper.unmount()
  })

  it('persists language/theme changes from the header controls', async () => {
    const { wrapper } = await mountHome()
    const selects = wrapper.findAllComponents({ name: 'ASelect' })
    expect(selects.length).toBeGreaterThanOrEqual(2)
    await selects[0].vm.$emit('update:value', 'en-US')
    await selects[1].vm.$emit('update:value', '')
    await flushPromises()
    expect(storageMocks.saveSettings).toHaveBeenCalled()
    expect(wrapper.find('.home-card-create').text()).toContain('Create')
    wrapper.unmount()
  })
})
