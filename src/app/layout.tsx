import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "智能装备研究院资金管理系统 V1",
  description: "轻量级企业资金预算、备用金、借款和风险预警管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
