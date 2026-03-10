---
name: 'cycle'
description: 'Run one BMAD story cycle (Create Story → Validate Story → Dev Story) in this window. Supports continue development. Use when user says /cycle, 跑 story 循环, 继续开发.'
---

执行 **BMAD Story Cycle (CS → VS → DS)**：在同一对话内按顺序完成 Create Story → Validate Story → Dev Story（或从继续开发的入口开始）。不执行 Git 提交；Code Review 建议用户新开窗口运行。

**你必须按以下步骤执行：**

<steps CRITICAL="TRUE">
1. **加载并严格遵循** 技能文件：`{project-root}/.cursor/skills/bmad-story-cycle-csvsds/SKILL.md` 中的全部说明。
2. 先执行 **Phase 0**：读取 `_bmad-output/implementation-artifacts/sprint-status.yaml`，按 SKILL 规定检测进度并确定入口（CS / VS / DS）。
3. 从选定入口开始按顺序执行 Step 1（CS）、Step 2（VS）、Step 3（DS），直至本循环结束或 HALT。
4. **DS 结束时**：将需用户本地验证的内容写入 `_bmad-output/implementation-artifacts/local-verification-checklist.md`（追加条目，标明该次循环的 story_key、循环完成日、验证项、**已验证** 标志位初始为否）；所有循环共用该文件，用户完成验证后将对应条目的「已验证」改为是。
5. 变量与路径从 `_bmad/bmm/config.yaml` 解析；`{project-root}` 为仓库根目录。
6. 与用户和文档的交互使用 config 中的 `communication_language`（如中文）。
</steps>

若用户明确说「只做 CS」「只做 CS 和 VS」等，则仅执行其指定的连续子序列，并在结束时说明下一步建议。
