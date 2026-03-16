"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Punch {
  id: string;
  type: string;
  timestamp: string;
  gps_lat: number | null;
  gps_lng: number | null;
  employees: { employee_id: string; name: string };
}

interface Ticket {
  id: string;
  notes: string;
  status: string;
  submitted_at: string;
  employees: { employee_id: string; name: string };
}

interface Report {
  id: string;
  report_date: string;
  project_name: string;
  site_address: string;
  additional_notes: string;
  submitted_at: string;
  employees: { employee_id: string; name: string };
}

interface CrewEntry {
  report_id: string;
  employee_id: string;
  hours_regular: number;
  hours_overtime: number;
  employees: { employee_id: string; name: string };
}

interface ReportDetail {
  report: Report & {
    project_number: string;
    weather_conditions: string;
    temperature_range: string;
    work_description: string;
    gps_lat: number | null;
    gps_lng: number | null;
    foreman_confirmed: boolean;
  };
  crew: Array<{
    id: string;
    hours_regular: number;
    hours_overtime: number;
    role_on_site: string;
    employees: { employee_id: string; name: string };
  }>;
  equipment: Array<{ id: string; equipment_name: string; hours_used: number; operator_name: string }>;
  materials: Array<{ id: string; material_description: string; quantity: number; unit: string }>;
  subcontractors: Array<{ id: string; company_name: string; trade: string; worker_count: number }>;
  photos: Array<{ id: string; storage_path: string; caption: string }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"punches" | "tickets" | "reports">("punches");
  const [punches, setPunches] = useState<Punch[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [crewByReport, setCrewByReport] = useState<Record<string, CrewEntry[]>>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingPunch, setEditingPunch] = useState<string | null>(null);
  const [editTime, setEditTime] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "summary">("summary");

  const fetchPunches = useCallback(async () => {
    const params = new URLSearchParams();
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    const res = await fetch(`/time/api/admin/punches?${params}`);
    if (res.ok) {
      const data = await res.json();
      setPunches(data.punches || []);
    }
  }, [startDate, endDate]);

  const fetchTickets = useCallback(async () => {
    const res = await fetch("/time/api/admin/tickets");
    if (res.ok) {
      const data = await res.json();
      setTickets(data.tickets || []);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    const params = new URLSearchParams();
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    const res = await fetch(`/time/api/admin/reports?${params}`);
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports || []);
      setCrewByReport(data.crewByReport || {});
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchPunches();
    fetchTickets();
    fetchReports();
  }, [fetchPunches, fetchTickets, fetchReports]);

