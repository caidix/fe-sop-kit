<!-- SOP-VERSION: 3.8 -->

# sop-frontend-kit — 前端项目 AI 协作脚手架（可插拔）

> **SOP 版本：v3.8**

一套**可复用的前端 AI 协作规范模板包**。放到任意前端项目中调用一次，AI 自动扫描项目结构并生成 `AGENTS.md` + `ai-context/` + `rules/` + `specs/`（+ 可选的 `demo/`）。支持 CodeBuddy / WorkBuddy 双工具。

---

## 安装（一键）

在仓库根目录执行：

```bash
bash scripts/install.sh          # Git Bash / Terminal
# Windows 也可直接运行（自动调用 Git Bash）：
scripts\install.bat
```

脚本会以**互动模式**运行，依次询问你：

1. **安装到哪个 AI 工具？** — WorkBuddy / CodeBuddy / 两者都装
2. **需要哪些框架 Skill？** — React 为主 / Vue 为主 / 两者都装 / 跳过

自有 Skill（始终安装）：

- `sop-init-frontend` — 提供「初始化 SOP」触发词
- `ui-skill-router` — UI / React / Vue Skill 调度器（AI PM）

推荐外部 Skill（按你的选择给出安装指令，**不自动执行**）：

| 你的选择 | 给出的指令 |
|---------|-----------|
| React 为主 | `npx skills add vercel-labs/agent-skills` |
| Vue 为主 | `npx skills add vuejs-ai/skills` |
| 两者都装 | 两条指令都给出 |
| 跳过 | 提示需要时再执行 |

> 非互动模式（CI）：`bash scripts/install.sh --all-react` / `--all-vue` / `--all`。
>
> Windows：cmd/PowerShell 直接 `scripts\install.bat`（自动调用 Git Bash）；或 Git Bash 中 `bash scripts/install.sh`。

<details>
<summary>手动安装 / 手动用模板（脚本不可用时的兜底）</summary>

**手动安装 Skill：**

```bash
# WorkBuddy — 仅自有 Skill
cp -r skills/sop-init-frontend ~/.workbuddy/skills/
cp -r skills/ui-skill-router ~/.workbuddy/skills/

# React 项目还需安装 Vercel 官方 Skill：
# npx skills add vercel-labs/agent-skills

# CodeBuddy（把 ~/.workbuddy 换成 ~/.codebuddy）
```

**完全不装 Skill、只用模板：** 复制 `skills/sop-init-frontend/templates/` 下模板，按 `{{占位符}}` 与 `<!-- AI-INSERT: xxx -->` 标记自行填充。

</details>

---

## 怎么用

1. 打开你的前端项目（React / Vue / Taro / Next.js … 均可）
2. 对 AI 说：**「初始化 SOP」** 或 **「建立 AI 协作规范」**
3. AI 先扫描项目结构（框架、路由、状态管理、样式、API 层等），出示结果让你确认
4. 确认后自动生成全套文件到项目内
5. 此后每次开发任务，AI 会自动判定复杂度（L0-L3），简单任务轻装上阵，复杂任务深度规划

---

## 上下文成本控制（token 预算）

规则越全，每次会话读入的上下文越多；而**上下文越长，关键约束反而越容易被稀释**。本 kit 用三层机制把成本压到可控：

| 机制 | 落在哪 | 作用 |
|------|--------|------|
| **三步判级 + 加载表** | `AGENTS.md` §一 | L0-L3 是 SOP 自定标签（工具不认识），所以判级写成可执行步骤：① 数改动面（≤1 / 1-2 / 3-5 / >5 文件）② 查高风险面（鉴权、支付、路由注册、全局状态等命中即 L3）③ 兜底默认 L2。判完在首条回复自报「判级 + 已读文件」，漏读一眼可见。纯样式改动只读 `frontend.md`「样式规范」+ `review.md`「五轴审查」+ `testing.md`「必过关卡」+ `workflow.md`「铁律 4」（合计约 3.4K 字符），不碰框架 rules / `planning.md` / `skill-routing.md` / `platform.md` |
| **读取纪律** | `AGENTS.md` §二 | 先 `grep -n "^## "` 取章节表，再按 `offset/limit` 读片段；同一会话不重读；`project-map` / `prd` / `design` 默认不读 |
| **体量预算** | `sop-check` | 每次运行打印 `AGENTS.md` / `rules` 实际字符数；超预算告警：AGENTS.md > 4,500、单文件 > 10,000、合计 > 40,000 |

