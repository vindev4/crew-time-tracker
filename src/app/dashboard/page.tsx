"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const t = {
  en: {
    dailyTimesheet: "Daily Timesheet",
    signOut: "Sign Out",
    date: "Date",
    startTime: "Start Time",
    stopTime: "Stop Time",
    totalHours: "Total Hours",
    jobLocation: "Job / Location",
    jobPlaceholder: "e.g. Terminal B - Gate 4",
    notes: "Notes",
    notesPlaceholder: "Optional",
    submit: "Submit Timesheet",
    submitting: "Submitting...",
    success: "Timesheet submitted!",
    connError: "Connection error. Try again.",
    jobRequired: "Job/Location is required",
    failedSubmit: "Failed to submit",
    recentReports: "Recent",
    loading: "Loading...",
  },
  es: {
    dailyTimesheet: "Hoja de Horas",
    signOut: "Cerrar Sesión",
    date: "Fecha",
    startTime: "Hora Inicio",
    stopTime: "Hora Fin",
    totalHours: "Horas Totales",
    jobLocation: "Trabajo / Ubicación",
    jobPlaceholder: "ej. Terminal B - Puerta 4",
    notes: "Notas",
    notesPlaceholder: "Opcional",
    submit: "Enviar Hoja de Horas",
    submitting: "Enviando...",
    success: "¡Hoja de horas enviada!",
    connError: "Error de conexión. Intente de nuevo.",
    jobRequired: "Trabajo/Ubicación es requerido",
    failedSubmit: "Error al enviar",
    recentReports: "Recientes",
    loading: "Cargando...",
  },
};

function timeOptions() {
  const opts: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const val = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      const label = hour12 + ":" + String(m).padStart(2, "0") + " " + ampm;
      opts.push({ value: val, label });
    }
  }
  return opts;
}