  // Set default date range to current week
  useEffect(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    setStartDate(monday.toISOString().split("T")[0]);
    setEndDate(sunday.toISOString().split("T")[0]);
  }, []);

  async function handleLogout() {
    await fetch("/time/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  async function handleEditPunch(id: string) {
    const res = await fetch("/time/api/admin/punches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, timestamp: editTime }),
    });
    if (res.ok) {
      setEditingPunch(null);
      fetchPunches();
    }
  }

  async function handleTicketStatus(id: string, status: string) {
    const res = await fetch("/time/api/admin/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) fetchTickets();
  }

  async function handleExport() {
    const params = new URLSearchParams();
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    window.open(`/time/api/admin/export?${params}`, "_blank");
  }

  async function handlePayrollExport() {
    const params = new URLSearchParams();
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    window.open(`/time/api/admin/payroll-export?${params}`, "_blank");
  }

  async function viewReport(id: string) {
    const res = await fetch(`/time/api/admin/reports?id=${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedReport(data);
    }
  }

  // Build daily hours summary from crew data
  function getDailyHoursSummary() {
    const summary: Record<string, { name: string; empId: string; date: string; project: string; regular: number; overtime: number }> = {};

    for (const report of reports) {
      const crew = crewByReport[report.id] || [];
      for (const c of crew) {
        const key = `${c.employee_id}-${report.report_date}`;
        if (!summary[key]) {
          summary[key] = {
            name: c.employees?.name || "Unknown",
            empId: c.employees?.employee_id || "?",
            date: report.report_date,
            project: report.project_name || "",
            regular: 0,
            overtime: 0,
          };
        }
        summary[key].regular += c.hours_regular || 0;
        summary[key].overtime += c.hours_overtime || 0;
      }
    }

    return Object.values(summary).sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.name.localeCompare(b.name);
    });
  }

  // Build weekly totals per employee
  function getWeeklyTotals() {
    const totals: Record<string, { name: string; empId: string; regular: number; overtime: number; days: number }> = {};

    for (const report of reports) {
      const crew = crewByReport[report.id] || [];
      for (const c of crew) {
        const key = c.employee_id;
        if (!totals[key]) {
          totals[key] = {
            name: c.employees?.name || "Unknown",
            empId: c.employees?.employee_id || "?",
            regular: 0,
            overtime: 0,
            days: 0,
          };
        }
        totals[key].regular += c.hours_regular || 0;
        totals[key].overtime += c.hours_overtime || 0;
      }
    }

    // Count unique days per employee
    const daysSeen: Record<string, Set<string>> = {};
    for (const report of reports) {
      const crew = crewByReport[report.id] || [];
      for (const c of crew) {
        if (!daysSeen[c.employee_id]) daysSeen[c.employee_id] = new Set();
        daysSeen[c.employee_id].add(report.report_date);
      }
    }
    for (const key of Object.keys(totals)) {
      totals[key].days = daysSeen[key]?.size || 0;
    }

    return Object.values(totals).sort((a, b) => a.name.localeCompare(b.name));
  }

  const dailyHours = getDailyHoursSummary();
  const weeklyTotals = getWeeklyTotals();
  const grandRegular = weeklyTotals.reduce((s, e) => s + e.regular, 0);
  const grandOT = weeklyTotals.reduce((s, e) => s + e.overtime, 0);

  const inputClass = "p-2 bg-[#00467F] border border-blue-600/50 rounded text-white text-sm";

  return (
    <div className="min-h-screen bg-[#00467F] text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-3">
            <a href="/time/admin/employees" className="px-3 py-1.5 bg-[#003460] hover:bg-[#00569C] rounded text-sm">
              Manage Employees
            </a>
            <button onClick={handleLogout} className="px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded text-sm">
              Logout
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex gap-3 mb-4 flex-wrap items-center">
          <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span className="text-blue-300 text-sm">to</span>
          <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <button onClick={() => { fetchPunches(); fetchReports(); }} className="px-3 py-1.5 bg-[#F37C05] hover:bg-[#E06E00] rounded text-sm font-medium">
            Filter
          </button>
          {tab === "punches" && (
            <button onClick={handleExport} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm">
              Export Punches CSV
            </button>
          )}
          {tab === "reports" && !selectedReport && (
            <button onClick={handlePayrollExport} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-medium">
              Export Payroll CSV
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          <button onClick={() => { setTab("punches"); setSelectedReport(null); }}
            className={`px-4 py-2 rounded-t text-sm font-medium ${tab === "punches" ? "bg-[#003460] text-white border-b-2 border-[#F37C05]" : "bg-[#003460]/50 text-blue-300"}`}>
            Time Punches
          </button>
          <button onClick={() => { setTab("tickets"); setSelectedReport(null); }}
            className={`px-4 py-2 rounded-t text-sm font-medium ${tab === "tickets" ? "bg-[#003460] text-white border-b-2 border-[#F37C05]" : "bg-[#003460]/50 text-blue-300"}`}>
            Work Tickets
          </button>
          <button onClick={() => { setTab("reports"); setSelectedReport(null); }}
            className={`px-4 py-2 rounded-t text-sm font-medium relative ${tab === "reports" ? "bg-[#003460] text-white border-b-2 border-[#F37C05]" : "bg-[#003460]/50 text-blue-300"}`}>
            Daily Hours
            {reports.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-[#F37C05] text-xs rounded-full">{reports.length}</span>
            )}
          </button>
        </div>

        {/* Punches Tab */}
        {tab === "punches" && (
          <div className="bg-[#003460] rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-700/30 text-blue-200">
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Timestamp</th>
                  <th className="p-3 text-left">GPS</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {punches.map((p) => (
                  <tr key={p.id} className="border-b border-blue-700/30 hover:bg-[#00467F]/30">
                    <td className="p-3">{p.employees?.name} ({p.employees?.employee_id})</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${p.type === "clock_in" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                        {p.type === "clock_in" ? "IN" : "OUT"}
                      </span>
                    </td>
                    <td className="p-3">
                      {editingPunch === p.id ? (
                        <input type="datetime-local" className={inputClass} value={editTime} onChange={(e) => setEditTime(e.target.value)} />
                      ) : (
                        new Date(p.timestamp).toLocaleString()
                      )}
                    </td>
                    <td className="p-3 text-xs">{p.gps_lat ? `${p.gps_lat.toFixed(4)}, ${p.gps_lng?.toFixed(4)}` : "N/A"}</td>
                    <td className="p-3">
                      {editingPunch === p.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleEditPunch(p.id)} className="px-2 py-0.5 bg-green-600 rounded text-xs">Save</button>
                          <button onClick={() => setEditingPunch(null)} className="px-2 py-0.5 bg-gray-600 rounded text-xs">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingPunch(p.id); setEditTime(p.timestamp.slice(0, 16)); }}
                          className="px-2 py-0.5 bg-gray-600 hover:bg-gray-500 rounded text-xs">
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {punches.length === 0 && <p className="p-6 text-center text-blue-300/60">No punches found</p>}
          </div>
        )}

        {/* Tickets Tab */}
        {tab === "tickets" && (
          <div className="bg-[#003460] rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-700/30 text-blue-200">
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Notes</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-blue-700/30 hover:bg-[#00467F]/30">
                    <td className="p-3">{t.employees?.name}</td>
                    <td className="p-3 max-w-xs truncate">{t.notes}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${t.status === "open" ? "bg-yellow-900 text-yellow-300" : t.status === "in_progress" ? "bg-blue-900 text-blue-300" : "bg-gray-600 text-blue-100"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{new Date(t.submitted_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {t.status === "open" && (
                          <button onClick={() => handleTicketStatus(t.id, "in_progress")} className="px-2 py-0.5 bg-[#F37C05] rounded text-xs">Mark Reviewed</button>
                        )}
                        {t.status !== "resolved" && (
                          <button onClick={() => handleTicketStatus(t.id, "resolved")} className="px-2 py-0.5 bg-gray-600 rounded text-xs">Close</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tickets.length === 0 && <p className="p-6 text-center text-blue-300/60">No tickets found</p>}
          </div>
        )}

        {/* Daily Hours Tab */}
        {tab === "reports" && !selectedReport && (
          <div className="space-y-4">
            {/* View toggle */}
            <div className="flex gap-2">
              <button onClick={() => setViewMode("summary")}
                className={`px-3 py-1.5 rounded text-sm font-medium ${viewMode === "summary" ? "bg-[#F37C05]" : "bg-[#003460] text-blue-300"}`}>
                Weekly Summary
              </button>
              <button onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded text-sm font-medium ${viewMode === "list" ? "bg-[#F37C05]" : "bg-[#003460] text-blue-300"}`}>
                Daily Detail
              </button>
            </div>

            {/* Weekly Summary View */}
            {viewMode === "summary" && (
              <div className="bg-[#003460] rounded overflow-x-auto">
                <div className="p-4 border-b border-blue-700/30">
                  <h3 className="font-semibold text-lg">Weekly Hours Summary</h3>
                  <p className="text-sm text-blue-300">{startDate} to {endDate}</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-blue-700/30 text-blue-200">
                      <th className="p-3 text-left">Employee</th>
                      <th className="p-3 text-left">ID</th>
                      <th className="p-3 text-right">Days</th>
                      <th className="p-3 text-right">Regular Hrs</th>
                      <th className="p-3 text-right">OT Hrs</th>
                      <th className="p-3 text-right">Total Hrs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyTotals.map((emp) => (
                      <tr key={emp.empId} className="border-b border-blue-700/30 hover:bg-[#00467F]/30">
                        <td className="p-3 font-medium">{emp.name}</td>
                        <td className="p-3 text-blue-300">{emp.empId}</td>
                        <td className="p-3 text-right">{emp.days}</td>
                        <td className="p-3 text-right">{emp.regular}</td>
                        <td className="p-3 text-right text-[#F37C05] font-medium">{emp.overtime > 0 ? emp.overtime : "—"}</td>
                        <td className="p-3 text-right font-bold">{emp.regular + emp.overtime}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#F37C05] bg-[#00467F]/50 font-bold">
                      <td className="p-3" colSpan={3}>TOTALS</td>
                      <td className="p-3 text-right">{grandRegular}</td>
                      <td className="p-3 text-right text-[#F37C05]">{grandOT > 0 ? grandOT : "—"}</td>
                      <td className="p-3 text-right text-lg">{grandRegular + grandOT}</td>
                    </tr>
                  </tfoot>
                </table>
                {weeklyTotals.length === 0 && <p className="p-6 text-center text-blue-300/60">No hours reported for this period</p>}
              </div>
            )}

            {/* Daily Detail View */}
            {viewMode === "list" && (
              <div className="bg-[#003460] rounded overflow-x-auto">
                <div className="p-4 border-b border-blue-700/30">
                  <h3 className="font-semibold text-lg">Daily Hours Detail</h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-blue-700/30 text-blue-200">
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Employee</th>
                      <th className="p-3 text-left">Job / Location</th>
                      <th className="p-3 text-right">Regular</th>
                      <th className="p-3 text-right">OT</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyHours.map((row, i) => (
                      <tr key={i} className="border-b border-blue-700/30 hover:bg-[#00467F]/30">
                        <td className="p-3">{row.date}</td>
                        <td className="p-3 font-medium">{row.name} <span className="text-blue-400 text-xs">({row.empId})</span></td>
                        <td className="p-3 text-blue-200">{row.project}</td>
                        <td className="p-3 text-right">{row.regular}</td>
                        <td className="p-3 text-right text-[#F37C05] font-medium">{row.overtime > 0 ? row.overtime : "—"}</td>
                        <td className="p-3 text-right font-bold">{row.regular + row.overtime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dailyHours.length === 0 && <p className="p-6 text-center text-blue-300/60">No hours reported for this period</p>}
              </div>
            )}

            {/* Reports list for drill-down */}
            {reports.length > 0 && (
              <div className="bg-[#003460] rounded">
                <div className="p-4 border-b border-blue-700/30">
                  <h3 className="font-semibold">Submitted Reports ({reports.length})</h3>
                </div>
                <div className="divide-y divide-blue-700/30">
                  {reports.map((r) => {
                    const crew = crewByReport[r.id] || [];
                    const totalReg = crew.reduce((s, c) => s + (c.hours_regular || 0), 0);
                    const totalOt = crew.reduce((s, c) => s + (c.hours_overtime || 0), 0);
                    return (
                      <div key={r.id} className="p-3 hover:bg-[#00467F]/30 flex items-center justify-between cursor-pointer" onClick={() => viewReport(r.id)}>
                        <div>
                          <div className="text-sm font-medium">{r.report_date} — {r.project_name}</div>
                          <div className="text-xs text-blue-300">by {r.employees?.name} • {crew.length} crew • {totalReg}h reg{totalOt > 0 ? ` + ${totalOt}h OT` : ""}</div>
                          {r.additional_notes && <div className="text-xs text-blue-400 mt-1 truncate max-w-md">{r.additional_notes}</div>}
                        </div>
                        <span className="text-blue-400 text-sm">›</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Report Detail View */}
        {tab === "reports" && selectedReport && (
          <div className="bg-[#003460] rounded p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Report Detail</h2>
              <button onClick={() => setSelectedReport(null)} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-sm">Back to List</button>
            </div>

            {/* Job Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-blue-200">Date:</span> {selectedReport.report.report_date}</div>
              <div><span className="text-blue-200">Submitted by:</span> {selectedReport.report.employees?.name}</div>
              <div><span className="text-blue-200">Project:</span> {selectedReport.report.project_name} {selectedReport.report.project_number && `(#${selectedReport.report.project_number})`}</div>
              <div><span className="text-blue-200">Site:</span> {selectedReport.report.site_address || "N/A"}</div>
              {selectedReport.report.gps_lat && (
                <div><span className="text-blue-200">GPS:</span> {selectedReport.report.gps_lat.toFixed(5)}, {selectedReport.report.gps_lng?.toFixed(5)}</div>
              )}
            </div>

            {/* Crew Hours */}
            {selectedReport.crew.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-blue-200 mb-2">Crew Hours ({selectedReport.crew.length})</h3>
                <div className="bg-[#00467F] rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-blue-600/30 text-blue-300">
                        <th className="p-2 text-left">Employee</th>
                        <th className="p-2 text-right">Regular</th>
                        <th className="p-2 text-right">OT</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.crew.map((c) => (
                        <tr key={c.id} className="border-b border-blue-600/20">
                          <td className="p-2">{c.employees?.name || "Unknown"}{c.role_on_site ? ` — ${c.role_on_site}` : ""}</td>
                          <td className="p-2 text-right">{c.hours_regular}h</td>
                          <td className="p-2 text-right text-[#F37C05]">{c.hours_overtime > 0 ? `${c.hours_overtime}h` : "—"}</td>
                          <td className="p-2 text-right font-bold">{c.hours_regular + c.hours_overtime}h</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-blue-500/50 font-bold">
                        <td className="p-2">Total</td>
                        <td className="p-2 text-right">{selectedReport.crew.reduce((s, c) => s + c.hours_regular, 0)}h</td>
                        <td className="p-2 text-right text-[#F37C05]">{selectedReport.crew.reduce((s, c) => s + c.hours_overtime, 0)}h</td>
                        <td className="p-2 text-right">{selectedReport.crew.reduce((s, c) => s + c.hours_regular + c.hours_overtime, 0)}h</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedReport.report.additional_notes && (
              <div>
                <h3 className="text-sm font-semibold text-blue-200 mb-1">Notes</h3>
                <p className="text-sm bg-[#00467F] p-3 rounded">{selectedReport.report.additional_notes}</p>
              </div>
            )}

            {/* Work Description (legacy) */}
            {selectedReport.report.work_description && (
              <div>
                <h3 className="text-sm font-semibold text-blue-200 mb-1">Work Description</h3>
                <p className="text-sm bg-[#00467F] p-3 rounded">{selectedReport.report.work_description}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}