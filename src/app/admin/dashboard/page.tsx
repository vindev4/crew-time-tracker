"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

/* ── i18n ────────────────────────────────────────────────────────── */
const t = {
  en: {
    workTickets: "Work Tickets",
    signOut: "Sign Out",
    loading: "Loading…",
    noReports: "No reports found",
    filters: "Filters",
    dateRange: "Date Range",
    today: "Today",
    thisWeek: "This Week",
    lastWeek: "Last Week",
    custom: "Custom",
    allTime: "All Time",
    from: "From",
    to: "To",
    employees: "Employees",
    allEmployees: "All Employees",
    locations: "Locations",
    allLocations: "All Locations",
    overtimeOnly: "Overtime Only",
    clearAll: "Clear All",
    savedFilters: "Saved Filters",
    saveCurrentFilter: "Save Current",
    filterName: "Filter name…",
    save: "Save",
    date: "Date",
    employee: "Employee",
    startTime: "Start",
    stopTime: "Stop",
    hours: "Hours",
    weekHrs: "Wk Hrs",
    jobLocation: "Job / Location",
    notes: "Notes",
    submitted: "Submitted",
    actions: "Actions",
    edit: "Edit",
    cancelEdit: "Cancel",
    saveEdit: "Save",
    otBadge: "OT",
    employeeSummary: "Employee Summary",
    totalHours: "Total Hours",
    tickets: "Tickets",
    weeklyAvg: "Wk Avg",
    exportCSV: "Export CSV",
    showFilters: "Filters",
    hideFilters: "Hide",
    selected: "selected",
  },
  es: {
    workTickets: "Boletas de Trabajo",
    signOut: "Cerrar Sesión",
    loading: "Cargando…",
    noReports: "No se encontraron reportes",
    filters: "Filtros",
    dateRange: "Rango de Fechas",
    today: "Hoy",
    thisWeek: "Esta Semana",
    lastWeek: "Semana Pasada",
    custom: "Personalizado",
    allTime: "Todo",
    from: "Desde",
    to: "Hasta",
    employees: "Empleados",
    allEmployees: "Todos los Empleados",
    locations: "Ubicaciones",
    allLocations: "Todas las Ubicaciones",
    overtimeOnly: "Solo Horas Extra",
    clearAll: "Limpiar Todo",
    savedFilters: "Filtros Guardados",
    saveCurrentFilter: "Guardar Actual",
    filterName: "Nombre del filtro…",
    save: "Guardar",
    date: "Fecha",
    employee: "Empleado",
    startTime: "Inicio",
    stopTime: "Fin",
    hours: "Horas",
    weekHrs: "Hrs Sem",
    jobLocation: "Trabajo / Ubicación",
    notes: "Notas",
    submitted: "Enviado",
    actions: "Acciones",
    edit: "Editar",
    cancelEdit: "Cancelar",
    saveEdit: "Guardar",
    otBadge: "HE",
    employeeSummary: "Resumen por Empleado",
    totalHours: "Horas Totales",
    tickets: "Boletas",
    weeklyAvg: "Prom Sem",
    exportCSV: "Exportar CSV",
    showFilters: "Filtros",
    hideFilters: "Ocultar",
    selected: "seleccionados",
  },
};

/* ── Types ───────────────────────────────────────────────────────── */
interface Report {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_custom_id: string;
  report_date: string;
  start_time: string;
  stop_time: string;
  job_location: string;
  hours_worked: number;
  notes: string;
  submitted_at: string;
  week_total_hours: number;
  is_overtime: boolean;
}

interface Employee {
  id: string;
  name: string;
  employee_id: string;
}

interface SavedFilter {
  name: string;
  datePreset: string;
  customStart: string;
  customEnd: string;
  employees: string[];
  locations: string[];
  overtimeOnly: boolean;
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const m = new Date(d);
  m.setDate(m.getDate() - diff);
  return m;
}

function getSunday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  const s = new Date(d);
  s.setDate(s.getDate() + diff);
  return s;
}

