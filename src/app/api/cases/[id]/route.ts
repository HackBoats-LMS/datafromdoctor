import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Case, SymptomLookup, HealthIssueLookup, TabletLookup } from "@/lib/models";
import { getDoctorFromSession } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getDoctorFromSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const caseId = params.id;
    const body = await req.json();

    const {
      symptom,
      healthIssues,
      foodIntake,
      allergies,
      currentMedications,
      suggestedTablet,
      dosageNotes,
    } = body;

    if (!symptom || (Array.isArray(symptom) && symptom.length === 0) || !suggestedTablet) {
      return NextResponse.json({ error: "Missing required fields: symptom or suggestedTablet" }, { status: 400 });
    }

    // Find the current case
    const oldCase = await Case.findById(caseId);
    if (!oldCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const doctorId = session.doctorId;

    // Create a new version of the case
    const newCase = await Case.create({
      symptom: Array.isArray(symptom) ? symptom : [symptom],
      healthIssues: healthIssues || [],
      foodIntake: foodIntake || "normal",
      allergies: allergies || [],
      currentMedications: currentMedications || [],
      suggestedTablet,
      dosageNotes: dosageNotes || "",
      doctorId,
      status: "active",
      version: oldCase.version + 1,
      previousVersionId: oldCase._id,
    });

    // Update old case's status to revised
    oldCase.status = "revised";
    await oldCase.save();

    // Helper function to handle lookup registration (inserted as 'pending')
    const registerLookup = async (model: any, value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      try {
        const existing = await model.findOne({ value: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") } });
        if (!existing) {
          await model.create({
            value: trimmed,
            status: "approved",
            createdBy: doctorId,
          });
        }
      } catch (err: any) {
        if (err.code !== 11000) {
          console.error("Lookup insert error:", err);
        }
      }
    };

    // Register symptoms, tablet, issues
    if (Array.isArray(symptom)) {
      for (const sym of symptom) {
        await registerLookup(SymptomLookup, sym);
      }
    } else {
      await registerLookup(SymptomLookup, symptom);
    }
    await registerLookup(TabletLookup, suggestedTablet);
    if (Array.isArray(healthIssues)) {
      for (const issue of healthIssues) {
        await registerLookup(HealthIssueLookup, issue);
      }
    }

    return NextResponse.json({ message: "Case updated (new version created)", case: newCase });
  } catch (error: any) {
    console.error("Patch case error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function escapeRegex(string: string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}
