#!/usr/bin/env node
// SOP-CHECK-VERSION: 3.8
// ==============================================================================
// sop-check.mjs — SOP 健康检查（硬门禁 + 熵检测）
//
// 在「已初始化 SOP 的项目根目录」运行。零依赖，仅需 Node。
//   node scripts/sop-check.mjs            # 检查（WARN 不阻断）
//   node scripts/sop-check.mjs --strict   # WARN 也算失败（CI 用）
//   node scripts/sop-check.mjs --json     # 机器可读输出
//
// 本脚本无项目特定内容：「更新 SOP」时请直接用 kit 最新版**整体覆盖**。
// 头部 SOP-CHECK-VERSION 标记用于与 kit 版本对照，请勿删除。
//
// 设计理念（移植自 harness-engineering「验证优于说教」）：
//   把"AGENTS.md 存在 / 占位符已填 / Review 五轴"等软纪律，变成可执行、
//   CI 可阻断的硬约束。熵检测（重复段落/超长文件/规则体量预算/TODO 残留）
//   对应 HE 的 "entropy garbage collection"窄版本。
// ==============================================================================

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const KIT_VERSION = "3.8"; // 与 kit 当前版本对齐，用于漂移检测
const SCRIPT_VERSION = "3.8"; // 与头部 SOP-CHECK-VERSION 标记一致
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

// 统一输出为 / 分隔（Windows 下 relative() 会给反斜杠，与代码熵检查的写法不一致）
const rel = (p) => relative(cwd, p).replace(/\\/g, "/");

