import type {
  AppState,
  BudgetComputed,
  BusinessType,
  CashComputed,
  LaborPayment,
  LoanSummary,
  Transaction,
  Warning,
} from "@/lib/types";
import { byMonth, daysBetween, today } from "@/lib/utils";

export const expenseTypes: BusinessType[] = ["支出"];

export const departmentBudgetCategories = [
  { category: "招待费", amount: 30000 },
  { category: "培训费", amount: 5000 },
  { category: "财产保险费", amount: 800 },
] as const;

export const selfFundBudgetCategories = [
  { category: "会员费", amount: 2000 },
  { category: "保险费", amount: 5000 },
  { category: "办公费", amount: 8000 },
  { category: "房租", amount: 22000 },
  { category: "交通费", amount: 72000 },
  { category: "物流运输", amount: 400000 },
] as const;

const budgetKeywordCategories = [
  ...departmentBudgetCategories.map((item) => item.category),
  ...selfFundBudgetCategories.map((item) => item.category),
].sort((a, b) => b.length - a.length);

export function transactionSignedAmount(row: Transaction) {
  return row.businessType === "支出" ? -Math.abs(row.amount) : Math.abs(row.amount);
}

function sumTransactions(transactions: Transaction[], predicate: (row: Transaction) => boolean) {
  return transactions.filter(predicate).reduce((sum, row) => sum + row.amount, 0);
}

function sumSignedTransactions(transactions: Transaction[], predicate: (row: Transaction) => boolean) {
  return transactions.filter(predicate).reduce((sum, row) => sum + transactionSignedAmount(row), 0);
}

function matchesBudget(row: Transaction, budget: { id?: string; department: string; project: string; topic: string; category: string }) {
  const expectedFundSource = budgetFundSource(budget);
  const matchesExpectedFund = !expectedFundSource || row.fundSource === expectedFundSource;
  const matchesLegacyBudgetRow = row.fundSource === "其他" && Boolean(budget.project) && row.project === budget.project;
  return (
    expenseTypes.includes(row.businessType) &&
    (matchesExpectedFund || matchesLegacyBudgetRow) &&
    (!budget.department || row.department === budget.department) &&
    (!budget.project || row.project === budget.project) &&
    (!budget.topic || row.topic === budget.topic) &&
    (!budget.category || budget.category === "其他" || inferBudgetCategory(row) === budget.category)
  );
}

export function budgetRows(state: AppState): BudgetComputed[] {
  return mergeDefaultBudgets(state).map((budget) => {
    const used = sumTransactions(state.transactions, (row) => matchesBudget(row, budget));
    const remaining = budget.amount - used;
    return {
      ...budget,
      used,
      remaining,
      executionRate: budget.amount ? (used / budget.amount) * 100 : 0,
    };
  });
}

function mergeDefaultBudgets(state: AppState) {
  const year = new Date().getFullYear();
  const defaults = [
    ...departmentBudgetCategories.map((item, index) => ({
      id: `auto-department-budget-${index + 1}`,
      year,
      type: "部门预算" as const,
      department: "智能装备研究院",
      project: "部门管理费",
      topic: "",
      category: item.category,
      amount: item.amount,
      owner: "",
      remark: "系统默认部门预算",
    })),
    ...selfFundBudgetCategories.map((item, index) => ({
      id: `auto-self-fund-budget-${index + 1}`,
      year,
      type: "项目预算" as const,
      department: "智能装备研究院",
      project: "部门课题自筹费",
      topic: "",
      category: item.category,
      amount: item.amount,
      owner: "",
      remark: "系统默认部门课题自筹预算",
    })),
  ];
  const hasManualBudget = (defaultBudget: (typeof defaults)[number]) =>
    state.budgets.some((budget) =>
      budget.year === defaultBudget.year &&
      budget.department === defaultBudget.department &&
      budget.project === defaultBudget.project &&
      budget.category === defaultBudget.category
    );
  return [...defaults.filter((budget) => !hasManualBudget(budget)), ...state.budgets];
}

