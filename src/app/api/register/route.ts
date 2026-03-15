import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_legal_name, phone, email, desired_employee_id, pin } = body;

    if (!full_legal_name || !phone || !desired_employee_id || !pin) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    if (pin.length < 4) {
      return NextResponse.json(
        { error: "PIN must be at least 4 characters" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Check if employee ID already exists
    const { data: existing } = await supabase
      .from("employees")
      .select("id")
      .eq("employee_id", desired_employee_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This Employee ID is already taken. Please choose a different one." },
        { status: 409 }
      );
    }

    // Check if there's already a pending request with this ID
    const { data: pendingReq } = await supabase
      .from("registration_requests")
      .select("id")
      .eq("desired_employee_id", desired_employee_id)
      .eq("status", "pending")
      .single();

    if (pendingReq) {
      return NextResponse.json(
        { error: "This Employee ID already has a pending registration request." },
        { status: 409 }
      );
    }

    // Hash the PIN
    const bcrypt = await import("bcryptjs");
    const pinHash = await bcrypt.hash(pin, 10);

    // Insert registration request
    const { error: insertError } = await supabase
      .from("registration_requests")
      .insert({
        full_legal_name,
        phone,
        email: email || null,
        desired_employee_id,
        pin_hash: pinHash,
        status: "pending",
      });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to submit registration", details: insertError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Registration request submitted. Awaiting admin approval.",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}