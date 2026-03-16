"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function TicketContent() {
  const searchParams = useSearchParams();
  const eid = searchParams.get("eid") || "";
  const pin = searchParams.get("pin") || "";
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!notes.trim()) { setError("Please enter your notes"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/time/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: eid, pin, notes: notes.trim() }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess(true); setNotes(""); } else { setError(data.error || "Failed to submit ticket"); }
    } catch { setError("Network error. Please try again."); } finally { setLoading(false); }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-4"><span className="text-3xl">\u2713</span></div>
          <h1 className="text-2xl font-bold mb-2">Ticket Submitted</h1>
          <p className="text-blue-200 mb-6">Your work ticket has been submitted successfully.</p>
          <div className="flex gap-3">
            <button onClick={() => setSuccess(false)} className="bg-[#00467F] hover:bg-[#00569C] px-6 py-3 rounded-lg">Submit Another</button>
            <a href="/time/" className="bg-[#F37C05] hover:bg-[#E06E00] px-6 py-3 rounded-lg">Done</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Submit Work Ticket</h1>
          <a href="/time/" className="bg-[#00467F] hover:bg-[#00569C] px-4 py-2 rounded-lg text-sm">Back</a>
        </div>
        <form onSubmit={handleSubmit} className="bg-[#003460] rounded-xl p-6">
          {error && (<div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">{error}</div>)}
          <div className="mb-4">
            <label className="block text-sm text-blue-200 mb-2">Work Notes / Description</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="Describe the work performed, any issues, materials used, etc." className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 resize-none" disabled={loading} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#F37C05] hover:bg-[#E06E00] disabled:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors">{loading ? "Submitting..." : "Submit Ticket"}</button>
        </form>
      </div>
    </div>
  );
}

export default function TicketPage() {
  return (<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}><TicketContent /></Suspense>);
}