export default function DashboardPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "es">("en");
  const [empName, setEmpName] = useState("");
  const [empId, setEmpId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("07:00");
  const [stopTime, setStopTime] = useState("15:30");
  const [jobLocation, setJobLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [reports, setReports] = useState<any[]>([]);

  const s = t[lang];

  useEffect(() => {
    const saved = document.cookie.split("; ").find((c) => c.startsWith("lang="))?.split("=")[1];
    if (saved === "es") setLang("es");
    const name = document.cookie.split("; ").find((c) => c.startsWith("employee_name="))?.split("=")[1];
    const id = document.cookie.split("; ").find((c) => c.startsWith("employee_id="))?.split("=")[1];
    if (!name || !id) { router.push("/login"); return; }
    setEmpName(decodeURIComponent(name));
    setEmpId(decodeURIComponent(id));
    fetch("/time/api/reports").then(r => r.json()).then(d => {
      if (d.reports) setReports(d.reports);
    }).catch(() => {});
  }, [router]);

  function handleLangChange(newLang: "en" | "es") {
    setLang(newLang);
    document.cookie = "lang=" + newLang + "; path=/; max-age=31536000";
  }

  function calcHours(): string {
    if (!startTime || !stopTime) return "0.00";
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = stopTime.split(":").map(Number);
    const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
    return diff > 0 ? diff.toFixed(2) : "0.00";
  }

  function formatDate(d: string) {
    const [y, m, day] = d.split("-");
    return m + "/" + day + "/" + y;
  }

  function formatTime12(t24: string) {
    if (!t24) return "";
    const [h, m] = t24.split(":").map(Number);
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? "AM" : "PM";
    return hour12 + ":" + String(m).padStart(2, "0") + " " + ampm;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobLocation.trim()) { setError(s.jobRequired); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/time/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: empId, date, start_time: startTime, stop_time: stopTime,
          job_location: jobLocation.trim(), hours_worked: parseFloat(calcHours()), notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(s.success); setJobLocation(""); setNotes("");
        fetch("/time/api/reports").then(r => r.json()).then(d => { if (d.reports) setReports(d.reports); }).catch(() => {});
      } else { setError(data.error || s.failedSubmit); }
    } catch { setError(s.connError); }
    finally { setLoading(false); }
  }

  function handleLogout() {
    document.cookie = "employee_id=; path=/; max-age=0";
    document.cookie = "employee_name=; path=/; max-age=0";
    document.cookie = "employee_uuid=; path=/; max-age=0";
    router.push("/login");
  }

  if (!empName) {
    return (
      <div className="min-h-screen bg-[#00467F] flex items-center justify-center">
        <div className="text-white/60 text-sm">{s.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00467F]">
      {/* Header */}
      <div className="bg-[#003460]/80 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-md mx-auto flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="https://duraport.net/wp-content/uploads/2026/01/duraport-logo.svg" alt="DuraPort" className="h-5 opacity-90 flex-shrink-0" />
            <span className="text-white/90 font-medium text-sm truncate">{empName}</span>
          </div>
          <button onClick={handleLogout} className="text-white/40 hover:text-white/80 text-xs font-medium tracking-wide transition-colors flex-shrink-0 ml-3">{s.signOut}</button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-5 py-6">
        {/* Language Toggle */}
        <div className="flex gap-2 justify-center mb-6">
          <button
            onClick={() => handleLangChange("en")}
            className={`px-4 py-1.5 text-xs uppercase tracking-wider rounded-lg font-medium transition-colors ${
              lang === "en"
                ? "bg-[#F37C05] text-white"
                : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => handleLangChange("es")}
            className={`px-4 py-1.5 text-xs uppercase tracking-wider rounded-lg font-medium transition-colors ${
              lang === "es"
                ? "bg-[#F37C05] text-white"
                : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10"
            }`}
          >
            ES
          </button>
        </div>

        <h2 className="text-white/90 text-lg font-semibold mb-5 tracking-tight">{s.dailyTimesheet}</h2>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-2.5 rounded-xl mb-4 text-sm text-center">{success}</div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-2.5 rounded-xl mb-4 text-sm text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date */}
          <div>
            <label className="block text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">{s.date}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F37C05]/50 focus:ring-1 focus:ring-[#F37C05]/30 transition-all"
              style={{ colorScheme: "dark", WebkitAppearance: "none", MozAppearance: "none", appearance: "none" } as React.CSSProperties}
            />
          </div>

          {/* Start / Stop */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">{s.startTime}</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#F37C05]/50 focus:ring-1 focus:ring-[#F37C05]/30 transition-all"
                style={{ colorScheme: "dark", WebkitAppearance: "none", MozAppearance: "none", appearance: "none" } as React.CSSProperties}
              >
                {timeOptions().map((opt) => (
                  <option key={"s" + opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">{s.stopTime}</label>
              <select
                value={stopTime}
                onChange={(e) => setStopTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#F37C05]/50 focus:ring-1 focus:ring-[#F37C05]/30 transition-all"
                style={{ colorScheme: "dark", WebkitAppearance: "none", MozAppearance: "none", appearance: "none" } as React.CSSProperties}
              >
                {timeOptions().map((opt) => (
                  <option key={"e" + opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Total Hours */}
          <div className="text-center py-1">
            <span className="text-white/40 text-xs uppercase tracking-wider">{s.totalHours}: </span>
            <span className="text-[#F37C05] font-semibold text-lg">{calcHours()}</span>
          </div>

          {/* Job Location */}
          <div>
            <label className="block text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">{s.jobLocation}</label>
            <input
              type="text"
              value={jobLocation}
              onChange={(e) => setJobLocation(e.target.value)}
              placeholder={s.jobPlaceholder}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F37C05]/50 focus:ring-1 focus:ring-[#F37C05]/30 transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">{s.notes}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={s.notesPlaceholder}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F37C05]/50 focus:ring-1 focus:ring-[#F37C05]/30 transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F37C05] hover:bg-[#E37005] active:bg-[#D06500] text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-50 uppercase tracking-wide"
          >
            {loading ? s.submitting : s.submit}
          </button>
        </form>

        {/* Recent Reports */}
        {reports.length > 0 && (
          <div className="mt-8">
            <h3 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">{s.recentReports}</h3>
            <div className="space-y-2">
              {reports.slice(0, 5).map((r: any) => (
                <div key={r.id} className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white/80 text-sm font-medium">{r.report_date ? formatDate(r.report_date) : ""}</div>
                    <div className="text-white/30 text-xs mt-0.5 truncate">{r.job_location}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-white/60 text-xs">{formatTime12(r.start_time)} - {formatTime12(r.stop_time)}</div>
                    <div className="text-[#F37C05]/80 text-sm font-medium mt-0.5">{r.hours_worked}h</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
