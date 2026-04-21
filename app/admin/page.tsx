"use client";

import React from "react";
import { FileText, Eye } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CertificateForm from "@/src/components/CertificateForm";

export default function AdminDashboard() {
  const router = useRouter();

  const handleFormSubmit = async () => {
    console.log("Proses Berhasil");

    router.push("/notary");
  };
  // 1. STATE UNTUK MENYIMPAN DATA FORM
  const [formData, setFormData] = useState({
    nib: "",
    ownerName: "",
    location: "",
    areaSqm: "",
  });

  // 2. FUNGSI UNTUK MENANGANI PERUBAHAN INPUT
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: FORM CARD */}
        <CertificateForm />
        {/* RIGHT COLUMN: WIDGETS */}
        <div className="flex flex-col gap-6">
          {/* WIDGET 1: STAGING OVERVIEW */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">
              Staging Overview
            </h4>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                  <span className="text-sm font-medium text-slate-600">
                    PENDING REGISTRATIONS
                  </span>
                </div>
                <span className="text-xl font-bold text-slate-800">8</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                  <span className="text-sm font-medium text-slate-600">
                    PENDING TRANSFERS
                  </span>
                </div>
                <span className="text-xl font-bold text-slate-800">4</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span className="uppercase font-semibold">
                  Total Workload: 12
                </span>
                <FileText size={14} />
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full flex overflow-hidden">
                <div className="h-full bg-[#0047AB] w-[66%] border-r border-white"></div>
                <div className="h-full bg-slate-400 w-[34%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: TABLE */}
      <div className="mt-8">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-lg font-bold text-slate-900">
            Staging & Signature Progress
          </h3>
          <a
            href="#"
            className="text-sm font-semibold text-[#0047AB] hover:underline"
          >
            View All
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  NIB
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Pemilik
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Document Hash (CID)
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Signatures
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* ROW 1 */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-700">
                  10.15.22.05.1.12345
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  Budi Santoso
                </td>
                <td className="px-6 py-4">
                  <span className="inline-block bg-slate-100 text-slate-500 font-mono text-xs px-2 py-1 rounded">
                    QmYWAP...j3pC
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 bg-[#EEF2FF] text-[#3730A3] px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
                    <div className="w-1 h-1 rounded-full bg-[#4F46E5]"></div>
                    Staging
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-1.5 w-6 bg-slate-700 rounded-full"></div>
                      <div className="h-1.5 w-6 bg-slate-700 rounded-full"></div>
                      <div className="h-1.5 w-6 bg-slate-200 rounded-full"></div>
                    </div>
                    <span className="text-xs text-slate-500 font-medium ml-1">
                      2/3
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[#0047AB] hover:text-blue-800 p-1">
                    <Eye size={18} />
                  </button>
                </td>
              </tr>

              {/* ROW 2 */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-700">
                  10.15.22.05.1.99821
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  Siti Aminah
                </td>
                <td className="px-6 py-4">
                  <span className="inline-block bg-slate-100 text-slate-500 font-mono text-xs px-2 py-1 rounded">
                    QmXk9T...v8mA
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                    Pending
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-1.5 w-6 bg-[#E0E7FF] rounded-full"></div>
                      <div className="h-1.5 w-6 bg-[#E0E7FF] rounded-full"></div>
                      <div className="h-1.5 w-6 bg-[#E0E7FF] rounded-full"></div>
                    </div>
                    <span className="text-xs text-slate-500 font-medium ml-1">
                      0/3
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[#0047AB] hover:text-blue-800 p-1">
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
