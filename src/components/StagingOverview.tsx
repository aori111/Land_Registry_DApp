"use client";

import { useMemo } from "react";
import { FileText } from "lucide-react";
import { useAllCertificates } from "@/src/hooks/useAllCertificates";

export default function StagingOverview() {
  const { certificates, isLoading } = useAllCertificates();

  // Menghitung statistik berdasarkan status "Pending" dan tipe aksi
  const stats = useMemo(() => {
    // Kita hanya menghitung yang statusnya 'Pending' (belum dieksekusi)
    const pendingOnly = certificates.filter((c) => c.status === "Pending");

    // Action 0 = Registration, Action 1 = Transfer (berdasarkan logic contract sebelumnya)
    const registrations = pendingOnly.filter((c) => c.actionType === 0).length;
    const transfers = pendingOnly.filter((c) => c.actionType === 1).length;
    const total = registrations + transfers;

    // Menghitung persentase untuk progress bar
    const regPercentage = total > 0 ? (registrations / total) * 100 : 0;
    const transPercentage = total > 0 ? (transfers / total) * 100 : 0;

    return { registrations, transfers, total, regPercentage, transPercentage };
  }, [certificates]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/2 mb-6"></div>
        <div className="space-y-4">
          <div className="h-8 bg-slate-50 rounded"></div>
          <div className="h-8 bg-slate-50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">
        Staging Overview
      </h4>

      <div className="space-y-4 mb-6">
        {/* Row Pending Registrations */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0047AB]"></div>
            <span className="text-sm font-medium text-slate-600">
              PENDING REGISTRATIONS
            </span>
          </div>
          <span className="text-xl font-bold text-slate-800">
            {stats.registrations}
          </span>
        </div>

        {/* Row Pending Transfers */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
            <span className="text-sm font-medium text-slate-600">
              PENDING TRANSFERS
            </span>
          </div>
          <span className="text-xl font-bold text-slate-800">
            {stats.transfers}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span className="uppercase font-semibold tracking-tight">
            Total Workload: {stats.total}
          </span>
          <FileText size={14} />
        </div>

        {/* Dynamic Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 rounded-full flex overflow-hidden">
          {stats.total > 0 ? (
            <>
              <div
                className="h-full bg-[#0047AB] border-r border-white transition-all duration-500"
                style={{ width: `${stats.regPercentage}%` }}
              ></div>
              <div
                className="h-full bg-slate-400 transition-all duration-500"
                style={{ width: `${stats.transPercentage}%` }}
              ></div>
            </>
          ) : (
            <div className="h-full bg-slate-200 w-full"></div>
          )}
        </div>

        {stats.total === 0 && (
          <p className="text-[10px] text-slate-400 mt-2 italic text-center">
            All tasks completed
          </p>
        )}
      </div>
    </div>
  );
}
