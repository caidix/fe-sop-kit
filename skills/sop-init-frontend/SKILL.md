---
name: sop-init-frontend
description: 可插拔的前端项目 AI 协作脚手架初始化。放入任意前端项目后调用，自动扫描项目结构并生成 AGENTS.md + ai-context/ + rules/ + specs/ + demo/。适配 React/Vue/Taro/Next.js 等主流前端框架。
---

<!-- SOP-VERSION: 3.5 -->

# sop-init-frontend — 前端项目 AI 协作脚手架初始化（可插拔）

## 模板来源
本 skill 自带 `templates/` 目录，内含所有生成文件的骨架模板。生成时**优先按模板骨架填充**，只替换模板中的 `{{占位符}}` 与 `<!-- AI-INSERT: xxx -->` 标记区域，保持格式稳定。

## 触发条件
- **首次初始化**：用户在任意前端项目中说 **「初始化 SOP」「建立 AI 协作规范」「sop-init-frontend」「生成项目 rules」** 时执行。
- **版本升级**：用户说 **「更新 SOP」「升级脚手架」「同步最新规范」「更新规范」** 时执行（详见文末「SOP 版本升级」章节）。仅当项目已存在 `AGENTS.md` 且顶部有 `SOP-VERSION` 标记时有效。

---

## 阶段 0：扫描与理解（只读）

对项目根目录执行探索，覆盖以下维度：

| 维度 | 获取方式 |
|------|----------|
| 框架与构建工具 | `package.json` dependencies：搜索 react/vue/angular/svelte、vite/webpack/turbopack/next/taro |
| **框架版本** | 从 `package.json` 提取 react/vue 主版本号（18/19、3/2），决定生成哪些框架专属 rules |
| 语言与类型 | `tsconfig.json` 是否存在、`package.json` 的 `type` 字段 |
| 路由系统 | 搜索 `router`/`routes`/`pages` 目录；是否为框架内建（Next.js App Router）或第三方注入（Taro 插件） |
| 状态管理 | `package.json` 搜索 redux/pinia/zustand/mobx/recoil/jotai；记录库名 + 版本 |
| 样式方案 | 搜索 scss/less/tailwind/styled-components/css-modules |
| UI 组件库 | 搜索 antd/element-plus/naive-ui/taro-ui/radix-ui/shadcn；记录库名 + 版本 |
| API 层 | 搜索 axios/fetch/umi-request、`api/`、`request` 封装文件 |
| 认证鉴权 | 搜索 login/auth/token/JWT/OAuth/路由守卫 |
| 多端/多环境 | 搜索 platform/weapp/h5、构建脚本中的 env 变量 |
| 独特架构模式 | 搜索 plugin/inject/micro/monorepo/loader 等模式 |
| 测试方案 | `package.json` scripts 的 test/vitest/jest |
| Lint/Format | 搜索 eslint/prettier/.eslintrc |
| Git 作者风格 | `git log --pretty=format:"%an" -30 | sort | uniq -c | sort -rn`（有 git 时） |
| **React 代码风格** ★ | 采样 `src/` 中 5-10 个组件文件，提取组件声明方式/Props 定义/导出模式/文件组织/类型标注偏好（填入 `react.md` 第 0 节）。**先判断样本量**：< 3 个组件文件 或 代码量极少 → 标记「样本不足」，在阶段 1 询问用户如何处理 |
| **Vue 代码风格** ★ | 采样 `src/` 中 5-10 个 .vue 文件，提取 `<script setup>` 用法/Composables 命名/模板风格/组件组织方式（填入 `vue.md` 第 0 节）。同样先判断样本量 |
| **Vercel 官方 Skill** | 搜索 `~/.workbuddy/skills/` 是否存在 react-best-practices / web-design-guidelines / composition-patterns（来自 `npx skills add vercel-labs/agent-skills`）；仅记录存在性 |
| **Vue 官方 Skill** | 搜索 `~/.workbuddy/skills/` 是否存在 vue-best-practices / vue-router-best-practices / vue-pinia-best-practices / create-adaptable-composable / vue-testing-best-practices / vue-debug-guides / vue-jsx-best-practices（来自 `npx skills add vuejs-ai/skills`）；仅记录存在性 |
| **用户级 UI Skill** | 搜索 `~/.workbuddy/skills/` 是否存在 interface-design / ui-ux-pro-max / impeccable / taste-skill；仅记录存在性，不修改 |

