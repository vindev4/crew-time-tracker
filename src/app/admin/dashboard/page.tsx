"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"today" | "week" | "all">("week");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Report>>({});

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
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  async function saveEdit(id: string) {
    const res = await fetch("/time/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editData }),
    });
    if (res.ok) {
      setEditingId(null);
      setEditData({});
      fetchReports();
    }
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
    const headers = ["Date", "Employee ID", "Employee Name", "Start Time", "Stop Time", "Hours", "Job/Location", "Notes", "Submitted"];
    const rows = filtered.map((r) => [
      r.report_date,
      r.employee_id,
      r.employee_name,
      r.start_time || "",
      r.stop_time || "",
      r.hours_worked?.toString() || "",
      (r.job_location || "").replace(/,/g, ";"),
      (r.notes || "").replace(/,/g, ";").replace(/\n/g, " "),
      r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "",
    ]);

    const totalHours = filtered.reduce((sum, r) => sum + (r.hours_worked || 0), 0);
    rows.push(["", "", "", "", "TOTAL", totalHours.toFixed(1), "", "", ""]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    a.download = `work-tickets-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = reports.filter(
    (r) =>
      r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_id?.includes(search) ||
      r.job_location?.toLowerCase().includes(search.toLowerCase())
  );

  const totalHours = filtered.reduce((sum, r) => sum + (r.hours_worked || 0), 0);

  // Weekly summary by employee
  const summary: Record<string, { name: string; hours: number; tickets: number }> = {};
  filtered.forEach((r) => {
    if (!summary[r.employee_id]) {
      summary[r.employee_id] = { name: r.employee_name, hours: 0, tickets: 0 };
    }
    summary[r.employee_id].hours += r.hours_worked || 0;
    summary[r.employee_id].tickets += 1;
  });

  const inputClass = "p-1.5 bg-[#00467F] border border-blue-600/50 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#F37C05]";

  return (
    <div className="min-h-screen bg-[#00467F] text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Work Tickets</h1>
            <p className="text-blue-300 text-sm">{filtered.length} tickets / {totalHours.toFixed(1)} total hours</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href="/time/admin/employees" className="px-3 py-1.5 bg-[#003460] hover:bg-[#00569C] rounded text-sm">
              Employees
            </a>
            <button onClick={exportCSV} className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-sm font-medium">
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap items-center">
          <div className="flex bg-[#003460] rounded overflow-hidden">
            {(["today", "week", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm capitalize ${dateRange === range ? "bg-[#F37C05] text-white" : "text-blue-200 hover:bg-[#00569C]"}`}
              >
                {range === "week" ? "This Week" : range === "today" ? "Today" : "All Time"}
              </button>
            ))}
          </div>
          <input
            className={inputClass + " w-64"}
            placeholder="Search by name, ID, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Weekly Summary */}
        {Object.keys(summary).length > 0 && (
          <div className="bg-[#003460] rounded-lg p-4 mb-4">
            <h2 className="text-sm font-semibold text-blue-200 mb-2">Summary by Employee</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Object.entries(summary)
                .sort((a, b) => b[1].hours - a[1].hours)
                .map(([empId, data]) => (
                  <div key={empId} className="bg-[#00467F]/50 rounded p-2 text-center">
                    <p className="text-xs text-blue-300 truncate">{data.name}</p>
                    <p className="text-lg font-bold text-[#F37C05]">{data.hours.toFixed(1)}h</p>
                    <p className="text-xs text-blue-400">{data.tickets} ticket{data.tickets !== 1 ? "s" : ""}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tickets Table */}
        <div className="bg-[#003460] rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-700/30 text-blue-200">
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-left">Start</th>
                <th className="p-3 text-left">Stop</th>
                <th className="p-3 text-center">Hours</th>
                <th className="p-3 text-left">Job / Location</th>
                <th className="p-3 text-left">Notes</th>
                <th className="p-3 text-left">Submitted</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-blue-700/30 hover:bg-[#00467F]/30">
                  {editingId === r.id ? (
                    <>
                      <td className="p-2">{r.report_date}</td>
                      <td className="p-2">
                        <span className="text-xs text-blue-300">{r.employee_id}</span> {r.employee_name}
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
                      <td className="p-2 text-xs text-blue-400">
                        {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => saveEdit(r.id)} className="px-2 py-0.5 bg-green-600 hover:bg-green-500 rounded text-xs">Save</button>
                          <button onClick={() => { setEditingId(null); setEditData({}); }} className="px-2 py-0.5 bg-gray-600 hover:bg-gray-500 rounded text-xs">Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3">{r.report_date}</td>
                      <td className="p-3">
                        <span className="text-xs text-blue-300 mr-1">{r.employee_id}</span>
                        <span className="font-medium">{r.employee_name}</span>
                      </td>
                      <td className="p-3">{r.start_time || "—"}</td>
                      <td className="p-3">{r.stop_time || "—"}</td>
                      <td className="p-3 text-center font-semibold text-[#F37C05]">{r.hours_worked?.toFixed(1) || "—"}</td>
                      <td className="p-3 max-w-[200px] truncate">{r.job_location || "—"}</td>
                      <td className="p-3 max-w-[200px] truncate text-blue-200">{r.notes || "—"}</td>
                      <td className="p-3 text-xs text-blue-400">
                        {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => startEdit(r)} className="px-2 py-0.5 bg-[#F37C05] hover:bg-[#E06E00] rounded text-xs">
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="p-6 text-center text-blue-300/60">Loading...</p>}
          {!loading && filtered.length === 0 && <p className="p-6 text-center text-blue-300/60">No work tickets found</p>}
        </div>
      </div>
    </div>
  );
}
