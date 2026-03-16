"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewReportPage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("07:00");
  const [stopTime, setStopTime] = useState("15:30");
  const [jobLocation, setJobLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [employeeName, setEmployeeName] = useState("");

  useEffect(() => {
    const name = document.cookie.split(";").find((c) => c.trim().startsWith("employee_name="));
    if (name) setEmployeeName(decodeURIComponent(name.split("=")[1]));
  }, []);

  function calcHours() {
    if (!startTime || !stopTime) return 0;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = stopTime.split(":").map(Number);
    const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
    return Math.max(0, Math.round(diff * 100) / 100);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobLocation.trim()) { setError("Job / Location is required"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/time/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_date: date, start_time: startTime, stop_time: stopTime, job_location: jobLocation, notes, hours_worked: calcHours() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit"); return; }
      setSuccess(true);
    } catch { setError("Connection error. Please try again."); }
    finally { setLoading(false); }
  }

  const ic = "w-full p-3 bg-[#003460] border border-blue-600/50 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-[#F37C05]";
  const bc = "w-full py-3 bg-[#F37C05] hover:bg-[#E06E00] text-white font-semibold rounded-lg text-lg transition-colors disabled:opacity-50";
  const hours = calcHours();

  if (success) {
    return (
      <div className="min-h-screen bg-[#00467F] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#003460] rounded-xl p-8 shadow-xl">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-2">Ticket Submitted!</h2>
            <p className="text-blue-200">{hours} hours logged for {date}</p>
            <p className="text-blue-300 text-sm mt-1">{jobLocation}</p>
            <button onClick={() => { setSuccess(false); setNotes(""); setJobLocation(""); setDate(new Date().toISOString().split("T")[0]); }} className={bc + " mt-6"}>Submit Another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00467F] p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <img src="https://duraport.net/wp-content/uploads/2026/01/duraport-logo.svg" alt="DuraPort" className="h-10 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white">Daily Work Ticket</h1>
          {employeeName && <p className="text-[#F37C05] text-sm">{employeeName}</p>}
        </div>
        <form onSubmit={handleSubmit} className="bg-[#003460] rounded-xl p-5 shadow-xl space-y-4">
          <div>
            <label className="block text-blue-200 text-sm mb-1">Date</label>
            <input type="date" className={ic} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-blue-200 text-sm mb-1">Start Time</label>
              <input type="time" className={ic} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="block text-blue-200 text-sm mb-1">Stop Time</label>
              <input type="time" className={ic} value={stopTime} onChange={(e) => setStopTime(e.target.value)} />
            </div>
          </div>
          {hours > 0 && (
            <div className="bg-[#00467F] rounded-lg p-3 text-center">
              <span className="text-blue-200 text-sm">Hours: </span>
              <span className="text-[#F37C05] font-bold text-lg">{hours}</span>
            </div>
          )}
          <div>
            <label className="block text-blue-200 text-sm mb-1">Job / Location</label>
            <input type="text" className={ic} placeholder="e.g. Port Newark Terminal B" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} />
          </div>
          <div>
            <label className="block text-blue-200 text-sm mb-1">Notes</label>
            <textarea className={ic + " h-24 resize-none"} placeholder="Any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className={bc}>{loading ? "Submitting..." : "Submit Work Ticket"}</button>
        </form>
      </div>
    </div>
  );
}
