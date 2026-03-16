"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "pin" | "register" | "pending">("phone");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function formatPhone(val: string) {
    const d = val.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
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
      if (!res.ok) { setError(data.error || "Phone number not found"); return; }
      setEmployeeName(data.name);
      setEmployeeId(data.employee_id);
      if (data.pending) { setStep("pending"); }
      else if (data.has_pin && data.approved) { setStep("pin"); }
      else { setStep("register"); }
    } catch { setError("Connection error. Please try again."); }
    finally { setLoading(false); }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/time/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", phone, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needs_registration) { setStep("register"); return; }
        setError(data.error || "Login failed");
        return;
      }
      router.push("/report/new");
    } catch { setError("Connection error. Please try again."); }
    finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError("PIN must be exactly 4 digits"); return; }
    if (pin !== confirmPin) { setError("PINs do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/time/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", phone, pin }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      if (data.logged_in) { router.push("/report/new"); }
      else { setStep("pending"); }
    } catch { setError("Connection error. Please try again."); }
    finally { setLoading(false); }
  }

  const ic = "w-full p-3 bg-[#003460] border border-blue-600/50 rounded-lg text-white text-lg placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-[#F37C05]";
  const bc = "w-full py-3 bg-[#F37C05] hover:bg-[#E06E00] text-white font-semibold rounded-lg text-lg transition-colors disabled:opacity-50";
  const pinIc = "w-16 h-16 text-center text-2xl bg-[#003460] border border-blue-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#F37C05]";

  return (
    <div className="min-h-screen bg-[#00467F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="https://duraport.net/wp-content/uploads/2026/01/duraport-logo.svg" alt="DuraPort" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Crew Time Tracker</h1>
          <p className="text-blue-300 text-sm mt-1">Sign in with your phone number</p>
        </div>
        <div className="bg-[#003460] rounded-xl p-6 shadow-xl">
          {step === "phone" && (
            <form onSubmit={handlePhoneLookup}>
              <label className="block text-blue-200 text-sm mb-2">Phone Number</label>
              <input type="tel" className={ic} placeholder="(555) 123-4567" value={formatPhone(phone)} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} autoFocus />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              <button type="submit" disabled={phone.replace(/\D/g, "").length < 10 || loading} className={bc + " mt-4"}>{loading ? "Looking up..." : "Continue"}</button>
            </form>
          )}
          {step === "pin" && (
            <form onSubmit={handleLogin}>
              <div className="text-center mb-4">
                <p className="text-white text-lg">Welcome back, <span className="font-bold text-[#F37C05]">{employeeName}</span></p>
                <p className="text-blue-300 text-xs">Employee ID: {employeeId}</p>
              </div>
              <label className="block text-blue-200 text-sm mb-2">Enter your 4-digit PIN</label>
              <input type="password" inputMode="numeric" maxLength={4} className={ic + " text-center text-2xl tracking-[0.5em]"} placeholder="____" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} autoFocus />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              <button type="submit" disabled={pin.length !== 4 || loading} className={bc + " mt-4"}>{loading ? "Signing in..." : "Sign In"}</button>
              <button type="button" onClick={() => { setStep("phone"); setPin(""); setError(""); }} className="w-full mt-3 text-blue-300 hover:text-white text-sm text-center">Use a different phone number</button>
            </form>
          )}
          {step === "register" && (
            <form onSubmit={handleRegister}>
              <div className="text-center mb-4">
                <p className="text-white text-lg">Welcome, <span className="font-bold text-[#F37C05]">{employeeName}</span>!</p>
                <p className="text-blue-300 text-xs">Employee ID: {employeeId}</p>
                <p className="text-blue-200 text-sm mt-2">Choose a 4-digit PIN to get started</p>
              </div>
              <label className="block text-blue-200 text-sm mb-2">Create PIN</label>
              <input type="password" inputMode="numeric" maxLength={4} className={ic + " text-center text-2xl tracking-[0.5em]"} placeholder="____" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} autoFocus />
              <label className="block text-blue-200 text-sm mb-2 mt-3">Confirm PIN</label>
              <input type="password" inputMode="numeric" maxLength={4} className={ic + " text-center text-2xl tracking-[0.5em]"} placeholder="____" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))} />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              <button type="submit" disabled={pin.length !== 4 || confirmPin.length !== 4 || loading} className={bc + " mt-4"}>{loading ? "Setting up..." : "Create Account"}</button>
              <button type="button" onClick={() => { setStep("phone"); setPin(""); setConfirmPin(""); setError(""); }} className="w-full mt-3 text-blue-300 hover:text-white text-sm text-center">Use a different phone number</button>
            </form>
          )}
          {step === "pending" && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">⏳</div>
              <p className="text-white text-lg font-semibold">Registration Pending</p>
              <p className="text-blue-200 text-sm mt-2">Hi <span className="text-[#F37C05] font-bold">{employeeName}</span>, your PIN has been set.</p>
              <p className="text-blue-300 text-sm mt-1">Please wait for your administrator to approve your account before you can sign in.</p>
              <button type="button" onClick={() => { setStep("phone"); setPin(""); setConfirmPin(""); setError(""); }} className={bc + " mt-6"}>Back to Login</button>
            </div>
          )}
        </div>
        <div className="text-center mt-6">
          <a href="/time/admin/login" className="text-blue-400 hover:text-blue-200 text-sm">Admin Login</a>
        </div>
      </div>
    </div>
  );
}
