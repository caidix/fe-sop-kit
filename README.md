# sop-frontend-kit — 前端项目 AI 协作脚手架（可插拔）

## 这是什么
一套**可复用的前端 AI 协作规范模板包**。放到任意前端项目中，调用一次，AI 自动扫描项目结构并生成定制的 `AGENTS.md` + `ai-context/` 上下文文件 + `rules/` 开发规则 + `specs/` 大需求归档模板 + `demo/` 好实践示例。**支持 CodeBuddy + WorkBuddy 双工具。**

## 安装（给同事用）

本 kit 同时支持 WorkBuddy 与 CodeBuddy **用户级**安装，装后任意前端项目都能调用。

### WorkBuddy
```bash
cp -r skills/sop-init-frontend ~/.workbuddy/skills/sop-init-frontend
```
重启 WorkBuddy（或刷新技能），在任意前端项目对话中输入 **「初始化 SOP」** 即可触发。

### CodeBuddy
```bash
cp -r skills/sop-init-frontend ~/.codebuddy/skills/sop-init-frontend
```
重启 CodeBuddy，同样输入 **「初始化 SOP」** 触发。
> 若 CodeBuddy 未自动识别：检查 `设置 → 技能` 中是否已启用 `sop-init-frontend`，并确认目录结构为 `~/.codebuddy/skills/sop-init-frontend/SKILL.md`。

### 手动使用模板（不装 skill）
手动复制 `skills/sop-init-frontend/templates/` 下模板，按 `{{占位符}}` 与 `<!-- AI-INSERT: xxx -->` 标记自行填充。

## 已知坑（务必先看）
- **CodeBuddy 本地记忆目录名为 `memery`（不是 `memory`）**：skill 落地本地记忆时写 `{project}/.codebuddy/memery/`，不是 `.codebuddy/memory/`。SKILL.md 已内置此修正，别手动改回。
- **本地记忆不进 git**：`AGENTS.md` / `ai-context/` / `specs/` / `demo/` 入库；`.workbuddy/`、`.codebuddy/`（含 `memery`）不入库，需在项目 `.gitignore` 忽略（kit 生成阶段会自动追加这两行）。
- **路由登记点别猜**：Taro 等框架路由由编译期插件注入，真实源头在 `config/settings/router.config.js`，而非手写 `src/router.ts`。生成 `project-map.md` 时必须先确认路由模式。

## 怎么用
1. 打开你的前端项目（React / Vue / Taro / Next.js … 均可）
2. 对 AI 说：**「初始化 SOP」** 或 **「建立 AI 协作规范」**
3. AI 会先扫描项目结构（框架、路由、状态管理、样式、API 层等），出示扫描结果让你确认
4. 确认后自动生成全套文件到项目内
5. 此后每次开发任务，AI 都会自动遵循生成的规则

## 生成的文件一览
```
<你的项目>/
├── AGENTS.md                          # 统一入口（CodeBuddy + WorkBuddy）
├── ai-context/
│   ├── project-map.md                 # 目录地图 + 项目特有机制
│   ├── prd.md                         # 产品定位 + 模块清单
│   ├── design.md                      # 架构设计 + 特有机制详解
│   └── rules/
│       ├── frontend.md                # 代码风格
│       ├── platform.md                # 多端/多环境矩阵
│       ├── workflow.md                # 开发流程纪律 + 任务闭环
│       ├── testing.md                 # 验证基线
│       └── review.md                  # 五轴 Review 清单
└── specs/
    └── TEMPLATE.md                    # 大需求四件套模板（含交付审计）
```

## 特色机制
- **全生命周期闭环**：覆盖 澄清 → spec → 实现 → 自测 → Review → 提交 → 复盘 七个阶段，不只在写代码时帮忙。
- **五轴 Review**：正确性 / 可读性 / 架构 / 安全 / 性能 + 前端专项（多端、a11y、UI 状态完整度）。
- **盲点留存**：开发中遇到非显而易见的坑，AI 会主动问你是否要记成项目规则或 WorkBuddy skill，避免下次再犯。
- **平台自适应**：支持手写路由 / File-based Router / 编译期插件注入等不同路由模式。
- **双工具兼容**：生成的 AGENTS.md 与 ai-context 同时被 CodeBuddy 和 WorkBuddy 读取，规则一致。

## 版本
- v1.1（2026-07-31）：补充双工具（WorkBuddy + CodeBuddy）安装说明与已知坑（memery 目录拼写、路由注入、gitignore 隔离）
- v1.0（2026-07-31）