---

### 0.1 框架分类判定（决定生成哪个框架规则文件）

扫描后按以下分类决定生成哪个框架级 rules 文件（**不再只支持 React/Vue**）：

| 分类 | 检测信号 | 生成文件 |
|------|---------|---------|
| **React** | `package.json` 含 `react`（含 Next.js / Taro-React / Remix） | `rules/react.md` + `rules/frontend.md` |
| **Vue** | `package.json` 含 `vue`（含 Nuxt / Taro-Vue） | `rules/vue.md` + `rules/frontend.md` |
| **其他前端框架** | 含 `svelte` / `angular` / `solid` / 纯 `vite`+`vanilla` 等（非 React/Vue 的前端） | `rules/framework-generic.md`（填入 `{{FRAMEWORK_NAME}}`=Svelte/Angular/...，`{{FRAMEWORK_CATEGORY}}`=前端框架）+ `rules/frontend.md` |
| **后端 / 非前端语言** | 含 `go.mod` / `requirements.txt` / `Cargo.toml` / `pom.xml` / `composer.json` / 纯 `package.json`(无前端框架) 等 | `rules/framework-generic.md`（`{{FRAMEWORK_CATEGORY}}`=后端语言）；**跳过 `frontend.md`**（其 UI 专属节不适用），改由 `framework-generic.md` 的 NFR 节承载质量约束 |
| **未知 / 空项目** | 无任何框架信号 | 询问用户：① 指定框架/语言 → 生成 `framework-generic.md`；② 纯文档/配置仓库 → 仅生成通用规则（workflow/planning/testing/review/skill-routing），不生成框架文件 |

> **关键原则**：`react.md` / `vue.md` 是深度专用模板（含官方 Skill 集成）；其余一切框架/语言统一走 `framework-generic.md` 的「第 0 节代码风格扫描」机制——从真实代码提取风格，官方最佳实践仅在 `{{FRAMEWORK_SPECIFIC_LAWS}}` 中作为补充说明。项目约定始终优先。

---

## 阶段 1：询问确认（交互）

用表格出示扫描结论，然后追问：

1. **项目身份**：产品名称？一句话定位？
2. **代码风格**：沿用特定作者的风格还是通用最佳实践？
3. **平台现实**：主产物 + 所有编译目标？
4. **AI 协作铁律**：是否有类似"先澄清再动手""好实践入 demo""本地记忆不进 git"的约定？
5. **特殊机制**：是否有编译期插件注入、全局组件注入、微前端、getAppInfo 类全局单例等特殊架构？这问是关键——**猜错路由登记点可能让后续所有任务在错误文件上操作**。
6. **分工模式**：单人 or 多人？是否需要主包/分包区分？
7. **代码风格来源**：若扫描到代码风格不统一，询问以谁为准（特定作者 / 多数派 / 通用最佳实践）；若统一，直接确认即可。
8. **样本不足处理 ★**：若阶段 0 标记了「框架代码风格样本不足」（项目源文件 < 3 个 或 代码量极少），询问用户：
   - "项目代码较少（仅 N 个源文件），是否保留现有风格？"
   - 保留 → 以现有写法为准，逐一提取填入规则文件
   - 不保留 → 采用框架官方最佳实践作为默认风格（对应框架 rules 第 0 节填入「官方推荐」标注）
   - 若用户自己描述了他想要的风格（如"我要全部用 named export"），记录并填入第 0 节
9. **用户额外代码约束 ★**：**无论样本是否充足，主动询问用户**：
   - "你是否有额外的代码约束想加入项目规则？例如命名规则、目录约定、禁止事项等。口述即可，我会识别并写入。"
   - 若用户提供了约束 → AI 逐个解析，识别每条约束归属（React 专有 / Vue 专有 / 其他框架专有 / 通用），分别写入：
     - React 专有 → `rules/react.md` 第 0.6 节 `{{REACT_USER_CONSTRAINTS}}`
     - Vue 专有 → `rules/vue.md` 第 0.6 节 `{{VUE_USER_CONSTRAINTS}}`
     - 其他框架/语言专有 → `rules/framework-generic.md` 第 0.6 节 `{{GENERIC_USER_CONSTRAINTS}}`
     - 通用（跨框架）→ `rules/frontend.md`「用户声明的代码约束」 `{{FRONTEND_USER_CONSTRAINTS}}`（后端项目则写入 `framework-generic.md` 第 0.6 节）
   - 每条约束用 checkbox 格式，标注来源「用户口述」
   - 若用户说"没有" → 跳过，填充「暂无额外约束」
