# 智能装备研究院资金管理系统 V1

一个轻量级单用户 Web 系统，用于管理部门预算、项目预算、课题劳务费、备用金、借款归还、资金余额和风险预警。

系统以“资金流水”为核心数据源，Dashboard 指标、备用金余额、借款汇总、劳务费统计和风险预警均由录入数据自动计算。当前版本默认清空业务示例数据，仅保留基础选项，便于正式录入真实数据。

## 技术栈

- Next.js 14
- TypeScript
- Tailwind CSS
- Recharts
- Lucide React
- 浏览器 localStorage 本地持久化
- Supabase 云端数据库同步（可选）
- JSON / CSV 导入导出

## 功能模块

- 展示扫码入口：`/`、`/show`
- 前台查看入口：`/leader`
- 后台管理入口：`/admin`
- 后台登录入口：`/login`
- Dashboard 经营总览
- 资金流水
- 预算管理
- 备用金管理
- 借款管理
- 劳务费管理
- 基础设置
- 风险预警
- 决策概览入口：`/leader`
- 二维码入口：登录页自动生成，手机扫码可直接进入决策概览

## 当前数据规则

- 业务数据默认清空：资金流水、预算、备用金申请均为空。
- 基础设置保留：部门、项目、费用类别、人员等候选数据。
- 选择类输入支持“候选项选择 + 手动输入”。
- 资金流水主列表字段：日期、事项编号、部门、项目、资金类别、收支类型、经办人、金额、状态、备注、操作。
- 资金类别：课题劳务费、备用金、借款、其他。
- 收支类型：收入、支出、归还。
- 状态：已支付、已完成、已归还。
- 金额展示规则：收入/归还显示绿色 `+¥`，支出显示红色 `-¥`。
- 未配置云端数据库时，数据保存在当前浏览器 localStorage 中，刷新页面不丢失。
- 配置 Supabase 后，后台点击“云端保存”，电脑端和手机端会读取同一份云端数据。
- 前台查看页会在打开、窗口重新聚焦和约 30 秒轮询时自动读取云端最新数据。
- 可导出 JSON、导入 JSON、导出 CSV。

## 日常处理流程

1. 展示时打开 `/` 或 `/show`，现场扫码直接进入决策概览。
2. 管理人员从 `/login` 登录后进入 `/admin` 后台。
3. 进入“资金流水”，系统会显示字段完整/字段缺失数量。
4. 新增或编辑流水时，金额只录入正数；系统按“收入/支出/归还”统一显示正负号。
5. 点击“本地保存”会保存到当前浏览器；点击“云端保存”会同步到 Supabase，手机前台刷新后可查看。
6. 点击“归档已完成”可批量归档状态为“已完成”的流水。
7. 归档不会删除历史记录；财务统计仍会包含这些流水，日常列表默认只显示未归档记录。

## 本地运行

```bash
npm install
npm run dev
```

展示扫码页：

```text
http://127.0.0.1:3000
```

备用展示地址：

```text
http://127.0.0.1:3000/show
```

后台登录入口：

```text
http://127.0.0.1:3000/login
```

默认账号：

```text
管理端：admin / 123456
领导查看：leader / 123456
```

手机端扫码：

1. 云端部署时，打开 `/login`，二维码会自动指向公网 `/leader` 决策概览。
2. 局域网演示时，运行 `npm run dev` 后，二维码会指向当前访问域名下的 `/leader` 页面。
3. 手机和电脑需要在同一个 Wi-Fi 下，手机扫码即可直接打开决策概览。

> 手机扫码查看同一份后台数据，需要先完成下面的 Supabase 云端数据库配置。

领导/决策查看入口：

```text
http://127.0.0.1:3000/leader
```

后台管理入口：

```text
http://127.0.0.1:3000/admin
```

## 构建

```bash
npm run build
```

构建后会生成静态发布目录：

```text
out/
```

## 云端数据库配置

当前版本支持 Supabase 作为云端数据库。配置完成后，后台录入和手机扫码查看会使用同一份云端数据。

1. 登录 Supabase，新建一个 Project。
2. 进入 `SQL Editor`，复制并执行 [supabase/schema.sql](supabase/schema.sql)。
3. 在 Supabase 项目 `Settings > API` 中复制：
   - Project URL
   - anon public key
4. 如果本地开发使用云端同步，在项目根目录新建 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=你的 Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon public key
NEXT_PUBLIC_SUPABASE_TABLE=fund_app_state
```

5. 如果 GitHub Pages 部署使用云端同步，进入 GitHub 仓库 `Settings > Secrets and variables > Actions`，新增：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_TABLE`，值为 `fund_app_state`
6. 重新运行 GitHub Pages 部署。
7. 打开后台 `/admin`，录入数据后点击“云端保存”。
8. 手机扫码进入 `/leader`，刷新或等待自动同步即可看到最新数据。

注意：当前 SQL 为静态前端演示版，允许匿名密钥读写单条 `default` 业务数据。正式上线建议增加 Supabase Auth、服务端 API 或 Edge Function，把写入权限收回到后台账号侧。

## 公网部署

当前项目已经配置为静态导出模式，可以部署到任意静态托管平台。

### 方式一：GitHub Pages

1. 将项目推送到 GitHub 仓库。
2. 打开仓库 `Settings > Pages`。
3. Source 选择 `GitHub Actions`。
4. 推送到 `main` 或 `master` 后，`.github/workflows/deploy-pages.yml` 会自动构建并发布。
5. 发布完成后，访问 GitHub Pages 给出的公网地址，例如：

```text
https://你的用户名.github.io/仓库名/login
```

### 方式二：Vercel / Netlify / Cloudflare Pages

上传整个项目或直接上传 `out/` 目录即可。

已生成本次静态部署包：

```text
智能装备研究院资金管理系统-公网部署包.zip
```

部署成功后，请打开公网 `/login` 页面，页面右侧会自动生成直达决策概览的二维码。

## 项目结构

```text
public/brand/              品牌 Logo 资源
src/app/page.tsx           展示扫码入口
src/app/show/page.tsx      展示扫码页面
src/app/admin/page.tsx     后台管理页面与模块入口
src/app/login/page.tsx     后台登录与二维码入口
src/app/leader/page.tsx    决策概览页面
src/app/globals.css        Tailwind 与全局样式
src/data/seed.ts           基础初始数据
src/lib/types.ts           数据模型
src/lib/calculations.ts    自动汇总与风险预警逻辑
src/lib/store.ts           本地存储与云端同步逻辑
src/lib/cloudStore.ts      Supabase 读写封装
src/lib/auth.ts            轻量登录状态逻辑
src/lib/qrcodegen.ts       本地二维码生成器
src/lib/utils.ts           金额、日期、样式工具
supabase/schema.sql        Supabase 建表与演示权限脚本
```

## 后续扩展建议

- 在当前角色模型基础上增加登录认证。
- 增加附件上传与凭证管理。
- 增加更细粒度的审批流程和字段权限。