function budgetFundSource(budget: { id?: string; project: string; category: string }) {
  if (budget.id?.startsWith("auto-department-budget-") || budget.project === "部门管理费") return "部门预算";
  if (budget.id?.startsWith("auto-self-fund-budget-") || budget.project === "部门课题自筹费") return "部门课题自筹预算";
  return "";
}

function inferBudgetCategory(row: Transaction) {
  if (row.expenseCategory && row.expenseCategory !== "其他") return row.expenseCategory;
  const text = `${row.project} ${row.remark}`.replace(/\s+/g, "");
  return budgetKeywordCategories.find((category) => text.includes(category)) ?? row.expenseCategory;
}

export function cashRows(state: AppState): CashComputed[] {
  const manualRows = state.cashAdvances.map((row) => ({
    ...row,
    balance: row.paidAmount - row.usedAmount - row.returnedAmount - row.writtenOffAmount,
  }));

  const grouped = new Map<string, Transaction[]>();
  state.transactions
    .filter((row) => row.fundSource === "备用金")
    .forEach((row) => {
      const key = [row.department, row.project, row.person || "未填写经办人"].join("|");
      grouped.set(key, [...(grouped.get(key) ?? []), row]);
    });

  const transactionRows: CashComputed[] = Array.from(grouped.entries()).map(([key, rows]) => {
    const [department, project, applicant] = key.split("|");
    const sortedRows = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    const latest = [...rows].sort((a, b) => b.date.localeCompare(a.date))[0];
    const paidAmount = rows.filter((row) => row.businessType === "收入").reduce((sum, row) => sum + row.amount, 0);
    const usedAmount = rows.filter((row) => row.businessType === "支出").reduce((sum, row) => sum + row.amount, 0);
    const returnedAmount = rows.filter((row) => row.businessType === "归还").reduce((sum, row) => sum + row.amount, 0);
    const balance = paidAmount - usedAmount - returnedAmount;
    return {
      id: `cash-flow-${key}`,
      requestNo: "资金流水汇总",
      requestDate: sortedRows[0]?.date ?? "",
      department,
      project,
      applicant,
      purpose: "由资金流水自动汇总",
      requestAmount: paidAmount,
      approver: latest?.approver ?? "",
      status: balance > 0 ? "已支付" : "已完成",
      paidAmount,
      usedAmount,
      returnedAmount,
      writtenOffAmount: 0,
      remark: latest?.remark ?? "资金流水自动同步",
      balance,
    };
  });

  return [...manualRows, ...transactionRows];
}

export function loanRows(state: AppState): LoanSummary[] {
  const map = new Map<string, Transaction[]>();
  state.transactions
    .filter((row) => row.fundSource === "借款")
    .forEach((row) => {
      const key = [row.person, row.department, row.project, row.topic, row.fundSource].join("|");
      map.set(key, [...(map.get(key) ?? []), row]);
    });

  return Array.from(map.entries()).map(([key, rows]) => {
    const [person, department, project, topic, fundSource] = key.split("|");
    const borrows = rows.filter((row) => row.businessType === "支出");
    const returns = rows.filter((row) => row.businessType === "归还");
    const borrowAmount = borrows.reduce((sum, row) => sum + row.amount, 0);
    const returnedAmount = returns.reduce((sum, row) => sum + row.amount, 0);
    const latestBorrow = borrows.sort((a, b) => b.date.localeCompare(a.date))[0];
    const expectedReturnDate = latestBorrow?.expectedReturnDate ?? "";
    const outstanding = borrowAmount - returnedAmount;
    const overdue = outstanding > 0 && Boolean(expectedReturnDate) && today() > expectedReturnDate;
    return {
      id: key,
      person,
      department,
      project,
      topic,
      fundSource,
      borrowAmount,
      returnedAmount,
      outstanding,
      borrowDate: latestBorrow?.date ?? "",
      expectedReturnDate,
      overdue,
      overdueDays: overdue ? daysBetween(expectedReturnDate) : 0,
      remark: latestBorrow?.remark ?? "",
    };
  });
}

