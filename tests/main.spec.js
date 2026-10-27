import { describe, expect, it, vi } from 'vitest'

const mount = vi.fn()
const use = vi.fn()
const createApp = vi.fn(() => ({ mount, use }))

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    createApp,
  }
})

vi.mock('../src/App.vue', () => ({
  default: { name: 'App' },
}))

vi.mock('../src/router', () => ({
  default: { name: 'router' },
}))

describe('main.js', () => {
  it('creates the Vue app, installs router, and mounts #app', async () => {
    await import('../src/main.js')
    expect(createApp).toHaveBeenCalled()
    expect(use).toHaveBeenCalledWith({ name: 'router' })
    expect(mount).toHaveBeenCalledWith('#app')
  })
})
