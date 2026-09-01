import fixtureJson from '../../../shared-demo-data/fengtai-p-256572.json'

export type SharedExerciseId = 'baduanjin' | 'resistance' | 'music'

export interface SharedPrescriptionItem {
  category: string
  project: string
  intensity: string
  duration: string
  frequency: string
  reason: string
  appExerciseId: SharedExerciseId | null
}

export interface SharedPatientFixture {
  schemaVersion: number
  updatedAt: string
  hospital: { id: string; name: string; shortName: string }
  patient: {
    patientId: string
    patientNo: string
    hospitalPatientNo: string
    name: string
    maskedName: string
    age: number
    sex: string
    riskLevel: string
    rehabStage: string
    diagnosis: string
    assignedDoctor: string
  }
  prescription: {
    id: string
    prescriptionNo: string
    version: string
    status: string
    plannedSessions: number
    signedBy: string
    signedAt: string
    summary: string
    items: SharedPrescriptionItem[]
  }
  recentHospitalSession: {
    date: string
    project: string
    status: string
    before: string
    during: string
    after: string
    borg: number
  }
}

export const sharedPatientFixture = fixtureJson as SharedPatientFixture

export function normalizePatientNo(value: string) {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, '')
  return normalized.startsWith('P-') ? normalized : `P-${normalized}`
}

export function isSupportedPatientNo(value: string) {
  return normalizePatientNo(value) === sharedPatientFixture.patient.patientNo
}

export function isPrescriptionExercise(exerciseId: SharedExerciseId) {
  return sharedPatientFixture.prescription.items.some((item) => item.appExerciseId === exerciseId)
}
