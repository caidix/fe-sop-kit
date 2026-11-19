# configs/ — 机器强制层模板

> **为什么需要这一层**：`rules/` 里的约束是**建议**，ESLint / dependency-cruiser / stylelint 里的规则是**门禁**。
> AI 生成代码时，文档约束的遵守率取决于模型当次的注意力；机器约束的遵守率是 100%——因为不改就过不了检查。
>
> 引用依据：多份 2026 年研究一致显示，靠上下文文件（AGENTS.md 等）提升「代码写得对」的成功率有限，
> 真正稳定起作用的是**可执行的验证**。所以本层的定位是「把文档约束下沉成机器检查」。

## 三件套分工

| 工具 | 管什么 | 在哪跑 | 拦住什么 |
|------|-------|--------|---------|
| `eslint-boundaries.json` | 分层 import 越界 | 编辑器 + CI | 展示层直接 import 服务层、feature 互相 import 内部 |
| `dependency-cruiser.json` | 依赖图健康度 | CI | 循环依赖、孤儿文件、feature 跨域引用 |
| `stylelint.json` | CSS 侧硬编码色值 | 编辑器 + CI | CSS 里的裸 hex / 非变量赋值 |

配套还有两项在 kit 主脚本里：**`sop-check.mjs` 的「硬编码颜色」检查项**，
管 JSX 侧 Tailwind 任意值里的颜色字面量（stylelint 管不到 className）；
以及 **`sop-check.mjs --metric` 的回归红线比对**（见 `ci-pipeline.yml.template`）。

## CI 流水线（ci-pipeline.yml.template）

三件套管「代码怎么写」，CI 管「什么能合入」。`ci-pipeline.yml.template` 是编排层：

| 步骤 | 内容 | 性质 |
|------|------|------|
| lint / typecheck / test / build | 项目质量四件套（命令取自 package.json scripts） | 阻断 |
| 依赖安全审计 | `npm audit --audit-level=high` | 先观察后阻断 |
| SOP 健康检查 | `node scripts/sop-check.mjs --strict` | 阻断 |
| 红线比对（可选） | `--metric bundleSizeKb=…` 与 `regressionGuards` 比对 | 配置后阻断 |

接入方式：AI 初始化时复制到 `.github/workflows/ci.yml` 并替换真实命令名（GitLab 翻译为 `.gitlab-ci.yml`）。
接入顺序同三件套：**先跑通全绿，再逐项收紧为阻断**——一上来全开 error，团队的反应是关掉流水线。

## 接入方式

### 1. ESLint 边界规则

`eslint-boundaries.json` 是**片段**，需要合并进项目已有的 flat config：

```js
// eslint.config.js
import boundaries from "./ai-context/configs/eslint-boundaries.json";

export default tseslint.config(
  // ...原有配置
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: boundaries.rules,
  }
);
```

> ⚠️ 若项目 ESLint 版本较老（flat config 之前），需要改用 `.eslintrc.json` 的 `overrides` 写法。
> 生成时先检查 `package.json` 里 eslint 的主版本号。

### 2. dependency-cruiser

直接放项目根为 `.dependency-cruiser.json`，然后加 script：

```json
{
  "scripts": {
    "check:deps": "depcruise --config .dependency-cruiser.json src"
  }
}
```

**首次接入必须先看存量违规量**，不要一上来就全开 error：

```bash
npx depcruise --config .dependency-cruiser.json src --output-type err-long
```

存量违规按「先 warn → 逐步收紧 → 最后 error」处理。直接开 error 会让项目立刻红掉，
团队的反应通常是把规则关掉，那就白做了。

### 3. stylelint

合并进项目 CSS 配置（`.stylelintrc.json` 或 `stylelint.config.js`）：

```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "color-no-hex": true,
    "declaration-strict-value": [...]
  }
}
```

## 启用顺序（重要）

```
1. 先定层与层的允许关系   → project-map.md「归属决策表」
2. 再把关系翻译成规则     → 本目录的三个配置
3. 先 warn 跑存量基线     → 记录现有违规数
4. 存量清理完再转 error   → 变成真正的门禁
```

**顺序反了会失败**：先开规则再定规则，agent 不知道该改哪里，会绕过检查而不是修正结构。

## 与文档层的关系

| 层 | 载体 | 性质 | 失效方式 |
|----|------|------|---------|
| 文档层 | `rules/*.md`、`design-tokens.md` | 建议（模型注意力） | 注意力不集中时被忽略 |
| 强制层 | 本目录 + `sop-check.mjs` | 门禁（机器判定） | 规则写错导致误报被关掉 |

两层都要有，但**分工不同**：文档层负责解释「为什么这样写」（让 agent 理解意图），
强制层负责保证「不这样写就跑不通」（让 agent 无法违反）。
只有文档层 → 约束是概率性的；只有强制层 → agent 知道怎么绕，但至少绕的成本变高了。
