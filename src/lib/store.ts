"use client";

import { useEffect, useState } from "react";
import type { AppState, Budget, CashAdvance, Transaction } from "@/lib/types";

const STORAGE_KEY = "enterprise-fund-system-v1";
const TRANSACTIONS_CLEARED_KEY = "enterprise-fund-system-v1-transactions-cleared";
const BUSINESS_DATA_CLEARED_KEY = "enterprise-fund-system-v1-business-data-cleared";

type CollectionKey = "transactions" | "budgets" | "cashAdvances";
type CollectionMap = {
  transactions: Transaction;
  budgets: Budget;
  cashAdvances: CashAdvance;
};

export function useFundStore(initialState: AppState) {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const merged = mergeWithInitial(JSON.parse(raw) as AppState, initialState);
        if (!window.localStorage.getItem(BUSINESS_DATA_CLEARED_KEY)) {
          window.localStorage.setItem(BUSINESS_DATA_CLEARED_KEY, "true");
          window.localStorage.setItem(TRANSACTIONS_CLEARED_KEY, "true");
          setState({ ...merged, transactions: [], budgets: [], cashAdvances: [] });
          return;
        }
        if (!window.localStorage.getItem(TRANSACTIONS_CLEARED_KEY)) {
          window.localStorage.setItem(TRANSACTIONS_CLEARED_KEY, "true");
          setState({ ...merged, transactions: [] });
          return;
        }
        setState(merged);
      } catch {
        setState(initialState);
      }
    }
  }, [initialState]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  function upsert<K extends CollectionKey>(key: K, row: CollectionMap[K]) {
    setState((current) => {
      const collection = current[key] as unknown as CollectionMap[K][];
      const exists = collection.some((item) => item.id === row.id);
      return {
        ...current,
        [key]: exists ? collection.map((item) => (item.id === row.id ? row : item)) : [row, ...collection],
      };
    });
  }

  function remove(key: CollectionKey, id: string) {
    setState((current) => ({
      ...current,
      [key]: (current[key] as Array<{ id: string }>).filter((item) => item.id !== id),
    }));
  }

  function reset() {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }

  return { state, setState, upsert, remove, reset };
}

function mergeById<T extends { id: string }>(current: T[], seed: T[]) {
  const ids = new Set(current.map((item) => item.id));
  return [...current, ...seed.filter((item) => !ids.has(item.id))];
}

function normalizeDepartmentName(name: string) {
  const departmentMap: Record<string, string> = {
    综合管理部: "施工项目部",
    研发一部: "生产研发部",
    研发二部: "生产研发部",
    市场运营部: "对外合作部",
  };
  return departmentMap[name] ?? name;
}

function normalizeDepartmentField<T extends { department?: string }>(row: T): T {
  return row.department ? { ...row, department: normalizeDepartmentName(row.department) } : row;
}

function normalizeProjectName(name: string) {
  const projectMap: Record<string, string> = {
    数字化平台建设: "部门课题自筹费",
    AI智能平台: "播种课题",
    品牌宣传项目: "机械展会",
    部门日常运营: "部门管理费",
  };
  return projectMap[name] ?? name;
}

function normalizeProjectField<T extends { project?: string }>(row: T): T {
  return row.project ? { ...row, project: normalizeProjectName(row.project) } : row;
}

function normalizeTopicField<T extends { topic?: string }>(row: T): T {
  return typeof row.topic === "string" ? { ...row, topic: "" } : row;
}

function normalizeRow<T extends { department?: string; project?: string; topic?: string }>(row: T): T {
  return normalizeTopicField(normalizeProjectField(normalizeDepartmentField(row)));
}

function mergeWithInitial(current: AppState, initial: AppState): AppState {
  return {
    ...current,
    transactions: mergeById(current.transactions ?? [], initial.transactions).map(normalizeRow),
    budgets: mergeById(current.budgets ?? [], initial.budgets).map(normalizeRow),
    cashAdvances: mergeById(current.cashAdvances ?? [], initial.cashAdvances).map(normalizeRow),
    dicts: {
      departments: initial.dicts.departments,
      projects: initial.dicts.projects,
      topics: initial.dicts.topics,
      people: mergeById(current.dicts?.people ?? [], initial.dicts.people).map(normalizeDepartmentField),
      expenseCategories: Array.from(new Set([...(current.dicts?.expenseCategories ?? []), ...initial.dicts.expenseCategories])),
    },
  };
}