10. **Vercel 官方 Skill**：若扫描到已安装 Vercel 的 react-best-practices / web-design-guidelines / composition-patterns，告知用户"检测到已安装，SOP 将自动激活"。若未安装，建议用户执行 `npx skills add vercel-labs/agent-skills`（React 项目）。本 SOP 的 `ui-skill-router` 调度器可在未安装时自动降级。
11. **Vue 官方 Skill**：若扫描到已安装 Vue 官方的 vue-best-practices / vue-router-best-practices 等，告知用户"检测到已安装，SOP 将自动激活"。若未安装，建议用户执行 `npx skills add vuejs-ai/skills`（Vue 项目）。本 SOP 的 `ui-skill-router` 调度器可在未安装时自动降级。
12. **UI Skill 环境**：若扫描到用户已安装 UI Skill（interface-design / ui-ux-pro-max / impeccable / taste-skill），向用户确认：是否在 UI 密集任务中启用它们？若未安装，提示可安装以获得更好的 UI 开发体验。

---

## 阶段 2：生成（写入文件）

根据阶段 0 扫描 + 阶段 1 确认，**按 `./templates/` 骨架生成**，替换占位符、填充 `<!-- AI-INSERT: xxx -->` 区域。

### 生成文件清单
```
<project-root>/
├── AGENTS.md                          # 从 templates/AGENTS.md.template
├── ai-context/
│   ├── project-map.md                 # 从 templates/ai-context/project-map.md.template
│   ├── prd.md                         # 从 templates/ai-context/prd.md.template
│   ├── design.md                      # 从 templates/ai-context/design.md.template
│   └── rules/
│       ├── frontend.md                # 从 templates/ai-context/rules/frontend.md.template
│       ├── platform.md                # 从 templates/ai-context/rules/platform.md.template
│       ├── workflow.md                # 从 templates/ai-context/rules/workflow.md.template
│       ├── planning.md                # 从 templates/ai-context/rules/planning.md.template ★ 新增
│       ├── testing.md                 # 从 templates/ai-context/rules/testing.md.template
│       ├── review.md                  # 从 templates/ai-context/rules/review.md.template
│       ├── skill-routing.md           # 从 templates/ai-context/rules/skill-routing.md.template ★
│       ├── react.md                   # 从 templates/ai-context/rules/react.md.template（仅 React 项目）
│       ├── vue.md                     # 从 templates/ai-context/rules/vue.md.template（仅 Vue 项目）
│       └── framework-generic.md       # 从 templates/ai-context/rules/framework-generic.md.template（其他前端框架/后端语言/未知，分类生成）
├── specs/
│   ├── README.md                      # 从 templates/specs/README.md.template
│   └── TEMPLATE.md                    # 从 templates/specs/TEMPLATE.md.template
├── demo/
│   └── README.md                      # 从 templates/demo/README.md.template
└── scripts/
    └── sop-check.mjs                  # 从本 kit scripts/sop-check.mjs 复制（SOP 健康检查 / CI 硬门禁）★
```

