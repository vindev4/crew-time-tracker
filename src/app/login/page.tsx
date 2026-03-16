"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "password" | "register">("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function formatPhone(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  async function handlePhoneLookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/time/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Phone number not found");
        return;
      }
      setEmployeeName(data.name);
      setEmployeeId(data.employee_id);
      if (data.has_password) {
        setStep("password");
      } else {
        setStep("register");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/time/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needs_registration) {
          setStep("register");
          return;
        }
        setError(data.error || "Login failed");
        return;
      }
      router.push("/report/new");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/time/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push("/report/new");
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full p-3 bg-[#003460] border border-blue-600/50 rounded-lg text-white text-lg placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-[#F37C05]";
  const btnClass =
    "w-full py-3 bg-[#F37C05] hover:bg-[#E06E00] text-white font-semibold rounded-lg text-lg transition-colors disabled:opacity-50";

  return (
    <div className="min-h-screen bg-[#00467F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://duraport.net/wp-content/uploads/2026/01/duraport-logo.svg"
            alt="DuraPort"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white">Crew Time Tracker</h1>
          <p className="text-blue-300 text-sm mt-1">Sign in with your phone number</p>
        </div>

        <div className="bg-[#003460] rounded-xl p-6 shadow-xl">
          {/* Step 1: Phone Number */}
          {step === "phone" && (
            <form onSubmit={handlePhoneLookup}>
              <label className="block text-blue-200 text-sm mb-2">Phone Number</label>
              <input
                type="tel"
                className={inputClass}
                placeholder="(555) 123-4567"
                value={formatPhone(phone)}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              <button type="submit" disabled={phone.replace(/\D/g, "").length < 10 || loading} className={btnClass + " mt-4"}>
                {loading ? "Looking up..." : "Continue"}
              </button>
            </form>
          )}

          {/* Step 2: Login with Password */}
          {step === "password" && (
            <form onSubmit={handleLogin}>
              <div className="text-center mb-4">
                <p className="text-white text-lg">Welcome back, <span className="font-bold text-[#F37C05]">{employeeName}</span></p>
                <p className="text-blue-300 text-xs">Employee ID: {employeeId}</p>
              </div>
              <label className="block text-blue-200 text-sm mb-2">Password</label>
              <input
                type="password"
                className={inputClass}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              <button type="submit" disabled={!password || loading} className={btnClass + " mt-4"}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
              <button type="button" onClick={() => { setStep("phone"); setPassword(""); setError(""); }} className="w-full mt-3 text-blue-300 hover:text-white text-sm text-center">
                Use a different phone number
              </button>
            </form>
          )}

          {/* Step 3: First-time Registration */}
          {step === "register" && (
            <form onSubmit={handleRegister}>
              <div className="text-center mb-4">
                <p className="text-white text-lg">Welcome, <span className="font-bold text-[#F37C05]">{employeeName}</span>!</p>
                <p className="text-blue-300 text-xs">Employee ID: {employeeId}</p>
                <p className="text-blue-200 text-sm mt-2">Set up your password to get started</p>
              </div>
              <label className="block text-blue-200 text-sm mb-2">Create Password</label>
              <input
                type="password"
                className={inputClass}
                placeholder="Choose a password (min 4 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <label className="block text-blue-200 text-sm mb-2 mt-3">Confirm Password</label>
              <input
                type="password"
                className={inputClass}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              <button type="submit" disabled={!password || !confirmPassword || loading} className={btnClass + " mt-4"}>
                {loading ? "Setting up..." : "Create Account & Sign In"}
              </button>
              <button type="button" onClick={() => { setStep("phone"); setPassword(""); setConfirmPassword(""); setError(""); }} className="w-full mt-3 text-blue-300 hover:text-white text-sm text-center">
                Use a different phone number
              </button>
            </form>
          )}
        </div>

        {/* Admin link */}
        <div className="text-center mt-6">
          <a href="/time/admin/login" className="text-blue-400 hover:text-blue-200 text-sm">
            Admin Login
          </a>
        </div>
      </div>
    </div>
  );
}
