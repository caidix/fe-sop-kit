---
name: sop-init-frontend
description: 可插拔的前端项目 AI 协作脚手架初始化。放入任意前端项目后调用，自动扫描项目结构并生成 AGENTS.md + ai-context/ + rules/ + specs/ + quality-baseline（demo/ 可选）。适配 React/Vue/Taro/Next.js 等主流前端框架。
---

<!-- SOP-VERSION: 4.1 -->

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
| **设计 Token 层** ★ | 搜索 CSS 变量（`--color-` / `--spacing-` / `--text-`）、`tailwind.config.*` 的 `theme.extend`、`@theme`（v4）、`theme.ts`/`tokens.ts`；记录：token 定义在哪个文件、是否已映射为工具类（Tailwind theme / CSS 变量）、深色模式如何切换。**无 token 层也要记录**（后续要建） |
| **硬编码色值现状** ★ | 在源码中统计 `-[#hex]` / `-[rgb()]` 形态的出现与重复情况（同一色值 ≥2 次 = 该建 token 的信号）。**样式文件必须单独统计**：`.less`/`.css`/`.scss` 里的裸 `color: #fff;` 形态与 Tailwind 任意值不同，是最常见的色值漂移来源（实测某项目样式层 35 处、代码层 0 处）。同时确认 token 真源文件在哪（应整体豁免） |
| **层级结构** ★ | 扫描顶层目录（pages/components/hooks/services/utils/types/store 等），推断出「展示层 / 业务层 / 数据层 / 共享层」，据此填 project-map 的归属决策表与允许导入关系 |
| **现有强制层** ★ | 检查是否已有 ESLint 边界规则（`no-restricted-imports`）、dependency-cruiser 配置、stylelint 硬色值规则；记录存在性（决定新配置是「补充」还是「新建」） |
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
13. **demo/ 示例库（可选，默认不生成）**：询问用户是否需要 `demo/` 目录沉淀可复用的好实践示例。默认**不生成**——实践沉淀默认走各 rules 的「已知陷阱」节（多数稳定项目最终会删除 demo/，改为纯 rules 承载）；用户明确确认需要示例库才生成 `demo/README.md`，并在 AGENTS.md 保留对应引用。
14. **代码熵硬门禁（可选，默认开启）**：向用户说明——可生成 `sop.config.json` 让 `sop-check` 额外扫描源码（超长文件 / console 残留 / any 类型 / 危险 API / 代码 TODO / 硬编码颜色字面量），把「验证优于说教」落到代码层。默认生成并启用（阈值取模板默认：`maxFileLines: 300`、`console`/`any`/`dangerousApi`/`hardcodedColor` 开、`todoComment` 关）；用户若担心误报可选择不生成——不生成则代码熵检查完全静默，不影响其余检查。生成时按项目实情调整 `srcDirs` / `codeExtensions`。**若项目已有 `sop.config.json`，只做增量合并，不覆盖。**
15. **设计 Token 体系（前端项目必问）**：向用户说明——会生成 `ai-context/design-tokens.md`，记录 token 真源、命名体系、**当前 token 清单**、工具类映射覆盖度，以及「硬编码值三分类判定」（颜色字面量该禁 / token 引用合规 / 几何与变体合法）。
    - 关键提问：**「项目现在有设计 token 吗？定义在哪？深色模式怎么切？」**
    - 若项目**没有** token 层 → 明确告知用户：「『必须用设计 Token』在没有清单时无法执行，AI 只能猜或硬编码。建议先建最小 token 层（颜色 + 字号 + 间距），我可以在初始化时一并生成初版清单。」征得同意后按扫描到的实际用色生成 token 清单（**只列真实存在的值，不编造**）。
    - 若项目**已有** token → 逐条提取真实 token 填入清单，并检查工具类映射覆盖度。
