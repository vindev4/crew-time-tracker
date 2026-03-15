import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getAdminFromCookies } from "@/lib/auth";

// GET — list all registration requests
export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const { data: requests, error } = await supabase
      .from("registration_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }

    return NextResponse.json({ requests: requests || [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — approve or reject a registration request
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { request_id, action } = body; // action: 'approve' or 'reject'

    if (!request_id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Fetch the registration request
    const { data: regRequest } = await supabase
      .from("registration_requests")
      .select("*")
      .eq("id", request_id)
      .eq("status", "pending")
      .single();

    if (!regRequest) {
      return NextResponse.json({ error: "Request not found or already processed" }, { status: 404 });
    }

    if (action === "reject") {
      await supabase
        .from("registration_requests")
        .update({
          status: "rejected",
          reviewed_by: admin.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request_id);

      return NextResponse.json({ success: true, action: "rejected" });
    }

    // Approve — create the employee record
    // Check one more time that employee_id is not taken
    const { data: existing } = await supabase
      .from("employees")
      .select("id")
      .eq("employee_id", regRequest.desired_employee_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Employee ID is already taken. Reject this request and ask them to re-register with a different ID." },
        { status: 409 }
      );
    }

    // Create employee
    const { error: empError } = await supabase.from("employees").insert({
      employee_id: regRequest.desired_employee_id,
      name: regRequest.full_legal_name,
      full_legal_name: regRequest.full_legal_name,
      phone: regRequest.phone,
      email: regRequest.email,
      pin_hash: regRequest.pin_hash,
      role: "worker",
      active: true,
    });

    if (empError) {
      return NextResponse.json(
        { error: "Failed to create employee", details: empError },
        { status: 500 }
      );
    }

    // Update request status
    await supabase
      .from("registration_requests")
      .update({
        status: "approved",
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request_id);

    return NextResponse.json({
      success: true,
      action: "approved",
      employee_id: regRequest.desired_employee_id,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
