# Data Model — DoctorCode

## Entity Relationships

```
User (Supabase Auth)
  │
  ├─── Doctor (1:1 with User where role = 'DOCTOR')
  │       ├─── has many Patients (via DoctorPatient join)
  │       ├─── has many Prescriptions (authored)
  │       ├─── has many MedicalNotes (authored)
  │       └─── has many DoctorOrderedTests (ordered)
  │
  └─── Patient (1:1 with User where role = 'PATIENT')
          ├─── has many BloodSugarReadings
          ├─── has many BloodPressureReadings
          ├─── has many KidneyReadings
          ├─── has many LiverReadings
          ├─── has many HormonalReadings
          ├─── has many LipidReadings
          ├─── has many MedicalRecords
          ├─── has many Prescriptions (received)
          ├─── has many MedicalNotes (subject of)
          ├─── has many DoctorOrderedTests (subject of)
          └─── linked to Doctors (via DoctorPatient)
```

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // Required for Supabase connection pooling
}

model Profile {
  id           String   @id @default(uuid())
  supabaseId   String   @unique  // maps to auth.users.id
  email        String   @unique
  fullName     String
  role         Role     @default(PATIENT)
  avatarUrl    String?  // Cloudinary URL
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  doctor       Doctor?
  patient      Patient?
}

enum Role {
  PATIENT
  DOCTOR
}

model Doctor {
  id        String   @id @default(uuid())
  profileId String   @unique
  profile   Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  specialty String?
  phone     String?
  createdAt DateTime @default(now())

  patients  DoctorPatient[]
}

model Patient {
  id              String   @id @default(uuid())
  profileId       String   @unique
  profile         Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  dateOfBirth     DateTime?
  createdAt       DateTime @default(now())

  doctors            DoctorPatient[]
  bloodSugarReadings BloodSugarReading[]
  bpReadings         BloodPressureReading[]
}

model DoctorPatient {
  id        String   @id @default(uuid())
  doctorId  String
  patientId String
  linkedAt  DateTime @default(now())

  doctor    Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  patient   Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@unique([doctorId, patientId])
}

model BloodSugarReading {
  id          String   @id @default(uuid())
  patientId   String
  patient     Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  value       Float    // mmol/L or mg/dL — unit stored separately
  unit        GlucoseUnit @default(MMOL)
  context     ReadingContext @default(FASTING)  // fasting, post-meal, random
  notes       String?
  recordedAt  DateTime @default(now())
  createdAt   DateTime @default(now())

  @@index([patientId, recordedAt])
}

enum GlucoseUnit {
  MMOL   // mmol/L
  MGDL   // mg/dL
}

enum ReadingContext {
  FASTING
  POST_MEAL
  BEFORE_MEAL
  RANDOM
  BEDTIME
}

model BloodPressureReading {
  id          String   @id @default(uuid())
  patientId   String
  patient     Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  systolic    Int      // mmHg
  diastolic   Int      // mmHg
  pulse       Int?     // bpm
  arm         Arm      @default(LEFT)
  notes       String?
  recordedAt  DateTime @default(now())
  createdAt   DateTime @default(now())

  @@index([patientId, recordedAt])
}

enum Arm {
  LEFT
  RIGHT
}

// Doctor-authored clinical records
enum NoteType {
  PROGRESS
  DIAGNOSIS
  TREATMENT
  FOLLOW_UP
  REFERRAL
}

enum TestStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Prescription {
  id         String   @id @default(uuid())
  patientId  String
  doctorId   String
  medication String
  dosage     String
  frequency  String
  duration   String?
  notes      String?
  issuedAt   DateTime @default(now())
  createdAt  DateTime @default(now())

  @@index([patientId, issuedAt])
}

model MedicalNote {
  id        String   @id @default(uuid())
  patientId String
  doctorId  String
  type      NoteType @default(PROGRESS)
  title     String
  content   String   @db.Text
  createdAt DateTime @default(now())

  @@index([patientId, createdAt])
}

model DoctorOrderedTest {
  id          String     @id @default(uuid())
  patientId   String
  doctorId    String
  testName    String
  category    String?
  status      TestStatus @default(PENDING)
  result      String?    @db.Text
  orderedAt   DateTime   @default(now())
  completedAt DateTime?
  createdAt   DateTime   @default(now())

  @@index([patientId, orderedAt])
}
```

## Normal Ranges (for StatusBadge and alert logic)

### Blood Sugar
| Status | Fasting | Post-meal (2hr) |
|--------|---------|-----------------|
| Normal | 3.9–5.5 mmol/L | < 7.8 mmol/L |
| Borderline | 5.6–6.9 mmol/L | 7.8–11.0 mmol/L |
| High | ≥ 7.0 mmol/L | ≥ 11.1 mmol/L |
| Low | < 3.9 mmol/L | < 3.9 mmol/L |

### Blood Pressure
| Status | Systolic | Diastolic |
|--------|----------|-----------|
| Normal | < 120 | < 80 |
| Elevated | 120–129 | < 80 |
| Stage 1 High | 130–139 | 80–89 |
| Stage 2 High | ≥ 140 | ≥ 90 |
| Crisis | > 180 | > 120 |

## Supabase Row Level Security (RLS) Policies

See `docs/SECURITY.md` for full policy SQL. Summary:

| Table | Policy |
|-------|--------|
| `Profile` | Users can read/update only their own profile |
| `Doctor` | Doctors can read/update their own record |
| `Patient` | Patients can read/update their own record; linked doctors can read |
| `DoctorPatient` | Doctor can see their links; patient can see their links |
| `BloodSugarReading` | Patient can CRUD their own; linked doctor can READ |
| `BloodPressureReading` | Patient can CRUD their own; linked doctor can READ |
| `Prescription` | Doctor can CRUD their own; patient can READ |
| `MedicalNote` | Doctor can CRUD their own; patient can READ |
| `DoctorOrderedTest` | Doctor can CRUD their own; patient can READ |

## Keeping This Document Current

- After any `prisma migrate dev` run → update the Prisma Schema section to match
- After adding a new model or enum → add it here
- After changing normal ranges → update the Normal Ranges tables
- Commit with: `docs: update DATA-MODEL.md — <what changed>`
