import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getAdminFromCookies } from "@/lib/auth";

// Get all punches with filters
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const employeeId = searchParams.get("employee_id");

    const supabase = getServiceSupabase();

    let query = supabase
      .from("punches")
      .select(
        `
        *,
        employees!inner(employee_id, name)
      `
      )
      .order("timestamp", { ascending: false });

    if (startDate) {
      query = query.gte("timestamp", startDate);
    }
    if (endDate) {
      query = query.lte("timestamp", endDate + "T23:59:59");
    }
    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    const { data: punches, error } = await query.limit(500);

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

// Edit a punch entry
export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, type, timestamp } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Punch ID is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const updates: Record<string, unknown> = {};

    if (type) updates.type = type;
    if (timestamp) updates.timestamp = timestamp;

    const { data: punch, error } = await supabase
      .from("punches")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update punch" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, punch });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
