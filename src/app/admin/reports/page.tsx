"use client";

import { useState, useEffect, useCallback } from "react";

interface Report {
  id: string;
  report_date: string;
  project_name: string;
  project_number: string;
  site_address: string;
  weather_conditions: string;
  temperature_range: string;
  work_description: string;
  work_type: string[];
  phase_of_work: string;
  percent_complete: number;
  safety_briefing_held: boolean;
  incidents_occurred: boolean;
  foreman_confirmed: boolean;
  created_at: string;
  employees: { employee_id: string; name: string };
}

interface ReportDetail {
  report: Report;
  crew: Array<{ employee_id: string; hours_regular: number; hours_overtime: number; role_on_site: string; employees?: { name: string } }>;
  equipment: Array<{ equipment_name: string; hours_used: number; operator_name: string; equipment_issues: string }>;
  materials: Array<{ material_description: string; quantity: number; unit: string; supplier: string }>;
  subcontractors: Array<{ company_name: string; trade: string; worker_count: number; work_description: string }>;
  photos: Array<{ public_url: string; caption: string }>;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    let url = "/time/api/admin/reports?";
    if (startDate) url += `start=${startDate}&`;
    if (endDate) url += `end=${endDate}&`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports || []);
      }
    } catch {
      // error
    }
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function viewDetail(reportId: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/time/api/admin/reports?id=${reportId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedReport(data);
      }
    } catch {
      // error
    }
    setDetailLoading(false);
  }

  async function downloadExcel() {
    setExportLoading(true);
    try {
      let url = "/time/api/admin/export-reports?";
      if (startDate) url += `start=${startDate}&`;
      if (endDate) url += `end=${endDate}&`;

      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `field-reports-${startDate || "all"}-to-${endDate || "now"}.xlsx`;
        a.click();
      }
    } catch {
      // error
    }
    setExportLoading(false);
  }

  const inputClass = "p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm";

  if (selectedReport) {
    const r = selectedReport.report;
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setSelectedReport(null)}
            className="mb-4 text-blue-400 hover:text-blue-300 text-sm"
          >
            ← Back to Reports List
          </button>

          <h1 className="text-2xl font-bold mb-1">{r.project_name}</h1>
          <p className="text-gray-400 mb-4">
            {r.report_date} | By {r.employees?.name} ({r.employees?.employee_id})
          </p>

          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded">
              <h3 className="font-medium text-blue-400 mb-2">Job Site Info</h3>
              <p className="text-sm text-gray-300">Project #: {r.project_number || "N/A"}</p>
              <p className="text-sm text-gray-300">Address: {r.site_address || "N/A"}</p>
              <p className="text-sm text-gray-300">Weather: {r.weather_conditions} | {r.temperature_range}</p>
            </div>

            <div className="bg-gray-800 p-4 rounded">
              <h3 className="font-medium text-blue-400 mb-2">Work Performed</h3>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{r.work_description}</p>
              <p className="text-sm text-gray-400 mt-2">
                Types: {(r.work_type || []).join(", ")} | Phase: {r.phase_of_work} | {r.percent_complete}% complete
              </p>
            </div>

            {selectedReport.crew.length > 0 && (
              <div className="bg-gray-800 p-4 rounded">
                <h3 className="font-medium text-blue-400 mb-2">Crew ({selectedReport.crew.length})</h3>
                {selectedReport.crew.map((c, i) => (
                  <p key={i} className="text-sm text-gray-300">
                    {c.employees?.name || c.employee_id} — {c.hours_regular}h reg, {c.hours_overtime}h OT — {c.role_on_site}
                  </p>
                ))}
              </div>
            )}

            {selectedReport.equipment.length > 0 && (
              <div className="bg-gray-800 p-4 rounded">
                <h3 className="font-medium text-blue-400 mb-2">Equipment ({selectedReport.equipment.length})</h3>
                {selectedReport.equipment.map((e, i) => (
                  <p key={i} className="text-sm text-gray-300">
                    {e.equipment_name} — {e.hours_used}h — Op: {e.operator_name}
                    {e.equipment_issues ? ` — Issues: ${e.equipment_issues}` : ""}
                  </p>
                ))}
              </div>
            )}

            {selectedReport.materials.length > 0 && (
              <div className="bg-gray-800 p-4 rounded">
                <h3 className="font-medium text-blue-400 mb-2">Materials ({selectedReport.materials.length})</h3>
                {selectedReport.materials.map((m, i) => (
                  <p key={i} className="text-sm text-gray-300">
                    {m.material_description} — {m.quantity} {m.unit} — {m.supplier}
                  </p>
                ))}
              </div>
            )}

            {selectedReport.subcontractors.length > 0 && (
              <div className="bg-gray-800 p-4 rounded">
                <h3 className="font-medium text-blue-400 mb-2">Subcontractors ({selectedReport.subcontractors.length})</h3>
                {selectedReport.subcontractors.map((s, i) => (
                  <p key={i} className="text-sm text-gray-300">
                    {s.company_name} ({s.trade}) — {s.worker_count} workers — {s.work_description}
                  </p>
                ))}
              </div>
            )}

            {selectedReport.photos.length > 0 && (
              <div className="bg-gray-800 p-4 rounded">
                <h3 className="font-medium text-blue-400 mb-2">Photos ({selectedReport.photos.length})</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedReport.photos.map((p, i) => (
                    <div key={i}>
                      <img src={p.public_url} alt={p.caption || `Photo ${i + 1}`} className="rounded w-full" />
                      {p.caption && <p className="text-xs text-gray-400 mt-1">{p.caption}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-800 p-4 rounded">
              <h3 className="font-medium text-blue-400 mb-2">Safety</h3>
              <p className="text-sm text-gray-300">Briefing held: {r.safety_briefing_held ? "Yes" : "No"}</p>
              <p className="text-sm text-gray-300">Incidents: {r.incidents_occurred ? "Yes" : "No"}</p>
              <p className="text-sm text-gray-300">Foreman confirmed: {r.foreman_confirmed ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Daily Field Reports</h1>
          <a href="/time/admin/dashboard" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Dashboard
          </a>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Start Date</label>
            <input
              type="date"
              className={inputClass}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">End Date</label>
            <input
              type="date"
              className={inputClass}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
          >
            Filter
          </button>
          <button
            onClick={downloadExcel}
            disabled={exportLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium disabled:opacity-50"
          >
            {exportLoading ? "Generating..." : "Download Excel"}
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-400">No reports found.</p>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div
                key={r.id}
                onClick={() => viewDetail(r.id)}
                className="bg-gray-800 p-4 rounded cursor-pointer hover:bg-gray-750 hover:border-blue-500 border border-gray-700 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{r.project_name}</h3>
                    <p className="text-sm text-gray-400">
                      {r.report_date} | {r.employees?.name} ({r.employees?.employee_id})
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {r.weather_conditions} | {(r.work_type || []).slice(0, 3).join(", ")} | {r.percent_complete}%
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {r.foreman_confirmed && (
                      <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">Confirmed</span>
                    )}
                    {r.incidents_occurred && (
                      <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded">Incident</span>
                    )}
                  </div>
                </div>
                {detailLoading && <p className="text-xs text-gray-500 mt-1">Loading...</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
