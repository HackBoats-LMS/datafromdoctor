"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Autocomplete from "@/components/Autocomplete";

interface Recommendation {
  tablet: string;
  confidence: number;
}

function CaseFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  // Keep symptoms as an array of strings in separate blocks
  const [symptoms, setSymptoms] = useState<string[]>([""]);
  const [healthIssues, setHealthIssues] = useState<string[]>([]);
  const [pendingHealthIssue, setPendingHealthIssue] = useState<string>("");
  const [foodIntake, setFoodIntake] = useState("after food");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [currentMedications, setCurrentMedications] = useState<string[]>([]);
  const [othersCauses, setOthersCauses] = useState<string[]>([""]);
  const [age, setAge] = useState<string>("");
  const [prescriptions, setPrescriptions] = useState([{ tablet: "", dosage: "" }]);
  const [consultDoctor, setConsultDoctor] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([""]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

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
            setOthersCauses(Array.isArray(targetCase.othersCauses) ? targetCase.othersCauses : [targetCase.othersCauses || ""]);
            setAge(targetCase.age || "");
            
            if (targetCase.prescriptions && targetCase.prescriptions.length > 0) {
              setPrescriptions(targetCase.prescriptions);
            } else if (targetCase.suggestedTablet) {
              setPrescriptions([{ tablet: targetCase.suggestedTablet, dosage: targetCase.dosageNotes || "" }]);
            } else {
              setPrescriptions([{ tablet: "", dosage: "" }]);
            }
            
            setConsultDoctor(targetCase.consultDoctor || false);
            setSuggestions(targetCase.suggestions?.length ? targetCase.suggestions : [""]);
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

  // Load real-time recommendations (debounced)
  useEffect(() => {
    const activeSymptoms = symptoms.map(s => s.trim()).filter(s => s !== "");
    if (activeSymptoms.length === 0) {
      setRecommendations([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/cases/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symptom: activeSymptoms, healthIssues }),
        });
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
      } catch (err) {
        console.error("Failed to load tablet recommendations:", err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [symptoms, healthIssues]);

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

  const handleOthersCausesChange = (index: number, val: string) => {
    const updated = [...othersCauses];
    updated[index] = val;
    setOthersCauses(updated);
  };

  const addOthersCausesBlock = () => {
    setOthersCauses([...othersCauses, ""]);
  };

  const removeOthersCausesBlock = (index: number) => {
    if (othersCauses.length > 1) {
      setOthersCauses(othersCauses.filter((_, idx) => idx !== index));
    }
  };

  const handleSuggestionChange = (index: number, val: string) => {
    const updated = [...suggestions];
    updated[index] = val;
    setSuggestions(updated);
  };

  const addSuggestionBlock = () => {
    setSuggestions([...suggestions, ""]);
  };

  const removeSuggestionBlock = (index: number) => {
    if (suggestions.length > 1) {
      setSuggestions(suggestions.filter((_, idx) => idx !== index));
    }
  };

  const handlePrescriptionChange = (index: number, field: "tablet" | "dosage", val: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: val };
    setPrescriptions(updated);
  };

  const addPrescriptionBlock = () => {
    setPrescriptions([...prescriptions, { tablet: "", dosage: "" }]);
  };

  const removePrescriptionBlock = (index: number) => {
    if (prescriptions.length > 1) {
      setPrescriptions(prescriptions.filter((_, idx) => idx !== index));
    }
  };

  const handleRecommendationClick = (recTablet: string) => {
    const lastIdx = prescriptions.length - 1;
    if (prescriptions[lastIdx].tablet.trim() === "") {
      handlePrescriptionChange(lastIdx, "tablet", recTablet);
    } else {
      setPrescriptions([...prescriptions, { tablet: recTablet, dosage: "" }]);
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

    const filteredOthersCauses = othersCauses.map((c) => c.trim()).filter((c) => c !== "");
    const filteredSuggestions = suggestions.map((c) => c.trim()).filter((c) => c !== "");
    
    // Make sure we capture anything the user typed but didn't press enter on
    const finalHealthIssues = [...healthIssues];
    if (pendingHealthIssue.trim() && !finalHealthIssues.includes(pendingHealthIssue.trim())) {
      finalHealthIssues.push(pendingHealthIssue.trim());
    }

    const payload = {
      symptom: filteredSymptoms,
      healthIssues: finalHealthIssues,
      foodIntake,
      allergies,
      currentMedications,
      prescriptions,
      consultDoctor,
      suggestions: filteredSuggestions,
      othersCauses: filteredOthersCauses,
      age,
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
          : "Patient case logged successfully!",
      });

      if (!editId) {
        setSymptoms([""]);
        setHealthIssues([]);
        setFoodIntake("after food");
        setAllergies([]);
        setCurrentMedications([]);
        setOthersCauses([""]);
        setAge("");
        setPrescriptions([{ tablet: "", dosage: "" }]);
        setConsultDoctor(false);
        setSuggestions([""]);
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
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem", display: "inline-flex", gap: "0.3rem", alignItems: "center" }}
            onClick={addSymptomBlock}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Another Symptom
          </button>
        </div>

        <Autocomplete
          field="healthIssues"
          label="Health Issues (Comorbidities)"
          value={healthIssues}
          onChange={setHealthIssues}
          onInputChange={setPendingHealthIssue}
          isMulti
          placeholder="Type health conditions (e.g. diabetes, thyroid, BP) and press Enter"
        />

        <div style={{ marginBottom: "1.5rem" }}>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
            Others Causes
          </label>
          
          {othersCauses.map((causeValue, idx) => (
            <div key={idx} style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  className="form-control"
                  value={causeValue}
                  onChange={(e) => handleOthersCausesChange(idx, e.target.value)}
                  placeholder={`Other Cause #${idx + 1} (e.g. stress, lack of sleep)...`}
                />
              </div>
              {othersCauses.length > 1 && (
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
                  onClick={() => removeOthersCausesBlock(idx)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem", display: "inline-flex", gap: "0.3rem", alignItems: "center" }}
            onClick={addOthersCausesBlock}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Other Cause
          </button>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
            Patient Age Range
          </label>
          <select
            className="form-control"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", backgroundColor: "#fff" }}
          >
            <option value="">Select Age Group...</option>
            <option value="less than 5 years">less than 5 years</option>
            <option value="5-13 years">5-13 years</option>
            <option value="13+ years">13+ years</option>
            <option value="5+ years">5+ years</option>
          </select>
        </div>

        {/* Real-time Recommendations Suggestion Box */}
        {recommendations.length > 0 && (
          <div style={{
            backgroundColor: "rgba(2, 132, 199, 0.04)",
            border: "1px solid rgba(2, 132, 199, 0.12)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            marginBottom: "1.5rem"
          }}>
            <h4 style={{ fontSize: "0.9rem", color: "var(--primary)", fontWeight: "600", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "18px", height: "18px", color: "var(--primary)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l8.982-2.13 1.9-4.82L9.813 15.904Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.071 3.386a.25.25 0 0 0-.417 0l-3.86 5.143a.25.25 0 0 0 .193.393h7.734a.25.25 0 0 0 .193-.393l-3.86-5.143Z" />
              </svg>
              Recommended Tablets (Based on similar cases):
            </h4>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {recommendations.map((rec) => (
                <button
                  key={rec.tablet}
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    padding: "0.4rem 0.8rem",
                    fontSize: "0.85rem",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--border)",
                    marginTop: 0,
                    cursor: "pointer"
                  }}
                  onClick={() => handleRecommendationClick(rec.tablet)}
                >
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{rec.tablet}</span>
                  <span className="badge badge-active" style={{ fontSize: "0.7rem", padding: "0.1rem 0.35rem" }}>
                    {rec.confidence}% match
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Treatment Plan Section */}
        <h3 style={{ fontSize: "1.2rem", color: "var(--accent)", marginTop: "2rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
          2. Treatment Plan
        </h3>

        {prescriptions.map((presc, idx) => (
          <div key={idx} style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", backgroundColor: "#fafafa" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 style={{ margin: 0, fontSize: "1rem", color: "var(--text-secondary)" }}>Prescription #{idx + 1}</h4>
              {prescriptions.length > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", height: "auto", margin: 0 }}
                  onClick={() => removePrescriptionBlock(idx)}
                >
                  Remove
                </button>
              )}
            </div>
            
            <Autocomplete
              field="tablet"
              label="Suggested Tablet Name"
              value={presc.tablet}
              onChange={(val) => handlePrescriptionChange(idx, "tablet", val)}
              required={idx === 0}
              placeholder="Search registered tablets (e.g. Paracetamol 500mg, Metformin)..."
            />

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label className="form-label">Dosage Instructions / Take Routine</label>
              <textarea
                value={presc.dosage}
                onChange={(e) => handlePrescriptionChange(idx, "dosage", e.target.value)}
                className="form-control"
                placeholder="e.g. Once daily, twice daily after dinner, etc."
                rows={2}
                style={{ resize: "vertical" }}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem", display: "inline-flex", gap: "0.3rem", alignItems: "center", marginBottom: "1rem" }}
          onClick={addPrescriptionBlock}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Another Prescription
        </button>

        <div className="form-group" style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            id="consultDoctor"
            checked={consultDoctor}
            onChange={(e) => setConsultDoctor(e.target.checked)}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          <label htmlFor="consultDoctor" style={{ margin: 0, cursor: "pointer", fontSize: "0.95rem" }}>
            Consult Doctor
          </label>
        </div>

        <div style={{ marginBottom: "1.5rem", marginTop: "1.5rem" }}>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
            Suggestions
          </label>
          
          {suggestions.map((suggestionValue, idx) => (
            <div key={idx} style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  className="form-control"
                  value={suggestionValue}
                  onChange={(e) => handleSuggestionChange(idx, e.target.value)}
                  placeholder={`Suggestion #${idx + 1} (e.g. Drink more water, avoid cold food)...`}
                />
              </div>
              {suggestions.length > 1 && (
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
                  onClick={() => removeSuggestionBlock(idx)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem", display: "inline-flex", gap: "0.3rem", alignItems: "center" }}
            onClick={addSuggestionBlock}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add More Suggestion
          </button>
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
