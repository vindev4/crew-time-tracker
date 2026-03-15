import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceSupabase } from "@/lib/supabase";
import { getAdminFromCookies } from "@/lib/auth";

// Get all employees
export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const { data: employees, error } = await supabase
      .from("employees")
      .select("id, employee_id, name, role, active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch employees" },
        { status: 500 }
      );
    }

    return NextResponse.json({ employees });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add a new employee
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { employee_id, name, pin, role } = await request.json();

    if (!employee_id || !name || !pin) {
      return NextResponse.json(
        { error: "Employee ID, name, and PIN are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const pin_hash = await bcrypt.hash(pin, 10);

    const { data: employee, error } = await supabase
      .from("employees")
      .insert({
        employee_id,
        name,
        pin_hash,
        role: role || "worker",
      })
      .select("id, employee_id, name, role, active, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Employee ID already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to add employee" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, employee });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update an employee (deactivate, change role, reset PIN)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, active, role, pin } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const updates: Record<string, unknown> = {};

    if (typeof active === "boolean") updates.active = active;
    if (role) updates.role = role;
    if (pin) updates.pin_hash = await bcrypt.hash(pin, 10);

    const { data: employee, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id)
      .select("id, employee_id, name, role, active, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update employee" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, employee });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