预算设的是**天花板**，不是目标。按模板生成一套 React 项目，`rules/` 开箱约 **34,000 字符**（`skill-routing.md` 9,600、`react.md` 8,100 是最大的两个），留给项目沉淀「已知陷阱」的空间约 6,000 字符——所以生成时应优先删掉与本项目无关的章节（另一个框架的适配说明、未安装 Skill 的详细用法），比事后拆分更有效。确需放宽时改 `sop.config.json`：

```json
{ "budgets": { "agentsMaxChars": 4500, "ruleMaxChars": 10000, "rulesTotalMaxChars": 40000 } }
```

`"budgets": false` 关闭预算告警（体量指标仍会打印）。`--json` 输出的 `metrics` 字段可直接接 CI 趋势图。

---

## 升级已初始化的项目

模板迭代后，升级分**两个独立步骤**——先升级 kit 自身的版本，再把新版本内容同步到各个项目：

### 第一步：升级 SOP 版本（kit 侧，一次性）

把本仓库更新到最新版（拉取最新代码），然后重跑安装脚本，让 Skill 升级到新版（所有项目通用）：

```bash
git pull                    # 更新 kit 到最新版
./scripts/install.sh        # 或 all —— 升级 Skill
```

> Skill 是用户级安装的（不在项目内），所以升级一次，所有项目立即用上新 Skill。

### 第二步：把新版内容同步到项目（项目侧，逐个项目）

在**每个已初始化的项目**里对 AI 说 **「更新 SOP」** 或 **「同步最新规范」**，AI 会：

1. 读取项目 `AGENTS.md` 顶部的 `SOP-VERSION` 标记，对比 kit 当前版本；相同则提示「已是最新」
2. **增量合并**——保留你已填充的内容（AI-INSERT 区域、已知陷阱、用户约束、手写章节），只新增/更新模板结构变化
3. 新增旧版本没有的文件（如 v3.7 新增的 `quality-baseline.md`；`sop.config.json` 会询问是否启用代码熵检查）
4. 若新增了 `quality-baseline.md`，实跑命令采一次质量基线填入（跑不出填「未采集」）
5. 脚本类文件（`scripts/sop-check.mjs`）以 kit 最新版**整体覆盖**，并更新 `AGENTS.md` 的版本标记与导航
6. 输出变更报告，并跑一次 `node scripts/sop-check.mjs` 确认升级后健康

> 不会直接覆盖项目内容。遇到无法安全合并的冲突会停下来询问你如何处理。

**升级后的提交由你决定**：确认变更报告无误后，在**项目仓库**里自行提交一次 commit（如 `chore: 更新 SOP 至 vX.Y`）。这个 commit 就是回退点——kit 不代你提交，也不做自动 git 备份。

每个生成的项目 `AGENTS.md` 顶部都有 `<!-- SOP-VERSION: x.y -->`，这是「更新 SOP」判断是否需要升级的依据。

---

## SOP 健康检查 / CI 硬门禁 ★

初始化后的项目自带 `scripts/sop-check.mjs`（零依赖 Node 脚本），把软纪律变成可执行、CI 可阻断的硬约束（移植自 harness-engineering「验证优于说教」）：

```bash
node scripts/sop-check.mjs            # 检查（WARN 不阻断）
node scripts/sop-check.mjs --strict   # CI 用：警告也计为失败
node scripts/sop-check.mjs --json     # 机器可读输出
```

