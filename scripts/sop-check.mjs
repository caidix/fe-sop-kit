#!/usr/bin/env node
// ==============================================================================
// sop-check.mjs — SOP 健康检查（硬门禁 + 熵检测）
//
// 在「已初始化 SOP 的项目根目录」运行。零依赖，仅需 Node。
//   node scripts/sop-check.mjs            # 检查（WARN 不阻断）
//   node scripts/sop-check.mjs --strict   # WARN 也算失败（CI 用）
//   node scripts/sop-check.mjs --json     # 机器可读输出
//
// 设计理念（移植自 harness-engineering「验证优于说教」）：
//   把"AGENTS.md 存在 / 占位符已填 / Review 五轴"等软纪律，变成可执行、
//   CI 可阻断的硬约束。熵检测（重复段落/超长文件/TODO 残留）对应 HE 的
//   "entropy garbage collection"窄版本。
// ==============================================================================

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const KIT_VERSION = "3.5"; // 与 kit 当前版本对齐，用于漂移检测
const cwd = process.cwd();
const args = new Set(process.argv.slice(2));
const STRICT = args.has("--strict");
const JSON_OUT = args.has("--json");

const fails = [];
const warns = [];

const fail = (msg) => fails.push(msg);
const warn = (msg) => warns.push(msg);

function readText(p) {
  try { return readFileSync(p, "utf8"); } catch { return null; }
}

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

// ── 1. 入口与版本标记（FAIL）──
const agentsPath = join(cwd, "AGENTS.md");
const agents = readText(agentsPath);
if (!agents) {
  fail("AGENTS.md 不存在——项目尚未初始化 SOP。");
} else {
  const m = agents.match(/SOP-VERSION:\s*([\d.]+)/);
  if (!m) fail("AGENTS.md 缺少 SOP-VERSION 标记（升级判定依据，请勿删除）。");
  else if (m[1] !== KIT_VERSION) warn(`版本漂移：项目 SOP-VERSION=${m[1]}，kit 当前=${KIT_VERSION}。建议执行「更新 SOP」。`);
}

// ── 2. 必要 rules 文件（FAIL）──
const rulesDir = join(cwd, "ai-context", "rules");
const required = ["workflow.md", "planning.md", "testing.md", "review.md", "skill-routing.md"];
for (const f of required) {
  if (!existsSync(join(rulesDir, f))) fail(`缺少必要规则文件：ai-context/rules/${f}`);
}
// 框架 rules：react.md / vue.md / framework-generic.md 至少一个（覆盖前端/其他框架/后端）
const hasReact = existsSync(join(rulesDir, "react.md"));
const hasVue = existsSync(join(rulesDir, "vue.md"));
const hasGeneric = existsSync(join(rulesDir, "framework-generic.md"));
if (!hasReact && !hasVue && !hasGeneric) {
  fail("缺少框架规则：ai-context/rules/ 下 react.md / vue.md / framework-generic.md 至少需要其一。");
}
// frontend.md / platform.md 为条件性文件（非所有项目适用），缺失仅 WARN
if (!existsSync(join(rulesDir, "frontend.md")) && !hasGeneric) {
  warn("缺少 frontend.md——若项目为前端项目请确认模板生成完整；后端项目应由 framework-generic.md 承载。");
}
if (!existsSync(join(rulesDir, "platform.md"))) {
  warn("缺少 platform.md——非多端项目可忽略；多端项目建议补充部署与验证矩阵。");
}

// ── 3. 未填占位符（FAIL）──
const placeholderRe = /\{\{[A-Z0-9_]+\}\}/g;
const scanFiles = [
  agentsPath,
  ...walk(join(cwd, "ai-context")),
  ...walk(join(cwd, "specs")),
];
for (const p of scanFiles) {
  const txt = readText(p);
  if (!txt) continue;
  const hits = txt.match(placeholderRe);
  if (hits) fail(`${relative(cwd, p)} 仍有未填占位符：${[...new Set(hits)].join(", ")}`);
}

// ── 4. TODO / TBD / 待定 残留（WARN）──
const todoRe = /\b(TODO|TBD|FIXME|XXX|待定|待补充)\b/g;
for (const p of walk(rulesDir)) {
  const txt = readText(p);
  if (!txt) continue;
  if (todoRe.test(txt)) warn(`${relative(cwd, p)} 含 TODO/TBD/待定——可能存在未完成约定。`);
}

// ── 5. 熵检测：超长 rules（WARN）──
for (const p of walk(rulesDir)) {
  const txt = readText(p);
  if (!txt) continue;
  const lines = txt.split(/\r?\n/).length;
  if (lines > 400) warn(`${relative(cwd, p)} 过长（${lines} 行）——建议拆分或精简，避免 context 膨胀。`);
}

// ── 6. 熵检测：跨文件重复段落（WARN）──
const paragraphs = new Map(); // text -> [file, ...]
for (const p of walk(rulesDir)) {
  const txt = readText(p);
  if (!txt) continue;
  const paras = txt.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s.split(/\n/).length >= 3 && s.length >= 40);
  for (const para of paras) {
    if (!paragraphs.has(para)) paragraphs.set(para, []);
    paragraphs.get(para).push(relative(cwd, p));
  }
}
for (const [para, files] of paragraphs) {
  if (files.length > 1) warn(`重复段落出现在 ${files.length} 个文件：${files.join(", ")}——建议提取到单一来源。`);
}

// ── 7. NFR 节存在性（WARN）──
// 前端项目查 frontend.md；其他框架/后端项目查 framework-generic.md
const frontend = readText(join(rulesDir, "frontend.md"));
const generic = readText(join(rulesDir, "framework-generic.md"));
const nfrSource = frontend || generic;
if (nfrSource && !/非功能需求|NFR/.test(nfrSource)) {
  const which = frontend ? "frontend.md" : "framework-generic.md";
  warn(`${which} 缺少「非功能需求 (NFR)」节——性能/安全/可访问预算应作为可恢复约束。`);
}

// ── 8. specs 健康度（WARN）──
const specsDir = join(cwd, "specs");
for (const p of walk(specsDir)) {
  if (p.endsWith("TEMPLATE.md") || p.endsWith("README.md")) continue;
  const txt = readText(p);
  if (!txt) continue;
  if (placeholderRe.test(txt)) warn(`${relative(cwd, p)} 含未填占位符（spec 不应留 placeholder）。`);
}

// ── 输出 ──
const errors = STRICT ? [...fails, ...warns] : fails;
const ok = errors.length === 0;

if (JSON_OUT) {
  console.log(JSON.stringify({ ok, kitVersion: KIT_VERSION, fails, warns, strict: STRICT }, null, 2));
} else {
  console.log("\n🩺 SOP 健康检查");
  console.log(`   项目：${cwd}`);
  console.log(`   kit 版本基准：${KIT_VERSION}${STRICT ? "  (strict)" : ""}\n`);
  if (fails.length) { console.log("❌ 失败项："); fails.forEach((m) => console.log("   - " + m)); }
  if (warns.length) { console.log("\n⚠️  警告项："); warns.forEach((m) => console.log("   - " + m)); }
  if (!fails.length && !warns.length) console.log("✅ 全部通过，无失败无警告。");
  else console.log(`\n${ok ? "✅" : "⛔"} ${fails.length} 失败 / ${warns.length} 警告${STRICT ? "（strict 模式：警告计为失败）" : ""}`);
  console.log(ok ? "" : "   修复后重跑：node scripts/sop-check.mjs\n");
}

process.exit(ok ? 0 : 1);
