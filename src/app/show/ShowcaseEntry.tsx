"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, QrCode } from "lucide-react";
import { BASE_PATH, withBasePath } from "@/lib/auth";
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
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full rounded-2xl bg-white" role="img" aria-label="扫码进入决策概览">
      <path d={cells.join("")} fill="#064536" />
    </svg>
  );
}

export default function ShowcaseEntry() {
  const [entryUrl, setEntryUrl] = useState("");

  useEffect(() => {
    setEntryUrl(`${window.location.origin}${withBasePath("/leader")}`);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dff7ed,transparent_32%),linear-gradient(135deg,#f7fcf9,#eaf6ef)] px-5 py-8 text-ink">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1fr_0.82fr]">
          <div className="rounded-[32px] bg-[#064536] p-8 text-white shadow-2xl shadow-emerald-950/20 sm:p-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-20 w-44 items-center justify-center rounded-2xl bg-white px-5 shadow-lg">
                <Image src={`${BASE_PATH}/brand/mgrass-logo-cropped.png`} alt="蒙草 M·GRASS" width={168} height={88} className="h-auto w-full object-contain" priority />
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-100">展示扫码入口</div>
                <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-wide sm:text-5xl">
                  智能装备研究院
                  <br />
                  资金管理系统
                </h1>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {["扫码查看", "无需登录", "手机适配"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-center text-lg font-extrabold">
                  {item}
                </div>
              ))}
            </div>

            <p className="mt-10 max-w-2xl text-xl font-semibold leading-9 text-emerald-50">
              请使用手机扫描右侧二维码，直接进入资金决策概览页面。该入口仅用于查看，不提供新增、编辑、删除操作。
            </p>
          </div>

          <div className="rounded-[32px] border border-emerald-100 bg-white p-6 text-center shadow-xl shadow-emerald-950/5 sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <QrCode className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-[#064536]">扫码进入</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">手机端决策概览</p>

            <div className="mx-auto mt-7 h-72 w-72 rounded-[28px] bg-white p-5 shadow-inner ring-1 ring-line sm:h-80 sm:w-80">
              {entryUrl && <QrSvg value={entryUrl} />}
            </div>

            <div className="mx-auto mt-5 max-w-sm truncate rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">{entryUrl}</div>

            <Link className="btn-primary mx-auto mt-6 h-12 w-full max-w-sm justify-center text-base" href="/leader">
              直接打开查看端
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
