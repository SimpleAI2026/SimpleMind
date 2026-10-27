# SimpleMind

[English](./README_EN.md) | 中文

浏览器里运行的免费思维导图工具。默认进入 **Home 主页**，从模板卡片一键开始；进入编辑器后选中节点，按思考模版调用 **OpenAI 兼容** 的 Chat Completions 接口，自动生成子节点。

- 在线体验：https://simple-mind-five.vercel.app
- 仓库：https://github.com/linkxzhou/SimpleMind

技术栈：Vue 3、Vite 7、Ant Design Vue 4、vue-router、[simple-mind-map](https://github.com/wanglin2/mind-map)。

## 截图（样例）

以下为产品样例截图，展示主页改版后的界面。

### 主页

![主页样例](./ScreenShot1.png)

首页左侧为品牌 **SimpleMind**，右侧可切换语言与主题；主体为「创建」卡片 + 思考模版示例卡片网格。

### 脑图

![脑图样例](./ScreenShot2.png)

编辑器（`/map`）展示思维导图；工具栏含返回主页、缩放、撤销/重做、节点增删、导入导出、详细/简单模式、卡片视图、设置与 AI 生成（不再提供「设置思考模版」工具栏入口）。

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

### AI 生成

- **思考模版**：任意、读书笔记、课程学习、第一性原理、费曼学习法、贝叶斯思维、批判性思维、代码生成。模版从 Home 卡片进入时带入；也可在设置中查看规则与调整。
- **智能生成**：选中节点后点「AI生成」，根据节点文本、当前模版和知识库插入子节点（默认两层：第一层 + `children`）。「生成最少节点数」范围 1–20，默认 5。
- **知识库**：在设置中填写系统知识库，或上传 `.md` / `.txt` / `.csv` / `.pdf` 解析为文本（截断约 2 万字）。
- **AI 扩写**：把当前知识库交给模型扩写后再用于生成。
- **模型**：设置面板内置 `GLM-5.3`、`Qwen3.8-27B`、`DeepSeek-V4-Flash`。未配置环境变量时默认 `Qwen/Qwen3.8-27B`。也可通过环境变量指定其它模型 ID。

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
- **持久化**：设置与导图数据写在当前标签页的 `sessionStorage`，关闭标签页后会丢失。

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

## 环境变量

在项目根目录创建 `.env` 或 `.env.local`（后者已被 git 忽略）。这些值只作为设置面板的**初始默认值**，之后仍可在界面里修改。

应用会把 `VITE_API` 拼上 `/chat/completions` 再发请求，因此 Base URL **不要**包含该路径，也尽量不要带末尾斜杠。

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `VITE_API` | OpenAI 兼容接口的 Base URL | `https://api.openai.com/v1` 或 `https://api.siliconflow.cn/v1` |
| `VITE_SECRET` | API 密钥，请求头为 `Authorization: Bearer ...` | `sk-xxxxxxxx` |
| `VITE_MODEL` | 默认模型 ID | `Qwen/Qwen3.8-27B` |

示例：

```
VITE_API=https://api.openai.com/v1
VITE_SECRET=sk-xxxxxxxx
VITE_MODEL=Qwen/Qwen3.8-27B
```

不配环境变量也可以：打开设置，填写 API Base、密钥和模型后再点「AI生成」。未填写 API Base 时会提示先配置。

## 使用提示

1. 打开应用进入 Home，用右上角切换语言 / 主题。
2. 点「创建」新建导图，或点一张模板卡片加载示例并进入编辑器。
3. 用环境变量或设置面板配置 API。
4. 选中中心节点或任一节点，把节点文本改成要展开的主题；可选：在「知识库」粘贴或上传资料。
5. 点击「AI生成」，子节点会插入到当前选中节点下。换其它思考模版请点工具栏返回主页重新选择。

## 开发说明

- 模型返回的 JSON 经常不合法，项目已用 [`jsonrepair`](https://www.npmjs.com/package/jsonrepair) 自动修复后再解析。
- 官方 `simple-mind-map` 的 `TouchEvent` 会在 `window` 上拦截全部触摸事件，导致 Ant Design Vue 等组件在移动端无法使用。本仓库使用 `src/plugins/TouchEvent.js`：触摸目标不在导图画布内则忽略。
- 路由：`/` → Home，`/map` → Editor。

## 参考

- [simple-mind-map 构造方法](https://wanglin2.github.io/mind-map-docs/api/constructor/constructor-methods.html#on-event-fn)
- [Ant Design Vue](https://ant.design/)
- [思考框架：九大思维模型](https://medium.com/vincent-chen/%E8%AE%80%E6%9B%B8%E5%BF%83%E5%BE%97-%E6%80%9D%E8%80%83%E7%9A%84%E6%A1%86%E6%9E%B6-%E4%BA%8C-%E4%B9%9D%E5%A4%A7%E6%80%9D%E7%B6%AD%E6%A8%A1%E5%9E%8B-e6e6d5ad568)
- [ProcessOn 思维导图模板](https://www.processon.com/template/mind_free)
- [ProcessOn 思维导图知识](https://www.processon.com/knowledge/mindmaptemplate)
