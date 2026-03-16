"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      setError("Enter username and password");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/time/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#00467F] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="https://duraport.net/wp-content/uploads/2026/01/duraport-logo.svg" alt="DuraPort" className="h-14 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-blue-200">Crew Time Tracker Management</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#003460] rounded-xl p-6 border border-blue-700/30 shadow-xl">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-blue-200 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F37C05] focus:ring-1 focus:ring-[#F37C05]"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-blue-200 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F37C05] focus:ring-1 focus:ring-[#F37C05]"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F37C05] hover:bg-[#E06E00] disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-4">
          <a href="/time/" className="text-blue-300/60 text-sm hover:text-blue-200">
            Back to Clock In
          </a>
        </div>
      </div>
    </div>
  );
}
