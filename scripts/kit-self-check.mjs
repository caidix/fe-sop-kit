#!/usr/bin/env node
// ==============================================================================
// kit-self-check.mjs — yh-sop-fe-kit 仓库自检（evals · 作者侧）
//
// 在「kit 仓库根目录」运行。零依赖，仅需 Node。
//   node scripts/kit-self-check.mjs
//
// 设计理念（移植自 harness-engineering「evals 验证 harness 自身」）：
//   把"版本声明一致 / 模板齐全 / 占位符命名规范 / 废弃 skill 无残留"等
//   kit 维护纪律，变成可执行的自检，避免人工 review 漏检。
// ==============================================================================

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const KIT_VERSION = "3.8";
const kitDir = process.cwd();
const fails = [];
const warns = [];
const fail = (m) => fails.push(m);
const warn = (m) => warns.push(m);

function readText(p) { try { return readFileSync(p, "utf8"); } catch { return null; } }
function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc); else acc.push(p);
  }
  return acc;
}

// ── 1. 版本声明一致（每个声明点单独校验）──
// install.sh 有两处版本号必须同步：文件头 + 安装横幅。
// 曾经用 /v([\d.]+)/ 只匹配「首个版本号」，导致横幅停在 v3.5 而自检仍绿——所以分开校验。
const versionSources = [
  { file: "skills/sop-init-frontend/templates/AGENTS.md.template", re: /SOP-VERSION:\s*([\d.]+)/ },
  { file: "skills/sop-init-frontend/SKILL.md", re: /SOP-VERSION:\s*([\d.]+)/ },
  { file: "README.md", re: /SOP-VERSION:\s*([\d.]+)/ },
  { file: "scripts/install.sh", re: /^#\s*yh-sop-fe-kit 互动式安装脚本\s+v([\d.]+)/m, label: "install.sh 文件头" },
  { file: "scripts/install.sh", re: /echo\s+"[^"]*yh-sop-fe-kit v([\d.]+)/, label: "install.sh 安装横幅" },
  // sop-check.mjs 是项目侧硬门禁脚本，其 SOP-CHECK-VERSION 必须与 kit 版本一致，
  // 否则项目同步脚本时会拿到过期的检查能力（air-chat 曾踩到：脚本停在旧版）。
  { file: "scripts/sop-check.mjs", re: /SOP-CHECK-VERSION:\s*([\d.]+)/ },
];
for (const { file, re, label } of versionSources) {
  const name = label || file;
  const txt = readText(join(kitDir, file));
  if (!txt) { fail(`版本源缺失：${file}`); continue; }
  const m = txt.match(re);
  if (!m) fail(`${name} 未找到版本声明。`);
  else if (m[1] !== KIT_VERSION) fail(`版本不一致：${name}=${m[1]}，期望 ${KIT_VERSION}。`);
}

// ── 2. SKILL.md 生成清单中的模板均存在 ──
const skill = readText(join(kitDir, "skills/sop-init-frontend/SKILL.md")) || "";
const tplRefs = [...skill.matchAll(/templates\/([^\s`)\]]+)\.template/g)].map((m) => m[1]);
const tplRoot = join(kitDir, "skills/sop-init-frontend/templates");
for (const ref of tplRefs) {
  const p = join(tplRoot, ref + ".template");
  if (!existsSync(p)) warn(`SKILL.md 引用的模板不存在：templates/${ref}.template`);
}
// 模板文件总数
const allTemplates = walk(tplRoot).filter((p) => p.endsWith(".template"));
if (allTemplates.length < 10) warn(`模板文件偏少（${allTemplates.length} 个），预期 16+。`);

// ── 3. install.sh SELF_SKILLS 目录均存在 ──
const installSh = readText(join(kitDir, "scripts/install.sh")) || "";
const selfSkills = [...installSh.matchAll(/"([a-z-]+)"/g)].map((m) => m[1])
  .filter((s) => ["sop-init-frontend", "ui-skill-router"].includes(s));
for (const s of selfSkills) {
  if (!existsSync(join(kitDir, "skills", s))) fail(`install.sh 声明的自有 Skill 目录不存在：skills/${s}`);
}

// ── 4. 占位符命名规范（全大写下划线）──
const placeholderRe = /\{\{([^}]+)\}\}/g;
for (const p of allTemplates) {
  const txt = readText(p);
  if (!txt) continue;
  for (const m of txt.matchAll(placeholderRe)) {
    // 只校验"看起来像标识符"的占位符；含中文/符号的（如散文示例 {{占位符}}）跳过
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(m[1])) continue;
    if (!/^[A-Z][A-Z0-9_]*$/.test(m[1])) {
      warn(`${relative(kitDir, p)} 占位符命名不规范：{{${m[1]}}}（应为全大写下划线）`);
    }
  }
}

// ── 5. 废弃 skill 无"自有"残留引用 ──
for (const p of walk(join(kitDir, "skills"))) {
  const txt = readText(p);
  if (!txt) continue;
  if (/自有\s*Skill.*vue-best-practices|vue-best-practices.*自有|react-best-practices.*自有 Skill/.test(txt)) {
    warn(`${relative(kitDir, p)} 仍把 react/vue-best-practices 称为"自有 Skill"（已废弃移除）。`);
  }
}
// 物理目录不应再存在
for (const s of ["react-best-practices", "vue-best-practices"]) {
  if (existsSync(join(kitDir, "skills", s))) fail(`废弃 Skill 目录仍存在：skills/${s}（应已删除）。`);
}

// ── 6. npx skills add 指令指向正确仓库 ──
// 扫描 SKILL.md + 所有模板：安装建议可能写在 rules 模板里（如 skill-routing.md）。
const npxSources = [skill, ...allTemplates.map((p) => readText(p) || "")];
const npxTargets = [...new Set(npxSources.flatMap((txt) => [...txt.matchAll(/npx skills add ([^\s`)\]]+)/g)].map((m) => m[1])))];
const validTargets = ["vercel-labs/agent-skills", "vuejs-ai/skills"];
for (const t of npxTargets) {
  if (!validTargets.includes(t)) warn(`SKILL.md / 模板中 npx skills add 目标可疑：${t}`);
}

