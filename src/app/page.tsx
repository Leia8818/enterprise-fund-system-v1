"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  ClipboardList,
  Coins,
  Database,
  FileText,
  Gauge,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  UserRound,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { seedState } from "@/data/seed";
import { useFundStore } from "@/lib/store";
import {
  BusinessType,
  Budget,
  CashAdvance,
  DictState,
  ExpenseCategory,
  LaborPayment,
  LoanSummary,
  Status,
  Transaction,
  Warning,
} from "@/lib/types";
import {
  budgetRows,
  cashRows,
  computeDashboard,
  departmentRows,
  laborRows,
  loanRows,
  projectRows,
  topicRows,
  warningRows,
} from "@/lib/calculations";
import {
  cn,
  formatCurrency,
  formatDate,
  formatPercent,
  newId,
  today,
} from "@/lib/utils";

type View =
  | "dashboard"
  | "transactions"
  | "budgets"
  | "cash"
  | "loans"
  | "labor"
  | "settings"
  | "warnings";

type FieldType = "text" | "number" | "date" | "select" | "textarea" | "url";

type Field<T> = {
  key: keyof T;
  label: string;
  type?: FieldType;
  options?: string[];
  span?: "full";
  readOnly?: boolean;
};

const navItems: Array<{ key: View; label: string; sub: string; icon: React.ElementType }> = [
  { key: "dashboard", label: "Dashboard", sub: "经营总览", icon: LayoutDashboard },
  { key: "transactions", label: "资金流水", sub: "核心录入表", icon: FileText },
  { key: "budgets", label: "预算管理", sub: "预算与执行", icon: ClipboardList },
  { key: "cash", label: "备用金管理", sub: "申领与余额", icon: WalletCards },
  { key: "loans", label: "借款管理", sub: "借款与归还", icon: HandCoins },
  { key: "labor", label: "劳务费管理", sub: "发放统计", icon: UserRound },
  { key: "settings", label: "基础设置", sub: "基础数据", icon: Database },
  { key: "warnings", label: "风险预警", sub: "自动生成", icon: AlertTriangle },
];

const sourceOptions = ["部门资金", "课题劳务费", "备用金", "其他资金"];
const businessTypeOptions: BusinessType[] = [
  "资金注入",
  "备用金申领",
  "备用金拨付",
  "备用金使用",
  "备用金归还",
  "备用金核销",
  "借款支出",
  "借款归还",
  "劳务费发放",
  "材料费支出",
  "差旅费支出",
  "专家费支出",
  "设备费支出",
  "其他支出",
];
const statusOptions: Status[] = [
  "草稿",
  "待审批",
  "已审批",
  "已拨付",
  "已支付",
  "使用中",
  "已核销",
  "已归还",
  "已完成",
  "已驳回",
];
const expenseOptions: ExpenseCategory[] = [
  "劳务费",
  "备用金",
  "借款",
  "材料费",
  "差旅费",
  "专家费",
  "设备费",
  "办公费",
  "会员费",
  "保险费",
  "招待费",
  "培训费",
  "财产保险费",
  "房租",
  "交通费",
  "物流运输",
  "宣传费",
  "外包服务费",
  "其他",
];

