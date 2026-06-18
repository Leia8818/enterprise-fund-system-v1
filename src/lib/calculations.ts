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

export const expenseTypes: BusinessType[] = [
  "备用金使用",
  "备用金核销",
  "借款支出",
  "劳务费发放",
  "材料费支出",
  "差旅费支出",
  "专家费支出",
  "设备费支出",
  "其他支出",
];

function sumTransactions(transactions: Transaction[], predicate: (row: Transaction) => boolean) {
  return transactions.filter(predicate).reduce((sum, row) => sum + row.amount, 0);
}

function matchesBudget(row: Transaction, budget: { department: string; project: string; topic: string; category: string }) {
  return (
    expenseTypes.includes(row.businessType) &&
    (!budget.department || row.department === budget.department) &&
    (!budget.project || row.project === budget.project) &&
    (!budget.topic || row.topic === budget.topic) &&
    (!budget.category || budget.category === "其他" || row.expenseCategory === budget.category)
  );
}

export function budgetRows(state: AppState): BudgetComputed[] {
  return state.budgets.map((budget) => {
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

export function cashRows(state: AppState): CashComputed[] {
  return state.cashAdvances.map((row) => ({
    ...row,
    balance: row.paidAmount - row.usedAmount - row.returnedAmount - row.writtenOffAmount,
  }));
}

export function loanRows(state: AppState): LoanSummary[] {
  const map = new Map<string, Transaction[]>();
  state.transactions
    .filter((row) => row.businessType === "借款支出" || row.businessType === "借款归还")
    .forEach((row) => {
      const key = [row.person, row.department, row.project, row.topic, row.fundSource].join("|");
      map.set(key, [...(map.get(key) ?? []), row]);
    });

  return Array.from(map.entries()).map(([key, rows]) => {
    const [person, department, project, topic, fundSource] = key.split("|");
    const borrows = rows.filter((row) => row.businessType === "借款支出");
    const returns = rows.filter((row) => row.businessType === "借款归还");
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
    .filter((row) => row.businessType === "劳务费发放")
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

  state.transactions
    .filter((row) => row.status === "待审批")
    .forEach((row) =>
      warnings.push({
        id: `warn-pending-${row.id}`,
        type: "待审批事项",
        department: row.department,
        project: row.project,
        topic: row.topic,
        person: row.person,
        amount: row.amount,
        date: row.date,
        overdueDays: 0,
        status: "未处理",
        remark: `${row.eventNo} 仍处于待审批状态。`,
      }),
    );

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
  const departmentFundBalance =
    sumTransactions(state.transactions, (row) => row.fundSource === "部门资金" && (row.businessType === "资金注入" || row.businessType === "借款归还")) -
    sumTransactions(state.transactions, (row) => row.fundSource === "部门资金" && expenseTypes.includes(row.businessType));
  const laborFundBalance =
    sumTransactions(state.transactions, (row) => row.fundSource === "课题劳务费" && row.businessType === "资金注入") -
    sumTransactions(state.transactions, (row) => row.fundSource === "课题劳务费" && row.businessType === "劳务费发放");
  const months = Array.from({ length: 12 }, (_, index) => `2026-${String(index + 1).padStart(2, "0")}`);
  const monthlyTrend = months.map((month) => ({
    month: month.slice(5),
    收入: sumTransactions(state.transactions, (row) => byMonth(row.date) === month && row.businessType === "资金注入"),
    支出: sumTransactions(state.transactions, (row) => byMonth(row.date) === month && expenseTypes.includes(row.businessType)),
    劳务费: sumTransactions(state.transactions, (row) => byMonth(row.date) === month && row.businessType === "劳务费发放"),
  }));

  return {
    totalBudget,
    usedBudget,
    remainingBudget: totalBudget - usedBudget,
    departmentFundBalance,
    laborFundBalance,
    cashOutstanding: cash.reduce((sum, row) => sum + row.balance, 0),
    loanOutstanding: loans.reduce((sum, row) => sum + row.outstanding, 0),
    pendingCount: state.transactions.filter((row) => row.status === "待审批").length,
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
    const labor = sumTransactions(state.transactions, (row) => row.topic === topic.name && row.businessType === "劳务费发放");
    const other = sumTransactions(state.transactions, (row) => row.topic === topic.name && expenseTypes.includes(row.businessType) && row.businessType !== "劳务费发放");
    const people = new Set(state.transactions.filter((row) => row.topic === topic.name && row.businessType === "劳务费发放").map((row) => row.person)).size;
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