### 生成要求
- **project-map.md**：精确标注路由注册点（手写 / file-based / 插件注入），附构建命令速查。
- **design.md**：若扫描到特殊机制（插件注入、全局单例、微前端等），必须用独立章节详解。
- **rules/frontend.md**：从真实代码提取风格（导出方式、命名规范、hooks 模式，标注风格来源）。**填充「非功能需求 (NFR)」节** → `{{PERF_BUDGET}}` / `{{SECURITY_BASELINE}}` / `{{ACCESSIBILITY_RULES}}` / `{{COMPAT_MATRIX}}` / `{{I18N_RULES}}`（从构建配置/用户口述提取；未设预算填「未设预算」，不留空）。
- **rules/skill-routing.md**：根据扫描到的 UI Skill 可用性，填充降级策略中的安装状态标记。
- **rules/planning.md**：从模板直接生成（全静态，无需扫描填充），定义 L3 复杂任务四阶段规划流程（理解→设计→拆解→自审）。所有项目生成相同内容。
- **rules/react.md**（仅 React 项目）：填充第 0 节「项目 React 代码风格」→ `{{REACT_COMPONENT_STYLE}}` / `{{REACT_FILE_ORGANIZATION}}` / `{{REACT_EXPORT_IMPORT}}` / `{{REACT_TYPE_PREFERENCES}}`（从阶段 0 扫描的真实代码中提取，标注来源文件；若样本不足且用户选了"不保留风格"，填入 React 官方推荐写法并标注）；填充 `react` 版本号 → `{{REACT_VERSION_RULES}}`；填充状态管理深层约定 → `{{STATE_MANAGEMENT_DEEP}}`（不仅填命名约定，还要从实际代码中提取 store 文件组织方式和 selector 写法）；填充用户额外约束 → `{{REACT_USER_CONSTRAINTS}}`。
- **rules/vue.md**（仅 Vue 项目）：填充第 0 节「项目 Vue 代码风格」→ `{{VUE_COMPONENT_STYLE}}` / `{{VUE_FILE_ORGANIZATION}}` / `{{VUE_EXPORT_IMPORT}}` / `{{VUE_TYPE_PREFERENCES}}` / `{{VUE_TEMPLATE_STYLE}}`（从阶段 0 扫描的真实代码中提取，标注来源文件；样本不足时同理处理）；填充 `vue` 版本号 → `{{VUE_VERSION_RULES}}`；填充 Store 约定 → `{{VUE_STORE_CONVENTIONS}}`；填充用户额外约束 → `{{VUE_USER_CONSTRAINTS}}`。
- **rules/framework-generic.md**（其他前端框架 / 后端语言 / 未知项目）：填充 `{{FRAMEWORK_NAME}}`（Svelte/Angular/Solid/Vanilla/Python/Go/Java/...）与 `{{FRAMEWORK_CATEGORY}}`（前端框架 / 后端语言）；第 0 节从真实代码采样提取 → `{{GENERIC_DECLARATION_STYLE}}` / `{{GENERIC_FILE_ORGANIZATION}}` / `{{GENERIC_IMPORT_CONVENTIONS}}` / `{{GENERIC_NAMING_FORMAT}}`（标注来源文件，样本不足时按阶段 1 第 8 问处理）；第 1 节通用工程纪律填充 → `{{GENERIC_ASYNC_RULES}}` / `{{GENERIC_LOGGING}}`；第 2 节填入该框架/语言的官方最佳实践与常见陷阱 → `{{FRAMEWORK_SPECIFIC_LAWS}}`（AI 依据检测到的技术栈生成）；用户额外约束 → `{{GENERIC_USER_CONSTRAINTS}}`；NFR 五占位同 `frontend.md`；已知陷阱 → `{{GENERIC_TRAPS}}`。**后端项目不生成 `frontend.md`**，质量约束完全由本文件 NFR 节承载。
- **rules/testing.md**：无单测项目 → 验证基线 = `类型检查 + 构建`，补自测清单。
- **rules/platform.md**：多端项目必须列出部署矩阵 + 每端验证命令。
- **.gitignore**：在项目根或子项目 `.gitignore` 追加 `.workbuddy/` `.codebuddy/` 行。

---

## 生成后的闭环：开发任务全生命周期路由

SOP 初始化后，日常任务按以下阶段流转。AI 在每阶段自动读取对应规则：

