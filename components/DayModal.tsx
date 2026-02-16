
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
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(existingLog?.symptoms ?? []);
  const [selectedMoods, setSelectedMoods] = useState<string[]>(existingLog?.moods ?? []);
  const [notes, setNotes] = useState(existingLog?.notes ?? '');

  const handleToggle = (list: string[], item: string, setter: (val: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-md">
      <div className="bg-white rounded-[3rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-10">
          <div>
            <h3 className="text-xl font-serif font-black text-gray-800 capitalize">{format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })}</h3>
            <p className="text-theme-primary text-[10px] font-black uppercase tracking-widest mt-1">Como foi o seu dia?</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 rounded-2xl text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-10">
          <section onClick={() => setIsPeriod(!isPeriod)} className={`p-8 rounded-[2rem] border-4 cursor-pointer transition-all flex justify-between items-center ${isPeriod ? 'bg-theme-primary border-theme-primary text-white' : 'bg-white border-gray-100 text-gray-400 hover:border-theme-soft'}`}>
             <span className="text-lg font-bold">Menstruação hoje?</span>
             <span className="text-3xl">{isPeriod ? '🩸' : '⚪'}</span>
          </section>

          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-theme-primary uppercase tracking-widest">Seu Humor</h4>
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
            <h4 className="text-[10px] font-black text-theme-primary uppercase tracking-widest">Sintomas</h4>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleToggle(selectedSymptoms, s, setSelectedSymptoms)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border-2 ${selectedSymptoms.includes(s) ? 'bg-theme-primary border-theme-primary text-white' : 'bg-gray-50 border-transparent text-gray-400 hover:border-theme-soft'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <textarea 
            className="w-full p-6 rounded-[2rem] bg-gray-50 border-none outline-none text-sm min-h-[120px] focus:ring-2 focus:ring-theme-soft transition-all" 
            placeholder="Anotações pessoais..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="p-8 border-t border-gray-50 sticky bottom-0 bg-white/90 backdrop-blur-md">
          <Button className="w-full h-16 rounded-[2rem] text-lg font-black" onClick={() => onSave({ date, isPeriod, symptoms: selectedSymptoms, moods: selectedMoods, notes })}>
            Salvar Diário ✨
          </Button>
        </div>
      </div>
    </div>
  );
};
