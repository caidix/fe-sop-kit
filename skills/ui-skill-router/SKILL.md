---
name: ui-skill-router
description: UI Skill 调度器（AI PM 层）。在任务分类阶段读取 skill-routing.md，根据任务特征信号决定激活哪个 UI/Vercel Skill，处理 Skill 未安装时的降级策略，确保 Skill 按生命周期接力。随 sop-init-frontend 安装到用户级。
agent_created: true
---

# ui-skill-router — UI / React Skill 调度器

## 定位

本 Skill 是 SOP 体系中 **Skill 能力的决策层**，不直接做 UI 设计或性能优化，而是决定"当前任务应该激活哪个 Skill，按什么顺序"。它相当于 AI 产品经理的 Skill 调度代理。

## 触发条件

在已初始化 SOP 的项目中，**任务分类阶段**自动触发。具体条件：

- 任务涉及页面新增/改版/UI 变更
- 用户提供了设计稿/Figma 链接/截图
- 用户提到了 UI/React 相关关键词（表格/表单/搜索/筛选/导航/动画/性能/组件封装）
- 任务走 specs/ 且 spec 中包含 UI 相关章节

## 决策流程

```
任务分类
  │
  ├─→ 1. 读取 rules/skill-routing.md（新版含 Vercel Skill 矩阵）
  │
  ├─→ 2. 分析任务特征信号
  │     ├─ 检测关键词
  │     ├─ 检测设计稿/截图
  │     └─ 检测任务类型标记
  │
  ├─→ 3. 匹配任务分类矩阵（skill-routing.md 第一节）
  │     ├─ 命中「新页面/UI 大改版」→ 激活 interface-design（设计阶段）
  │     ├─ 命中「设计稿还原」→ 激活 impeccable（实现阶段）
  │     ├─ 命中「标准 UX 组件」→ 激活 ui-ux-pro-max + Vercel react-best-practices
  │     ├─ 命中「组件库开发」→ 激活 Vercel composition-patterns
  │     ├─ 命中「性能优化」→ 激活 Vercel react-best-practices（核心）
  │     ├─ 命中「纯逻辑/Bug」→ 仅激活 Vercel react-best-practices（如已安装）
  │     └─ 未命中 → 按默认规则处理
  │
  ├─→ 4. 检查 Skill 可用性（两级检测）
  │     ├─ 官方 Skills：检查 Vercel react-best-practices / Vue vue-best-practices 等是否存在（~/.workbuddy/skills/）
  │     └─ 用户级 UI Skills：检查 interface-design / ui-ux-pro-max / impeccable / taste-skill 等是否存在
  │
  ├─→ 5. 按阶段接力激活
  │     ├─ 设计阶段：interface-design / ui-ux-pro-max
  │     ├─ 实现阶段：impeccable + Vercel react-best-practices（如有）+ composition-patterns（如有）
  │     └─ Review 阶段：taste-skill / web-design-guidelines（二者择一或互补）
  │
  └─→ 6. 输出激活计划（告知用户当前任务将使用哪些 Skill，哪些因未安装而降级）
```

## 检测的 Skill 列表

### Vercel 官方（通过 `npx skills add vercel-labs/agent-skills` 安装）

| Skill | 检测路径（WorkBuddy） | 检测路径（CodeBuddy） |
|-------|---------------------|---------------------|
| `react-best-practices` | `~/.workbuddy/skills/react-best-practices/SKILL.md` | `~/.codebuddy/skills/react-best-practices/SKILL.md` |
| `web-design-guidelines` | `~/.workbuddy/skills/web-design-guidelines/SKILL.md` | `~/.codebuddy/skills/web-design-guidelines/SKILL.md` |
| `composition-patterns` | `~/.workbuddy/skills/composition-patterns/SKILL.md` | `~/.codebuddy/skills/composition-patterns/SKILL.md` |

### Vue 官方（通过 `npx skills add vuejs-ai/skills` 安装）

| Skill | 检测路径（WorkBuddy） | 检测路径（CodeBuddy） |
|-------|---------------------|---------------------|
| `vue-best-practices` | `~/.workbuddy/skills/vue-best-practices/SKILL.md` | `~/.codebuddy/skills/vue-best-practices/SKILL.md` |
| `vue-router-best-practices` | `~/.workbuddy/skills/vue-router-best-practices/SKILL.md` | `~/.codebuddy/skills/vue-router-best-practices/SKILL.md` |
| `vue-pinia-best-practices` | `~/.workbuddy/skills/vue-pinia-best-practices/SKILL.md` | `~/.codebuddy/skills/vue-pinia-best-practices/SKILL.md` |
| `create-adaptable-composable` | `~/.workbuddy/skills/create-adaptable-composable/SKILL.md` | `~/.codebuddy/skills/create-adaptable-composable/SKILL.md` |
| `vue-testing-best-practices` | `~/.workbuddy/skills/vue-testing-best-practices/SKILL.md` | `~/.codebuddy/skills/vue-testing-best-practices/SKILL.md` |
| `vue-jsx-best-practices` | `~/.workbuddy/skills/vue-jsx-best-practices/SKILL.md` | `~/.codebuddy/skills/vue-jsx-best-practices/SKILL.md` |
| `vue-debug-guides` | `~/.workbuddy/skills/vue-debug-guides/SKILL.md` | `~/.codebuddy/skills/vue-debug-guides/SKILL.md` |

