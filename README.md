# SimpleMind

[English](./README_EN.md) | 中文

浏览器里运行的免费思维导图工具。默认进入 **Home 主页**，从模板卡片一键开始；进入编辑器后，右侧为 **SimpleChat** 云端聊天面板（OpenAI 兼容，在面板 ⚙ 中配置），工具栏「AI生成」仍可走 **Chrome 浏览器内置 AI（Prompt API / Gemini Nano）** 在本地生成子节点（**无需 API Key**）。

- 在线体验：https://simple-mind-five.vercel.app
- 仓库：https://github.com/SimpleAI2026/SimpleMind

技术栈：Vue 3、Vite 7、Ant Design Vue 4、vue-router、[simple-mind-map](https://github.com/wanglin2/mind-map)。

## 截图（样例）

以下为产品样例截图，展示主页改版后的界面。

### 主页

![主页样例](./ScreenShot1.png)

首页左侧为品牌 **SimpleMind**，右侧可切换语言与主题；主体为「创建」卡片 + 思考模版示例卡片网格。

### 脑图

![脑图样例](./ScreenShot2.png)

编辑器（`/map`）展示思维导图；**右侧为 SimpleChat 聊天面板**（可拖宽）。工具栏含返回主页、缩放、撤销/重做、节点增删、导入导出、详细/简单模式、卡片视图、设置与 AI 生成（不再提供「设置思考模版」工具栏入口）。

### 卡片视图

![卡片视图样例](./ScreenShot3.png)

按层级将导图渲染为可读的卡片文档；也可导出为独立的 `card.html`。

## 功能

### 主页与导航

- **默认路由 `/`**：科技感 Home 主页，不再直接进入画布。
- **Header**：左侧品牌文案 `SimpleMind`；右侧语言下拉 + 主题下拉（主题与设置面板同一套 `getThemeList()`）。
- **模板卡片网格**：第一张固定为「创建（+）」；其余由思考模版示例展平而来（读书笔记、课程学习、第一性原理、费曼学习法、贝叶斯思维、批判性思维、代码生成等）。
- **进入编辑器**：点「创建」→ `/map` 新建导图；点模板卡 → `/map` 并加载对应示例。换模板请返回主页重新选择。
- **返回主页**：编辑器工具栏最前提供显式「返回主页」入口。

### AI 生成（内置 AI + SimpleChat）

- **浏览器内置 AI（工具栏「AI生成」）**：Chrome Prompt API（`LanguageModel` / 端侧 Gemini Nano）。该路径**不需要 API Key**。需要 **Chrome 138+**。不可用时提示升级 / 下载模型或缩小规模；**不会**把「AI生成」回退成云端接口。
- **SimpleChat 右侧聊天面板**：多轮云端聊天（OpenAI 兼容）+ 工具调用。`apiBaseUrl` / `apiKey` / `model` 在面板右上角 **⚙** 配置并写入 localStorage；与内置 AI 通道分离。
- **思考模版**：任意、读书笔记、课程学习、第一性原理、费曼学习法、贝叶斯思维、批判性思维、代码生成。模版从 Home 卡片进入时带入；聊天系统提示会自动注入知识库 + 选中节点 + 思考模型。
- **智能生成（内置）**：选中节点后点「AI生成」，根据节点文本、当前模版和知识库插入子节点。端侧默认偏小规模（建议节点数 1–4，默认 1 层，必要时自动缩小）。
- **知识库**：在设置中填写系统知识库，或上传 `.md` / `.txt` / `.csv` / `.pdf` 解析为文本（会截断以适配端侧上下文）。
- **AI 扩写**：把当前知识库交给内置模型扩写后再用于生成。
- **宿主工具（Chat）**：仅注册最小权限工具 `get_selected_node`（读）、`add_child_nodes`（在选中节点下写子节点）。

### SimpleChat 集成（vendor，无 npm portal）

- **产物**：兄弟仓库 [SimpleChat](https://github.com/SimpleAI2026/SimpleChat) 执行 `yarn build:min`，生成并拷贝到本仓库 `src/vendor/simplechat/simplechat.min.js`（样式在 Shadow DOM 内，无需另拷 CSS）。
- **本地封装**：`src/components/SimpleChatSidebar.js` 包一层 `<simple-chat layout="panel">`；**无** Yarn portal / npm `@simplechat/*`。
- **可拖宽度**：面板左缘 resize（约 320–720px），与 `--sc-width`、`localStorage` `simplechat:sidebar-width`、宿主 `--ai-panel-width` 同步。
- **⚙ 设置**：Base URL / Key / Model / 主题 / 工具样式；Built-in AI 状态入口也可注入到 Chat ⚙。API Key 若以 `my-` 开头，SimpleChat 会去掉前缀后做 Base64 解码再作为 Bearer。
- **历史**：`storageKey` 绑定当前导图 root `uid`（`simplemind-chat-<uid>`）。
- **更新 vendor**：`cd ../SimpleChat && yarn build:min`（默认自动拷贝；或 `yarn build:min --no-copy` 后手动 `cp`）。

### 编辑与视图

- **工具栏**：返回主页、缩放（桌面端）、撤销/重做、新建、增删节点、导入导出、详细/简单模式、卡片视图、设置、AI 生成（**无**「设置思考模版」工具栏按钮）。
- **布局**：思维导图、逻辑结构图、组织结构图、目录组织图、时间轴、鱼骨图。
- **详细 / 简单模式**：详细模式把节点备注拼进文本；简单模式只保留标题。
- **卡片视图**：按层级把导图渲染成卡片；也可导出为独立的 `card.html`。
- **节点操作**：右键菜单支持新增子节点、仅删除当前节点、删除节点及子节点、复制 / 剪切 / 粘贴、标记 / 取消标记。
- **主题与样式**：内置主题（默认 `mint`）；可改画布背景、连线颜色与粗细（1–10px）、连线风格（曲线 / 直线 / 直连）、字体（微软雅黑、宋体、楷体、黑体、隶书、Arial 等），各项可单独恢复默认。
- **语言**：简体中文、English。支持滚轮缩放与节点拖拽。

### 导入导出与存储

- **导出**：`.smm`、`.json`、`.svg`、`.png`、`.pdf`、`.md`、`.xmind`、`.txt`、`card.html`。
- **导入**：`.smm`、`.json`、`.xmind`、`.md`。界面会列出 `.xlsx`，但尚未实现解析。
- **持久化**：Web 版设置与导图数据写在当前标签页的 `sessionStorage`；Chrome 扩展优先使用 `chrome.storage.local`。

## 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`
- Yarn（仓库含 `yarn.lock`）

## 本地运行

```sh
yarn
```

开发：

```sh
yarn dev
```

生产构建：

```sh
yarn build
```

预览构建结果：

```sh
yarn preview
```

## Chrome 扩展安装

1. `yarn && yarn build:extension`
2. 打开 Chrome → `chrome://extensions` → 开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择项目下的 `dist-extension/`
4. 点击工具栏图标 → 在 **Chrome 主窗口新标签页** 打开 SimpleMind（全页 Home / Editor）；编辑器 **右侧为 SimpleChat 面板**（云端聊天 ⚙；内置 AI 状态也可在 ⚙ 中查看）

要求：**Chrome 138+**，设备支持 Built-in AI / Prompt API。首次使用可能需下载端侧模型。

## 本地 Web 运行

仍可用 `yarn dev` / `yarn build` 以普通网页方式调试 UI（AI 同样只走 Built-in AI，需 Chrome 138+）。

**内置 AI 路径不需要** `VITE_API` / `VITE_SECRET` / `VITE_MODEL`。云端聊天请在右侧 SimpleChat **⚙** 中配置（可选）。

## 使用提示

1. 打开应用（扩展：点图标进主标签页）进入 Home，用右上角切换语言 / 主题。
2. 点「创建」新建导图，或点一张模板卡片加载示例并进入编辑器。
3. 在右侧 **SimpleChat** 面板点 **⚙**：配置云端 Base URL / API Key / Model（可选）；也可查看内置 AI 状态（必要时下载 / 重新检测）。
4. 选中中心节点或任一节点，把节点文本改成要展开的主题；可选：在「知识库」粘贴或上传资料。
5. **云端聊天**：在 SimpleChat 中对话，模型可通过工具读写选中节点。**本地生成**：点工具栏「AI生成」，确认提示词后子节点插入到当前选中节点下。换其它思考模版请返回主页重新选择。

## 开发说明

- 模型返回的 JSON 经常不合法，项目已用 [`jsonrepair`](https://www.npmjs.com/package/jsonrepair) 自动修复后再解析。
- 官方 `simple-mind-map` 的 `TouchEvent` 会在 `window` 上拦截全部触摸事件，导致 Ant Design Vue 等组件在移动端无法使用。本仓库使用 `src/plugins/TouchEvent.js`：触摸目标不在导图画布内则忽略。
- 路由：`/` → Home，`/map` → Editor。

## 参考

- [SimpleChat](https://github.com/SimpleAI2026/SimpleChat)（右侧聊天面板 vendor 来源）
- [simple-mind-map 构造方法](https://wanglin2.github.io/mind-map-docs/api/constructor/constructor-methods.html#on-event-fn)
- [Ant Design Vue](https://ant.design/)
- [思考框架：九大思维模型](https://medium.com/vincent-chen/%E8%AE%80%E6%9B%B8%E5%BF%83%E5%BE%97-%E6%80%9D%E8%80%83%E7%9A%84%E6%A1%86%E6%9E%B6-%E4%BA%8C-%E4%B9%9D%E5%A4%A7%E6%80%9D%E7%B6%AD%E6%A8%A1%E5%9E%8B-e6e6d5ad568)
- [ProcessOn 思维导图模板](https://www.processon.com/template/mind_free)
- [ProcessOn 思维导图知识](https://www.processon.com/knowledge/mindmaptemplate)
