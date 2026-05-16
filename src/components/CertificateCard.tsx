import React from "react";
import { useReadContract } from "wagmi";
// Sesuaikan path import abi Anda
import {
  LAND_REGISTRY_ADDRESS,
  LAND_REGISTRY_ABI,
} from "@/src/constants/contracts";

interface CertificateCardProps {
  key: string;
  requestIndex: string;
  nib: string;
  type: number;
  isSelected: boolean;
  onClick: () => void;
}

export default function CertificateCard({
  nib,
  requestIndex,
  type,
  isSelected,
  onClick,
}: CertificateCardProps) {
  // Fetch data sertifikat dari contract berdasarkan NIB
  const {
    data: certData,
    isLoading,
    error,
  } = useReadContract({
    abi: LAND_REGISTRY_ABI,
    address: LAND_REGISTRY_ADDRESS as `0x${string}`,
    functionName: "getRequestConfirmationsCount",
    args: [BigInt(requestIndex)],
    query: {
      enabled: !!nib && !!LAND_REGISTRY_ADDRESS,
      refetchInterval: 3000,
      refetchOnWindowFocus: true,
    },
  });

  // const currentSigs = Number(certData);
  const currentSigs = Number(certData);
  const maxSigs = 3;
  const progressPercentage = (currentSigs / maxSigs) * 100;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition-all cursor-pointer bg-white ${
        isSelected
          ? "border-indigo-600 shadow-md"
          : "border-gray-100 hover:border-indigo-200"
      }`}
    >
      {isLoading ? (
        // Loading Skeleton
        <div className="animate-pulse flex flex-col gap-3">
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
          <div className="h-1.5 bg-gray-200 rounded w-full mt-2"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-xs">Gagal memuat data</div>
      ) : (
        <>
          {/* Baris 1: NIB & Signature Count */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
              {type === 0 ? "Registrasi Baru" : "Balik Nama / Transfer"}
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full">
              {currentSigs}/{maxSigs} Sigs
            </span>
          </div>

          <h4 className="font-bold text-[#1A1C1E] text-base mb-4">
            NIB: {nib}
          </h4>
          {/* Baris 3: Progress Bar */}
          <div className="w-full bg-gray-100 h-1.5 rounded-full mb-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Baris 4: Status Keterangan */}
          <div className="flex justify-between text-[10px] font-medium text-gray-400">
            <span>Initiator Signed</span>
            <span className="text-gray-500">
              {currentSigs === 0
                ? "Awaiting All"
                : currentSigs === maxSigs
                  ? "Verified"
                  : "Awaiting..."}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
