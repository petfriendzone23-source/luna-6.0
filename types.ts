
export type FlowIntensity = 'escasso' | 'leve' | 'moderado' | 'intenso';

export type CyclePhaseType = 'menstrual' | 'folicular' | 'ovulatoria' | 'lutea';

export type AppTheme = 'rose' | 'sky' | 'emerald' | 'violet' | 'midnight';

export interface PhaseInfo {
  name: string;
  description: string;
  hormones: string;
  advice: string;
  color: string;
}

export const CYCLE_PHASES: Record<CyclePhaseType, PhaseInfo> = {
  menstrual: {
    name: 'Fase Menstrual',
    description: 'O início do seu ciclo. O revestimento do útero está se desprendendo.',
    hormones: 'Baixos níveis de estrogênio e progesterona.',
    advice: 'Priorize o descanso e alimentos ricos em ferro.',
    color: 'bg-rose-500'
  },
  folicular: {
    name: 'Fase Folicular',
    description: 'Seu corpo está preparando um óvulo. A energia começa a subir.',
    hormones: 'O estrogênio está aumentando gradualmente.',
    advice: 'Ótimo momento para novos projetos e exercícios sociais.',
    color: 'bg-indigo-400'
  },
  ovulatoria: {
    name: 'Fase Ovulatória',
    description: 'O óvulo é liberado. Você está no seu pico de fertilidade.',
    hormones: 'Pico de estrogênio e hormônio luteinizante (LH).',
    advice: 'Você pode se sentir mais sociável e confiante agora.',
    color: 'bg-teal-400'
  },
  lutea: {
    name: 'Fase Lútea',
    description: 'Preparação para um possível início de ciclo ou gravidez.',
    hormones: 'A progesterona é o hormônio dominante.',
    advice: 'Reduza o sal e cafeína se sentir inchaço ou irritabilidade.',
    color: 'bg-amber-400'
  }
};

export interface DayLog {
  date: string;
  isPeriod: boolean;
  intensity?: FlowIntensity;
  symptoms: string[];
  moods: string[];
  notes?: string;
  medicalNotes?: string;
  waterIntake?: number;
  sleepHours?: number;
}

export interface UserSettings {
  avgCycleLength: number;
  avgPeriodLength: number;
  lastPeriodStartManual?: string;
  theme?: AppTheme;
}

export interface CycleStats {
  avgCycleLength: number;
  avgPeriodLength: number;
  lastPeriodStart: string | null;
  nextPeriodDate: string | null;
  ovulationDate: string | null;
  fertileWindow: string[];
  currentDayOfCycle: number | null;
}

export const SYMPTOMS = [
  "Cólica", "Inchaço", "Dor de Cabeça", "Acne", "Dor Lombar", 
  "Seios Sensíveis", "Fadiga", "Náusea", "Insônia", "Desejos Doces",
  "Tontura", "Calafrios", "Ansiedade", "Foco Baixo"
];

export const MOODS = [
  "Feliz", "Triste", "Ansiosa", "Irritada", "Calma", 
  "Energizada", "Cansada", "Sensível", "Frustrada", "Produtiva",
  "Inspirada", "Preguiçosa", "Amorosa", "Distante"
];
