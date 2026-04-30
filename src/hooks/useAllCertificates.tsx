import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

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
    }),
  });
  return response.json();
}

export function useAllCertificates() {
  const { data, isLoading, error } = useQuery<CertificateQueryResponse>({
    queryKey: ["all-certificates"],
    queryFn: async () => {
      return await fetchCertificates();
    },
  });

  const certificates = useMemo(() => {
    if (!data?.data) return [];

    // 1. Ambil semua index yang sudah SELESAI (Executed)
    const executedIds = new Set(
      data.data.allRequestExecuteds.nodes.map((node) => node.requestIndex),
    );

    // 2. Mapping semua RequestSubmitted dan tentukan statusnya
    const allCerts = data.data.allRequestSubmitteds.nodes.map((cert) => {
      const isExecuted = executedIds.has(cert.requestIndex);

      return {
        index: cert.requestIndex,
        nib: cert.nib,
        actionType: cert.action,
        timestamp: cert.blockTimestamp,
        txHash: cert.txHash,
        status: isExecuted ? "Verified" : "Pending", // Flag status dinamis
      };
    });

    // Urutkan dari yang terbaru (opsional)
    return allCerts.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  }, [data]);

  return { certificates, isLoading, error };
}
