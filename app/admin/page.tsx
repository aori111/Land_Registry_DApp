"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StagingOverview from "@/src/components/StagingOverview";
import InputField from "@/src/components/ui/InputField";
import {
  LAND_REGISTRY_ABI,
  LAND_REGISTRY_ADDRESS,
} from "@/src/constants/contracts";
import { useConfig, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { BaseError, ContractFunctionRevertedError } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import {
  UploadCloud,
  FileText,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { form } from "viem/chains";

export default function AdminDashboard() {
  const router = useRouter();
  const config = useConfig();

  const [activeTab, setActiveTab] = useState("registration"); // 'registration' atau 'transfer'

  const { writeContractAsync } = useWriteContract();

  const [status, setStatus] = useState<
    "idle" | "uploading" | "signing" | "mining" | "success" | "error"
  >("idle");

  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nib: "",
    ownerName: "",
    location: "",
    areaSqm: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Validasi file manual sebelum mulai
    if (!selectedFile) {
      setStatus("error");
      setErrorMessage("Mohon unggah dokumen PDF sertifikat.");
      return;
    }

    try {
      // ==========================================
      // FASE 1: UPLOAD KE PINATA (IPFS)
      // ==========================================
      setStatus("uploading");

      const uploadData = new FormData();
      uploadData.append("file", selectedFile);

      const pinataResponse = await fetch("/api/files", {
        method: "POST",
        body: uploadData,
      });

      if (!pinataResponse.ok) throw new Error("Gagal mengunggah file ke IPFS");

      const responseText = await pinataResponse.text();
      const cleanUrl = responseText.replace(/"/g, "").trim();
      const documentHash = cleanUrl.includes("/ipfs/")
        ? cleanUrl.split("/ipfs/")[1]
        : cleanUrl.split("/").pop();

      if (!documentHash) throw new Error("CID tidak valid");

      // ==========================================
      // FASE 1.5: VALIDASI INTEGRITAS CID (NEW)
      // ==========================================
      setStatus("signing"); // Indikasi sedang memproses validasi

      const cidAlreadyExists = await readContract(config, {
        abi: LAND_REGISTRY_ABI,
        address: LAND_REGISTRY_ADDRESS,
        functionName: "isCidUsed", // Sesuai mapping di contract Anda
        args: [documentHash],
      });

      if (cidAlreadyExists) {
        throw new Error(
          "Dokumen ini sudah pernah didaftarkan sebelumnya (Duplicate CID).",
        );
      }

      // ==========================================
      // FASE 2: SIGNING (WALLET)
      // ==========================================
      setStatus("signing");

      const txHash = await writeContractAsync({
        abi: LAND_REGISTRY_ABI,
        address: LAND_REGISTRY_ADDRESS,
        functionName: "submitRegistration",
        args: [
          formData.nib,
          formData.ownerName,
          formData.location,
          BigInt(Math.floor(Number(formData.areaSqm))),
          documentHash,
        ],
      });

      console.log("Hasil write contract", txHash);

      // // ==========================================
      // // FASE 3: MINING (BLOCKCHAIN CONFIRMATION)
      // // ==========================================
      setStatus("mining");

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1,
      });
      console.log("Receipt Status", receipt.status);

      if (receipt.status === "reverted") {
        throw new Error("Transaction Reverted oleh Blockchain.");
      }

      // ==========================================
      // FASE 4: SUCCESS
      // ==========================================

      if (receipt.status === "success") {
        setTimeout(async () => {
          // Ganti 'pending-certificates' sesuai query key di list kiri Anda
          await queryClient.invalidateQueries({
            queryKey: ["pending-certificates"],
          });
          await queryClient.invalidateQueries({
            queryKey: ["all-certificates"],
          });
        }, 1500);
        setStatus("success");
        console.log("Transaksi Berhasil!");

        setTimeout(() => {
          // 1. Reset data form
          setFormData({
            nib: "",
            ownerName: "",
            location: "",
            areaSqm: "",
          });

          // 2. Reset file yang dipilih
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";

          // 3. Kembalikan status ke idle
          setStatus("idle");
          setErrorMessage("");
        }, 3000);
      }

      // Redirect setelah sukses
      // setTimeout(() => router.push("/verification"), 2500);
    } catch (err: any) {
      setStatus("error");
      console.error("Error Detail:", err);

      if (err instanceof BaseError) {
        const revertError = err.walk(
          (e) => e instanceof ContractFunctionRevertedError,
        );
        if (revertError instanceof ContractFunctionRevertedError) {
          setErrorMessage(
            revertError.reason || "Bukan pihak berwenang (Not an authority)",
          );
        } else {
          setErrorMessage(err.shortMessage || "Transaksi ditolak atau gagal.");
        }
      } else {
        setErrorMessage(err.message || "Terjadi kesalahan sistem.");
      }
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex space-x-6 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("registration")}
              className={`pb-2 text-sm font-medium transition-colors ${
                activeTab === "registration"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Registrasi Baru
            </button>
            <button
              onClick={() => setActiveTab("transfer")}
              className={`pb-2 text-sm font-medium transition-colors ${
                activeTab === "transfer"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Balik Nama (Transfer)
            </button>
          </div>
          {/* LEFT COLUMN: FORM CARD */}
          {activeTab === "transfer" && (
            <form action="" onSubmit={handleTransferSubmit}>
              <div className="animate-fadeIn">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Inisiasi Balik Nama Sertifikat
                  </h3>
                  <p className="text-sm text-gray-500">
                    Masukkan NIB yang sudah terdaftar untuk proses perubahan
                    kepemilikan.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <InputField
                    label="NIB"
                    name="nib"
                    placeholder="Masukkan NIB"
                    value={formData.nib}
                    onChange={handleInputChange}
                    required
                  />
                  <InputField
                    label="Nama Pemilik Baru"
                    name="ownerName"
                    placeholder="Masukkan nama pemilik baru"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200"
                >
                  Submit Transfer ke Staging
                </button>
              </div>
            </form>
          )}
          {activeTab === "registration" && (
            <form onSubmit={handleFormSubmit}>
              <h3 className="text-lg font-bold mb-1">
                Inisiasi Sertifikat Baru
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Masukkan data NIB dan lampiran PDF untuk proses hashing.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-2 mb-2">
                <InputField
                  label="Nomor Induk Bidang (NIB)"
                  name="nib"
                  placeholder="Contoh: 10.15.22.05.1.12345"
                  value={formData.nib}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Nama Pemilik"
                  name="ownerName"
                  placeholder="Nama lengkap sesuai KTP"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Lokasi (Desa/Kecamatan)"
                  name="location"
                  placeholder="Detail lokasi"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
                <InputField
                  label="Luas Tanah (m²)"
                  name="areaSqm"
                  type="number"
                  placeholder="0"
                  value={formData.areaSqm}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />

              <div
                onClick={() =>
                  status === "idle" || status === "error"
                    ? fileInputRef.current?.click()
                    : null
                }
                className={`bg-[#F8FAFC] border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center mb-6 transition-all ${
                  selectedFile
                    ? "border-blue-400 bg-blue-50/20"
                    : "border-slate-200 hover:border-blue-300 cursor-pointer"
                }`}
              >
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mb-3">
                  <UploadCloud size={20} />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">
                  Upload Dokumen Sertifikat (PDF)
                </p>
                <p className="text-xs text-slate-500 mb-6 text-center">
                  Sistem akan otomatis menghitung CID.
                </p>

                {selectedFile && (
                  <div
                    className="w-full max-w-md bg-white border border-slate-100 shadow-sm rounded-lg p-3 flex items-center justify-between"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-md text-blue-600">
                        <FileText size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-blue-600 font-mono mt-0.5">
                          Ready for Blockchain
                        </p>
                      </div>
                    </div>
                    {status === "idle" && (
                      <button
                        onClick={removeFile}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {status !== "idle" && (
                  <div
                    className={`p-4 rounded-xl border flex items-center gap-4 ${status === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}
                  >
                    {["uploading", "signing", "mining"].includes(status) && (
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
                        {status === "uploading" && "Mengunggah ke IPFS..."}
                        {status === "signing" &&
                          "Menunggu Tanda Tangan Wallet..."}
                        {status === "mining" && "Memvalidasi di Blockchain..."}
                        {status === "success" &&
                          "Sertifikat Berhasil Diregistrasi!"}
                        {status === "error" && "Transaksi Gagal"}
                      </p>
                      {status === "error" && (
                        <p className="text-xs mt-1 opacity-80">
                          {errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status !== "idle" && status !== "error"}
                  className={`w-full py-3 rounded-lg font-bold transition-all ${
                    status !== "idle" && status !== "error"
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                  }`}
                >
                  {status === "idle" || status === "error"
                    ? "Submit ke Staging"
                    : "Memproses..."}
                </button>
              </div>
            </form>
          )}
        </div>
        {/* RIGHT COLUMN: WIDGETS */}
        <div className="flex flex-col gap-6">
          {/* WIDGET 1: STAGING OVERVIEW */}
          <StagingOverview />
        </div>
      </div>
    </>
  );
}
