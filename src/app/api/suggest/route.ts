import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { SymptomLookup, HealthIssueLookup, TabletLookup } from "@/lib/models";
import { getDoctorFromSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getDoctorFromSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const field = searchParams.get("field");
    const query = searchParams.get("query") || "";

    if (!field) {
      return NextResponse.json({ error: "Missing required parameter: field" }, { status: 400 });
    }

    let model: any;
    if (field === "symptom") {
      model = SymptomLookup;
    } else if (field === "healthIssues" || field === "healthIssue") {
      model = HealthIssueLookup;
    } else if (field === "tablet" || field === "suggestedTablet") {
      model = TabletLookup;
    } else {
      return NextResponse.json({ error: "Invalid field parameter" }, { status: 400 });
    }

    // Escape query regex characters
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    
    // Prefix match anchored at the start: ^query
    const regex = new RegExp(`^${escapedQuery}`, "i");

    // Only query approved entries
    const results = await model.find({
      status: "approved",
      value: { $regex: regex }
    })
    .limit(10)
    .select("value")
    .lean();

    const suggestions = results.map((r: any) => r.value);
    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("Suggest API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
