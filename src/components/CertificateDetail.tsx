"use client";

import { PropsWithChildren } from "react";
import { ShieldCheck, MapPin, ArrowRight } from "lucide-react";

interface CertificateDetailProps extends PropsWithChildren {
  requestDetail: {
    action: number;
    nib: string;
    ownerName: string;
    location: string;
    areaSqm: number;
    documentHash: string;
    isExecuted: boolean;
    signatureCount: number;
  } | null;
}

export default function CertificateDetail({
  requestDetail,
  children,
}: CertificateDetailProps) {
  return (
    <div className="col-span-7">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h3 className="text-3xl font-bold mb-2 text-gray-800">
              {/* Menampilkan NIB sebagai judul */}
              NIB: {requestDetail?.nib || "Loading..."}
            </h3>
            <p className="text-sm text-gray-400 flex items-center gap-2 font-mono">
              <ShieldCheck size={16} />
              {/* Memotong hash panjang agar rapi di UI */}
              Doc Hash:{" "}
              {requestDetail?.documentHash
                ? `${requestDetail.documentHash.slice(0, 10)}...${requestDetail.documentHash.slice(-4)}`
                : "..."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-8 mb-10">
          {/* KOLOM KIRI ATAS: Initial Owner */}
          {/* Menentukan kondisi: jika action === 0 maka Register, selain itu Transfer */}
          {(() => {
            const isRegister = requestDetail?.action === 0;

            return (
              <div
                className={
                  isRegister
                    ? "col-span-2 flex flex-col justify-start" // Tampilan polos tanpa background & border untuk Register
                    : "flex flex-row items-center justify-around col-span-2 bg-[#F8FAFF] border border-blue-100 rounded-xl p-6 relative overflow-hidden" // Tampilan dengan background untuk Transfer
                }
              >
                {/* KOLOM KIRI: Initial Owner (Selalu Tampil di Kedua Kondisi) */}
                <div className="flex flex-col h-full">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Initial Owner
                  </p>
                  <p className="font-bold text-lg text-gray-900 truncate">
                    {requestDetail?.ownerName || "-"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Status:{" "}
                    <span
                      className={
                        requestDetail?.isExecuted
                          ? "text-green-600 font-medium"
                          : "text-amber-500 font-medium"
                      }
                    >
                      {requestDetail?.isExecuted
                        ? "Executed"
                        : "Pending Approval"}
                    </span>
                  </p>
                </div>

                {/* TERNARY / KONDISIONAL: Arrow Icon & New Owner Hanya Muncul Jika Tipe TRANSFER */}
                {!isRegister && (
                  <>
                    <ArrowRight
                      size={36}
                      className="text-gray-300 flex-shrink-0 mx-4"
                    />

                    {/* KOLOM KANAN: New Owner */}
                    <div className="flex flex-col h-full">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        New Owner
                      </p>
                      <p className="font-bold text-lg text-gray-900 truncate">
                        {requestDetail?.ownerName || "-"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Area Size
            </p>

            <p className="font-bold text-lg">
              {/* Format angka dengan pemisah ribuan ala Indonesia */}
              {requestDetail?.areaSqm
                ? requestDetail.areaSqm.toLocaleString("id-ID")
                : 0}{" "}
              <span className="text-sm font-normal text-gray-500">m²</span>
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Registration Type
            </p>

            {/* Render warna badge yang berbeda berdasarkan tipe Action */}

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                requestDetail?.action === 0
                  ? "bg-blue-100 text-blue-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {requestDetail?.action === 0 ? "Registration" : "Transfer"}
            </span>
          </div>

          <div className="col-span-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <MapPin size={18} className="text-indigo-600" />
            </div>

            <p className="text-sm font-mono text-indigo-900">
              {/* Menampilkan lokasi dari contract */}

              {requestDetail?.location || "Fetching location data..."}
            </p>
          </div>
        </div>
        {/* Integrity Box */}
        <div className="bg-[#F8FAFF] border border-blue-100 rounded-xl p-6 mb-8 relative overflow-hidden">
          <ShieldCheck className="absolute right-[-10px] top-[-10px] text-blue-50 w-24 h-24" />
          <div className="flex gap-3 mb-4 relative z-10">
            <ShieldCheck className="text-blue-600" />
            <h4 className="font-bold text-blue-900">
              Smart Contract Integrity
            </h4>
          </div>
          <p className="text-xs text-blue-700/80 leading-relaxed mb-4 relative z-10">
            The cryptographic hash of the underlying physical deed matches the
            on-chain record. Review the IPFS payload before applying signature.
          </p>
          <div className="bg-white p-3 rounded-lg border border-blue-50 font-mono text-[10px] text-gray-600 relative z-10 break-all">
            {/* Menyusun JSON dinamis sebagai payload preview */}
            payload:{" "}
            {requestDetail
              ? `{ "deed_id": "${requestDetail.nib}", "ipfs_cid": "${requestDetail.documentHash}", "action": "${requestDetail.action === 0 ? "REGISTRATION" : "TRANSFER"}" }`
              : "Loading payload..."}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
