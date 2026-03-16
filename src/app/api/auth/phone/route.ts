import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, pin } = body;
    if (!phone) return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    const normalizedPhone = phone.replace(/\D/g, "");

    if (action === "lookup") {
      const { data: employees, error } = await supabase
        .from("employees")
        .select("employee_id, name, phone, active, pin_hash, approved")
        .eq("phone", normalizedPhone);
      if (error || !employees || employees.length === 0) {
        return NextResponse.json({ error: "Phone number not found. Contact your administrator." }, { status: 404 });
      }
      const employee = employees.find((e) => e.active) || employees[0];
      if (!employee.active) {
        return NextResponse.json({ error: "Access denied. Your account has been deactivated." }, { status: 403 });
      }
      const hasPin = !!employee.pin_hash && employee.pin_hash !== "$2a$10$placeholder";
      const isApproved = employee.approved === true;
      return NextResponse.json({
        employee_id: employee.employee_id,
        name: employee.name,
        has_pin: hasPin,
        approved: isApproved,
        pending: hasPin && !isApproved,
      });
    }

    if (action === "register") {
      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
      }
      const { data: employees, error: findErr } = await supabase
        .from("employees")
        .select("id, employee_id, name, active, pin_hash, approved")
        .eq("phone", normalizedPhone);
      if (findErr || !employees || employees.length === 0) {
        return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
      }
      const employee = employees.find((e) => e.active) || employees[0];
      if (!employee.active) {
        return NextResponse.json({ error: "Access denied. Your account has been deactivated." }, { status: 403 });
      }
      if (employee.pin_hash && employee.pin_hash !== "$2a$10$placeholder" && employee.approved) {
        return NextResponse.json({ error: "PIN already set. Use login instead." }, { status: 400 });
      }
      const hash = await bcrypt.hash(pin, 10);
      const updates: Record<string, unknown> = { pin_hash: hash };
      if (employee.approved !== true) updates.approved = false;
      const { error: updateErr } = await supabase.from("employees").update(updates).eq("id", employee.id);
      if (updateErr) return NextResponse.json({ error: "Failed to set PIN" }, { status: 500 });

      if (employee.approved === true) {
        const response = NextResponse.json({ success: true, employee_id: employee.employee_id, name: employee.name, logged_in: true });
        response.cookies.set("employee_id", employee.employee_id, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 60 * 60 * 24 * 30 });
        response.cookies.set("employee_name", employee.name, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 60 * 60 * 24 * 30 });
        return response;
      }
      return NextResponse.json({ success: true, pending_approval: true, message: "PIN set! Your registration is pending admin approval." });
    }

    if (action === "login") {
      if (!pin) return NextResponse.json({ error: "PIN is required" }, { status: 400 });
      const { data: employees, error: findErr } = await supabase
        .from("employees")
        .select("id, employee_id, name, active, pin_hash, approved")
        .eq("phone", normalizedPhone);
  .from("employees")
        .select("id, employee_id, name, active, pin_hash, approved")
        .eq("phone", normalizedPhone);
      if (findErr || !employees || employees.length === 0) {
        return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
      }
      const employee = employees.find((e) => e.active) || employees[0];
      if (!employee.active) return NextResponse.json({ error: "Access denied. Your account has been deactivated." }, { status: 403 });
      if (!employee.pin_hash || employee.pin_hash === "$2a$10$placeholder") {
        return NextResponse.json({ error: "Please set up your PIN first", needs_registration: true }, { status: 400 });
      }
      if (!employee.approved) return NextResponse.json({ error: "Your registration is pending admin approval." }, { status: 403 });
      const valid = await bcrypt.compare(pin, employee.pin_hash);
      if (!valid) return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
      const response = NextResponse.json({ success: true, employee_id: employee.employee_id, name: employee.name });
      response.cookies.set("employee_id", employee.employee_id, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 60 * 60 * 24 * 30 });
      response.cookies.set("employee_name", employee.name, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 60 * 60 * 24 * 30 });
      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Auth phone error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
