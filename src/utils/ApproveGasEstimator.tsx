import React, { useMemo } from "react";
import { useEstimateGas, useGasPrice, useAccount } from "wagmi";
import { formatEther, encodeFunctionData } from "viem";
import {
  LAND_REGISTRY_ABI,
  LAND_REGISTRY_ADDRESS,
} from "@/src/constants/contracts";

interface GasEstimatorProps {
  requestIndex: string;
}

export const GasEstimator: React.FC<GasEstimatorProps> = ({ requestIndex }) => {
  const { address } = useAccount();

  // 1. Mengambil Harga Gas Terbaru dari Network
  const { data: gasPrice } = useGasPrice();

  // 2. Simulasi Estimasi Unit Gas untuk fungsi confirmRequest
  const { data: gasUnits, isError } = useEstimateGas({
    account: address,
    to: LAND_REGISTRY_ADDRESS,
    data: encodeFunctionData({
      abi: LAND_REGISTRY_ABI,
      functionName: "confirmRequest",
      args: [BigInt(requestIndex)],
    }),
    // Hanya estimasi jika index tersedia
    query: {
      enabled: !!requestIndex && !!address,
    },
  });

  // 3. Kalkulasi Total Biaya (Gas Units * Gas Price)
  const estimatedFee = useMemo(() => {
    if (!gasUnits || !gasPrice) return "0.002"; // Fallback jika loading

    try {
      const totalWei = gasUnits * gasPrice;
      const ethValue = formatEther(totalWei);
      // Batasi 6 angka di belakang koma untuk kerapihan UI
      return parseFloat(ethValue).toFixed(6);
    } catch (e) {
      return "0.002";
    }
  }, [gasUnits, gasPrice]);

  if (isError) {
    return (
      <span className="text-[10px] text-red-400 font-mono">
        Estimation Failed
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] text-gray-400 font-mono">
        Gas Est: {estimatedFee} ETH
      </span>
      <span className="text-[8px] text-green-500 uppercase font-bold tracking-tighter">
        Live Network Fee
      </span>
    </div>
  );
};
