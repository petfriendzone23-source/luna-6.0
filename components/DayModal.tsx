import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from './Button';
import { DayLog, SYMPTOMS_DATA, MOODS_DATA } from '../types';

interface DayModalProps {
  date: string;
  existingLog?: DayLog;
  onSave: (log: DayLog) => void;
  onClose: () => void;
  onDelete: (date: string) => void;
}

const COLOR_MAP: Record<string, { bg: string, border: string, text: string, shadow: string }> = {
  rose: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', shadow: 'shadow-rose-100' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', shadow: 'shadow-amber-100' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-600', shadow: 'shadow-violet-100' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-600', shadow: 'shadow-sky-100' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', shadow: 'shadow-orange-100' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-600', shadow: 'shadow-pink-100' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', shadow: 'shadow-indigo-100' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', shadow: 'shadow-emerald-100' },
  slate: { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-600', shadow: 'shadow-slate-100' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-600', shadow: 'shadow-cyan-100' },
  zinc: { bg: 'bg-zinc-50', border: 'border-zinc-100', text: 'text-zinc-600', shadow: 'shadow-zinc-100' },
};

export const DayModal: React.FC<DayModalProps> = ({ date, existingLog, onSave, onClose, onDelete }) => {
  const [isPeriod, setIsPeriod] = useState(existingLog?.isPeriod ?? false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(existingLog?.symptoms ?? []);
  const [selectedMoods, setSelectedMoods] = useState<string[]>(existingLog?.moods ?? []);
  const [notes, setNotes] = useState(existingLog?.notes ?? '');

  const handleToggle = (list: string[], item: string, setter: (val: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[3.5rem] w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border-2 border-white/50 relative">
        
        {/* Header Fixo */}
        <div className="p-8 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-xl z-20">
          <div>
            <h3 className="text-2xl font-serif font-black text-gray-800 capitalize">{format(parseISO(date), "EEEE, d", { locale: ptBR })}</h3>
            <p className="text-theme-primary text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-70">Registro Diário</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-2xl text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-12">
          {/* Menstruação Toggle */}
          <section onClick={() => setIsPeriod(!isPeriod)} className={`group relative p-8 rounded-[2.5rem] border-4 cursor-pointer transition-all duration-500 flex justify-between items-center overflow-hidden ${isPeriod ? 'bg-theme-primary border-theme-primary text-white shadow-2xl scale-[1.02]' : 'bg-white border-gray-100 text-gray-400 hover:border-theme-soft'}`}>
             {isPeriod && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse" />}
             <div className="relative z-10">
               <span className="text-xl font-black block">Menstruação</span>
               <span className={`text-[10px] uppercase font-black tracking-widest ${isPeriod ? 'text-white/80' : 'text-gray-300'}`}>
                 {isPeriod ? 'Registro Ativo' : 'Toque se começou hoje'}
               </span>
             </div>
             <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-transform duration-500 ${isPeriod ? 'bg-white/20 rotate-12 scale-110' : 'bg-gray-50'}`}>
               {isPeriod ? '🩸' : '⚪'}
             </div>
          </section>

          {/* Grid de Humor */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Como se sente?</h4>
              <span className="text-[10px] font-bold text-theme-primary bg-theme-light px-3 py-1 rounded-full">{selectedMoods.length} selecionados</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {MOODS_DATA.map((m) => {
                const colors = COLOR_MAP[m.color];
                const active = selectedMoods.includes(`${m.label} ${m.icon}`);
                return (
                  <button
                    key={m.id}
                    onClick={() => handleToggle(selectedMoods, `${m.label} ${m.icon}`, setSelectedMoods)}
                    className={`group relative p-5 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center gap-3 ${active ? `bg-white ${colors.border} ${colors.shadow} shadow-xl scale-105 z-10` : 'bg-gray-50 border-transparent grayscale-[0.5] opacity-70 hover:opacity-100 hover:grayscale-0'}`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-all duration-500 ${active ? colors.bg : 'bg-white'}`}>
                      {m.icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${active ? colors.text : 'text-gray-400'}`}>{m.label}</span>
                    {active && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-current animate-ping" style={{ color: `var(--${m.color}-500)` }} />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Grid de Sintomas */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Sintomas do Dia</h4>
              <span className="text-[10px] font-bold text-theme-primary bg-theme-light px-3 py-1 rounded-full">{selectedSymptoms.length} selecionados</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {SYMPTOMS_DATA.map((s) => {
                const colors = COLOR_MAP[s.color];
                const active = selectedSymptoms.includes(`${s.label} ${s.icon}`);
                return (
                  <button
                    key={s.id}
                    onClick={() => handleToggle(selectedSymptoms, `${s.label} ${s.icon}`, setSelectedSymptoms)}
                    className={`group p-4 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${active ? `bg-white ${colors.border} ${colors.shadow} shadow-lg scale-105` : 'bg-gray-50 border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <span className={`text-2xl transition-transform duration-500 ${active ? 'scale-125 rotate-6' : 'group-hover:scale-110'}`}>{s.icon}</span>
                    <span className={`text-[8px] font-black uppercase text-center leading-tight tracking-tighter ${active ? colors.text : 'text-gray-400'}`}>
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Notas */}
          <section className="space-y-4">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Anotações</h4>
            <textarea 
              className="w-full p-8 rounded-[2.5rem] bg-gray-50 border-4 border-transparent outline-none text-sm min-h-[160px] focus:bg-white focus:border-theme-soft focus:shadow-xl transition-all font-bold text-gray-700 placeholder:text-gray-300" 
              placeholder="Escreva algo sobre hoje..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
        </div>

        {/* Footer Fixo */}
        <div className="p-8 border-t border-gray-50 sticky bottom-0 bg-white/90 backdrop-blur-xl flex flex-col gap-4">
          <Button className="w-full h-20 rounded-[2.5rem] text-xl font-black shadow-2xl" onClick={() => onSave({ 
            date, 
            isPeriod, 
            symptoms: selectedSymptoms, 
            moods: selectedMoods, 
            notes 
          })}>
            Salvar Registro ✨
          </Button>
          {existingLog && (
            <button 
              onClick={() => { if(confirm('Excluir este dia?')) onDelete(date); }} 
              className="text-[10px] font-black text-red-300 hover:text-red-500 uppercase tracking-[0.2em] transition-colors"
            >
              Apagar permanentemente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};