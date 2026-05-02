"use client";

import React, { useState, useMemo } from "react";

import CertificateCard from "@/src/components/CertificateCard";
import { useQuery } from "@tanstack/react-query";

import ApproveForm from "@/src/components/ApproveForm";

interface CertificateSubmitted {
  action: number;
  blocknumber: string;
  nib: string;
  requestIndex: string;
  rindexerId: number;
  txHash: string;
  blockTimestamp: string;
}

interface CertificateExecuted {
  requestIndex: string;
}

interface CertificateQueryResponse {
  data: {
    allRequestSubmitteds: {
      nodes: CertificateSubmitted[];
    };
    allRequestExecuteds: {
      nodes: CertificateExecuted[];
    };
  };
}

const GET_REGISTERED_CERTIFICATES = `
query AllRequestSubmitteds {
  allRequestSubmitteds {
    nodes {
      action
      blockNumber
      nib
      requestIndex
      rindexerId
      txHash
      blockTimestamp
    }
  }
  allRequestExecuteds {
    nodes {
      requestIndex
    }
  }
}
`;

async function fetchCertificates(): Promise<CertificateQueryResponse> {
  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: GET_REGISTERED_CERTIFICATES,
      refetchOnWindowFocus: true,
    }),
  });
  return response.json();
}

function usePendingRegistrations() {
  const { data, isLoading, error } = useQuery<CertificateQueryResponse>({
    queryKey: ["pending-certificates"],
    queryFn: async () => {
      return await fetchCertificates();
    },
  });

  const pendingCertificates = useMemo(() => {
    if (!data?.data) return [];

    // 1. Ambil semua index yang sudah SELESAI (Executed)
    const executedIds = new Set(
      data.data.allRequestExecuteds.nodes.map((node) => node.requestIndex),
    );

    // 2. Filter RequestSubmitted
    const filteredPending = data.data.allRequestSubmitteds.nodes.filter(
      (request) => {
        // Cek apakah sudah dieksekusi?
        const isNotExecuted = !executedIds.has(request.requestIndex);

        return isNotExecuted;
      },
    );

    // 3. Mapping untuk UI dengan label tipe yang jelas
    return filteredPending.map((cert) => ({
      index: cert.requestIndex,
      nib: cert.nib,
      actionType: cert.action,
      timestamp: cert.blockTimestamp,
    }));
  }, [data]);

  return { pendingCertificates, isLoading, error };
}

export default function VerificationPage() {
  const [selectedId, setSelectedId] = useState("1");
  const { isLoading, error, pendingCertificates } = usePendingRegistrations();

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
          <ApproveForm requestIndex={selectedId} hideControls={false} />
        </div>
      </main>
    </div>
  );
}

// Sub-komponen Sidebar Item
function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: any;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${active ? "bg-white shadow-sm border border-gray-100 text-indigo-600" : "text-gray-500 hover:bg-gray-50"}`}
    >
      {icon}
      <span
        className={`text-sm font-semibold ${active ? "text-gray-900" : ""}`}
      >
        {label}
      </span>
    </div>
  );
}
