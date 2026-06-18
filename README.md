# 智能装备研究院资金管理系统 V1

一个轻量级单用户 Web 系统，用于管理部门预算、项目预算、课题劳务费、备用金、借款归还、资金余额和风险预警。

系统以“资金流水”为核心数据源，预算执行、备用金余额、借款汇总、劳务费统计、Dashboard 指标和风险预警均由录入数据自动计算。当前版本默认清空业务示例数据，仅保留基础选项，便于正式录入真实数据。

## 技术栈

- Next.js 14
- TypeScript
- Tailwind CSS
- Recharts
- Lucide React
- 浏览器 localStorage 本地持久化

## 功能模块

- Dashboard 经营总览
- 资金流水
- 预算管理
- 备用金管理
- 借款管理
- 劳务费管理
- 基础设置
- 风险预警
- 决策概览入口：`/leader`

## 当前数据规则

- 业务数据默认清空：资金流水、预算、备用金申请均为空。
- 基础设置保留：部门、项目、费用类别、人员等候选数据。
- 选择类输入支持“候选项选择 + 手动输入”。
- 课题字段当前不启用，相关表格中以 `/` 展示。
- 数据保存在浏览器 localStorage 中，适合单机轻量使用。

## 本地运行

```bash
npm install
npm run dev
```

打开：

```text
http://127.0.0.1:3000
```

领导/决策查看入口：

```text
http://127.0.0.1:3000/leader
```

## 构建

```bash
npm run build
npm run start
```

## 项目结构

```text
public/brand/              品牌 Logo 资源
src/app/page.tsx           主应用页面与模块入口
src/app/leader/page.tsx    决策概览页面
src/app/globals.css        Tailwind 与全局样式
src/data/seed.ts           基础初始数据
src/lib/types.ts           数据模型
src/lib/calculations.ts    自动汇总与风险预警逻辑
src/lib/store.ts           localStorage 数据层
src/lib/utils.ts           金额、日期、样式工具
```

## 后续扩展建议

- 将 `src/lib/store.ts` 替换为 SQLite 或服务端 API。
- 增加登录与角色权限。
- 增加附件上传与凭证管理。
- 增加数据导入导出能力。
