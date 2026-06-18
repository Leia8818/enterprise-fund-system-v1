import type { AppState } from "@/lib/types";

export const seedState: AppState = {
  dicts: {
    departments: [
      { id: "d1", code: "D001", name: "生产研发部", owner: "李经理" },
      { id: "d2", code: "D002", name: "对外合作部", owner: "王经理" },
      { id: "d3", code: "D003", name: "施工项目部", owner: "孙主管" },
      { id: "d4", code: "D004", name: "智能装备研究院", owner: "院长" },
    ],
    projects: [
      { id: "p1", code: "P001", name: "部门管理费", department: "施工项目部", owner: "孙主管", status: "进行中" },
      { id: "p2", code: "P002", name: "部门课题自筹费", department: "生产研发部", owner: "郑老师", status: "进行中" },
      { id: "p3", code: "P003", name: "播种课题", department: "生产研发部", owner: "周老师", status: "进行中" },
      { id: "p4", code: "P004", name: "无人底盘课题", department: "生产研发部", owner: "赵工", status: "进行中" },
      { id: "p5", code: "P005", name: "收获课题", department: "生产研发部", owner: "钱工", status: "进行中" },
      { id: "p6", code: "P006", name: "激光除草课题", department: "生产研发部", owner: "李经理", status: "进行中" },
      { id: "p7", code: "P007", name: "机械展会", department: "对外合作部", owner: "吴主管", status: "进行中" },
      { id: "p8", code: "P008", name: "其他", department: "施工项目部", owner: "孙主管", status: "进行中" },
    ],
    topics: [],
    people: [
      { id: "u1", name: "张三", department: "生产研发部", role: "员工" },
      { id: "u2", name: "李四", department: "生产研发部", role: "学生助研" },
      { id: "u3", name: "王五", department: "对外合作部", role: "员工" },
      { id: "u4", name: "赵六", department: "施工项目部", role: "员工" },
      { id: "u5", name: "孙李李", department: "施工项目部", role: "审批人" },
    ],
    expenseCategories: ["劳务费", "备用金", "借款", "材料费", "差旅费", "专家费", "设备费", "办公费", "会员费", "保险费", "招待费", "培训费", "财产保险费", "房租", "交通费", "物流运输", "宣传费", "外包服务费", "其他"],
  },
  budgets: [],
  cashAdvances: [],
  transactions: [],
};
