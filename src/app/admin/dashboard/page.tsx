"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Punch {
  id: string;
  type: string;
  timestamp: string;
  lat: number | null;
  lng: number | null;
  gps_available: boolean;
  employees: { employee_id: string; name: string };
}

interface Ticket {
  id: string;
  notes: string;
  submitted_at: string;
  status: string;
  employees: { employee_id: string; name: string };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"punches" | "tickets">("punches");
  const [punches, setPunches] = useState<Punch[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingPunch, setEditingPunch] = useState<string | null>(null);
  const [editTimestamp, setEditTimestamp] = useState("");

  useEffect(() => {
    fetchPunches();
    fetchTickets();
  }, []);

  async function fetchPunches() {
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);

    const res = await fetch(`/api/admin/punches?${params.toString()}`);
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setPunches(data.punches || []);
    setLoading(false);
  }

  async function fetchTickets() {
    const res = await fetch("/api/admin/tickets");
    if (res.status === 401) return;
    const data = await res.json();
    setTickets(data.tickets || []);
  }

  async function handleEditPunch(punchId: string) {
    if (!editTimestamp) return;
    await fetch("/api/admin/punches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: punchId, timestamp: editTimestamp }),
    });
    setEditingPunch(null);
    fetchPunches();
  }

  async function handleTicketStatus(ticketId: string, status: string) {
    await fetch("/api/admin/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ticketId, status }),
    });
    fetchTickets();
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    window.open(`/api/admin/export?${params.toString()}`, "_blank");
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <a
              href="/admin/employees"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
            >
              Manage Employees
            </a>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("punches")}
            className={`px-4 py-2 rounded-lg ${activeTab === "punches" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
          >
            Time Punches
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2 rounded-lg ${activeTab === "tickets" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
          >
            Work Tickets ({tickets.filter((t) => t.status === "open").length})
          </button>
        </div>

        {activeTab === "punches" && (
          <>
            {/* Filters */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={fetchPunches}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
              >
                Filter
              </button>
              <button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm"
              >
                Export CSV
              </button>
            </div>

            {/* Punches Table */}
            {loading ? (
              <p className="text-gray-400 text-center py-8">Loading...</p>
            ) : (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-3 text-gray-400">
                          Employee
                        </th>
                        <th className="text-left p-3 text-gray-400">Type</th>
                        <th className="text-left p-3 text-gray-400">Time</th>
                        <th className="text-left p-3 text-gray-400">GPS</th>
                        <th className="text-left p-3 text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {punches.map((punch) => (
                        <tr
                          key={punch.id}
                          className="border-b border-gray-700/50 hover:bg-gray-700/30"
                        >
                          <td className="p-3">
                            <span className="font-medium">
                              {punch.employees.name}
                            </span>
                            <br />
                            <span className="text-gray-400 text-xs">
                              ID: {punch.employees.employee_id}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-xs ${punch.type === "clock_in" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}
                            >
                              {punch.type === "clock_in"
                                ? "Clock In"
                                : "Clock Out"}
                            </span>
                          </td>
                          <td className="p-3">
                            {editingPunch === punch.id ? (
                              <div className="flex gap-2">
                                <input
                                  type="datetime-local"
                                  value={editTimestamp}
                                  onChange={(e) =>
                                    setEditTimestamp(e.target.value)
                                  }
                                  className="bg-gray-600 rounded px-2 py-1 text-xs"
                                />
                                <button
                                  onClick={() => handleEditPunch(punch.id)}
                                  className="text-green-400 text-xs"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingPunch(null)}
                                  className="text-gray-400 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              new Date(punch.timestamp).toLocaleString()
                            )}
                          </td>
                          <td className="p-3">
                            {punch.gps_available ? (
                              <span className="text-green-400 text-xs">
                                📍 {punch.lat?.toFixed(4)},{" "}
                                {punch.lng?.toFixed(4)}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">
                                N/A
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                setEditingPunch(punch.id);
                                setEditTimestamp(
                                  punch.timestamp.substring(0, 16)
                                );
                              }}
                              className="text-blue-400 hover:text-blue-300 text-xs"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {punches.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No punches found
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === "tickets" && (
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tickets</p>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-medium">
                        {ticket.employees.name}
                      </span>
                      <span className="text-gray-400 text-sm ml-2">
                        (ID: {ticket.employees.employee_id})
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        ticket.status === "open"
                          ? "bg-yellow-900 text-yellow-300"
                          : ticket.status === "reviewed"
                            ? "bg-blue-900 text-blue-300"
                            : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{ticket.notes}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">
                      {new Date(ticket.submitted_at).toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      {ticket.status === "open" && (
                        <button
                          onClick={() =>
                            handleTicketStatus(ticket.id, "reviewed")
                          }
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
                        >
                          Mark Reviewed
                        </button>
                      )}
                      {ticket.status !== "closed" && (
                        <button
                          onClick={() =>
                            handleTicketStatus(ticket.id, "closed")
                          }
                          className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-xs"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
