import type { Consultation, Medication, Patient } from "./types";

// ============ MOCK PATIENTS ============
export const MOCK_PATIENTS: Patient[] = [
  {
    id: "p1", orgId: "org1", name: "Max", species: "perro", breed: "Golden Retriever",
    birthDate: "2021-03-15", weight: 32, sex: "macho", color: "Dorado",
    owner: { name: "Carlos Fuentes", rut: "12.345.678-9", phone: "+56912345678", email: "carlos@email.com" },
    vaccinations: [
      { name: "Séxtuple", date: "2024-06-15", nextDate: "2025-06-15", veterinarian: "Dr. Martínez" },
      { name: "Antirrábica", date: "2024-06-15", nextDate: "2025-06-15", veterinarian: "Dr. Martínez" },
    ],
    allergies: ["Pollo"], conditions: [], notes: "Paciente tranquilo", createdAt: "2024-01-10T10:00:00", updatedAt: "2026-04-20T14:00:00",
  },
  {
    id: "p2", orgId: "org1", name: "Luna", species: "gato", breed: "Siamés",
    birthDate: "2022-08-20", weight: 4.5, sex: "hembra", color: "Crema con puntos oscuros",
    owner: { name: "Andrea Soto", rut: "15.678.901-2", phone: "+56923456789", email: "andrea@email.com" },
    vaccinations: [
      { name: "Triple Felina", date: "2024-09-10", nextDate: "2025-09-10", veterinarian: "Dr. Martínez" },
    ],
    allergies: [], conditions: ["Asma leve"], notes: "Sensible al estrés", createdAt: "2024-03-05T09:00:00", updatedAt: "2026-04-18T11:00:00",
  },
  {
    id: "p3", orgId: "org1", name: "Rocky", species: "perro", breed: "Bulldog Francés",
    birthDate: "2023-01-10", weight: 12, sex: "macho", color: "Atigrado",
    owner: { name: "Marcela Díaz", rut: "18.234.567-3", phone: "+56934567890", email: "marcela@email.com" },
    vaccinations: [], allergies: ["Penicilina"], conditions: ["Braquicéfalo"], notes: "Revisar respiración", createdAt: "2024-05-20T15:00:00", updatedAt: "2026-04-15T10:00:00",
  },
  {
    id: "p4", orgId: "org1", name: "Simba", species: "gato", breed: "Persa",
    birthDate: "2020-11-02", weight: 5.8, sex: "macho", color: "Naranja",
    owner: { name: "Paula Ríos", rut: "14.567.890-1", phone: "+56945678901", email: "paula@email.com" },
    vaccinations: [
      { name: "Triple Felina", date: "2025-01-15", nextDate: "2026-01-15", veterinarian: "Dr. Martínez" },
      { name: "Leucemia Felina", date: "2025-01-15", nextDate: "2026-01-15", veterinarian: "Dr. Martínez" },
    ],
    allergies: [], conditions: ["Sobrepeso"], notes: "Dieta especial", createdAt: "2023-12-01T08:00:00", updatedAt: "2026-04-10T09:00:00",
  },
  {
    id: "p5", orgId: "org1", name: "Nina", species: "perro", breed: "Labrador",
    birthDate: "2019-06-30", weight: 28, sex: "hembra", color: "Chocolate",
    owner: { name: "Camila Vega", rut: "16.789.012-4", phone: "+56956789012", email: "camila@email.com" },
    vaccinations: [], allergies: [], conditions: ["Displasia de cadera"], notes: "Cuidado articular", createdAt: "2023-08-15T14:00:00", updatedAt: "2026-04-22T16:00:00",
  },
];

