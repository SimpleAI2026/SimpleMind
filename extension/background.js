// Open SimpleMind in a normal Chrome tab (full viewport). Right-side AI lives in-page.
const APP_PATH = 'index.html'

async function openOrFocusAppTab() {
  const base = chrome.runtime.getURL(APP_PATH)
  const originPattern = `chrome-extension://${chrome.runtime.id}/*`
  let existing = []
  try {
    existing = await chrome.tabs.query({ url: [base, `${base}?*`, `${base}#*`, originPattern] })
  } catch {
    try {
      existing = await chrome.tabs.query({ url: originPattern })
    } catch {
      existing = []
    }
  }

  if (existing.length > 0) {
    const tab = existing[0]
    await chrome.tabs.update(tab.id, { active: true })
    if (tab.windowId != null) {
      try {
        await chrome.windows.update(tab.windowId, { focused: true })
      } catch {
        /* windows focus is best-effort */
      }
    }
    return
  }

  await chrome.tabs.create({ url: base })
}

chrome.action.onClicked.addListener(() => {
  openOrFocusAppTab().catch((err) => console.warn('openOrFocusAppTab failed', err))
})
