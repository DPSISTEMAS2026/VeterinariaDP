// Triage engine based on diagnosticos_veterinarios.json
export interface TriageResult {
  condition: string;
  description: string;
  severity: string;
  urgency: string;
  treatment: string;
  prevention: string;
  matchScore: number;
}

type DiagEntry = {
  nombre: string;
  descripcion: string;
  especie: string[];
  sintomas: string[];
  gravedad: string;
  urgencia: string;
  tratamiento: string;
  prevencion: string;
};

// Core diagnostic database (from diagnosticos_veterinarios.json)
const DIAGNOSTICS: DiagEntry[] = [
  { nombre:"Moquillo Canino", descripcion:"Enfermedad viral altamente contagiosa", especie:["Perro"], sintomas:["fiebre alta","secrecion nasal","tos seca","perdida de apetito","vomitos","diarrea","convulsiones","temblores","paralisis"], gravedad:"Crítica", urgencia:"Emergencia", tratamiento:"Fluidoterapia IV, antipiréticos, antibióticos", prevencion:"Vacunación completa" },
  { nombre:"Otitis Externa", descripcion:"Inflamación del canal auditivo externo", especie:["Perro","Gato"], sintomas:["rascado orejas","sacude cabeza","mal olor oido","secrecion oido","dolor orejas","inflamacion oreja","inclinacion cabeza"], gravedad:"Moderada", urgencia:"Pronto", tratamiento:"Limpieza + gotas óticas antibióticas", prevencion:"Limpieza regular de oídos" },
  { nombre:"Gastroenteritis", descripcion:"Inflamación del tracto gastrointestinal", especie:["Perro","Gato"], sintomas:["vomitos","diarrea","perdida apetito","deshidratacion","dolor abdominal","letargia","fiebre","flatulencias"], gravedad:"Moderada", urgencia:"Pronto", tratamiento:"Dieta blanda, hidratación, antieméticos", prevencion:"Evitar cambios bruscos de dieta" },
  { nombre:"Parvovirus Canino", descripcion:"Enfermedad viral potencialmente mortal en cachorros", especie:["Perro"], sintomas:["vomitos severos","diarrea sangre","diarrea hemorragica","fiebre alta","deshidratacion severa","letargia extrema","dolor abdominal"], gravedad:"Crítica", urgencia:"Emergencia", tratamiento:"Hospitalización, fluidoterapia IV", prevencion:"Vacunación completa" },
  { nombre:"Dermatitis Alérgica", descripcion:"Reacción inflamatoria de la piel", especie:["Perro","Gato"], sintomas:["picazon","se rasca","rascado","prurito","lamido patas","enrojecimiento piel","perdida pelo","alopecia","costras","piel irritada"], gravedad:"Moderada", urgencia:"Normal", tratamiento:"Antihistamínicos, corticoides, baños medicados", prevencion:"Control de pulgas, dieta hipoalergénica" },
  { nombre:"Insuficiencia Renal", descripcion:"Deterioro progresivo de la función renal", especie:["Perro","Gato"], sintomas:["sed excesiva","orina mucho","perdida peso","vomitos","mal aliento","letargia","deshidratacion","pelaje opaco"], gravedad:"Alta", urgencia:"Pronto", tratamiento:"Dieta renal, fluidoterapia subcutánea", prevencion:"Chequeos regulares" },
  { nombre:"Cistitis", descripcion:"Inflamación de la vejiga", especie:["Perro","Gato"], sintomas:["orina frecuente","esfuerzo orinar","sangre orina","dolor orinar","lamido genitales","orina turbia","incontinencia"], gravedad:"Moderada", urgencia:"Pronto", tratamiento:"Antibióticos, analgésicos, dieta urinaria", prevencion:"Hidratación adecuada" },
  { nombre:"Displasia de Cadera", descripcion:"Malformación articular de la cadera", especie:["Perro"], sintomas:["cojera trasera","dificultad levantarse","dificultad escaleras","atrofia muscular","rigidez","renuencia correr"], gravedad:"Alta", urgencia:"Normal", tratamiento:"Antiinflamatorios, condroprotectores, fisioterapia", prevencion:"Control de peso" },
  { nombre:"Diabetes Mellitus", descripcion:"Niveles elevados de glucosa en sangre", especie:["Perro","Gato"], sintomas:["sed excesiva","orina mucho","apetito aumentado","perdida peso","letargia","cataratas","debilidad patas"], gravedad:"Alta", urgencia:"Pronto", tratamiento:"Insulinoterapia, dieta especial", prevencion:"Control de peso" },
  { nombre:"FLUTD", descripcion:"Enfermedad del tracto urinario inferior felino", especie:["Gato"], sintomas:["esfuerzo orinar","orina frecuente","sangre orina","orina fuera caja","maulla orinar","lamido genitales","vomitos","letargia"], gravedad:"Alta", urgencia:"Emergencia si hay obstrucción", tratamiento:"Cateterización, analgésicos, dieta urinaria", prevencion:"Dieta húmeda" },
  { nombre:"Rinotraqueitis Viral Felina", descripcion:"Infección respiratoria por herpesvirus", especie:["Gato"], sintomas:["estornudos","secrecion nasal","secrecion ocular","conjuntivitis","fiebre","perdida apetito","salivacion"], gravedad:"Moderada", urgencia:"Pronto", tratamiento:"Tratamiento de soporte, antibióticos", prevencion:"Vacunación triple felina" },
  { nombre:"Fractura", descripcion:"Rotura ósea por trauma", especie:["Perro","Gato"], sintomas:["cojera severa","no apoya pata","dolor intenso","inflamacion","deformidad","gime dolor","no camina"], gravedad:"Alta", urgencia:"Emergencia", tratamiento:"Radiografía, inmovilización, cirugía", prevencion:"Evitar caídas y accidentes" },
  { nombre:"Torsión Gástrica", descripcion:"Rotación del estómago, emergencia quirúrgica", especie:["Perro"], sintomas:["vomitos sangre","abdomen hinchado","dificultad respirar","colapso","arcadas sin vomito","dolor abdominal severo","inquietud"], gravedad:"Crítica", urgencia:"Emergencia", tratamiento:"Cirugía de emergencia, estabilización", prevencion:"Comidas pequeñas, evitar ejercicio post-comida" },
  { nombre:"Pancreatitis", descripcion:"Inflamación del páncreas", especie:["Perro","Gato"], sintomas:["vomitos severos","dolor abdominal","postura oracion","perdida apetito","diarrea","fiebre","letargia","deshidratacion"], gravedad:"Alta", urgencia:"Emergencia", tratamiento:"Hospitalización, fluidoterapia, analgésicos", prevencion:"Evitar alimentos grasos" },
  { nombre:"Epilepsia", descripcion:"Convulsiones recurrentes", especie:["Perro","Gato"], sintomas:["convulsiones","perdida consciencia","movimientos involuntarios","salivacion","rigidez muscular","desorientacion"], gravedad:"Alta", urgencia:"Emergencia durante convulsión", tratamiento:"Anticonvulsivos de por vida", prevencion:"Medicación regular" },
  { nombre:"Enfermedad Periodontal", descripcion:"Infección de encías y soporte dental", especie:["Perro","Gato"], sintomas:["mal aliento","encias rojas","encias sangrantes","sarro","dientes flojos","dolor comer","salivacion","rechazo comida"], gravedad:"Moderada", urgencia:"Normal", tratamiento:"Limpieza dental, extracciones, antibióticos", prevencion:"Cepillado dental regular" },
];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ");
}

