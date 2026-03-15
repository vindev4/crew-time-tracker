import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceSupabase } from "@/lib/supabase";

// Worker authentication: Employee ID + PIN
export async function POST(request: NextRequest) {
  try {
    const { employee_id, pin } = await request.json();

    if (!employee_id || !pin) {
      return NextResponse.json(
        { error: "Employee ID and PIN are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: employee, error } = await supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("active", true)
      .single();

    if (error || !employee) {
      return NextResponse.json(
        { error: "Invalid Employee ID or PIN" },
        { status: 401 }
      );
    }

    const validPin = await bcrypt.compare(pin, employee.pin_hash);
    if (!validPin) {
      return NextResponse.json(
        { error: "Invalid Employee ID or PIN" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        employee_id: employee.employee_id,
        name: employee.name,
        role: employee.role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
