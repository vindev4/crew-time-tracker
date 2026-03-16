import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/auth/phone
// Actions: "lookup" (find by phone), "register" (set password), "login" (verify password)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, password } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Normalize phone - strip non-digits
    const normalizedPhone = phone.replace(/\D/g, "");

    if (action === "lookup") {
      // Find employee by phone number
      const { data: employee, error } = await supabase
        .from("employees")
        .select("employee_id, name, phone, active, password_hash")
        .eq("phone", normalizedPhone)
        .single();

      if (error || !employee) {
        return NextResponse.json({ error: "Phone number not found. Contact your administrator." }, { status: 404 });
      }

      if (!employee.active) {
        return NextResponse.json({ error: "Access denied. Your account has been deactivated." }, { status: 403 });
      }

      return NextResponse.json({
        employee_id: employee.employee_id,
        name: employee.name,
        has_password: !!employee.password_hash,
      });
    }

    if (action === "register") {
      // Set password for first-time user
      if (!password || password.length < 4) {
        return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
      }

      const { data: employee, error: findErr } = await supabase
        .from("employees")
        .select("employee_id, name, active, password_hash")
        .eq("phone", normalizedPhone)
        .single();

      if (findErr || !employee) {
        return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
      }

      if (!employee.active) {
        return NextResponse.json({ error: "Access denied. Your account has been deactivated." }, { status: 403 });
      }

      if (employee.password_hash && employee.password_hash !== "$2a$10$placeholder") {
        return NextResponse.json({ error: "Password already set. Use login instead." }, { status: 400 });
      }

      const hash = await bcrypt.hash(password, 10);
      const { error: updateErr } = await supabase
        .from("employees")
        .update({ password_hash: hash })
        .eq("phone", normalizedPhone);

      if (updateErr) {
        return NextResponse.json({ error: "Failed to set password" }, { status: 500 });
      }

      // Set auth cookie
      const response = NextResponse.json({
        success: true,
        employee_id: employee.employee_id,
        name: employee.name,
      });

      response.cookies.set("employee_id", employee.employee_id, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      response.cookies.set("employee_name", employee.name, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    if (action === "login") {
      if (!password) {
        return NextResponse.json({ error: "Password is required" }, { status: 400 });
      }

      const { data: employee, error: findErr } = await supabase
        .from("employees")
        .select("employee_id, name, active, password_hash")
        .eq("phone", normalizedPhone)
        .single();

      if (findErr || !employee) {
        return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
      }

      if (!employee.active) {
        return NextResponse.json({ error: "Access denied. Your account has been deactivated." }, { status: 403 });
      }

      if (!employee.password_hash || employee.password_hash === "$2a$10$placeholder") {
        return NextResponse.json({ error: "Please set up your password first", needs_registration: true }, { status: 400 });
      }

      const valid = await bcrypt.compare(password, employee.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
      }

      const response = NextResponse.json({
        success: true,
        employee_id: employee.employee_id,
        name: employee.name,
      });

      response.cookies.set("employee_id", employee.employee_id, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30,
      });
      response.cookies.set("employee_name", employee.name, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30,
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Auth phone error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
