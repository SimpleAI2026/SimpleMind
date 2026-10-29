# AGENTS.md — SimpleMind

## 产品导航
- 应用默认进入 **Home（科技感主页）**，不是直接进入脑图画布。
- Home Header：**左侧**品牌文案 `SimpleMind`；**右侧**语言下拉 + 主题下拉。
- Home 视觉主题必须跟随主题下拉；主题数据源仅为 `getThemeList()` / 设置中的同一套主题，禁止另造主题表。
- Home 主体为模板 **卡片网格**：第一张永远是「创建（+）」；其余为 `thinkingModels` 示例展平后的模板卡。
- 点击「创建」→ 进入脑图 Editor（新建）；点击模板卡 → 进入 Editor 并加载对应模板。
- 脑图 Editor **不得**再提供「设置思考模版」toolbar 入口或同功能 Drawer；换模板回 Home。
- Editor 提供显式 **「返回主页」** 入口。

## 技术栈
- 保持 Vue 3 + Vite + Ant Design Vue + simple-mind-map 现有栈；路由使用 vue-router（`/` Home，`/map` Editor），勿换框架。

## UI 约束
- Editor 工具栏按钮顺序遵守 `plan/ui-polish.md` 冻结序列，并去掉「设置思考模版」按钮后其余顺序不变：
  `[- 100% +][<][>][+][🗑][↓][⇅][▦][⚙][AI生成]`（返回主页为导航入口，置于工具栏最前）。


## Chrome 扩展与内置 AI
- 主交付形态可为 **Chrome 扩展（MV3）**；构建产物目录 `dist-extension/`（`yarn build:extension`）。
- AI **只走** Chrome Built-in AI（Prompt API / `LanguageModel` / 端侧 Gemini Nano）。**禁止**要求用户配置 API Key / Endpoint / 云端模型名，**禁止**云端 Chat Completions 回退。
- 传输层抽象为 `generateText(prompt) → string`，实现仅为 `BuiltinPromptAI`；继续复用 `buildPrompt` / `extractIdeas`。
- Nano 不足时：缩小规模（降 count / 1 层）或明确失败提示，不得接第三方云端 Key。
- 扩展内设置优先 `chrome.storage.local`；Web 仍可用 `sessionStorage`。
- 扩展需 Chrome **138+**；工具栏图标打开 **主窗口标签页**（全页 Home/Editor），编辑器 **右侧为内置 AI 面板**；不以「整站塞进 Side Panel」为主入口。
- Editor 工具栏顺序规则（ui-polish）仍然适用；**无**「设置思考模版」toolbar 按钮。
