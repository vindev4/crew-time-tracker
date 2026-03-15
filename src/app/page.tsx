"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n, LanguageToggle } from "@/lib/i18n";

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePunch(type: "clock_in" | "clock_out") {
    if (!employeeId || !pin) {
      setError(t("error.idPin"));
      return;
    }

    setLoading(true);
    setError("");

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
      const res = await fetch("/time/api/punch", {
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
        setError(data.error || t("error.punchFailed"));
        setLoading(false);
        return;
      }

      router.push(
        `/time/confirmation?name=${encodeURIComponent(data.employee_name)}&type=${type}&time=${encodeURIComponent(data.timestamp)}&gps=${gpsAvailable}`
      );
    } catch {
      setError(t("error.connectionError"));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <LanguageToggle />
      <h1 className="text-3xl font-bold text-red-500 mb-1">{t("app.title")}</h1>
      <p className="text-gray-400 mb-8">{t("app.subtitle")}</p>

      <div className="w-full max-w-sm space-y-4 bg-gray-800 p-6 rounded-lg">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-2 rounded text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-300 mb-1">{t("app.employeeId")}</label>
          <input
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white text-center placeholder-gray-400"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="e.g. 001"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">{t("app.pin")}</label>
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
            {t("app.clockIn")}
          </button>
          <button
            onClick={() => handlePunch("clock_out")}
            disabled={loading}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded font-bold text-lg transition-colors disabled:opacity-50"
          >
            {t("app.clockOut")}
          </button>
        </div>
      </div>

      <div className="flex gap-3 mt-6 w-full max-w-sm">
        <a
          href="/time/history"
          className="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm"
        >
          {t("app.viewHistory")}
        </a>
        <a
          href="/time/ticket"
          className="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm"
        >
          {t("app.submitTicket")}
        </a>
      </div>

      <a
        href="/time/report/new"
        className="mt-3 w-full max-w-sm text-center py-3 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors block"
      >
        {t("app.dailyReport")}
      </a>

      <div className="flex gap-4 mt-6">
        <a href="/time/register" className="text-blue-400 hover:text-blue-300 text-sm">
          New Employee? Register Here
        </a>
        <a href="/time/admin/login" className="text-gray-500 hover:text-gray-300 text-sm">
          {t("app.adminLogin")}
        </a>
      </div>
    </div>
  );
}
