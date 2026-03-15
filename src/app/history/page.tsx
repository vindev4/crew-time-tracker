"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

interface Punch {
  id: string;
  type: string;
  timestamp: string;
  lat: number | null;
  lng: number | null;
  gps_available: boolean;
}

function HistoryContent() {
  const searchParams = useSearchParams();
  const eid = searchParams.get("eid") || "";
  const pin = searchParams.get("pin") || "";
  const [punches, setPunches] = useState<Punch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employeeName, setEmployeeName] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        // First authenticate to get the UUID
        const authRes = await fetch("/time/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employee_id: eid, pin }),
        });

        if (!authRes.ok) {
          setError("Authentication failed");
          setLoading(false);
          return;
        }

        const authData = await authRes.json();
        setEmployeeName(authData.employee.name);

        // Then fetch punches
        const res = await fetch(
          `/api/punch?employee_id=${authData.employee.id}`
        );
        const data = await res.json();

        if (res.ok) {
          setPunches(data.punches || []);
        } else {
          setError(data.error || "Failed to load history");
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }

    if (eid && pin) {
      fetchHistory();
    } else {
      setError("Missing credentials");
      setLoading(false);
    }
  }, [eid, pin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My History</h1>
            {employeeName && (
              <p className="text-gray-400">{employeeName}</p>
            )}
          </div>
          <a
            href="/time/"
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
          >
            Back
          </a>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {punches.length === 0 && !error ? (
          <div className="text-center text-gray-500 py-12">
            No punches recorded yet
          </div>
        ) : (
          <div className="space-y-2">
            {punches.map((punch) => (
              <div
                key={punch.id}
                className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${punch.type === "clock_in" ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <div>
                    <span className="font-medium">
                      {punch.type === "clock_in" ? "Clock In" : "Clock Out"}
                    </span>
                    <p className="text-sm text-gray-400">
                      {new Date(punch.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs ${punch.gps_available ? "text-green-400" : "text-gray-500"}`}
                >
                  {punch.gps_available ? "ð" : "â"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <HistoryContent />
    </Suspense>
  );
}
