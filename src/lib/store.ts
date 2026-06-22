"use client";

import { useEffect, useState } from "react";
import { isCloudConfigured, loadCloudState, saveCloudState } from "@/lib/cloudStore";
import type { AppState, Budget, CashAdvance, DictState, Transaction } from "@/lib/types";

type CollectionKey = "transactions" | "budgets" | "cashAdvances";
type CollectionMap = {
  transactions: Transaction;
  budgets: Budget;
  cashAdvances: CashAdvance;
};

const STORAGE_KEY = "mgrass-fund-system-v1";
const STORAGE_EVENT = "mgrass-fund-system-updated";

export function useFundStore(initialState: AppState) {
  const [state, setLocalState] = useState<AppState>(initialState);
  const [loading, setLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [cloudStatus, setCloudStatus] = useState(isCloudConfigured() ? "云端待连接" : "云端未配置");
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadInitialState() {
      let nextState = initialState;
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          nextState = normalizeState(JSON.parse(saved) as Partial<AppState>, initialState);
        } catch {
          nextState = initialState;
        }
      }
      if (isCloudConfigured()) {
        try {
          setCloudStatus("正在加载云端");
          const cloud = await loadCloudState();
          if (cloud?.state) {
            nextState = normalizeState(cloud.state, initialState);
            setCloudUpdatedAt(cloud.updated_at);
          }
          setCloudStatus(cloud ? "云端已连接" : "云端暂无数据");
        } catch {
          setCloudStatus("云端读取失败");
        }
      }
      if (!cancelled) {
        setLocalState(nextState);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
        setLoading(false);
      }
    }
    void loadInitialState();
    return () => {
      cancelled = true;
    };
  }, [initialState]);

  useEffect(() => {
    if (!loading) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setLastSavedAt(new Date().toISOString());
    }
  }, [loading, state]);

  useEffect(() => {
    function loadSavedState() {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      try {
        setLocalState(normalizeState(JSON.parse(saved) as Partial<AppState>, initialState));
      } catch {
        setLocalState(initialState);
      }
    }
    async function loadCloudStateIntoLocal() {
      if (!isCloudConfigured()) return;
      try {
        const cloud = await loadCloudState();
        if (!cloud?.state) return;
        const next = normalizeState(cloud.state, initialState);
        setLocalState(next);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setCloudUpdatedAt(cloud.updated_at);
        setCloudStatus("云端已同步");
      } catch {
        setCloudStatus("云端读取失败");
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) loadSavedState();
    }

    const handleFocus = () => {
      void loadCloudStateIntoLocal();
    };
    const handleTimer = () => {
      void loadCloudStateIntoLocal();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(STORAGE_EVENT, loadSavedState);
    window.addEventListener("focus", handleFocus);
    const timer = window.setInterval(handleTimer, 30000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(STORAGE_EVENT, loadSavedState);
      window.removeEventListener("focus", handleFocus);
      window.clearInterval(timer);
    };
  }, [initialState]);

  function commit(next: AppState) {
    setLocalState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setLastSavedAt(new Date().toISOString());
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }

  function upsert<K extends CollectionKey>(key: K, row: CollectionMap[K]) {
    const normalizedRow = normalizeRow(key, row);
    const nextRows = [
      ...state[key].filter((item) => item.id !== row.id),
      normalizedRow,
    ];
    commit({ ...state, [key]: nextRows } as AppState);
  }

  function remove(key: CollectionKey, id: string) {
    commit({ ...state, [key]: state[key].filter((item) => item.id !== id) } as AppState);
  }

  function updateDicts(dicts: DictState) {
    commit({ ...state, dicts });
  }

  function reset() {
    commit({ ...initialState, transactions: [], budgets: [], cashAdvances: [] });
  }

  function importState(next: Partial<AppState>) {
    commit(normalizeState(next, initialState));
  }

  function archiveCompletedTransactions() {
    const archivedAt = new Date().toISOString();
    commit({
      ...state,
      transactions: state.transactions.map((row) =>
        row.status === "已完成" ? { ...row, archived: true, archivedAt } : row,
      ),
    });
  }

  async function saveCloudNow() {
    if (!isCloudConfigured()) {
      setCloudStatus("云端未配置");
      return false;
    }
    try {
      setCloudStatus("正在保存云端");
      const cloud = await saveCloudState(state);
      setCloudUpdatedAt(cloud?.updated_at ?? new Date().toISOString());
      setCloudStatus("云端已保存");
      return true;
    } catch {
      setCloudStatus("云端保存失败");
      return false;
    }
  }

  return {
    state,
    loading,
    lastSavedAt,
    cloudStatus,
    cloudUpdatedAt,
    saveNow: () => commit(state),
    saveCloudNow,
    upsert,
    remove,
    reset,
    updateDicts,
    setState: commit,
    importState,
    archiveCompletedTransactions,
  };
}

function normalizeRow<K extends CollectionKey>(key: K, row: CollectionMap[K]): CollectionMap[K] {
  if (key === "transactions") return normalizeTransaction(row as Transaction) as CollectionMap[K];
  if (key === "cashAdvances") return { ...(row as CashAdvance), status: normalizeStatus((row as CashAdvance).status) } as CollectionMap[K];
  return row;
}

function normalizeState(next: Partial<AppState>, fallback: AppState): AppState {
  const transactions = Array.isArray(next.transactions) ? next.transactions.map(normalizeTransaction) : [];
  const cashAdvances = Array.isArray(next.cashAdvances) ? next.cashAdvances.map((row) => ({ ...row, status: normalizeStatus(row.status) })) : [];
  return {
    transactions,
    budgets: Array.isArray(next.budgets) ? next.budgets : [],
    cashAdvances,
    dicts: {
      departments: next.dicts?.departments?.length ? next.dicts.departments : fallback.dicts.departments,
      projects: next.dicts?.projects?.length ? next.dicts.projects : fallback.dicts.projects,
      topics: Array.isArray(next.dicts?.topics) ? next.dicts.topics : fallback.dicts.topics,
      people: next.dicts?.people?.length ? next.dicts.people : fallback.dicts.people,
      expenseCategories: next.dicts?.expenseCategories?.length ? next.dicts.expenseCategories : fallback.dicts.expenseCategories,
    },
  };
}

function normalizeTransaction(row: Transaction): Transaction {
  return {
    ...row,
    topic: "",
    fundSource: normalizeFundSource(row.fundSource, row.businessType),
    businessType: normalizeBusinessType(row.businessType),
    status: normalizeStatus(row.status),
    amount: Math.abs(Number(row.amount) || 0),
    archived: Boolean(row.archived),
  };
}

function normalizeFundSource(fundSource: string, businessType: string) {
  if (fundSource === "课题劳务费" || fundSource === "备用金" || fundSource === "借款" || fundSource === "其他") return fundSource as Transaction["fundSource"];
  if (businessType.includes("借款")) return "借款";
  if (fundSource.includes("劳务费")) return "课题劳务费";
  if (fundSource.includes("备用金")) return "备用金";
  return "其他";
}

function normalizeBusinessType(businessType: string) {
  if (businessType === "收入" || businessType === "支出" || businessType === "归还") return businessType as Transaction["businessType"];
  if (businessType.includes("归还")) return "归还";
  if (businessType.includes("注入") || businessType.includes("拨付") || businessType.includes("申领")) return "收入";
  return "支出";
}

function normalizeStatus(status: string) {
  if (status === "已支付" || status === "已完成" || status === "已归还") return status as Transaction["status"];
  if (status.includes("归还")) return "已归还";
  if (status.includes("完成") || status.includes("核销")) return "已完成";
  return "已支付";
}
