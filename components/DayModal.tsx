
import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
// Importação direta da URL para compatibilidade total com o build do Vercel
import { ptBR } from 'https://esm.sh/date-fns@4.1.0/locale/pt-BR';
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

  const handleToggle = (list: string[], item: string, setter: (val: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-md">
      <div className="bg-white rounded-[3.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-10">
          <div>
            <h3 className="text-2xl font-serif font-bold text-gray-800 capitalize">{format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })}</h3>
            <p className="text-theme-primary text-[10px] font-black uppercase mt-1">Como você se sente?</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 rounded-full">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-10 space-y-10">
          <section onClick={() => setIsPeriod(!isPeriod)} className={`p-8 rounded-[2.5rem] border-4 cursor-pointer transition-all flex justify-between items-center ${isPeriod ? 'bg-theme-primary border-theme-primary text-white' : 'bg-white border-gray-100 text-gray-400'}`}>
             <span className="text-lg font-bold">Menstruação hoje?</span>
             <span className="text-3xl">{isPeriod ? '🩸' : '⚪'}</span>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-theme-primary uppercase">Humor</h4>
            <div className="grid grid-cols-2 gap-3">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => handleToggle(selectedMoods, m, setSelectedMoods)}
                  className={`p-4 rounded-2xl text-xs font-bold transition-all border-2 ${selectedMoods.includes(m) ? 'bg-amber-400 border-amber-300 text-white shadow-md' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-white hover:border-gray-200'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-theme-primary uppercase">Sintomas</h4>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleToggle(selectedSymptoms, s, setSelectedSymptoms)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border-2 ${selectedSymptoms.includes(s) ? 'bg-theme-primary border-theme-primary text-white' : 'bg-gray-50 border-transparent text-gray-400'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <textarea 
            className="w-full p-6 rounded-[2rem] bg-gray-50 border-none outline-none text-sm min-h-[120px]" 
            placeholder="Alguma nota especial?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="p-10 border-t border-gray-50 sticky bottom-0 bg-white">
          <Button className="w-full h-16 rounded-[2rem] text-lg" onClick={() => onSave({ date, isPeriod, intensity, symptoms: selectedSymptoms, moods: selectedMoods, notes })}>
            Salvar Registro ✨
          </Button>
        </div>
      </div>
    </div>
  );
};