export default function Home() {
  const store = useFundStore(seedState);
  const [view, setView] = useState<View>("dashboard");
  const [query, setQuery] = useState("");
  const derived = useMemo(() => {
    const budgets = budgetRows(store.state);
    const cash = cashRows(store.state);
    const loans = loanRows(store.state);
    const labor = laborRows(store.state);
    const warnings = warningRows(store.state, budgets, cash, loans);
    return {
      budgets,
      cash,
      loans,
      labor,
      warnings,
      dashboard: computeDashboard(store.state, budgets, cash, loans, warnings),
      departments: departmentRows(store.state, budgets, cash, loans, warnings),
      projects: projectRows(store.state, budgets, cash, loans),
      topics: topicRows(store.state, budgets),
      expenseBudgets: budgets
        .filter((row) => ["招待费", "培训费", "财产保险费"].includes(row.category))
        .map((row) => ({
          id: row.id,
          category: row.category,
          budget: row.amount,
          used: row.used,
          executionRate: row.executionRate,
        })),
      selfFundBudgets: budgets
        .filter((row) => ["会员费", "保险费", "办公费", "房租", "交通费", "物流运输"].includes(row.category))
        .map((row) => ({
          id: row.id,
          category: row.category,
          budget: row.amount,
          used: row.used,
          executionRate: row.executionRate,
        })),
    };
  }, [store.state]);

  const title = navItems.find((item) => item.key === view)?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen bg-panel">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-gradient-to-b from-[#064536] via-[#08392f] to-[#052820] text-white">
        <div className="relative border-b border-white/10 px-5 pb-5 pt-6 text-center">
          <div className="absolute right-4 top-4 flex w-16 items-center justify-center">
            <Image
              src="/brand/mgrass-logo-sidebar.png"
              alt="蒙草 M·GRASS"
              width={64}
              height={34}
              className="h-auto w-full object-contain opacity-95 drop-shadow-[0_8px_14px_rgba(0,0,0,0.22)]"
              priority
            />
          </div>
          <div className="pt-10 text-[27px] font-extrabold leading-snug tracking-wide">
            <span className="block">智能装备研究院</span>
            <span className="block">资金管理系统</span>
          </div>
          <div className="mt-3 text-sm font-medium text-emerald-100">V1.0 单用户版</div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setView(item.key);
                  setQuery("");
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition",
                  active ? "bg-emerald-500 text-white shadow-lg shadow-emerald-950/20" : "text-emerald-100 hover:bg-white/10",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block text-xs opacity-75">{item.sub}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="m-4 rounded-xl border border-white/10 bg-white/10 p-3 text-emerald-50 shadow-inner shadow-emerald-950/10">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            数据规则
          </div>
          <div className="mt-2 space-y-1.5 text-[11px] leading-4 text-emerald-100">
            <div className="flex gap-2">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-300/80" />
              <span>资金流水是唯一核心录入表</span>
            </div>
            <div className="flex gap-2">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-300/80" />
              <span>预算、备用金、借款、劳务费和预警自动汇总</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/95 px-6 backdrop-blur">
          <div>
            <h1 className="text-xl font-bold text-ink">{title}</h1>
            <p className="text-xs text-slate-500">本地 JSON 初始数据 · 浏览器本地保存 · 可扩展到 SQLite/API</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="field w-72 pl-9"
                placeholder="搜索当前模块..."
              />
            </div>
            <button className="btn-ghost" onClick={store.reset}>
              <Settings className="h-4 w-4" />
              重置示例数据
            </button>
            <Link className="btn-primary" href="/leader">
              <Gauge className="h-4 w-4" />
              决策概览
            </Link>
          </div>
        </header>

        <div className="p-6">
          {view === "dashboard" && <Dashboard derived={derived} setView={setView} />}
          {view === "transactions" && (
            <TransactionsModule
              query={query}
              state={store.state}
              upsert={(row) => store.upsert("transactions", row)}
              remove={(id) => store.remove("transactions", id)}
            />
          )}
          {view === "budgets" && (
            <BudgetModule
              query={query}
              state={store.state}
              rows={derived.budgets}
              upsert={(row) => store.upsert("budgets", row)}
              remove={(id) => store.remove("budgets", id)}
            />
          )}
          {view === "cash" && (
            <CashModule
              query={query}
              state={store.state}
              rows={derived.cash}
              upsert={(row) => store.upsert("cashAdvances", row)}
              remove={(id) => store.remove("cashAdvances", id)}
            />
          )}
          {view === "loans" && <LoanModule query={query} rows={derived.loans} />}
          {view === "labor" && (
            <LaborModule
              query={query}
              state={store.state}
              rows={derived.labor}
              upsertTransaction={(row) => store.upsert("transactions", row)}
            />
          )}
          {view === "settings" && (
            <SettingsModule
              query={query}
              state={store.state}
              updateDict={(next) => store.setState({ ...store.state, dicts: next })}
            />
          )}
          {view === "warnings" && <WarningModule query={query} rows={derived.warnings} />}
        </div>
      </main>
    </div>
  );
}

