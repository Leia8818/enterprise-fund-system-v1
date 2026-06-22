"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, KeyRound, Monitor, QrCode, Smartphone } from "lucide-react";
import { login, withBasePath } from "@/lib/auth";
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff7ed,transparent_32%),linear-gradient(135deg,#f6fbf8,#eef7f2)] px-5 py-8 text-ink">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl bg-[#064536] p-8 text-white shadow-2xl shadow-emerald-950/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-32 items-center rounded-xl bg-white px-4 shadow-lg">
              <Image src="/brand/mgrass-logo-cropped.png" alt="蒙草 M·GRASS" width={130} height={72} className="h-auto w-full object-contain" priority />
            </div>
            <div>
              <div className="text-sm font-semibold text-emerald-100">统一访问入口</div>
              <h1 className="mt-1 text-2xl font-extrabold tracking-wide">智能装备研究院资金管理系统</h1>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/10 p-5">
              <Monitor className="h-7 w-7 text-emerald-200" />
              <div className="mt-4 text-lg font-bold">电脑端登录</div>
              <p className="mt-2 text-sm leading-6 text-emerald-50">在浏览器输入系统网址，进入本页后登录管理工作台。</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-5">
              <Smartphone className="h-7 w-7 text-emerald-200" />
              <div className="mt-4 text-lg font-bold">手机端扫码</div>
              <p className="mt-2 text-sm leading-6 text-emerald-50">手机扫描右侧二维码，打开同一登录入口。</p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-50">
            默认账号：管理端 `admin / 123456`，领导查看 `leader / 123456`。正式部署时建议改成真实账号体系。
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-money">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">登录系统</h2>
                <p className="mt-1 text-sm text-slate-500">同一入口支持电脑和手机访问</p>
              </div>
            </div>

            <div className="mt-7 space-y-4">
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
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-money">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">扫码入口</h2>
                <p className="mt-1 text-sm text-slate-500">二维码指向登录页</p>
              </div>
            </div>

            <div className="mx-auto mt-6 h-56 w-56 rounded-2xl bg-white p-4 shadow-inner ring-1 ring-line">
              {entryUrl && <QrSvg value={entryUrl} />}
            </div>

            <label className="mt-5 block space-y-2 text-sm font-semibold text-slate-600">
              <span>二维码地址</span>
              <input className="field w-full" value={entryUrl} onChange={(event) => setEntryUrl(event.target.value)} />
            </label>
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