| 级别 | 检查项 |
|------|--------|
| **FAIL** | AGENTS.md / SOP-VERSION 标记缺失、必要 rules 缺失、仍有未填占位符 `{{...}}` |
| **WARN** | 版本漂移（含脚本版本落后提示）、TODO/TBD/待定残留（排除否定语境与代码块）、rules 文件 > 400 行、跨文件重复段落、frontend.md 缺 NFR 节、specs 四件套不齐备（`状态：草稿` 豁免）、缺质量基线快照（在 AGENTS.md「裁剪」区块显式声明不生成可豁免） |
| **WARN（预算）** | 规则体量超预算——AGENTS.md > 4,500 字符、单文件 > 10,000、`rules/` 合计 > 40,000（`sop.config.json` 的 `budgets` 可调；`false` 只关体量预算，>400 行检查仍执行）；每次运行都打印实际体量 |
| **WARN（可选）** | 代码熵扫描——**仅当 `sop.config.json` 里出现代码扫描字段（`srcDirs` / `checks` / `maxFileLines` 等，或显式 `"codeEntropy": true`）才启用**；只写 `budgets` 调预算不会触发扫描。检查超长源码 / console 残留 / any 类型 / 危险 API / 代码 TODO，各项可配阈值与忽略规则；**启用但未匹配到源文件会告警**（避免 srcDirs 写错时空跑）；无配置文件则完全静默 |

接入 CI（示例）：

```yaml
# .github/workflows/sop-check.yml
- run: node scripts/sop-check.mjs --strict
```

> kit 仓库自身也有自检：`node scripts/kit-self-check.mjs`（校验版本一致 / 模板齐全 / 占位符命名 / 废弃 skill 无残留），供 kit 维护者用。

---

## 生成的文件一览

```
<你的项目>/
├── AGENTS.md                          # 统一入口（CodeBuddy + WorkBuddy）+ SOP 版本标记
├── sop.config.json                    # 【可选，默认生成】代码熵硬门禁配置（sop-check 据此扫描源码）
├── ai-context/
│   ├── project-map.md                 # 目录地图 + 项目特有机制
│   ├── prd.md                         # 产品定位 + 模块清单
│   ├── design.md                      # 架构设计 + 特有机制详解
│   ├── quality-baseline.md            # 质量基线快照（体积/覆盖率/tsc/lint + 回归红线）★
│   └── rules/
│       ├── frontend.md                # 代码风格（必读）+ 非功能需求(NFR)节 ★
│       ├── react.md                   # React 项目宪法 ★（第 0 节：代码风格；后续：Hooks/ErrorBoundary/Suspense 等）
│       ├── vue.md                     # Vue 专属约束 ★（仅 Vue 项目）
│       ├── platform.md                # 多端/多环境矩阵
│       ├── workflow.md                # 开发流程纪律 + 任务分类 + 任务闭环
│       ├── planning.md                # 复杂任务规划模式 ★（L3 四阶段：理解→设计→拆解→自审）
│       ├── testing.md                 # 验证基线 + TDD 工作流
│       ├── review.md                  # 五轴 Review 清单 + 可执行检查 ★
│       └── skill-routing.md           # Skill 调度规则（AI PM）★
├── specs/
│   ├── README.md                      # spec 归档说明 + 大/高风险触发判据
│   └── TEMPLATE.md                    # 大需求四件套模板（含交付审计）
├── demo/                              # 【可选，默认不生成】好实践示例（阶段 1 确认需要才生成）
│   └── README.md                      # 实践沉淀默认走 rules「已知陷阱」节
└── scripts/
    └── sop-check.mjs                  # SOP 健康检查 / CI 硬门禁 ★
```

> `react.md` / `vue.md` 根据扫描到的框架**二选一**生成；`specs/` 默认生成空壳 + 说明，随项目发展填充；`demo/` v3.6 起改为**可选**（默认不生成——air-chat 等稳定项目实践证明示例库最终会被移除，实践沉淀走 rules「已知陷阱」更持久）。

---

## 功能流程图谱

本套 SOP 分三层协作：**初始化层**（一次性生成规则文件）、**运行时层**（每次开发自动生效）、**升级层**（模板迭代按需同步）。运行时入口先做复杂度判定（L0-L3），简单任务轻装、复杂任务深度规划。

