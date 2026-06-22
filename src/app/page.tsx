"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { BASE_PATH, withBasePath } from "@/lib/auth";

export default function PublicEntryPage() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.href = withBasePath("/leader");
    }, 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#dff7ed,transparent_34%),linear-gradient(135deg,#f7fcf9,#eef7f2)] px-4 text-ink">
      <section className="w-full max-w-xl rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-xl shadow-emerald-950/5">
        <div className="mx-auto flex h-16 w-36 items-center justify-center rounded-2xl bg-white px-4 shadow-sm ring-1 ring-emerald-100">
          <Image src={`${BASE_PATH}/brand/mgrass-logo-cropped.png`} alt="蒙草 M·GRASS" width={136} height={74} className="h-auto w-full object-contain" priority />
        </div>
        <div className="mt-6 text-sm font-bold text-emerald-700">前台查看入口</div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-wide text-[#064536]">智能装备研究院资金管理系统</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">当前页面仅用于查看，稍后将自动进入决策概览。</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link className="btn-primary h-12 justify-center" href="/leader">
            进入决策概览
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link className="btn-ghost h-12 justify-center" href="/login?next=%2Fadmin">
            <LockKeyhole className="h-5 w-5" />
            后台管理登录
          </Link>
        </div>
      </section>
    </main>
  );
}