### 用户级 UI Skill（用户自行安装）

| Skill | 检测路径（WorkBuddy） | 检测路径（CodeBuddy） |
|-------|---------------------|---------------------|
| `interface-design` | `~/.workbuddy/skills/interface-design/SKILL.md` | `~/.codebuddy/skills/interface-design/SKILL.md` |
| `ui-ux-pro-max` | `~/.workbuddy/skills/ui-ux-pro-max/SKILL.md` | `~/.codebuddy/skills/ui-ux-pro-max/SKILL.md` |
| `impeccable` | `~/.workbuddy/skills/impeccable/SKILL.md` | `~/.codebuddy/skills/impeccable/SKILL.md` |
| `taste-skill` | `~/.workbuddy/skills/taste-skill/SKILL.md` | `~/.codebuddy/skills/taste-skill/SKILL.md` |

### 自有 Skill（随 SOP install.sh 安装）

| Skill | 安装方式 |
|-------|---------|
| `ui-skill-router`（本 Skill） | `./scripts/install.sh` → `~/.workbuddy/skills/ui-skill-router/` |
| `sop-init-frontend` | `./scripts/install.sh` → `~/.workbuddy/skills/sop-init-frontend/` |

> React/Vue 最佳实践 Skill 已改用官方版本（Vercel / vuejs-ai），本仓库不再维护自有版本。

---

## 降级策略

当 Skill 未安装时，本 Skill 自动降级：

| 缺失 Skill | 降级行为 | 用户提示 |
|-----------|---------|---------|
| **Vercel react-best-practices** | 使用 `rules/react.md` 做 React 约束 + 通用性能原则 | "建议安装 Vercel react-best-practices：`npx skills add vercel-labs/agent-skills`" |
| **Vercel web-design-guidelines** | 依赖 taste-skill（如有）或 review.md UI 检查清单 | "建议安装 Vercel web-design-guidelines 以获得系统化 UI 审计" |
| **Vercel composition-patterns** | 使用通用组件设计原则 | "建议安装 Vercel composition-patterns 以获得组件 API 设计指导" |
| **Vue vue-best-practices** | 使用 `rules/vue.md` + Vue 3 通用知识 | "建议安装 Vue 官方 skills：`npx skills add vuejs-ai/skills`" |
| **Vue (其他)** | 使用对应官方文档通用知识 | "建议安装 Vue 官方 skills 以获得专业指导" |
| **interface-design** | AI 用设计原则给出布局建议，人工确认 | "建议安装 `interface-design` skill" |
| **ui-ux-pro-max** | 从组件库文档提取标准用法 | "建议安装 `ui-ux-pro-max` skill" |
| **impeccable** | 对照设计稿手动还原 | "建议安装 `impeccable` skill" |
| **taste-skill** | 依赖 review.md 的 UI 状态检查 | "建议安装 `taste-skill` skill" |

---

## 阶段接力规则

### 设计阶段 → 实现阶段
```
interface-design 输出（布局/信息架构）
  │
  ├─→ 用户确认？
  │     ├─ 是 → 进入实现阶段 → 激活 impeccable + Vercel react-best-practices
  │     └─ 否 → 修改后重新确认（最多 3 轮）
```

### 实现阶段 → Review 阶段
```
UI 代码实现完成
  │
  ├─→ 本次任务有 UI 变更？
  │     ├─ 是 → 检查 web-design-guidelines 可用性
  │     │        ├─ 可用 → 激活 web-design-guidelines（系统化审计）
  │     │        └─ 不可用 → 尝试 taste-skill → 降级到 review.md
  │     └─ 否 → 跳过（正常 review.md 流程）
```

---

## 输出格式

在任务分类阶段结束后，本 Skill 输出一个简短的激活计划：

```
📋 任务分类结果
  ├─ 类型：新页面开发
  ├─ UI Skill 激活计划：
  │   ├─ [设计阶段] interface-design — 信息架构与布局设计
  │   ├─ [实现阶段] impeccable — 像素级代码还原
  │   └─ [Review 阶段] web-design-guidelines — 系统化 UI 审计
  ├─ 框架 Skill：Vercel react-best-practices（全程激活，已安装 ✓）
  ├─ 组件 Skill：Vercel composition-patterns（实现阶段，已安装 ✓）
  └─ 状态：interface-design 未安装 ✗，将使用通用设计原则
```

## 与 SOP 生命周期的关系
- **澄清阶段**：不激活
- **任务分类阶段**：**首次激活**，做出 Skill 调度决策
- **UI 设计阶段**：调度 interface-design / ui-ux-pro-max
- **Spec 阶段**：如果走 specs/，确认 spec 中包含 UI 设计章节
- **实现阶段**：调度 impeccable + Vercel react-best-practices + composition-patterns 并行
- **Review 阶段**：**二次激活**，决定用 web-design-guidelines 还是 taste-skill
- **复盘阶段**：不激活（除非有 UI 相关的坑要记录）

## 与项目 Rules 的关系

本 Skill 调度的所有外部 Skill 都是**补充建议**。最高优先级始终是项目自动生成的规则文件：
- `rules/react.md`（第 0 节：从项目代码扫描提取的实际风格）
- `rules/frontend.md`（通用代码风格）
- `rules/review.md`（五轴审查清单）

外部 Skill 的建议不能覆盖项目规则——这是硬约束。