export function laborRows(state: AppState): LaborPayment[] {
  return state.transactions
    .filter((row) => row.fundSource === "课题劳务费" && row.businessType === "支出")
    .map((row) => ({
      id: row.id,
      date: row.date,
      department: row.department,
      project: row.project,
      topic: row.topic,
      payee: row.person,
      workContent: row.remark,
      amount: row.amount,
      approver: row.approver,
      status: row.status,
      voucherNo: row.voucherNo,
      remark: row.remark,
    }));
}

export function warningRows(state: AppState, budgets: BudgetComputed[], cash: CashComputed[], loans: LoanSummary[]): Warning[] {
  const warnings: Warning[] = [];
  budgets.forEach((budget) => {
    if (budget.executionRate > 100) {
      warnings.push({
        id: `warn-budget-over-${budget.id}`,
        type: "预算超支",
        department: budget.department,
        project: budget.project,
        topic: budget.topic,
        person: budget.owner,
        amount: budget.remaining,
        date: today(),
        overdueDays: 0,
        status: "未处理",
        remark: `${budget.type}执行率 ${budget.executionRate.toFixed(1)}%，已超预算。`,
      });
    } else if (budget.executionRate > 90) {
      warnings.push({
        id: `warn-budget-near-${budget.id}`,
        type: "预算接近用完",
        department: budget.department,
        project: budget.project,
        topic: budget.topic,
        person: budget.owner,
        amount: budget.remaining,
        date: today(),
        overdueDays: 0,
        status: "未处理",
        remark: `${budget.type}执行率超过 90%，建议复核后续支出。`,
      });
    }
  });

  loans.forEach((loan) => {
    if (loan.overdue) {
      warnings.push({
        id: `warn-loan-overdue-${loan.id}`,
        type: "借款逾期",
        department: loan.department,
        project: loan.project,
        topic: loan.topic,
        person: loan.person,
        amount: loan.outstanding,
        date: loan.expectedReturnDate,
        overdueDays: loan.overdueDays,
        status: "未处理",
        remark: `${loan.person} 借款已逾期 ${loan.overdueDays} 天。`,
      });
    }
    if (loan.outstanding > 5000) {
      warnings.push({
        id: `warn-loan-high-${loan.id}`,
        type: "高额借款",
        department: loan.department,
        project: loan.project,
        topic: loan.topic,
        person: loan.person,
        amount: loan.outstanding,
        date: loan.borrowDate,
        overdueDays: loan.overdueDays,
        status: "未处理",
        remark: `${loan.person} 未归还借款超过 5000 元。`,
      });
    }
  });

  cash.forEach((row) => {
    if (row.balance > 0 && daysBetween(row.requestDate) > 30) {
      warnings.push({
        id: `warn-cash-long-${row.id}`,
        type: "备用金长期未结清",
        department: row.department,
        project: row.project,
        topic: "",
        person: row.applicant,
        amount: row.balance,
        date: row.requestDate,
        overdueDays: daysBetween(row.requestDate),
        status: "未处理",
        remark: `${row.requestNo} 拨付超过 30 天仍未结清。`,
      });
    }
    if (row.balance > 5000) {
      warnings.push({
        id: `warn-cash-high-${row.id}`,
        type: "高额备用金未结清",
        department: row.department,
        project: row.project,
        topic: "",
        person: row.applicant,
        amount: row.balance,
        date: row.requestDate,
        overdueDays: daysBetween(row.requestDate),
        status: "未处理",
        remark: `${row.requestNo} 当前余额超过 5000 元。`,
      });
    }
  });

  return warnings.sort((a, b) => b.date.localeCompare(a.date));
}

