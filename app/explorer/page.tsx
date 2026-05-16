"use client";

import React, { useState, useMemo } from "react";
import { Search, Info } from "lucide-react";
import ExplorerCard from "@/src/components/ExplorerCard";
import ApproveForm from "@/src/components/CertificateDetail";
import { useAllCertificates } from "@/src/hooks/useAllCertificates";

export default function CertificateExplorer() {
  const { certificates, isLoading, error } = useAllCertificates();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCertificateIndex, setSelectedCertificateIndex] = useState<
    string | null
  >(null);

  // Fungsi handleSearch memanfaatkan useMemo agar otomatis terfilter saat user mengetik
  const filteredCertificates = useMemo(() => {
    if (!searchQuery.trim()) return certificates;

    const query = searchQuery.toLowerCase();
    return certificates.filter(
      (cert) =>
        cert.nib.toLowerCase().includes(query) ||
        cert.txHash.toLowerCase().includes(query),
    );
  }, [searchQuery, certificates]);

  // Jika user mengklik "View Full Details", tampilkan halaman ApproveForm
  if (selectedCertificateIndex) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <button
          onClick={() => setSelectedCertificateIndex(null)}
          className="mb-6 text-sm font-bold text-gray-500 hover:text-gray-800 flex items-center gap-2"
        >
          ← Back to Explorer
        </button>
        {/* Render komponen ApproveForm yang sudah Anda buat sebelumnya */}
        <ApproveForm
          requestIndex={selectedCertificateIndex}
          hideControls={true}
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Certificate Explorer
        </h1>
        <p className="text-gray-500 text-sm">
          Search the immutable institutional archive to verify land titles,
          property deeds, and ownership certificates.
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-10">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Global Registry Search
        </p>

        <div className="flex gap-4 mb-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
              placeholder="Enter NIB (National Identification Number) or Document Hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="bg-[#0047AB] hover:bg-blue-800 text-white px-8 py-3 rounded-xl font-bold transition-colors">
            Search Archive
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Info size={14} />
          <span>Search formats: NIB (14 digits) or Hash (0x...)</span>
        </div>
      </div>

      {/* Grid Section */}
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-lg font-bold text-gray-900">Recent Entries</h3>
        <span className="text-sm text-gray-500">
          Showing {filteredCertificates.length}{" "}
          {searchQuery ? "results" : "latest verifications"}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Skeletons */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-gray-100 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500 bg-red-50 rounded-xl border border-red-100">
          Gagal mengambil data dari Rindexer/GraphQL.
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          Tidak ada sertifikat yang ditemukan dengan kata kunci tersebut.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((cert) => (
            <ExplorerCard
              key={cert.index}
              requestIndex={cert.index}
              nib={cert.nib}
              status={cert.status as "Verified" | "Pending"}
              txHash={cert.txHash}
              onViewDetails={setSelectedCertificateIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}
