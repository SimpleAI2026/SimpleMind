import { describe, expect, it } from 'vitest'
import router from '../src/router/index.js'

describe('router', () => {
  it('exposes home and editor routes', () => {
    const names = router.getRoutes().map((r) => r.name)
    expect(names).toEqual(expect.arrayContaining(['home', 'editor']))
    expect(router.resolve('/').name).toBe('home')
    expect(router.resolve('/map').name).toBe('editor')
  })
})
