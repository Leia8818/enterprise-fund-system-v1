"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, QrCode, ScanLine } from "lucide-react";
import { BASE_PATH, publicUrl } from "@/lib/auth";
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
    setEntryUrl(publicUrl("/leader"));
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dff7ed,transparent_30%),linear-gradient(135deg,#f8fcfa,#eaf6ef)] px-5 py-8 text-ink">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full items-center gap-7 lg:grid-cols-[1fr_0.78fr]">
          <div className="relative min-h-[520px] overflow-hidden rounded-[34px] bg-[#064536] p-8 text-white shadow-2xl shadow-emerald-950/20 sm:p-12">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/10" />
            <div className="pointer-events-none absolute -bottom-28 left-8 h-64 w-64 rounded-full bg-emerald-200/10" />

            <Image
              src={`${BASE_PATH}/brand/mgrass-logo-sidebar.png`}
              alt="蒙草 M·GRASS"
              width={172}
              height={94}
              className="relative h-auto w-36 object-contain sm:w-44"
              priority
            />

            <div className="relative mt-16 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-emerald-50 ring-1 ring-white/15">
                <ScanLine className="h-4 w-4" />
                扫码查看
              </div>
              <h1 className="mt-6 text-center text-5xl font-extrabold leading-[1.12] tracking-wide sm:text-6xl lg:text-left">
                智能装备研究院
                <br />
                资金管理系统
              </h1>
            </div>

            <div className="relative mt-12 grid gap-4 sm:grid-cols-3">
              {["实时概览", "只读展示", "手机适配"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-center text-base font-extrabold text-emerald-50">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-emerald-100 bg-white p-6 text-center shadow-xl shadow-emerald-950/5 sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <QrCode className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-[#064536]">手机扫码进入</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">资金决策概览</p>

            <div className="mx-auto mt-7 h-72 w-72 rounded-[28px] bg-white p-5 shadow-inner ring-1 ring-line sm:h-80 sm:w-80">
              {entryUrl && <QrSvg value={entryUrl} />}
            </div>

            <Link className="btn-primary mx-auto mt-6 h-12 w-full max-w-sm justify-center text-base" href="/leader">
              打开查看端
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
