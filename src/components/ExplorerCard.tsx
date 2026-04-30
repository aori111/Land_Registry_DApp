import React from "react";
import { useReadContract } from "wagmi";
import { FileText, ArrowRight } from "lucide-react";
import {
  LAND_REGISTRY_ADDRESS,
  LAND_REGISTRY_ABI,
} from "@/src/constants/contracts";

interface ExplorerCardProps {
  requestIndex: string;
  nib: string;
  status: "Verified" | "Pending";
  txHash: string;
  onViewDetails: (index: string) => void;
}

export default function ExplorerCard({
  requestIndex,
  nib,
  status,
  txHash,
  onViewDetails,
}: ExplorerCardProps) {
  // Ambil detail struct dari contract untuk mendapatkan Owner Entity
  const { data: rawData, isLoading } = useReadContract({
    address: LAND_REGISTRY_ADDRESS as `0x${string}`,
    abi: LAND_REGISTRY_ABI,
    functionName: "requests",
    args: [BigInt(requestIndex)],
  });

  // rawData[2] adalah ownerName, rawData[5] adalah documentHash (sesuai struktur contract Anda)
  const ownerEntity = rawData ? (rawData as any)[2] : "Loading...";
  const docHash = rawData ? (rawData as any)[5] : txHash;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
              Parcel NIB
            </p>
            <h4 className="font-bold text-gray-900 text-lg">{nib}</h4>
          </div>

          {/* Status Badge */}
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 ${
              status === "Verified"
                ? "bg-[#EEF2FF] text-[#4F46E5]" // Indigo light
                : "bg-[#FFF7ED] text-[#EA580C]" // Orange light
            }`}
          >
            {status === "Verified" && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {status === "Pending" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
            )}
            {status}
          </span>
        </div>

        <div className="mb-4">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
            Owner Entity
          </p>
          <p className="font-semibold text-gray-800">
            {isLoading ? "Mencari data..." : ownerEntity}
          </p>
        </div>

        <div className="bg-blue-50/50 rounded-lg p-3 flex items-center gap-2 mb-6 border border-blue-100/50">
          <FileText size={14} className="text-blue-600" />
          <p className="text-xs font-mono text-blue-900/80 truncate">
            {docHash
              ? `${docHash.slice(0, 8)}...${docHash.slice(-4)}`
              : "No Hash"}
          </p>
        </div>
      </div>

      <button
        onClick={() => onViewDetails(requestIndex)}
        className="text-sm font-bold text-blue-800 hover:text-blue-600 flex items-center gap-2 w-fit transition-colors"
      >
        View Full Details <ArrowRight size={16} />
      </button>
    </div>
  );
}
