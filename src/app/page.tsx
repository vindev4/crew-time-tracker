"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClockInPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePunch(type: "clock_in" | "clock_out") {
    if (!employeeId || !pin) {
      setError("Enter your Employee ID and PIN");
      return;
    }

    setLoading(true);
    setError("");

    let lat: number | null = null;
    let lng: number | null = null;
    let gps_available = false;

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: true,
          });
        }
      );
      lat = position.coords.latitude;
      lng = position.coords.longitude;
      gps_available = true;
    } catch {
    }

    try {
      const res = await fetch("/api/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          pin,
          type,
          lat,
          lng,
          gps_available,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to record punch");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        name: data.employee.name,
        type,
        time: data.punch.timestamp,
        gps: gps_available ? "true" : "false",
      });
      router.push(`/confirmation?${params.toString()}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Crew Time Tracker</h1>
          <p className="text-gray-400">Enter your ID and PIN to punch</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">
              Employee ID
            </label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. 001"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-xl text-center focus:outline-none focus:border-blue-500"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1">PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="****"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-xl text-center tracking-widest focus:outline-none focus:border-blue-500"
              disabled={loading}
              maxLength={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => handlePunch("clock_in")}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white font-bold py-4 rounded-lg text-lg transition-colors"
            >
              {loading ? "..." : "Clock In"}
            </button>
            <button
              onClick={() => handlePunch("clock_out")}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white font-bold py-4 rounded-lg text-lg transition-colors"
            >
              {loading ? "..." : "Clock Out"}
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => {
              if (!employeeId || !pin) {
                setError("Enter your ID and PIN first");
                return;
              }
              const params = new URLSearchParams({
                eid: employeeId,
                pin,
              });
              router.push(`/history?${params.toString()}`);
            }}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-lg text-sm transition-colors"
          >
            View My History
          </button>
          <button
            onClick={() => {
              if (!employeeId || !pin) {
                setError("Enter your ID and PIN first");
                return;
              }
              const params = new URLSearchParams({
                eid: employeeId,
                pin,
              });
              router.push(`/ticket?${params.toString()}`);
            }}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-lg text-sm transition-colors"
          >
            Submit Ticket
          </button>
        </div>

        <div className="text-center mt-6">
          <a
            href="/admin/login"
            className="text-gray-500 text-sm hover:text-gray-400"
          >
            Admin Login
          </a>
        </div>
      </div>
    </div>
  );
}
