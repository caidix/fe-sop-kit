#!/usr/bin/env bash
# ==============================================================================
# yh-sop-fe-kit 互动式安装脚本  v3.5
#
# 自有 Skill（本仓库维护，始终安装）：
#   - sop-init-frontend  — 提供「初始化 SOP」触发词
#   - ui-skill-router    — UI / React / Vue Skill 调度器（AI PM）
#
# 推荐外部 Skill（按需选择）：
#   React 生态：npx skills add vercel-labs/agent-skills
#     react-best-practices / web-design-guidelines / composition-patterns
#   Vue 生态：npx skills add vuejs-ai/skills
#     vue-best-practices / vue-router-best-practices / vue-pinia-best-practices
#     create-adaptable-composable / vue-testing-best-practices / vue-debug-guides 等
#
# 用法：
#   Windows：直接双击或用 cmd/PowerShell 运行  scripts\install.bat
#   Git Bash / Terminal：          bash scripts/install.sh
#   非互动模式（CI）：             bash scripts/install.sh --all-react|--all-vue|--all
#   直接指定工具（仍会问框架）：    bash scripts/install.sh workbuddy|codebuddy
# ==============================================================================

set -euo pipefail

# ── 环境守卫：必须是 bash（避免 sh / dash 因数组和 [[ ]] 报语法错）──
if [ -z "${BASH_VERSION:-}" ]; then
  echo "❌ 本脚本需要 bash 运行。" >&2
  echo "   请用以下任一方式：" >&2
  echo "     • Git Bash / Terminal 中执行： bash scripts/install.sh" >&2
  echo "     • Windows cmd/PowerShell 中执行： scripts\\install.bat" >&2
  exit 1
fi

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 自有 Skill（v3.2：vue-best-practices 和 react-best-practices 均已废弃，由官方 Skill 替代）
SELF_SKILLS=(
  "sop-init-frontend"
  "ui-skill-router"
)

# 推荐外部 Skill 安装命令
REACT_SKILL_CMD="npx skills add vercel-labs/agent-skills"
VUE_SKILL_CMD="npx skills add vuejs-ai/skills"

# ── 安装用户级 Skill ──
install_to() {
  local tool="$1"
  local skills_dir

  case "$tool" in
    workbuddy) skills_dir="$HOME/.workbuddy/skills" ;;
    codebuddy) skills_dir="$HOME/.codebuddy/skills" ;;
    *) echo "❌ 未知工具: $tool（可选: workbuddy / codebuddy）" >&2; return 1 ;;
  esac

  mkdir -p "$skills_dir"

  for skill in "${SELF_SKILLS[@]}"; do
    local src="$KIT_DIR/skills/$skill"
    if [[ ! -d "$src" ]]; then
      echo "  ⚠️  跳过 $skill（源目录不存在: $src）"
      continue
    fi
    cp -Rf "$src" "$skills_dir/"
    echo "  ✓ $skill"
  done

  echo "✅ 自有 Skill 已安装到 $skills_dir"
}

# ── 互动式选择框架 ──
interactive_choose() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  yh-sop-fe-kit v3.5 — Skill 安装"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  自有 Skill（始终安装）："
  echo "    • sop-init-frontend — 项目 SOP 初始化"
  echo "    • ui-skill-router   — Skill 调度器"
  echo ""
  echo "  你主要开发哪些框架？"
  echo "    [1] React 项目为主（安装 Vercel 官方 Skill）"
  echo "    [2] Vue 项目为主（安装 Vue 官方 Skill）"
  echo "    [3] 两者都装"
  echo "    [4] 跳过官方 Skill，只装自有 Skill"
  echo ""

  local choice=""
  read -r -p "  请选择 [1-4] (默认: 3): " choice || choice=""
  choice="${choice:-3}"

  case "$choice" in
    1) EXTRA_SKILLS="react" ;;
    2) EXTRA_SKILLS="vue" ;;
    3) EXTRA_SKILLS="both" ;;
    4) EXTRA_SKILLS="none" ;;
    *) echo "  ⚠️  无效选择，默认跳过官方 Skill"; EXTRA_SKILLS="none" ;;
  esac
}

