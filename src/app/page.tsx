"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePunch(type: "clock_in" | "clock_out") {
    if (!employeeId || !pin) {
      setError("Enter your ID and PIN");
      return;
    }

    setLoading(true);
    setError("");

    // Capture GPS
    let gpsLat: number | null = null;
    let gpsLng: number | null = null;
    let gpsAvailable = false;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          enableHighAccuracy: true,
        });
      });
      gpsLat = pos.coords.latitude;
      gpsLng = pos.coords.longitude;
      gpsAvailable = true;
    } catch {
      // GPS not available
    }

    try {
      const res = await fetch("/api/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          pin,
          type,
          gps_lat: gpsLat,
          gps_lng: gpsLng,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Punch failed");
        setLoading(false);
        return;
      }

      router.push(
        `/confirmation?name=${encodeURIComponent(data.employee_name)}&type=${type}&time=${encodeURIComponent(data.timestamp)}&gps=${gpsAvailable}`
      );
    } catch {
      setError("Connection error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-red-500 mb-1">Crew Time Tracker</h1>
      <p className="text-gray-400 mb-8">Enter your ID and PIN to punch</p>

      <div className="w-full max-w-sm space-y-4 bg-gray-800 p-6 rounded-lg">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-2 rounded text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-300 mb-1">Employee ID</label>
          <input
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white text-center placeholder-gray-400"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="e.g. 001"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">PIN</label>
          <input
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white text-center placeholder-gray-400"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="****"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handlePunch("clock_in")}
            disabled={loading}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded font-bold text-lg transition-colors disabled:opacity-50"
          >
            Clock In
          </button>
          <button
            onClick={() => handlePunch("clock_out")}
            disabled={loading}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded font-bold text-lg transition-colors disabled:opacity-50"
          >
            Clock Out
          </button>
        </div>
      </div>

      <div className="flex gap-3 mt-6 w-full max-w-sm">
        <a href="/history" className="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm">
          View My History
        </a>
        <a href="/ticket" className="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm">
          Submit Ticket
        </a>
      </div>

      <a
        href="/report/new"
        className="mt-3 w-full max-w-sm text-center py-3 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors block"
      >
        Daily Field Report
      </a>

      <a href="/admin/login" className="mt-6 text-gray-500 hover:text-gray-300 text-sm">
        Admin Login
      </a>
    </div>
  );
}