```mermaid
flowchart TB
    %% ===== 层 1：初始化（Bootstrap）=====
    subgraph BOOT["① 初始化层 · 一次性（Skill 触发）"]
        direction TB
        A0["对 AI 说「初始化 SOP」"] --> A1["sop-init-frontend 扫描项目<br/>框架 · 路由 · 状态 · 样式 · API"]
        A1 --> A2["ui-skill-router 检测已装 Skill<br/>Vercel / Vue 官方 / UI ×4"]
        A2 --> A3["生成 AGENTS.md + ai-context/<br/>rules/ + specs/ + quality-baseline<br/>（demo/ 可选，默认不生成）"]
        A3 --> A4["写入 SOP-VERSION 标记<br/>（升级判定依据）"]
    end

    A4 -.持久化到项目.-> R0

    %% ===== 层 2：运行时（Runtime）=====
    subgraph RUN["② 运行时层 · 每次开发（规则文件常驻）"]
        direction TB
        R0["AI 收到开发任务"] --> R1{"复杂度判定<br/>L0 - L3"}
        R1 -->|"L0 极简"| L0["不加载 rules<br/>直接执行"]
        R1 -->|"L1 简单"| L1["样式规范 + review 五轴<br/>+ 必过关卡（约 3.4K 字符）"]
        R1 -->|"L2 常规"| PH2["完整 SOP 流程"]
        R1 -->|"L3 复杂 / 用户指定"| L3["进入规划模式"]

        L3 --> P1["planning.md 四阶段<br/>理解 → 设计 → 拆解 → 自审"]
        P1 --> HG{"方案已确认?"}
        HG -->|"否 · Hard Gate 阻断"| P1
        HG -->|"是"| PH2

        PH2 --> C1["澄清 · workflow 铁律4<br/>确认 新增/修改 + 落点"]
        C1 --> C2["任务分类 · skill-routing.md<br/>AI PM 判定激活 Skill"]
        C2 --> C3{"UI 密集?"}
        C3 -->|"是"| C4["ui-skill-router 激活<br/>interface-design / ui-ux-pro-max"]
        C3 -->|"否"| C5["纯框架 / 逻辑"]
        C4 --> C6{"大 / 高风险?"}
        C5 --> C6
        C6 -->|"是"| C7["specs/ 四件套<br/>proposal/design/tasks/acceptance"]
        C6 -->|"否"| C8["实现"]
        C7 --> C8
        C8 --> C9["实现 · frontend + react/vue.md<br/>+ Vercel/Vue 官方 Skill（未装降级）"]
        C9 --> C10["自测 · testing.md<br/>tsc + build + 多端"]
        C10 --> C11["Review · review.md 五轴<br/>+ web-design-guidelines / taste-skill"]
        C11 --> RG{"五轴全打勾?"}
        RG -->|"否"| C11
        RG -->|"是"| C12["提交 · conventional commit + PR"]
        C12 --> C13["复盘 · 盲点留存 → rules / skill"]
    end

    %% ===== 层 3：升级（Upgrade）=====
    subgraph UP["③ 升级层 · 模板迭代（按需同步）"]
        direction TB
        U1["第一步 · kit 侧：git pull 更新 SOP 版本<br/>重跑 install.sh 升级 Skill（所有项目通用）"]
        U1 --> U2["第二步 · 项目侧：对 AI 说「更新 SOP」<br/>对比 SOP-VERSION + 增量合并"]
        U2 --> U3["保留 AI-INSERT / 手写内容<br/>新增 quality-baseline.md 等结构<br/>整体覆盖 sop-check.mjs"]
        U3 --> U4["跑 sop-check 确认健康<br/>→ 用户在项目里自行 commit"]
    end
```

> 静态图片版（便于在不支持 Mermaid 渲染的预览中查看）：
>
> ![功能流程图谱](assets/functional-flow.png)
>
> *矢量源文件：[assets/functional-flow.svg](assets/functional-flow.svg)*

---

## 特色机制