// ============ MOCK CONSULTATIONS ============
export const MOCK_CONSULTATIONS: Consultation[] = [
  {
    id: "c1", orgId: "org1", ticketNumber: "BD-2026-0042", status: "en_espera", urgency: "media", origin: "chatbot",
    patient: { id: "p1", name: "Max", species: "perro", breed: "Golden Retriever", ownerName: "Carlos Fuentes", ownerPhone: "+56912345678" },
    symptoms: ["vómitos", "diarrea", "decaimiento"], symptomNotes: "Desde ayer, comió algo en el parque",
    prescription: [],
    billing: { consultationFee: 25000, medicationTotal: 0, total: 25000, paid: false },
    createdAt: "2026-04-23T10:30:00", updatedAt: "2026-04-23T10:30:00",
  },
  {
    id: "c2", orgId: "org1", ticketNumber: "EMG-2026-0043", status: "en_espera", urgency: "critica", origin: "whatsapp",
    patient: { id: "p2", name: "Luna", species: "gato", breed: "Siamés", ownerName: "Andrea Soto", ownerPhone: "+56923456789" },
    symptoms: ["dificultad respiratoria", "cianosis", "letargia"], symptomNotes: "Inicio súbito hace 2 horas",
    prescription: [],
    billing: { consultationFee: 35000, medicationTotal: 0, total: 35000, paid: false },
    createdAt: "2026-04-23T10:45:00", updatedAt: "2026-04-23T10:45:00",
  },
  {
    id: "c3", orgId: "org1", ticketNumber: "BD-2026-0044", status: "en_espera", urgency: "baja", origin: "presencial",
    patient: { id: "p3", name: "Rocky", species: "perro", breed: "Bulldog Francés", ownerName: "Marcela Díaz", ownerPhone: "+56934567890" },
    symptoms: ["control", "vacunas"], symptomNotes: "Control de rutina + vacunas pendientes",
    prescription: [],
    billing: { consultationFee: 20000, medicationTotal: 0, total: 20000, paid: false },
    createdAt: "2026-04-23T11:00:00", updatedAt: "2026-04-23T11:00:00",
  },
  {
    id: "c4", orgId: "org1", ticketNumber: "BD-2026-0040", status: "completada", urgency: "media", origin: "presencial",
    patient: { id: "p4", name: "Simba", species: "gato", breed: "Persa", ownerName: "Paula Ríos", ownerPhone: "+56945678901" },
    symptoms: ["rascado excesivo", "enrojecimiento oído"], symptomNotes: "Otitis recurrente",
    diagnosis: { name: "Otitis externa", description: "Infección del canal auditivo externo", severity: "moderada", confidence: 92, notes: "Cultivo recomendado si persiste", aiSuggested: true },
    prescription: [
      { medicationId: "m3", name: "Otodex Gotas Óticas", dosage: "3 gotas", frequency: "Cada 12 horas", duration: "10 días", quantity: 1, unitPrice: 12500 },
    ],
    billing: { consultationFee: 25000, medicationTotal: 12500, total: 37500, paid: true, paymentMethod: "tarjeta", paidAt: "2026-04-23T09:45:00" },
    attendedBy: "Dr. Carlos Martínez", startedAt: "2026-04-23T09:00:00", finishedAt: "2026-04-23T09:30:00",
    createdAt: "2026-04-23T08:45:00", updatedAt: "2026-04-23T09:45:00",
  },
  {
    id: "c5", orgId: "org1", ticketNumber: "BD-2026-0039", status: "completada", urgency: "alta", origin: "chatbot",
    patient: { id: "p5", name: "Nina", species: "perro", breed: "Labrador", ownerName: "Camila Vega", ownerPhone: "+56956789012" },
    symptoms: ["vómitos", "inapetencia", "dolor abdominal"], symptomNotes: "Posible ingestión de objeto",
    diagnosis: { name: "Gastritis aguda", description: "Inflamación de la mucosa gástrica", severity: "moderada", confidence: 85, notes: "Radiografía descartó cuerpo extraño", aiSuggested: false },
    prescription: [
      { medicationId: "m1", name: "Omeprazol 20mg", dosage: "1 comprimido", frequency: "Cada 24 horas", duration: "7 días", quantity: 7, unitPrice: 850 },
      { medicationId: "m4", name: "Metoclopramida", dosage: "0.5ml/kg", frequency: "Cada 8 horas", duration: "3 días", quantity: 1, unitPrice: 8900 },
    ],
    billing: { consultationFee: 25000, medicationTotal: 14850, total: 39850, paid: true, paymentMethod: "efectivo", paidAt: "2026-04-22T17:00:00" },
    attendedBy: "Dr. Carlos Martínez", startedAt: "2026-04-22T16:00:00", finishedAt: "2026-04-22T16:45:00",
    createdAt: "2026-04-22T15:30:00", updatedAt: "2026-04-22T17:00:00",
  },
];

