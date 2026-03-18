"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
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

  useEffect(() => {
    const name = document.cookie
      .split("; ")
      .find((c) => c.startsWith("employee_name="))
      ?.split("=")[1];
    const id = document.cookie
      .split("; ")
      .find((c) => c.startsWith("employee_id="))
      ?.split("=")[1];
    if (!name || !id) {
      router.push("/login");
      return;
    }
    setEmpName(decodeURIComponent(name));
    setEmpId(decodeURIComponent(id));
  }, [router]);

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

  function calcHours(): string {
    if (!startTime || !stopTime) return "0.00";
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = stopTime.split(":").map(Number);
    const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
    return diff > 0 ? diff.toFixed(2) : "0.00";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobLocation.trim()) {
      setError("Job/Location is required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/time/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: empId,
          date,
          start_time: startTime,
          stop_time: stopTime,
          job_location: jobLocation.trim(),
          hours_worked: parseFloat(calcHours()),
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Timesheet submitted!");
        setJobLocation("");
        setNotes("");
      } else {
        setError(data.error || "Failed to submit");
      }
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
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
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00467F]">
      {/* Header */}
      <div className="bg-[#003460] border-b border-blue-700/30 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://duraport.net/wp-content/uploads/2026/01/duraport-logo.svg"
              alt="DuraPort"
              className="h-8"
            />
            <div>
              <div className="text-white font-semibold text-sm">{empName}</div>
              <div className="text-blue-300/60 text-xs">Daily Timesheet</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-blue-300/60 text-sm hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto p-4">
        {success && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-4 text-center">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-[#003460] rounded-xl p-6 border border-blue-700/30 shadow-xl"
        >
          <h2 className="text-white text-lg font-semibold mb-4">Submit Daily Timesheet</h2>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-blue-200 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F37C05] focus:ring-1 focus:ring-[#F37C05]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-blue-200 mb-1">Start Time</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F37C05] focus:ring-1 focus:ring-[#F37C05]"
              >
                {timeOptions().map((t) => (
                  <option key={"s" + t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-blue-200 mb-1">Stop Time</label>
              <select
                value={stopTime}
                onChange={(e) => setStopTime(e.target.value)}
                className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F37C05] focus:ring-1 focus:ring-[#F37C05]"
              >
                {timeOptions().map((t) => (
                  <option key={"e" + t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4 text-center">
            <span className="text-blue-200 text-sm">Total Hours: </span>
            <span className="text-[#F37C05] font-bold text-lg">{calcHours()}</span>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-blue-200 mb-1">Job / Location</label>
            <input
              type="text"
              value={jobLocation}
              onChange={(e) => setJobLocation(e.target.value)}
              placeholder="e.g. Terminal B - Gate 4"
              className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-4 py-3 text-white placeholder-blue-400/50 focus:outline-none focus:border-[#F37C05] focus:ring-1 focus:ring-[#F37C05]"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-blue-200 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional details..."
              className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-4 py-3 text-white placeholder-blue-400/50 focus:outline-none focus:border-[#F37C05] focus:ring-1 focus:ring-[#F37C05] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F37C05] hover:bg-[#E06E00] disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {loading ? "Submitting..." : "Submit Timesheet"}
          </button>
        </form>
      </div>
    </div>
  );
}
