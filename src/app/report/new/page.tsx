"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n, LanguageToggle } from "@/lib/i18n";

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  role: string;
}

interface CrewRow {
  employee_id: string;
  hours_regular: number;
  hours_overtime: number;
}

export default function DailyReportPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Auth
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");

  // Job Info
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [projectName, setProjectName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");

  // Crew
  const [crew, setCrew] = useState<CrewRow[]>([]);

  // Notes
  const [additionalNotes, setAdditionalNotes] = useState("");

  useEffect(() => {
    fetch("/time/api/employees/list")
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees || []))
      .catch(() => {});
  }, []);

  function handleAuth() {
    if (!employeeId || !pin) {
      setError("Employee ID and PIN are required.");
      return;
    }
    setAuthLoading(true);
    setError("");
    // Just mark as authenticated - real validation happens on submit
    setTimeout(() => {
      setAuthenticated(true);
      setAuthLoading(false);
      // Auto-add the logged-in employee as first crew member
      const emp = employees.find((e) => e.employee_id === employeeId);
      if (emp) {
        setCrew([{ employee_id: emp.id, hours_regular: 8, hours_overtime: 0 }]);
      }
    }, 300);
  }

  function addCrewRow() {
    setCrew([...crew, { employee_id: "", hours_regular: 8, hours_overtime: 0 }]);
  }
  function updateCrew(i: number, field: string, value: string | number) {
    const u = [...crew];
    (u[i] as unknown as Record<string, unknown>)[field] = value;
    setCrew(u);
  }
  function removeCrew(i: number) {
    setCrew(crew.filter((_, idx) => idx !== i));
  }

  function getEmployeeName(empId: string) {
    const emp = employees.find((e) => e.id === empId);
    return emp ? emp.name : "";
  }

  async function handleSubmit() {
    if (!employeeId || !pin) {
      setError("Employee ID and PIN are required.");
      return;
    }
    if (!projectName.trim()) {
      setError("Job location / project name is required.");
      return;
    }
    if (crew.filter((c) => c.employee_id).length === 0) {
      setError("Add at least one crew member with hours.");
      return;
    }

    setLoading(true);
    setError("");

    let gpsLat: number | null = null;
    let gpsLng: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      gpsLat = pos.coords.latitude;
      gpsLng = pos.coords.longitude;
    } catch { /* GPS not available */ }

    try {
      const res = await fetch("/time/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          pin: pin,
          report: {
            report_date: reportDate,
            project_name: projectName,
            site_address: siteAddress,
            additional_notes: additionalNotes,
            gps_lat: gpsLat,
            gps_lng: gpsLng,
            crew: crew.filter((c) => c.employee_id),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit report.");
        setLoading(false);
        return;
      }

      router.push(
        `/time/report/confirmation?name=${encodeURIComponent(data.employee_name)}&date=${reportDate}&project=${encodeURIComponent(projectName)}`
      );
    } catch {
      setError("Failed to submit report.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full p-3 bg-[#00467F] border border-blue-600/50 rounded text-white placeholder-blue-300/50 focus:border-[#F37C05] focus:outline-none focus:ring-1 focus:ring-[#F37C05]";
  const labelClass = "block text-sm text-blue-200 mb-1 font-medium";

  const totalRegular = crew.reduce((sum, c) => sum + (c.hours_regular || 0), 0);
  const totalOT = crew.reduce((sum, c) => sum + (c.hours_overtime || 0), 0);

  return (
    <div className="min-h-screen bg-[#00467F] text-white">
      <LanguageToggle />
      <div className="max-w-lg mx-auto p-4 pb-8">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="https://duraport.net/wp-content/uploads/2026/01/duraport-logo.svg"
            alt="DuraPort"
            className="h-10 mx-auto mb-3"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <h1 className="text-xl font-bold">Daily Hours Report</h1>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>
        )}

        {/* Auth Section */}
        {!authenticated ? (
          <div className="bg-[#003460] rounded-lg p-5 space-y-4">
            <h2 className="font-semibold text-lg">Sign In</h2>
            <div>
              <label className={labelClass}>Employee ID</label>
              <input
                className={inputClass}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. 001"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className={labelClass}>PIN</label>
              <input
                className={inputClass}
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="****"
                inputMode="numeric"
              />
            </div>
            <button
              onClick={handleAuth}
              disabled={authLoading}
              className="w-full py-3 bg-[#F37C05] hover:bg-[#E06E00] rounded font-semibold transition-colors disabled:opacity-50"
            >
              {authLoading ? "Verifying..." : "Continue"}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Date & Location Card */}
            <div className="bg-[#003460] rounded-lg p-5 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-7 h-7 bg-[#F37C05] rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Date & Job Location
              </h2>
              <div>
                <label className={labelClass}>Date</label>
                <input className={inputClass} type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Job / Project Name *</label>
                <input className={inputClass} value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Main St Office Build" />
              </div>
              <div>
                <label className={labelClass}>Site Address</label>
                <input className={inputClass} value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} placeholder="e.g. 123 Main St, City" />
              </div>
            </div>

            {/* Crew Hours Card */}
            <div className="bg-[#003460] rounded-lg p-5 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-7 h-7 bg-[#F37C05] rounded-full flex items-center justify-center text-sm font-bold">2</span>
                Crew Hours
              </h2>

              {crew.map((c, i) => (
                <div key={i} className="bg-[#00467F] p-3 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-200">
                      {getEmployeeName(c.employee_id) || `Crew Member ${i + 1}`}
                    </span>
                    <button onClick={() => removeCrew(i)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                  </div>
                  <select className={inputClass} value={c.employee_id} onChange={(e) => updateCrew(i, "employee_id", e.target.value)}>
                    <option value="">Select employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_id})</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-blue-300 mb-1 block">Regular Hours</label>
                      <input className={inputClass} type="number" step="0.5" min="0" max="24" value={c.hours_regular} onChange={(e) => updateCrew(i, "hours_regular", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label className="text-xs text-blue-300 mb-1 block">Overtime Hours</label>
                      <input className={inputClass} type="number" step="0.5" min="0" max="24" value={c.hours_overtime} onChange={(e) => updateCrew(i, "hours_overtime", parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={addCrewRow} className="w-full py-2.5 border-2 border-dashed border-blue-500/40 rounded-lg text-blue-200 hover:border-[#F37C05] hover:text-white transition-colors text-sm font-medium">
                + Add Crew Member
              </button>

              {crew.length > 0 && (
                <div className="bg-[#00467F] rounded-lg p-3 flex justify-between text-sm">
                  <span className="text-blue-200">Total:</span>
                  <span>
                    <span className="font-semibold">{totalRegular}</span> reg
                    {totalOT > 0 && <span className="ml-2 text-[#F37C05] font-semibold">+ {totalOT} OT</span>}
                  </span>
                </div>
              )}
            </div>

            {/* Notes Card */}
            <div className="bg-[#003460] rounded-lg p-5 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-7 h-7 bg-[#F37C05] rounded-full flex items-center justify-center text-sm font-bold">3</span>
                Notes
              </h2>
              <textarea
                className={inputClass}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any notes about the day’s work, delays, issues, etc."
                rows={4}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-[#F37C05] hover:bg-[#E06E00] rounded-lg font-bold text-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Daily Report"}
            </button>

            <div className="text-center">
              <a href="/time" className="text-blue-300/60 hover:text-blue-100 text-sm">Back to Clock In/Out</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}