// ============ MOCK MEDICATIONS ============
export const MOCK_MEDICATIONS: Medication[] = [
  { id: "m1", orgId: "org1", name: "Amoxicilina 500mg", category: "antibioticos", presentation: "Comprimidos x20", stock: 3, stockMin: 10, unitPrice: 15200, costPrice: 8500, supplier: "Veterquímica", requiresPrescription: true, active: true },
  { id: "m2", orgId: "org1", name: "Meloxicam 1.5mg/ml Inyectable", category: "antiinflamatorios", presentation: "Frasco 10ml", stock: 2, stockMin: 5, unitPrice: 18500, costPrice: 11000, supplier: "Drag Pharma", requiresPrescription: true, active: true },
  { id: "m3", orgId: "org1", name: "Otodex Gotas Óticas", category: "antibioticos", presentation: "Frasco 20ml", stock: 8, stockMin: 5, unitPrice: 12500, costPrice: 7200, supplier: "Veterquímica", requiresPrescription: false, active: true },
  { id: "m4", orgId: "org1", name: "Metoclopramida 5mg/ml", category: "otros", presentation: "Frasco 20ml", stock: 12, stockMin: 5, unitPrice: 8900, costPrice: 4800, supplier: "Agrovet", requiresPrescription: true, active: true },
  { id: "m5", orgId: "org1", name: "Suero Fisiológico 500ml", category: "insumos", presentation: "Bolsa 500ml", stock: 5, stockMin: 15, unitPrice: 3500, costPrice: 1800, supplier: "Baxter", requiresPrescription: false, active: true },
  { id: "m6", orgId: "org1", name: "Vacuna Séxtuple Canina", category: "vacunas", presentation: "Dosis individual", stock: 20, stockMin: 10, unitPrice: 22000, costPrice: 14000, supplier: "MSD Animal Health", requiresPrescription: true, active: true },
  { id: "m7", orgId: "org1", name: "Vacuna Antirrábica", category: "vacunas", presentation: "Dosis individual", stock: 25, stockMin: 10, unitPrice: 15000, costPrice: 9000, supplier: "MSD Animal Health", requiresPrescription: true, active: true },
  { id: "m8", orgId: "org1", name: "Frontline Plus Perro M", category: "antiparasitarios", presentation: "Pipeta individual", stock: 30, stockMin: 15, unitPrice: 16800, costPrice: 10500, supplier: "Merial", requiresPrescription: false, active: true },
  { id: "m9", orgId: "org1", name: "Tramadol 50mg", category: "analgesicos", presentation: "Comprimidos x10", stock: 15, stockMin: 5, unitPrice: 9800, costPrice: 5500, supplier: "Drag Pharma", requiresPrescription: true, active: true },
  { id: "m10", orgId: "org1", name: "Dexametasona 2mg/ml", category: "antiinflamatorios", presentation: "Frasco 50ml", stock: 7, stockMin: 3, unitPrice: 11200, costPrice: 6000, supplier: "Veterquímica", requiresPrescription: true, active: true },
  { id: "m11", orgId: "org1", name: "Royal Canin Recovery", category: "alimentos", presentation: "Lata 195g", stock: 18, stockMin: 10, unitPrice: 5800, costPrice: 3500, supplier: "Royal Canin", requiresPrescription: false, active: true },
  { id: "m12", orgId: "org1", name: "Omeprazol 20mg", category: "otros", presentation: "Comprimidos x14", stock: 22, stockMin: 10, unitPrice: 850, costPrice: 400, supplier: "Agrovet", requiresPrescription: true, active: true },
];