```
接到任务
  │
  ├─→ 复杂度预检 ★新增
  │     AGENTS.md 判级（L0-L3）
  │     ├─ L0 极简 → 直接执行（跳过所有 rules）
  │     ├─ L1 简单 → 跳过分类/UI/规划/指定 → 直接实现
  │     ├─ L2 常规 → 完整 SOP
  │     └─ L3 复杂 → 完整 SOP + 规划模式
  │
  ├─→ 澄清（workflow.md 铁律 4）
  │     确认新增/修改 + 落点
  │
  ├─→ 任务分类 + Skill 调度 ★
  │     读 skill-routing.md → 判定任务类型
  │     ├─ UI 任务？→ ui-skill-router 激活对应 UI Skill
  │     ├─ React？→ Vercel react-best-practices + composition-patterns（如有）
  │     ├─ Vue？→ Vue 官方 vue-best-practices（如有）
  │     ├─ L3 复杂？→ 进入规划模式（planning.md）
  │     └─ 纯逻辑？→ 仅框架 Skill
  │
  ├─→ 复杂任务规划（L3 强制）★新增
  │     planning.md 四阶段：理解→设计→拆解→自审
  │     方案确认 → 写入 specs/<slug>/ → 才能进入实现
  │
  ├─→ UI/UX 设计（L2 按需激活）
  │     interface-design / ui-ux-pro-max
  │     → 设计确认后再进入实现
  │
  ├─→ 大/高风险？（workflow.md 判据）
  │     是 → specs/ 四件套 → 确认后再动手
  │     否 → 直接实现
  │
  ├─→ 实现（frontend.md + 框架 rules[react.md|vue.md|framework-generic.md] + 激活的 Skill）
  │     TDD 推荐用于 L3（RED-GREEN-REFACTOR）
  │
  ├─→ 自测（testing.md 基线）
  │     tsc + build + 多端验证
  │     + node scripts/sop-check.mjs（SOP 健康检查）
  │
  ├─→ Review（review.md 五轴清单 + web-design-guidelines / taste-skill 审美审查）
  │     + 填 acceptance 验证记录
  │
  ├─→ 提交（workflow.md 闭环 C）
  │     conventional commit + PR 证据链
  │
  ├─→ 交付后复盘（workflow.md 闭环 D）
  │     问"有坑吗？"→ 记 rules / skill / demo
  │     ★ 坑变成可勾选检查项（review.md / sop-check），不只写散文
  │
  └──→ 下一任务
```

AI 在对应阶段的行为：
| 阶段 | 触发条件 | AI 动作 |
|------|----------|---------|
| **复杂度预检** ★ | 收到任何开发任务 | 按 AGENTS.md「复杂度分级」表判定 L0-L3，告知用户 |
| **澄清** | 收到 L1-L3 任务 | 先问「新增/修改 + 功能 + 落点」 |
| **任务分类** ★ | 澄清完成 | 读 `skill-routing.md` → 判定任务类型 → 激活对应 Skill 集（ui-skill-router 调度 UI/Vercel Skill + 框架 Skill 标记） |
| **规划** ★ | L3 复杂任务 | 读 `planning.md` → 四阶段（理解→设计→拆解→自审）→ 产出 `specs/<slug>/` 并等用户批准。**方案确认前不写代码** |
| **UI/UX 设计** ★ | 任务被分类为 UI 密集 | 激活 interface-design（信息架构）/ ui-ux-pro-max（UX 模式），设计结果先和用户确认 |
| **Spec** | 用户确认走 specs | 按 TEMPLATE.md 建四件套目录 |
| **实现** | spec 确认 / L1-L3 任务直接开始 | 读 `frontend.md`（前端项目）+ 框架 rules：`rules/react.md`（React）/ `rules/vue.md`（Vue）/ `rules/framework-generic.md`（其他框架/语言，项目风格优先）+ 对应官方 Skill（如有）。L3 任务推荐 TDD（RED-GREEN-REFACTOR） |
| **自测** | 实现完成 | 提醒跑 `tsc --noEmit` + 目标构建；建议跑 `node scripts/sop-check.mjs` 做 SOP 健康检查 |
| **Review** | 自测通过 | 开 `review.md` 五轴检查 + 可执行检查命令，若有 UI 变更则激活 taste-skill 或 web-design-guidelines 做审美/系统化审查 |
| **提交** | Review 通过 | 帮生成 conventional commit 消息 + PR 描述 |
| **复盘** | 代码合入 | 主动问"有坑吗"，写入 rules（包括 react.md/vue.md 的「已知陷阱」）/demo/skill。**坑要变成可勾选检查项**（追加到 `review.md` 对应轴或 `sop-check` 规则），不只写散文——让教训成为可执行的约束（累积一致性） |

---

## 阶段 3：落地到本地 AI 记忆（双工具通用）

### 3.1 写入本地记忆
- 项目核心约定摘要 → WorkBuddy：`{workspace}/.workbuddy/memory/MEMORY.md`；CodeBuddy：`{workspace}/.codebuddy/memery/MEMORY.md`（注意：CodeBuddy 该目录名为 `memery`，非 `memory`）
- 当日日志：`YYYY-MM-DD.md`，上述两目录各写一份