- **硬门禁脚本（验证优于说教）** ★：`scripts/sop-check.mjs` 把"AGENTS.md 存在 / 占位符已填 / 版本一致"等软纪律变成 CI 可阻断的硬约束；`--strict` 模式警告也计失败。移植自 harness-engineering。
- **熵检测（entropy GC 窄版本）** ★：sop-check 自动检测 rules 超长（>400 行）、跨文件重复段落、TODO/TBD 残留、**规则体量预算**（AGENTS.md > 4,500 字符 / 单文件 > 10,000 / `rules/` 合计 > 40,000），每次运行都打印实际体量，防止 AI 生成的规则随时间臃肿。移植自 harness-engineering 的 entropy garbage collection。
- **非功能需求（NFR）承载** ★：`frontend.md` 新增「非功能需求」节——性能预算 / 安全基线 / 可访问性 / 浏览器兼容 / 国际化，作为可恢复、可校验的项目级约束。移植自 harness-engineering。
- **累积一致性** ★：复盘时踩过的坑不只写散文，而是沉淀为 `review.md` 可勾选检查项或 `sop-check` 检测规则，让一次踩坑变成后续所有任务的自动约束。移植自 harness-engineering。
- **加载成本分级（L0-L3）** ★：每次任务自动判定复杂度，并按「必读 / 按需 / 跳过」矩阵加载——L0 不读任何 rules、L1 只读「样式规范 + review 五轴 + 必过关卡 + 铁律 4」（约 3.4K 字符）、L2 读规则集（除 planning）、L3 全量 + 深度规划模式。配合**读取纪律**（先 `grep` 章节再按片段读、同一会话不重读、项目文档默认不读），避免把整套 rules 整文件反复读入。简单任务不为不需要的约束买单。
- **复杂任务规划模式** ★：L3 任务触发四阶段规划（理解需求 → 方案设计 → 任务拆解 → 自审），方案确认前**不写任何代码**。融合 ECC `planner.md` 的结构化方案 + Superpowers 的苏格拉底式提问 + bite-sized 任务粒度（2-5 分钟/task）。
- **全生命周期闭环**：复杂度预检 → 澄清 → 任务分类 + Skill 调度 → **规划（L3）** → UI 设计 → spec → 实现 → 自测 → Review → 提交 → 复盘，十一个阶段。
- **TDD 引导** ★：L3 复杂任务强烈建议采用 RED-GREEN-REFACTOR 循环；Bug 修复建议先写复现测试。灵感来自 Superpowers `test-driven-development`。
- **验证前置** ★：禁止未验证就声称完成——必须实际跑过类型检查 + 构建 + 多端验证后才算完成。灵感来自 Superpowers `verification-before-completion`。
- **Spec 自审清单** ★：spec 写好后的 Placeholder 扫描 / 一致性检查 / 范围检查 / 歧义检查，防止 TBD/TODO 污染。灵感来自 Superpowers `writing-plans`。
- **Hard Gate 机制** ★：L3 任务方案确认前禁止写实现代码；Review 五轴全部打勾才能提交。灵感来自 Superpowers 的 HARD GATE 设计。
- **代码风格就地扫描** ★：`react.md`/`vue.md`/`framework-generic.md`/`frontend.md` 在初始化时从项目真实代码中采样 5-10 个文件，提取声明方式、导出模式、类型标注偏好等，**以项目实际写法为准**。样本不足时主动询问用户保留已有风格还是采用官方推荐。
- **用户口述约束注入** ★：初始化或更新 SOP 时主动询问「你是否有额外的代码约束想加入？」，用户口述后 AI 识别并写入对应规则文件（React → `react.md` 0.6 节、Vue → `vue.md` 0.6 节、通用 → `frontend.md`），无需用户手动改配置文件。
- **AI PM 决策层**：内置 `skill-routing.md`，根据任务特征信号自动判定激活哪个 Skill（Vercel 官方 Skill / UI Skill / 框架 Skill），未安装自动降级。
- **框架专属约束**：React 搭配 Vercel 官方 `react-best-practices`（40+ 性能规则）+ `composition-patterns`（组件设计）；Vue 搭配 Vue 官方 `vuejs-ai/skills`（8 个专用 Skill，覆盖最佳实践/路由/Pinia/Composables/测试/调试）；**其他前端框架（Svelte/Angular/Solid/Vanilla）与后端语言（Python/Go/Java/Rust/...）走 `framework-generic.md` 通用兜底**（第 0 节代码风格扫描 + 该栈官方最佳实践）。官方 Skill 未安装时自动降级，不阻塞开发。
- **Skill 调度器**：`ui-skill-router` 协调 15+ 个外部 Skill（Vercel 官方 3 个 + Vue 官方 8 个 + 用户级 UI 4 个）按生命周期接力，未安装时自动降级，不阻塞开发。
- **五轴 Review**：正确性 / 可读性 / 架构 / 安全 / 性能 + 前端专项 + UI 审美/系统化审计（Vercel web-design-guidelines 100+ 规则）。
- **盲点留存**：遇到非显而易见的坑，AI 主动问你是否记成项目规则或 Skill，避免下次再犯（支持写入框架专属陷阱节）。
- **平台自适应**：支持手写路由 / File-based Router / 编译期插件注入等不同路由模式。
- **双工具兼容**：生成的 `AGENTS.md` 与 `ai-context/` 同时被 CodeBuddy 和 WorkBuddy 读取，规则一致。
- **载入契约（重要）**：L0-L3 只是本 SOP 的自定义标签，**工具并不认识它们**——agent 是靠读 `AGENTS.md` 里的「三步判级法」自然语言执行的。所以这套规则生效的前提是 **`AGENTS.md` 进了模型上下文**：CodeBuddy / WorkBuddy 会按约定自动读取；若换用 Cursor / Copilot / Claude Code 等，需把它映射到各自的入口（`.cursor/rules`、`.github/copilot-instructions.md`、`CLAUDE.md` 软链），否则规则等于没装。
- **框架层可插拔兜底** ★：不再只认 React/Vue。检测到 Svelte/Angular/Solid/Vanilla 等**其他前端框架**，或 Python/Go/Java/Rust 等**后端语言**时，自动生成 `rules/framework-generic.md`（第 0 节代码风格扫描 + 通用工程纪律 + 该栈官方最佳实践）。React/Vue 仍走深度专用模板；其余一切走通用兜底，项目约定始终优先。

