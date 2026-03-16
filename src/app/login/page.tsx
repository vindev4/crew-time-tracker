"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "phone" | "pin" | "register" | "set-pin";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function formatPhone(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  async function lookupPhone() {
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/time/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", phone: phone.replace(/\D/g, "") }),
      });
      const data = await res.json();
      if (data.found) {
        if (data.hasPin) {
          setStep("pin");
        } else {
          setStep("set-pin");
          setMessage("Welcome! Set a 4-digit PIN to get started.");
        }
      } else {
        setStep("register");
      }
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function loginWithPin() {
    if (pin.length !== 4) {
      setError("Enter your 4-digit PIN");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/time/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", phone: phone.replace(/\D/g, ""), pin }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Wrong PIN");
        setPin("");
      }
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function registerAndSetPin() {
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }
    if (pin.length !== 4) {
      setError("Enter a 4-digit PIN");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/time/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          phone: phone.replace(/\D/g, ""),
          name: name.trim(),
          pin,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.pending) {
          setMessage("Registration submitted! Wait for admin approval, then come back and log in.");
          setStep("phone");
          setPhone("");
          setPin("");
          setName("");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function setNewPin() {
    if (pin.length !== 4) {
      setError("Enter a 4-digit PIN");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/time/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-pin",
          phone: phone.replace(/\D/g, ""),
          pin,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Failed to set PIN");
      }
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === "phone") lookupPhone();
    else if (step === "pin") loginWithPin();
    else if (step === "register") registerAndSetPin();
    else if (step === "set-pin") setNewPin();
  }

  function goBack() {
    setStep("phone");
    setPin("");
    setName("");
    setError("");
    setMessage("");
  }

  return (
    <div className="min-h-screen bg-[#00467F] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="https://duraport.net/wp-content/uploads/2026/01/duraport-logo.svg"
            alt="DuraPort"
            className="h-14 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white mb-2">Crew Time Tracker</h1>
          <p className="text-blue-200">
            {step === "phone" && "Enter your phone number to sign in"}
            {step === "pin" && "Enter your PIN"}
            {step === "register" && "New here? Create your account"}
            {step === "set-pin" && "Set your PIN"}
          </p>
        </div>

        {message && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-4 text-center">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-[#003460] rounded-xl p-6 border border-blue-700/30 shadow-xl"
        >
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {step === "phone" && (
            <div className="mb-4">
              <label className="block text-sm text-blue-200 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(555) 123-4567"
                className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-4 py-3 text-white placeholder-blue-400/50 focus:outline-none focus:border-[#F37C05] focus:ring-1 focus:ring-[#F37C05]"
                disabled={loading}
                autoFocus
              />
            </div>
          )}

          {step === "register" && (
            <>
              <div className="mb-4">
                <label className="block text-sm text-blue-200 mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-4 py-3 text-white placeholder-blue-400/50 focus:outline-none focus:border-[#F37C05] focus:ring-1 focus:ring-[#F37C05]"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-blue-200 mb-1">Choose a 4-Digit PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="****"
                  className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-[0.5em] placeholder-blue-400/50 focus:outline-none focus:border-[#F37C05] focus:ring-1 focus:ring-[#F37C05]"
                  disabled={loading}
                />
              </div>
            </>
          )}

          {step === "pin" && (
            <div className="mb-4">
              <label className="block text-sm text-blue-200 mb-1">Enter PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="****"
                className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-[0.5em] placeholder-blue-400/50 focus:outline-none focus:border-[#F37C05] focus:ring-1 focus:ring-[#F37C05]"
                disabled={loading}
                autoFocus
              />
            </div>
          )}

          {step === "set-pin" && (
            <div className="mb-4">
              <label className="block text-sm text-blue-200 mb-1">Choose a 4-Digit PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="****"
                className="w-full bg-[#00467F] border border-blue-600/50 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-[0.5em] placeholder-blue-400/50 focus:outline-none focus:border-[#F37C05] focus:ring-1 focus:ring-[#F37C05]"
                disabled={loading}
                autoFocus
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F37C05] hover:bg-[#E06E00] disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {loading
              ? "Please wait..."
              : step === "phone"
              ? "Continue"
              : step === "pin"
              ? "Sign In"
              : step === "register"
              ? "Register"
              : "Set PIN"}
          </button>

          {step !== "phone" && (
            <button
              type="button"
              onClick={goBack}
              className="w-full mt-3 text-blue-300/60 text-sm hover:text-blue-200 py-2"
            >
              Back
            </button>
          )}
        </form>

        <div className="text-center mt-4">
          <a
            href="/time/admin/login"
            className="text-blue-300/60 text-sm hover:text-blue-200"
          >
            Admin Login
          </a>
        </div>
      </div>
    </div>
  );
}
