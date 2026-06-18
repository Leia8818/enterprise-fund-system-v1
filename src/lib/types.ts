export type FundSource = "部门资金" | "课题劳务费" | "备用金" | "其他资金";

export type BusinessType =
  | "资金注入"
  | "备用金申领"
  | "备用金拨付"
  | "备用金使用"
  | "备用金归还"
  | "备用金核销"
  | "借款支出"
  | "借款归还"
  | "劳务费发放"
  | "材料费支出"
  | "差旅费支出"
  | "专家费支出"
  | "设备费支出"
  | "其他支出";

export type ExpenseCategory =
  | "劳务费"
  | "备用金"
  | "借款"
  | "材料费"
  | "差旅费"
  | "专家费"
  | "设备费"
  | "办公费"
  | "会员费"
  | "保险费"
  | "招待费"
  | "培训费"
  | "财产保险费"
  | "房租"
  | "交通费"
  | "物流运输"
  | "宣传费"
  | "外包服务费"
  | "其他";

export type Status =
  | "草稿"
  | "待审批"
  | "已审批"
  | "已拨付"
  | "已支付"
  | "使用中"
  | "已核销"
  | "已归还"
  | "已完成"
  | "已驳回";

export type BudgetType = "部门预算" | "项目预算" | "课题预算";
export type ProjectStatus = "未开始" | "进行中" | "已完成" | "暂停" | "取消";

export type Transaction = {
  id: string;
  date: string;
  eventNo: string;
  department: string;
  project: string;
  topic: string;
  fundSource: FundSource;
  businessType: BusinessType;
  expenseCategory: ExpenseCategory;
  person: string;
  amount: number;
  approver: string;
  status: Status;
  expectedReturnDate: string;
  voucherNo: string;
  attachmentUrl: string;
  remark: string;
};

export type Budget = {
  id: string;
  year: number;
  type: BudgetType;
  department: string;
  project: string;
  topic: string;
  category: ExpenseCategory;
  amount: number;
  owner: string;
  remark: string;
};

export type CashAdvance = {
  id: string;
  requestNo: string;
  requestDate: string;
  department: string;
  project: string;
  applicant: string;
  purpose: string;
  requestAmount: number;
  approver: string;
  status: Status;
  paidAmount: number;
  usedAmount: number;
  returnedAmount: number;
  writtenOffAmount: number;
  remark: string;
};

export type Department = {
  id: string;
  code: string;
  name: string;
  owner: string;
};

export type Project = {
  id: string;
  code: string;
  name: string;
  department: string;
  owner: string;
  status: ProjectStatus;
};

export type Topic = {
  id: string;
  code: string;
  name: string;
  project: string;
  owner: string;
};

export type Person = {
  id: string;
  name: string;
  department: string;
  role: string;
};

export type DictState = {
  departments: Department[];
  projects: Project[];
  topics: Topic[];
  people: Person[];
  expenseCategories: ExpenseCategory[];
};

export type AppState = {
  transactions: Transaction[];
  budgets: Budget[];
  cashAdvances: CashAdvance[];
  dicts: DictState;
};

export type BudgetComputed = Budget & {
  used: number;
  remaining: number;
  executionRate: number;
};

export type CashComputed = CashAdvance & {
  balance: number;
};

export type LoanSummary = {
  id: string;
  person: string;
  department: string;
  project: string;
  topic: string;
  fundSource: string;
  borrowAmount: number;
  returnedAmount: number;
  outstanding: number;
  borrowDate: string;
  expectedReturnDate: string;
  overdue: boolean;
  overdueDays: number;
  remark: string;
};

export type LaborPayment = {
  id: string;
  date: string;
  department: string;
  project: string;
  topic: string;
  payee: string;
  workContent: string;
  amount: number;
  approver: string;
  status: string;
  voucherNo: string;
  remark: string;
};

export type Warning = {
  id: string;
  type: string;
  department: string;
  project: string;
  topic: string;
  person: string;
  amount: number;
  date: string;
  overdueDays: number;
  status: "未处理" | "处理中" | "已处理";
  remark: string;
};
