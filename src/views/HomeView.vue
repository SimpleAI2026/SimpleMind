<template>
  <a-config-provider
    :theme="{
      token: {
        colorPrimary: settings.themeRootFillColor || '#00c0b8',
        borderRadius: 8,
      },
    }"
  >
    <div class="home-shell" :style="homeCssVars">
      <header class="home-header">
        <div class="home-brand">SimpleMind</div>
        <div class="home-controls">
          <a-select
            class="home-select"
            v-model:value="settings.language"
            :options="languageOptions"
            :aria-label="t('language')"
          />
          <a-select
            class="home-select home-select-theme"
            v-model:value="settings.theme"
            :aria-label="t('theme')"
          >
            <a-select-option
              v-for="item in themeList"
              :key="item.value === '' ? '__default__' : item.value"
              :value="item.value"
              :style="{
                backgroundColor: item.theme?.backgroundColor || DEFAULT_CANVAS_BACKGROUND,
                color: item.dark ? '#ffffff' : 'inherit',
              }"
            >
              {{ item.name }}
            </a-select-option>
          </a-select>
        </div>
      </header>

      <main class="home-main">
        <div class="home-grid">
          <button
            type="button"
            class="home-card home-card-create"
            @click="openCreate"
          >
            <span class="home-card-plus">+</span>
            <span class="home-card-title">{{ t('createMindMap') }}</span>
          </button>

          <button
            v-for="card in templateCards"
            :key="card.id"
            type="button"
            class="home-card"
            @click="openTemplate(card)"
          >
            <span class="home-card-badge">{{ card.methodLabel }}</span>
            <span class="home-card-title">{{ card.name }}</span>
            <span v-if="card.description" class="home-card-desc">{{ card.description }}</span>
          </button>
        </div>
      </main>
    </div>
  </a-config-provider>
</template>

<script setup>
import {
  Select as ASelect,
  SelectOption as ASelectOption,
  ConfigProvider as AConfigProvider,
} from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { languageOptions, messages, getTemplateCards } from '../const.js'
import { setPendingEditorAction } from '../storage.js'
import { useAppSettings } from '../composables/useAppSettings.js'

const router = useRouter()
const { settings, themeList, homeCssVars, persist, DEFAULT_CANVAS_BACKGROUND } = useAppSettings()
const templateCards = getTemplateCards()

const t = (key) => messages[settings.value.language]?.[key] ?? key

const openCreate = () => {
  persist()
  setPendingEditorAction({ type: 'create' })
  router.push({ name: 'editor' })
}

const openTemplate = (card) => {
  persist()
  setPendingEditorAction({
    type: 'template',
    content: card.content,
    layout: card.layout || 'mindMap',
    thinkingModel: card.methodValue,
  })
  router.push({
    name: 'editor',
    query: {
      template: card.content,
      layout: card.layout || 'mindMap',
    },
  })
}
</script>

<style scoped>
.home-shell {
  min-height: 100vh;
  color: var(--home-fg, #1f2937);
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--home-accent) 28%, transparent), transparent 70%),
    linear-gradient(180deg, color-mix(in srgb, var(--home-bg) 92%, #000 8%), var(--home-bg));
  position: relative;
  overflow-x: hidden;
}

.home-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--home-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--home-grid) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, #000 20%, transparent 75%);
  pointer-events: none;
}

.home-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 28px;
}

.home-brand {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.04em;
  background: linear-gradient(120deg, var(--home-fg), var(--home-accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.home-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.home-select {
  min-width: 120px;
}

.home-select-theme {
  min-width: 140px;
}

.home-main {
  position: relative;
  z-index: 1;
  padding: 8px 28px 48px;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.home-card {
  appearance: none;
  border: 1px solid var(--home-card-border);
  background: var(--home-card-bg);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 18px 16px;
  min-height: 148px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: inherit;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.home-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--home-accent) 55%, transparent);
  box-shadow: 0 14px 32px color-mix(in srgb, var(--home-accent) 22%, transparent);
}

.home-card-create {
  align-items: center;
  justify-content: center;
  text-align: center;
  border-style: dashed;
  border-width: 2px;
  border-color: color-mix(in srgb, var(--home-accent) 45%, transparent);
  background:
    linear-gradient(160deg, color-mix(in srgb, var(--home-accent) 14%, transparent), transparent 55%),
    var(--home-card-bg);
}

.home-card-plus {
  font-size: 42px;
  line-height: 1;
  font-weight: 300;
  color: var(--home-accent);
}

.home-card-badge {
  align-self: flex-start;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--home-accent) 16%, transparent);
  color: var(--home-accent);
}

.home-card-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
}

.home-card-desc {
  font-size: 12px;
  color: var(--home-muted);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 600px) {
  .home-header {
    padding: 16px;
  }
  .home-main {
    padding: 4px 16px 32px;
  }
  .home-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .home-card {
    min-height: 132px;
    padding: 14px 12px;
  }
}
</style>
