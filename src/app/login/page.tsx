"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, KeyRound, QrCode } from "lucide-react";
import { BASE_PATH, login, withBasePath } from "@/lib/auth";
import { qrcodegen } from "@/lib/qrcodegen";

function QrSvg({ value }: { value: string }) {
  const qr = useMemo(() => qrcodegen.QrCode.encodeText(value, qrcodegen.QrCode.Ecc.MEDIUM), [value]);
  const border = 3;
  const size = qr.size + border * 2;
  const cells: string[] = [];
  for (let y = 0; y < qr.size; y += 1) {
    for (let x = 0; x < qr.size; x += 1) {
      if (qr.getModule(x, y)) {
        cells.push(`M${x + border},${y + border}h1v1h-1z`);
      }
    }
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full rounded-lg bg-white" role="img" aria-label="登录二维码">
      <path d={cells.join("")} fill="#073f32" />
    </svg>
  );
}

export default function LoginPage() {
  const [userName, setUserName] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [message, setMessage] = useState("");
  const [entryUrl, setEntryUrl] = useState("");
  const [nextPath, setNextPath] = useState("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/";
    setNextPath(next);
    setEntryUrl(`${window.location.origin}${withBasePath("/login")}?next=${encodeURIComponent(next)}`);
  }, []);

  function submit() {
    const session = login(userName, password);
    if (!session) {
      setMessage("账号或密码不正确");
      return;
    }
    window.location.href = session.role === "领导查看" ? withBasePath("/leader") : withBasePath(nextPath);
  }

  const isLocalhost = entryUrl.includes("127.0.0.1") || entryUrl.includes("localhost");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff7ed,transparent_34%),linear-gradient(135deg,#f7fcf9,#eef7f2)] px-4 py-8 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center gap-7">
        <section className="text-center">
          <div className="mx-auto flex h-16 w-36 items-center justify-center rounded-2xl bg-white px-4 shadow-sm ring-1 ring-emerald-100">
            <Image src={`${BASE_PATH}/brand/mgrass-logo-cropped.png`} alt="蒙草 M·GRASS" width={136} height={74} className="h-auto w-full object-contain" priority />
          </div>
          <div className="mt-5 text-sm font-bold text-emerald-700">统一访问入口</div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-wide text-[#064536] sm:text-4xl">智能装备研究院资金管理系统</h1>
          <p className="mt-3 text-sm font-semibold text-slate-500">电脑端网页登录，手机端扫码进入。</p>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-money">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">网页登录</h2>
                <p className="mt-1 text-sm text-slate-500">电脑浏览器打开后在这里登录</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <label className="block space-y-2 text-sm font-semibold text-slate-600">
                <span>账号</span>
                <input className="field h-12 w-full text-base" value={userName} onChange={(event) => setUserName(event.target.value)} />
              </label>
              <label className="block space-y-2 text-sm font-semibold text-slate-600">
                <span>密码</span>
                <input className="field h-12 w-full text-base" type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} />
              </label>
              {message && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-risk">{message}</div>}
              <button className="btn-primary h-12 w-full justify-center text-base" onClick={submit}>
                登录
                <ArrowRight className="h-5 w-5" />
              </button>
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold leading-5 text-emerald-800">
                管理端：admin / 123456　领导查看：leader / 123456
              </div>
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-money">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">手机扫码</h2>
                <p className="mt-1 text-sm text-slate-500">扫码后进入同一个登录页面</p>
              </div>
            </div>

            <div className="mx-auto mt-8 h-64 w-64 rounded-3xl bg-white p-5 shadow-inner ring-1 ring-line">
              {entryUrl && <QrSvg value={entryUrl} />}
            </div>

            <div className="mt-5 truncate rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">{entryUrl}</div>
            {isLocalhost && (
              <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-700">
                当前是本机地址，手机无法直接访问。云端部署后填云端域名；局域网演示时填电脑 IP 地址。
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
