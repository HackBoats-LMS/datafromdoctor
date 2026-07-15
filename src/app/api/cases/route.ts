import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Case, SymptomLookup, HealthIssueLookup, TabletLookup } from "@/lib/models";
import { getDoctorFromSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getDoctorFromSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const {
      symptom,
      healthIssues,
      foodIntake,
      allergies,
      currentMedications,
      suggestedTablet,
      dosageNotes,
      othersCauses,
    } = body;

    if (!symptom || (Array.isArray(symptom) && symptom.length === 0) || !suggestedTablet) {
      return NextResponse.json({ error: "Missing required fields: symptom or suggestedTablet" }, { status: 400 });
    }

    const doctorId = session.doctorId;

    // Create the case
    const newCase = await Case.create({
      symptom: Array.isArray(symptom) ? symptom : [symptom],
      healthIssues: healthIssues || [],
      foodIntake: foodIntake || "normal",
      allergies: allergies || [],
      currentMedications: currentMedications || [],
      suggestedTablet,
      dosageNotes: dosageNotes || "",
      othersCauses: Array.isArray(othersCauses) ? othersCauses : (othersCauses ? [othersCauses] : []),
      doctorId,
      status: "active",
      version: 1,
    });

    // Helper function to handle lookup registration (inserted as 'pending')
    const registerLookup = async (model: any, value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      try {
        // Find existing case-insensitive or exact
        const existing = await model.findOne({ value: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") } });
        if (!existing) {
          await model.create({
            value: trimmed,
            status: "approved",
            createdBy: doctorId,
          });
        }
      } catch (err: any) {
        // Skip duplicate errors due to concurrent calls
        if (err.code !== 11000) {
          console.error("Lookup insert error:", err);
        }
      }
    };

    // Register symptoms
    if (Array.isArray(symptom)) {
      for (const sym of symptom) {
        await registerLookup(SymptomLookup, sym);
      }
    } else {
      await registerLookup(SymptomLookup, symptom);
    }

    // Register suggested tablet
    await registerLookup(TabletLookup, suggestedTablet);

    // Register health issues
    if (Array.isArray(healthIssues)) {
      for (const issue of healthIssues) {
        await registerLookup(HealthIssueLookup, issue);
      }
    }

    return NextResponse.json({ message: "Case saved successfully", case: newCase }, { status: 201 });
  } catch (error: any) {
    console.error("Create case error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getDoctorFromSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status") || "active";

    const query: any = { status };

    const skip = (page - 1) * limit;

    const cases = await Case.find(query)
      .populate("doctorId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Case.countDocuments(query);

    return NextResponse.json({
      cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Fetch cases error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function escapeRegex(string: string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}
