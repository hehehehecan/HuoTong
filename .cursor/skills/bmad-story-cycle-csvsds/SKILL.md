---
name: bmad-story-cycle-csvsds
description: Runs a single BMAD story cycle in one window by executing Create Story (CS), Validate Story (VS), Dev Story (DS). Does not perform git commit; user does commit after Code Review. Supports "continue development" when a half-finished cycle exists; recommends Code Review in a new window. Use when the user asks to run a story cycle, continue development, "跑 story 循环", "继续开发", or create-story + validate + dev-story in the same window.
---

# BMAD Story Cycle (CS → VS → DS)

在**同一对话窗口**内按顺序自动执行：Create Story → Validate Story → Dev Story。**本 skill 不执行任何 Git 提交**，提交由用户在 Code Review 之后自行完成。可选地建议用户**新开窗口**运行 Code Review。支持**继续开发**：若发现当前有跑了一半的循环，则任务变为完成该循环。

## 前置条件

- 项目已配置 BMAD（存在 `_bmad/` 与 `_bmad/bmm/config.yaml`）
- 已存在 `_bmad-output/implementation-artifacts/sprint-status.yaml`
- **全新循环**时：至少有一个 status 为 `backlog` 的 story（否则先执行 Sprint Planning）；**继续开发**时无需 backlog。

## Phase 0：检测进度与选择入口（必做）

在执行任何 CS/VS/DS 之前，先根据当前开发进度决定「从哪一步开始」「完成哪个 story 的循环」。

1. **加载** `{implementation_artifacts}/sprint-status.yaml`（路径由 `_bmad/bmm/config.yaml` 的 `implementation_artifacts` 解析），完整读取 `development_status`，按文件中 story 的**出现顺序**从上到下扫描。
2. **查找「未完成循环」的 story**（只认第一个符合的）：
   - 找到第一个 **`in-progress`** 的 story（key 形如 `1-2-xxx`，非 epic/retrospective）→ **跑了一半的循环**：DS 已开始未完成。任务 = **完成本循环**，入口 = **Step 3（DS）**，直接继续实现该 story 直至状态变为 `review`。
   - 若没有 `in-progress`，再找第一个 **`ready-for-dev`** 的 story → **跑了一半的循环**：CS 已完成（可能做过 VS），尚未开发。任务 = **完成本循环**，入口 = **Step 2（VS）**，先 VS 再 Step 3（DS）。
3. **若未找到**任何 `in-progress` 或 `ready-for-dev`（例如全是 backlog，或当前在做的都已 review/done）→ 视为**全新循环**，任务 = 从第一个 backlog story 做完整 CS→VS→DS，入口 = **Step 1（CS）**。
4. **明确输出**本次执行模式与入口，例如：
   - 「检测到 story `1-1-xxx` 为 in-progress，任务：完成本循环，从 DS 继续。」
   - 「检测到 story `1-1-xxx` 为 ready-for-dev，任务：完成本循环，从 VS 开始。」
   - 「未发现进行中的循环，任务：全新循环，从 CS 开始。」

然后从选定的入口步骤开始执行（见下方 Step 1/2/3），直至本循环结束或 HALT。

## 执行顺序

按以下三步**严格顺序**执行，每步完成后再进入下一步。**入口由 Phase 0 决定**：继续开发时可能从 Step 2 或 Step 3 开始，只执行剩余步骤。每步内部遵循对应 workflow 的 instructions，不跳步。

### Step 1：Create Story (CS)

1. 加载 `{project-root}/_bmad/core/tasks/workflow.xml` 全文。
2. 加载并解析 `{project-root}/_bmad/bmm/workflows/4-implementation/create-story/workflow.yaml`（以 config 解析变量）。
3. 将上述 workflow.yaml 作为 workflow-config，按 workflow.xml 的规则执行。
4. 完整执行 create-story 的 `instructions.xml`（步骤 1–6）：
   - 从 sprint-status 确定目标 story（首个 backlog），必要时更新 epic 为 in-progress
   - 加载并分析 epics/PRD/architecture/UX/project-context 等
   - 生成完整 story 文件到 `{implementation_artifacts}/{{story_key}}.md`
   - 将 story 在 sprint-status 中设为 `ready-for-dev`，保存
5. 记录本步产出：`story_file` 路径、`story_key`，供 Step 2 使用。

### Step 2：Validate Story (VS)

1. 使用 Step 1 产出的 `story_file`；若本次由 Phase 0 以「完成本循环」从 VS 入口进入，则使用 Phase 0 选中的 `ready-for-dev` story 对应文件（`{implementation_artifacts}/{{story_key}}.md`）。
2. 加载 `{project-root}/_bmad/bmm/workflows/4-implementation/create-story/checklist.md` 全文。
3. 按 checklist 的 “SYSTEMATIC RE-ANALYSIS APPROACH” 对 story 做校验：
   - 重新加载 epics/architecture 等源文档，对照 story 内容查漏（错误库、错误路径、遗漏 AC、忽略前置 story 经验等）。
   - 列出问题项；若存在必须修复项，**在本窗口内直接修改 story 文件**并保存。
   - 可多次：校验 → 修改 → 再校验，直到无必须修复项或用户接受当前状态。
4. 不在本步修改 sprint-status；story 仍为 `ready-for-dev`，进入 Step 3。

### Step 3：Dev Story (DS)