# ── 输出推荐安装指令 ──
print_skill_suggestions() {
  case "${EXTRA_SKILLS:-none}" in
    react)
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "  📦 React 官方 Skill（建议安装）"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""
      echo "  安装命令（复制到终端执行）："
      echo ""
      echo "    $REACT_SKILL_CMD"
      echo ""
      echo "  包含：react-best-practices（40+ 性能规则）"
      echo "        web-design-guidelines（100+ UI 审查规则）"
      echo "        composition-patterns（组件 API 设计）"
      echo "  安装后 SOP 自动检测并激活，不安装也可正常开发（会降级）。"
      ;;
    vue)
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "  📦 Vue 官方 Skill（建议安装）"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""
      echo "  安装命令（复制到终端执行）："
      echo ""
      echo "    $VUE_SKILL_CMD"
      echo ""
      echo "  包含：vue-best-practices / vue-router-best-practices"
      echo "        vue-pinia-best-practices / create-adaptable-composable"
      echo "        vue-testing-best-practices / vue-debug-guides（共 8 个）"
      echo "  安装后 SOP 自动检测并激活，不安装也可正常开发（会降级）。"
      ;;
    both)
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "  📦 React + Vue 官方 Skill（建议安装）"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""
      echo "  安装命令（复制到终端执行）："
      echo ""
      echo "    $REACT_SKILL_CMD    # React 生态（3 个 Skill）"
      echo "    $VUE_SKILL_CMD      # Vue 生态（8 个 Skill）"
      echo ""
      echo "  React 包含：react-best-practices / web-design-guidelines / composition-patterns"
      echo "  Vue 包含：vue-best-practices / vue-router / vue-pinia / composable 等 8 个"
      echo "  安装后 SOP 自动检测并激活，不安装也可正常开发（会降级）。"
      ;;
    none)
      echo ""
      echo "  ℹ️  跳过官方 Skill。需要时手动执行："
      echo "    React: $REACT_SKILL_CMD"
      echo "    Vue:   $VUE_SKILL_CMD"
      ;;
  esac
}

# ── 参数解析 ──
arg="${1:-}"
TOOLS=()
EXTRA_SKILLS=""
SKIP_TOOL_PROMPT=0

case "$arg" in
  --all-react) TOOLS=(workbuddy);     EXTRA_SKILLS="react" ;;
  --all-vue)   TOOLS=(workbuddy);     EXTRA_SKILLS="vue" ;;
  --all)       TOOLS=(workbuddy codebuddy); EXTRA_SKILLS="both" ;;
  workbuddy)   TOOLS=(workbuddy);     SKIP_TOOL_PROMPT=1 ;;
  codebuddy)   TOOLS=(codebuddy);     SKIP_TOOL_PROMPT=1 ;;
  "")          : ;;  # 互动模式：工具 + 框架都问
  *) echo "❌ 未知参数: $arg" >&2
     echo "   用法: bash scripts/install.sh [--all-react|--all-vue|--all|workbuddy|codebuddy]" >&2
     exit 1 ;;
esac

# 互动模式：先选工具（除非已用 workbuddy/codebuddy 指定），再选框架
if [[ ${#TOOLS[@]} -eq 0 ]]; then
  echo ""
  echo "  安装到哪个 AI 工具？"
  echo "    [w] WorkBuddy（默认）"
  echo "    [c] CodeBuddy"
  echo "    [a] 两者都装"
  tool_choice=""
  read -r -p "  请选择 [w/c/a] (默认: w): " tool_choice || tool_choice=""
  tool_choice="${tool_choice:-w}"
  case "$tool_choice" in
    w|W) TOOLS=(workbuddy) ;;
    c|C) TOOLS=(codebuddy) ;;
    a|A) TOOLS=(workbuddy codebuddy) ;;
    *) echo "  ⚠️  无效，默认 WorkBuddy"; TOOLS=(workbuddy) ;;
  esac
  interactive_choose
elif [[ $SKIP_TOOL_PROMPT -eq 1 ]]; then
  # workbuddy / codebuddy 直装，但框架仍需选择
  interactive_choose
fi

# 执行安装
for tool in "${TOOLS[@]}"; do
  install_to "$tool"
done

print_skill_suggestions

# 清理旧版 Skill
echo ""
echo "  🧹 如之前安装了本仓库的旧版 Skill，建议清理："
if [[ -d "$HOME/.workbuddy/skills/react-best-practices" ]]; then
  echo "    rm -rf ~/.workbuddy/skills/react-best-practices  # v3.0 起废弃"
fi
if [[ -d "$HOME/.workbuddy/skills/vue-best-practices" ]]; then
  echo "    rm -rf ~/.workbuddy/skills/vue-best-practices    # v3.2 起废弃"
fi

echo ""
echo "🎉 安装完成！"
echo "   1. 重启对应的 AI 工具"
echo "   2. 在任意前端项目输入「初始化 SOP」→ 生成项目规范"
echo "   3. 已初始化项目输入「更新 SOP」→ 同步最新 rules"
