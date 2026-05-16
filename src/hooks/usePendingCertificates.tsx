"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

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

export function usePendingCertificates() {
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
