// Domain Types — DP Sistemas Veterinaria

export type UserRole = "admin" | "veterinario" | "recepcionista" | "inventario" | "peluqueria";
export type Species = "perro" | "gato" | "ave" | "reptil" | "otro";
export type ConsultationStatus = "en_espera" | "en_atencion" | "atendida" | "completada" | "cancelada";
export type UrgencyLevel = "critica" | "alta" | "media" | "baja";
export type ConsultationOrigin = "presencial" | "chatbot" | "whatsapp" | "telefono" | "portal";
export type MedicationCategory = "antibioticos" | "antiinflamatorios" | "antiparasitarios" | "vacunas" | "analgesicos" | "vitaminas" | "alimentos" | "insumos" | "otros";

export interface UserSession {
  user: string;
  role: UserRole;
  name: string;
  orgId?: string;
}

export interface Owner {
  name: string;
  rut: string;
  phone: string;
  email: string;
  address?: string;
}

export interface Vaccination {
  name: string;
  date: string;
  nextDate?: string;
  veterinarian: string;
}

export interface Patient {
  id: string;
  orgId: string;
  name: string;
  species: Species;
  breed: string;
  birthDate: string;
  weight: number;
  sex: "macho" | "hembra";
  color: string;
  microchip?: string;
  photoUrl?: string;
  owner: Owner;
  vaccinations: Vaccination[];
  allergies: string[];
  conditions: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientSummary {
  id: string;
  name: string;
  species: Species;
  breed: string;
  ownerName: string;
  ownerPhone: string;
}

export interface Diagnosis {
  name: string;
  description: string;
  severity: "leve" | "moderada" | "grave";
  confidence?: number;
  notes: string;
  aiSuggested: boolean;
}

export interface PrescriptionItem {
  medicationId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  unitPrice: number;
}

export interface Billing {
  consultationFee: number;
  medicationTotal: number;
  total: number;
  paid: boolean;
  paymentMethod?: "efectivo" | "tarjeta" | "transferencia";
  paidAt?: string;
}

export interface Consultation {
  id: string;
  orgId: string;
  ticketNumber: string;
  status: ConsultationStatus;
  urgency: UrgencyLevel;
  origin: ConsultationOrigin;
  patient: PatientSummary;
  symptoms: string[];
  symptomNotes: string;
  diagnosis?: Diagnosis;
  prescription: PrescriptionItem[];
  billing: Billing;
  attendedBy?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  id: string;
  orgId: string;
  name: string;
  category: MedicationCategory;
  presentation: string;
  stock: number;
  stockMin: number;
  unitPrice: number;
  costPrice: number;
  supplier?: string;
  expirationDate?: string;
  requiresPrescription: boolean;
  active: boolean;
}

export interface DashboardStats {
  consultationsToday: number;
  consultationsChange: number;
  monthlyRevenue: number;
  revenueChange: number;
  waitingCount: number;
  avgWaitMinutes: number;
  criticalStockCount: number;
  pendingAppointments: number;
}

export interface DiagnosticSuggestion {
  name: string;
  description: string;
  matchPercentage: number;
  matchedSymptoms: string[];
  severity: "leve" | "moderada" | "grave";
  suggestedTreatments: string[];
  species: Species[];
}
