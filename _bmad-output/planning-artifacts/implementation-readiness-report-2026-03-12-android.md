---
stepsCompleted: ["step-01-document-discovery", "step-02-android-scope-review", "step-03-architecture-alignment", "step-04-epic-readiness-check", "step-05-handoff-assessment"]
documentsInventoried:
  product_brief: "product-brief-MyApp-2026-03-09.md"
  prd: "prd.md"
  architecture: "architecture.md"
  epics: "epics.md"
assessmentScope: "android-client-incremental-planning"
date: "2026-03-12"
---

# Implementation Readiness Assessment Report - Android Increment

**Project:** HuoTong（货通）  
**Assessment Date:** 2026-03-12  
**Focus:** 基于现有 Web 基线，增量规划 Android 客户端第二轮开发

## 文档清单

本次实现就绪评估基于以下已更新文档：

- `product-brief-MyApp-2026-03-09.md`
- `prd.md`
- `architecture.md`
- `epics.md`

## 本轮规划结论

当前 HuoTong 的业务域模型、Supabase 后端契约和核心进销存流程已经稳定，适合作为 Android 客户端的复用基础。第二轮规划已把项目主交付形态调整为：

- `Capacitor + 现有 Vue/Vite 代码复用`
- Android 客户端为主线
- 现有 Web 仅作为历史基线和迁移参考

这意味着阶段 4 不需要从零开始重新定义业务，而是围绕“Android 壳、平台适配、降级策略、安装升级、真机验证”展开。

## Android 第二轮实现范围

### 首版必须交付

- Android 基础壳与打包能力
- 登录与会话恢复
- 商品 / 客户 / 供应商管理
- 出货 / 进货核心流程
- 应收 / 应付管理
- 库存查询与调整
- 返回键、前后台恢复、网络提示
- APK 分发与覆盖升级

### 首版允许降级

- Realtime
- 拍照识别
- 文件导出
- Web/PC 侧继续演进

## Ready 维度评估

### 1. 产品范围是否收敛

**结论：是。**

当前 PRD 已明确 Android 首版以“稳定可用”优先，不追求一步到位原生化，也不要求首版恢复所有 Web 增强能力。范围边界已经足够支撑 Sprint 规划。

### 2. 技术路线是否明确

**结论：是。**

架构文档已经明确：

- 继续复用 Supabase 后端与业务数据层
- 使用 Capacitor 作为 Android 容器
- 通过平台抽象层处理 Camera / File / BackButton / Lifecycle / Network / Session
- 通过降级策略降低首版风险

### 3. Epic / Story 粒度是否可开发

**结论：是。**

`epics.md` 已新增：

- Epic 8: Android 客户端基础壳与打包交付
- Epic 9: Android 运行时适配
- Epic 10: Android 首版稳定性与降级策略
- Epic 11: Android 版本升级与分发管理
- Epic 12: 家庭内测交付与上线准备

这些 Story 已具备明确目标和验收条件，可以直接进入阶段 4 的 Sprint Planning。

### 4. 仍需在实现前显式确认的事项

以下项目不阻止进入阶段 4，但必须在 Story 开发时优先落地：

- Android 包名 / applicationId
- 正式 keystore 的生成与备份方式
- APK 分发入口（下载页或固定分发方式）
- 家庭账号分发与安装指引
- 首版默认关闭的功能开关（Realtime / 识图 / 导出）

### 5. 最大剩余风险

本轮规划最大的剩余风险不是代码组织，而是**真实网络环境**：

- Android 客户端只能解决网页入口问题
- 不能自动解决 Supabase Auth / CRUD / RPC / Edge Function 的公网链路问题

因此阶段 4 必须把“真机网络验收”作为核心 story 或验收条件，而不是附加测试。

## 对阶段 4 的建议

### Sprint Planning 起点

建议从以下顺序进入阶段 4：

1. `Story 8.1` Android 工程初始化
2. `Story 8.2` 应用身份与构建配置
3. `Story 10.2` 首版降级与入口整形
4. `Story 9.1` 会话恢复与前后台适配
5. `Story 9.2` 返回键适配

原因：

- 先建立可安装的 Android 容器
- 再把首版功能收敛为稳定闭环
- 最后再补运行时体验和升级交付

### Sprint Status 建议

现有 `_bmad-output/implementation-artifacts/sprint-status.yaml` 记录的是 Web 第一轮实施历史，不建议直接覆盖。

阶段 4 更合适的做法是：

- 新建 Android 第二轮 sprint 跟踪文件，或
- 在原 sprint-status 中从 `epic-8` 开始追加新的 Android 迭代状态

但无论采用哪种方式，都应保留 `epic-1` 到 `epic-7` 的已完成记录。

## 最终判定

**判定：READY WITH CONDITIONS**

HuoTong 已经具备进入 Android 第二轮 Sprint Planning 的条件，但进入开发前必须接受以下现实：

- 首版不是“功能全开版”，而是“稳定可交付版”
- Android 打包只是开始，安装、升级、签名和真机网络验证同样是交付的一部分
- 若 Supabase 真机网络验证失败，需要优先解决链路问题，而不是继续堆客户端功能

在上述前提下，本项目可以进入阶段 4，由其它 agent 接手 Sprint Planning、Story Dev 和 Code Review。
