/**
 * Dev-only bypass for doctor auth + data.
 * Only active when NODE_ENV === "development" and the dev_doctor cookie is set.
 * Never runs in production.
 */

export const DEV_TOKEN = "dev_bypass_2026";
export const DEV_COOKIE = "dev_doctor";

export const DEV_DOCTOR = {
  fullName: "Admin Doctor",
  doctorId: "dev-doctor-001",
  specialty: "General Practice",
};

export const DEV_PATIENTS = [
  {
    id: "dev-patient-001",
    mrNumber: "MR-DEV00001",
    fullName: "Ravi Sharma",
    email: "ravi@test.com",
    gender: "Male",
    dateOfBirth: "1978-06-10",
    bloodType: "B+",
    isLinked: true,
    linkedAt: new Date().toISOString(),
    latestBS: { value: 148, unit: "mg/dL" },
    latestBP: { systolic: 138, diastolic: 90 },
  },
  {
    id: "dev-patient-002",
    mrNumber: "MR-DEV00002",
    fullName: "Priya Nair",
    email: "priya@test.com",
    gender: "Female",
    dateOfBirth: "1992-11-22",
    bloodType: "O+",
    isLinked: true,
    linkedAt: new Date().toISOString(),
    latestBS: { value: 95, unit: "mg/dL" },
    latestBP: { systolic: 118, diastolic: 76 },
  },
  {
    id: "dev-patient-003",
    mrNumber: "MR-DEV00003",
    fullName: "Arjun Mehta",
    email: "arjun@test.com",
    gender: "Male",
    dateOfBirth: "1965-03-04",
    bloodType: "A-",
    isLinked: true,
    linkedAt: new Date().toISOString(),
    latestBS: null,
    latestBP: { systolic: 155, diastolic: 98 },
  },
];

export const DEV_PATIENT_DETAIL = {
  "dev-patient-001": {
    id: "dev-patient-001",
    mrNumber: "MR-DEV00001",
    fullName: "Ravi Sharma",
    email: "ravi@test.com",
    gender: "Male",
    avatarUrl: null,
    dateOfBirth: "1978-06-10T00:00:00.000Z",
    weight: 82,
    height: 172,
    bloodType: "B+",
    pastMedicalHistory: "Type 2 Diabetes, Hypertension",
    currentMedications: "Metformin 500mg, Amlodipine 5mg",
    bloodSugarReadings: [
      { id: "bs-1", value: 148, unit: "mg/dL", context: "FASTING",    recordedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "bs-2", value: 210, unit: "mg/dL", context: "POST_MEAL",  recordedAt: new Date(Date.now() - 172800000).toISOString() },
      { id: "bs-3", value: 132, unit: "mg/dL", context: "FASTING",    recordedAt: new Date(Date.now() - 259200000).toISOString() },
    ],
    bpReadings: [
      { id: "bp-1", systolic: 138, diastolic: 90, recordedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "bp-2", systolic: 142, diastolic: 92, recordedAt: new Date(Date.now() - 172800000).toISOString() },
    ],
    prescriptions: [
      { id: "rx-1", medication: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "30 days", notes: "Take with meals", issuedAt: new Date(Date.now() - 604800000).toISOString() },
    ],
    medicalNotes: [
      { id: "note-1", type: "PROGRESS", title: "Follow-up Visit", content: "Blood sugar levels improving. Continue current regimen. Advise dietary changes.", createdAt: new Date(Date.now() - 604800000).toISOString() },
    ],
    orderedTests: [
      { id: "test-1", testName: "HbA1c", category: "Blood", status: "COMPLETED", result: "7.2% — Acceptable control", orderedAt: new Date(Date.now() - 1209600000).toISOString() },
      { id: "test-2", testName: "Lipid Profile", category: "Blood", status: "PENDING", result: null, orderedAt: new Date(Date.now() - 86400000).toISOString() },
    ],
  },
  "dev-patient-002": {
    id: "dev-patient-002",
    mrNumber: "MR-DEV00002",
    fullName: "Priya Nair",
    email: "priya@test.com",
    gender: "Female",
    avatarUrl: null,
    dateOfBirth: "1992-11-22T00:00:00.000Z",
    weight: 58,
    height: 162,
    bloodType: "O+",
    pastMedicalHistory: null,
    currentMedications: null,
    bloodSugarReadings: [
      { id: "bs-4", value: 95, unit: "mg/dL", context: "FASTING", recordedAt: new Date(Date.now() - 86400000).toISOString() },
    ],
    bpReadings: [
      { id: "bp-3", systolic: 118, diastolic: 76, recordedAt: new Date(Date.now() - 86400000).toISOString() },
    ],
    prescriptions: [],
    medicalNotes: [],
    orderedTests: [],
  },
  "dev-patient-003": {
    id: "dev-patient-003",
    mrNumber: "MR-DEV00003",
    fullName: "Arjun Mehta",
    email: "arjun@test.com",
    gender: "Male",
    avatarUrl: null,
    dateOfBirth: "1965-03-04T00:00:00.000Z",
    weight: 95,
    height: 178,
    bloodType: "A-",
    pastMedicalHistory: "Hypertension, Chronic Kidney Disease Stage 2",
    currentMedications: "Losartan 50mg, Furosemide 20mg",
    bloodSugarReadings: [],
    bpReadings: [
      { id: "bp-4", systolic: 155, diastolic: 98, recordedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "bp-5", systolic: 162, diastolic: 102, recordedAt: new Date(Date.now() - 172800000).toISOString() },
    ],
    prescriptions: [],
    medicalNotes: [],
    orderedTests: [],
  },
};