1. 加载 `{project-root}/_bmad/core/tasks/workflow.xml` 全文。
2. 加载并解析 `{project-root}/_bmad/bmm/workflows/4-implementation/dev-story/workflow.yaml`。
3. 将上述 workflow.yaml 作为 workflow-config，按 workflow.xml 执行。
4. 完整执行 dev-story 的 `instructions.xml`（步骤 1–10）：
   - 从 sprint-status 找到 status 为 `ready-for-dev` 或 `in-progress` 的 story（即本循环目标；若由 Phase 0 从 DS 入口进入，即为该 in-progress story），加载其 story 文件
   - 将 story 在 sprint-status 中设为 `in-progress`
   - 按 Tasks/Subtasks 顺序实现（red-green-refactor、写测试、跑测试、更新 story 内勾选与 File List/Change Log/Dev Agent Record）
   - 全部任务完成后将 story 状态设为 `review`，并更新 sprint-status 中该 story 为 `review`
5. **自测**：按下方「自测规则」执行；循环结束后再进入 Step 4 指引。

### 自测规则

- **能由 agent 独立完成的**：agent 必须自主完成（如运行 `npm run build`、启动 dev server 后用浏览器自动化访问页面、校验未登录重定向、校验错误提示文案、控制台无报错等）。
- **登录页自动化**：若自测需在登录页点击「登录」按钮，**填写完邮箱和密码后必须先执行一次 `browser_snapshot`，再使用新 snapshot 中的 ref 点击登录按钮**。否则 Vue/Vant 会因输入触发重渲染，导致之前的元素 ref 失效（"Element reference is stale"），自动化点击会报错；手动点击无此问题。
- **等待策略（提高自测效率）**：**不要在每个操作后都加固定长时间等待**（如 2～3 秒）。优先采用：① 用 `browser_wait_for` 的 **text** 或 **textGone** 条件等待（等某段文字出现或消失），页面就绪后立即继续；② 仅在必要时用短时等待（如 0.5～1 秒）再 `browser_snapshot` 判断；③ 只有导航跳转、提交表单等明显需要等响应的操作后，才用 1～2 秒等待。避免「navigate → 等 2s → fill → 等 2s → click → 等 2s」这种每步都等满的写法，自测会快很多。
- **需要用户配合的**：明确给出提示，说明需要用户做什么、在何处操作、预期结果是什么（例如：「请在 Supabase Dashboard 创建测试账号，在浏览器打开 /login 用该账号登录，确认能跳转首页并刷新后仍为已登录；再点击退出登录确认跳回 /login」）。
- 自测结果在循环结束时简要汇报：通过项、需用户验证项（及提示是否已给出）。

### Step 4：可选 — 新窗口 Code Review

当前环境**无法由 agent 自动新开对话窗口**，因此「新窗口 Code Review」需用户配合完成。

1. **建议用户**：新开一个 Cursor 对话窗口（新 Composer/Agent 会话），在新窗口中运行 **`/bmad-bmm-code-review`**，对刚进入 `review` 的 story 做代码评审（建议使用与实现时不同的高质量模型）。
2. **提交**：由用户在 CR 完成后自行执行 Git 提交（本 skill 不代为提交）。

## 关键规则

- **先检测再执行**：每次必做 Phase 0；若发现 `in-progress` 或 `ready-for-dev` 的 story，任务即为「完成该循环」，从对应入口（DS 或 VS）开始，不重复做已完成的步骤。
- **同窗执行**：所有步骤均在同一对话中完成，不要求用户“新开窗口跑 CS/VS/DS”。
- **顺序不可颠倒**：完整循环为 CS → VS → DS；继续开发时只执行尚未完成的后缀（VS→DS 或仅 DS）。
- **变量与路径**：从 `_bmad/bmm/config.yaml` 解析 `implementation_artifacts`、`planning_artifacts`、`communication_language` 等；路径中的 `{project-root}` 为仓库根目录。
- **HALT 处理**：任一步触发 workflow 内 HALT（如无 backlog story、用户选择退出）则停止后续步骤，并向用户说明原因与可选操作。
- **语言**：与用户和文档的交互使用 config 中的 `communication_language`（如中文）。
- **提交**：本 skill 不执行任何 Git 提交；提交由用户在 CR 之后自行完成。
- **自测**：需要自测时，agent 自主完成可自动化部分（构建、浏览器访问、重定向与文案校验等）；需用户配合时给出清晰提示（操作步骤、预期结果）。

## 可选：仅执行其中一段

- 若用户明确说“只做 CS”“只做 CS 和 VS”等，则仅执行其指定的连续子序列（例如只做 Step 1，或 Step 1+2），并在结束时说明下一步建议（如“接下来可执行 DS”）。

## 继续开发（入口总结）

| 用户意图 / 进度 | Phase 0 结果 | 本次任务 | 入口步骤 |
|----------------|-------------|----------|----------|
| “继续开发”且 sprint 中有 **in-progress** story | 发现跑了一半的循环（DS 进行中） | 完成该 story 的 DS 直至 review | Step 3（DS） |
| “继续开发”且首个未完成为 **ready-for-dev** | 发现跑了一半的循环（CS 已做） | 先 VS 再 DS，完成本循环 | Step 2（VS）→ Step 3 |
| “跑 story 循环”/无进行中 story | 无 in-progress、无 ready-for-dev | 从首个 backlog 做完整 CS→VS→DS | Step 1（CS）→ Step 2 → Step 3 |
