import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const reportId = formData.get("report_id") as string | null;
    const caption = formData.get("caption") as string | null;
    const employeeId = formData.get("employee_id") as string | null;
    const pin = formData.get("pin") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!employeeId || !pin) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, WebP, HEIC allowed." }, { status: 400 });
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Authenticate worker
    const { data: emp } = await supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("active", true)
      .single();

    if (!emp) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(pin, emp.pin_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const fileName = `${reportId || "temp"}/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("report-photos")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload file", details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("report-photos")
      .getPublicUrl(fileName);

    // If we have a report_id, save to report_photos table
    if (reportId) {
      await supabase.from("report_photos").insert({
        report_id: reportId,
        storage_path: fileName,
        public_url: urlData.publicUrl,
        caption: caption || null,
        file_size: file.size,
        mime_type: file.type,
      });
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: fileName,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}