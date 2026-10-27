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
