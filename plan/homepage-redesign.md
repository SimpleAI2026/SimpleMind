# 主页改版计划：科技感 Home + 模板卡片平铺

> **范围：已完成并合入 `main`**  
> 日期：2026-10-27  
> 基线：`main` @ 当前本地（含 UI / 性能 / 覆盖率后续改动）  
> 技术栈约束：继续使用 **Vue 3 + Vite + Ant Design Vue + simple-mind-map + simple-mind-map-plugin-themes + 现有 i18n**，不引入新框架。

---

## 0. 状态

| 项 | 状态 |
| --- | --- |
| 本文档 | **已完成** |
| 应用代码 | **已完成**（已合入 `main` 并推送 `SimpleAI2026/SimpleMind`） |
| `AGENTS.md` | **已新建**（见仓库根目录） |
| README 样例图 | **已更新**（主页 / 脑图 / 卡片视图） |

---

## 1. 目标（用户诉求）

1. **科技感主页（Home）**
   - Header：**左边** = 品牌文案 `SimpleMind`；**右边** = 语言下拉 + 主题下拉
   - 主页整体视觉（背景 / chrome / 卡片氛围）**随主题下拉动态变化**
   - 主题选项 = 现有设置里的主题列表：`getThemeList()`（含「默认」`''` + `simple-mind-map-plugin-themes/themeList`），与脑图 `settings.theme` **同一套**，不要另造一套主题表

2. **模板入口改版**
   - **去掉**脑图页 toolbar 上的「设置思考模版」按钮（`t('thinkingMethod')` / `UnorderedListOutlined`）及对应 **Drawer**
   - 将原 Drawer 里各 `thinkingModels[*].example` **平铺成主页卡片网格**
   - **第一张卡** =「创建」大 `+` → 进入现有脑图页（空白 / 默认新建流程）
   - 点击 **其它模板卡** → 进入脑图页并 **加载该模板 JSON**（复用现有 `loadExampleTemplate`）

3. **规则文档**
   - 实现阶段新建 / 更新 `AGENTS.md`，把上述导航与主题规则写死，避免后续回退

---

## 2. 现状摘要（基于源码）

| 能力 | 现状 |
| --- | --- |
| 入口 | 单页 `App.vue`：一打开即脑图画布 + 悬浮 toolbar |
| 思考模版 | toolbar「设置思考模版」→ `a-drawer` 列出 `thinkingModels`，示例按钮调 `loadExampleTemplate` |
| 主题 | 设置 Modal 内 `a-select` 绑定 `settings.theme`，`watch` → `mindMap.setTheme` + 同步背景/连线色 |
| 语言 | 设置内 `languageOptions`（zh-CN / en-US） |
| 路由 | **无** vue-router；无独立 Home |
| AGENTS.md | **不存在** |

---

## 3. ASCII 线框（请确认）

### 3.1 主页 · 桌面

```
┌──────────────────────────────────────────────────────────────────────────┐
│  SimpleMind                              [语言 ▾]  [主题 ▾]              │  ← header
│                                                                          │
│   （科技感背景：网格/微光，颜色随「主题」动态变）                          │
│                                                                          │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                │
│   │   +    │ │ 模板 A │ │ 模板 B │ │ 模板 C │ │ 模板 D │  …             │
│   │ 创建 │ │ 标题   │ │ 标题   │ │ 标题   │ │ 标题   │                │
│   │        │ │ 简述   │ │ 简述   │ │ 简述   │ │ 简述   │                │
│   └────────┘ └────────┘ └────────┘ └────────┘ └────────┘                │
│                                                                          │
│   卡片顺序：【创建(+)】永远第一，其后为 thinkingModels 展平后的 example   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Header 细节（左品牌 / 右控件）

```
┌─────────────────────────────────────────────────────────────┐
│ SimpleMind                 [简体中文 ▾]  [默认/mint/… ▾]    │
│  ↑ 左：品牌                    ↑ 右：语言 + 主题            │
└─────────────────────────────────────────────────────────────┘
```

> 确认点（已纠正）：品牌在**左**、语言/主题在**右**。

### 3.3 主页 · 窄屏

```
┌────────────────────────────┐
│ SimpleMind  [语言▾] [主题▾]│
├────────────────────────────┤
│ ┌────┐ ┌────┐             │
│ │ +  │ │ A  │             │
│ └────┘ └────┘             │
│ ┌────┐ ┌────┐             │
│ │ B  │ │ C  │   … 两列网格 │
│ └────┘ └────┘             │
└────────────────────────────┘
```

### 3.4 点击后 · 脑图页（去掉思考模版按钮）

```
┌────────────────────────────────────────────────────────────┐
│  （可选）[← 返回主页]                                      │
│                                                            │
│  工具栏（顺序冻结，见 ui-polish.md）：                     │
│  [- 100% +][<][>][+][🗑][↓][⇅][☰][▦][⚙][AI生成]          │
│                         ▲                                  │
│                         └── 已删除「设置思考模版」按钮     │
│                                                            │
│              simple-mind-map 画布                          │
└────────────────────────────────────────────────────────────┘
```

### 3.5 信息流

```
 Home                          Editor (现 App 脑图)
