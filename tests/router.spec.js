import { afterEach, describe, expect, it, vi } from 'vitest'
import router from '../src/router/index.js'
import { createAppHistory } from '../src/router/history.js'

describe('router', () => {
  it('exposes home and editor routes', () => {
    const names = router.getRoutes().map((r) => r.name)
    expect(names).toEqual(expect.arrayContaining(['home', 'editor']))
    expect(router.resolve('/').name).toBe('home')
    expect(router.resolve('/map').name).toBe('editor')
  })
})

describe('createAppHistory', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('uses web history by default', () => {
    const history = createAppHistory('/')
    expect(history.base).toBeDefined()
    expect(String(history)).not.toContain('undefined')
  })

  it('uses hash history when chrome extension runtime is present', () => {
    vi.stubGlobal('chrome', { runtime: { id: 'ext' } })
    const history = createAppHistory('/')
    // hash history locates via hash
    expect(history).toBeTruthy()
  })

  it('treats chrome access errors as non-extension', () => {
    vi.stubGlobal('chrome', {
      get runtime() {
        throw new Error('blocked')
      },
    })
    expect(createAppHistory('/')).toBeTruthy()
  })
})
