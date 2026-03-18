"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const t = {
  en: {
    workTickets: "Work Tickets",
    tickets: "tickets",
    totalHours: "total hours",
    employees: "Employees",
    exportCSV: "Export CSV",
    today: "Today",
    thisWeek: "This Week",
    allTime: "All Time",
    searchPlaceholder: "Search by name, ID, or location...",
    summaryByEmployee: "Summary by Employee",
    ticket: "ticket",
    ticketPlural: "tickets",
    date: "Date",
    employee: "Employee",
    start: "Start",
    stop: "Stop",
    hours: "Hours",
    jobLocation: "Job / Location",
    notes: "Notes",
    submitted: "Submitted",
    actions: "Actions",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    loading: "Loading...",
    noTickets: "No work tickets found",
    signOut: "Sign Out",
    lang: "ES",
  },
  es: {
    workTickets: "Boletas de Trabajo",
    tickets: "boletas",
    totalHours: "horas totales",
    employees: "Empleados",
    exportCSV: "Exportar CSV",
    today: "Hoy",
    thisWeek: "Esta Semana",
    allTime: "Todo",
    searchPlaceholder: "Buscar por nombre, ID o ubicación...",
    summaryByEmployee: "Resumen por Empleado",
    ticket: "boleta",
    ticketPlural: "boletas",
    date: "Fecha",
    employee: "Empleado",
    start: "Inicio",
    stop: "Fin",
    hours: "Horas",
    jobLocation: "Trabajo / Ubicación",
    notes: "Notas",
    submitted: "Enviado",
    actions: "Acciones",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    loading: "Cargando...",
    noTickets: "No se encontraron boletas de trabajo",
    signOut: "Cerrar Sesión",
    lang: "EN",
  },
};

interface Report {
  id: string;
  employee_id: string;
  employee_name: string;
  report_date: string;
  start_time: string;
  stop_time: string;
  job_location: string;
  hours_worked: number;
  notes: string;
  submitted_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "es">("en");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"today" | "week" | "all">("week");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Report>>({});

  const s = t[lang];

  useEffect(() => {
    const saved = document.cookie.split("; ").find((c) => c.startsWith("lang="))?.split("=")[1];
    if (saved === "es") setLang("es");
  }, []);

  function toggleLang() {
    const next = lang === "en" ? "es" : "en";
    setLang(next);
    document.cookie = "lang=" + next + "; path=/; max-age=31536000";
  }

