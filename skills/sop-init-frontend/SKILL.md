---
name: sop-init-frontend
description: 可插拔的前端项目 AI 协作脚手架初始化。放入任意前端项目后调用，自动扫描项目结构并生成 AGENTS.md + ai-context/ + rules/ + specs/ + demo/。适配 React/Vue/Taro/Next.js 等主流前端框架。
---

# sop-init-frontend — 前端项目 AI 协作脚手架初始化（可插拔）

## 模板来源
本 skill 自带 `templates/` 目录，内含所有生成文件的骨架模板。生成时**优先按模板骨架填充**，只替换模板中的 `{{占位符}}` 与 `<!-- AI-INSERT: xxx -->` 标记区域，保持格式稳定。

## 触发条件
用户在任意前端项目中说 **「初始化 SOP」「建立 AI 协作规范」「sop-init-frontend」「生成项目 rules」** 时执行。

---

## 阶段 0：扫描与理解（只读）

对项目根目录执行探索，覆盖以下 13 维度：

| 维度 | 获取方式 |
|------|----------|
| 框架与构建工具 | `package.json` dependencies：搜索 react/vue/angular/svelte、vite/webpack/turbopack/next/taro |
| 语言与类型 | `tsconfig.json` 是否存在、`package.json` 的 `type` 字段 |
| 路由系统 | 搜索 `router`/`routes`/`pages` 目录；是否为框架内建（Next.js App Router）或第三方注入（Taro 插件） |
| 状态管理 | `package.json` 搜索 redux/pinia/zustand/mobx/recoil/jotai |
| 样式方案 | 搜索 scss/less/tailwind/styled-components/css-modules |
| UI 组件库 | 搜索 antd/element-plus/naive-ui/taro-ui/radix-ui/shadcn |
| API 层 | 搜索 axios/fetch/umi-request、`api/`、`request` 封装文件 |
| 认证鉴权 | 搜索 login/auth/token/JWT/OAuth/路由守卫 |
| 多端/多环境 | 搜索 platform/weapp/h5、构建脚本中的 env 变量 |
| 独特架构模式 | 搜索 plugin/inject/micro/monorepo/loader 等模式 |
| 测试方案 | `package.json` scripts 的 test/vitest/jest |
| Lint/Format | 搜索 eslint/prettier/.eslintrc |
| Git 作者风格 | `git log --pretty=format:"%an" -30 | sort | uniq -c | sort -rn`（有 git 时） |

---

## 阶段 1：询问确认（交互）

用表格出示扫描结论，然后追问：

1. **项目身份**：产品名称？一句话定位？
2. **代码风格**：沿用特定作者的风格还是通用最佳实践？
3. **平台现实**：主产物 + 所有编译目标？
4. **AI 协作铁律**：是否有类似"先澄清再动手""好实践入 demo""本地记忆不进 git"的约定？
5. **特殊机制**：是否有编译期插件注入、全局组件注入、微前端、getAppInfo 类全局单例等特殊架构？这问是关键——**猜错路由登记点可能让后续所有任务在错误文件上操作**。
6. **分工模式**：单人 or 多人？是否需要主包/分包区分？

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
│       ├── testing.md                 # 从 templates/ai-context/rules/testing.md.template
│       └── review.md                  # 从 templates/ai-context/rules/review.md.template
├── specs/
│   ├── README.md                      # 从 templates/specs/README.md.template
│   └── TEMPLATE.md                    # 从 templates/specs/TEMPLATE.md.template
└── demo/
    └── README.md                      # 从 templates/demo/README.md.template
```

### 生成要求
- **project-map.md**：精确标注路由注册点（手写 / file-based / 插件注入），附构建命令速查。
- **design.md**：若扫描到特殊机制（插件注入、全局单例、微前端等），必须用独立章节详解。
- **rules/frontend.md**：从真实代码提取风格（导出方式、命名规范、hooks 模式，标注风格来源）。
- **rules/testing.md**：无单测项目 → 验证基线 = `类型检查 + 构建`，补自测清单。
- **rules/platform.md**：多端项目必须列出部署矩阵 + 每端验证命令。
- **.gitignore**：在项目根或子项目 `.gitignore` 追加 `.workbuddy/` `.codebuddy/` 行。

---

## 生成后的闭环：开发任务全生命周期路由

SOP 初始化后，日常任务按以下阶段流转。AI 在每阶段自动读取对应规则：

```
接到任务
  │
  ├─→ 澄清（workflow.md 铁律 4）
  │     确认新增/修改 + 落点
  │
  ├─→ 大/高风险？（workflow.md 判据）
  │     是 → specs/ 四件套 → 确认后再动手
  │     否 → 直接实现
  │
  ├─→ 实现（frontend.md 风格）
  │
  ├─→ 自测（testing.md 基线）
  │     tsc + build + 多端验证
  │
  ├─→ Review（review.md 五轴清单）
  │     + 填 acceptance 验证记录
  │
  ├─→ 提交（workflow.md 闭环 C）
  │     conventional commit + PR 证据链
  │
  ├─→ 交付后复盘（workflow.md 闭环 D）
  │     问"有坑吗？"→ 记 rules / skill / demo
  │
  └──→ 下一任务
```

AI 在对应阶段的行为：
| 阶段 | 触发条件 | AI 动作 |
|------|----------|---------|
| **澄清** | 收到任何开发任务 | 先问「新增/修改 + 功能 + 落点」 |
| **Spec** | 用户确认走 specs | 按 TEMPLATE.md 建四件套目录 |
| **实现** | spec 确认 / 小任务直接开始 | 读 `frontend.md`，按风格写 |
| **自测** | 实现完成 | 提醒跑 `tsc --noEmit` + 目标构建 |
| **Review** | 自测通过 | 开 `review.md` 五轴检查，填验收证据 |
| **提交** | Review 通过 | 帮生成 conventional commit 消息 + PR 描述 |
| **复盘** | 代码合入 | 主动问"有坑吗"，写入 rules/demo/skill |

---

## 阶段 3：落地到本地 AI 记忆（双工具通用）

- 项目核心约定摘要 → WorkBuddy：`{workspace}/.workbuddy/memory/MEMORY.md`；CodeBuddy：`{workspace}/.codebuddy/memery/MEMORY.md`（注意：CodeBuddy 该目录名为 `memery`，非 `memory`）
- 当日日志：`YYYY-MM-DD.md`，上述两目录各写一份
- 若用户确认了"先澄清再开发"等铁律 → 创建项目级 skill 编码为自动行为：WorkBuddy `{workspace}/.workbuddy/skills/`、CodeBuddy `{workspace}/.codebuddy/skills/`

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
- 解决了一个不在现有 `ai-context/` 或 `rules/` 中记载的问题
- 修复了因违反项目特有架构约束（如路由注入、初始化时序、配置覆盖顺序）导致的 bug
- 花了超过 3 个回合才定位到的配置/环境/平台差异问题
- 用户明确说"记住这个" 或 "下次别犯这个错"

---

## 与已有 SOP 项目共存
若项目已有 `AGENTS.md`，询问：覆盖 / 合并 / 跳过。合并时保留用户手写部分，仅补充缺失。
