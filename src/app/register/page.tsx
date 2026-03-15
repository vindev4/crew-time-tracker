"use client";

import { useState } from "react";
import { useI18n, LanguageToggle } from "@/lib/i18n";

export default function RegisterPage() {
  const { t } = useI18n();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [desiredId, setDesiredId] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName || !phone || !desiredId || !pin) {
      setError("Please fill in all required fields.");
      return;
    }

    if (pin.length < 4) {
      setError("PIN must be at least 4 characters.");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/time/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_legal_name: fullName,
          phone,
          email: email || null,
          desired_employee_id: desiredId,
          pin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none";
  const labelClass = "block text-sm text-gray-300 mb-1";

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <LanguageToggle />
        <div className="w-full max-w-sm bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-green-400 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold mb-2">Registration Submitted!</h2>
          <p className="text-gray-400 mb-4">
            Your registration request has been sent to your supervisor for
            approval. You&apos;ll be able to log in once approved.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your requested ID: <strong className="text-white">{desiredId}</strong>
          </p>
          <a
            href="/time"
            className="block py-3 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
          >
            {t("app.backToClock")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <LanguageToggle />
      <h1 className="text-2xl font-bold text-center mb-2">New Employee Registration</h1>
      <p className="text-gray-400 mb-6 text-center text-sm">
        Fill in your information below. Your account will be active once approved by admin.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 bg-gray-800 p-6 rounded-lg">
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-2 rounded text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label className={labelClass}>Full Legal Name *</label>
          <input
            className={inputClass}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John A. Smith"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Phone Number *</label>
          <input
            className={inputClass}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Email (optional)</label>
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
          />
        </div>

        <hr className="border-gray-700" />

        <div>
          <label className={labelClass}>Desired Employee ID *</label>
          <input
            className={inputClass}
            value={desiredId}
            onChange={(e) => setDesiredId(e.target.value)}
            placeholder="e.g. 002"
            required
          />
          <p className="text-xs text-gray-500 mt-1">This will be your login ID</p>
        </div>

        <div>
          <label className={labelClass}>Create PIN *</label>
          <input
            className={inputClass}
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="At least 4 characters"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Confirm PIN *</label>
          <input
            className={inputClass}
            type="password"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            placeholder="Re-enter your PIN"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-green-600 hover:bg-green-700 rounded font-bold text-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Register"}
        </button>
      </form>

      <a href="/time" className="mt-6 text-gray-500 hover:text-gray-300 text-sm">
        {t("app.backToClock")}
      </a>
    </div>
  );
}
