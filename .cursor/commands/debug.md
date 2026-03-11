---
name: 'debug'
description: '人工自测协作：加载项目概况与自测方法，等待用户反馈问题后由 agent 修改；用户要求自测时 agent 按自测方法对本项目进行测试'
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND.

## 1. 首次响应：加载项目概况并交代自测方法

1. **加载项目概况**：读取 `{project-root}/_bmad-output/project-context.md` 全文，在回复中简要摘要（技术栈、目录约定、Supabase 单例、路由与认证、启动顺序、测试用户等）。如需分析具体功能，可再读 `{project-root}/_bmad-output/planning-artifacts/architecture.md` 中相关部分（数据表、前端结构、路由表）。
2. **交代自测方法**：将下面「自测方法」一节完整纳入你的认知；在首次回复中说明「自测方法已就绪」，并注明当用户说「你来自测」「执行自测」「按自测方法测一下」时你会按该自测方法执行。
3. **进入等待**：输出上述简短「项目概况 + 自测方法已就绪」后，**等待用户输入**。不主动开始自测，除非用户明确要求。

---

## 2. 自测方法（如何对本项目进行测试）

以下为 agent 对本项目进行测试时应遵循的方法；不依赖、不引用任何 checklist 文件。

### 启动

- 前端应用在 `huotong-app/`，启动命令：在项目根或 `huotong-app/` 下执行 `npm run dev`。
- 环境变量：`huotong-app/.env` 或 `huotong-app/.env.local`，必须包含 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`；修改后需重启 dev server。

### 构建与自动化测试

- `npm run build`：TypeScript 严格检查 + Vite 构建，用于回归验证。
- `npm run test:run`：Vitest 单次运行，用于确认无测试回归。

### 登录

- 测试账号（见 project-context，仅开发/测试环境）：邮箱 `1559082675@qq.com`，密码 `hezhangcan199873`。
- 登录页路径：`/login`。未登录访问受保护页面会重定向到 `/login?redirect=...`。
- 浏览器自动化时：在登录页填写邮箱和密码后会触发 Vue 重渲染；**必须先做一次新的 snapshot（如 `browser_snapshot`），再用新 snapshot 中的登录按钮 ref 点击**，否则易出现 "Element reference is stale"。登录按钮可用 `data-testid="login-submit"` 定位。

### 主要可测功能/路由

- 首页：`/`
- 商品：`/products`（列表、新增、详情等）
- 客户：`/customers`
- 供应商：`/suppliers`
- 出货单：`/sale-orders`（列表、新建、详情）
- 进货单：`/purchase-orders`
- 应收：`/receivables`
- 应付：`/payables`
- 库存：`/stock`

未登录访问以上受保护路由会重定向到 `/login?redirect=<原路径>`。

### 浏览器自动化

- 使用 Cursor 的 browser 工具（navigate、snapshot、click、fill、browser_wait_for 等）打开页面、登录、操作关键流程。
- 等待时优先用 `browser_wait_for` 的 **text** / **textGone** 条件，避免固定长 sleep；仅对导航、提交等明显需等响应的操作使用短等待（如 1～2 秒）后 snapshot 再判断。

---

## 3. 默认模式（等待用户反馈问题）

- 用户**人工自测**后，把发现的问题（现象、复现步骤、预期 vs 实际）描述给你。
- 你根据 project-context 与代码进行**修改**（修 bug 或小优化），修改后可按需建议用户再测或跑 `npm run build` / `npm run test:run` 验证。

---

## 4. 当用户要求「自测」时

当用户说「你来自测」「执行自测」「按自测方法测一下」等时：

1. 先执行 `npm run build` 与 `npm run test:run`（在 `huotong-app/` 下），确认通过或记录失败。
2. 视情况用浏览器：打开 dev 地址（通常为本地 Vite 默认地址）、按自测方法登录、访问主要路由或用户指定的流程；记录异常（控制台报错、页面错误、与预期不符的行为）。
3. 汇总发现的问题，询问用户是否逐项修复。不读取或依赖 `_bmad-output/implementation-artifacts/local-verification-checklist.md`。
