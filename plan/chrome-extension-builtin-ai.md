# Chrome 扩展 + 浏览器内置 AI 迭代计划

> **范围：实现中 / 接近完成 — 已确认：不保留云端 Key，请求模块全部去掉**  
> 日期：2026-10-29  
> 基线：`main` @ `SimpleAI2026/SimpleMind`（含 Home 改版、vue-router、现有 `libai.js` OpenAI 兼容链路）  
> 目标产品形态：**Chrome 扩展**；AI **默认走 Chrome Built-in AI（Prompt API / Gemini Nano）**，**不要求用户配置 API Key / Endpoint / 云端模型名**。

---

## 0. 状态

| 项 | 状态 |
| --- | --- |
| 本文档 | **已完成（P0–P1；P2 划词导入未做）** |
| 应用 / 扩展代码 | **已落地** |
| `AGENTS.md` | **已追加** |

---

## 1. 目标（用户诉求）

1. SimpleMind **下一迭代主交付物 = Chrome 扩展**（Manifest V3）。
2. AI 生成子节点：**接入浏览器内置 AI**（Chrome Built-in AI / Prompt API，端侧 Gemini Nano），**去掉「必须配置密钥」路径**。
3. 保持现有产品能力：Home 模板卡、Editor 脑图、卡片视图、主题/语言；技术栈仍以 **Vue 3 + Vite + Ant Design Vue + simple-mind-map** 为主。
4. 本 plan **只规划不编码**；确认后再实现。

---

## 2. 现状摘要

| 能力 | 现状 |
| --- | --- |
| 运行形态 | 纯 Web（Vite）；无扩展 manifest |
| AI | `src/libai.js`：`buildPrompt` + `requestCompletions` → `{api}/chat/completions` + `Authorization: Bearer` |
| 设置 | Settings 需填 API / Secret / Model |
| 解析 | `extractIdeas` 吃 OpenAI-like `choices[0].message.content` 或纯文本 JSON |
| 路由 | `/` Home，`/map` Editor |

痛点：扩展场景下密钥配置重、隐私敏感；Built-in AI 无 Key、本地推理，但能力与 token 上限弱于云端大模型，长 JSON 脑图需改 prompt / 分步生成策略。

---

## 3. 目标架构

```
┌─────────────────────────────────────────────────────────────┐
│  Chrome Extension (MV3)                                      │
│  ┌──────────────┐   ┌─────────────────────────────────────┐ │
│  │ sidepanel /  │──▶│ 现有 Vue App（Home + Editor）         │ │
│  │ extension    │   │  aiProvider = 'builtin'（扩展默认）   │ │
│  │ page         │   └──────────────┬──────────────────────┘ │ │
│  └──────────────┘                  │                        │ │
│                                    ▼                        │ │
│                         ┌─────────────────────┐             │ │
│                         │ ai/adapters/*       │             │ │
│                         │  BuiltinPromptAI    │◀── LanguageModel │
│                         │  （唯一实现）       │    Gemini Nano  │
│                         └─────────────────────┘             │ │
└─────────────────────────────────────────────────────────────┘
```

**原则：**
- **Prompt 构建 / JSON 解析** 继续复用 `buildPrompt` / `extractIdeas`（可小改以适配 Nano）。
- **传输层**：`generateText(prompt) → string` **仅** `BuiltinPromptAI`（`LanguageModel`）。
- **删除云端路径**：去掉 `requestCompletions` / endpoint / Bearer Key 及一切 API/Secret/Model 配置 UI；Web 与扩展同一套内置 AI（Web 需 Chrome 138+ 才可用 AI）。

---

## 4. ASCII 线框

### 4.1 扩展主入口：Chrome 主标签页 + 右侧 AI 面板

```
┌─ Chrome 主窗口标签页 ──────────────────────────────────┐
│  SimpleMind Home / Editor（全页）     │ 右侧 AI 面板   │
│  脑图画布 / 模板网格                  │ 可用性/下载   │
│                                       │ AI 生成       │
└───────────────────────────────────────┴───────────────┘
点击工具栏图标 → chrome.tabs.create(index.html)（或聚焦已有扩展页）
不再以「整站 Side Panel」为主入口。
```

### 4.2 Editor 内 AI（无密钥）

```
工具栏：… [⚙] [AI生成]
点击 AI生成：
  ① 检查 LanguageModel.availability()
  ② unavailable → 引导「需 Chrome 138+ / 下载模型」
  ③ downloading → 进度条（downloadprogress）
  ④ available → session.prompt(buildPrompt(...)) → extractIdeas → 写入脑图
设置 Modal：
  ❌ 默认隐藏 API / Secret / Model（扩展 build）
  ✅ 展示「浏览器内置 AI」说明 + 可用性 + 「重新检测」
  ✅ 保留思考模版说明（仍从 Home 卡带入）/ 语言 / 主题等
```

### 4.3 可用性状态机

```
[unknown] → availability()
    ├─ unavailable  → 提示升级 Chrome / 设备不支持
    ├─ downloadable → 用户手势后 create() 触发下载
    ├─ downloading  → 显示进度
    └─ available    → 可 AI生成
```

---

## 5. 技术方案要点

### 5.1 扩展壳（MV3）

