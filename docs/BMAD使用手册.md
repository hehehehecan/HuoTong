# BMAD 使用手册

> Building Modern Apps with Design (BMAD) 系统命令完整使用指南  
> 项目：HuoTong  
> 更新日期：2026-03-10

---

## 目录

1. [BMAD 简介](#bmad-简介)
2. [系统架构](#系统架构)
3. [核心概念](#核心概念)
4. [工作流阶段](#工作流阶段)
5. [常用命令详解](#常用命令详解)
6. [高级用法](#高级用法)
7. [配置说明](#配置说明)
8. [常见问题](#常见问题)

---

## BMAD 简介

BMAD (Building Modern Apps with Design) 是一个结构化的软件开发工作流系统,通过 AI 辅助实现从需求到交付的全流程管理。

### 核心特点

- **结构化流程**: 从头脑风暴到实现,每个阶段都有明确的输入输出
- **AI 驱动**: 通过 Agent 自动化执行各个环节
- **可追溯性**: 所有决策和变更都有完整记录
- **质量保证**: 内置多层验证和代码审查机制

### 项目结构

```
项目根目录/
├── _bmad/                          # BMAD 核心配置
│   ├── bmm/                        # BMM 模块
│   │   ├── config.yaml            # 项目配置
│   │   ├── workflows/             # 工作流定义
│   │   └── agents/                # Agent 定义
│   └── core/                      # BMAD 核心
├── _bmad-output/                  # BMAD 输出目录
│   ├── planning-artifacts/        # 规划产物
│   │   ├── product-brief-*.md    # 产品简报
│   │   ├── prd.md                # 产品需求文档
│   │   ├── architecture.md       # 架构设计
│   │   └── epics.md              # Epic 列表
│   └── implementation-artifacts/  # 实现产物
│       ├── sprint-status.yaml    # Sprint 状态
│       └── *.md                  # Story 文件
└── .cursor/
    └── skills/                    # Cursor 技能
        ├── bmad-story-cycle-csvsds/
        └── bmad-auto-cr-latest-story/
```

---

## 系统架构

### 1. BMAD Core

核心任务和工作流引擎,提供:
- 工作流执行引擎 (`workflow.xml`)
- 文档分片处理 (`shard-doc.xml`)
- 审查任务 (adversarial review, edge case hunter)

### 2. BMM Module

业务方法学模块,包含完整开发流程:
- **规划阶段** (1-2): 头脑风暴、PRD、架构
- **解决方案阶段** (3): Epic、Story、实现就绪检查
- **实现阶段** (4): Sprint、Story 开发、代码审查

### 3. Cursor Skills

Cursor IDE 集成技能,简化常用操作:
- `bmad-story-cycle-csvsds`: 自动执行完整 Story 循环
- `bmad-auto-cr-latest-story`: 自动代码审查

---

## 核心概念

### Story 状态流转

```
backlog → ready-for-dev → in-progress → review → done
```

| 状态 | 说明 | 触发条件 |
|------|------|---------|
| `backlog` | Story 仅存在于 Epic 文件中 | Epic 创建时 |
| `ready-for-dev` | Story 文件已创建 | Create Story 完成 |
| `in-progress` | 开发中 | Dev Story 开始 |
| `review` | 待代码审查 | Dev Story 完成 |
| `done` | 已完成 | Code Review 通过 |

### Epic 状态流转

```
backlog → in-progress → done
```

- **backlog**: Epic 未开始
- **in-progress**: 第一个 Story 创建时自动转换
- **done**: 所有 Story 完成后手动设置

---

## 工作流阶段

### 阶段 1: 头脑风暴 (Brainstorming)

**目的**: 从用户想法生成结构化的产品简报

**主要工作流**:
- `bmad-quick-flow/quick-spec`: 快速规格生成

**产出**:
- `product-brief-{ProjectName}-{date}.md`

---

### 阶段 2: 需求分析 (Requirements)

**目的**: 将产品简报扩展为完整的 PRD

**主要工作流**:
- PRD 生成与验证
- 信息密度检查
- 产品简报覆盖度验证

**产出**:
- `prd.md`
- `prd-validation-report.md`

---

### 阶段 3: 解决方案设计 (Solutioning)

#### 3.1 架构设计

**命令**: `/bmad-bmm-create-architecture`

**执行步骤**:
1. 初始化架构上下文
2. 分析需求和约束
3. 评估技术选型
4. 做出架构决策
5. 定义设计模式
6. 生成架构文档
7. 验证完整性

**产出**:
- `architecture.md`
- 架构决策记录 (ADR)

**使用示例**:
```
用户: 帮我创建架构设计
Agent: [执行 create-architecture workflow]
```

#### 3.2 Epic 和 Story 规划

**命令**: `/bmad-bmm-create-epics-and-stories`

**执行步骤**:
1. 验证前置条件 (PRD、架构已完成)
2. 设计 Epic 结构
3. 为每个 Epic 创建 Story
4. 最终验证

**产出**:
- `epics.md`

#### 3.3 实现就绪检查

**命令**: `/bmad-bmm-check-implementation-readiness`

**检查项**:
- Epic 覆盖度
- PRD 对齐度
- UX 一致性
- Epic 质量
- 技术可行性

**产出**:
- `implementation-readiness-report-{date}.md`

---

### 阶段 4: 实现 (Implementation)

#### 4.1 Sprint Planning

**命令**: `/bmad-bmm-sprint-planning`

**目的**: 初始化 Sprint,生成状态跟踪文件

**执行步骤**:
1. 读取 `epics.md`
2. 提取所有 Epic 和 Story
3. 生成 `sprint-status.yaml`
4. 所有 Story 初始状态为 `backlog`

**产出**:
- `sprint-status.yaml`

**使用时机**:
- 项目开发开始前
- 第一次执行任何实现命令前

---

#### 4.2 Story 循环 (Create Story → Validate Story → Dev Story)

这是最常用的开发流程,通过 Cursor Skill 自动化执行。

##### 方式 1: 使用 Skill (推荐)

**命令**:
```
跑 story 循环
或
继续开发
```

**Skill 名称**: `bmad-story-cycle-csvsds`

**执行逻辑**:

1. **Phase 0: 检测进度**
   - 读取 `sprint-status.yaml`
   - 按文件顺序从上到下扫描
   - 确定执行模式:
     - **找到 `in-progress`** → 完成该循环,从 Dev Story 继续
     - **找到 `ready-for-dev`** → 完成该循环,从 Validate Story 开始
     - **都没有** → 全新循环,从 Create Story 开始

2. **Step 1: Create Story (CS)**
   - 从 `sprint-status.yaml` 选择首个 `backlog` Story
   - 加载相关文档 (epics, PRD, architecture, project-context)
   - 生成完整 Story 文件: `{story_key}.md`
   - 更新状态为 `ready-for-dev`

3. **Step 2: Validate Story (VS)**
   - 加载 Story 文件
   - 按 checklist 系统性校验
   - 发现问题直接在当前窗口修改
   - 可多次迭代直到无阻塞问题

4. **Step 3: Dev Story (DS)**
   - 将 Story 状态更新为 `in-progress`
   - 按 Tasks/Subtasks 顺序实现
   - 执行 Red-Green-Refactor
   - 编写测试并运行
   - 更新 Story 的 File List、Change Log、Dev Agent Record
   - 完成后状态更新为 `review`

**自测规则**:
- **Agent 自主完成**: 构建检查、启动 dev server、浏览器自动化测试
- **需用户配合**: 清晰说明操作步骤、位置、预期结果

**示例对话**:

```
用户: 跑 story 循环

Agent: 
检测到 story 1-3-main-layout-nav 为 in-progress
任务: 完成本循环,从 Dev Story 继续

[执行 Dev Story...]
[更新状态为 review...]

建议: 新开窗口执行代码审查
```

##### 方式 2: 手动执行各步骤

如果需要更细粒度的控制,可以分别执行:

**Create Story**:
```
用户: /bmad-bmm-create-story
```

**Validate Story**:
```
用户: 验证 story 文件 {story_key}.md
```

**Dev Story**:
```
用户: /bmad-bmm-dev-story
```

---

#### 4.3 代码审查 (Code Review)

##### 方式 1: 使用 Skill (推荐)

**命令**:
```
做一次 CR
或
自动代码审查
或
/bmad-bmm-code-review
```

**Skill 名称**: `bmad-auto-cr-latest-story`

**执行逻辑**:

1. **自动检测目标 Story**
   - 读取 `sprint-status.yaml`
   - 优先选择第一个 `review` 状态的 Story
   - 如无 `review`,选择第一个 `in-progress` 的 Story

2. **执行代码审查**
   - 加载 Story 文件和相关代码
   - 按 checklist 系统性审查
   - 识别问题并分级 (High/Medium/Low)

3. **自动修复**
   - 默认修复所有 High/Medium 问题
   - 必要时补充测试
   - 更新 Story 的 Review 记录、File List、Change Log

4. **同步状态**
   - 全部问题解决且 AC 满足 → `done`
   - 否则 → `in-progress` 或保持 `review`

5. **回归验证**
   - 运行构建/类型检查
   - 确保没有引入新问题

6. **Git 提交**
   - 自动执行 `git add` 和 `git commit`
   - 提交信息格式: `完成 {story_key} 代码审查修复并同步状态`
   - **不包含** Cursor 品牌标记

**输出格式**:
```markdown
已自动定位目标 Story: `3-1-customer-entry-list`(来源: sprint-status 的最新可审查进度)

本轮 CR 结果:
- High: 2 (已修复 2,剩余 0)
- Medium: 3 (已修复 3,剩余 0)
- Low: 1 (已修复 0,剩余 1)

验证结果:
- 构建/类型检查: 通过

状态同步:
- Story: review -> done
- Sprint: review -> done

提交结果:
- Commit: abc1234 (完成 3-1-customer-entry-list 代码审查修复并同步状态)
```

##### 方式 2: 手动指定 Story

```
用户: /bmad-bmm-code-review {story_file_path}
```

**最佳实践**:
- 建议在新窗口执行 Code Review (与开发使用不同的 LLM 模型)
- Review 后由用户决定是否提交 (手动执行时)

---

#### 4.4 Sprint 回顾 (Retrospective)

**命令**: `/bmad-bmm-retrospective`

**目的**: Epic 完成后总结经验教训

**执行时机**:
- Epic 的所有 Story 达到 `done` 状态后

**产出**:
- 更新 `sprint-status.yaml` 中 retrospective 状态为 `done`
- 可选择性生成回顾文档

---

#### 4.5 纠偏 (Correct Course)

**命令**: `/bmad-bmm-correct-course`

**使用场景**:
- Story 实现偏离需求
- 发现架构问题需要调整
- Epic 范围需要修改

**执行步骤**:
1. 识别偏离点
2. 分析根本原因
3. 制定纠正计划
4. 更新相关文档
5. 调整 Sprint 状态

---

### 阶段 5: 文档化 (Documentation)

#### 5.1 生成项目上下文

**命令**: `/bmad-bmm-generate-project-context`

**目的**: 为新加入的 Agent 提供项目全景

**执行步骤**:
1. 发现项目结构
2. 分析关键文件
3. 生成上下文文档

**产出**:
- `project-context.md`

#### 5.2 项目文档化

**命令**: `/bmad-bmm-document-project`

**模式**:
- **Full Scan**: 全面扫描生成完整文档
- **Deep Dive**: 深入分析特定模块

**产出**:
- 项目概览
- 源码树
- 模块详细文档

---

## 常用命令详解

### 快速参考表

| 命令 | 简短说明 | 阶段 |
|------|---------|------|
| `跑 story 循环` | 自动执行 CS→VS→DS | 实现 |
| `继续开发` | 继续未完成的 Story 循环 | 实现 |
| `做一次 CR` | 自动代码审查 | 实现 |
| `/bmad-bmm-sprint-planning` | 初始化 Sprint | 实现 |
| `/bmad-bmm-create-architecture` | 创建架构设计 | 解决方案 |
| `/bmad-bmm-create-epics-and-stories` | 创建 Epic 和 Story | 解决方案 |
| `/bmad-bmm-check-implementation-readiness` | 实现就绪检查 | 解决方案 |
| `/bmad-bmm-retrospective` | Sprint 回顾 | 实现 |
| `/bmad-bmm-correct-course` | 纠偏 | 实现 |
| `/bmad-bmm-generate-project-context` | 生成项目上下文 | 文档 |
| `/bmad-bmm-document-project` | 项目文档化 | 文档 |

### 典型工作流

#### 场景 1: 新项目启动

```
1. 头脑风暴 → 生成产品简报
2. /bmad-bmm-create-architecture
3. /bmad-bmm-create-epics-and-stories
4. /bmad-bmm-check-implementation-readiness
5. /bmad-bmm-sprint-planning
6. 跑 story 循环
```

#### 场景 2: 日常开发

```
1. 跑 story 循环 (或 继续开发)
2. [新窗口] 做一次 CR
3. [重复 1-2 直到 Epic 完成]
4. /bmad-bmm-retrospective
```

#### 场景 3: 中途加入项目

```
1. /bmad-bmm-generate-project-context
2. 阅读 project-context.md、prd.md、architecture.md、epics.md
3. 查看 sprint-status.yaml 了解当前进度
4. 继续开发
```

---

## 高级用法

### 1. 仅执行部分循环

**只做 Create Story**:
```
用户: 只做 CS
```

**只做 Create Story 和 Validate Story**:
```
用户: 只做 CS 和 VS
```

### 2. 手动控制 Story 状态

编辑 `sprint-status.yaml`:
```yaml
development_status:
  3-1-customer-entry-list: in-progress  # 手动改为 in-progress
```

然后执行:
```
继续开发
```

### 3. 跳过某个 Story

在 `sprint-status.yaml` 中直接设置为 `done`:
```yaml
development_status:
  3-2-customer-edit-delete: done  # 跳过这个 Story
```

### 4. 并行开发多个 Story

虽然不推荐,但如果团队容量允许:
1. 创建多个分支
2. 每个分支独立维护 `sprint-status.yaml`
3. 使用不同的 Cursor 窗口

### 5. 自定义 Agent 配置

编辑 `_bmad/_config/agents/*.customize.yaml`:
```yaml
# 例如: bmm-dev.customize.yaml
model: claude-sonnet-4
temperature: 0.7
additional_instructions: |
  - 优先使用 TypeScript strict 模式
  - 所有组件使用 Composition API
```

---

## 配置说明

### 主配置文件: `_bmad/bmm/config.yaml`

```yaml
project_name: HuoTong                    # 项目名称
user_skill_level: intermediate            # 用户技能等级
planning_artifacts: "{project-root}/_bmad-output/planning-artifacts"
implementation_artifacts: "{project-root}/_bmad-output/implementation-artifacts"
project_knowledge: "{project-root}/docs"

user_name: Hezhangcan                    # 用户名
communication_language: Chinese          # 交流语言
document_output_language: Chinese        # 文档输出语言
output_folder: _bmad-output              # 输出目录
```

### 变量解析

- `{project-root}`: 项目根目录
- `{planning_artifacts}`: 规划产物目录
- `{implementation_artifacts}`: 实现产物目录
- `{story_key}`: Story 标识符 (如 `3-1-customer-entry-list`)

### IDE 配置: `.cursor/`

```
.cursor/
├── rules/              # Cursor 规则
└── skills/            # Cursor 技能
    ├── bmad-story-cycle-csvsds/
    │   └── SKILL.md
    └── bmad-auto-cr-latest-story/
        └── SKILL.md
```

---

## 常见问题

### Q1: 执行命令时提示 "No backlog story found"

**原因**: Sprint 中没有 `backlog` 状态的 Story

**解决**:
1. 检查 `sprint-status.yaml`,确认是否有 `backlog` Story
2. 如果所有 Story 都已完成,考虑:
   - 创建新的 Epic
   - 执行 Retrospective
   - 规划下一个 Sprint

### Q2: Story 循环在中途停止了,如何继续?

**解决**:
```
继续开发
```

Skill 会自动检测 `in-progress` 或 `ready-for-dev` 的 Story 并继续。

### Q3: 代码审查后发现新问题,如何处理?

**解决**:
1. 手动修改 `sprint-status.yaml`,将 Story 改回 `in-progress`
2. 执行 `继续开发` 完成修复
3. 再次执行 `做一次 CR`

### Q4: 如何查看当前开发进度?

**解决**:
```
用户: 显示当前 sprint 状态
```

或直接查看 `sprint-status.yaml`:
```bash
cat _bmad-output/implementation-artifacts/sprint-status.yaml
```

### Q5: 如何自定义 Story 模板?

**解决**:
编辑 `_bmad/bmm/workflows/4-implementation/create-story/template.md`

### Q6: Git 提交信息不符合团队规范怎么办?

**解决**:
使用手动 Code Review 模式,自己控制提交:
```
用户: /bmad-bmm-code-review {story_file}
```

完成后自己执行:
```bash
git add .
git commit -m "feat(customer): 实现客户录入和列表功能 (#3-1)"
```

### Q7: 如何回滚到之前的 Story?

**解决**:
1. 恢复代码到之前的 commit
2. 编辑 `sprint-status.yaml`,将相关 Story 状态改回
3. 执行 `继续开发`

### Q8: 能否跳过 Validate Story?

**不推荐**,但如果要跳过:
```
用户: 只做 CS,然后只做 DS
```

或手动设置状态后直接 `继续开发`。

### Q9: 如何处理多人协作?

**建议**:
- 使用 Git 分支管理不同 Story
- 定期同步 `sprint-status.yaml`
- 避免同时编辑同一个 Story

### Q10: BMAD 命令执行失败怎么办?

**排查步骤**:
1. 检查 `_bmad/bmm/config.yaml` 配置正确
2. 确认必要的前置文件存在 (如 PRD、架构、epics)
3. 查看 Cursor 控制台错误信息
4. 检查 `sprint-status.yaml` 格式正确

---

## 附录

### A. Story 文件结构

```markdown
# Story {story_key}: {title}

## Context
[背景信息]

## Acceptance Criteria
- [ ] AC 1
- [ ] AC 2

## Tasks
### Task 1: {task_name}
- [ ] Subtask 1.1
- [ ] Subtask 1.2

## Technical Notes
[技术细节]

## Dependencies
- Prerequisite: {previous_story_key}

## File List
[实现涉及的文件]

## Change Log
[变更记录]

## Dev Agent Record
[开发过程记录]

## Review
[代码审查记录]
```

### B. Epic 文件结构

```markdown
# Epic {epic_id}: {title}

## Overview
[Epic 概述]

## Business Value
[业务价值]

## Stories

### Story {story_key}: {title}
**Acceptance Criteria**:
- AC 1
- AC 2

**Technical Notes**:
[技术说明]
```

### C. 术语表

| 术语 | 说明 |
|------|------|
| BMAD | Building Modern Apps with Design |
| BMM | BMAD Method Module |
| PRD | Product Requirements Document (产品需求文档) |
| Epic | 大功能模块,包含多个 Story |
| Story | 单个可交付的开发任务 |
| AC | Acceptance Criteria (验收标准) |
| CS | Create Story |
| VS | Validate Story |
| DS | Dev Story |
| CR | Code Review |
| ADR | Architecture Decision Record |

### D. 相关资源

- BMAD Core: `_bmad/core/`
- BMM Workflows: `_bmad/bmm/workflows/`
- BMM Agents: `_bmad/bmm/agents/`
- Cursor Skills: `.cursor/skills/`
- 规划产物: `_bmad-output/planning-artifacts/`
- 实现产物: `_bmad-output/implementation-artifacts/`

---

## 总结

BMAD 系统提供了从需求到交付的完整工作流。核心开发循环是:

1. **Sprint Planning** (首次)
2. **跑 story 循环** (CS → VS → DS)
3. **做一次 CR**
4. **重复 2-3** 直到 Epic 完成
5. **Retrospective**

通过 Cursor Skills,大部分流程可以自动化执行,极大提升开发效率。

**下一步建议**:
- 如果是新项目,从架构设计开始
- 如果是已有项目,执行 `继续开发` 继续当前 Story
- 如果不确定当前状态,查看 `sprint-status.yaml`

---

*本文档基于 BMAD 6.0.4 版本编写*
