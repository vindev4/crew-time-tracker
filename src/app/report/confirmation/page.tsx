"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ConfirmationContent() {
  const params = useSearchParams();
  const name = params.get("name") || "";
  const date = params.get("date") || "";
  const project = params.get("project") || "";

  return (
    <div className="min-h-screen bg-[#00467F] text-white flex items-center justify-center">
      <div className="text-center p-6">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Report Submitted</h1>
        <p className="text-blue-100">{name}</p>
        <p className="text-blue-200 text-sm">{project}</p>
        <p className="text-blue-200 text-sm">{date}</p>
        <a
          href="/time/"
          className="mt-6 inline-block w-full max-w-xs py-3 bg-[#F37C05] hover:bg-[#E06E00] rounded font-medium transition-colors"
        >
          Done
        </a>
      </div>
    </div>
  );
}

export default function ReportConfirmation() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#00467F]" />}>
      <ConfirmationContent />
    </Suspense>
  );
}