// ── 7. 模板体量不超出它自己推广的预算（WARN）──
// kit 若生成比预算更肥的模板，项目初始化后立刻被告警——自相矛盾。
// 预算与 scripts/sop-check.mjs 的 BUDGETS 默认值保持一致。
const TPL_AGENTS_MAX = 4500;
const TPL_RULE_MAX = 10000;
const agentsTplPath = join(tplRoot, "AGENTS.md.template");
if (existsSync(agentsTplPath)) {
  const n = (readText(agentsTplPath) || "").length;
  if (n > TPL_AGENTS_MAX) warn(`AGENTS.md.template 体量 ${n} 字符 > 预算 ${TPL_AGENTS_MAX}——生成后必然超预算，请拆分到 rules。`);
}
for (const p of allTemplates) {
  if (!p.replace(/\\/g, "/").includes("/rules/")) continue;
  const n = (readText(p) || "").length;
  if (n > TPL_RULE_MAX) warn(`${relative(kitDir, p)} 体量 ${n} 字符 > 单文件预算 ${TPL_RULE_MAX}——生成后必然超预算。`);
}
// 生成集「合计」也必须留出余量：单文件都不超、加起来超了，项目一初始化就被自己的预算告警。
// 三套框架各自计算（common + 对应框架文件），frontend.md 对后端项目不生成，故这里算的是上界。
const TPL_RULES_TOTAL_MAX = 40000;
const commonRules = ["workflow", "planning", "testing", "review", "skill-routing", "frontend", "platform"];
const generatedSets = {
  "React 项目": [...commonRules, "react"],
  "Vue 项目": [...commonRules, "vue"],
  "其他框架/后端项目": [...commonRules, "framework-generic"],
};
const ruleTplSize = (name) => {
  const p = join(tplRoot, "ai-context/rules", name + ".md.template");
  return existsSync(p) ? (readText(p) || "").length : 0;
};
for (const [label, files] of Object.entries(generatedSets)) {
  const total = files.reduce((n, f) => n + ruleTplSize(f), 0);
  if (total > TPL_RULES_TOTAL_MAX) {
    warn(`${label} 生成后 rules 合计 ${total} 字符 > 预算 ${TPL_RULES_TOTAL_MAX}——开箱即超预算，请精简模板（当前最大：${files.map((f) => [f, ruleTplSize(f)]).sort((a, b) => b[1] - a[1])[0].join(" ")}）。`);
  }
}

// ── 输出 ──
const ok = fails.length === 0;
console.log("\n🔬 yh-sop-fe-kit 自检（evals）");
console.log(`   kit 版本：${KIT_VERSION}\n`);
if (fails.length) { console.log("❌ 失败项："); fails.forEach((m) => console.log("   - " + m)); }
if (warns.length) { console.log("\n⚠️  警告项："); warns.forEach((m) => console.log("   - " + m)); }
if (!fails.length && !warns.length) console.log("✅ kit 自检全部通过。");
else console.log(`\n${ok ? "✅" : "⛔"} ${fails.length} 失败 / ${warns.length} 警告`);
process.exit(ok ? 0 : 1);
