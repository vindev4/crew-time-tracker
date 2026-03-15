"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ConfirmationContent() {
  const params = useSearchParams();
  const name = params.get("name") || "";
  const date = params.get("date") || "";
  const project = params.get("project") || "";

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center p-6">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Report Submitted</h1>
        <p className="text-gray-300">{name}</p>
        <p className="text-gray-400 text-sm">{project}</p>
        <p className="text-gray-400 text-sm">{date}</p>
        <a
          href="/"
          className="mt-6 inline-block w-full max-w-xs py-3 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
        >
          Done
        </a>
      </div>
    </div>
  );
}

export default function ReportConfirmation() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900" />}>
      <ConfirmationContent />
    </Suspense>
  );
}