function ds(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDate(d: string) {
  if (!d) return "";
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

function formatDateTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return (d.getMonth() + 1) + "/" + d.getDate() + " " + formatTime12(d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0"));
}

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

/* ── Component ───────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "es">("en");
  const s = t[lang];

  const [reports, setReports] = useState<Report[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [datePreset, setDatePreset] = useState("thisWeek");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [overtimeOnly, setOvertimeOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [sortCol, setSortCol] = useState("submitted_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterNameInput, setFilterNameInput] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const [empDropOpen, setEmpDropOpen] = useState(false);
  const [locDropOpen, setLocDropOpen] = useState(false);
  const empDropRef = useRef<HTMLDivElement>(null);
  const locDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLang = document.cookie.split("; ").find((c) => c.startsWith("lang="))?.split("=")[1];
    if (savedLang === "es") setLang("es");
    const auth = document.cookie.split("; ").find((c) => c.startsWith("admin_authenticated="));
    if (!auth) { router.push("/login"); return; }
    try {
      const sf = localStorage.getItem("admin_saved_filters");
      if (sf) setSavedFilters(JSON.parse(sf));
    } catch {}
  }, [router]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (empDropRef.current && !empDropRef.current.contains(e.target as Node)) setEmpDropOpen(false);
      if (locDropRef.current && !locDropRef.current.contains(e.target as Node)) setLocDropOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (datePreset) {
      case "today":
        return { start: todayStr(), end: todayStr() };
      case "thisWeek":
        return { start: ds(getMonday(now)), end: ds(getSunday(now)) };
      case "lastWeek": {
        const lw = new Date(now);
        lw.setDate(lw.getDate() - 7);
        return { start: ds(getMonday(lw)), end: ds(getSunday(lw)) };
      }
      case "custom":
        return { start: customStart, end: customEnd };
      case "all":
      default:
        return { start: "", end: "" };
    }
  }, [datePreset, customStart, customEnd]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.set("start", dateRange.start);
      if (dateRange.end) params.set("end", dateRange.end);
      if (selectedEmployees.length > 0) params.set("employees", selectedEmployees.join(","));
      if (selectedLocations.length > 0) params.set("locations", selectedLocations.join(","));
      if (overtimeOnly) params.set("overtime", "true");
      params.set("sort", sortCol);
      params.set("dir", sortDir);

      const res = await fetch("/time/api/admin/reports?" + params.toString());
      const data = await res.json();
      if (data.reports) setReports(data.reports);
      if (data.employees) setEmployees(data.employees);
      if (data.locations) setLocations(data.locations);
    } catch {}
    setLoading(false);
  }, [dateRange, selectedEmployees, selectedLocations, overtimeOnly, sortCol, sortDir]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleLangChange(newLang: "en" | "es") {
    setLang(newLang);
    document.cookie = "lang=" + newLang + "; path=/; max-age=31536000";
  }

  function handleSort(col: string) {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  function sortArrow(col: string) {
    if (sortCol !== col) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  function clearFilters() {
    setDatePreset("thisWeek");
    setCustomStart("");
    setCustomEnd("");
    setSelectedEmployees([]);
    setSelectedLocations([]);
    setOvertimeOnly(false);
  }

  function saveFilter() {
    if (!filterNameInput.trim()) return;
    const newFilter: SavedFilter = {
      name: filterNameInput.trim(),
      datePreset, customStart, customEnd,
      employees: selectedEmployees,
      locations: selectedLocations,
      overtimeOnly,
    };
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem("admin_saved_filters", JSON.stringify(updated));
    setFilterNameInput("");
    setShowSaveInput(false);
  }

  function loadFilter(f: SavedFilter) {
    setDatePreset(f.datePreset);
    setCustomStart(f.customStart);
    setCustomEnd(f.customEnd);
    setSelectedEmployees(f.employees);
    setSelectedLocations(f.locations);
    setOvertimeOnly(f.overtimeOnly);
  }

  function deleteFilter(idx: number) {
    const updated = savedFilters.filter((_, i) => i !== idx);
    setSavedFilters(updated);
    localStorage.setItem("admin_saved_filters", JSON.stringify(updated));
  }

  function toggleEmployee(id: string) {
    setSelectedEmployees((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);
  }

  function toggleLocation(loc: string) {
    setSelectedLocations((prev) => prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]);
  }

  function startEdit(r: Report) {
    setEditingId(r.id);
    setEditData({
      report_date: r.report_date,
      start_time: r.start_time,
      stop_time: r.stop_time,
      job_location: r.job_location,
      hours_worked: r.hours_worked,
      notes: r.notes,
    });
  }

  async function saveEditHandler() {
    if (!editingId) return;
    try {
      const [sh, sm] = editData.start_time.split(":").map(Number);
      const [eh, em] = editData.stop_time.split(":").map(Number);
      const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
      const hrs = diff > 0 ? Math.round(diff * 100) / 100 : 0;

      await fetch("/time/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editData, hours_worked: hrs }),
      });
      setEditingId(null);
      fetchData();
    } catch {}
  }

  const empSummary = useMemo(() => {
    const map: Record<string, { name: string; hours: number; count: number; weeks: Set<string> }> = {};
    for (const r of reports) {
      if (!map[r.employee_id]) {
        map[r.employee_id] = { name: r.employee_name, hours: 0, count: 0, weeks: new Set() };
      }
      map[r.employee_id].hours += r.hours_worked || 0;
      map[r.employee_id].count++;
      const d = new Date(r.report_date);
      map[r.employee_id].weeks.add(ds(getMonday(d)));
    }
    return Object.entries(map)
      .map(([id, v]) => ({
        id,
        name: v.name,
        hours: Math.round(v.hours * 100) / 100,
        count: v.count,
        weeklyAvg: v.weeks.size > 0 ? Math.round((v.hours / v.weeks.size) * 100) / 100 : 0,
        hasOvertime: reports.some((r) => r.employee_id === id && r.is_overtime),
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [reports]);

  const otSummary = useMemo(() => {
    const otReports = reports.filter((r) => r.is_overtime);
    const otEmployees = new Set(otReports.map((r) => r.employee_id));
    const totalOtHours = otReports.reduce((s, r) => s + (r.hours_worked || 0), 0);
    return { count: otEmployees.size, hours: Math.round(totalOtHours * 100) / 100 };
  }, [reports]);

  function exportCSV() {
    const header = "Date,Employee,Employee ID,Start,Stop,Hours,Week Total,Overtime,Job/Location,Notes,Submitted\n";
    const rows = reports.map((r) =>
      [
        r.report_date,
        '"' + (r.employee_name || "").replace(/"/g, '""') + '"',
        r.employee_custom_id || "",
        r.start_time,
        r.stop_time,
        r.hours_worked,
        r.week_total_hours,
        r.is_overtime ? "YES" : "NO",
        '"' + (r.job_location || "").replace(/"/g, '""') + '"',
        '"' + (r.notes || "").replace(/"/g, '""') + '"',
        r.submitted_at,
      ].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "work-tickets-" + todayStr() + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLogout() {
    document.cookie = "admin_authenticated=; path=/; max-age=0";
    document.cookie = "admin_token=; path=/; max-age=0";
    router.push("/login");
  }

  const tOpts = timeOptions();

  if (loading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-[#00467F] flex items-center justify-center">
        <div className="text-white/60 text-sm">{s.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00467F]">
      {/* Header */}
      <div className="bg-[#003460]/80 backdrop-blur-sm border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src="https://duraport.net/wp-content/uploads/2026/01/duraport-logo.svg" alt="DuraPort" className="h-5 opacity-90 flex-shrink-0" />
            <span className="text-white/90 font-semibold text-sm">{s.workTickets}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <button onClick={() => handleLangChange("en")} className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-md font-medium transition-colors ${lang === "en" ? "bg-[#F37C05] text-white" : "bg-white/5 text-white/40 hover:bg-white/10"}`}>EN</button>
              <button onClick={() => handleLangChange("es")} className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-md font-medium transition-colors ${lang === "es" ? "bg-[#F37C05] text-white" : "bg-white/5 text-white/40 hover:bg-white/10"}`}>ES</button>
            </div>
            <button onClick={handleLogout} className="text-white/40 hover:text-white/80 text-xs font-medium tracking-wide transition-colors">{s.signOut}</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Filter Toggle (mobile) */}
        <div className="md:hidden mb-3">
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="flex items-center gap-2 text-white/60 text-xs font-medium uppercase tracking-wider">
            <svg className={`w-3 h-3 transition-transform ${filtersOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            {filtersOpen ? s.hideFilters : s.showFilters}
            {(selectedEmployees.length > 0 || selectedLocations.length > 0 || overtimeOnly || datePreset !== "thisWeek") && (
              <span className="bg-[#F37C05]/20 text-[#F37C05] px-1.5 py-0.5 rounded text-[10px]">●</span>
            )}
          </button>
        </div>

        {/* Filter Bar */}
        <div className={`${filtersOpen ? "block" : "hidden"} md:block bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-5`}>
          <div className="flex flex-wrap gap-3 items-start">
            {/* Date Preset */}
            <div className="flex-shrink-0">
              <label className="block text-white/30 text-[10px] font-medium mb-1.5 uppercase tracking-wider">{s.dateRange}</label>
              <div className="flex gap-1 flex-wrap">
                {(["today", "thisWeek", "lastWeek", "all", "custom"] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setDatePreset(preset)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                      datePreset === preset
                        ? "bg-[#F37C05] text-white"
                        : "bg-white/5 text-white/40 hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    {preset === "thisWeek" ? s.thisWeek : preset === "lastWeek" ? s.lastWeek : preset === "all" ? s.allTime : preset === "custom" ? s.custom : s.today}
                  </button>
                ))}
              </div>
              {datePreset === "custom" && (
                <div className="flex gap-2 mt-2">
                  <div>
                    <label className="block text-white/20 text-[10px] mb-1">{s.from}</label>
                    <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#F37C05]/50" style={{ colorScheme: "dark" }} />
                  </div>
                  <div>
                    <label className="block text-white/20 text-[10px] mb-1">{s.to}</label>
                    <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#F37C05]/50" style={{ colorScheme: "dark" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Employee Multi-Select */}
            <div className="flex-shrink-0 relative" ref={empDropRef}>
              <label className="block text-white/30 text-[10px] font-medium mb-1.5 uppercase tracking-wider">{s.employees}</label>
              <button
                onClick={() => { setEmpDropOpen(!empDropOpen); setLocDropOpen(false); }}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 transition-colors min-w-[160px] text-left flex items-center justify-between gap-2"
              >
                <span className="truncate">{selectedEmployees.length === 0 ? s.allEmployees : selectedEmployees.length + " " + s.selected}</span>
                <svg className={`w-3 h-3 transition-transform flex-shrink-0 ${empDropOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {empDropOpen && (
                <div className="absolute top-full left-0 mt-1 bg-[#002a4d] border border-white/10 rounded-xl shadow-2xl z-40 min-w-[200px] max-h-60 overflow-y-auto">
                  {employees.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 cursor-pointer text-xs text-white/70">
                      <input type="checkbox" checked={selectedEmployees.includes(emp.id)} onChange={() => toggleEmployee(emp.id)} className="rounded border-white/20 bg-white/5 text-[#F37C05] focus:ring-[#F37C05]/30 w-3.5 h-3.5" />
                      <span className="truncate">{emp.name}</span>
                    </label>
                  ))}
                  {employees.length === 0 && <div className="px-3 py-2 text-white/30 text-xs">—</div>}
                </div>
              )}
            </div>

            {/* Location Multi-Select */}
            <div className="flex-shrink-0 relative" ref={locDropRef}>
              <label className="block text-white/30 text-[10px] font-medium mb-1.5 uppercase tracking-wider">{s.locations}</label>
              <button
                onClick={() => { setLocDropOpen(!locDropOpen); setEmpDropOpen(false); }}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 transition-colors min-w-[160px] text-left flex items-center justify-between gap-2"
              >
                <span className="truncate">{selectedLocations.length === 0 ? s.allLocations : selectedLocations.length + " " + s.selected}</span>
                <svg className={`w-3 h-3 transition-transform flex-shrink-0 ${locDropOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {locDropOpen && (
                <div className="absolute top-full left-0 mt-1 bg-[#002a4d] border border-white/10 rounded-xl shadow-2xl z-40 min-w-[200px] max-h-60 overflow-y-auto">
                  {locations.map((loc) => (
                    <label key={loc} className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 cursor-pointer text-xs text-white/70">
                      <input type="checkbox" checked={selectedLocations.includes(loc)} onChange={() => toggleLocation(loc)} className="rounded border-white/20 bg-white/5 text-[#F37C05] focus:ring-[#F37C05]/30 w-3.5 h-3.5" />
                      <span className="truncate">{loc}</span>
                    </label>
                  ))}
                  {locations.length === 0 && <div className="px-3 py-2 text-white/30 text-xs">—</div>}
                </div>
              )}
            </div>

            {/* Overtime Toggle */}
            <div className="flex-shrink-0">
              <label className="block text-white/30 text-[10px] font-medium mb-1.5 uppercase tracking-wider">&nbsp;</label>
              <button
                onClick={() => setOvertimeOnly(!overtimeOnly)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  overtimeOnly
                    ? "bg-amber-500/20 border border-amber-500/30 text-amber-300"
                    : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10"
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {s.overtimeOnly}
              </button>
            </div>

            {/* Clear All */}
            <div className="flex-shrink-0">
              <label className="block text-white/30 text-[10px] font-medium mb-1.5 uppercase tracking-wider">&nbsp;</label>
              <button onClick={clearFilters} className="px-3 py-1.5 text-xs rounded-lg font-medium bg-white/5 border border-white/10 text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors">{s.clearAll}</button>
            </div>

            {/* Export */}
            <div className="flex-shrink-0 ml-auto">
              <label className="block text-white/30 text-[10px] font-medium mb-1.5 uppercase tracking-wider">&nbsp;</label>
              <button onClick={exportCSV} className="px-3 py-1.5 text-xs rounded-lg font-medium bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {s.exportCSV}
              </button>
            </div>
          </div>

          {/* Saved Filters */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/5">
            <span className="text-white/20 text-[10px] uppercase tracking-wider font-medium">{s.savedFilters}:</span>
            {savedFilters.map((f, i) => (
              <div key={i} className="flex items-center gap-1 bg-white/5 rounded-lg">
                <button onClick={() => loadFilter(f)} className="px-2.5 py-1 text-[11px] text-white/50 hover:text-white/80 transition-colors">{f.name}</button>
                <button onClick={() => deleteFilter(i)} className="px-1.5 py-1 text-white/20 hover:text-red-400 text-[10px] transition-colors">✕</button>
              </div>
            ))}
            {!showSaveInput ? (
              <button onClick={() => setShowSaveInput(true)} className="text-[10px] text-[#F37C05]/60 hover:text-[#F37C05] transition-colors">+ {s.saveCurrentFilter}</button>
            ) : (
              <div className="flex items-center gap-1">
                <input type="text" value={filterNameInput} onChange={(e) => setFilterNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveFilter()} placeholder={s.filterName} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white/70 placeholder-white/20 focus:outline-none focus:border-[#F37C05]/50 w-32" autoFocus />
                <button onClick={saveFilter} className="text-[10px] text-[#F37C05] hover:text-[#F37C05]/80 font-medium">{s.save}</button>
                <button onClick={() => { setShowSaveInput(false); setFilterNameInput(""); }} className="text-[10px] text-white/30 hover:text-white/60">✕</button>
              </div>
            )}
          </div>
        </div>

        {/* Overtime Summary Banner */}
        {otSummary.count > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-3">
            <div className="bg-amber-500/20 rounded-lg p-1.5">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <span className="text-amber-300 text-xs">
              <span className="font-semibold">{otSummary.count}</span> {lang === "en" ? "employee(s) with overtime" : "empleado(s) con horas extra"} — <span className="font-semibold">{otSummary.hours}</span> {lang === "en" ? "total OT hours in view" : "horas extra totales a la vista"}
            </span>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/30 text-xs">{reports.length} {lang === "en" ? "reports" : "reportes"}{loading ? " …" : ""}</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.03]">
                {[
                  { key: "report_date", label: s.date },
                  { key: "employee_name", label: s.employee },
                  { key: "start_time", label: s.startTime },
                  { key: "stop_time", label: s.stopTime },
                  { key: "hours_worked", label: s.hours },
                  { key: "week_total_hours", label: s.weekHrs },
                  { key: "job_location", label: s.jobLocation },
                  { key: "notes", label: s.notes },
                  { key: "submitted_at", label: s.submitted },
                ].map((col) => (
                  <th key={col.key} onClick={() => handleSort(col.key)} className="px-3 py-2.5 text-[10px] text-white/30 uppercase tracking-wider font-medium cursor-pointer hover:text-white/60 transition-colors select-none whitespace-nowrap">
                    {col.label}<span className="text-[#F37C05]/60">{sortArrow(col.key)}</span>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-[10px] text-white/30 uppercase tracking-wider font-medium">{s.actions}</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && !loading && (
                <tr><td colSpan={10} className="text-center py-10 text-white/30 text-sm">{s.noReports}</td></tr>
              )}
              {reports.map((r) => {
                const isEditing = editingId === r.id;
                const otRow = r.is_overtime;
                return (
                  <tr key={r.id} className={`border-t border-white/5 transition-colors ${otRow ? "bg-amber-500/[0.04] hover:bg-amber-500/[0.08]" : "hover:bg-white/[0.03]"}`}>
                    <td className="px-3 py-2.5 text-sm text-white/80 whitespace-nowrap">
                      {isEditing ? (
                        <input type="date" value={editData.report_date} onChange={(e) => setEditData({ ...editData, report_date: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F37C05]/50 w-32" style={{ colorScheme: "dark" }} />
                      ) : formatDate(r.report_date)}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-white/80 whitespace-nowrap">
                      <div>{r.employee_name}</div>
                      <div className="text-[10px] text-white/30">{r.employee_custom_id}</div>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-white/60 whitespace-nowrap">
                      {isEditing ? (
                        <select value={editData.start_time} onChange={(e) => setEditData({ ...editData, start_time: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F37C05]/50" style={{ colorScheme: "dark" }}>
                          {tOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : formatTime12(r.start_time)}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-white/60 whitespace-nowrap">
                      {isEditing ? (
                        <select value={editData.stop_time} onChange={(e) => setEditData({ ...editData, stop_time: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F37C05]/50" style={{ colorScheme: "dark" }}>
                          {tOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : formatTime12(r.stop_time)}
                    </td>
                    <td className="px-3 py-2.5 text-sm font-medium whitespace-nowrap">
                      <span className={otRow ? "text-amber-400" : "text-[#F37C05]/80"}>
                        {isEditing ? (
                          <input type="number" step="0.25" value={editData.hours_worked} onChange={(e) => setEditData({ ...editData, hours_worked: parseFloat(e.target.value) || 0 })} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F37C05]/50 w-16" />
                        ) : r.hours_worked + "h"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={otRow ? "text-amber-400 font-medium" : "text-white/40"}>{r.week_total_hours}h</span>
                        {otRow && <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{s.otBadge}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-white/60 max-w-[200px] truncate">
                      {isEditing ? (
                        <input type="text" value={editData.job_location} onChange={(e) => setEditData({ ...editData, job_location: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F37C05]/50 w-full" />
                      ) : r.job_location}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-white/40 max-w-[150px] truncate">
                      {isEditing ? (
                        <input type="text" value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#F37C05]/50 w-full" />
                      ) : r.notes || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-white/30 whitespace-nowrap">{formatDateTime(r.submitted_at)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex gap-1.5">
                          <button onClick={saveEditHandler} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium">{s.saveEdit}</button>
                          <button onClick={() => setEditingId(null)} className="text-[10px] text-white/30 hover:text-white/60">{s.cancelEdit}</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(r)} className="text-[10px] text-[#F37C05]/60 hover:text-[#F37C05] font-medium transition-colors">{s.edit}</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Employee Summary */}
        {empSummary.length > 0 && (
          <div className="mt-6">
            <h3 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">{s.employeeSummary}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {empSummary.map((emp) => (
                <div key={emp.id} className={`rounded-xl px-4 py-3 border ${emp.hasOvertime ? "bg-amber-500/[0.06] border-amber-500/15" : "bg-white/[0.03] border-white/5"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/80 text-sm font-medium truncate">{emp.name}</span>
                    {emp.hasOvertime && <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ml-2 flex-shrink-0">{s.otBadge}</span>}
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className="text-white/30">{s.totalHours}: </span>
                      <span className={emp.hasOvertime ? "text-amber-400 font-medium" : "text-[#F37C05]/80 font-medium"}>{emp.hours}h</span>
                    </div>
                    <div>
                      <span className="text-white/30">{s.tickets}: </span>
                      <span className="text-white/60">{emp.count}</span>
                    </div>
                    <div>
                      <span className="text-white/30">{s.weeklyAvg}: </span>
                      <span className="text-white/60">{emp.weeklyAvg}h</span>
                    </div>
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
