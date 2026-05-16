"use client";

import { useReadContract } from "wagmi";
import {
  LAND_REGISTRY_ADDRESS,
  LAND_REGISTRY_ABI,
} from "@/src/constants/contracts";

export function useRequestDetail(requestIndex: string) {
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LAND_REGISTRY_ABI,
    functionName: "requests",
    args: [BigInt(requestIndex)],
  });

  // Karena contract biasanya me-return Tuple (Array) untuk struct,
  // kita perlu memetakan (mapping) datanya agar mudah dipakai di UI.
  // Urutan index array [0, 1, 2...] bergantung pada urutan variabel di struct Solidity Anda.
  const requestDetail = rawData
    ? {
        action: rawData[0] as number,
        nib: rawData[1] as string,
        ownerName: rawData[2] as string,
        location: rawData[3] as string,
        areaSqm: Number(rawData[4]),
        documentHash: rawData[5] as string,
        isExecuted: rawData[6] as boolean,
        signatureCount: Number(rawData[7]),
      }
    : null;

  return { requestDetail, isLoading, error, refetch };
}
