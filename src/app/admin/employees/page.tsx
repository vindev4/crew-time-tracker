"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  role: string;
  active: boolean;
  created_at: string;
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newEmpId, setNewEmpId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newRole, setNewRole] = useState("worker");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    const res = await fetch("/time/api/admin/employees");
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setEmployees(data.employees || []);
    setLoading(false);
  }

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newEmpId || !newName || !newPin) {
      setError("All fields are required");
      return;
    }
    const res = await fetch("/time/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: newEmpId,
        name: newName,
        pin: newPin,
        role: newRole,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess(`Added ${newName} (ID: ${newEmpId})`);
      setNewEmpId("");
      setNewName("");
      setNewPin("");
      setNewRole("worker");
      setShowAdd(false);
      fetchEmployees();
    } else {
      setError(data.error || "Failed to add employee");
    }
  }

  async function toggleActive(emp: Employee) {
    await fetch("/time/api/admin/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: emp.id, active: !emp.active }),
    });
    fetchEmployees();
  }

  return (
    <div className="min-h-screen bg-[#00467F] text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Manage Employees</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm"
            >
              {showAdd ? "Cancel" : "+ Add Employee"}
            </button>
            <a
              href="/time/admin/dashboard"
              className="bg-[#00467F] hover:bg-[#00569C] px-4 py-2 rounded-lg text-sm"
            >
              Back to Dashboard
            </a>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Add Employee Form */}
        {showAdd && (
          <form
            onSubmit={handleAddEmployee}
            className="bg-[#003460] rounded-lg p-4 mb-4"
          >
            <h2 className="text-lg font-semibold mb-3">Add New Employee</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-blue-200 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value)}
                  placeholder="e.g. 002"
                  className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-blue-200 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-blue-200 mb-1">
                  PIN (4-6 digits)
                </label>
                <input
                  type="text"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="1234"
                  maxLength={6}
                  className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-blue-200 mb-1">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-3 py-2"
                >
                  <option value="worker">Field Worker</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="mt-3 bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-sm"
            >
              Add Employee
            </button>
          </form>
        )}

        {/* Employees Table */}
        {loading ? (
          <p className="text-blue-200 text-center py-8">Loading...</p>
        ) : (
          <div className="bg-[#003460] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-700/30">
                  <th className="text-left p-3 text-blue-200">Employee ID</th>
                  <th className="text-left p-3 text-blue-200">Name</th>
                  <th className="text-left p-3 text-blue-200">Role</th>
                  <th className="text-left p-3 text-blue-200">Status</th>
                  <th className="text-left p-3 text-blue-200">Added</th>
                  <th className="text-left p-3 text-blue-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className={`border-b border-blue-700/30 ${
                      !emp.active ? "opacity-50" : ""
                    }`}
                  >
                    <td className="p-3 font-mono">{emp.employee_id}</td>
                    <td className="p-3 font-medium">{emp.name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          emp.role === "worker"
                            ? "bg-[#00467F] text-blue-100"
                            : emp.role === "manager"
                            ? "bg-blue-900 text-blue-300"
                            : "bg-purple-900 text-purple-300"
                        }`}
                      >
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs ${
                          emp.active ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {emp.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3 text-blue-200 text-xs">
                      {new Date(emp.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleActive(emp)}
                        className={`text-xs ${
                          emp.active
                            ? "text-red-400 hover:text-red-300"
                            : "text-green-400 hover:text-green-300"
                        }`}
                      >
                        {emp.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employees.length === 0 && (
              <p className="text-blue-300/60 text-center py-8">
                No employees yet. Add your first one above.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