export function runTriage(species: string, symptoms: string[]): TriageResult[] {
  const normSpecies = normalize(species);
  const isCanine = normSpecies.includes("perro") || normSpecies.includes("canin");
  const isFeline = normSpecies.includes("gato") || normSpecies.includes("felin");
  const speciesFilter = isCanine ? "Perro" : isFeline ? "Gato" : "";

  const normSymptoms = symptoms.map(normalize);

  return DIAGNOSTICS
    .filter(d => !speciesFilter || d.especie.includes(speciesFilter))
    .map(d => {
      const total = d.sintomas.length;
      let matches = 0;
      for (const ns of normSymptoms) {
        for (const ds of d.sintomas) {
          if (normalize(ds).includes(ns) || ns.includes(normalize(ds))) {
            matches++;
            break;
          }
        }
      }
      const score = Math.round((matches / Math.max(normSymptoms.length, 1)) * 100);
      return { condition: d.nombre, description: d.descripcion, severity: d.gravedad, urgency: d.urgencia, treatment: d.tratamiento, prevention: d.prevencion, matchScore: score };
    })
    .filter(r => r.matchScore >= 30)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

export function isEmergency(results: TriageResult[]): boolean {
  return results.some(r => r.urgency.toLowerCase().includes("emergencia") && r.matchScore >= 50);
}