| 项 | 建议 |
| --- | --- |
| 入口 | **主窗口标签页**打开 `index.html`；编辑器内 **右侧 AI 面板**；不以整站 Side Panel 为主入口 |
| 构建 | Vite 多入口或 `@crxjs/vite-plugin` / 自研 `manifest.json` + `vite build` 输出到 `dist-extension/` |
| 权限 | 尽量少：`storage`；内置 AI **无需**额外 AI permission（Prompt API 对扩展已 stable）；**不要**为内置 AI 申请 host 权限 |
| 存储 | `chrome.storage.local` 对齐现有 settings（语言/主题/脑图草稿），替代或并联 `sessionStorage` |

### 5.2 Built-in AI 适配

| 项 | 建议 |
| --- | --- |
| API | `LanguageModel.availability` / `LanguageModel.create` / `session.prompt` 或 `promptStreaming`（Chrome **138+** 扩展） |
| 输出 | 统一拿到 **纯文本**，再走现有 `extractIdeas`（兼容非 OpenAI envelope） |
| Prompt | Nano 上下文更短：默认 **降 count、可改为 1 层再二次展开**；失败时降级「只生成第一层」 |
| 长任务 | 流式 + 超时/AbortSignal；UI 已有「预计 3 分钟」文案需改为更贴近端侧（秒～几十秒级，视下载与机器） |
| 能力边界 | 复杂长文/弱模型质量不达标时：明确文案「内置模型能力有限」；缩小规模或失败重试；**禁止**云端 Key 回退 |

### 5.3 设置与 i18n

- 扩展 build：`import.meta.env.VITE_AI_PROVIDER=builtin`（或 runtime `chrome.runtime` 探测）。
- 隐藏：`settings.api` / `secret` / `model` 表单项。
- 新增文案：内置 AI 就绪/下载中/不可用/不支持版本。
- 全产品：`VITE_AI_PROVIDER=builtin`（或直接写死）；**无** openai provider。

### 5.4 测试

| 层 | 做法 |
| --- | --- |
| 单元 | mock `LanguageModel`：availability / create / prompt；断言不调用 `fetch(.../chat/completions)` |
| 适配器 | `BuiltinPromptAI` 把返回值交给 `extractIdeas` 的契约测试 |
| 手工 | Chrome 138+ 真机：点图标开主标签、首次模型下载、Home→模板→右侧 AI 面板生成 |
| 覆盖率 | 维持 ≥95% 门槛；扩展壳可薄测 |

### 5.5 文档 / 规则

- 更新 `README.md` / `README_EN.md`：扩展安装步骤、Chrome 版本、内置 AI 说明、样例图可后补。
- `AGENTS.md` 追加：扩展默认内置 AI；禁止在扩展默认路径要求用户填 Key。
- 本文件确认后状态 → 实现中 / 已完成。

---

## 6. 实现顺序（确认后）

| 优先级 | 内容 |
| --- | --- |
| P0 | 抽象 `generateText`；实现 `BuiltinPromptAI`；Editor `aiGenerate` 走适配器；可用性检测 UI |
| P0 | 扩展 MV3 壳 + 标签页加载现有 App + 右侧 AI 面板；构建脚本 `dist-extension` |
| P0 | **删除** API/Secret/Model 设置与 `requestCompletions` 云端请求；i18n 改为内置 AI 文案 |
| P1 | Prompt 瘦身 / 分层生成以适配 Nano；错误与下载进度打磨 |
| P1 | `chrome.storage` 持久化；README / AGENTS |
| P2 | 可选：右键选中网页文本「发送到 SimpleMind」；全页模式 |
| P3 | Chrome Web Store 上架材料、隐私说明（内置 AI 数据本地） |

**不在本迭代：** 接 Gemini in Chrome 产品侧栏；任何云端 Key / Chat Completions 回退；Firefox/Safari；重做脑图引擎。

---

## 7. 风险

| 风险 | 缓解 |
| --- | --- |
| Nano 输出 JSON 不稳 / 截断 | 降规模、jsonrepair、分层生成、明确失败重试 |
| 模型体积大、首次下载慢 | 右侧 AI 面板 / Home 底栏进度；首次打开预热 create |
| 仅高版本 Chrome | 启动检测 + 商店写明 138+ |
| 脑图空间 | 主内容在全页标签；右侧仅 AI 面板，可收起 |
| 现有密钥用户 | 设置项与请求代码移除；旧 localStorage 中的 api/secret 可忽略或一次性清理 |

---

## 8. 确认结论（进行中）

1. 扩展主入口：**Chrome 主标签页**打开应用；编辑器 **右侧 AI 面板**（已按反馈调整，不再以整站 Side Panel 为主入口）
2. **云端 Key / OpenAI 兼容请求：不保留，全部去掉** — **已确认**
   - 删除（或彻底停用）`requestCompletions` / `resolveEndpoint` / `normalizeSecret` 及 Settings 中 API / Secret / Model 表单项
   - Web 与扩展 **统一只走** Built-in AI（`LanguageModel` / Prompt API）
   - README / AGENTS 不得再引导用户配置第三方 Key
3. Nano 不足：缩小规模 / 提示失败，**不做云端回退**（与上条一致）
4. P2「划词导入」：未确认，默认首版不做

---

## 9. 确认后下一步

1. 按 P0→P1 本地实现（或你指定推送目标仓）。
2. 更新 `AGENTS.md` + README。
3. 本文件状态改为「实现中 / 已完成」。
