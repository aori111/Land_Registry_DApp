"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; // Hook untuk cek URL saat ini
import { LayoutDashboard, ShieldCheck, Globe } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  // Helper function untuk menentukan style menu aktif
  const getMenuClass = (path: string) => {
    const baseClass =
      "flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ";
    const activeClass =
      "bg-white text-blue-700 shadow-sm border border-slate-100";
    const inactiveClass = "text-slate-600 hover:bg-slate-200/50";

    return baseClass + (pathname === path ? activeClass : inactiveClass);
  };

  return (
    <aside className="w-64 bg-[#F1F5F9] border-r border-slate-200 flex flex-col min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Civic Ledger
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {/* Gunakan komponen Link */}
        <Link href="/admin" className={getMenuClass("/admin")}>
          <LayoutDashboard
            size={18}
            className={pathname === "/admin" ? "text-blue-600" : ""}
          />
          Admin Dashboard
        </Link>

        <Link href="/verification" className={getMenuClass("/verification")}>
          <ShieldCheck
            size={18}
            className={pathname === "/verification" ? "text-blue-600" : ""}
          />
          Verification Center
        </Link>

        <Link href="/explorer" className={getMenuClass("/explorer")}>
          <Globe
            size={18}
            className={pathname === "/explorer" ? "text-blue-600" : ""}
          />
          Certificate Explorer
        </Link>
      </nav>
    </aside>
  );
}