// 取某个二级标题下的内容（用于只看「裁剪」区块，避免索引表里的文件名被当成声明）
function sectionOf(md, keyword) {
  const buf = [];
  let on = false;
  for (const line of (md || "").split(/\r?\n/)) {
    if (/^##\s/.test(line)) { on = line.includes(keyword); continue; }
    if (on) buf.push(line);
  }
  return buf.join("\n");
}

// ── 0. 配置（可选）──
// sop.config.json 同时服务「规则体量预算」与「代码熵检查」，只解析一次。
// 语法错误不在这里告警（下面按用途分别提示），避免同一问题报两遍。
const cfgPath = join(cwd, "sop.config.json");
const cfgText = readText(cfgPath);
let projectCfg = null;
let cfgInvalid = false;
if (cfgText) {
  try { projectCfg = JSON.parse(cfgText); }
  catch { cfgInvalid = true; }
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
  if (hits) fail(`${rel(p)} 仍有未填占位符：${[...new Set(hits)].join(", ")}`);
}

// ── 4. TODO / TBD / 待定 残留（WARN）──
// 注意：不用带 /g 的正则循环 .test()——lastIndex 会跨文件残留，导致漏报/误报。
// 排除语境（这些是「在讨论标记」，不是「留下标记」）：
//   ① 代码块（```）与 HTML 注释行；② 行内代码 `TODO:`；
//   ③ 引号包裹的术语引用（"TBD" / “待定” / 「后续补充」）；
//   ④ 否定/疑问语境（禁止：TBD / 有没有 TBD / 无 TODO 残留）；
//   ⑤ 术语并列罗列（TBD/TODO/待定）。
// 保留检出：真实的未完成标记（`// TODO: 补充`、`待定：接口`）——即使同句出现否定词也按就近判定。
const todoWordRe = /\b(?:TODO|TBD|FIXME|XXX)\b|待定|待补充/g;
function hasTodoResidue(txt) {
  let inCodeBlock = false;
  for (const line of txt.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;
    if (/^\s*<!--/.test(line)) continue;
    const stripped = line
      .replace(/`[^`]*`/g, "")
      .replace(/"[^"\n]*"/g, "")
      .replace(/“[^”\n]*”/g, "")
      .replace(/「[^」\n]*」/g, "");
    for (const m of stripped.matchAll(todoWordRe)) {
      const before = stripped.slice(Math.max(0, m.index - 24), m.index);
      if (/禁止|不得|勿|避免|不允许|严禁|不要|有没有|是否|无\s*$/.test(before)) continue;
      const after = stripped.slice(m.index + m[0].length, m.index + m[0].length + 14);
      if (/^\s*[\/／|、]\s*(?:TODO|TBD|FIXME|XXX|待定|待补充)/.test(after)) continue;
      return true;
    }
  }
  return false;
}
for (const p of walk(rulesDir)) {
  const txt = readText(p);
  if (!txt) continue;
  if (hasTodoResidue(txt)) warn(`${rel(p)} 含 TODO/TBD/待定——可能存在未完成约定。`);
}

// ── 5. 熵检测：规则体量预算（WARN）──
// 为什么按「字符数」而非行数：中文单行信息量差异极大，行数不反映上下文成本。
// AGENTS.md 是每次会话的固定成本；单个 rules 文件常被整文件读入。
// 预算可由 sop.config.json 的 budgets 覆盖；`"budgets": false` 只关闭体量预算
// （metrics 仍统计，行数熵检测也仍然执行——那是 3.4 起就有的独立能力）。
const budgetsCfg = projectCfg && projectCfg.budgets && typeof projectCfg.budgets === "object" ? projectCfg.budgets : null;
const budgetsOff = !!(projectCfg && projectCfg.budgets === false);
const budget = (k, d) => (budgetsCfg && Number.isFinite(budgetsCfg[k]) ? budgetsCfg[k] : d);
const BUDGETS = {
  agentsMaxChars: budget("agentsMaxChars", 4500),
  ruleMaxChars: budget("ruleMaxChars", 10000),
  rulesTotalMaxChars: budget("rulesTotalMaxChars", 40000),
};
const metrics = { agentsChars: agents ? agents.length : 0, rulesChars: 0, maxRuleFile: "", maxRuleChars: 0 };

if (!budgetsOff) {
  if (metrics.agentsChars > BUDGETS.agentsMaxChars) {
    warn(`AGENTS.md 体量 ${metrics.agentsChars} 字符 > 预算 ${BUDGETS.agentsMaxChars}——它是每次会话的固定成本，建议把细节移入 rules/，本文件只留路由与铁律。`);
  }
}
for (const p of walk(rulesDir)) {
  const txt = readText(p);
  if (!txt) continue;
  metrics.rulesChars += txt.length;
  if (txt.length > metrics.maxRuleChars) {
    metrics.maxRuleChars = txt.length;
    metrics.maxRuleFile = rel(p);
  }
  const lines = txt.split(/\r?\n/).length;
  if (lines > 400) warn(`${rel(p)} 过长（${lines} 行）——建议拆分或精简，避免 context 膨胀。`);
  if (budgetsOff) continue;
  if (txt.length > BUDGETS.ruleMaxChars) {
    warn(`${rel(p)} 体量 ${txt.length} 字符 > 预算 ${BUDGETS.ruleMaxChars}——建议按主题拆分；读它时必须按 ## 标题取片段。`);
  }
}
if (!budgetsOff && metrics.rulesChars > BUDGETS.rulesTotalMaxChars) {
  warn(`ai-context/rules/ 合计 ${metrics.rulesChars} 字符 > 预算 ${BUDGETS.rulesTotalMaxChars}——低频内容（其他框架、未安装 Skill 的说明）建议删除或标为「按需查阅」。`);
}

// ── 6. 熵检测：跨文件重复段落（WARN）──
const paragraphs = new Map(); // text -> [file, ...]
for (const p of walk(rulesDir)) {
  const txt = readText(p);
  if (!txt) continue;
  const paras = txt.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s.split(/\n/).length >= 3 && s.length >= 40);
  for (const para of paras) {
    if (!paragraphs.has(para)) paragraphs.set(para, []);
    paragraphs.get(para).push(rel(p));
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

// ── 7b. 质量基线快照（WARN，可裁剪）──
// 老项目升级 SOP 后通常没有此文件；提示而非强制。
// 豁免只认「本项目对 SOP 的裁剪」区块里的显式声明——不能拿文件索引表里出现的
// 文件名当豁免（v3.8 模板的索引表固定含 quality-baseline.md，那样会让本检查恒不触发）。
const baselinePath = join(cwd, "ai-context", "quality-baseline.md");
const trimSection = sectionOf(agents, "裁剪");
const baselineOptOut = /quality-baseline|质量基线/.test(trimSection) && /不生成|不要|无需|豁免|跳过|不采集|暂不/.test(trimSection);
if (!existsSync(baselinePath) && !baselineOptOut) {
  warn("缺少 ai-context/quality-baseline.md——建议初始化时采一次质量基线（体积/覆盖率/tsc/lint），作为改动前后的对照基准。若项目主动不要，请在 AGENTS.md「本项目对 SOP 的裁剪」写明「不生成 quality-baseline」以免告警。");
}

// ── 8. specs 健康度（WARN）──
// 8a. 占位符残留：同样不用 /g 正则的 .test()，避免 lastIndex 串扰。
const placeholderHitRe = /\{\{[A-Z0-9_]+\}\}/;
const specsDir = join(cwd, "specs");
for (const p of walk(specsDir)) {
  if (p.endsWith("TEMPLATE.md") || p.endsWith("README.md")) continue;
  const txt = readText(p);
  if (!txt) continue;
  if (placeholderHitRe.test(txt)) warn(`${rel(p)} 含未填占位符（spec 不应留 placeholder）。`);
}
// 8b. 四件套完整性：每个 spec 目录应有 proposal/design/tasks/acceptance 四文件。
// 豁免：proposal.md 顶部状态为「草稿」时不强制齐备（草稿允许只写一半）；
// 建议：废弃的 spec 直接删除目录，不要留残缺半成品。
const SPEC_FILES = ["proposal.md", "design.md", "tasks.md", "acceptance.md"];
// 跳过已知的非 spec 目录（不依赖日期命名，兼容自定义命名：只要不在跳过清单里就检查）
const skipSpecDirs = /^(\.|archive|archived|_archive|assets|templates?|node_modules)$/i;
if (existsSync(specsDir)) {
  for (const entry of readdirSync(specsDir)) {
    if (skipSpecDirs.test(entry)) continue;
    const dir = join(specsDir, entry);
    let isDir = false;
    try { isDir = statSync(dir).isDirectory(); } catch { /* 忽略 */ }
    if (!isDir) continue;
    const proposal = readText(join(dir, "proposal.md"));
    if (proposal && /^状态[:：]\s*草稿/m.test(proposal)) continue;
    const missing = SPEC_FILES.filter((f) => !existsSync(join(dir, f)));
    if (missing.length) {
      warn(`specs/${entry} 缺 ${missing.join(", ")}——四件套不齐备；草稿请在 proposal.md 标「状态：草稿」，废弃请删除整个目录。`);
    }
  }
}

// ── 9. 代码熵检查（WARN，需项目根 sop.config.json 显式启用）──
// 设计取舍：代码扫描天生有误报，故默认关闭；只有项目放了 sop.config.json 才启用。
// 这样老项目（如 air-chat）升级脚本后不会被新检查突然刷屏。
// 注意：budgets 也写在同一个文件里，所以不能「有配置就扫」——否则只想调预算的项目
// 会被意外开启扫描。只有出现代码扫描相关字段（或显式 codeEntropy:true）才算启用。
const CODE_CFG_KEYS = ["srcDirs", "codeExtensions", "maxFileLines", "maxWarningsPerCheck", "checks", "ignore"];
const codeEntropyOn = !!projectCfg && typeof projectCfg === "object"
  && (projectCfg.codeEntropy === true || CODE_CFG_KEYS.some((k) => k in projectCfg));
if (cfgText) {
  const cfg = projectCfg; // §0 已解析，避免重复读盘与重复报错
  if (cfgInvalid) {
    warn("sop.config.json 不是合法 JSON——代码熵检查跳过，规则体量预算按默认值执行。");
  } else if (codeEntropyOn) {
    const srcDirs = Array.isArray(cfg.srcDirs) && cfg.srcDirs.length ? cfg.srcDirs : ["src"];
    const exts = Array.isArray(cfg.codeExtensions) ? cfg.codeExtensions : [".ts", ".tsx", ".js", ".jsx", ".vue"];
    const checks = cfg.checks || {};
    const maxLines = Number.isFinite(cfg.maxFileLines) ? cfg.maxFileLines : 300;
    const ignores = (Array.isArray(cfg.ignore) ? cfg.ignore : ["**/*.test.*", "**/dist/**", "**/node_modules/**"])
      .map((g) => g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*"));
    const isIgnored = (rel) => ignores.some((g) => new RegExp("^" + g + "$").test(rel));

    const codePaths = [];
    for (const d of srcDirs) {
      const abs = d.startsWith("/") ? d : join(cwd, d);
      for (const p of walk(abs)) {
        if (!exts.some((e) => p.endsWith(e))) continue;
        const relPath = rel(p);
        if (!isIgnored(relPath)) codePaths.push({ p, rel: relPath });
      }
    }
    // 零匹配必须出声：srcDirs / codeExtensions 写错时，检查会「静默全绿」，
    // 比误报更危险——用户会以为代码已被扫描过。
    if (!codePaths.length) {
      warn(`[代码熵] 已启用但未匹配到任何源文件（srcDirs=${srcDirs.join(", ")}；扩展名=${exts.join("/")}）——请核对 sop.config.json，否则本项检查形同未启用。`);
    }
    const limit = Number.isFinite(cfg.maxWarningsPerCheck) ? cfg.maxWarningsPerCheck : 5;
    const report = (label, hits, advice) => {
      if (!hits.length) return;
      const shown = hits.slice(0, limit).join("、");
      warn(`[代码熵] ${label}：${shown}${hits.length > limit ? ` 等 ${hits.length} 处` : ""}——${advice}`);
    };
    const buckets = { long: [], console: [], any: [], dangerous: [], todo: [] };
    // 危险 API：需人工确认，只在配置开启时命中
    const dangerousRe = /dangerouslySetInnerHTML|\beval\s*\(|new\s+Function\s*\(|innerHTML\s*=/;
    const todoRe = /\b(TODO|FIXME|XXX)\b/;
    for (const { p, rel } of codePaths) {
      const txt = readText(p);
      if (!txt) continue;
      const lines = txt.split(/\r?\n/);
      if (checks.maxFileLines !== false && lines.length > maxLines) {
        buckets.long.push(`${rel}(${lines.length}行)`);
      }
      lines.forEach((line, i) => {
        const at = `${rel}:${i + 1}`;
        // console/any/危险 API 用「去行注释后的代码」匹配，避免注释里的示例文字误报；
        // TODO 相反——它本就大量出现在注释里，必须用原始行匹配，否则整行注释的 TODO 会漏检。
        const code = line.replace(/^\s*\/\/.*$/, "").replace(/\/\/.*$/, "");
        if (checks.consoleLog !== false && /\bconsole\.(log|debug|info|warn)\s*\(/.test(code)) buckets.console.push(at);
        if (checks.anyType !== false && /:\s*any\b|\bas\s+any\b|<any>|Array<any>/i.test(code)) buckets.any.push(at);
        if (checks.dangerousApi === true && dangerousRe.test(code)) buckets.dangerous.push(at);
        if (checks.todoComment === true && todoRe.test(line)) buckets.todo.push(at);
      });
    }
    report("超长源码文件", buckets.long, `超过 ${maxLines} 行，考虑拆分组件/模块`);
    report("console 残留", buckets.console, "提交前用统一 logger 或移除");
    report("any 类型", buckets.any, "用具体类型或 unknown + 收窄替代");
    report("危险 API", buckets.dangerous, "确认是否必要且有消毒/鉴权");
    report("代码 TODO", buckets.todo, "未完成标记不应进入主干");
  }
}

// ── 输出 ──
const errors = STRICT ? [...fails, ...warns] : fails;
const ok = errors.length === 0;

const fmtK = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n));
if (JSON_OUT) {
  console.log(JSON.stringify({ ok, kitVersion: KIT_VERSION, scriptVersion: SCRIPT_VERSION, strict: STRICT, metrics, budgets: budgetsOff ? "off" : BUDGETS, fails, warns }, null, 2));
} else {
  console.log("\n🩺 SOP 健康检查");
  console.log(`   项目：${cwd}`);
  console.log(`   kit 版本基准：${KIT_VERSION} ｜ 脚本版本：${SCRIPT_VERSION}${STRICT ? "  (strict)" : ""}`);
  console.log(`   规则体量：AGENTS.md ${fmtK(metrics.agentsChars)} 字符 ｜ rules 合计 ${fmtK(metrics.rulesChars)} 字符${metrics.maxRuleChars ? `（最大 ${metrics.maxRuleFile} ${fmtK(metrics.maxRuleChars)}）` : ""}`);
  console.log(`   （脚本版本落后于 kit 版本时，用 kit 最新 scripts/sop-check.mjs 整体覆盖本脚本）\n`);
  if (fails.length) { console.log("❌ 失败项："); fails.forEach((m) => console.log("   - " + m)); }
  if (warns.length) { console.log("\n⚠️  警告项："); warns.forEach((m) => console.log("   - " + m)); }
  if (!fails.length && !warns.length) console.log("✅ 全部通过，无失败无警告。");
  else console.log(`\n${ok ? "✅" : "⛔"} ${fails.length} 失败 / ${warns.length} 警告${STRICT ? "（strict 模式：警告计为失败）" : ""}`);
  console.log(ok ? "" : "   修复后重跑：node scripts/sop-check.mjs\n");
}

process.exit(ok ? 0 : 1);
