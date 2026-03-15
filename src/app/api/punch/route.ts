import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceSupabase } from "@/lib/supabase";

// Record a punch (clock in or clock out)
export async function POST(request: NextRequest) {
  try {
    const { employee_id, pin, type, lat, lng, gps_available } =
      await request.json();

    if (!employee_id || !pin || !type) {
      return NextResponse.json(
        { error: "Employee ID, PIN, and punch type are required" },
        { status: 400 }
      );
    }

    if (!["clock_in", "clock_out"].includes(type)) {
      return NextResponse.json(
        { error: "Punch type must be clock_in or clock_out" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Verify employee
    const { data: employee, error: authError } = await supabase
      .from("employees")
      .select("id, employee_id, name")
      .eq("employee_id", employee_id)
      .eq("active", true)
      .single();

    if (authError || !employee) {
      return NextResponse.json(
        { error: "Invalid Employee ID or PIN" },
        { status: 401 }
      );
    }

    // Verify PIN
    const { data: empFull } = await supabase
      .from("employees")
      .select("pin_hash")
      .eq("id", employee.id)
      .single();

    const validPin = await bcrypt.compare(pin, empFull!.pin_hash);
    if (!validPin) {
      return NextResponse.json(
        { error: "Invalid Employee ID or PIN" },
        { status: 401 }
      );
    }

    // Record the punch
    const { data: punch, error: punchError } = await supabase
      .from("punches")
      .insert({
        employee_id: employee.id,
        type,
        lat: lat || null,
        lng: lng || null,
        gps_available: gps_available || false,
      })
      .select()
      .single();

    if (punchError) {
      return NextResponse.json(
        { error: "Failed to record punch" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      punch,
      employee: { name: employee.name, employee_id: employee.employee_id },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get punch history for a worker
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeUuid = searchParams.get("employee_id");

    if (!employeeUuid) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: punches, error } = await supabase
      .from("punches")
      .select("*")
      .eq("employee_id", employeeUuid)
      .order("timestamp", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch punches" },
        { status: 500 }
      );
    }

    return NextResponse.json({ punches });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