export function computeDashboard(
  state: AppState,
  budgets: BudgetComputed[],
  cash: CashComputed[],
  loans: LoanSummary[],
  warnings: Warning[],
) {
  const totalBudget = budgets.reduce((sum, row) => sum + row.amount, 0);
  const usedBudget = budgets.reduce((sum, row) => sum + row.used, 0);
  const totalBalance = sumSignedTransactions(state.transactions, () => true);
  const departmentFundBalance = sumSignedTransactions(state.transactions, (row) => row.fundSource === "其他" || row.fundSource === "部门预算");
  const laborFundBalance = sumSignedTransactions(state.transactions, (row) => row.fundSource === "课题劳务费");
  const reserveBalance = sumSignedTransactions(state.transactions, (row) => row.fundSource === "备用金");
  const months = Array.from({ length: 12 }, (_, index) => `2026-${String(index + 1).padStart(2, "0")}`);
  const monthlyTrend = months.map((month) => ({
    month: month.slice(5),
    收入: sumTransactions(state.transactions, (row) => byMonth(row.date) === month && (row.businessType === "收入" || row.businessType === "归还")),
    支出: sumTransactions(state.transactions, (row) => byMonth(row.date) === month && row.businessType === "支出"),
  }));

  return {
    totalBudget,
    usedBudget,
    remainingBudget: totalBudget - usedBudget,
    totalBalance,
    departmentFundBalance,
    laborFundBalance,
    reserveBalance,
    cashOutstanding: cash.reduce((sum, row) => sum + row.balance, 0),
    loanOutstanding: loans.reduce((sum, row) => sum + row.outstanding, 0),
    monthlyIncome: sumTransactions(state.transactions, (row) => row.date.slice(0, 7) === today().slice(0, 7) && (row.businessType === "收入" || row.businessType === "归还")),
    monthlyExpense: sumTransactions(state.transactions, (row) => row.date.slice(0, 7) === today().slice(0, 7) && row.businessType === "支出"),
    pendingCount: 0,
    warningCount: warnings.length,
    monthlyTrend,
    recentTransactions: [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
  };
}

export function departmentRows(state: AppState, budgets: BudgetComputed[], cash: CashComputed[], loans: LoanSummary[], warnings: Warning[]) {
  return state.dicts.departments.map((department) => {
    const departmentBudget = budgets.filter((row) => row.department === department.name);
    const budget = departmentBudget.reduce((sum, row) => sum + row.amount, 0);
    const used = departmentBudget.reduce((sum, row) => sum + row.used, 0);
    return {
      id: department.id,
      department: department.name,
      budget,
      used,
      remaining: budget - used,
      executionRate: budget ? (used / budget) * 100 : 0,
      cashOutstanding: cash.filter((row) => row.department === department.name).reduce((sum, row) => sum + row.balance, 0),
      loanOutstanding: loans.filter((row) => row.department === department.name).reduce((sum, row) => sum + row.outstanding, 0),
      warningCount: warnings.filter((row) => row.department === department.name).length,
    };
  });
}

export function projectRows(state: AppState, budgets: BudgetComputed[], cash: CashComputed[], loans: LoanSummary[]) {
  return state.dicts.projects.map((project) => {
    const projectBudget = budgets.filter((row) => row.project === project.name);
    const budget = projectBudget.reduce((sum, row) => sum + row.amount, 0);
    const spent = projectBudget.reduce((sum, row) => sum + row.used, 0);
    return {
      id: project.id,
      project: project.name,
      department: project.department,
      budget,
      spent,
      remaining: budget - spent,
      executionRate: budget ? (spent / budget) * 100 : 0,
      cashOutstanding: cash.filter((row) => row.project === project.name).reduce((sum, row) => sum + row.balance, 0),
      loanOutstanding: loans.filter((row) => row.project === project.name).reduce((sum, row) => sum + row.outstanding, 0),
      status: project.status,
    };
  });
}

export function topicRows(state: AppState, budgets: BudgetComputed[]) {
  return state.dicts.topics.map((topic) => {
    const topicBudget = budgets.filter((row) => row.topic === topic.name);
    const budget = topicBudget.reduce((sum, row) => sum + row.amount, 0);
    const labor = sumTransactions(state.transactions, (row) => row.topic === topic.name && row.fundSource === "课题劳务费" && row.businessType === "支出");
    const other = sumTransactions(state.transactions, (row) => row.topic === topic.name && row.businessType === "支出" && row.fundSource !== "课题劳务费");
    const people = new Set(state.transactions.filter((row) => row.topic === topic.name && row.fundSource === "课题劳务费" && row.businessType === "支出").map((row) => row.person)).size;
    return {
      id: topic.id,
      topic: topic.name,
      project: topic.project,
      budget,
      labor,
      other,
      remaining: budget - labor - other,
      executionRate: budget ? ((labor + other) / budget) * 100 : 0,
      people,
    };
  });
}