  function getWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const diffToWed = day >= 3 ? day - 3 : day + 4;
    const wed = new Date(now);
    wed.setDate(now.getDate() - diffToWed);
    wed.setHours(0, 0, 0, 0);
    const nextWed = new Date(wed);
    nextWed.setDate(wed.getDate() + 7);
    return { start: wed.toISOString().split("T")[0], end: nextWed.toISOString().split("T")[0] };
  }

  async function fetchReports() {
    setLoading(true);
    let url = "/time/api/admin/reports";
    const params = new URLSearchParams();
    if (dateRange === "today") {
      const today = new Date().toISOString().split("T")[0];
      params.set("start", today);
      params.set("end", today);
    } else if (dateRange === "week") {
      const { start, end } = getWeekRange();
      params.set("start", start);
      params.set("end", end);
    }
    if (params.toString()) url += "?" + params.toString();
    const res = await fetch(url);
    if (res.status === 401) { router.push("/admin/login"); return; }
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports || []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchReports(); }, [dateRange]);

  async function saveEdit(id: string) {
    const res = await fetch("/time/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editData }),
    });
    if (res.ok) { setEditingId(null); setEditData({}); fetchReports(); }
  }

  function startEdit(report: Report) {
    setEditingId(report.id);
    setEditData({
      start_time: report.start_time || "",
      stop_time: report.stop_time || "",
      job_location: report.job_location || "",
      hours_worked: report.hours_worked || 0,
      notes: report.notes || "",
    });
  }

  function exportCSV() {
    const headers = [s.date, "Employee ID", s.employee, s.start, s.stop, s.hours, s.jobLocation, s.notes, s.submitted];
    const rows = filtered.map((r) => [
      r.report_date, r.employee_id, r.employee_name, r.start_time || "", r.stop_time || "",
      r.hours_worked?.toString() || "", (r.job_location || "").replace(/,/g, ";"),
      (r.notes || "").replace(/,/g, ";").replace(/\n/g, " "),
      r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "",
    ]);
    const total = filtered.reduce((sum, r) => sum + (r.hours_worked || 0), 0);
    rows.push(["", "", "", "", "TOTAL", total.toFixed(1), "", "", ""]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `work-tickets-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLogout() {
    document.cookie = "admin_authenticated=; path=/; max-age=0";
    document.cookie = "admin_token=; path=/; max-age=0";
    router.push("/admin/login");
  }

  const filtered = reports.filter(
    (r) =>
      r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_id?.includes(search) ||
      r.job_location?.toLowerCase().includes(search.toLowerCase())
  );

  const totalHours = filtered.reduce((sum, r) => sum + (r.hours_worked || 0), 0);

  const summary: Record<string, { name: string; hours: number; tickets: number }> = {};
  filtered.forEach((r) => {
    if (!summary[r.employee_id]) {
      summary[r.employee_id] = { name: r.employee_name, hours: 0, tickets: 0 };
    }
    summary[r.employee_id].hours += r.hours_worked || 0;
    summary[r.employee_id].tickets += 1;
  });

  const inputClass = "p-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#F37C05]/50";

  return (
    <div className="min-h-screen bg-[#00467F] text-white">
      {/* Header */}
      <div className="bg-[#003460]/80 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <img src="https://duraport.net/wp-content/uploads/2026/01/duraport-logo.svg" alt="DuraPort" className="h-5 sm:h-6 opacity-90" />
            <div>
              <div className="text-white/90 font-medium text-sm">{s.workTickets}</div>
              <p className="text-white/40 text-xs">{filtered.length} {s.tickets} / {totalHours.toFixed(1)} {s.totalHours}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="text-white/40 hover:text-white/80 text-xs font-medium tracking-wide transition-colors">{s.lang}</button>
            <button onClick={handleLogout} className="text-white/40 hover:text-white/80 text-xs font-medium tracking-wide transition-colors">{s.signOut}</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-6">
        {/* Action buttons */}
        <div className="flex gap-2 mb-5 flex-wrap">
          <a href="/time/admin/employees" className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs uppercase tracking-wider transition-colors">
            {s.employees}
          </a>
          <button onClick={exportCSV} className="px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 rounded-xl text-xs uppercase tracking-wider transition-colors">
            {s.exportCSV}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap items-center">
          <div className="flex bg-white/5 rounded-xl overflow-hidden border border-white/10">
            {(["today", "week", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
                  dateRange === range
                    ? "bg-[#F37C05] text-white"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                {range === "week" ? s.thisWeek : range === "today" ? s.today : s.allTime}
              </button>
            ))}
          </div>
          <input
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#F37C05]/50 focus:ring-1 focus:ring-[#F37C05]/30 transition-all w-64"
            placeholder={s.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Weekly Summary */}
        {Object.keys(summary).length > 0 && (
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-5">
            <h2 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">{s.summaryByEmployee}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Object.entries(summary)
                .sort((a, b) => b[1].hours - a[1].hours)
                .map(([empId, data]) => (
                  <div key={empId} className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-white/60 text-xs truncate">{data.name}</p>
                    <p className="text-[#F37C05] text-lg font-semibold">{data.hours.toFixed(1)}h</p>
                    <p className="text-white/30 text-xs">{data.tickets} {data.tickets !== 1 ? s.ticketPlural : s.ticket}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tickets Table */}
        <div className="bg-white/5 border border-white/5 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-3 text-left text-white/40 text-xs font-medium uppercase tracking-wider">{s.date}</th>
                <th className="p-3 text-left text-white/40 text-xs font-medium uppercase tracking-wider">{s.employee}</th>
                <th className="p-3 text-left text-white/40 text-xs font-medium uppercase tracking-wider">{s.start}</th>
                <th className="p-3 text-left text-white/40 text-xs font-medium uppercase tracking-wider">{s.stop}</th>
                <th className="p-3 text-center text-white/40 text-xs font-medium uppercase tracking-wider">{s.hours}</th>
                <th className="p-3 text-left text-white/40 text-xs font-medium uppercase tracking-wider">{s.jobLocation}</th>
                <th className="p-3 text-left text-white/40 text-xs font-medium uppercase tracking-wider">{s.notes}</th>
                <th className="p-3 text-left text-white/40 text-xs font-medium uppercase tracking-wider">{s.submitted}</th>
                <th className="p-3 text-right text-white/40 text-xs font-medium uppercase tracking-wider">{s.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  {editingId === r.id ? (
                    <>
                      <td className="p-2 text-white/80">{r.report_date}</td>
                      <td className="p-2">
                        <span className="text-white/30 text-xs">{r.employee_id}</span>{" "}
                        <span className="text-white/80">{r.employee_name}</span>
                      </td>
                      <td className="p-2">
                        <input type="time" className={inputClass + " w-24"} value={editData.start_time || ""} onChange={(e) => setEditData({ ...editData, start_time: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <input type="time" className={inputClass + " w-24"} value={editData.stop_time || ""} onChange={(e) => setEditData({ ...editData, stop_time: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <input type="number" step="0.5" className={inputClass + " w-16 text-center"} value={editData.hours_worked || ""} onChange={(e) => setEditData({ ...editData, hours_worked: parseFloat(e.target.value) })} />
                      </td>
                      <td className="p-2">
                        <input className={inputClass + " w-full"} value={editData.job_location || ""} onChange={(e) => setEditData({ ...editData, job_location: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <input className={inputClass + " w-full"} value={editData.notes || ""} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
                      </td>
                      <td className="p-2 text-xs text-white/30">
                        {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "\u2014"}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => saveEdit(r.id)} className="px-2 py-0.5 bg-emerald-600/80 hover:bg-emerald-600 rounded-lg text-xs transition-colors">{s.save}</button>
                          <button onClick={() => { setEditingId(null); setEditData({}); }} className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors">{s.cancel}</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 text-white/80">{r.report_date}</td>
                      <td className="p-3">
                        <span className="text-white/30 text-xs mr-1">{r.employee_id}</span>
                        <span className="text-white/90 font-medium">{r.employee_name}</span>
                      </td>
                      <td className="p-3 text-white/60">{r.start_time || "\u2014"}</td>
                      <td className="p-3 text-white/60">{r.stop_time || "\u2014"}</td>
                      <td className="p-3 text-center font-semibold text-[#F37C05]">{r.hours_worked?.toFixed(1) || "\u2014"}</td>
                      <td className="p-3 max-w-[200px] truncate text-white/60">{r.job_location || "\u2014"}</td>
                      <td className="p-3 max-w-[200px] truncate text-white/40">{r.notes || "\u2014"}</td>
                      <td className="p-3 text-xs text-white/30">
                        {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "\u2014"}
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => startEdit(r)} className="px-3 py-1 bg-[#F37C05]/80 hover:bg-[#F37C05] rounded-lg text-xs transition-colors">
                          {s.edit}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="p-6 text-center text-white/30 text-sm">{s.loading}</p>}
          {!loading && filtered.length === 0 && <p className="p-6 text-center text-white/30 text-sm">{s.noTickets}</p>}
        </div>
      </div>
    </div>
  );
}
