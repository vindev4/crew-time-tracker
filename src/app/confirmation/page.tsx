"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Worker";
  const type = searchParams.get("type") || "clock_in";
  const time = searchParams.get("time");
  const gps = searchParams.get("gps") === "true";

  const formattedTime = time
    ? new Date(time).toLocaleString()
    : new Date().toLocaleString();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${type === "clock_in" ? "bg-green-600" : "bg-red-600"}`}
        >
          <span className="text-4xl">{type === "clock_in" ? "â" : "â"}</span>
        </div>

        <h1 className="text-2xl font-bold mb-2">
          {type === "clock_in" ? "Clocked In" : "Clocked Out"}
        </h1>

        <p className="text-xl text-gray-300 mb-1">{name}</p>
        <p className="text-gray-400 mb-4">{formattedTime}</p>

        <div className="bg-gray-800 rounded-lg p-3 mb-6 inline-block">
          <span className={`text-sm ${gps ? "text-green-400" : "text-yellow-400"}`}>
            {gps ? "ð GPS Location Recorded" : "â ï¸ GPS Not Available"}
          </span>
        </div>

        <div>
          <a
            href="/time/"
            className="block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Done
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
