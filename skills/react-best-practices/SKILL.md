---
name: react-best-practices
description: [DEPRECATED — v3.0 起废弃] 已被 Vercel 官方 react-best-practices 替代。本 skill 随 SOP v3.0 起不再由 install.sh 安装。原 Hooks/ErrorBoundary 等规则已合并入 rules/react.md。
agent_created: true
---

# react-best-practices — 已废弃

本 Skill 已被 **Vercel 官方 `react-best-practices`** 替代。

## 为什么废弃

Vercel 官方的 `react-best-practices`：
- 40+ 条规则，8 大性能类别，按影响排序（CRITICAL → LOW）
- 覆盖 waterfall 消除、bundle 优化、server-side rendering、re-render 优化
- 由 Vercel 工程团队持续维护
- 本 Skill 的「实时约束」和「性能规则」能力已被其完全覆盖且更优

## 原功能迁移

| 原功能 | 去处 |
|--------|------|
| Hooks 规则 / ErrorBoundary / Suspense / Context / Ref 规范 | → `rules/react.md`（项目级规则文件） |
| 性能优化（waterfall / bundle / re-render） | → Vercel 官方 `react-best-practices` |
| 实时约束检查 | → Vercel 官方 `react-best-practices` 自动执行 |
| 项目特定代码风格 | → `rules/react.md` 第 0 节（从真实代码扫描提取） |

## 迁移步骤（团队成员）

1. 安装 Vercel 官方 Skill：`npx skills add vercel-labs/agent-skills`
2. 重新运行 SOP 安装脚本：`./scripts/install.sh`
3. 在已有项目中说 **「更新 SOP」** 同步 latest `react.md` 模板
4. 完成 — 之后所有 React 项目自动使用 Vercel Skill + 项目的 `rules/react.md`
