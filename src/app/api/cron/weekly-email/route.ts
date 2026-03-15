import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

// This route is designed to be called by a Vercel Cron Job once per week.
// It generates an Excel summary of the week's reports and emails it using Resend.
//
// To activate:
// 1. Add RESEND_API_KEY and REPORT_EMAIL_TO to your environment variables
// 2. Add to vercel.json:
//    { "crons": [{ "path": "/api/cron/weekly-email", "schedule": "0 8 * * 1" }] }
//
// For now this is a stub that returns the data it WOULD email.

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sends this header)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Get reports from the past 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    const { data: reports } = await supabase
      .from("daily_reports")
      .select("*, employees!daily_reports_employee_id_fkey(employee_id, name)")
      .gte("report_date", weekAgoStr)
      .order("report_date", { ascending: false });

    const reportCount = reports?.length || 0;

    // Check if Resend is configured
    const resendKey = process.env.RESEND_API_KEY;
    const emailTo = process.env.REPORT_EMAIL_TO;

    if (!resendKey || !emailTo) {
      return NextResponse.json({
        status: "stub",
        message: "Email not configured. Set RESEND_API_KEY and REPORT_EMAIL_TO env vars.",
        report_count: reportCount,
        week_start: weekAgoStr,
      });
    }

    // TODO: When Resend is configured, uncomment below:
    // const ExcelJS = await import("exceljs");
    // const workbook = new ExcelJS.Workbook();
    // ... build workbook similar to export-reports route ...
    // const buffer = await workbook.xlsx.writeBuffer();
    //
    // const { Resend } = await import("resend");
    // const resend = new Resend(resendKey);
    //
    // await resend.emails.send({
    //   from: "reports@duraport.org",
    //   to: emailTo,
    //   subject: `Weekly Field Reports Summary - ${weekAgoStr} to ${new Date().toISOString().split("T")[0]}`,
    //   text: `${reportCount} field reports were submitted this week. See attached Excel file.`,
    //   attachments: [{
    //     filename: `weekly-reports-${weekAgoStr}.xlsx`,
    //     content: Buffer.from(buffer).toString("base64"),
    //   }],
    // });

    return NextResponse.json({
      status: "stub",
      message: "Resend configured but sending is commented out. Uncomment to activate.",
      report_count: reportCount,
      week_start: weekAgoStr,
      email_to: emailTo,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}