16. **机器强制层（可选，默认建议开启）**：向用户说明——「什么放什么位置」「不许硬编码色值」写在文档里是**建议**（遵守率取决于模型当次注意力），写成 ESLint / dependency-cruiser / stylelint 规则才是**门禁**（不改就过不了检查）。
    - 询问：**「是否接入机器强制层？」** 默认建议开启，生成 `ai-context/configs/` 下的配置模板。
    - **必须强调接入顺序**（见 `configs/README.md`）：先定归属决策表 → 再翻译成规则 → **先 warn 跑存量基线** → 最后转 error。
    - 若项目**已有** ESLint / dependency-cruiser / stylelint 配置 → 增量合并规则，不覆盖既有配置。
    - 用户选择不接入 → 在 AGENTS.md「本项目对 SOP 的裁剪」写明「不接入机器强制层」，避免每次升级都重复询问。

---

## 阶段 2：生成（写入文件）

根据阶段 0 扫描 + 阶段 1 确认，**按 `./templates/` 骨架生成**，替换占位符、填充 `<!-- AI-INSERT: xxx -->` 区域。

### 生成文件清单
```
<project-root>/
├── AGENTS.md                          # 从 templates/AGENTS.md.template
├── sop.config.json                    # 【可选，默认生成】从 templates/sop.config.json.template（启用代码熵硬门禁）
├── ai-context/
│   ├── project-map.md                 # 从 templates/ai-context/project-map.md.template（含归属决策表 + 越界表 + 项目地雷）
│   ├── prd.md                         # 从 templates/ai-context/prd.md.template
│   ├── design.md                      # 从 templates/ai-context/design.md.template
│   ├── design-tokens.md               # 从 templates/ai-context/design-tokens.md.template（前端项目；token 清单 + 硬编码值三分类判定）
│   ├── quality-baseline.md            # 从 templates/ai-context/quality-baseline.md.template（初始化时采一次基线）
│   ├── configs/                       # 【可选，阶段 1 第 16 问】从 templates/configs/（机器强制层配置模板）
│   │   ├── README.md
│   │   ├── eslint-boundaries.json
│   │   ├── dependency-cruiser.json
│   │   └── stylelint.json
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
│   ├── TEMPLATE.md                    # 从 templates/specs/TEMPLATE.md.template
│   └── INDEX.md                       # 从 templates/specs/INDEX.md.template（归档索引，初始只留表头）
├── demo/                              # 【可选】仅当用户在阶段 1 确认需要示例库时生成
│   └── README.md                      # 从 templates/demo/README.md.template
└── scripts/
    └── sop-check.mjs                  # 从本 Skill 目录的 scripts/sop-check.mjs **整体覆盖复制**（SOP 健康检查 / CI 硬门禁）★
```

> ⚠️ **禁止手写替代实现**：`scripts/sop-check.mjs` 必须从本 Skill 目录（`skills/sop-init-frontend/scripts/sop-check.mjs`）整体复制。
> 绝不允许自己写一份「简化版检查脚本」——曾有项目因为找不到官方脚本而手写 151 行替代品，
> 结果 ignore 规则（`p.replace(/\*\*\//g,'') + rel.includes`）永远匹配不到真实路径、
> 扩展名表漏掉样式文件，**两处检查全部静默失效**却看起来「有门禁」。
> 若本 Skill 目录下找不到该文件，说明安装不完整——应提示用户重跑 `scripts/install.sh`，而不是自己写一个。

