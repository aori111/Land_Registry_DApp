"use client";

import { useState } from "react";

import CertificateCard from "@/src/components/CertificateCard";

import CertificateDetail from "@/src/components/CertificateDetail";

import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

import { GasEstimator } from "@/src/utils/ApproveGasEstimator";

import { useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { BaseError, ContractFunctionRevertedError } from "viem";
import {
  LAND_REGISTRY_ABI,
  LAND_REGISTRY_ADDRESS,
} from "@/src/constants/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { usePendingCertificates } from "@/src/hooks/usePendingCertificates";
import { useRequestDetail } from "@/src/hooks/useRequestDetails";

export default function VerificationPage() {
  const [selectedId, setSelectedId] = useState("1");
  const { pendingCertificates } = usePendingCertificates();
  const { requestDetail, refetch } = useRequestDetail(selectedId);

  const config = useConfig();
  const { writeContractAsync } = useWriteContract();

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
        args: [BigInt(selectedId)],
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
      refetch();
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
    <div className="flex min-h-screen bg-[#F4F6FA]">
      {/* Main Content */}
      <main className="flex-1 p-10">
        <div className="grid grid-cols-12 gap-8">
          {/* Left: Pending Signatures List */}
          <div className="col-span-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">
                Pending Signatures
              </h3>
              <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-xs font-bold">
                {pendingCertificates.length} Items
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Multi-signature threshold: 3-of-3 required
            </p>

            <div className="space-y-4">
              {pendingCertificates.map((certificate) => (
                <CertificateCard
                  key={certificate.index}
                  requestIndex={certificate.index}
                  nib={certificate.nib}
                  type={certificate.actionType}
                  isSelected={certificate.index === selectedId}
                  onClick={() => setSelectedId(certificate.index)}
                />
              ))}
            </div>
          </div>

          {/* Right: Detailed View */}
          <CertificateDetail requestDetail={requestDetail}>
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
              <GasEstimator requestIndex={selectedId} />
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
          </CertificateDetail>
        </div>
      </main>
    </div>
  );
}
