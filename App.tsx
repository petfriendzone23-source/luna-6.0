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
import { DayLog, CycleStats, UserSettings, CYCLE_PHASES, CyclePhaseType, AppTheme } from './types';
import { getCalendarDays, formatDate, calculateCycleStats, getCyclePhase } from './utils/dateUtils';

type Screen = 'inicio' | 'calendario' | 'historico' | 'ajustes';

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
    const savedLogs = localStorage.getItem('luna_logs_v4');
    if (savedLogs) try { setLogs(JSON.parse(savedLogs)); } catch (e) {}
    const savedSettings = localStorage.getItem('luna_settings_v4');
    if (savedSettings) try { setSettings(JSON.parse(savedSettings)); } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem('luna_logs_v4', JSON.stringify(logs));
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
          <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="bg-white rounded-[3rem] p-10 text-center shadow-xl border border-theme-soft relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-theme-primary to-indigo-400"></div>
               <h2 className="text-[10px] font-black uppercase tracking-widest text-theme-primary opacity-50 mb-4">Seu Status Luna</h2>
               <div className="text-5xl font-serif font-black text-gray-800 leading-tight">
                 {nextPeriodIn !== null ? (
                   nextPeriodIn > 0 ? <><span className="text-theme-primary">{nextPeriodIn}</span> dias</> : 
                   nextPeriodIn === 0 ? <span className="text-theme-primary">Menstruação hoje! 🩸</span> : <span className="text-orange-500">Atrasada</span>
                 ) : "Bem-vinda!"}
               </div>
               <p className="mt-4 text-gray-400 font-medium text-sm">
                 {nextPeriodIn !== null ? `Próximo ciclo em ${format(parseISO(stats.nextPeriodDate!), "dd 'de' MMM", { locale: ptBR })}` : "Configure seu ciclo no perfil."}
               </p>
            </section>

            {currentPhase && (
              <section className={`rounded-[2.5rem] p-8 text-white shadow-2xl ${CYCLE_PHASES[currentPhase].color} transition-all`}>
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-2xl font-serif font-black">{CYCLE_PHASES[currentPhase].name}</h3>
                   <span className="text-3xl">
                     {currentPhase === 'menstrual' ? '🩸' : currentPhase === 'folicular' ? '🌱' : currentPhase === 'ovulatoria' ? '🌸' : '🌙'}
                   </span>
                </div>
                <p className="text-white/90 text-sm leading-relaxed mb-6">{CYCLE_PHASES[currentPhase].description}</p>
                <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20">
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Dica de Bem-estar</p>
                   <p className="font-bold">{CYCLE_PHASES[currentPhase].advice}</p>
                </div>
              </section>
            )}

            <Button size="lg" className="w-full h-16 rounded-3xl shadow-xl shadow-rose-100 text-base font-bold" onClick={() => setActiveScreen('calendario')}>
                Abrir Calendário Detalhado
            </Button>
          </div>
        );

      case 'calendario':
        return (
          <div className="space-y-6 pb-32 animate-in fade-in duration-500">
            <section className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-theme-soft">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-serif font-black text-gray-800 capitalize px-2">
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="w-10 h-10 flex items-center justify-center bg-theme-light text-theme-primary rounded-2xl">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="w-10 h-10 flex items-center justify-center bg-theme-light text-theme-primary rounded-2xl">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                  <div key={d} className="text-center py-2 text-[9px] font-black text-theme-primary opacity-30 uppercase">{d}</div>
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
                        relative flex flex-col items-center justify-center h-16 sm:h-20 rounded-2xl transition-all duration-300 border-2
                        ${!active ? 'opacity-5 grayscale' : 'opacity-100'}
                        ${status.isMenstruation ? 'bg-gradient-to-br from-rose-500 to-rose-600 border-rose-400 text-white shadow-lg z-10' : 
                          status.isOvulation ? 'bg-gradient-to-br from-teal-400 to-teal-500 border-teal-300 text-white shadow-lg z-10' :
                          status.isFertile ? 'bg-teal-50 border-teal-100 text-teal-600' :
                          status.isPredicted ? 'bg-rose-50 border-rose-100 border-dashed text-rose-300' :
                          'bg-transparent border-gray-50 text-gray-700 hover:border-theme-soft'}
                        ${isCur ? 'border-theme-primary shadow-sm animate-today' : ''}
                      `}
                    >
                      <span className={`text-xs sm:text-sm font-black mb-1`}>
                        {format(day, 'd')}
                      </span>
                      
                      <div className="flex items-center justify-center">
                        {status.isMenstruation && <span className="text-lg">🩸</span>}
                        {status.isOvulation && <span className="text-lg">🌸</span>}
                        {!status.isMenstruation && !status.isOvulation && status.isFertile && <span className="text-[10px]">✨</span>}
                      </div>

                      {status.log && (status.log.moods.length > 0 || status.log.symptoms.length > 0) && (
                         <div className={`absolute top-2 right-2 w-2 h-2 rounded-full border border-white ${status.isMenstruation ? 'bg-white' : 'bg-amber-400'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-center gap-6 mt-10">
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span className="text-[10px] font-black text-gray-400 uppercase">Menstruação</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-teal-400"></span>
                    <span className="text-[10px] font-black text-gray-400 uppercase">Ovulação</span>
                 </div>
              </div>
            </section>
          </div>
        );

      case 'historico':
        // Fix: Explicitly cast Object.values(logs) to DayLog[] and type sort parameters to avoid 'unknown' errors
        const historyLogs = (Object.values(logs) as DayLog[]).sort((a: DayLog, b: DayLog) => b.date.localeCompare(a.date));
        return (
          <div className="space-y-6 pb-32 animate-in slide-in-from-right-4 duration-500">
             <h3 className="text-3xl font-serif font-black text-gray-800 text-theme-primary">Diário Luna</h3>
             {historyLogs.length === 0 ? (
               <div className="p-12 text-center text-gray-400 italic bg-white rounded-3xl border border-dashed">
                 Nenhum registro ainda. Comece hoje!
               </div>
             ) : (
               historyLogs.map(log => (
                 <div key={log.date} onClick={() => handleDayClick(log.date)} className="bg-white p-6 rounded-3xl shadow-sm border border-theme-soft flex items-center justify-between group cursor-pointer hover:shadow-md transition-all">
                    <div>
                      <p className="text-[10px] font-black text-theme-primary uppercase">{format(parseISO(log.date), "dd 'de' MMMM", { locale: ptBR })}</p>
                      <h4 className="text-lg font-bold text-gray-800">{log.isPeriod ? "Período 🩸" : "Bem-estar ✨"}</h4>
                      <div className="flex gap-2 mt-1">
                        {log.moods.length > 0 && <span className="text-[9px] font-bold text-amber-600 uppercase">{log.moods[0]}</span>}
                        {log.symptoms.length > 0 && <span className="text-[9px] font-bold text-gray-400 uppercase">• {log.symptoms.length} sintomas</span>}
                      </div>
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-theme-light text-theme-primary group-hover:bg-theme-primary group-hover:text-white transition-all">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                 </div>
               ))
             )}
          </div>
        );

      case 'ajustes':
        return (
          <div className="space-y-8 pb-32 animate-in fade-in duration-500">
             <h3 className="text-3xl font-serif font-black text-gray-800 text-theme-primary">Seu Perfil</h3>
             <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-theme-soft space-y-10">
                <section>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-6">Personalize sua Luna</label>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {(Object.keys(THEMES) as AppTheme[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setSettings(p => ({ ...p, theme: t }))}
                                className={`flex-shrink-0 w-12 h-12 rounded-2xl border-4 transition-all ${settings.theme === t ? 'scale-110 border-gray-300 shadow-lg' : 'border-transparent opacity-60'}`}
                                style={{ backgroundColor: THEMES[t].primary }}
                            />
                        ))}
                    </div>
                </section>

                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-theme-primary tracking-widest block">Ciclo Médio (Dias)</label>
                      <input type="number" value={settings.avgCycleLength} onChange={e => setSettings(p => ({...p, avgCycleLength: parseInt(e.target.value) || 28}))} className="w-full h-14 px-6 rounded-2xl bg-theme-light border-none font-black text-gray-700 outline-none" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-theme-primary tracking-widest block">Último Início</label>
                      <input type="date" value={settings.lastPeriodStartManual || ''} onChange={e => setSettings(p => ({...p, lastPeriodStartManual: e.target.value}))} className="w-full h-14 px-6 rounded-2xl bg-theme-light border-none font-black text-gray-700 outline-none" />
                   </div>
                </div>

                <Button className="w-full h-14 rounded-2xl font-black" onClick={() => alert('Configurações atualizadas!')}>
                  SALVAR ALTERAÇÕES
                </Button>
             </div>
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <div className="min-h-screen transition-all duration-500 overflow-x-hidden" style={{ backgroundColor: 'var(--bg-app)' }}>
      <header className="px-8 py-10 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveScreen('inicio')}>
          <div className="w-10 h-10 bg-theme-primary rounded-xl flex items-center justify-center text-white shadow-xl rotate-3">
             <span className="text-xl font-serif">L</span>
          </div>
          <h1 className="text-2xl font-serif font-black text-gray-800">Luna</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6">
        {renderScreen()}
      </main>

      {isQuickViewOpen && selectedDate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-black/40 backdrop-blur-md animate-in fade-in">
           <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 shadow-2xl relative animate-in zoom-in-95">
              <button onClick={() => setIsQuickViewOpen(false)} className="absolute top-8 right-8 text-gray-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="mb-8">
                <p className="text-[10px] font-black text-theme-primary uppercase tracking-widest mb-2">
                  {format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                <h4 className="text-3xl font-serif font-black text-gray-800">
                  {getDayStatus(parseISO(selectedDate)).isMenstruation ? "Menstruação 🩸" : "Seu Dia Luna ✨"}
                </h4>
              </div>

              <div className="flex flex-col gap-3">
                <Button className="w-full h-14 rounded-2xl text-base font-black" onClick={() => { setIsModalOpen(true); setIsQuickViewOpen(false); }}>
                  Anotar Sintomas
                </Button>
                <button onClick={() => setIsQuickViewOpen(false)} className="w-full py-3 text-xs font-black text-gray-400 uppercase tracking-widest">Fechar</button>
              </div>
           </div>
        </div>
      )}

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="glass-nav rounded-[2.5rem] shadow-2xl p-2 flex justify-between items-center">
          <NavItem active={activeScreen === 'inicio'} onClick={() => setActiveScreen('inicio')} label="Home" icon="🏠" />
          <NavItem active={activeScreen === 'calendario'} onClick={() => setActiveScreen('calendario')} label="Agenda" icon="📅" />
          <NavItem active={activeScreen === 'historico'} onClick={() => setActiveScreen('historico')} label="Notas" icon="📖" />
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
  <button onClick={onClick} className={`flex flex-col items-center gap-1 px-5 py-3 rounded-3xl transition-all duration-300 ${active ? 'bg-theme-primary text-white scale-105 shadow-xl' : 'text-gray-400 hover:text-theme-primary'}`}>
    <span className="text-xl">{icon}</span>
    <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'block' : 'hidden'}`}>{label}</span>
  </button>
);

export default App;