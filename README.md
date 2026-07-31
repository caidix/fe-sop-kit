# sop-frontend-kit — 前端项目 AI 协作脚手架（可插拔）

## 这是什么
一套**可复用的前端 AI 协作规范模板包**。放到任意前端项目中，调用一次，AI 自动扫描项目结构并生成定制的 `AGENTS.md` + `ai-context/` 上下文文件 + `rules/` 开发规则 + `specs/` 大需求归档模板 + `demo/` 好实践示例。**支持 CodeBuddy + WorkBuddy 双工具。**

## 安装（给同事用）

### 方式一：WorkBuddy Skill 安装（推荐）
```bash
# 将整个 sop-init-frontend 文件夹拷贝到 WorkBuddy 用户 skills 目录
cp -r skills/sop-init-frontend ~/.workbuddy/skills/sop-init-frontend
```
重启 WorkBuddy，在任意前端项目的对话中输入 **「初始化 SOP」**，AI 会自动执行扫描→生成流程。

### 方式二：直接使用模板
如果不用 WorkBuddy，可以手动复制 `skills/sop-init-frontend/templates/` 下模板文件，按其中的 `{{占位符}}` 自行填充。

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
- v1.0（2026-07-31）
