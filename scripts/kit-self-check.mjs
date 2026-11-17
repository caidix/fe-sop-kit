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

const KIT_VERSION = "4.2";
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
  // 位置在 Skill 目录下——必须随 Skill 一起分发，否则别人主机上的 AI 找不到官方脚本，
  // 会自己手写一份简化实现（ticket-auction 踩过：手写版的 ignore 规则与扩展名全是坏的）。
  { file: "skills/sop-init-frontend/scripts/sop-check.mjs", re: /SOP-CHECK-VERSION:\s*([\d.]+)/ },
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

// ── 3b. v4.0 关键模板必须存在（防误删）──
// 这批文件是 v4.0 的核心增量：token 层模板缺失会让「必须用设计 Token」失去可执行性；
// 强制层配置缺失会让机器门禁无从接入。删掉任何一个都会让 kit 静默降级回 v3.9 行为。
const REQUIRED_V4_TEMPLATES = [
  "ai-context/design-tokens.md",
  "configs/eslint-boundaries.json",
  "configs/dependency-cruiser.json",
  "configs/stylelint.json",
];
for (const t of REQUIRED_V4_TEMPLATES) {
  const p = join(tplRoot, t + ".template");
  if (!existsSync(p)) fail(`v4.0 关键模板缺失：templates/${t}.template（删除会使 kit 静默降级为 v3.9 行为）`);
}
// configs/README.md 是说明文档（不含占位符），不需要 .template 后缀
if (!existsSync(join(tplRoot, "configs/README.md"))) {
  fail("v4.0 关键文件缺失：templates/configs/README.md（强制层接入说明，缺了接入顺序会被跳过）");
}
// v4.0 的两个新能力必须同时出现在 SKILL.md 主流程里，否则新模板永远不会被生成
if (!/design-tokens/.test(skill)) fail("SKILL.md 未提及 design-tokens——v4.0 的 token 层模板不会被生成");
if (!/configs\//.test(skill) && !/强制层/.test(skill)) fail("SKILL.md 未提及强制层配置（configs/）——机器门禁不会被接入");

// ── 3c. 官方检查脚本必须随 Skill 分发（P0 防回归）──
// 真实事故：官方脚本曾只放在 kit 仓库根 scripts/ 下，而 install.sh 只复制 skills/ 目录，
// 导致装到别人主机上的 Skill 里没有官方脚本。AI 执行「初始化 SOP」时找不到它，
// 于是自己手写了一份 151 行的简化实现——那份手写的 ignore 规则（p.replace(/\*\*\//g,'') +
// rel.includes）永远匹配不到真实路径，且扩展名表漏掉样式文件，两处检查全部静默失效。
// 规则：官方脚本必须在 Skill 目录下，且 SKILL.md 的生成清单必须指向该路径。
const skillScriptPath = join(kitDir, "skills/sop-init-frontend/scripts/sop-check.mjs");
if (!existsSync(skillScriptPath)) {
  fail("官方检查脚本未随 Skill 分发：skills/sop-init-frontend/scripts/sop-check.mjs 不存在——安装到别人主机后 AI 找不到官方脚本，会自行手写简化实现（ignore 与扩展名检查全部失效）。");
}
if (!/skills\/sop-init-frontend\/scripts\/sop-check\.mjs/.test(skill)) {
  fail("SKILL.md 的生成清单未指向 Skill 内的 scripts/sop-check.mjs——AI 初始化项目时会找不到脚本来源而自行手写。");
}
// install.sh 必须把 skills/ 整目录复制过去（脚本在 skills/ 下才随 Skill 到达）
if (!/cp -Rf "\$src"/.test(installSh)) {
  fail("install.sh 未整目录复制 skills/——Skill 内新增的 scripts/ 不会随安装分发。");
}

// ── 3d. 自举链路完整（未装 Skill 也能升级 SOP）──
// 真实场景：同事的机器 / CI 环境没装本 Skill，却要升级项目内的 SOP。
// 此时 AI 只能靠项目里写下的流程去 git 拉 kit。缺任何一环，升级行为就完全失控——
// AI 找不到官方模板与脚本，转头自行手写替代实现（v4.1 的同一类事故）。
// 三处必须同时存在：① 项目内的升级流程文件；② 模板里指向 git 源的占位符；③ 脚本里的远端检测。
const upgradeTpl = join(tplRoot, "ai-context/sop-upgrade.md.template");
if (!existsSync(upgradeTpl)) {
  fail("v4.2 关键模板缺失：templates/ai-context/sop-upgrade.md.template（未装 Skill 时升级 SOP 的唯一流程依据，缺了升级行为会失控并退化为手写替代实现）");
} else {
  const utpl = readText(upgradeTpl) || "";
  if (!/git clone/.test(utpl)) fail("sop-upgrade.md.template 未给出 git clone 自举命令——未装 Skill 的用户无从取得官方模板与脚本。");
  if (!/禁止手写替代实现|禁止手写/.test(utpl)) fail("sop-upgrade.md.template 未禁止手写替代实现——AI 拿不到官方脚本时会自行手写，检查能力静默失效。");
}
// AGENTS.md 模板必须携带 kit 溯源标记（远端检测的唯一依据）
// 注意：此处不能用第 7 节的 agentsTplPath——const 有暂时性死区，会直接抛 ReferenceError。
const agentsTpl = readText(join(tplRoot, "AGENTS.md.template")) || "";
if (!/SOP-KIT-REPO:\s*\{\{KIT_REPO\}\}/.test(agentsTpl)) {
  fail("AGENTS.md.template 缺少 SOP-KIT-REPO 标记——sop-check 无法知道去哪里检测远端版本。");
}
if (!/SOP-KIT-COMMIT:\s*\{\{KIT_COMMIT\}\}/.test(agentsTpl)) {
  fail("AGENTS.md.template 缺少 SOP-KIT-COMMIT 标记——无法比对本地与远端 commit，只能退化成比版本号（会漏检「版本号未变但模板已改」）。");
}
// sop.config.json 模板必须提供 kit 字段（repo / branch / commit / checkRemote）
const cfgTpl = readText(join(tplRoot, "sop.config.json.template")) || "";
if (!/"kit"\s*:/.test(cfgTpl)) {
  fail("sop.config.json.template 缺少 kit 字段——远端版本检测无从配置 repo 与 commit。");
} else {
  try {
    const cfg = JSON.parse(cfgTpl);
    for (const k of ["repo", "branch", "version", "commit", "checkRemote"]) {
      if (!(k in (cfg.kit || {}))) fail(`sop.config.json.template 的 kit 字段缺少 "${k}"——远端版本检测配置不完整。`);
    }
  } catch {
    fail("sop.config.json.template 不是合法 JSON——sop-check 会静默跳过全部配置。");
  }
}
// sop-check 必须真的实现了远端检测（否则 AGENTS.md 里的标记形同虚设）
const sopCheckSrc = readText(skillScriptPath) || "";
if (!/ls-remote/.test(sopCheckSrc)) {
  fail("sop-check.mjs 未实现 git ls-remote 远端检测——AGENTS.md 的 SOP-KIT-COMMIT 标记将形同虚设，「git 上是否已有新版本」永远得不到回答。");
}
if (!/SOP-KIT-COMMIT/.test(sopCheckSrc)) {
  fail("sop-check.mjs 未读取 SOP-KIT-COMMIT 标记——远端检测无法与项目记录的 commit 对比。");
}
// install.sh 必须写 kit 溯源信息（否则 {{KIT_COMMIT}} 永远填不上真值）
if (!/kit-source\.json/.test(installSh)) {
  fail("install.sh 未写入 kit-source.json——初始化时 {{KIT_COMMIT}} 只能填 unknown，远端检测形同虚设。");
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
