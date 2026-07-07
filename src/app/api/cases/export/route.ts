import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Case } from "@/lib/models";
import { getDoctorFromSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getDoctorFromSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch all cases in the database
    const cases = await Case.find({})
      .populate("doctorId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Convert cases to string format
    const jsonString = JSON.stringify(cases, null, 2);

    // Return response with headers to prompt a file download dialog in the browser
    return new Response(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=clinical_cases.json",
      },
    });
  } catch (error: any) {
    console.error("Export cases error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
