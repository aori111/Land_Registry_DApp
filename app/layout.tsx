import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./provider";
import Header from "@/src/components/Header";
import SideBar from "@/src/components/SideBar";
import React from "react";

export const metadata: Metadata = {
  title: "LandCert DApp",
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
            <SideBar />
            <main className="flex-1 p-8">
              <Header />
              {props.children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