function Dashboard({
  derived,
  setView,
}: {
  derived: ReturnType<typeof buildDerived>;
  setView: (view: View) => void;
}) {
  const { dashboard } = derived;
  const cards = [
    { label: "年度总预算", value: formatCurrency(dashboard.totalBudget), icon: Coins, tone: "money" },
    { label: "年度已使用金额", value: formatCurrency(dashboard.usedBudget), icon: Banknote, tone: "money" },
    { label: "年度剩余预算", value: formatCurrency(dashboard.remainingBudget), icon: Landmark, tone: "labor" },
    { label: "部门资金余额", value: formatCurrency(dashboard.departmentFundBalance), icon: Landmark, tone: "money" },
    { label: "课题劳务费余额", value: formatCurrency(dashboard.laborFundBalance), icon: UserRound, tone: "labor" },
    { label: "备用金未结清余额", value: formatCurrency(dashboard.cashOutstanding), icon: WalletCards, tone: "reserve" },
    { label: "借款未归还金额", value: formatCurrency(dashboard.loanOutstanding), icon: HandCoins, tone: "loan" },
    { label: "待审批数量", value: dashboard.pendingCount.toString(), icon: ClipboardList, tone: "risk" },
    { label: "风险预警数量", value: dashboard.warningCount.toString(), icon: AlertTriangle, tone: "risk" },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-3 gap-4 xl:grid-cols-5">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      <section className="grid grid-cols-2 gap-4">
        <ChartCard title="部门各项费用预算执行率">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={derived.expenseBudgets}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" fontSize={12} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} fontSize={12} />
              <Tooltip
                formatter={(v, name) => [
                  name === "executionRate" ? `${Number(v).toFixed(1)}%` : formatCurrency(Number(v)),
                  name === "executionRate" ? "执行率" : name === "budget" ? "预算金额" : "已使用",
                ]}
              />
              <Bar dataKey="executionRate" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="课题自筹预算执行率">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={derived.selfFundBudgets}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" fontSize={12} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} fontSize={12} />
              <Tooltip
                formatter={(v, name) => [
                  name === "executionRate" ? `${Number(v).toFixed(1)}%` : formatCurrency(Number(v)),
                  name === "executionRate" ? "执行率" : name === "budget" ? "预算金额" : "已使用",
                ]}
              />
              <Bar dataKey="executionRate" fill="#0f766e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid grid-cols-[1fr_1.15fr] gap-4">
        <ChartCard title="各项目累计支出">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={derived.projects.slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" fontSize={12} tickFormatter={(v) => `${Number(v) / 10000}万`} />
              <YAxis dataKey="project" type="category" width={92} fontSize={12} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="spent" fill="#0f766e" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <Panel title="课题自筹预算明细">
          <div className="space-y-3">
            {derived.selfFundBudgets.map((row) => (
              <div key={row.id} className="rounded-lg border border-line bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-ink">{row.category}</div>
                  <div className="text-sm font-bold text-money">{formatCurrency(row.budget)}</div>
                </div>
                <div className="mt-2 h-2 rounded-full bg-emerald-50">
                  <div className="h-2 rounded-full bg-money" style={{ width: `${Math.min(row.executionRate, 100)}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>已使用 {formatCurrency(row.used)}</span>
                  <span>执行率 {(row.executionRate || 0).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-[1.3fr_1fr] gap-4">
        <Panel title="最近10条资金流水" action={<button onClick={() => setView("transactions")} className="btn-ghost">查看全部</button>}>
          <SimpleTable
            columns={[
              ["date", "日期", (v) => formatDate(v as string)],
              ["department", "部门"],
              ["project", "项目"],
              ["businessType", "业务类型"],
              ["person", "人员"],
              ["amount", "金额", (v) => formatCurrency(Number(v))],
              ["status", "状态", (v) => <StatusBadge status={String(v)} />],
            ]}
            rows={dashboard.recentTransactions}
          />
        </Panel>
        <Panel title="当前风险预警" action={<button onClick={() => setView("warnings")} className="btn-ghost">处理预警</button>}>
          <div className="space-y-3">
            {derived.warnings.slice(0, 6).map((warning) => (
              <div key={warning.id} className="rounded-lg border border-red-100 bg-red-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded bg-risk px-2 py-1 text-xs font-bold text-white">{warning.type}</span>
                  <span className="text-xs text-slate-500">{formatDate(warning.date)}</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-800">{warning.remark}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {warning.department || "-"} / {warning.project || "-"} / {warning.person || "-"}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function TransactionsModule({
  query,
  state,
  upsert,
  remove,
}: {
  query: string;
  state: typeof seedState;
  upsert: (row: Transaction) => void;
  remove: (id: string) => void;
}) {
  const [filters, setFilters] = useState({ department: "全部", project: "全部", person: "", businessType: "全部", start: "", end: "" });
  const [editing, setEditing] = useState<Transaction | null>(null);
  const rows = state.transactions
    .filter((row) => includesQuery(row, query))
    .filter((row) => filters.department === "全部" || row.department === filters.department)
    .filter((row) => filters.project === "全部" || row.project === filters.project)
    .filter((row) => !filters.person.trim() || row.person.includes(filters.person.trim()))
    .filter((row) => filters.businessType === "全部" || row.businessType === filters.businessType)
    .filter((row) => !filters.start || row.date >= filters.start)
    .filter((row) => !filters.end || row.date <= filters.end);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const fields = transactionFields(state);

  return (
    <ModuleFrame
      title="资金流水"
      description="系统唯一核心录入表。新增、编辑、删除流水后，预算、备用金、借款、劳务费和预警会自动重算。"
      actions={<button className="btn-primary" onClick={() => setEditing(emptyTransaction(state))}><Plus className="h-4 w-4" />新增流水</button>}
    >
      <FilterBar>
        <SelectFilter label="日期起" type="date" value={filters.start} onChange={(v) => setFilters({ ...filters, start: v })} />
        <SelectFilter label="日期止" type="date" value={filters.end} onChange={(v) => setFilters({ ...filters, end: v })} />
        <SelectFilter label="部门" value={filters.department} options={["全部", ...state.dicts.departments.map((d) => d.name)]} onChange={(v) => setFilters({ ...filters, department: v })} />
        <SelectFilter label="项目" value={filters.project} options={["全部", ...state.dicts.projects.map((p) => p.name)]} onChange={(v) => setFilters({ ...filters, project: v })} />
        <SelectFilter label="人员" type="text" value={filters.person} placeholder="输入人员姓名" onChange={(v) => setFilters({ ...filters, person: v })} />
        <SelectFilter label="业务类型" value={filters.businessType} options={["全部", ...businessTypeOptions]} onChange={(v) => setFilters({ ...filters, businessType: v })} />
        <div className="ml-auto rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-money">筛选金额合计：{formatCurrency(total)}</div>
      </FilterBar>
      <DataTable
        rows={rows}
        columns={[
          ["date", "日期", (v) => formatDate(v as string)],
          ["eventNo", "事项编号"],
          ["department", "部门"],
          ["project", "项目"],
          ["topic", "课题", (v) => displaySlash(v)],
          ["fundSource", "资金来源"],
          ["businessType", "业务类型"],
          ["person", "人员"],
          ["amount", "金额", (v) => formatCurrency(Number(v)), "right"],
          ["status", "状态", (v) => <StatusBadge status={String(v)} />],
        ]}
        onEdit={setEditing}
        onDelete={remove}
      />
      <EditDialog title="资金流水" row={editing} fields={fields} onClose={() => setEditing(null)} onSave={(row) => { upsert(row as Transaction); setEditing(null); }} />
    </ModuleFrame>
  );
}

function BudgetModule({
  query,
  state,
  rows,
  upsert,
  remove,
}: {
  query: string;
  state: typeof seedState;
  rows: ReturnType<typeof budgetRows>;
  upsert: (row: Budget) => void;
  remove: (id: string) => void;
}) {
  const [editing, setEditing] = useState<Budget | null>(null);
  const filtered = rows.filter((row) => includesQuery(row, query));
  return (
    <ModuleFrame
      title="预算管理"
      description="维护部门预算、项目预算和课题预算；已使用金额、剩余金额和执行率从资金流水自动统计。"
      actions={<button className="btn-primary" onClick={() => setEditing(emptyBudget(state))}><Plus className="h-4 w-4" />新增预算</button>}
    >
      <DataTable
        rows={filtered}
        columns={[
          ["year", "年度"],
          ["type", "预算类型"],
          ["department", "部门"],
          ["project", "项目"],
          ["topic", "课题", (v) => displaySlash(v)],
          ["category", "费用类别"],
          ["amount", "预算金额", (v) => formatCurrency(Number(v)), "right"],
          ["used", "已使用金额", (v) => formatCurrency(Number(v)), "right"],
          ["remaining", "剩余金额", (v) => formatCurrency(Number(v)), "right"],
          ["executionRate", "执行率", (v) => <Progress value={Number(v)} />],
          ["owner", "负责人"],
        ]}
        onEdit={(row) => setEditing(state.budgets.find((item) => item.id === row.id) ?? null)}
        onDelete={remove}
      />
      <EditDialog title="预算" row={editing} fields={budgetFields(state)} onClose={() => setEditing(null)} onSave={(row) => { upsert(row as Budget); setEditing(null); }} />
    </ModuleFrame>
  );
}

function CashModule({
  query,
  state,
  rows,
  upsert,
  remove,
}: {
  query: string;
  state: typeof seedState;
  rows: ReturnType<typeof cashRows>;
  upsert: (row: CashAdvance) => void;
  remove: (id: string) => void;
}) {
  const [editing, setEditing] = useState<CashAdvance | null>(null);
  const filtered = rows.filter((row) => includesQuery(row, query));
  return (
    <ModuleFrame
      title="备用金管理"
      description="管理备用金申领、拨付、使用、归还和核销。当前余额大于 0 表示未结清。"
      actions={<button className="btn-primary" onClick={() => setEditing(emptyCash(state))}><Plus className="h-4 w-4" />新增申请</button>}
    >
      <SummaryStrip
        items={[
          ["申请总额", rows.reduce((s, r) => s + r.requestAmount, 0), "reserve"],
          ["已拨付", rows.reduce((s, r) => s + r.paidAmount, 0), "reserve"],
          ["已使用", rows.reduce((s, r) => s + r.usedAmount, 0), "reserve"],
          ["未结清余额", rows.reduce((s, r) => s + r.balance, 0), "risk"],
        ]}
      />
      <DataTable
        rows={filtered}
        columns={[
          ["requestNo", "申请编号"],
          ["requestDate", "申请日期", (v) => formatDate(v as string)],
          ["department", "部门"],
          ["project", "项目"],
          ["applicant", "申请人"],
          ["purpose", "用途"],
          ["requestAmount", "申请金额", (v) => formatCurrency(Number(v)), "right"],
          ["paidAmount", "拨付金额", (v) => formatCurrency(Number(v)), "right"],
          ["usedAmount", "使用金额", (v) => formatCurrency(Number(v)), "right"],
          ["returnedAmount", "归还金额", (v) => formatCurrency(Number(v)), "right"],
          ["balance", "当前余额", (v) => <StrongMoney value={Number(v)} tone="reserve" />, "right"],
          ["status", "状态", (v) => <StatusBadge status={String(v)} />],
        ]}
        onEdit={(row) => setEditing(state.cashAdvances.find((item) => item.id === row.id) ?? null)}
        onDelete={remove}
      />
      <EditDialog title="备用金申请" row={editing} fields={cashFields(state)} onClose={() => setEditing(null)} onSave={(row) => { upsert(row as CashAdvance); setEditing(null); }} />
    </ModuleFrame>
  );
}

function LoanModule({ query, rows }: { query: string; rows: LoanSummary[] }) {
  const filtered = rows.filter((row) => includesQuery(row, query));
  return (
    <ModuleFrame title="借款管理" description="从资金流水自动汇总借款支出与借款归还，展示逾期和高额借款提醒。">
      <SummaryStrip
        items={[
          ["借款总额", rows.reduce((s, r) => s + r.borrowAmount, 0), "loan"],
          ["归还总额", rows.reduce((s, r) => s + r.returnedAmount, 0), "labor"],
          ["未归还金额", rows.reduce((s, r) => s + r.outstanding, 0), "risk"],
          ["逾期笔数", rows.filter((r) => r.overdue).length, "risk", false],
        ]}
      />
      <DataTable
        rows={filtered}
        columns={[
          ["person", "人员"],
          ["department", "部门"],
          ["project", "项目"],
          ["topic", "课题", (v) => displaySlash(v)],
          ["fundSource", "资金来源"],
          ["borrowAmount", "借款金额", (v) => formatCurrency(Number(v)), "right"],
          ["returnedAmount", "归还金额", (v) => formatCurrency(Number(v)), "right"],
          ["outstanding", "未归还金额", (v) => <StrongMoney value={Number(v)} tone={Number(v) > 5000 ? "risk" : "loan"} />, "right"],
          ["borrowDate", "借款日期", (v) => formatDate(v as string)],
          ["expectedReturnDate", "预计归还日", (v) => formatDate(v as string)],
          ["overdue", "是否逾期", (v) => (v ? <RiskBadge text="逾期" /> : "否")],
          ["overdueDays", "逾期天数"],
        ]}
      />
    </ModuleFrame>
  );
}

function LaborModule({
  query,
  state,
  rows,
  upsertTransaction,
}: {
  query: string;
  state: typeof seedState;
  rows: LaborPayment[];
  upsertTransaction: (row: Transaction) => void;
}) {
  const [editing, setEditing] = useState<Transaction | null>(null);
  const filtered = rows.filter((row) => includesQuery(row, query));
  const monthTotal = rows.filter((row) => row.date.slice(0, 7) === today().slice(0, 7)).reduce((s, r) => s + r.amount, 0);
  const yearTotal = rows.filter((row) => row.date.slice(0, 4) === today().slice(0, 4)).reduce((s, r) => s + r.amount, 0);
  return (
    <ModuleFrame
      title="劳务费管理"
      description="业务类型为“劳务费发放”的流水自动进入本模块，可按课题、项目和人员统计。"
      actions={<button className="btn-primary" onClick={() => setEditing(emptyLaborTransaction(state))}><Plus className="h-4 w-4" />新增劳务费</button>}
    >
      <SummaryStrip
        items={[
          ["本月发放金额", monthTotal, "labor"],
          ["年度累计发放", yearTotal, "labor"],
          ["发放人数", new Set(rows.map((r) => r.payee)).size, "money", false],
          ["发放记录数", rows.length, "money", false],
        ]}
      />
      <DataTable
        rows={filtered}
        columns={[
          ["date", "日期", (v) => formatDate(v as string)],
          ["department", "部门"],
          ["project", "项目"],
          ["topic", "课题", (v) => displaySlash(v)],
          ["payee", "发放对象"],
          ["workContent", "工作内容"],
          ["amount", "金额", (v) => formatCurrency(Number(v)), "right"],
          ["approver", "审批人"],
          ["status", "状态", (v) => <StatusBadge status={String(v)} />],
          ["voucherNo", "凭证编号"],
        ]}
      />
      <EditDialog title="劳务费发放" row={editing} fields={transactionFields(state).filter((field) => ["date", "eventNo", "department", "project", "topic", "person", "amount", "approver", "status", "voucherNo", "remark"].includes(String(field.key)))} onClose={() => setEditing(null)} onSave={(row) => { upsertTransaction({ ...(row as Transaction), fundSource: "课题劳务费", businessType: "劳务费发放", expenseCategory: "劳务费" }); setEditing(null); }} />
    </ModuleFrame>
  );
}

function SettingsModule({
  query,
  state,
  updateDict,
}: {
  query: string;
  state: typeof seedState;
  updateDict: (dicts: DictState) => void;
}) {
  const [tab, setTab] = useState<"departments" | "projects" | "topics" | "people" | "categories">("departments");
  const dict = state.dicts;
  return (
    <ModuleFrame title="基础设置" description="维护部门、项目、课题、人员和费用类别。这里的数据会进入各录入表下拉选项。">
      <div className="mb-4 flex gap-2">
        {[
          ["departments", "部门管理"],
          ["projects", "项目管理"],
          ["topics", "课题管理"],
          ["people", "人员管理"],
          ["categories", "费用类别"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as typeof tab)} className={cn("btn-ghost", tab === key && "border-emerald-200 bg-emerald-50 text-money")}>{label}</button>
        ))}
      </div>
      {tab === "departments" && (
        <DataTable
          rows={dict.departments.filter((row) => includesQuery(row, query))}
          columns={[["code", "部门编号"], ["name", "部门名称"], ["owner", "负责人"]]}
          onEdit={(row) => updateDict({ ...dict, departments: dict.departments.map((d) => d.id === row.id ? row : d) })}
        />
      )}
      {tab === "projects" && (
        <DataTable
          rows={dict.projects.filter((row) => includesQuery(row, query))}
          columns={[["code", "项目编号"], ["name", "项目名称"], ["department", "所属部门"], ["owner", "项目负责人"], ["status", "项目状态", (v) => <StatusBadge status={String(v)} />]]}
        />
      )}
      {tab === "topics" && (
        <DataTable rows={dict.topics.filter((row) => includesQuery(row, query))} columns={[["code", "课题编号"], ["name", "课题名称"], ["project", "所属项目"], ["owner", "课题负责人"]]} />
      )}
      {tab === "people" && (
        <DataTable rows={dict.people.filter((row) => includesQuery(row, query))} columns={[["name", "姓名"], ["department", "所属部门"], ["role", "角色"]]} />
      )}
      {tab === "categories" && (
        <div className="grid grid-cols-5 gap-3">
          {dict.expenseCategories.map((category) => (
            <div key={category} className="rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700">{category}</div>
          ))}
        </div>
      )}
    </ModuleFrame>
  );
}

function WarningModule({ query, rows }: { query: string; rows: Warning[] }) {
  const filtered = rows.filter((row) => includesQuery(row, query));
  return (
    <ModuleFrame title="风险预警" description="系统根据预算执行、借款、备用金和待审批流水自动生成预警。">
      <DataTable
        rows={filtered}
        columns={[
          ["type", "预警类型", (v) => <RiskBadge text={String(v)} />],
          ["department", "部门"],
          ["project", "项目"],
          ["topic", "课题", (v) => displaySlash(v)],
          ["person", "人员"],
          ["amount", "金额", (v) => formatCurrency(Number(v)), "right"],
          ["date", "发生日期", (v) => formatDate(v as string)],
          ["overdueDays", "逾期天数"],
          ["status", "处理状态", (v) => <StatusBadge status={String(v)} />],
          ["remark", "备注"],
        ]}
      />
    </ModuleFrame>
  );
}

function MetricCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone: string }) {
  const color = toneColor(tone);
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className={cn("rounded-lg p-2", color.bg)}>
          <Icon className={cn("h-5 w-5", color.text)} />
        </div>
      </div>
      <div className="mt-4 text-xs font-semibold text-slate-500">{label}</div>
      <div className={cn("mt-1 text-2xl font-bold", color.text)}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h2 className="mb-4 text-base font-bold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-bold text-ink">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function ModuleFrame({ title, description, actions, children }: { title: string; description: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between p-5">
        <div>
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="card flex flex-wrap items-end gap-3 p-4">{children}</div>;
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
  placeholder,
  type = "select",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  placeholder?: string;
  type?: "select" | "date" | "text";
}) {
  const listId = useId();
  return (
    <label className="space-y-1 text-xs font-semibold text-slate-500">
      <span>{label}</span>
      {type === "date" ? (
        <input className="field w-36" type="date" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : type === "text" ? (
        <input className="field w-40" type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <>
          <input className="field w-40" list={listId} value={value} placeholder={placeholder ?? "可选择或输入"} onChange={(e) => onChange(e.target.value)} />
          <datalist id={listId}>
            {options?.map((option) => <option key={option} value={option} />)}
          </datalist>
        </>
      )}
    </label>
  );
}

type CellRender<T> = (value: unknown, row: T) => React.ReactNode;
type Column<T> =
  | [keyof T, string]
  | [keyof T, string, CellRender<T>]
  | [keyof T, string, CellRender<T>, "left" | "right" | "center"];

function DataTable<T extends { id: string }>({
  rows,
  columns,
  onEdit,
  onDelete,
}: {
  rows: T[];
  columns: Array<Column<T>>;
  onEdit?: (row: T) => void;
  onDelete?: (id: string) => void;
}) {
  const [sort, setSort] = useState<{ key: keyof T; dir: "asc" | "desc" } | null>(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const result = String(av ?? "").localeCompare(String(bv ?? ""), "zh-CN", { numeric: true });
      return sort.dir === "asc" ? result : -result;
    });
  }, [rows, sort]);
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              {columns.map(([key, label]) => (
                <th key={String(key)} className="whitespace-nowrap border-b border-line px-4 py-4 text-left text-base font-extrabold tracking-wide text-slate-700">
                  <button
                    className="inline-flex items-center gap-1"
                    onClick={() => setSort(sort?.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" })}
                  >
                    {label}
                    <span className="text-slate-300">↕</span>
                  </button>
                </th>
              ))}
              {(onEdit || onDelete) && <th className="border-b border-line px-4 py-3 text-right">操作</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id} className="border-b border-line bg-white hover:bg-emerald-50/50">
                {columns.map(([key, , render, align = "left"]) => (
                  <td key={String(key)} className={cn("max-w-[260px] whitespace-nowrap px-4 py-3 text-slate-700", align === "right" && "text-right", align === "center" && "text-center")}>
                    {render ? render(row[key], row) : String(row[key] ?? "")}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {onEdit && <button className="mr-2 text-sm font-semibold text-money" onClick={() => onEdit(row)}>编辑</button>}
                    {onDelete && <button className="text-sm font-semibold text-risk" onClick={() => onDelete(row.id)}>删除</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <div className="p-10 text-center text-sm text-slate-500">暂无数据</div>}
    </div>
  );
}

function SimpleTable<T extends { id: string }>({ rows, columns }: { rows: T[]; columns: Array<Column<T>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-xs text-slate-500">
          <tr>{columns.map(([, label]) => <th key={label} className="border-b border-line px-3 py-3 text-left text-base font-extrabold tracking-wide text-slate-700">{label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line">
              {columns.map(([key, , render]) => <td key={String(key)} className="whitespace-nowrap px-3 py-2">{render ? render(row[key], row) : String(row[key] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditDialog<T extends { id: string }>({
  title,
  row,
  fields,
  onClose,
  onSave,
}: {
  title: string;
  row: T | null;
  fields: Array<Field<T>>;
  onClose: () => void;
  onSave: (row: T) => void;
}) {
  const [draft, setDraft] = useState<T | null>(row);
  useEffect(() => setDraft(row), [row]);
  if (!row || !draft) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <button className="btn-ghost" onClick={onClose}>关闭</button>
        </div>
        <div className="grid max-h-[68vh] grid-cols-2 gap-3 overflow-y-auto p-5">
          {fields.map((field) => (
            <label key={String(field.key)} className={cn("space-y-1 text-sm font-semibold text-slate-600", field.span === "full" && "col-span-2")}>
              <span>{field.label}</span>
              <InputField
                field={field}
                value={draft[field.key]}
                onChange={(value) => setDraft({ ...draft, [field.key]: field.type === "number" ? Number(value) : value } as T)}
              />
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 border-t border-line bg-slate-50 px-5 py-4">
          <button className="btn-ghost" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={() => onSave(draft)}>保存</button>
        </div>
      </div>
    </div>
  );
}

function InputField<T>({
  field,
  value,
  onChange,
}: {
  field: Field<T>;
  value: unknown;
  onChange: (value: string) => void;
}) {
  const strValue = String(value ?? "");
  const listId = useId();
  if (field.type === "textarea") {
    return <textarea className="field h-24 w-full py-2" value={strValue} onChange={(e) => onChange(e.target.value)} />;
  }
  if (field.type === "select") {
    return (
      <>
        <input className="field w-full" list={listId} value={strValue} placeholder="可选择或输入" onChange={(e) => onChange(e.target.value)} />
        <datalist id={listId}>
          {field.options?.map((option) => <option key={option} value={option} />)}
        </datalist>
      </>
    );
  }
  return <input className="field w-full" type={field.type ?? "text"} value={strValue} onChange={(e) => onChange(e.target.value)} />;
}

function SummaryStrip({ items }: { items: Array<[string, number, string, boolean?]> }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map(([label, value, tone, money = true]) => {
        const color = toneColor(tone);
        return (
          <div key={label} className="card p-4">
            <div className="text-xs font-semibold text-slate-500">{label}</div>
            <div className={cn("mt-1 text-xl font-bold", color.text)}>{money ? formatCurrency(value) : value}</div>
          </div>
        );
      })}
    </div>
  );
}

function Progress({ value }: { value: number }) {
  const color = value > 100 ? "bg-risk" : value >= 90 ? "bg-orange-500" : value >= 70 ? "bg-amber-400" : "bg-labor";
  return (
    <div className="min-w-32">
      <div className="mb-1 text-xs font-semibold">{formatPercent(value / 100)}</div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={cn("h-2 rounded-full", color)} style={{ width: `${Math.min(value, 120)}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const risk = ["待审批", "已驳回", "未处理"].includes(status);
  const done = ["已支付", "已完成", "已归还", "已核销"].includes(status);
  return (
    <span className={cn("rounded-full px-2 py-1 text-xs font-bold", risk ? "bg-red-50 text-risk" : done ? "bg-green-50 text-labor" : "bg-emerald-50 text-money")}>{status}</span>
  );
}

function RiskBadge({ text }: { text: string }) {
  return <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-risk">{text}</span>;
}

function StrongMoney({ value, tone }: { value: number; tone: string }) {
  return <span className={cn("font-bold", toneColor(tone).text)}>{formatCurrency(value)}</span>;
}

function toneColor(tone: string) {
  if (tone === "labor") return { text: "text-labor", bg: "bg-green-50" };
  if (tone === "reserve") return { text: "text-reserve", bg: "bg-purple-50" };
  if (tone === "loan") return { text: "text-loan", bg: "bg-orange-50" };
  if (tone === "risk") return { text: "text-risk", bg: "bg-red-50" };
  return { text: "text-money", bg: "bg-emerald-50" };
}

function buildDerived() {
  const budgets = budgetRows(seedState);
  const cash = cashRows(seedState);
  const loans = loanRows(seedState);
  const warnings = warningRows(seedState, budgets, cash, loans);
  return {
    budgets,
    cash,
    loans,
    labor: laborRows(seedState),
    warnings,
    dashboard: computeDashboard(seedState, budgets, cash, loans, warnings),
    departments: departmentRows(seedState, budgets, cash, loans, warnings),
    projects: projectRows(seedState, budgets, cash, loans),
    topics: topicRows(seedState, budgets),
    expenseBudgets: budgets
      .filter((row) => ["招待费", "培训费", "财产保险费"].includes(row.category))
      .map((row) => ({
        id: row.id,
        category: row.category,
        budget: row.amount,
        used: row.used,
        executionRate: row.executionRate,
      })),
    selfFundBudgets: budgets
      .filter((row) => ["会员费", "保险费", "办公费", "房租", "交通费", "物流运输"].includes(row.category))
      .map((row) => ({
        id: row.id,
        category: row.category,
        budget: row.amount,
        used: row.used,
        executionRate: row.executionRate,
      })),
  };
}

function includesQuery(row: unknown, query: string) {
  if (!query.trim()) return true;
  return JSON.stringify(row).toLowerCase().includes(query.trim().toLowerCase());
}

function displaySlash(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "/";
}

function transactionFields(state: typeof seedState): Array<Field<Transaction>> {
  return [
    { key: "date", label: "日期", type: "date" },
    { key: "department", label: "部门", type: "select", options: state.dicts.departments.map((d) => d.name) },
    { key: "project", label: "项目", type: "select", options: state.dicts.projects.map((p) => p.name) },
    { key: "fundSource", label: "资金来源", type: "select", options: sourceOptions },
    { key: "businessType", label: "业务类型", type: "select", options: businessTypeOptions },
    { key: "expenseCategory", label: "费用类别", type: "select", options: expenseOptions },
    { key: "person", label: "人员" },
    { key: "amount", label: "金额", type: "number" },
    { key: "status", label: "状态", type: "select", options: statusOptions },
    { key: "remark", label: "备注", type: "textarea", span: "full" },
  ];
}

function budgetFields(state: typeof seedState): Array<Field<Budget>> {
  return [
    { key: "year", label: "年度", type: "number" },
    { key: "type", label: "预算类型", type: "select", options: ["部门预算", "项目预算", "课题预算"] },
    { key: "department", label: "部门", type: "select", options: state.dicts.departments.map((d) => d.name) },
    { key: "project", label: "项目", type: "select", options: ["", ...state.dicts.projects.map((p) => p.name)] },
    { key: "topic", label: "课题", type: "select", options: ["", ...state.dicts.topics.map((t) => t.name)] },
    { key: "category", label: "费用类别", type: "select", options: expenseOptions },
    { key: "amount", label: "预算金额", type: "number" },
    { key: "owner", label: "负责人" },
    { key: "remark", label: "备注", type: "textarea", span: "full" },
  ];
}

function cashFields(state: typeof seedState): Array<Field<CashAdvance>> {
  return [
    { key: "requestNo", label: "申请编号" },
    { key: "requestDate", label: "申请日期", type: "date" },
    { key: "department", label: "部门", type: "select", options: state.dicts.departments.map((d) => d.name) },
    { key: "project", label: "项目", type: "select", options: state.dicts.projects.map((p) => p.name) },
    { key: "applicant", label: "申请人", type: "select", options: state.dicts.people.map((p) => p.name) },
    { key: "purpose", label: "用途" },
    { key: "requestAmount", label: "申请金额", type: "number" },
    { key: "approver", label: "审批人", type: "select", options: state.dicts.people.map((p) => p.name) },
    { key: "status", label: "状态", type: "select", options: statusOptions },
    { key: "paidAmount", label: "拨付金额", type: "number" },
    { key: "usedAmount", label: "使用金额", type: "number" },
    { key: "returnedAmount", label: "归还金额", type: "number" },
    { key: "writtenOffAmount", label: "核销金额", type: "number" },
    { key: "remark", label: "备注", type: "textarea", span: "full" },
  ];
}

function emptyTransaction(state: typeof seedState): Transaction {
  return {
    id: newId("tx"),
    date: today(),
    eventNo: `SX-${today().replaceAll("-", "")}-${state.transactions.length + 1}` ,
    department: state.dicts.departments[0]?.name ?? "",
    project: state.dicts.projects[0]?.name ?? "",
    topic: "",
    fundSource: "部门资金",
    businessType: "其他支出",
    expenseCategory: "其他",
    person: state.dicts.people[0]?.name ?? "",
    amount: 0,
    approver: state.dicts.people[0]?.name ?? "",
    status: "草稿",
    expectedReturnDate: "",
    voucherNo: "",
    attachmentUrl: "",
    remark: "",
  };
}

function emptyLaborTransaction(state: typeof seedState): Transaction {
  return { ...emptyTransaction(state), fundSource: "课题劳务费", businessType: "劳务费发放", expenseCategory: "劳务费", status: "待审批" };
}

function emptyBudget(state: typeof seedState): Budget {
  return {
    id: newId("bd"),
    year: new Date().getFullYear(),
    type: "项目预算",
    department: state.dicts.departments[0]?.name ?? "",
    project: state.dicts.projects[0]?.name ?? "",
    topic: "",
    category: "其他",
    amount: 0,
    owner: "",
    remark: "",
  };
}

function emptyCash(state: typeof seedState): CashAdvance {
  return {
    id: newId("ca"),
    requestNo: `BF-${today().replaceAll("-", "")}-${state.cashAdvances.length + 1}`,
    requestDate: today(),
    department: state.dicts.departments[0]?.name ?? "",
    project: state.dicts.projects[0]?.name ?? "",
    applicant: state.dicts.people[0]?.name ?? "",
    purpose: "",
    requestAmount: 0,
    approver: state.dicts.people[0]?.name ?? "",
    status: "待审批",
    paidAmount: 0,
    usedAmount: 0,
    returnedAmount: 0,
    writtenOffAmount: 0,
    remark: "",
  };
}
