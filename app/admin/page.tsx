"use client";

import React from "react";
import { FileText } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CertificateForm from "@/src/components/CertificateForm";
import StagingOverview from "@/src/components/StagingOverview";

export default function AdminDashboard() {
  const router = useRouter();
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: FORM CARD */}
        <CertificateForm />
        {/* RIGHT COLUMN: WIDGETS */}
        <div className="flex flex-col gap-6">
          {/* WIDGET 1: STAGING OVERVIEW */}
          <StagingOverview />
        </div>
      </div>
    </>
  );
}
