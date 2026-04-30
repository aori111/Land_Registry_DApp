"use client";

import {
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { useReadContract, useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { BaseError, ContractFunctionRevertedError } from "viem";
import {
  LAND_REGISTRY_ABI,
  LAND_REGISTRY_ADDRESS,
} from "@/src/constants/contracts";
import { useState } from "react";
import { GasEstimator } from "../utils/ApproveGasEstimator";
import { useQueryClient } from "@tanstack/react-query";

interface ApproveFormProps {
  requestIndex: string;
  hideControls?: boolean;
}

export default function ApproveForm({
  requestIndex,
  hideControls = false,
}: ApproveFormProps) {
  function useRequestDetail(requestIndex: string) {
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

  const config = useConfig();
  const { writeContractAsync } = useWriteContract();

  // Panggil hook read yang kita buat di atas
  const { requestDetail, refetch } = useRequestDetail(requestIndex);

  const [status, setStatus] = useState<
    "idle" | "signing" | "mining" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const queryClient = useQueryClient();

  const handleApprove = async () => {
    setStatus("signing");
    setErrorMessage("");

    try {
      // 1. Trigger MetaMask untuk tanda tangan (Write Contract)
      const txHash = await writeContractAsync({
        address: LAND_REGISTRY_ADDRESS,
        abi: LAND_REGISTRY_ABI,
        functionName: "confirmRequest",
        args: [BigInt(requestIndex)],
      });

      setStatus("mining");

      // 2. Tunggu konfirmasi block dari Anvil/Blockchain
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1,
      });

      if (receipt.status === "reverted") {
        throw new Error("Transaksi ditolak oleh Blockchain");
      }

      if (receipt.status === "success") {
        // Tunggu 1-2 detik agar indexer punya waktu memproses
        setTimeout(async () => {
          // Ganti 'pending-certificates' sesuai query key di list kiri Anda
          await queryClient.invalidateQueries({
            queryKey: ["pending-certificates"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["all-certificates"],
          });
        }, 1500);
      }

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      console.error(err);

      if (err instanceof BaseError) {
        const revertError = err.walk(
          (e) => e instanceof ContractFunctionRevertedError,
        );
        if (revertError instanceof ContractFunctionRevertedError) {
          // Contoh penanganan error: "Sudah tanda tangan" atau "Bukan Authority"
          setErrorMessage(
            revertError.reason || "Transaksi digagalkan oleh contract",
          );
        } else {
          setErrorMessage(err.shortMessage || "User membatalkan transaksi");
        }
      } else {
        setErrorMessage(err.message || "Terjadi kesalahan");
      }
    }
  };

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
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Initial Owner
            </p>
            <p className="font-bold text-lg">
              {requestDetail?.ownerName || "-"}
            </p>
            {/* Karena NIK tidak ada di struct, kita bisa memakai status verifikasi */}
            <p className="text-xs text-gray-400">
              Status:{" "}
              {requestDetail?.isExecuted ? "Executed" : "Pending Approval"}
            </p>
          </div>
          <div className="text-right"></div>
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

        {!hideControls && (
          <>
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
                The cryptographic hash of the underlying physical deed matches
                the on-chain record. Review the IPFS payload before applying
                signature.
              </p>
              <div className="bg-white p-3 rounded-lg border border-blue-50 font-mono text-[10px] text-gray-600 relative z-10 break-all">
                {/* Menyusun JSON dinamis sebagai payload preview */}
                payload:{" "}
                {requestDetail
                  ? `{ "deed_id": "${requestDetail.nib}", "ipfs_cid": "${requestDetail.documentHash}", "action": "${requestDetail.action === 0 ? "REGISTRATION" : "TRANSFER"}" }`
                  : "Loading payload..."}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-bold">
                {/* Ikon centang hijau jika sudah ada minimal 1 signature */}
                <CheckCircle2
                  size={18}
                  className={
                    requestDetail?.signatureCount &&
                    requestDetail.signatureCount > 0
                      ? "text-green-500"
                      : "text-gray-400"
                  }
                />
                {/* Menampilkan jumlah signature dinamis. Asumsi MAX_SIGS = 3 */}
                <span>
                  Signature {requestDetail?.signatureCount || 0} of 3 ready
                </span>
              </div>
              <GasEstimator requestIndex={requestIndex} />
            </div>

            <div className="space-y-4">
              {status !== "idle" && (
                <div
                  className={`p-4 rounded-xl border flex items-center gap-4 ${status === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}
                >
                  {["signing", "mining"].includes(status) && (
                    <Loader2 className="animate-spin" size={20} />
                  )}
                  {status === "success" && (
                    <CheckCircle2 className="text-green-600" size={20} />
                  )}
                  {status === "error" && (
                    <AlertCircle className="text-red-600" size={20} />
                  )}
                  <div>
                    <p className="text-sm font-bold">
                      {status === "signing" &&
                        "Menunggu Tanda Tangan Wallet..."}
                      {status === "mining" && "Memvalidasi di Blockchain..."}
                      {status === "success" &&
                        "Sertifikat Berhasil Diregistrasi!"}
                      {status === "error" && "Transaksi Gagal"}
                    </p>
                    {status === "error" && (
                      <p className="text-xs mt-1 opacity-80">{errorMessage}</p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleApprove}
                disabled={
                  status === "signing" ||
                  status === "mining" ||
                  requestDetail?.isExecuted ||
                  !requestDetail // Disable juga jika data belum selesai dimuat
                }
                className={`w-full py-3 rounded-lg font-bold transition-all text-white ${
                  (status !== "idle" && status !== "error") ||
                  requestDetail?.isExecuted
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {/* Jika sudah dieksekusi, ubah teks tombolnya */}
                {requestDetail?.isExecuted ? (
                  "Telah Dieksekusi"
                ) : (
                  <>
                    {status === "idle" && "Sign & Approve Registration"}
                    {status === "signing" && "Menunggu Tanda Tangan Wallet..."}
                    {status === "mining" && "Memvalidasi di Blockchain..."}
                    {status === "success" && "Berhasil Disetujui!"}
                    {status === "error" && "Coba Lagi"}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
