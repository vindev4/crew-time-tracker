import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServiceSupabase } from "@/lib/supabase";

// Seed initial super admin and test employee — call once then delete this route
export async function POST(request: NextRequest) {
  try {
    const { seed_secret } = await request.json();

    // Simple protection — set SEED_SECRET env var or use default
    if (seed_secret !== (process.env.SEED_SECRET || "setup-crew-tracker-2024")) {
      return NextResponse.json({ error: "Invalid seed secret" }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Create super admin (username: admin, password: admin123)
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    const { error: adminError } = await supabase
      .from("admins")
      .upsert({
        username: "admin",
        password_hash: adminPasswordHash,
        role: "super_admin",
      }, { onConflict: "username" });

    // Create test employee (ID: 001, PIN: 1234)
    const testPinHash = await bcrypt.hash("1234", 10);
    const { error: empError } = await supabase
      .from("employees")
      .upsert({
        employee_id: "001",
        name: "Test Worker",
        pin_hash: testPinHash,
        role: "worker",
      }, { onConflict: "employee_id" });

    if (adminError || empError) {
      return NextResponse.json(
        { error: "Seed failed", details: { adminError, empError } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Seeded successfully",
      credentials: {
        admin: { username: "admin", password: "admin123" },
        testWorker: { employee_id: "001", pin: "1234" },
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
