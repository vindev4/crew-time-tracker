"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  phone: string;
  role: string;
  active: boolean;
  has_password: boolean;
  created_at: string;
}

export default function ManageEmployees() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchEmployees() {
    const res = await fetch("/time/api/admin/employees");
    if (res.ok) {
      const data = await res.json();
      setEmployees(data.employees || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function toggleActive(emp: Employee) {
    const res = await fetch("/time/api/admin/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: emp.id, active: !emp.active }),
    });
    if (res.ok) fetchEmployees();
  }

  async function resetPassword(emp: Employee) {
    if (!confirm(`Reset password for ${emp.name}? They will need to set a new one on next login.`)) return;
    const res = await fetch("/time/api/admin/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: emp.id, reset_password: true }),
    });
    if (res.ok) fetchEmployees();
  }

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newPhone) return;
    const res = await fetch("/time/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, phone: newPhone }),
    });
    if (res.ok) {
      setNewName("");
      setNewPhone("");
      setShowAdd(false);
      fetchEmployees();
    }
  }

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.phone?.includes(search) ||
      e.employee_id.includes(search)
  );

  const activeCount = employees.filter((e) => e.active).length;
  const inputClass = "p-2 bg-[#00467F] border border-blue-600/50 rounded text-white text-sm placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-[#F37C05]";

  return (
    <div className="min-h-screen bg-[#00467F] text-white p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Manage Employees</h1>
            <p className="text-blue-300 text-sm">{activeCount} active / {employees.length} total</p>
          </div>
          <div className="flex gap-3">
            <a href="/time/admin/dashboard" className="px-3 py-1.5 bg-[#003460] hover:bg-[#00569C] rounded text-sm">
              Dashboard
            </a>
            <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 bg-[#F37C05] hover:bg-[#E06E00] rounded text-sm font-medium">
              {showAdd ? "Cancel" : "+ Add Employee"}
            </button>
          </div>
        </div>

        {/* Add Employee Form */}
        {showAdd && (
          <form onSubmit={addEmployee} className="bg-[#003460] rounded p-4 mb-4 flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-blue-200 text-xs mb-1">Full Name</label>
              <input className={inputClass} placeholder="John Smith" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="block text-blue-200 text-xs mb-1">Phone Number</label>
              <input className={inputClass} placeholder="5551234567" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
            </div>
            <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium">
              Add Employee
            </button>
          </form>
        )}

        {/* Search */}
        <div className="mb-4">
          <input
            className={inputClass + " w-full md:w-80"}
            placeholder="Search by name, phone, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Employee List */}
        <div className="bg-[#003460] rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-700/30 text-blue-200">
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Password</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className={`border-b border-blue-700/30 ${!emp.active ? "opacity-50" : ""} hover:bg-[#00467F]/30`}>
                  <td className="p-3 font-mono text-blue-300">{emp.employee_id}</td>
                  <td className="p-3 font-medium">{emp.name}</td>
                  <td className="p-3 text-blue-200">
                    {emp.phone ? `(${emp.phone.slice(0, 3)}) ${emp.phone.slice(3, 6)}-${emp.phone.slice(6)}` : "—"}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${emp.active ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                      {emp.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs ${emp.has_password ? "text-green-400" : "text-yellow-400"}`}>
                      {emp.has_password ? "Set" : "Pending"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => toggleActive(emp)}
                        className={`px-2 py-0.5 rounded text-xs ${emp.active ? "bg-red-700 hover:bg-red-600" : "bg-green-700 hover:bg-green-600"}`}
                      >
                        {emp.active ? "Disable" : "Enable"}
                      </button>
                      {emp.has_password && (
                        <button
                          onClick={() => resetPassword(emp)}
                          className="px-2 py-0.5 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                        >
                          Reset PW
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="p-6 text-center text-blue-300/60">Loading...</p>}
          {!loading && filtered.length === 0 && <p className="p-6 text-center text-blue-300/60">No employees found</p>}
        </div>
      </div>
    </div>
  );
}
