import type { AppState } from "@/lib/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SUPABASE_TABLE = process.env.NEXT_PUBLIC_SUPABASE_TABLE ?? "fund_app_state";
const CLOUD_RECORD_ID = "default";

type CloudRow = {
  id: string;
  state: AppState;
  updated_at: string;
};

export function isCloudConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function loadCloudState() {
  if (!isCloudConfigured()) return null;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${CLOUD_RECORD_ID}&select=id,state,updated_at`, {
    headers: cloudHeaders(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`云端读取失败：${response.status}`);
  const rows = (await response.json()) as CloudRow[];
  return rows[0] ?? null;
}

export async function saveCloudState(state: AppState) {
  if (!isCloudConfigured()) return null;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?on_conflict=id`, {
    method: "POST",
    headers: {
      ...cloudHeaders(),
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      id: CLOUD_RECORD_ID,
      state,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) throw new Error(`云端保存失败：${response.status}`);
  const rows = (await response.json()) as CloudRow[];
  return rows[0] ?? null;
}

function cloudHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };
}
