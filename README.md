# sop-frontend-kit — 前端项目 AI 协作脚手架（可插拔）

一套**可复用的前端 AI 协作规范模板包**。放到任意前端项目中调用一次，AI 自动扫描项目结构并生成 `AGENTS.md` + `ai-context/` + `rules/` + `specs/` + `demo/`。支持 CodeBuddy / WorkBuddy 双工具。

---

## 安装（一键）

在仓库根目录执行：

```bash
./scripts/install.sh
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

> 脚本也支持非互动模式：`./scripts/install.sh --all-react` / `--all-vue` / `--all`（CI 用）。
>
> Windows 用户用 Git Bash 运行。

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
5. 此后每次开发任务，AI 都会自动遵循生成的规则

---

## 升级已初始化的项目

本仓库 SOP 模板改动后，已初始化的项目需同步，**分两步**：

**第一步：升级 Skill（所有项目通用）** —— 重跑安装脚本，所有项目立即用上最新 Skill 版本：

```bash
./scripts/install.sh        # 或 all
```

**第二步：同步项目内的 rules（按需）** —— 在**已初始化的项目**里对 AI 说 **「更新 SOP」** 或 **「同步最新规范」**，AI 会：

1. 读取项目 `AGENTS.md` 顶部的 `SOP-VERSION` 标记，对比本仓库版本
2. **增量合并**——保留你已填充的内容（AI-INSERT 区域、已知陷阱、手写章节），只新增/更新模板结构变化
3. 新增旧版本没有的文件（如 v1→v2 新增的 `react.md` / `skill-routing.md`）
4. 更新 `AGENTS.md` 的版本标记与导航
5. 输出变更报告，并在合并前对 `ai-context/` 做一次 git 备份

> 不会直接覆盖项目内容。遇到无法安全合并的冲突会停下来询问你如何处理。

每个生成的项目 `AGENTS.md` 顶部都有 `<!-- SOP-VERSION: x.y -->`，这是「更新 SOP」判断是否需要升级的依据。

---

## 生成的文件一览

```
<你的项目>/
├── AGENTS.md                          # 统一入口（CodeBuddy + WorkBuddy）+ SOP 版本标记
├── ai-context/
│   ├── project-map.md                 # 目录地图 + 项目特有机制
│   ├── prd.md                         # 产品定位 + 模块清单
│   ├── design.md                      # 架构设计 + 特有机制详解
│   └── rules/
│       ├── frontend.md                # 代码风格（必读）
│       ├── react.md                   # React 项目宪法 ★（第 0 节：代码风格；后续：Hooks/ErrorBoundary/Suspense 等）
│       ├── vue.md                     # Vue 专属约束 ★（仅 Vue 项目）
│       ├── platform.md                # 多端/多环境矩阵
│       ├── workflow.md                # 开发流程纪律 + 任务分类 + 任务闭环
│       ├── testing.md                 # 验证基线
│       ├── review.md                  # 五轴 Review 清单
│       └── skill-routing.md           # Skill 调度规则（AI PM）★
├── specs/
│   ├── README.md                      # spec 归档说明 + 大/高风险触发判据
│   └── TEMPLATE.md                    # 大需求四件套模板（含交付审计）
└── demo/
    └── README.md                      # 好实践示例（参考，不入库构建）
```

> `react.md` / `vue.md` 根据扫描到的框架**二选一**生成；`specs/`、`demo/` 默认生成空壳 + 说明，随项目发展填充。

---

## 特色机制

- **全生命周期闭环**：澄清 → 任务分类 + Skill 调度 → UI 设计 → spec → 实现 → 自测 → Review → 提交 → 复盘，九个阶段，不只在写代码时帮忙。
- **代码风格就地扫描** ★：`react.md`/`vue.md`/`frontend.md` 在初始化时从项目真实代码中采样 5-10 个组件，提取声明方式、导出模式、类型标注偏好等，**以项目实际写法为准**。样本不足时主动询问用户保留已有风格还是采用官方推荐。
- **用户口述约束注入** ★：初始化或更新 SOP 时主动询问「你是否有额外的代码约束想加入？」，用户口述后 AI 识别并写入对应规则文件（React → `react.md` 0.6 节、Vue → `vue.md` 0.6 节、通用 → `frontend.md`），无需用户手动改配置文件。
- **AI PM 决策层**：内置 `skill-routing.md`，根据任务特征信号自动判定激活哪个 Skill（Vercel 官方 Skill / UI Skill / 框架 Skill），未安装自动降级。
- **框架专属约束**：React 搭配 Vercel 官方 `react-best-practices`（40+ 性能规则）+ `composition-patterns`（组件设计）；Vue 搭配 Vue 官方 `vuejs-ai/skills`（8 个专用 Skill，覆盖最佳实践/路由/Pinia/Composables/测试/调试）。官方 Skill 未安装时自动降级，不阻塞开发。
- **Skill 调度器**：`ui-skill-router` 协调 15+ 个外部 Skill（Vercel 官方 3 个 + Vue 官方 8 个 + 用户级 UI 4 个）按生命周期接力，未安装时自动降级，不阻塞开发。
- **五轴 Review**：正确性 / 可读性 / 架构 / 安全 / 性能 + 前端专项 + UI 审美/系统化审计（Vercel web-design-guidelines 100+ 规则）。
- **盲点留存**：遇到非显而易见的坑，AI 主动问你是否记成项目规则或 Skill，避免下次再犯（支持写入框架专属陷阱节）。
- **平台自适应**：支持手写路由 / File-based Router / 编译期插件注入等不同路由模式。
- **双工具兼容**：生成的 `AGENTS.md` 与 `ai-context/` 同时被 CodeBuddy 和 WorkBuddy 读取，规则一致。

---

## 已知坑（务必先看）

- **CodeBuddy 本地记忆目录名为 `memery`（不是 `memory`）**：skill 落地本地记忆时写 `{project}/.codebuddy/memery/`。SKILL.md 已内置此修正，别手动改回。
- **本地记忆不进 git**：`AGENTS.md` / `ai-context/` / `specs/` / `demo/` 入库；`.workbuddy/`、`.codebuddy/`（含 `memery`）不入库，需在项目 `.gitignore` 忽略（生成阶段会自动追加这两行）。
- **路由登记点别猜**：Taro 等框架路由由编译期插件注入，真实源头在 `config/settings/router.config.js` 而非手写 `src/router.ts`。生成 `project-map.md` 前必须先确认路由模式。


