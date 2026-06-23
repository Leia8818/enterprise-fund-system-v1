export type LoginRole = "管理端" | "查看端";

export type LoginSession = {
  userName: string;
  role: LoginRole;
  loginAt: string;
};

export const AUTH_SESSION_KEY = "mgrass-fund-login-session-v1";
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_PUBLIC_ORIGIN ?? "https://leia8818.github.io";

const accounts = [
  { userName: "admin", password: "123456", role: "管理端" as const },
  { userName: "leader", password: "123456", role: "查看端" as const },
];

export function login(userName: string, password: string) {
  const account = accounts.find((item) => item.userName === userName.trim() && item.password === password);
  if (!account) return null;
  const session: LoginSession = {
    userName: account.userName,
    role: account.role,
    loginAt: new Date().toISOString(),
  };
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!saved) return null;
  try {
    const session = JSON.parse(saved) as LoginSession;
    if (session.role !== "管理端") return { ...session, role: "查看端" as const };
    return session;
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function logout() {
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  window.location.href = withBasePath("/login");
}

export function requireLogin(nextPath: string) {
  const session = getSession();
  if (!session) {
    window.location.href = `${withBasePath("/login")}?next=${encodeURIComponent(nextPath)}`;
    return null;
  }
  return session;
}

export function requireAdmin(nextPath: string) {
  const session = requireLogin(nextPath);
  if (!session) return null;
  if (session.role !== "管理端") {
    window.location.href = withBasePath("/leader");
    return null;
  }
  return session;
}

export function withBasePath(path: string) {
  if (!BASE_PATH) return path;
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

export function publicUrl(path: string) {
  return `${PUBLIC_ORIGIN}${withBasePath(path)}`;
}