---

## 其他框架 / 非前端项目怎么办？

本 kit 命名带 "fe"（frontend），但**框架层从 v3.5 起可插拔**——它不会再因为"不是 React/Vue"就退化成只有通用规则。初始化时按以下分类决定生成什么：

| 项目类型 | 检测信号 | 生成的框架级 rules | 说明 |
|---------|---------|------------------|------|
| **React**（含 Next.js / Taro-React / Remix） | `package.json` 含 `react` | `react.md` + `frontend.md` | 深度专用模板 + Vercel 官方 Skill |
| **Vue**（含 Nuxt / Taro-Vue） | `package.json` 含 `vue` | `vue.md` + `frontend.md` | 深度专用模板 + Vue 官方 8 Skill |
| **其他前端框架** | 含 `svelte` / `angular` / `solid` / 纯 `vite`+`vanilla` | `framework-generic.md` + `frontend.md` | 通用兜底，第 2 节填入该框架官方最佳实践 |
| **后端 / 非前端语言** | 含 `go.mod` / `requirements.txt` / `Cargo.toml` / `pom.xml` / 纯后端 `package.json` | `framework-generic.md`（跳过 `frontend.md`） | 质量约束完全由 `framework-generic.md` 的 NFR 节承载 |
| **未知 / 空项目** | 无任何框架信号 | 仅通用 rules（workflow/planning/testing/review/skill-routing） | 用户指定框架后再补 `framework-generic.md` |

**关键机制**：`framework-generic.md` 复用与 `react.md`/`vue.md` **完全相同的「第 0 节代码风格扫描」**——从项目真实源码采样提取声明方式、文件组织、导入约定、命名格式，而非套用教科书。第 1 节是语言无关的通用工程纪律（错误处理/异步/测试/日志），第 2 节由 AI 依据检测到的技术栈填入该语言/框架的官方最佳实践与常见陷阱。

