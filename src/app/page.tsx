"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Autocomplete from "@/components/Autocomplete";

function CaseFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Keep symptoms as an array of strings in separate blocks
  const [symptoms, setSymptoms] = useState<string[]>([""]);
  const [healthIssues, setHealthIssues] = useState<string[]>([]);
  const [foodIntake, setFoodIntake] = useState("after food");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [currentMedications, setCurrentMedications] = useState<string[]>([]);
  const [suggestedTablet, setSuggestedTablet] = useState("");
  const [dosageNotes, setDosageNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [originalVersion, setOriginalVersion] = useState<number | null>(null);

  // Load existing case if editId is provided
  useEffect(() => {
    if (!editId) return;

    const loadCase = async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/cases?limit=100`);
        if (res.ok) {
          const data = await res.json();
          const targetCase = data.cases?.find((c: any) => c._id === editId);
          if (targetCase) {
            setSymptoms(Array.isArray(targetCase.symptom) ? targetCase.symptom : [targetCase.symptom || ""]);
            setHealthIssues(targetCase.healthIssues || []);
            setFoodIntake(targetCase.foodIntake || "after food");
            setAllergies(targetCase.allergies || []);
            setCurrentMedications(targetCase.currentMedications || []);
            setSuggestedTablet(targetCase.suggestedTablet || "");
            setDosageNotes(targetCase.dosageNotes || "");
            setOriginalVersion(targetCase.version || 1);
          } else {
            setMessage({ type: "error", text: "Case not found for editing" });
          }
        }
      } catch (err) {
        console.error("Error loading case:", err);
        setMessage({ type: "error", text: "Failed to load case data" });
      } finally {
        setFetching(false);
      }
    };

    loadCase();
  }, [editId]);

  const handleSymptomChange = (index: number, val: string) => {
    const updated = [...symptoms];
    updated[index] = val;
    setSymptoms(updated);
  };

  const addSymptomBlock = () => {
    setSymptoms([...symptoms, ""]);
  };

  const removeSymptomBlock = (index: number) => {
    if (symptoms.length > 1) {
      setSymptoms(symptoms.filter((_, idx) => idx !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const filteredSymptoms = symptoms.map((s) => s.trim()).filter((s) => s !== "");

    if (filteredSymptoms.length === 0) {
      setMessage({ type: "error", text: "Please enter at least one primary symptom" });
      setLoading(false);
      return;
    }

    const payload = {
      symptom: filteredSymptoms,
      healthIssues,
      foodIntake,
      allergies,
      currentMedications,
      suggestedTablet,
      dosageNotes,
    };

    try {
      const url = editId ? `/api/cases/${editId}` : "/api/cases";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process case submission");
      }

      setMessage({
        type: "success",
        text: editId
          ? `Case revised successfully. Created Version ${originalVersion ? originalVersion + 1 : 2}!`
          : "Patient case logged successfully! Lookup items are queued for approval.",
      });

      if (!editId) {
        setSymptoms([""]);
        setHealthIssues([]);
        setFoodIntake("after food");
        setAllergies([]);
        setCurrentMedications([]);
        setSuggestedTablet("");
        setDosageNotes("");
      } else {
        setTimeout(() => {
          router.push("/cases");
        }, 1500);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div style={{ textAlign: "center", padding: "4rem" }}>Loading patient case profile...</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">{editId ? `Revise Patient Case (v${originalVersion})` : "Log Patient Case"}</h1>
          <p className="page-subtitle">
            {editId
              ? "Submit edits to spawn a new clinical history version"
              : "Enter clinical diagnostics and pharmaceutical suggestions"}
          </p>
        </div>
      </div>

      {message && <div className={`toast toast-${message.type}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className="card">
        {/* Patient Context Section */}
        <h3 style={{ fontSize: "1.2rem", color: "var(--primary)", marginBottom: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
          1. Patient Context
        </h3>

        {/* Symptoms Dynamic Blocks */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
            Patient Symptoms <span className="required">*</span>
          </label>
          
          {symptoms.map((symValue, idx) => (
            <div key={idx} style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ flex: 1 }}>
                <Autocomplete
                  field="symptom"
                  value={symValue}
                  onChange={(val) => handleSymptomChange(idx, val)}
                  required
                  noMargin={true}
                  placeholder={`Symptom #${idx + 1} (e.g. headache, fever)...`}
                />
              </div>
              {symptoms.length > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    padding: "0 1rem",
                    height: "45px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 0
                  }}
                  onClick={() => removeSymptomBlock(idx)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem", display: "inline-flex", gap: "0.3rem" }}
            onClick={addSymptomBlock}
          >
            ➕ Add Another Symptom
          </button>
        </div>

        <Autocomplete
          field="healthIssues"
          label="Health Issues (Comorbidities)"
          value={healthIssues}
          onChange={setHealthIssues}
          isMulti
          placeholder="Type health conditions (e.g. diabetes, thyroid, BP) and press Enter"
        />

        {/* Treatment Plan Section */}
        <h3 style={{ fontSize: "1.2rem", color: "var(--accent)", marginTop: "2rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
          2. Treatment Plan
        </h3>

        <Autocomplete
          field="tablet"
          label="Suggested Tablet Name"
          value={suggestedTablet}
          onChange={setSuggestedTablet}
          required
          placeholder="Search registered tablets (e.g. Paracetamol 500mg, Metformin)..."
        />

        <div className="form-group">
          <label className="form-label">Dosage Instructions / Take Routine</label>
          <textarea
            value={dosageNotes}
            onChange={(e) => setDosageNotes(e.target.value)}
            className="form-control"
            placeholder="e.g. Once daily, twice daily after dinner, etc."
            rows={3}
            style={{ resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "2.5rem" }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
            {loading ? "Saving case..." : editId ? `Save Revision v${originalVersion ? originalVersion + 1 : 2}` : "Submit Patient Case"}
          </button>
          {editId && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => router.push("/cases")}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function CaseFormPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "4rem" }}>Loading page wrapper...</div>}>
      <CaseFormContent />
    </Suspense>
  );
}
