"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Step = "phone" | "pin" | "register" | "set-pin";
type Lang = "en" | "es";

const t = {
  en: {
    phoneTitle: "Enter your phone number to sign in",
    phonePlaceholder: "(555) 123-4567",
    pinTitle: "Enter your PIN",
    registerTitle: "New here? Create your account",
    setPinTitle: "Set your PIN",
    phone: "Phone Number",
    name: "Your Name",
    namePlaceholder: "John Smith",
    pin: "Choose a 4-Digit PIN",
    pinPlaceholder: "****",
    enterPin: "Enter PIN",
    continue: "Continue",
    signIn: "Sign In",
    register: "Register",
    setPin: "Set PIN",
    back: "Back",
    adminLogin: "Admin Login",
    pleaseWait: "Please wait...",
    signingIn: "Signing in...",
    settingUp: "Setting up...",
    creatingAccount: "Creating account...",
    lookingUp: "Looking up...",
    invalidPhone: "Enter a valid 10-digit phone number",
    enterPin4: "Enter your 4-digit PIN",
    enterName: "Enter your name",
    wrongPin: "Wrong PIN",
    connectionError: "Connection error. Try again.",
    registrationFailed: "Registration failed",
    registrationSubmitted: "Registration submitted! Wait for admin approval, then come back and log in.",
    crewTimeTracker: "Crew Time Tracker",
  },
  es: {
    phoneTitle: "Ingrese su número de teléfono para iniciar sesión",
    phonePlaceholder: "(555) 123-4567",
    pinTitle: "Ingrese su PIN",
    registerTitle: "¿Nuevo aquí? Cree su cuenta",
    setPinTitle: "Establezca su PIN",
    phone: "Número de teléfono",
    name: "Su nombre",
    namePlaceholder: "Juan García",
    pin: "Elija un PIN de 4 dígitos",
    pinPlaceholder: "****",
    enterPin: "Ingrese PIN",
    continue: "Continuar",
    signIn: "Iniciar sesión",
    register: "Registrarse",
    setPin: "Establecer PIN",
    back: "Atrás",
    adminLogin: "Iniciar sesión como administrador",
    pleaseWait: "Por favor espere...",
    signingIn: "Iniciando sesión...",
    settingUp: "Configurando...",
    creatingAccount: "Creando cuenta...",
    lookingUp: "Buscando...",
    invalidPhone: "Ingrese un número de teléfono válido de 10 dígitos",
    enterPin4: "Ingrese su PIN de 4 dígitos",
    enterName: "Ingrese su nombre",
    wrongPin: "PIN incorrecto",
    connectionError: "Error de conexión. Intente de nuevo.",
    registrationFailed: "El registro falló",
    registrationSubmitted: "¡Registro enviado! Espere la aprobación del administrador y luego vuelva a iniciar sesión.",
    crewTimeTracker: "Rastreador de tiempo de la tripulación",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    // Read saved language from cookie on mount
    const savedLang = document.cookie
      .split("; ")
      .find((c) => c.startsWith("lang="))
      ?.split("=")[1] as Lang | undefined;
    if (savedLang && (savedLang === "en" || savedLang === "es")) {
      setLang(savedLang);
    }
  }, []);

  function saveLangCookie(newLang: Lang) {
    document.cookie = `lang=${newLang}; path=/; max-age=31536000`;
    setLang(newLang);
  }

  const strings = t[lang];

  function formatPhone(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  async function lookupPhone() {
    if (phone.replace(/\D/g, "").length < 10) {
      setError(strings.invalidPhone);
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
      setError(strings.connectionError);
    } finally {
      setLoading(false);
    }
  }

  async function loginWithPin() {
    if (pin.length !== 4) {
      setError(strings.enterPin4);
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
        router.push("/report/new");
      } else {
        setError(data.error || strings.wrongPin);
        setPin("");
      }
    } catch {
      setError(strings.connectionError);
    } finally {
      setLoading(false);
    }
  }

  async function registerAndSetPin() {
    if (!name.trim()) {
      setError(strings.enterName);
      return;
    }
    if (pin.length !== 4) {
      setError(strings.enterPin4);
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
          setMessage(strings.registrationSubmitted);
          setStep("phone");
          setPhone("");
          setPin("");
          setName("");
        } else {
          router.push("/report/new");
        }
      } else {
        setError(data.error || strings.registrationFailed);
      }
    } catch {
      setError(strings.connectionError);
    } finally {
      setLoading(false);
    }
  }

  async function setNewPin() {
    if (pin.length !== 4) {
      setError(strings.enterPin4);
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
        router.push("/report/new");
      } else {
        setError(data.error || "Failed to set PIN");
      }
    } catch {
      setError(strings.connectionError);
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
    <div className="min-h-screen bg-[#00467F] flex flex-col items-center justify-center p-5">
      {/* Language toggle */}
      <div className="absolute top-5 right-5 flex gap-2">
        <button
          onClick={() => saveLangCookie("en")}
          className={`px-3 py-1 rounded-lg text-xs uppercase tracking-wider font-medium transition-all ${
            lang === "en"
              ? "bg-white/10 text-white/90 border border-white/10"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => saveLangCookie("es")}
          className={`px-3 py-1 rounded-lg text-xs uppercase tracking-wider font-medium transition-all ${
            lang === "es"
              ? "bg-white/10 text-white/90 border border-white/10"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          ES
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Logo and header */}
        <div className="text-center mb-12">
          <img
            src="https://duraport.net/wp-content/uploads/2026/01/duraport-logo.svg"
            alt="DuraPort"
            className="h-8 opacity-90 mx-auto mb-6"
          />
          <h1 className="text-white/90 text-3xl font-light tracking-tight mb-2">
            {strings.crewTimeTracker}
          </h1>
          <p className="text-white/40 text-xs uppercase tracking-wider">
            {step === "phone" && strings.phoneTitle}
            {step === "pin" && strings.pinTitle}
            {step === "register" && strings.registerTitle}
            {step === "set-pin" && strings.setPinTitle}
          </p>
        </div>

        {/* Message banner */}
        {message && (
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <p className="text-white/70 text-sm">{message}</p>
          </div>
        )}

        {/* Main form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 mb-8"
        >
          {/* Error message */}
          {error && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-white/60 text-sm">{error}</p>
            </div>
          )}

          {/* Phone step */}
          {step === "phone" && (
            <div className="space-y-4">
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-3">
                  {strings.phone}
                </label>
                <input
                  type="tel"
                  value={formatPhone(phone)}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder={strings.phonePlaceholder}
                  style={{ colorScheme: "dark" }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/90 placeholder-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-[#F37C05]/50 transition-all"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={phone.replace(/\D/g, "").length < 10 || loading}
                className="w-full bg-[#F37C05] hover:bg-[#E06E00] disabled:opacity-40 disabled:cursor-not-allowed text-white/90 font-medium py-3 rounded-xl transition-all"
              >
                {loading ? strings.lookingUp : strings.continue}
              </button>
            </div>
          )}

          {/* Register step */}
          {step === "register" && (
            <div className="space-y-4">
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-3">
                  {strings.name}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={strings.namePlaceholder}
                  style={{ colorScheme: "dark" }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/90 placeholder-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-[#F37C05]/50 transition-all"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-3">
                  {strings.pin}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder={strings.pinPlaceholder}
                  style={{ colorScheme: "dark" }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/90 text-center text-lg tracking-[0.25em] placeholder-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-[#F37C05]/50 transition-all"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={!name.trim() || pin.length !== 4 || loading}
                className="w-full bg-[#F37C05] hover:bg-[#E06E00] disabled:opacity-40 disabled:cursor-not-allowed text-white/90 font-medium py-3 rounded-xl transition-all"
              >
                {loading ? strings.creatingAccount : strings.register}
              </button>
            </div>
          )}

          {/* PIN entry step */}
          {step === "pin" && (
            <div className="space-y-4">
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-3">
                  {strings.enterPin}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder={strings.pinPlaceholder}
                  style={{ colorScheme: "dark" }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/90 text-center text-lg tracking-[0.25em] placeholder-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-[#F37C05]/50 transition-all"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={pin.length !== 4 || loading}
                className="w-full bg-[#F37C05] hover:bg-[#E06E00] disabled:opacity-40 disabled:cursor-not-allowed text-white/90 font-medium py-3 rounded-xl transition-all"
              >
                {loading ? strings.signingIn : strings.signIn}
              </button>
            </div>
          )}

          {/* Set PIN step */}
          {step === "set-pin" && (
            <div className="space-y-4">
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-wider mb-3">
                  {strings.pin}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder={strings.pinPlaceholder}
                  style={{ colorScheme: "dark" }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/90 text-center text-lg tracking-[0.25em] placeholder-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-[#F37C05]/50 transition-all"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={pin.length !== 4 || loading}
                className="w-full bg-[#F37C05] hover:bg-[#E06E00] disabled:opacity-40 disabled:cursor-not-allowed text-white/90 font-medium py-3 rounded-xl transition-all"
              >
                {loading ? strings.settingUp : strings.setPin}
              </button>
            </div>
          )}

          {/* Back button */}
          {step !== "phone" && (
            <button
              type="button"
              onClick={goBack}
              className="w-full text-white/40 hover:text-white/60 text-sm py-2 transition-all"
            >
              {strings.back}
            </button>
          )}
        </form>

        {/* Admin login link */}
        <div className="text-center border-t border-white/10 pt-6">
          <a
            href="/time/admin/login"
            className="text-white/40 hover:text-white/60 text-xs uppercase tracking-wider transition-all"
          >
            {strings.adminLogin}
          </a>
        </div>
      </div>
    </div>
  );
}
