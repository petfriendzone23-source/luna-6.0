
import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  parseISO,
  differenceInDays,
  startOfToday,
  subMonths,
  addMonths,
  isSameMonth,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayModal } from './components/DayModal';
import { Button } from './components/Button';
import { DayLog, CycleStats, UserSettings, SYMPTOMS, MOODS, CYCLE_PHASES, CyclePhaseType, AppTheme } from './types';
import { getCalendarDays, formatDate, calculateCycleStats, getCyclePhase } from './utils/dateUtils';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Screen = 'inicio' | 'calendario' | 'historico' | 'insights' | 'ajustes';

const THEMES: Record<AppTheme, { primary: string; light: string; soft: string; bg: string }> = {
  rose: { primary: '#f43f5e', light: '#fff1f2', soft: '#ffe4e6', bg: '#fffafb' },
  sky: { primary: '#0ea5e9', light: '#f0f9ff', soft: '#e0f2fe', bg: '#f0f9ff' },
  emerald: { primary: '#10b981', light: '#f0fdf4', soft: '#d1fae5', bg: '#f0fdf4' },
  violet: { primary: '#8b5cf6', light: '#f5f3ff', soft: '#ede9fe', bg: '#f5f3ff' },
  midnight: { primary: '#475569', light: '#f8fafc', soft: '#f1f5f9', bg: '#f8fafc' },
};

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('inicio');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<Record<string, DayLog>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>({
    avgCycleLength: 28,
    avgPeriodLength: 5,
    lastPeriodStartManual: undefined,
    theme: 'rose'
  });

  useEffect(() => {
    const savedLogs = localStorage.getItem('luna_logs_v3');
    if (savedLogs) try { setLogs(JSON.parse(savedLogs)); } catch (e) {}
    const savedSettings = localStorage.getItem('luna_settings_v3');
    if (savedSettings) try { setSettings(JSON.parse(savedSettings)); } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem('luna_logs_v3', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    const config = THEMES[settings.theme || 'rose'];
    const root = document.documentElement;
    root.style.setProperty('--primary', config.primary);
    root.style.setProperty('--primary-light', config.light);
    root.style.setProperty('--primary-soft', config.soft);
    root.style.setProperty('--bg-app', config.bg);
  }, [settings.theme]);

  const stats: CycleStats = useMemo(() => calculateCycleStats(logs, settings), [logs, settings]);
  const calendarDays = useMemo(() => getCalendarDays(currentDate), [currentDate]);

  const nextPeriodIn = useMemo(() => {
    if (!stats.nextPeriodDate) return null;
    return differenceInDays(parseISO(stats.nextPeriodDate), startOfToday());
  }, [stats.nextPeriodDate]);

  const currentPhase: CyclePhaseType | null = useMemo(() => {
    if (stats.currentDayOfCycle === null) return null;
    return getCyclePhase(stats.currentDayOfCycle, stats);
  }, [stats]);

  const handleDayClick = (dKey: string) => {
    setSelectedDate(dKey);
    setIsQuickViewOpen(true);
  };

  const getDayStatus = (day: Date) => {
    const dKey = formatDate(day);
    const log = logs[dKey];
    const isMenstruation = log?.isPeriod;
    const isPredicted = stats.nextPeriodDate === dKey;
    const isOvulation = stats.ovulationDate === dKey;
    const isFertile = stats.fertileWindow.includes(dKey);
    
    let dayOfCycle = null;
    if (stats.lastPeriodStart) {
        const diff = differenceInDays(day, parseISO(stats.lastPeriodStart)) + 1;
        dayOfCycle = diff > 0 ? ((diff - 1) % stats.avgCycleLength) + 1 : null;
    }
    const phase = dayOfCycle ? getCyclePhase(dayOfCycle, stats) : null;

    return { isMenstruation, isPredicted, isOvulation, isFertile, log, dKey, phase, dayOfCycle };
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'inicio':
        return (
          <div className="space-y-8 pb-32 animate-in fade-in duration-700">
            <section className="bg-white rounded-[3.5rem] p-12 text-center shadow-2xl border border-theme-soft relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-theme-primary to-indigo-400 opacity-20"></div>
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-theme-primary opacity-50 mb-6">Status Luna</h2>
               <div className="text-6xl font-serif font-black text-gray-800 leading-tight">
                 {nextPeriodIn !== null ? (
                   nextPeriodIn > 0 ? <><span className="text-theme-primary">{nextPeriodIn}</span> dias</> : 
                   nextPeriodIn === 0 ? <span className="text-theme-primary">Hoje! 🩸</span> : "Atrasada"
                 ) : "Bem-vinda!"}
               </div>
               <p className="mt-6 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                 Próximo Ciclo Previsto
               </p>
            </section>

            {currentPhase && (
              <section className={`rounded-[3rem] p-8 text-white shadow-2xl ${CYCLE_PHASES[currentPhase].color} transition-all`}>
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-3xl font-serif font-black">{CYCLE_PHASES[currentPhase].name}</h3>
                   <span className="text-4xl">
                     {currentPhase === 'menstrual' ? '🩸' : currentPhase === 'folicular' ? '🌱' : currentPhase === 'ovulatoria' ? '🌸' : '🌙'}
                   </span>
                </div>
                <p className="text-white/90 leading-relaxed mb-6 font-medium">{CYCLE_PHASES[currentPhase].description}</p>
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-[2rem] border border-white/20">
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Dica de Hoje</p>
                   <p className="font-bold text-lg">{CYCLE_PHASES[currentPhase].advice}</p>
                </div>
              </section>
            )}

            <Button size="lg" className="w-full h-20 rounded-[2.5rem] shadow-2xl shadow-rose-100 text-lg font-black tracking-wide" onClick={() => setActiveScreen('calendario')}>
                ABRIR AGENDA ILUSTRADA 🎨
            </Button>
          </div>
        );

      case 'calendario':
        return (
          <div className="space-y-8 pb-32 animate-in slide-in-from-bottom-8 duration-500">
            <section className="bg-white rounded-[3.5rem] p-8 shadow-2xl border border-theme-soft">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-serif font-black text-gray-800 capitalize px-2">
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="w-12 h-12 flex items-center justify-center bg-theme-light text-theme-primary rounded-2xl hover:scale-105 active:scale-95 transition-all">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="w-12 h-12 flex items-center justify-center bg-theme-light text-theme-primary rounded-2xl hover:scale-105 active:scale-95 transition-all">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-3">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                  <div key={d} className="text-center py-2 text-[10px] font-black text-theme-primary opacity-40 uppercase tracking-widest">{d}</div>
                ))}
                {calendarDays.map(day => {
                  const status = getDayStatus(day);
                  const active = isSameMonth(day, currentDate);
                  const isCur = isToday(day);

                  return (
                    <button
                      key={status.dKey}
                      onClick={() => handleDayClick(status.dKey)}
                      className={`
                        relative flex flex-col items-center justify-center h-20 sm:h-28 rounded-[2rem] transition-all duration-300 border-4
                        ${!active ? 'opacity-5 grayscale scale-90' : 'opacity-100'}
                        ${status.isMenstruation ? 'bg-gradient-to-br from-rose-500 to-rose-600 border-rose-400 text-white shadow-xl scale-105 z-10' : 
                          status.isOvulation ? 'bg-gradient-to-br from-teal-400 to-teal-500 border-teal-300 text-white shadow-xl scale-105 z-10' :
                          status.isFertile ? 'bg-teal-50 border-teal-200 text-teal-600' :
                          status.isPredicted ? 'bg-rose-50 border-rose-200 border-dashed text-rose-300' :
                          'bg-white border-gray-50 text-gray-700 hover:border-theme-soft'}
                        ${isCur ? 'animate-today' : ''}
                      `}
                    >
                      <span className={`text-sm sm:text-lg font-black mb-1 ${isCur ? 'underline decoration-4 underline-offset-4' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      
                      <div className="flex items-center justify-center">
                        {status.isMenstruation && <span className="text-2xl drop-shadow-md">🩸</span>}
                        {status.isOvulation && <span className="text-2xl drop-shadow-md">🌸</span>}
                        {!status.isMenstruation && !status.isOvulation && status.isFertile && <span className="text-sm">✨</span>}
                      </div>

                      {status.log && (status.log.moods.length > 0 || status.log.symptoms.length > 0) && (
                         <div className={`absolute top-3 right-3 w-3 h-3 rounded-full border-2 border-white ${status.isMenstruation ? 'bg-white' : 'bg-amber-400'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-10">
                 <div className="p-6 rounded-[2rem] bg-rose-500/10 border border-rose-200 flex items-center gap-4">
                    <span className="text-3xl">🩸</span>
                    <span className="text-xs font-black text-rose-600 uppercase tracking-widest">Menstruação</span>
                 </div>
                 <div className="p-6 rounded-[2rem] bg-teal-500/10 border border-teal-200 flex items-center gap-4">
                    <span className="text-3xl">🌸</span>
                    <span className="text-xs font-black text-teal-600 uppercase tracking-widest">Ovulação</span>
                 </div>
              </div>
            </section>
          </div>
        );

      case 'ajustes':
        return (
          <div className="space-y-8 pb-32 animate-in fade-in duration-500">
             <h3 className="text-4xl font-serif font-black text-gray-800 text-theme-primary px-2">Configurações</h3>
             
             <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-theme-soft space-y-10">
                <section>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-6">Escolha sua Cor</label>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {(Object.keys(THEMES) as AppTheme[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setSettings(p => ({ ...p, theme: t }))}
                                className={`flex-shrink-0 w-16 h-16 rounded-[1.5rem] border-4 transition-all ${settings.theme === t ? 'scale-110 border-gray-300 shadow-xl' : 'border-transparent opacity-60'}`}
                                style={{ backgroundColor: THEMES[t].primary }}
                            />
                        ))}
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-theme-primary tracking-widest block">Média do Ciclo (Dias)</label>
                      <input type="number" value={settings.avgCycleLength} onChange={e => setSettings(p => ({...p, avgCycleLength: parseInt(e.target.value) || 28}))} className="w-full h-16 px-8 rounded-[1.5rem] bg-theme-light border-none font-black text-xl text-gray-700 outline-none" />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-theme-primary tracking-widest block">Data do Último Início</label>
                      <input type="date" value={settings.lastPeriodStartManual || ''} onChange={e => setSettings(p => ({...p, lastPeriodStartManual: e.target.value}))} className="w-full h-16 px-8 rounded-[1.5rem] bg-theme-light border-none font-black text-lg text-gray-700 outline-none" />
                   </div>
                </div>

                <Button className="w-full h-16 rounded-[1.5rem] font-black text-lg" onClick={() => alert('Perfil atualizado com sucesso! ✨')}>
                  SALVAR PERFIL
                </Button>
             </div>
          </div>
        );
      
      default: return <div />;
    }
  };

  return (
    <div className="min-h-screen transition-all duration-500 overflow-x-hidden" style={{ backgroundColor: 'var(--bg-app)' }}>
      <header className="px-8 py-10 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveScreen('inicio')}>
          <div className="w-12 h-12 bg-theme-primary rounded-2xl flex items-center justify-center text-white shadow-2xl rotate-3">
             <span className="text-2xl">🌙</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-gray-800 tracking-tight">Luna</h1>
        </div>
        <div className="bg-white/50 px-4 py-2 rounded-2xl border border-theme-soft text-[10px] font-black uppercase text-theme-primary tracking-tighter">
            {stats.avgCycleLength} dias de média
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6">
        {renderScreen()}
      </main>

      {isQuickViewOpen && selectedDate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white rounded-[4rem] w-full max-w-md p-12 shadow-[0_32px_64px_rgba(0,0,0,0.2)] relative animate-in zoom-in-95 duration-200">
              <button onClick={() => setIsQuickViewOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-gray-500 transition-colors">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="mb-10">
                <p className="text-[10px] font-black text-theme-primary uppercase tracking-[0.3em] mb-4">
                  {format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                <h4 className="text-5xl font-serif font-black text-gray-800 leading-tight">
                  {getDayStatus(parseISO(selectedDate)).isMenstruation ? "Sua Menstruação 🩸" : 
                   getDayStatus(parseISO(selectedDate)).isOvulation ? "Fase Ovulatória 🌸" : "Seu Dia ✨"}
                </h4>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Gravidez</p>
                    <p className="text-lg font-black text-gray-800">{getDayStatus(parseISO(selectedDate)).isOvulation ? "Máxima" : getDayStatus(parseISO(selectedDate)).isFertile ? "Alta" : "Nula"}</p>
                  </div>
                  <div className="flex-1 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Ciclo</p>
                    <p className="text-lg font-black text-gray-800">Dia {getDayStatus(parseISO(selectedDate)).dayOfCycle || '--'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button className="w-full h-16 rounded-[2rem] text-lg font-black" onClick={() => { setIsModalOpen(true); setIsQuickViewOpen(false); }}>
                  ANOTAR SINTOMAS 📝
                </Button>
                <button onClick={() => setIsQuickViewOpen(false)} className="w-full py-4 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">FECHAR</button>
              </div>
           </div>
        </div>
      )}

      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-50">
        <div className="glass-nav rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-3 flex justify-between items-center border border-white">
          <NavItem active={activeScreen === 'inicio'} onClick={() => setActiveScreen('inicio')} label="Início" icon="🏠" />
          <NavItem active={activeScreen === 'calendario'} onClick={() => setActiveScreen('calendario')} label="Agenda" icon="📅" />
          <NavItem active={activeScreen === 'historico'} onClick={() => setActiveScreen('historico')} label="Diário" icon="📖" />
          <NavItem active={activeScreen === 'ajustes'} onClick={() => setActiveScreen('ajustes')} label="Perfil" icon="👤" />
        </div>
      </nav>

      {isModalOpen && selectedDate && (
        <DayModal 
          date={selectedDate}
          existingLog={logs[selectedDate]}
          onSave={(log) => { setLogs(p => ({...p, [log.date]: log})); setIsModalOpen(false); }}
          onDelete={(date) => { const n = {...logs}; delete n[date]; setLogs(n); setIsModalOpen(false); }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 px-6 py-4 rounded-[2rem] transition-all duration-500 ${active ? 'bg-theme-primary text-white scale-110 shadow-2xl rotate-2' : 'text-gray-400 hover:text-theme-primary hover:bg-theme-light'}`}>
    <span className="text-2xl">{icon}</span>
    <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'block' : 'hidden'}`}>{label}</span>
  </button>
);

export default App;