### 3.2 关于框架 / UI 调度 Skill 的安装位置

`ui-skill-router` 自有 Skill **安装在用户级**（`~/.workbuddy/skills/` 或 `~/.codebuddy/skills/`），由 `scripts/install.sh` 一键安装，随工具全局可用。

**React / Vue 项目的 Skill 来源**：
- **项目 Rules**：`rules/react.md` / `rules/vue.md`（SOP 初始化生成，含项目代码风格 + 框架铁律）— **最高优先级**
- **其他框架 / 语言项目 Rules**：`rules/framework-generic.md`（SOP 初始化生成，覆盖 Svelte/Angular/Solid/Vanilla/Python/Go/Java 等，含第 0 节代码风格扫描 + 通用工程纪律 + 该栈官方最佳实践）— **最高优先级**，与 React/Vue 的 `rules/*` 同一机制
- **React — Vercel 官方 Skill**：`react-best-practices` / `composition-patterns` / `web-design-guidelines`，通过 `npx skills add vercel-labs/agent-skills` 安装
- **Vue — Vue 官方 Skill**：`vue-best-practices` / `vue-router-best-practices` / `vue-pinia-best-practices` 等 8 个，通过 `npx skills add vuejs-ai/skills` 安装
- **本仓库旧版 `react-best-practices` / `vue-best-practices`**：已于 v3.0/v3.2 废弃、v3.3 移除。原规则已合并入对应 `rules/` 文件（`rules/react.md` / `rules/vue.md`）作为项目级兜底；性能/最佳实践由官方 Skill 承接。

**为什么放在用户级而非项目级？**
- 项目初始化时只需生成 `ai-context/` 规则和 `AGENTS.md`，直接引用用户级 Skill，**不需要拷贝到每个项目**。
- 本仓库 SOP 升级后，团队成员**重新跑一次 `install.sh`** 即可让所有项目用上最新 Skill，无需逐个项目更新。
- 避免每个项目内都有一份 Skill 副本导致版本碎片化。

> 如果团队需要"项目锁定某个 SOP 版本"，可在项目内手动拷贝对应 Skill 到 `{workspace}/.workbuddy/skills/`，此时项目级覆盖用户级。但默认推荐用户级。

> 注意：4 个 UI Skill（interface-design / ui-ux-pro-max / impeccable / taste-skill）不捆绑在 SOP 中，它们是需要用户自行安装的**用户级 Skill**（路径 `~/.workbuddy/skills/`）。若未安装，`ui-skill-router` 会自动降级。

### 3.3 用户铁律编码为 Skill
- 若用户确认了"先澄清再开发"等铁律 → 创建项目级 skill 编码为自动行为

---

## 盲点留存机制（每次开发会话自动触发）

当在**已初始化 SOP 的项目**中解决了一个非显而易见的问题时，**主动询问用户**：

> "这个解法可能会在类似场景再遇到——要我记下来吗？"
> 选项：
> - **记成规则** → 追加到 `ai-context/rules/<相关规则>.md` 的「已知陷阱」节
> - **做成 Skill** → 创建对应工具的 skill 目录：WorkBuddy `.workbuddy/skills/`（用户级 `~/.workbuddy/skills/`），CodeBuddy `.codebuddy/skills/`（用户级 `~/.codebuddy/skills/`）
> - **仅日志** → 写入当天的本地记忆日志（WorkBuddy `.workbuddy/memory/`、CodeBuddy `.codebuddy/memery/`，文件名为 `YYYY-MM-DD.md`）
> - **不存**

触发盲点留存的条件（满足任一即触发）：
- 解决了一个不在现有 `ai-context/` 或 `rules/` 中记载的问题（含 `react.md`/`vue.md` 的「已知陷阱」节）
- 修复了因违反项目特有架构约束（如路由注入、初始化时序、配置覆盖顺序）导致的 bug
- 修复了因违反框架规则导致的 bug（如 React Hooks 规则、Vue 响应式陷阱）
- 花了超过 3 个回合才定位到的配置/环境/平台差异问题
- 用户明确说"记住这个" 或 "下次别犯这个错"

