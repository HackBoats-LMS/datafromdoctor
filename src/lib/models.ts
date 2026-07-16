import mongoose, { Schema, Document, Model } from "mongoose";

// Doctor Schema
export interface IDoctor extends Document {
  name: string;
  email: string;
  passwordHash: string;
  licenseId?: string;
  createdAt: Date;
}

const DoctorSchema = new Schema<IDoctor>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  licenseId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Doctor: Model<IDoctor> = mongoose.models.Doctor || mongoose.model<IDoctor>("Doctor", DoctorSchema);

// Case Schema
export interface ICase extends Document {
  symptom: string[];
  healthIssues: string[];
  foodIntake: string;
  allergies: string[];
  currentMedications: string[];
  suggestedTablet: string;
  dosageNotes?: string;
  consultDoctor?: boolean;
  suggestions?: string[];
  othersCauses?: string[];
  age?: string;
  doctorId: mongoose.Types.ObjectId;
  status: "active" | "revised" | "archived";
  version: number;
  previousVersionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema = new Schema<ICase>(
  {
    symptom: [{ type: String, required: true, trim: true }],
    healthIssues: [{ type: String, trim: true }],
    foodIntake: { type: String, required: true, trim: true },
    allergies: { type: [String], required: true },
    currentMedications: { type: [String], required: true },
    suggestedTablet: { type: String, required: true, trim: true },
    dosageNotes: { type: String, trim: true },
    consultDoctor: { type: Boolean, default: false },
    suggestions: [{ type: String, trim: true }],
    othersCauses: [{ type: String, trim: true }],
    age: { type: String, enum: ["less than 5 years", "5-13 years", "13+ years"] },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    status: { type: String, enum: ["active", "revised", "archived"], default: "active" },
    version: { type: Number, default: 1 },
    previousVersionId: { type: Schema.Types.ObjectId, ref: "Case" },
  },
  { timestamps: true }
);

// Indexes on Case
CaseSchema.index({ doctorId: 1, createdAt: -1 });

if (mongoose.models.Case) {
  delete mongoose.models.Case;
}
export const Case: Model<ICase> = mongoose.model<ICase>("Case", CaseSchema);

// Lookup Schema template
export interface ILookup extends Document {
  value: string;
  status: "pending" | "approved";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const createLookupSchema = (collectionName: string) => {
  const schema = new Schema<ILookup>({
    value: { type: String, required: true, unique: true, index: true, trim: true },
    status: { type: String, enum: ["pending", "approved"], default: "pending" },
    createdBy: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    createdAt: { type: Date, default: Date.now },
  });
  return schema;
};

export const SymptomLookup: Model<ILookup> =
  mongoose.models.SymptomLookup || mongoose.model<ILookup>("SymptomLookup", createLookupSchema("symptomlookups"));

export const HealthIssueLookup: Model<ILookup> =
  mongoose.models.HealthIssueLookup || mongoose.model<ILookup>("HealthIssueLookup", createLookupSchema("healthissuelookups"));

export const TabletLookup: Model<ILookup> =
  mongoose.models.TabletLookup || mongoose.model<ILookup>("TabletLookup", createLookupSchema("tabletlookups"));
