
import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from './Button';
import { DayLog, SYMPTOMS, MOODS, FlowIntensity } from '../types';

interface DayModalProps {
  date: string;
  existingLog?: DayLog;
  onSave: (log: DayLog) => void;
  onClose: () => void;
  onDelete: (date: string) => void;
}

export const DayModal: React.FC<DayModalProps> = ({ date, existingLog, onSave, onClose, onDelete }) => {
  const [isPeriod, setIsPeriod] = useState(existingLog?.isPeriod ?? false);
  const [intensity, setIntensity] = useState<FlowIntensity>(existingLog?.intensity ?? 'moderado');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(existingLog?.symptoms ?? []);
  const [selectedMoods, setSelectedMoods] = useState<string[]>(existingLog?.moods ?? []);
  const [notes, setNotes] = useState(existingLog?.notes ?? '');
  const [medicalNotes, setMedicalNotes] = useState(existingLog?.medicalNotes ?? '');
  const [water, setWater] = useState(existingLog?.waterIntake ?? 0);
  const [sleep, setSleep] = useState(existingLog?.sleepHours ?? 8);

  const handleToggle = (list: string[], item: string, setter: (val: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const displayDate = format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-theme-soft">
        <div className="p-8 border-b border-theme-soft sticky top-0 bg-white/90 backdrop-blur-md z-10 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-serif text-gray-800 capitalize">{displayDate}</h3>
            <p className="text-theme-primary opacity-60 text-[10px] font-black uppercase tracking-widest mt-1">Como foi seu dia?</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-theme-light text-theme-primary rounded-full hover:opacity-70 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 space-y-10 pb-32">
          {/* Menstruação */}
          <section>
            <div 
              onClick={() => setIsPeriod(!isPeriod)}
              className={`flex items-center justify-between p-6 rounded-[2rem] cursor-pointer transition-all border-2 ${isPeriod ? 'bg-theme-primary border-theme-primary text-white shadow-xl' : 'bg-theme-light border-theme-soft text-theme-primary'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isPeriod ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                  <svg className={`w-6 h-6 ${isPeriod ? 'text-white' : 'text-theme-primary'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </div>
                <span className="font-bold text-base">Menstruação hoje?</span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isPeriod ? 'bg-white border-white' : 'border-theme-primary opacity-40'}`}>
                {isPeriod && <div className="w-2.5 h-2.5 rounded-full bg-theme-primary" />}
              </div>
            </div>
          </section>

          {isPeriod && (
            <section className="animate-in slide-in-from-top-4 duration-300 space-y-4">
              <h4 className="text-[10px] font-black text-theme-primary opacity-50 uppercase tracking-widest">Intensidade do Fluxo</h4>
              <div className="grid grid-cols-2 gap-3">
                {(['escasso', 'leve', 'moderado', 'intenso'] as FlowIntensity[]).map((int) => (
                  <button
                    key={int}
                    onClick={() => setIntensity(int)}
                    className={`py-4 rounded-2xl text-xs font-bold capitalize border-2 transition-all ${intensity === int ? 'bg-theme-primary text-white border-theme-primary shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-theme-soft'}`}
                  >
                    {int}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Bem-estar */}
          <section className="grid grid-cols-2 gap-4">
             <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 text-center">Água</h4>
                <div className="flex items-center justify-between">
                    <button onClick={() => setWater(Math.max(0, water - 1))} className="w-8 h-8 bg-white rounded-full text-blue-500 font-bold shadow-sm">-</button>
                    <span className="text-xl font-bold text-blue-600">{water} <span className="text-[10px] font-medium text-blue-400">copos</span></span>
                    <button onClick={() => setWater(water + 1)} className="w-8 h-8 bg-white rounded-full text-blue-500 font-bold shadow-sm">+</button>
                </div>
             </div>
             <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 text-center">Sono</h4>
                <div className="flex items-center justify-between">
                    <button onClick={() => setSleep(Math.max(0, sleep - 1))} className="w-8 h-8 bg-white rounded-full text-indigo-500 font-bold shadow-sm">-</button>
                    <span className="text-xl font-bold text-indigo-600">{sleep} <span className="text-[10px] font-medium text-indigo-400">h</span></span>
                    <button onClick={() => setSleep(sleep + 1)} className="w-8 h-8 bg-white rounded-full text-indigo-500 font-bold shadow-sm">+</button>
                </div>
             </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-theme-primary opacity-50 uppercase tracking-widest">Sintomas</h4>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleToggle(selectedSymptoms, s, setSelectedSymptoms)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedSymptoms.includes(s) ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-theme-primary opacity-50 uppercase tracking-widest">Humor</h4>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => handleToggle(selectedMoods, m, setSelectedMoods)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedMoods.includes(m) ? 'bg-amber-400 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-theme-primary opacity-50 uppercase tracking-widest">Notas Pessoais</h4>
            <textarea
              className="w-full p-5 rounded-[2rem] bg-gray-50 border-2 border-transparent focus:bg-white focus:border-theme-soft transition-all text-sm outline-none resize-none"
              placeholder="Escreva como você se sente..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
              Notas Médicas Importantes
            </h4>
            <textarea
              className="w-full p-5 rounded-[2rem] bg-indigo-50/30 border-2 border-transparent focus:bg-white focus:border-indigo-200 transition-all text-sm outline-none resize-none font-medium text-indigo-900"
              placeholder="Registros médicos, consultas ou orientações..."
              rows={4}
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
            />
          </section>
        </div>

        <div className="p-8 border-t border-theme-soft bg-white sticky bottom-0 z-10 flex flex-col gap-3">
          <Button 
            className="w-full h-16 text-lg rounded-[2rem]" 
            onClick={() => onSave({ 
                date, 
                isPeriod, 
                intensity: isPeriod ? intensity : undefined, 
                symptoms: selectedSymptoms, 
                moods: selectedMoods, 
                notes,
                medicalNotes,
                waterIntake: water,
                sleepHours: sleep
            })}
          >
            Salvar Registro
          </Button>
          {existingLog && (
            <button 
              onClick={() => onDelete(date)}
              className="text-red-400 text-[9px] font-black uppercase tracking-widest py-1"
            >
              Excluir Registro
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
