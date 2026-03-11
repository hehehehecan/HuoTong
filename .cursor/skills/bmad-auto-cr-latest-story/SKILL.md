---
name: bmad-auto-cr-latest-story
description: Automatically completes one BMAD code review cycle by detecting the latest story from sprint status, fixing high/medium issues, and optionally generating missing regression tests. Use when the user asks to run code review, complete one CR, 自动代码审查, 自动找最新story做CR, or mentions /bmad-bmm-code-review without story path.
---

# BMAD Auto Code Review + Conditional QA

用于“一次性完成一轮 CR”，且**不让用户手动提供 story 路径**。  
核心目标：自动定位 story → 执行 code review → 自动修复 High/Medium → 条件触发 QA 补测 → 回归验证 → 同步状态 → 自动提交（有变更时）。

## 适用触发词

- “做一次 CR”
- “自动代码审查”
- “自动找最新 story 做 code review”
- “运行 /bmad-bmm-code-review”（未给 story 路径）

## 强制规则（优化后）

- 不向用户索要 story 路径，必须自动检测。
- 所有沟通与提交信息使用中文。
- 执行修复时，优先修复 High/Medium 问题。
- 代码审查默认走“自动修复”分支（而非仅生成 action items）。
- 当用户触发本 skill（如“进行代码审核/做一次 CR/自动代码审查”）时，**视为已明确授权执行 Git 提交**；除非用户明确要求“只审查不提交”。
- 提交信息中禁止出现 `Made-with: Cursor`、`Made with Cursor` 等工具标记。
- 若检测到与本轮 story 无关的大量脏改动，只提交本轮 CR 涉及文件，不回滚他人改动。

## 自动检测目标 Story

1. 读取 `_bmad/bmm/config.yaml`，解析 `implementation_artifacts`。
2. 读取 `{implementation_artifacts}/sprint-status.yaml`。
3. 从 `development_status` 按文件出现顺序选择目标：
   - 首选第一个状态为 `review` 的 story（排除 `epic-*` 和 `*-retrospective`）。
   - 若没有 `review`，选择第一个 `in-progress` 的 story 并继续做“预审+修复”。
   - 若仍无可选 story，向用户报告并停止。
4. 生成 story 路径：`{implementation_artifacts}/{story_key}.md`。

## 执行流程（一次完整 CR）

1. 加载并执行 BMAD code-review 工作流（`_bmad/bmm/workflows/4-implementation/code-review`）。
2. 将目标 story 路径传入并自动推进（可 `yolo`），在“问题处理策略”处强制走“自动修复”：
   - 修复所有 High/Medium 问题；
   - 必要时补充测试或验证步骤；
   - 更新 story 的 Review 记录、File List、Change Log。
3. **条件触发 QA 补测（新增整合）**：
   - 触发条件（满足任一即可）：
     - 修复项影响可回归的业务行为（接口、核心 UI 流程、关键计算）；
     - 目标 story 缺少对应自动化测试；
     - 用户要求“顺便补测试”。
   - 执行方式：
     - 优先复用现有测试框架与目录模式；
     - 若无测试框架，仅在“收益明显且改动可控”时引入最小测试基建；
     - 至少覆盖：1 条 happy path + 1~2 条关键错误路径；
     - 运行新增测试并修复失败。
4. 同步 `sprint-status.yaml` 中对应 story 状态：
   - 问题全部处理完且 AC 满足 → `done`
   - 否则 → `in-progress` 或 `review`（按实际结果）
5. 运行最小回归验证（至少构建/类型检查；若补测则包含测试命令）。
6. 自动执行 Git 提交（若有变更）：
   - `git add` 本轮 CR 涉及的代码与文档（包含 story 与 sprint 状态文件）。
   - 提交信息使用中文，建议格式：
     - 未触发 QA：`完成 {story_key} 代码审查修复并同步状态`
     - 触发 QA：`完成 {story_key} 代码审查修复、补测并同步状态`
   - 严禁在提交标题或正文出现 `Made-with: Cursor`、`Made with Cursor`、`Cursor` 品牌标记。
   - 若无可提交变更，明确说明“无新增变更，跳过提交”。
7. 向用户输出：
   - 目标 story 与自动检测依据
   - 问题统计（High/Medium/Low）
   - 已修复项与剩余项
   - QA 补测执行情况（是否触发、生成了哪些测试、是否通过）
   - 当前 story/sprint 最终状态
   - 提交结果（commit hash 或跳过原因）

## 输出模板

使用以下结构汇报：

```markdown
已自动定位目标 Story：`{story_key}`（来源：sprint-status 的最新可审查进度）

本轮 CR 结果：
- High: X（已修复 Y，剩余 Z）
- Medium: X（已修复 Y，剩余 Z）
- Low: X（已修复 Y，剩余 Z）

QA 补测：
- 是否触发：是/否（触发原因）
- 新增测试：A 个（列出关键文件）
- 测试执行：通过/失败（附关键原因）

验证结果：
- 构建/类型检查：通过/失败（附关键原因）

状态同步：
- Story: `old -> new`
- Sprint: `old -> new`

提交结果：
- Commit: `abc1234`（或：无新增变更，已跳过）
```

## 异常处理（优化后）

- 如果 BMAD workflow 在中途要求人工选择，默认继续并采用“自动修复”策略。
- 如果修复后仍有阻塞问题，明确列出阻塞原因与下一步建议，不要假装完成。
- 如果仓库非 git 或变更上下文不足，先告知限制，再继续完成可执行的审查与修复部分。
- 如果引入测试基建会造成高风险改动（例如大规模配置迁移），则跳过“引入框架”，仅执行最小可行回归并明确记录测试债务。
