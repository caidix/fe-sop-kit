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

const KIT_VERSION = "3.4";
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

// ── 1. 四处版本声明一致 ──
const versionSources = {
  "skills/sop-init-frontend/templates/AGENTS.md.template": /SOP-VERSION:\s*([\d.]+)/,
  "skills/sop-init-frontend/SKILL.md": /SOP-VERSION:\s*([\d.]+)/,
  "README.md": /SOP-VERSION:\s*([\d.]+)/,
  "scripts/install.sh": /v([\d.]+)/,
};
for (const [file, re] of Object.entries(versionSources)) {
  const txt = readText(join(kitDir, file));
  if (!txt) { fail(`版本源缺失：${file}`); continue; }
  const m = txt.match(re);
  if (!m) fail(`${file} 未找到版本声明。`);
  else if (m[1] !== KIT_VERSION) fail(`版本不一致：${file}=${m[1]}，期望 ${KIT_VERSION}。`);
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
const npxTargets = [...skill.matchAll(/npx skills add ([^\s`)\]]+)/g)].map((m) => m[1]);
const validTargets = ["vercel-labs/agent-skills", "vuejs-ai/skills"];
for (const t of npxTargets) {
  if (!validTargets.includes(t)) warn(`SKILL.md 中 npx skills add 目标可疑：${t}`);
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
