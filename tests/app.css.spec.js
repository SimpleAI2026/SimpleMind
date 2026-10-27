import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../public/app.css'),
  'utf8',
)

function declarations(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`))
  expect(match, `missing CSS rule for ${selector}`).toBeTruthy()
  return match[1].replace(/\s+/g, ' ').trim()
}

describe('modal header backgrounds', () => {
  it('card modal header uses the card page token instead of Ant Design white', () => {
    const body = declarations(
      '.card-modal-wrap .ant-modal .ant-modal-content .ant-modal-header',
    )
    expect(body).toMatch(/background:\s*var\(--card-page-bg\)/)
    expect(body).not.toMatch(/background:\s*#fff/i)
  })

  it('card modal content and body share the same page token as the header', () => {
    expect(declarations('.card-modal-wrap .ant-modal .ant-modal-content')).toMatch(
      /background:\s*var\(--card-page-bg\)/,
    )
    expect(
      declarations('.card-modal-wrap .ant-modal .ant-modal-content .ant-modal-body'),
    ).toMatch(/background:\s*var\(--card-page-bg\)/)
  })

  it('AI prompt modal header is transparent so it blends with content', () => {
    const body = declarations(
      '.ai-prompt-modal-wrap .ant-modal .ant-modal-content .ant-modal-header',
    )
    expect(body).toMatch(/background:\s*transparent/)
  })

  it('settings modal header stays hidden', () => {
    expect(declarations('.settings-modal-wrap .ant-modal-header')).toMatch(
      /display:\s*none/,
    )
  })

  it('settings modal content uses chrome background instead of harsh white', () => {
    const body = declarations(
      '.settings-modal-wrap .ant-modal .ant-modal-content',
    )
    expect(body).toMatch(/background:\s*var\(--chrome-bg\)/)
    expect(body).toMatch(/border-radius:\s*12px/)
    expect(body).not.toMatch(/background:\s*#fff/i)
  })

  it('settings modal body scrolls within a capped height', () => {
    const body = declarations('.settings-modal-wrap .ant-modal-body')
    expect(body).toMatch(/max-height:\s*min\(72vh,\s*640px\)/)
    expect(body).toMatch(/overflow-y:\s*auto/)
  })
})

describe('settings modal tabs', () => {
  it('tab nav clears the close button and spaces below the ink bar', () => {
    const body = declarations('.settings-modal-wrap .ant-tabs > .ant-tabs-nav')
    expect(body).toMatch(/padding-inline-end:\s*36px/)
    expect(body).toMatch(/margin:\s*0 0 var\(--space-3\)/)
  })

  it('active tab uses primary color with stronger weight', () => {
    const body = declarations(
      '.settings-modal-wrap .ant-tabs .ant-tabs-tab-active .ant-tabs-tab-btn',
    )
    expect(body).toMatch(/color:\s*var\(--color-primary\)/)
    expect(body).toMatch(/font-weight:\s*600/)
  })

  it('ink bar matches the primary accent', () => {
    const body = declarations('.settings-modal-wrap .ant-tabs .ant-tabs-ink-bar')
    expect(body).toMatch(/background:\s*var\(--color-primary\)/)
    expect(body).toMatch(/height:\s*2px/)
  })

  it('tab panes share a consistent minimum content height', () => {
    expect(declarations('.settings-modal-wrap .ant-tabs-tabpane')).toMatch(
      /min-height:\s*120px/,
    )
  })
})

describe('card modal chrome polish', () => {
  it('card modal content uses chrome border, radius, shadow, and blur', () => {
    const body = declarations('.card-modal-wrap .ant-modal .ant-modal-content')
    expect(body).toMatch(/background:\s*var\(--card-page-bg\)/)
    expect(body).toMatch(/border:\s*1px solid var\(--chrome-border\)/)
    expect(body).toMatch(/border-radius:\s*12px/)
    expect(body).toMatch(/box-shadow:\s*var\(--chrome-shadow\)/)
    expect(body).toMatch(/backdrop-filter:\s*blur\(8px\)/)
  })

  it('card modal header divider uses chrome divider token', () => {
    const body = declarations(
      '.card-modal-wrap .ant-modal .ant-modal-content .ant-modal-header',
    )
    expect(body).toMatch(/border-bottom:\s*1px solid var\(--chrome-divider\)/)
  })

  it('card modal close button matches settings hover treatment', () => {
    const base = declarations('.card-modal-wrap .ant-modal-close')
    expect(base).toMatch(/color:\s*var\(--chrome-text\)/)
    expect(base).toMatch(/top:\s*12px/)

    const hover = declarations('.card-modal-wrap .ant-modal-close:hover')
    expect(hover).toMatch(/background:\s*var\(--chrome-hover\)/)
    expect(hover).toMatch(/color:\s*var\(--card-page-text\)/)
  })

  it('card modal title uses chrome-aligned typography', () => {
    const body = declarations('.card-modal-wrap .ant-modal-title')
    expect(body).toMatch(/font-weight:\s*600/)
    expect(body).toMatch(/font-size:\s*15px/)
    expect(body).toMatch(/color:\s*var\(--card-page-text\)/)
  })
})