### 生成要求
- **AGENTS.md**：**保持精简**——生成后目标 < 4,500 字符（`sop-check` 按此预算告警）。只放分级加载矩阵、读取纪律、文件索引、铁律与裁剪声明，细节一律放 rules。**§一 的「三步判级法」（数改动面 → 查高风险面 → 兜底）必须完整保留**——阈值可按项目调（如把 5 文件改成 3 文件），但不能删步骤或退回「只看信号描述」，否则 agent 无法稳定判级。填充「本项目对 SOP 的裁剪」→ `{{SOP_CUSTOMIZATIONS}}`（默认「暂无」；用户在阶段 1 第 13 问选择不生成 demo/ 时，写明「不生成 demo/（实践沉淀走 rules 已知陷阱）」；有其他裁剪逐条列出）。**文件索引表只保留本项目实际生成的框架文件**（React 项目删掉 vue/generic 行，反之同理）。
- **project-map.md**：精确标注路由注册点（手写 / file-based / 插件注入），附构建命令速查。**填充「归属决策表」**（`{{PAGE_DIR}}` / `{{SHARED_COMPONENT_DIR}}` / `{{UI_PRIMITIVE_DIR}}` / `{{FEATURE_DIR}}` / `{{SERVICE_DIR}}` / `{{STATE_DIR}}` / `{{TYPE_DIR}}` / `{{UTILS_DIR}}` / `{{CONST_DIR}}` / `{{STYLE_DIR}}`）——每行填**项目真实目录名**，「不要放哪」列写具体错误位置；**填充「允许导入关系」** `{{LAYER_ROWS}}`（将被翻译成 ESLint / dependency-cruiser 规则）；**填充「项目地雷」** `{{PROJECT_LANDMINES}}`（现象 | 根因 | 正确做法）。**收录标准：只写 agent 无法从代码直接读出的信息**——目录清单、技术栈、模块名不要写，读一遍代码就知道的东西每次会话都要付费且会稀释真正的约定。
- **design-tokens.md**（前端项目，阶段 1 第 15 问）：**填充「Token 真源位置」** `{{TOKEN_SOURCE}}`（文件路径 + 深色模式切换方式）；**填充「当前 Token 清单」** `{{TOKEN_ROWS}}`（**只列真实存在的 token，不编造**；无 token 层则填「待建立」并提示用户）；**填充「工具类映射覆盖度」** `{{MAPPING_ROWS}}`；**填充「硬编码值三分类」**的 A 类形态清单与 `{{LITERAL_ROWS}}` 提升信号表；**填充「已知例外」** `{{TOKEN_EXCEPTIONS}}`（每条写明「为什么必须例外」——没有原因的例外会被后续当漏洞删掉）。命名体系一节按项目实际 token 族填写，**优先语义命名**（`action-primary` 用途 > `blue-500` 外观）。
- **design.md**：若扫描到特殊机制（插件注入、全局单例、微前端等），必须用独立章节详解。
- **quality-baseline.md**：按阶段 0 扫描到的命令填充 `{{TYPECHECK_COMMAND}}` / `{{BUILD_COMMAND}}` / `{{TEST_COVERAGE_COMMAND}}` / `{{LINT_COMMAND}}`；**实际跑一次**把数值填入基线表（不要编造，跑不出填「未采集」并注明原因）；`{{REGRESSION_GUARD_1/2}}` 定义「较基线劣化多少即拦截」，至少给一条具体阈值（无则填「暂不设红线」）。
- **sop.config.json**（若阶段 1 第 14 问选择生成）：按项目实情填 `srcDirs` / `codeExtensions`（默认 `src` + 主流前端扩展名，后端项目改相应源码目录与扩展名）；**必须填 `styleExtensions`**（样式文件扩展名，默认 `.less/.css/.scss/.sass/.styl`）——否则样式层的硬编码色值检查完全扫不到（代码熵检查对样式文件不适用，但色值检查适用）。`colorAllowPatterns` 必须登记 **token 真源文件**（如 `src/styles/tokens.css`），否则真源里的定义会被误报。其余阈值取模板默认。若用户选择不生成，跳过此文件。
- **rules/*.md（通用）**：保留顶部「职责 + 按节读」提示块（≤2 行，**不要展开成静态目录**——目录用 `grep -n "^## "` 动态获取，静态目录会漂移且白占字符）；**删除与本项目无关的章节**（另一框架的适配说明、未安装 Skill 的详细用法），使 `ai-context/rules/` 合计 < 40,000 字符、单文件 < 10,000 字符——`sop-check` 会按此预算告警。注意 React 项目按模板生成后约 34,000 字符（`skill-routing.md` 9,600 最大），留给「已知陷阱」的余量约 6,000 字符，所以**删无关章节要真删**，不能只留标题。裁剪决定写入 AGENTS.md「本项目对 SOP 的裁剪」，升级时保留。
- **rules/frontend.md**：从真实代码提取风格（导出方式、命名规范、hooks 模式，标注风格来源）。**填充「非功能需求 (NFR)」节** → `{{PERF_BUDGET}}` / `{{SECURITY_BASELINE}}` / `{{ACCESSIBILITY_RULES}}` / `{{COMPAT_MATRIX}}` / `{{I18N_RULES}}`（从构建配置/用户口述提取；未设预算填「未设预算」，不留空）。**填充「设计决策卡」四问** → `{{STATE_PLACEMENT}}` / `{{COMPONENT_SPLIT}}` / `{{EFFECT_BOUNDARY}}` / `{{RACE_HANDLING}}`（从真实代码提取约定；项目尚无先例的按推荐默认填并标注「建议」，落地后回填为项目约定）。
- **rules/skill-routing.md**：根据扫描到的 UI Skill 可用性，填充降级策略中的安装状态标记。
- **rules/planning.md**：从模板直接生成（全静态，无需扫描填充），定义 L3 复杂任务四阶段规划流程（理解→设计→拆解→自审）。所有项目生成相同内容。
- **rules/react.md**（仅 React 项目）：填充第 0 节「项目 React 代码风格」→ `{{REACT_COMPONENT_STYLE}}` / `{{REACT_FILE_ORGANIZATION}}` / `{{REACT_EXPORT_IMPORT}}` / `{{REACT_TYPE_PREFERENCES}}`（从阶段 0 扫描的真实代码中提取，标注来源文件；若样本不足且用户选了"不保留风格"，填入 React 官方推荐写法并标注）；填充 `react` 版本号 → `{{REACT_VERSION_RULES}}`；填充状态管理深层约定 → `{{STATE_MANAGEMENT_DEEP}}`（不仅填命名约定，还要从实际代码中提取 store 文件组织方式和 selector 写法）；填充用户额外约束 → `{{REACT_USER_CONSTRAINTS}}`。
- **rules/vue.md**（仅 Vue 项目）：填充第 0 节「项目 Vue 代码风格」→ `{{VUE_COMPONENT_STYLE}}` / `{{VUE_FILE_ORGANIZATION}}` / `{{VUE_EXPORT_IMPORT}}` / `{{VUE_TYPE_PREFERENCES}}` / `{{VUE_TEMPLATE_STYLE}}`（从阶段 0 扫描的真实代码中提取，标注来源文件；样本不足时同理处理）；填充 `vue` 版本号 → `{{VUE_VERSION_RULES}}`；填充 Store 约定 → `{{VUE_STORE_CONVENTIONS}}`；填充用户额外约束 → `{{VUE_USER_CONSTRAINTS}}`。
- **rules/framework-generic.md**（其他前端框架 / 后端语言 / 未知项目）：填充 `{{FRAMEWORK_NAME}}`（Svelte/Angular/Solid/Vanilla/Python/Go/Java/...）与 `{{FRAMEWORK_CATEGORY}}`（前端框架 / 后端语言）；第 0 节从真实代码采样提取 → `{{GENERIC_DECLARATION_STYLE}}` / `{{GENERIC_FILE_ORGANIZATION}}` / `{{GENERIC_IMPORT_CONVENTIONS}}` / `{{GENERIC_NAMING_FORMAT}}`（标注来源文件，样本不足时按阶段 1 第 8 问处理）；第 1 节通用工程纪律填充 → `{{GENERIC_ASYNC_RULES}}` / `{{GENERIC_LOGGING}}`；第 2 节填入该框架/语言的官方最佳实践与常见陷阱 → `{{FRAMEWORK_SPECIFIC_LAWS}}`（AI 依据检测到的技术栈生成）；用户额外约束 → `{{GENERIC_USER_CONSTRAINTS}}`；NFR 五占位同 `frontend.md`；已知陷阱 → `{{GENERIC_TRAPS}}`。**后端项目不生成 `frontend.md`**，质量约束完全由本文件 NFR 节承载。
- **rules/testing.md**：无单测项目 → 验证基线 = `类型检查 + 构建`，补自测清单。
- **rules/platform.md**：多端项目必须列出部署矩阵 + 每端验证命令。
- **specs/**：`README.md` 填 `{{SPEC_TRIGGER}}`（从 workflow 的大/高风险判据复制）；`INDEX.md` **删掉模板里的示例行**，只留表头与说明（归档时才追加）；不预建 `archive/` 目录（首次归档时创建）。
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
| **复杂度预检** ★ | 收到任何开发任务 | 按 AGENTS.md §一「三步判级法」判定 L0-L3，按加载表取规则，并在首条回复自报「判级 + 已读文件」 |
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
| 模板新增的章节 / 文件（如 v2→v3 新增 `skill-routing.md`、`planning.md`；v3.3→v3.4 新增 `scripts/sop-check.mjs`；v3.9 新增 `specs/INDEX.md`；**v4.0 新增 `design-tokens.md` + `configs/`**） | **新增**，按模板骨架生成并填充 |
| **v4.0 新增 `ai-context/design-tokens.md`** | **新增并填充**：扫描项目实际 token 与硬编码色值，生成清单。**不覆盖已有项目特定内容**。若项目无 token 层 → 生成一份标注「待建立」的初版清单，并告知用户需先建最小 token 层；若用户明确不要 → 在 AGENTS.md 裁剪区块声明「不生成 design-tokens」 |
| **v4.0 新增 `ai-context/configs/`**（机器强制层） | **新增为配置模板，不直接接入**：生成后询问用户是否接入 ESLint / dependency-cruiser / stylelint。接入时**增量合并**进项目既有配置，不覆盖；**必须按 `configs/README.md` 的顺序**（先定归属表 → 翻译成规则 → 先 warn 跑存量 → 最后转 error）。用户不接入 → 在裁剪区块声明 |
| **v4.0 `project-map.md` 新增「归属决策表 / 允许导入关系 / 项目地雷」** | **新增这三节**，用新扫描结果填充。已有内容（如路由机制）保留。项目地雷节若已有内容，**追加不覆盖** |
| `specs/README.md` 的生命周期章节（v3.9：活跃 / 归档 / 废弃 + 阈值） | **用新版覆盖该章节**（无项目特定内容）；若项目已有自己的归档约定，保留项目版并在 AGENTS.md「裁剪」声明 |
| `specs/` 下已有大量历史 spec | **不做自动归档**（会改动 git 历史）；只提示用户：「有 N 个已交付 spec 可归档，要现在处理吗？」得到确认后按 README 的规则执行 |
| `AGENTS.md` 加载章节的结构调整（如 v3.8 把「依次读取全部文件」改为「三步判级法 + 加载表 + 读取纪律 + 文件索引」） | **按新模板重排该区块**，删除旧的「依次读取」清单（新索引表已覆盖）；**「三步判级法」必须保留**（可调阈值，不可删步骤）；铁律、核心认知、裁剪声明、用户手写章节保留 |
| **脚本类文件**（`scripts/sop-check.mjs` 等，无项目特定内容） | **一律以 kit 最新版整体覆盖**，无论新增还是升级。源文件在本 Skill 目录的 `scripts/` 下（**不是** kit 仓库根的 `scripts/`）。对比项目脚本头部 `SOP-CHECK-VERSION` 与 kit 版本，落后即覆盖——否则文档宣称的检查能力会与实际脚本脱节。**若项目脚本缺少 `SOP-CHECK-VERSION` 头，说明它是手写的简化版，必须整体覆盖**（手写版的 ignore / 扩展名逻辑不可信） |
| 模板结构调整（如生命周期新增阶段） | **更新** `AGENTS.md` 导航 + `workflow.md` 阶段表 |
| `rules/frontend.md` 等通用规则模板的措辞修订 | **合并**：以新模板为准，但保留项目特定的 INSERT 内容 |

### 升级分两步（务必向用户讲清楚这个模型）
- **第一步（kit 侧，一次性）**：用户把本 kit 更新到最新版（`git pull`）+ 重跑 `scripts/install.sh` 升级 Skill。Skill 是用户级安装的，升级一次所有项目通用——**这一步不在项目内执行**。
- **第二步（项目侧，逐个项目）**：在每个已初始化的项目里触发本流程，把新版内容同步刷新到该项目。以下「更新流程」讲的都是第二步。

### 更新流程（第二步：项目侧同步）
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
  │     ├─ 若新增 ai-context/quality-baseline.md：实跑命令采一次质量基线填入，
  │     │   跑不出填「未采集」并注明原因；若用户在裁剪区块声明不要则跳过
  │     └─ 若版本引入新可选配置（如 v3.7 的 sop.config.json 代码熵门禁）：
  │          询问用户是否启用；不启用则不生成（代码熵检查自动静默）
  │
  ├─→ 脚本类文件（scripts/sop-check.mjs）以 kit 最新版整体覆盖
  │     └─ 源文件：本 Skill 目录的 scripts/sop-check.mjs
  │        若项目现有脚本缺少 SOP-CHECK-VERSION 头 → 它是手写简化版，必须整体覆盖
  │
  ├─→ 更新 AGENTS.md 的 SOP-VERSION 标记 + 导航链接
  │
  ├─→ 跑一次 node scripts/sop-check.mjs 确认升级后健康（有 WARN 就说明原因或修复）
  │     └─ 出现「规则体量预算」告警时：报告 AGENTS.md / rules 的实际字符数与预算，
  │        给出具体建议（移细节出 AGENTS.md、删无关框架章节、按主题拆分）；
  │        用户决定保留现状 → 在 AGENTS.md 裁剪区块声明「接受当前体量」以免反复告警
  │
  └─→ 输出变更报告 + 提示用户在项目里自行 commit：
        "新增：planning.md / quality-baseline.md / sop.config.json（可选）
         更新：workflow.md / frontend.md（设计决策卡）/ review.md / sop-check.mjs（整体覆盖）
         保留：你的项目特定内容未受影响
         请在项目仓库提交：chore: 更新 SOP 至 vX.Y（此 commit 即回退点）"
```

### 框架 / UI Skill 同步
- 项目内不存 Skill 副本（用户级安装），所以**无需逐个项目更新 Skill**。
- 提示用户：**重新执行一次 `scripts/install.sh`** 即可让所有项目用上最新 Skill 版本。
- 若用户之前手动把 Skill 拷贝到了项目级 `.workbuddy/skills/`，需手动重新拷贝或删除项目级副本以回退到用户级。

### 安全兜底
- **不做自动 git 备份 / 代提交**：kit 只改文件，不碰项目 git。变更报告输出后，**提示用户在项目仓库自行提交 commit**（如 `chore: 更新 SOP 至 vX.Y`）——用户自己的这个 commit 就是唯一回退点，可用 `git revert` 整体回退。
- 任何无法安全合并的冲突（如用户大量改写了模板骨架）→ 暂停并询问用户：保留用户版 / 采用新模板 / 手动合并；冲突未解决前不要输出「升级完成」。
