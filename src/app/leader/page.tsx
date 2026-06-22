"use client";

import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  ClipboardList,
  HandCoins,
  Landmark,
  ShieldAlert,
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
import { BASE_PATH, withBasePath } from "@/lib/auth";
import { budgetRows, cashRows, computeDashboard, departmentRows, loanRows, transactionSignedAmount, warningRows } from "@/lib/calculations";
import { useFundStore } from "@/lib/store";
import type { Transaction, Warning } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function LeaderPage() {
  const store = useFundStore(seedState);

  const budgets = budgetRows(store.state);
  const cash = cashRows(store.state);
  const loans = loanRows(store.state);
  const warnings = warningRows(store.state, budgets, cash, loans);
  const dashboard = computeDashboard(store.state, budgets, cash, loans, warnings);
  const departments = departmentRows(store.state, budgets, cash, loans, warnings);
  const expenseBudgets = budgets
    .filter((row) => ["招待费", "培训费", "财产保险费"].includes(row.category))
    .map((row) => ({
      id: row.id,
      category: row.category,
      executionRate: row.executionRate,
    }));
  const selfFundBudgets = budgets
    .filter((row) => ["会员费", "保险费", "办公费", "房租", "交通费", "物流运输"].includes(row.category))
    .map((row) => ({
      id: row.id,
      category: row.category,
      executionRate: row.executionRate,
    }));

  const cards = [
    { label: "年度总预算", value: formatCurrency(dashboard.totalBudget), icon: Landmark, color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "年度已使用", value: formatCurrency(dashboard.usedBudget), icon: Banknote, color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "年度剩余预算", value: formatCurrency(dashboard.remainingBudget), icon: ClipboardList, color: "text-green-700", bg: "bg-green-50" },
    { label: "备用金未结清", value: formatCurrency(dashboard.cashOutstanding), icon: WalletCards, color: "text-purple-700", bg: "bg-purple-50" },
    { label: "借款未归还", value: formatCurrency(dashboard.loanOutstanding), icon: HandCoins, color: "text-orange-700", bg: "bg-orange-50" },
    { label: "风险预警", value: String(dashboard.warningCount), icon: ShieldAlert, color: "text-red-700", bg: "bg-red-50" },
  ];

  return (
    <main className="min-h-screen bg-[#f3f8f5]">
      <MobileDecisionOverview
        dashboard={dashboard}
        warnings={warnings}
        recentTransactions={dashboard.recentTransactions}
        updatedAt={store.cloudUpdatedAt || (hasBusinessData(store.state) ? store.lastSavedAt : "")}
        cloudStatus={store.cloudStatus}
        hasBusinessData={hasBusinessData(store.state)}
      />

      <div className="hidden lg:block">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-28 items-center justify-center rounded-xl bg-white px-3 shadow-sm ring-1 ring-line">
              <Image
                src={`${BASE_PATH}/brand/mgrass-logo-cropped.png`}
                alt="蒙草 M·GRASS"
                width={112}
                height={62}
                className="h-auto w-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500">决策概览</div>
              <h1 className="mt-1 text-2xl font-bold text-ink">智能装备研究院资金管理系统</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600">
              数据更新时间：{formatDate(new Date().toISOString())}
            </div>
            <Link className="btn-ghost" href={`${withBasePath("/login")}?next=%2Fadmin`}>
              <ArrowLeft className="h-4 w-4" />
              后台管理
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-5 px-8 py-6">
        <section className="grid grid-cols-3 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-500">{card.label}</div>
                    <div className={`mt-2 text-3xl font-bold ${card.color}`}>{card.value}</div>
                  </div>
                  <div className={`rounded-xl p-3 ${card.bg}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-[1.1fr_0.9fr] gap-5">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-ink">部门各项费用预算执行率</h2>
              <span className="text-xs text-slate-500">按当前资金流水自动统计</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseBudgets}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" fontSize={12} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} fontSize={12} />
                <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                <Bar dataKey="executionRate" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-ink">当前风险预警</h2>
              <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-risk">{warnings.length} 项</span>
            </div>
            <div className="space-y-3">
              {warnings.slice(0, 6).map((warning) => (
                <div key={warning.id} className="rounded-lg border border-red-100 bg-red-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1 rounded bg-risk px-2 py-1 text-xs font-bold text-white">
                      <AlertTriangle className="h-3 w-3" />
                      {warning.type}
                    </span>
                    <span className="text-xs text-slate-500">{formatDate(warning.date)}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-800">{warning.remark}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {warning.department || "-"} / {warning.project || "-"} / {warning.person || "-"} / {formatCurrency(warning.amount)}
                  </div>
                </div>
              ))}
              {warnings.length === 0 && <div className="rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-700">当前暂无风险预警</div>}
            </div>
          </div>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-ink">课题自筹预算执行率</h2>
            <span className="text-xs text-slate-500">会员费、保险费、办公费、房租、交通费、物流运输</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={selfFundBudgets}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" fontSize={12} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} fontSize={12} />
              <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
              <Bar dataKey="executionRate" fill="#0f766e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="grid grid-cols-[0.9fr_1.1fr] gap-5">
          <div className="card p-5">
            <h2 className="mb-4 font-bold text-ink">月度资金趋势</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dashboard.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${Number(v) / 10000}万`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Line type="monotone" dataKey="收入" stroke="#059669" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="支出" stroke="#dc2626" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="劳务费" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-bold text-ink">最近资金流水</h2>
              <span className="text-xs text-slate-500">最近 10 条</span>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  {["日期", "部门", "项目", "资金类别", "收支类型", "经办人", "金额", "状态"].map((item) => (
                    <th key={item} className="border-b border-line px-4 py-4 text-left text-base font-extrabold tracking-wide text-slate-700">{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dashboard.recentTransactions.map((row) => (
                  <tr key={row.id} className="border-b border-line">
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(row.date)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.department}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.project}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.fundSource}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.businessType}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.person}</td>
                    <td className={transactionSignedAmount(row) < 0 ? "whitespace-nowrap px-4 py-3 font-bold text-red-600" : "whitespace-nowrap px-4 py-3 font-bold text-emerald-700"}>
                      {transactionSignedAmount(row) < 0 ? "-" : "+"}{formatCurrency(Math.abs(transactionSignedAmount(row)))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-4">
          <SmallStat label="课题劳务费余额" value={formatCurrency(dashboard.laborFundBalance)} icon={UserRound} />
          <SmallStat label="部门资金余额" value={formatCurrency(dashboard.departmentFundBalance)} icon={Landmark} />
          <SmallStat label="本月收入" value={formatCurrency(dashboard.monthlyIncome)} icon={ClipboardList} />
          <SmallStat label="备用金结清率" value={`${cash.length ? (((cash.filter((item) => item.balance <= 0).length / cash.length) * 100)).toFixed(1) : "0.0"}%`} icon={WalletCards} />
        </section>
      </div>
      </div>
    </main>
  );
}

function MobileDecisionOverview({
  dashboard,
  warnings,
  recentTransactions,
  updatedAt,
  cloudStatus,
  hasBusinessData,
}: {
  dashboard: ReturnType<typeof computeDashboard>;
  warnings: Warning[];
  recentTransactions: Transaction[];
  updatedAt: string;
  cloudStatus: string;
  hasBusinessData: boolean;
}) {
  const focusCards = [
    { label: "总资金余额", value: formatCurrency(dashboard.totalBalance), tone: "text-emerald-700", icon: Landmark },
    { label: "课题劳务费", value: formatCurrency(dashboard.laborFundBalance), tone: "text-green-700", icon: UserRound },
    { label: "备用金余额", value: formatCurrency(dashboard.reserveBalance), tone: "text-purple-700", icon: WalletCards },
    { label: "借款未归还", value: formatCurrency(dashboard.loanOutstanding), tone: "text-orange-700", icon: HandCoins },
  ];
  const monthCards = [
    { label: "本月收入", value: `+${formatCurrency(dashboard.monthlyIncome)}`, tone: "text-emerald-700" },
    { label: "本月支出", value: `-${formatCurrency(dashboard.monthlyExpense)}`, tone: "text-red-600" },
  ];

  return (
    <section className="lg:hidden">
      <div className="relative overflow-hidden bg-[#064536] px-4 pb-8 pt-5 text-white">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-200/10" />
        <div className="absolute right-4 top-4 flex w-16 items-center justify-center">
          <Image
            src={`${BASE_PATH}/brand/mgrass-logo-sidebar.png`}
            alt="蒙草 M·GRASS"
            width={86}
            height={46}
            className="h-auto w-full object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.25)]"
            priority
          />
        </div>
        <div className="relative mx-auto max-w-[300px] pt-12 text-center">
          <div className="mx-auto inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-50 ring-1 ring-white/15">
            {hasBusinessData ? "资金决策概览" : "暂无云端数据"}
          </div>
          <h1 className="mt-3 text-[27px] font-extrabold leading-tight tracking-wide">
            智能装备研究院
            <br />
            资金管理系统
          </h1>
          <div className="mt-3 text-xs font-semibold text-emerald-100">
            {updatedAt ? `数据更新：${formatDate(updatedAt)}` : cloudStatus}
          </div>
        </div>

        <div className="relative mt-5 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-100">当前资金余额</span>
            <span className="rounded-full bg-emerald-300/15 px-2 py-1 text-xs font-bold text-emerald-100">仅查看</span>
          </div>
          <div className="mt-2 break-words text-[34px] font-extrabold leading-tight tracking-tight">{formatCurrency(dashboard.totalBalance)}</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="text-emerald-100">风险预警</div>
              <div className="mt-1 text-2xl font-extrabold text-red-200">{dashboard.warningCount}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <div className="text-emerald-100">备用金未结清</div>
              <div className="mt-1 break-words text-[22px] font-extrabold leading-tight">{formatCurrency(dashboard.cashOutstanding)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="-mt-3 space-y-4 px-4 pb-8">
        {!hasBusinessData && (
          <section className="rounded-3xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
            <div className="text-base font-extrabold text-amber-800">暂无可展示数据</div>
            <div className="mt-2 text-sm font-semibold leading-6 text-amber-700">
              后台录入后点击“云端保存”，手机端刷新即可显示。
            </div>
          </section>
        )}

        <section className="relative z-10 rounded-[28px] border border-emerald-100 bg-white p-5 shadow-[0_12px_32px_rgba(6,69,54,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-emerald-50 pb-3">
            <h2 className="text-xl font-extrabold leading-none text-ink">核心资金</h2>
            <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">自动统计</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {focusCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="min-w-0 rounded-2xl bg-[#f4fbf7] p-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Icon className={`h-4 w-4 shrink-0 ${card.tone}`} />
                    <span className="truncate">{card.label}</span>
                  </div>
                  <div className={`mt-2 break-words text-[17px] font-extrabold leading-tight ${card.tone}`}>{card.value}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-extrabold text-ink">本月收支</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {monthCards.map((card) => (
              <div key={card.label} className="min-w-0 rounded-2xl border border-line p-4">
                <div className="text-xs font-bold text-slate-500">{card.label}</div>
                <div className={`mt-2 break-words text-[22px] font-extrabold leading-tight ${card.tone}`}>{card.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-red-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-ink">重点风险</h2>
            <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-extrabold text-risk">{warnings.length} 项</span>
          </div>
          <div className="space-y-3">
            {warnings.slice(0, 4).map((warning) => (
              <div key={warning.id} className="rounded-2xl bg-red-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-risk px-2 py-1 text-xs font-bold text-white">{warning.type}</span>
                  <span className="text-xs text-slate-500">{formatDate(warning.date)}</span>
                </div>
                <div className="mt-2 text-sm font-bold text-slate-800">{warning.remark}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {warning.department || "-"} / {warning.project || "-"} / {warning.person || "-"}
                </div>
              </div>
            ))}
            {warnings.length === 0 && <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">当前暂无风险预警</div>}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-ink">最近资金动态</h2>
            <span className="text-xs font-semibold text-slate-500">最近 5 条</span>
          </div>
          <div className="space-y-2">
            {recentTransactions.slice(0, 5).map((row) => {
              const signed = transactionSignedAmount(row);
              return (
                <div key={row.id} className="rounded-2xl border border-line p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-ink">{row.project || row.department}</div>
                      <div className="mt-1 text-xs text-slate-500">{formatDate(row.date)} / {row.fundSource} / {row.businessType}</div>
                    </div>
                    <div className={signed < 0 ? "shrink-0 text-right text-base font-extrabold text-red-600" : "shrink-0 text-right text-base font-extrabold text-emerald-700"}>
                      {signed < 0 ? "-" : "+"}{formatCurrency(Math.abs(signed))}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">{row.person || "未填写经办人"}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{row.status}</span>
                  </div>
                </div>
              );
            })}
            {recentTransactions.length === 0 && <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">暂无资金流水</div>}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Link className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800" href={`${withBasePath("/login")}?next=%2Fadmin`}>
            <ArrowLeft className="h-4 w-4" />
            后台管理
          </Link>
          <Link className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white" href={withBasePath("/")}>
            查看入口
          </Link>
        </div>
      </div>
    </section>
  );
}

function hasBusinessData(state: { transactions: unknown[]; budgets: unknown[]; cashAdvances: unknown[] }) {
  return state.transactions.length > 0 || state.budgets.length > 0 || state.cashAdvances.length > 0;
}

function SmallStat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className="rounded-lg bg-emerald-50 p-2">
        <Icon className="h-5 w-5 text-emerald-700" />
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-500">{label}</div>
        <div className="mt-1 text-lg font-bold text-ink">{value}</div>
      </div>
    </div>
  );
}