> 当问题涉及 React → 记入 `rules/react.md`「已知陷阱」；涉及 Vue → 记入 `rules/vue.md`「已知陷阱」；涉及 UI/视觉 → 记入 `rules/review.md` 或 `rules/skill-routing.md`。

---

## 与已有 SOP 项目共存
若项目已有 `AGENTS.md`，询问：覆盖 / 合并 / 跳过。合并时保留用户手写部分，仅补充缺失。

---

## SOP 版本升级（更新已初始化项目）

当本仓库的 SOP 模板发生改动（新增 rules、调整生命周期、修复模板 bug），已初始化 SOP 的项目需要同步。**不要直接覆盖**——项目内的 `ai-context/` 已被填充了项目特定的内容。

### 触发
用户说 **「更新 SOP」「升级脚手架」「同步最新规范」「更新规范」**，且项目已存在带 `SOP-VERSION` 标记的 `AGENTS.md`。

### 版本对比
1. 读取项目 `AGENTS.md` 顶部 `<!-- SOP-VERSION: x.y -->`
2. 读取本 kit 的当前版本（见 README 顶部的版本号 / 本文件版本声明）
3. 相同 → 提示"已是最新，无需更新"
4. 项目版本较旧 → 进入增量更新

### 增量更新规则（核心：不丢失项目内容）

| 内容 | 处理 |
|------|------|
| `<!-- AI-INSERT: xxx -->` 区域中已填充的项目特定内容 | **保留**，重新映射到新模板的对应区域 |
| 各 rules 文件的「已知陷阱 / Known Traps」章节 | **保留**（追加到新模板对应章节末尾） |
| 各 rules 文件的「用户声明的额外约束 / User Constraints」章节 | **保留**，不因模板升级而覆盖（用户口述内容是项目的永久资产） |
| `project-map.md` / `design.md` / `prd.md` 中由扫描生成的项目事实 | **保留** |
| 用户手写的章节 / 注释（不在模板骨架中的内容） | **保留** |
| 模板新增的章节 / 文件（如 v2→v3 新增 `skill-routing.md`、`planning.md`；v3.3→v3.4 新增 `scripts/sop-check.mjs`） | **新增**，按模板骨架生成并填充（脚本类文件直接复制） |
| 模板结构调整（如生命周期新增阶段） | **更新** `AGENTS.md` 导航 + `workflow.md` 阶段表 |
| `rules/frontend.md` 等通用规则模板的措辞修订 | **合并**：以新模板为准，但保留项目特定的 INSERT 内容 |

### 更新流程
```
读项目 SOP-VERSION
  │
  ├─→ 对比 kit 版本
  │     ├─ 相同 → 提示已最新，结束
  │     └─ 较旧 → 继续
  │
  ├─→ 重新扫描项目（阶段 0 逻辑）
  │
  ├─→ 对每个 ai-context 文件执行增量合并：
  │     ├─ 提取旧文件的「项目特定内容」（AI-INSERT 填充 + 已知陷阱 + 用户手写）
  │     ├─ 用新模板骨架生成新文件
  │     └─ 把提取的内容回填到新模板对应位置
  │
  ├─→ 新增模板中多出来的文件（之前版本没有的）
  │
  ├─→ 更新 AGENTS.md 的 SOP-VERSION 标记 + 导航链接
  │
  └─→ 输出变更报告：
        "新增：planning.md / skill-routing.md / scripts/sop-check.mjs
         更新：workflow.md（新增任务分类阶段）/ frontend.md（新增 NFR 节）/ review.md（可执行检查）
         保留：你的项目特定内容未受影响"
```

### 框架 / UI Skill 同步
- 项目内不存 Skill 副本（用户级安装），所以**无需逐个项目更新 Skill**。
- 提示用户：**重新执行一次 `scripts/install.sh`** 即可让所有项目用上最新 Skill 版本。
- 若用户之前手动把 Skill 拷贝到了项目级 `.workbuddy/skills/`，需手动重新拷贝或删除项目级副本以回退到用户级。

### 安全兜底
- 更新前自动对 `ai-context/` 做一次 git 提交或备份（若有 git），防止合并出错丢失内容。
- 任何无法安全合并的冲突（如用户大量改写了模板骨架）→ 暂停并询问用户：保留用户版 / 采用新模板 / 手动合并。