**对后端项目**：`frontend.md` 里"hooks 模式""UI 组件"等前端专属节不适用，因此不生成它；可访问性（NFR 第 3 项）标注「不适用」，其余性能/安全/兼容矩阵照常填写。

**没有预置官方 Skill 的框架**：Svelte/Angular 等没有像 Vercel/Vue 那样的官方 agent Skill 时，不阻塞开发——`skill-routing.md` 自动降级到 `framework-generic.md` 第 2 节 + 通用原则；若社区有对应 Skill，装到用户级后路由表会自动识别。

---

## 已知坑（务必先看）

- **本地记忆不进 git**：`AGENTS.md` / `ai-context/` / `specs/` / `demo/` 入库；`.workbuddy/`、`.codebuddy/`（含 `memery`）不入库，需在项目 `.gitignore` 忽略（生成阶段会自动追加这两行）。


---

<details>
<summary>版本历史（CHANGELOG）</summary>

- **v3.8（当前）**：**上下文成本控制（token 预算）**——① `AGENTS.md` 模板重构：把「进入项目后依次读取 11 个文件」改为「**三步判级法**（数改动面 → 查高风险面 → 兜底默认 L2）+ 加载表（必读 / 按需 / 跳过）+ 读取纪律（先 grep 章节再按片段读、不重读、项目文档默认不读）+ 文件索引表」，并在首条回复自报「判级 + 已读文件」，一次样式改动从「全量 rules（约 2.3 万字符）」降到「样式规范 + review 五轴 + 必过关卡 + 铁律 4（约 3.4K 字符）」；② AGENTS.md 瘦身（模板 3,774 字符，含三步判级法，外部 Skill 安装建议归并到 `skill-routing.md`，分级细则归位 `workflow.md`，删除与 rules 重复的说明）；③ 各 rules 模板加一行「职责 + 按节读」提示（不展开静态目录——目录用 `grep "^## "` 动态获取，避免漂移）；④ `sop-check` 新增**规则体量预算**（AGENTS.md 4,500 / 单文件 10,000 / 合计 40,000 字符，可由 `sop.config.json` 的 `budgets` 覆盖；`false` 只关体量预算，>400 行检查仍执行），每次运行打印实际体量，`--json` 输出 `metrics` 便于 CI 追踪；⑤ 修复 `workflow.md` 中 `demo/` 硬编码残留（改为条件化表述）；⑥ 判级可执行化（二次评审）：**L0-L3 是自定标签、工具不认识**，原「信号」列是模糊描述（多文件/正常功能），改为**三步判级法**——数改动面（≤1/1-2/3-5/>5 文件）→ 查高风险面（鉴权/支付/请求拦截器/构建配置/接口协议等命中即 L3，新增一条路由不算）→ 兜底默认 L2，并要求首条回复自报「判级 + 已读文件」以便核查；⑦ 二次评审修复：**质量基线豁免被文件索引行误触发**（改为只认「裁剪」区块的显式声明）、**代码熵启用但零匹配源文件时静默全绿**（现改为告警）、分级矩阵把 `review.md` / `testing.md` / `skill-routing.md` 降级为「按需」与各自的强制条款冲突（改为**必读、只读命中节**，不动质量红线），并把 `workflow.md` 铁律 4 的任务分类限定到 L2/L3；`kit-self-check` 的 install.sh 版本校验覆盖安装横幅、新增「生成集合计不得超预算」校验；代码熵改为「配置含代码扫描字段（或 `codeEntropy:true`）才启用」，避免只为调 `budgets` 的项目被意外开启扫描。
- **v3.7**：**把「验证优于说教」落到代码层 + 质量可度量**——① 新增可选 `sop.config.json`：项目放置后 `sop-check` 会扫描源码（超长文件 / console 残留 / any 类型 / 危险 API / 代码 TODO），按配置开关与阈值执行、每类输出限流；**不生成则代码熵检查完全静默**（老项目升级不会被刷屏）；② 新增 `ai-context/quality-baseline.md`：初始化时实跑命令采一次质量水位（bundle 体积/覆盖率/tsc/lint）+ 回归红线，作为改动前后对照基准；③ `frontend.md` 新增「设计决策卡」四问（状态放哪儿/组件怎么拆/副作用边界/请求竞态），把资深前端的取舍显式化，避免 AI 过度设计或漏掉竞态；④ 修 v3.6 Review 遗漏：install.sh 版本号、README/SKILL 中 demo/ 描述、spec 目录白名单过滤、TODO 否定语境改就近判定、spec 状态行必填强调。
- **v3.6**：**检查器自检与升级闭环修复**（源自 air-chat 实战评审）——① 修复 sop-check.mjs 全局正则 `lastIndex` 跨文件串扰（`todoRe` / `placeholderRe` 带 `/g` 在循环里 `.test()` 导致漏报/误报）；② TODO 检测排除否定语境与代码块（规则里「禁止：TBD」不再被误报为待办残留）；③ 新增 specs 四件套完整性检查（`状态：草稿` 豁免，残缺目录 WARN）；④ 脚本内嵌 `SOP-CHECK-VERSION` 标记并在输出打印，kit-self-check 校验其与 kit 版本一致，SKILL.md 增量更新流程明确「脚本类文件一律以 kit 最新版整体覆盖」（修复项目脚本停留在旧版、文档宣称能力与实际脱节的问题）；⑤ spec 状态机补「待验证」中间态 + 状态流转约定 + 「验证边界声明」节（部分完成的正式出口，防止状态与验证记录自相矛盾）；⑥ demo/ 改为可选（默认不生成），AGENTS.md 模板新增「本项目对 SOP 的裁剪」区块统一声明删减、升级时保留。
- **v3.5**：**框架层可插拔兜底**——不再只认 React/Vue。新增 `rules/framework-generic.md` 通用模板：第 0 节代码风格扫描（与 react.md/vue.md 同机制）+ 通用工程纪律 + 该栈官方最佳实践。初始化时按分类（React / Vue / 其他前端框架 / 后端语言 / 未知）决定生成哪个框架 rules；后端项目跳过 `frontend.md`，质量约束由 `framework-generic.md` NFR 节承载。`sop-check.mjs` 框架文件要求改为 react/vue/generic 至少其一，`frontend.md`/`platform.md` 降级为 WARN。
- **v3.4**：移植 harness-engineering 优点——新增 `scripts/sop-check.mjs` 硬门禁脚本（验证优于说教：占位符/版本/规则完整性 CI 可阻断）+ 熵检测（超长/重复/TODO）；新增 `scripts/kit-self-check.mjs`（kit 侧 evals）；`frontend.md` 新增「非功能需求 NFR」节（性能/安全/可访问/兼容/i18n 作为可恢复约束）；`review.md` 五轴增加可执行检查命令；复盘阶段增加「累积一致性」（坑沉淀为可勾选检查项/sop-check 规则）。
- **v3.3**：新增「复杂度分级 L0-L3」——简单任务轻装上阵、复杂任务深度武装；新增 L3 复杂任务规划模式 `planning.md`（融合 ECC `planner.md` 结构化方案 + Superpowers `brainstorming` 苏格拉底提问 + `writing-plans` bite-sized 任务粒度）；引入 TDD 引导、验证前置、Spec 自审清单、Hard Gate 机制。
- **v3.2**：接入 Vue 官方 `vuejs-ai/skills`（8 个专用 Skill）；`install.sh` 改为互动式（按 React/Vue 选择，仅给出安装指令不自动执行，避免替用户装无用 Skill）；废弃自有 `vue-best-practices`。
- **v3.0 / v3.1**：接入 Vercel 官方 `react-best-practices` / `composition-patterns` / `web-design-guidelines` 替代自有 React 约束；新增项目代码风格就地扫描（react.md/vue.md 第 0 节，以项目真实写法为准）；用户口述约束注入；样本不足时主动询问降级。
- **v1 / v2**：基础九阶段 SOP 生命周期；AI PM 决策层 `skill-routing.md`；UI Skill 路由（interface-design / ui-ux-pro-max / impeccable / taste-skill）。

</details>


