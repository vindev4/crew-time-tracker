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
    <div className="min-h-screen bg-[#00467F] text-white flex flex-col items-center justify-center p-4">
      <LanguageToggle />
      <div className="mb-6">
        <img src="https://duraport.net/wp-content/uploads/2026/01/duraport-logo.svg" alt="DuraPort" className="h-16 mx-auto" />
      </div>
      <h1 className="text-3xl font-bold text-[#F37C05] mb-1">{t("app.title")}</h1>
      <p className="text-blue-200 mb-8">{t("app.subtitle")}</p>

      <div className="w-full max-w-sm space-y-4 bg-[#003460] p-6 rounded-lg border border-blue-700/30 shadow-xl">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-2 rounded text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-blue-200 mb-1">{t("app.employeeId")}</label>
          <input
            className="w-full p-3 bg-[#00467F] border border-blue-600/50 rounded text-white text-center placeholder-blue-300/50 focus:outline-none focus:border-[#F37C05] focus:ring-1 focus:ring-[#F37C05]"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="e.g. 001"
          />
        </div>

        <div>
          <label className="block text-sm text-blue-200 mb-1">{t("app.pin")}</label>
          <input
            className="w-full p-3 bg-[#00467F] border border-blue-600/50 rounded text-white text-center placeholder-blue-300/50 focus:outline-none focus:border-[#F37C05] focus:ring-1 focus:ring-[#F37C05]"
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
            className="flex-1 py-3 bg-[#F37C05] hover:bg-[#E06E00] rounded font-bold text-lg transition-colors disabled:opacity-50"
          >
            {t("app.clockOut")}
          </button>
        </div>
      </div>

      <div className="flex gap-3 mt-6 w-full max-w-sm">
        <a
          href="/time/history"
          className="flex-1 text-center py-2 bg-[#00569C] hover:bg-[#00467F] border border-blue-600/30 rounded transition-colors text-sm"
        >
          {t("app.viewHistory")}
        </a>
        <a
          href="/time/ticket"
          className="flex-1 text-center py-2 bg-[#00569C] hover:bg-[#00467F] border border-blue-600/30 rounded transition-colors text-sm"
        >
          {t("app.submitTicket")}
        </a>
      </div>

      <a
        href="/time/report/new"
        className="mt-3 w-full max-w-sm text-center py-3 bg-[#F37C05] hover:bg-[#E06E00] rounded font-medium transition-colors block"
      >
        {t("app.dailyReport")}
      </a>

      <div className="flex gap-4 mt-6">
        <a href="/time/register" className="text-[#F37C05] hover:text-orange-300 text-sm">
          New Employee? Register Here
        </a>
        <a href="/time/admin/login" className="text-blue-300/60 hover:text-blue-200 text-sm">
          {t("app.adminLogin")}
        </a>
      </div>
    </div>
  );
}
