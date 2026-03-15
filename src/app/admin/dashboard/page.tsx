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
  work_description: string;
  weather_conditions: string;
  percent_complete: number;
  safety_briefing_held: boolean;
  incidents_occurred: boolean;
  foreman_confirmed: boolean;
  submitted_at: string;
  employees: { employee_id: string; name: string };
}

interface ReportDetail {
  report: Report & {
    project_number: string;
    site_address: string;
    temperature_range: string;
    weather_impacted_work: boolean;
    weather_impact_notes: string;
    work_type: string[];
    phase_of_work: string;
    delays_encountered: boolean;
    delay_notes: string;
    extra_work_ordered: boolean;
    extra_work_notes: string;
    ppe_compliant: boolean;
    incident_description: string;
    incident_reported_to: string;
    near_misses: boolean;
    near_miss_notes: string;
    hazards_identified: string;
    visitors_on_site: string;
    additional_notes: string;
    gps_lat: number | null;
    gps_lng: number | null;
  };
  crew: Array<{ id: string; hours_regular: number; hours_overtime: number; role_on_site: string; employees: { employee_id: string; name: string } }>;
  equipment: Array<{ id: string; equipment_name: string; equipment_id_number: string; hours_used: number; operator_name: string; equipment_issues: string }>;
  materials: Array<{ id: string; material_description: string; quantity: number; unit: string; supplier: string }>;
  subcontractors: Array<{ id: string; company_name: string; trade: string; worker_count: number; work_description: string }>;
  photos: Array<{ id: string; storage_path: string; caption: string }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"punches" | "tickets" | "reports">("punches");
  const [punches, setPunches] = useState<Punch[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingPunch, setEditingPunch] = useState<string | null>(null);
  const [editTime, setEditTime] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);

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
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchPunches();
    fetchTickets();
    fetchReports();
  }, [fetchPunches, fetchTickets, fetchReports]);

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

  async function viewReport(id: string) {
    const res = await fetch(`/time/api/admin/reports?id=${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedReport(data);
    }
  }

  const inputClass = "p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-3">
            <a href="/time/admin/employees" className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm">
              Manage Employees
            </a>
            <button onClick={handleLogout} className="px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded text-sm">
              Logout
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <button onClick={() => { fetchPunches(); fetchReports(); }} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm">
            Filter
          </button>
          {tab === "punches" && (
            <button onClick={handleExport} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm">
              Export CSV
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          <button onClick={() => { setTab("punches"); setSelectedReport(null); }} className={`px-4 py-2 rounded-t text-sm font-medium ${tab === "punches" ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-400"}`}>
            Time Punches
          </button>
          <button onClick={() => { setTab("tickets"); setSelectedReport(null); }} className={`px-4 py-2 rounded-t text-sm font-medium ${tab === "tickets" ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-400"}`}>
            Work Tickets
          </button>
          <button onClick={() => { setTab("reports"); setSelectedReport(null); }} className={`px-4 py-2 rounded-t text-sm font-medium relative ${tab === "reports" ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-400"}`}>
            Field Reports
            {reports.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-blue-500 text-xs rounded-full">{reports.length}</span>
            )}
          </button>
        </div>

        {/* Punches Tab */}
        {tab === "punches" && (
          <div className="bg-gray-800 rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Timestamp</th>
                  <th className="p-3 text-left">GPS</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {punches.map((p) => (
                  <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
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
                        <button onClick={() => { setEditingPunch(p.id); setEditTime(p.timestamp.slice(0, 16)); }} className="px-2 py-0.5 bg-gray-600 hover:bg-gray-500 rounded text-xs">
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {punches.length === 0 && <p className="p-6 text-center text-gray-500">No punches found</p>}
          </div>
        )}

        {/* Tickets Tab */}
        {tab === "tickets" && (
          <div className="bg-gray-800 rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Notes</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="p-3">{t.employees?.name}</td>
                    <td className="p-3 max-w-xs truncate">{t.notes}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${t.status === "open" ? "bg-yellow-900 text-yellow-300" : t.status === "in_progress" ? "bg-blue-900 text-blue-300" : "bg-gray-600 text-gray-300"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{new Date(t.submitted_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {t.status === "open" && (
                          <button onClick={() => handleTicketStatus(t.id, "in_progress")} className="px-2 py-0.5 bg-blue-600 rounded text-xs">Mark Reviewed</button>
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
            {tickets.length === 0 && <p className="p-6 text-center text-gray-500">No tickets found</p>}
          </div>
        )}

        {/* Reports Tab */}
        {tab === "reports" && !selectedReport && (
          <div className="bg-gray-800 rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Submitted By</th>
                  <th className="p-3 text-left">Project</th>
                  <th className="p-3 text-left">Weather</th>
                  <th className="p-3 text-left">% Done</th>
                  <th className="p-3 text-left">Safety</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="p-3">{r.report_date}</td>
                    <td className="p-3">{r.employees?.name}</td>
                    <td className="p-3">{r.project_name}</td>
                    <td className="p-3 text-xs">{r.weather_conditions}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.percent_complete}%` }} />
                        </div>
                        <span className="text-xs">{r.percent_complete}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {r.incidents_occurred ? (
                        <span className="px-2 py-0.5 bg-red-900 text-red-300 rounded text-xs">Incident</span>
                      ) : r.safety_briefing_held ? (
                        <span className="px-2 py-0.5 bg-green-900 text-green-300 rounded text-xs">OK</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-yellow-900 text-yellow-300 rounded text-xs">No Briefing</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button onClick={() => viewReport(r.id)} className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-xs">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reports.length === 0 && <p className="p-6 text-center text-gray-500">No field reports found</p>}
          </div>
        )}

        {/* Report Detail View */}
        {tab === "reports" && selectedReport && (
          <div className="bg-gray-800 rounded p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Field Report Detail</h2>
              <button onClick={() => setSelectedReport(null)} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-sm">Back to List</button>
            </div>

            {/* Job Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-400">Date:</span> {selectedReport.report.report_date}</div>
              <div><span className="text-gray-400">Submitted by:</span> {selectedReport.report.employees?.name}</div>
              <div><span className="text-gray-400">Project:</span> {selectedReport.report.project_name} {selectedReport.report.project_number && `(#${selectedReport.report.project_number})`}</div>
              <div><span className="text-gray-400">Site:</span> {selectedReport.report.site_address || "N/A"}</div>
              <div><span className="text-gray-400">Weather:</span> {selectedReport.report.weather_conditions} / {selectedReport.report.temperature_range}</div>
              <div><span className="text-gray-400">Progress:</span> {selectedReport.report.percent_complete}%</div>
              {selectedReport.report.gps_lat && (
                <div><span className="text-gray-400">GPS:</span> {selectedReport.report.gps_lat.toFixed(5)}, {selectedReport.report.gps_lng?.toFixed(5)}</div>
              )}
              <div>
                <span className="text-gray-400">Confirmed:</span>{" "}
                {selectedReport.report.foreman_confirmed ? <span className="text-green-400">Yes</span> : <span className="text-yellow-400">No</span>}
              </div>
            </div>

            {/* Work */}
            {selectedReport.report.work_description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Work Performed</h3>
                <p className="text-sm bg-gray-900 p-3 rounded">{selectedReport.report.work_description}</p>
                {selectedReport.report.work_type?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {selectedReport.report.work_type.map((t: string) => (
                      <span key={t} className="px-2 py-0.5 bg-gray-700 rounded text-xs">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Crew */}
            {selectedReport.crew.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Crew ({selectedReport.crew.length})</h3>
                <div className="space-y-1">
                  {selectedReport.crew.map((c) => (
                    <div key={c.id} className="flex justify-between text-sm bg-gray-900 p-2 rounded">
                      <span>{c.employees?.name || "Unknown"} — {c.role_on_site}</span>
                      <span>{c.hours_regular}h reg {c.hours_overtime > 0 && `+ ${c.hours_overtime}h OT`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment */}
            {selectedReport.equipment.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Equipment ({selectedReport.equipment.length})</h3>
                <div className="space-y-1">
                  {selectedReport.equipment.map((e) => (
                    <div key={e.id} className="text-sm bg-gray-900 p-2 rounded">
                      {e.equipment_name} {e.equipment_id_number && `(#${e.equipment_id_number})`} — {e.hours_used}h — Op: {e.operator_name}
                      {e.equipment_issues && <span className="text-yellow-400 ml-2">Issue: {e.equipment_issues}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Materials */}
            {selectedReport.materials.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Materials ({selectedReport.materials.length})</h3>
                <div className="space-y-1">
                  {selectedReport.materials.map((m) => (
                    <div key={m.id} className="text-sm bg-gray-900 p-2 rounded">
                      {m.material_description} — {m.quantity} {m.unit} {m.supplier && `from ${m.supplier}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subcontractors */}
            {selectedReport.subcontractors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Subcontractors ({selectedReport.subcontractors.length})</h3>
                <div className="space-y-1">
                  {selectedReport.subcontractors.map((s) => (
                    <div key={s.id} className="text-sm bg-gray-900 p-2 rounded">
                      {s.company_name} ({s.trade}) — {s.worker_count} workers — {s.work_description}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Safety */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Safety</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Safety Briefing: {selectedReport.report.safety_briefing_held ? <span className="text-green-400">Yes</span> : <span className="text-red-400">No</span>}</div>
                <div>PPE Compliant: {selectedReport.report.ppe_compliant ? <span className="text-green-400">Yes</span> : <span className="text-red-400">No</span>}</div>
                <div>Incidents: {selectedReport.report.incidents_occurred ? <span className="text-red-400">Yes</span> : <span className="text-green-400">None</span>}</div>
                <div>Near Misses: {selectedReport.report.near_misses ? <span className="text-yellow-400">Yes</span> : <span className="text-green-400">None</span>}</div>
              </div>
              {selectedReport.report.incident_description && (
                <p className="text-sm bg-red-900/30 p-2 rounded mt-2 text-red-300">{selectedReport.report.incident_description}</p>
              )}
              {selectedReport.report.hazards_identified && (
                <p className="text-sm bg-gray-900 p-2 rounded mt-2">Hazards: {selectedReport.report.hazards_identified}</p>
              )}
            </div>

            {/* Notes */}
            {selectedReport.report.additional_notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Additional Notes</h3>
                <p className="text-sm bg-gray-900 p-3 rounded">{selectedReport.report.additional_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
