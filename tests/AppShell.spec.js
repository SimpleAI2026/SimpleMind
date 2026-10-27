import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../src/App.vue'
import HomeView from '../src/views/HomeView.vue'

vi.mock('../src/storage.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    loadSettings: vi.fn((defaults) => ({ ...defaults, theme: 'mint', language: 'zh-CN' })),
    saveSettings: vi.fn(),
  }
})

describe('App shell', () => {
  it('renders the active route via router-view', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: HomeView },
        { path: '/map', name: 'editor', component: { template: '<div class="editor-stub">map</div>' } },
      ],
    })
    await router.push('/')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.find('.home-brand').exists()).toBe(true)
    await router.push('/map')
    await flushPromises()
    expect(wrapper.find('.editor-stub').text()).toBe('map')
    wrapper.unmount()
  })
})