┌──────────────┐   创建(+)    ┌─────────────────────┐
│ 主题/语言    │ ─────────▶ │ 空白/默认脑图        │
│ 卡片网格     │   模板卡    │ loadExampleTemplate  │
│              │ ─────────▶ │ + 对应 layout        │
└──────────────┘             │ 无思考模版 Drawer   │
       ▲                     └──────────┬──────────┘
       └──────── 返回主页 ◀─────────────┘
```

---

## 4. 建议信息架构（实现时）

| 方案 | 说明 | 建议 |
| --- | --- | --- |
| A. `vue-router`：`/` Home，`/map` Editor | 清晰、可深链 `?template=` | **推荐**（仍属 Vue 生态，与现栈一致） |
| B. 无路由，`view: 'home' \| 'editor'` | 改动面更小 | 备选 |

**主题驱动主页：**

- Home 读取与 Editor 共享的 `settings.theme`（sessionStorage / 抽成 composable）
- 用 `getThemeList()` 找到当前项的 `backgroundColor` / `lineColor` / `root.fillColor`，映射到 CSS 变量（如 `--home-bg`、`--home-accent`），主页背景与卡片描边随之下发
- Ant Design `a-config-provider` 的 `colorPrimary` 继续可用 `themeRootFillColor`

**卡片数据：**

```
cards = [
  { id: 'create', type: 'create', title: i18n.create },
  ...flatten(thinkingModels.flatMap(m => m.example || []).map(...))
]
```

每张模板卡至少：`name`、`description`、`layout`、`content`（json 文件名）、可选所属 method 标签。

**删除 / 迁移：**

- 移除 toolbar「设置思考模版」按钮 + Drawer UI
- AI / 设置里若仍依赖 `settings.thinkingModel`（prompt），**保留设置项或静默默认**，不在本 plan 里删推理能力；仅去掉「从 toolbar 选模版示例」的入口
- 打开模板时：`loadExampleTemplate` + 设置 layout（与现 Drawer「打开」行为对齐）

---

## 5. 实现顺序（确认后）

| 优先级 | 内容 |
| --- | --- |
| P0 | 路由或 view 切换；Home 壳 + header（左 SimpleMind，右语言/主题）；主题 CSS 变量联动 |
| P0 | 卡片网格：创建 + 展平 example；点击进 Editor 并加载 |
| P0 | Editor 去掉思考模版 toolbar + Drawer；加「返回主页」 |
| P1 | 科技感视觉（网格背景、微光、卡片 hover）；i18n 文案；持久化语言/主题 |
| P1 | 新建 `AGENTS.md`（见草案） |
| P2 | 深链、空态、加载失败、无障碍 |
| P3 | 卡片缩略预览图（可选，不阻塞） |

**测试：** 现有 Vitest 需改 App 挂载路径；为 Home 导航与「无思考模版按钮」加断言；覆盖率阈值仍 ≥95%。

---

## 6. 风险与不在范围

| 风险 | 缓解 |
| --- | --- |
| 主题 list 含空 `value`「默认」 | Home 下拉与 Editor 共用同一 list，空值按默认灰底处理 |
| example 很多，主页过长 | 响应式网格 + 后续可分组；首版全量平铺 |
| 去掉 Drawer 后无法在 Editor 内换模版 | **有意为之**；换模版回 Home 点卡 |

**不在范围（本改版）：** 重做 AI 链路、改 toolbar 其它按钮顺序、新建设置面板信息架构、换 UI 库。

---

## 7. 确认结论

1. Header：**左** `SimpleMind`，**右**语言+主题 — **已确认**
2. 脑图页显式 **「返回主页」** — **要**
3. 卡片 **全量平铺** 所有 `example`（不按 method 分组标题）— **已确认**
4. 路由：**vue-router**（`/` Home，`/map` Editor）— **已确认**

---

## 8. `AGENTS.md` 草案（确认后落地为仓库根文件）

```markdown
# AGENTS.md — SimpleMind

## 产品导航
- 应用默认进入 **Home（科技感主页）**，不是直接进入脑图画布。
- Home Header：**左侧**品牌文案 `SimpleMind`；**右侧**语言下拉 + 主题下拉。
- Home 视觉主题必须跟随主题下拉；主题数据源仅为 `getThemeList()` / 设置中的同一套主题，禁止另造主题表。
- Home 主体为模板 **卡片网格**：第一张永远是「创建（+）」；其余为 `thinkingModels` 示例展平后的模板卡。
- 点击「创建」→ 进入脑图 Editor（新建）；点击模板卡 → 进入 Editor 并加载对应模板。
- 脑图 Editor **不得**再提供「设置思考模版」toolbar 入口或同功能 Drawer；换模板回 Home。

## 技术栈
- 保持 Vue 3 + Vite + Ant Design Vue + simple-mind-map 现有栈；新增路由优先 vue-router，勿换框架。

## UI 约束
- Editor 工具栏按钮顺序遵守 `plan/ui-polish.md` 冻结序列（去掉思考模版按钮后，其余顺序不变）。
```

---

## 9. 实现记录

1. 本地分支 `feat/homepage-redesign` 实现（不强制云端 PR，按用户要求本地执行）
2. 根目录 `AGENTS.md` 已写入；README / README_EN 样例图已更新
3. 已合入本机 `main` 并推送至 `SimpleAI2026/SimpleMind`
4. 本文档状态：**已完成**
