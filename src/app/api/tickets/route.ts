import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceSupabase } from "@/lib/supabase";

// Submit a work ticket
export async function POST(request: NextRequest) {
  try {
    const { employee_id, pin, notes } = await request.json();

    if (!employee_id || !pin || !notes) {
      return NextResponse.json(
        { error: "Employee ID, PIN, and notes are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Verify employee
    const { data: employee, error: authError } = await supabase
      .from("employees")
      .select("id, pin_hash")
      .eq("employee_id", employee_id)
      .eq("active", true)
      .single();

    if (authError || !employee) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const validPin = await bcrypt.compare(pin, employee.pin_hash);
    if (!validPin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        employee_id: employee.id,
        notes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to submit ticket" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ticket });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
