"use client";

import React from "react";
import { UploadCloud, FileText, Loader2, Eye } from "lucide-react";
import InputField from "./ui/InputField";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CertificateForm() {
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
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold mb-1">Inisiasi Sertifikat Baru</h3>
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
          />
          <InputField
            label="Nama Pemilik"
            name="ownerName"
            placeholder="Nama lengkap sesuai KTP"
            value={formData.ownerName}
            onChange={handleInputChange}
          />
          <InputField
            label="Lokasi (Desa/Kecamatan)"
            name="location"
            placeholder="Detail lokasi"
            value={formData.location}
            onChange={handleInputChange}
          />
          <InputField
            label="Luas Tanah (m²)"
            name="areaSqm"
            type="number"
            placeholder="0"
            value={formData.areaSqm}
            onChange={handleInputChange}
          />
        </div>

        {/* UPLOAD AREA */}
        <div className="bg-[#F8FAFC] border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center mb-6">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mb-3">
            <UploadCloud size={20} />
          </div>
          <p className="text-sm font-bold text-slate-700 mb-1">
            Upload Dokumen Sertifikat (PDF)
          </p>
          <p className="text-xs text-slate-500 mb-6">
            Sistem akan secara otomatis melakukan kalkulasi CID untuk
            blockchain.
          </p>

          {/* UPLOADING STATE CARD */}
          <div className="w-full max-w-md bg-white border border-slate-100 shadow-sm rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-md text-blue-600">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  sertifikat_12345.pdf
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Calculating CID...
                </p>
              </div>
            </div>
            <Loader2 size={18} className="text-blue-600 animate-spin" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            Batal
          </button>
          <button
            onClick={handleFormSubmit}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0047AB] hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
          >
            Submit ke Staging
          </button>
        </div>
      </div>
    </>
  );
}
