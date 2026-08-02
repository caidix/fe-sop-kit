---
name: vue-best-practices
description: [DEPRECATED — v3.2 起废弃] 已被 Vue 官方 vuejs-ai/skills 替代。本 skill 随 SOP v3.2 起不再由 install.sh 安装。原 Composables/响应式等规则已合并入 rules/vue.md。
agent_created: true
---

# vue-best-practices — 已废弃

本 Skill 已被 **Vue 官方 `vuejs-ai/skills`** 替代。

## 为什么废弃

Vue 官方的 `vuejs-ai/skills` 包含 8 个专用 Skill：
- **vue-best-practices** — Vue 3 + Composition API + TypeScript 最佳实践
- **vue-router-best-practices** — Vue Router 4 导航守卫/路由生命周期
- **vue-pinia-best-practices** — Pinia 状态管理约定
- **create-adaptable-composable** — 可复用组合函数模式（MaybeRef/MaybeRefOrGetter）
- **vue-testing-best-practices** — Vitest/Vue Test Utils/Playwright
- **vue-jsx-best-practices** — Vue JSX 语法差异
- **vue-debug-guides** — 运行时错误/ hydration 问题排错
- **vue-options-api-best-practices** — Options API 模式（存量项目）

覆盖范围远超本 Skill，且通过自动化 eval 验证（每条规则需证明在 baseline → with-skill 后有实际提升才保留）。

## 原功能迁移

| 原功能 | 去处 |
|--------|------|
| Composition API / Composables 规范 | → Vue 官方 `vue-best-practices` + `rules/vue.md` |
| ref vs reactive 选择 | → Vue 官方 `vue-best-practices` |
| watch/watchEffect 模式 | → Vue 官方 `vue-best-practices` |
| Pinia 约定 | → Vue 官方 `vue-pinia-best-practices` + `rules/vue.md` |
| 项目特定代码风格 | → `rules/vue.md` 第 0 节（从真实代码扫描提取） |

## 迁移步骤（团队成员）

1. 安装 Vue 官方 Skill：`npx skills add vuejs-ai/skills`
2. 重新运行 SOP 安装脚本：`./scripts/install.sh`
3. 在已有项目中说 **「更新 SOP」** 同步 latest `vue.md` 模板
4. 完成 — 之后所有 Vue 项目自动使用 Vue 官方 Skill + 项目的 `rules/vue.md`
