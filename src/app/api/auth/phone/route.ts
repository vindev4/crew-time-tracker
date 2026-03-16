import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalize(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const supabase = getSupabase();

    // LOOKUP: check if phone exists and has a PIN
    if (action === "lookup") {
      const phone = normalize(body.phone || "");
      if (phone.length < 10) {
        return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
      }
      const { data: employees } = await supabase
        .from("employees")
        .select("id, name, pin_hash, active, approved")
        .eq("phone", phone);

      const emp = (employees || []).find((e) => e.active && e.approved);
      if (!emp) {
        // Check if pending approval
        const pending = (employees || []).find((e) => e.active && !e.approved);
        if (pending) {
          return NextResponse.json({
            found: true,
            hasPin: false,
            pending: true,
            message: "Your registration is pending admin approval.",
          });
        }
        return NextResponse.json({ found: false });
      }
      return NextResponse.json({
        found: true,
        hasPin: !!emp.pin_hash && emp.pin_hash !== "" && !emp.pin_hash.startsWith("$2a$10$placeholder"),
        name: emp.name,
      });
    }

    // LOGIN: verify phone + PIN
    if (action === "login") {
      const phone = normalize(body.phone || "");
      const pin = body.pin || "";
      if (!phone || !pin) {
        return NextResponse.json({ error: "Phone and PIN required" }, { status: 400 });
      }
      const { data: employees } = await supabase
        .from("employees")
        .select("id, employee_id, name, active, pin_hash, approved")
        .eq("phone", phone);

      const emp = (employees || []).find((e) => e.active && e.approved);
      if (!emp) {
        return NextResponse.json({ error: "Account not found or not approved" }, { status: 401 });
      }
      if (!emp.pin_hash || emp.pin_hash.startsWith("$2a$10$placeholder")) {
        return NextResponse.json({ error: "PIN not set. Please set your PIN first." }, { status: 401 });
      }
      const valid = await bcrypt.compare(pin, emp.pin_hash);
      if (!valid) {
        return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
      }

      const response = NextResponse.json({
        success: true,
        employee: { id: emp.id, employee_id: emp.employee_id, name: emp.name },
      });
      response.cookies.set("employee_id", emp.employee_id, {
        path: "/",
        maxAge: 12 * 60 * 60,
      });
      response.cookies.set("employee_name", emp.name, {
        path: "/",
        maxAge: 12 * 60 * 60,
      });
      response.cookies.set("employee_uuid", emp.id, {
        path: "/",
        maxAge: 12 * 60 * 60,
      });
      return response;
    }

    // REGISTER: new employee (name + phone + pin)
    if (action === "register") {
      const phone = normalize(body.phone || "");
      const name = (body.name || "").trim();
      const pin = body.pin || "";
      if (!phone || !name || pin.length !== 4) {
        return NextResponse.json({ error: "Name, phone, and 4-digit PIN required" }, { status: 400 });
      }

      // Check if phone already exists
      const { data: existing } = await supabase
        .from("employees")
        .select("id, approved, active")
        .eq("phone", phone);

      if (existing && existing.length > 0) {
        const active = existing.find((e) => e.active);
        if (active) {
          return NextResponse.json({ error: "Phone number already registered" }, { status: 400 });
        }
      }

      const pinHash = await bcrypt.hash(pin, 10);
      const empId = "EMP" + Date.now().toString().slice(-6);

      const { error: insertErr } = await supabase.from("employees").insert({
        employee_id: empId,
        name,
        phone,
        pin_hash: pinHash,
        role: "worker",
        active: true,
        approved: false,
      });

      if (insertErr) {
        return NextResponse.json({ error: "Registration failed: " + insertErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, pending: true });
    }

    // SET-PIN: for approved employees who don't have a PIN yet
    if (action === "set-pin") {
      const phone = normalize(body.phone || "");
      const pin = body.pin || "";
      if (!phone || pin.length !== 4) {
        return NextResponse.json({ error: "Phone and 4-digit PIN required" }, { status: 400 });
      }

      const { data: employees } = await supabase
        .from("employees")
        .select("id, employee_id, name, active, approved, pin_hash")
        .eq("phone", phone);

      const emp = (employees || []).find((e) => e.active && e.approved);
      if (!emp) {
        return NextResponse.json({ error: "Account not found or not approved" }, { status: 401 });
      }

      const pinHash = await bcrypt.hash(pin, 10);
      const { error: updateErr } = await supabase
        .from("employees")
        .update({ pin_hash: pinHash })
        .eq("id", emp.id);

      if (updateErr) {
        return NextResponse.json({ error: "Failed to set PIN" }, { status: 500 });
      }

      const response = NextResponse.json({
        success: true,
        employee: { id: emp.id, employee_id: emp.employee_id, name: emp.name },
      });
      response.cookies.set("employee_id", emp.employee_id, {
        path: "/",
        maxAge: 12 * 60 * 60,
      });
      response.cookies.set("employee_name", emp.name, {
        path: "/",
        maxAge: 12 * 60 * 60,
      });
      response.cookies.set("employee_uuid", emp.id, {
        path: "/",
        maxAge: 12 * 60 * 60,
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error: " + (err instanceof Error ? err.message : "unknown") },
      { status: 500 }
    );
  }
}
