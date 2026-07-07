import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Doctor, SymptomLookup, HealthIssueLookup, TabletLookup } from "@/lib/models";
import { comparePassword, signToken, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // Auto-seed default doctor if not present
    let defaultDoctor = await Doctor.findOne({ email: "doctor@gmail.com" });
    if (!defaultDoctor) {
      const defaultHash = await hashPassword("doctor123");
      defaultDoctor = await Doctor.create({
        name: "Doctor",
        email: "doctor@gmail.com",
        passwordHash: defaultHash,
        licenseId: "LIC-77777",
      });
    }

    // Auto-seed lookup suggestions if collections are empty
    if (defaultDoctor) {
      const docId = defaultDoctor._id;

      const symptomCount = await SymptomLookup.countDocuments();
      if (symptomCount === 0) {
        await SymptomLookup.insertMany([
          { value: "headache", status: "approved", createdBy: docId },
          { value: "fever", status: "approved", createdBy: docId },
          { value: "cough", status: "approved", createdBy: docId },
          { value: "body pain", status: "approved", createdBy: docId },
          { value: "nausea", status: "approved", createdBy: docId },
        ]);
      }

      const issueCount = await HealthIssueLookup.countDocuments();
      if (issueCount === 0) {
        await HealthIssueLookup.insertMany([
          { value: "sugar", status: "approved", createdBy: docId },
          { value: "diabetes", status: "approved", createdBy: docId },
          { value: "bp", status: "approved", createdBy: docId },
          { value: "hypertension", status: "approved", createdBy: docId },
          { value: "thyroid", status: "approved", createdBy: docId },
        ]);
      }

      const tabletCount = await TabletLookup.countDocuments();
      if (tabletCount === 0) {
        await TabletLookup.insertMany([
          { value: "Paracetamol 500mg", status: "approved", createdBy: docId },
          { value: "Metformin 500mg", status: "approved", createdBy: docId },
          { value: "Aspirin 75mg", status: "approved", createdBy: docId },
          { value: "Thyronorm 50mcg", status: "approved", createdBy: docId },
          { value: "Telmisartan 40mg", status: "approved", createdBy: docId },
        ]);
      }
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await comparePassword(password, doctor.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({
      doctorId: doctor._id.toString(),
      email: doctor.email,
      name: doctor.name,
    });

    const response = NextResponse.json({
      message: "Login successful",
      doctor: { id: doctor._id, name: doctor.name, email: doctor.email },
    });

    // Set HTTP-only cookie
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
