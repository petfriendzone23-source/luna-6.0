
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
// Importação direta da URL para evitar erros de descoberta de pacotes do npm/Vercel
import { ptBR } from 'https://esm.sh/date-fns@4.1.0/locale/pt-BR';
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
    if (savedLogs) {
      try { setLogs(JSON.parse(savedLogs)); } catch (e) { console.error(e); }
    }
    const savedSettings = localStorage.getItem('luna_settings_v3');
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('luna_logs_v3', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    const theme = settings.theme || 'rose';
    const config = THEMES[theme];
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

  const handleSaveLog = (log: DayLog) => {
    setLogs(prev => ({ ...prev, [log.date]: log }));
    setIsModalOpen(false);
    setIsQuickViewOpen(false);
  };

  const handleDeleteLog = (date: string) => {
    const newLogs = { ...logs };
    delete newLogs[date];
    setLogs(newLogs);
    setIsModalOpen(false);
    setIsQuickViewOpen(false);
  };

  const getDayStatus = (day: Date) => {
    const dKey = formatDate(day);
    const log = logs[dKey];
    const isMenstruation = log?.isPeriod;
    const isPredictedMenstruation = stats.nextPeriodDate === dKey;
    const isOvulation = stats.ovulationDate === dKey;
    const isFertile = stats.fertileWindow.includes(dKey);
    
    let dayOfCycle = null;
    if (stats.lastPeriodStart) {
        const diff = differenceInDays(day, parseISO(stats.lastPeriodStart)) + 1;
        dayOfCycle = diff > 0 ? ((diff - 1) % stats.avgCycleLength) + 1 : null;
    }
    const phase = dayOfCycle ? getCyclePhase(dayOfCycle, stats) : null;

    return { isMenstruation, isPredictedMenstruation, isOvulation, isFertile, log, dKey, phase, dayOfCycle };
  };

  const handleDayClick = (dKey: string) => {
    setSelectedDate(dKey);
    setIsQuickViewOpen(true);
  };

  const selectedDayDetails = useMemo(() => {
    if (!selectedDate) return null;
    const status = getDayStatus(parseISO(selectedDate));
    let title = "Dia Comum";
    let pregnancyChance = status.isOvulation ? "Máxima" : status.isFertile ? "Alta" : "Baixa";
    if (status.isMenstruation) title = "Menstruação";
    else if (status.isPredictedMenstruation) title = "Previsão";
    else if (status.isOvulation) title = "Ovulação";
    else if (status.isFertile) title = "Fértil";
    return { title, pregnancyChance, ...status };
  }, [selectedDate, stats, logs]);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'inicio':
        return (
          <div className="space-y-8 pb-10">
            <section className="bg-white rounded-[3rem] p-10 text-center shadow-2xl border border-theme-soft relative overflow-hidden">
               <div className="relative z-10">
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-theme-primary opacity-60 mb-4">Seu Ciclo</h2>
                  <div className="text-5xl font-serif font-bold text-gray-800">
                    {nextPeriodIn !== null ? (
                      nextPeriodIn > 0 ? <><span className="text-theme-primary">{nextPeriodIn}</span> dias</> : 
                      nextPeriodIn === 0 ? <span className="text-theme-primary">Hoje! 🩸</span> : "Atraso"
                    ) : "Olá! 👋"}
                  </div>
                  <p className="mt-4 text-gray-400 font-medium">
                    {nextPeriodIn !== null ? `Próxima menstruação prevista` : "Configure seu ciclo nos ajustes."}
                  </p>
               </div>
            </section>

            {currentPhase && (
              <section className={`rounded-[2.5rem] p-8 text-white shadow-xl ${CYCLE_PHASES[currentPhase].color}`}>
                <h3 className="text-2xl font-serif font-bold mb-2">{CYCLE_PHASES[currentPhase].name}</h3>
                <p className="text-sm opacity-90 leading-relaxed mb-4">{CYCLE_PHASES[currentPhase].description}</p>
                <div className="bg-black/10 p-4 rounded-2xl">
                   <p className="text-[10px] font-black uppercase opacity-60">Dica</p>
                   <p className="text-sm font-bold">{CYCLE_PHASES[currentPhase].advice}</p>
                </div>
              </section>
            )}

            <Button size="lg" className="w-full h-16 rounded-[2rem] shadow-xl" onClick={() => setActiveScreen('calendario')}>
                Ver Agenda Detalhada 📅
            </Button>
          </div>
        );

      case 'calendario':
        return (
          <div className="space-y-6 pb-28">
            <section className="bg-white rounded-[3.5rem] p-8 shadow-2xl border border-theme-soft">
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-2xl font-serif font-bold text-gray-800 capitalize">
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-3 bg-theme-light text-theme-primary rounded-2xl">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-3 bg-theme-light text-theme-primary rounded-2xl">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                  <div key={d} className="text-center py-2 text-[10px] font-black text-theme-primary opacity-30 uppercase">{d}</div>
                ))}
                {calendarDays.map(day => {
                  const { isMenstruation, isPredictedMenstruation, isOvulation, isFertile, log, dKey } = getDayStatus(day);
                  const active = isSameMonth(day, currentDate);
                  const isCur = isToday(day);

                  return (
                    <button
                      key={dKey}
                      onClick={() => handleDayClick(dKey)}
                      className={`
                        relative flex flex-col items-center justify-center h-16 sm:h-24 rounded-[1.5rem] transition-all duration-300 border-2
                        ${!active ? 'opacity-10 grayscale scale-90' : 'opacity-100'}
                        ${isMenstruation ? 'bg-gradient-to-br from-rose-500 to-rose-600 border-rose-400 text-white shadow-lg' : 
                          isOvulation ? 'bg-gradient-to-br from-teal-400 to-teal-500 border-teal-300 text-white shadow-lg' :
                          isFertile ? 'bg-teal-50 border-teal-100 text-teal-600' :
                          isPredictedMenstruation ? 'bg-theme-light border-theme-primary border-dashed text-theme-primary' :
                          'bg-transparent border-gray-50 text-gray-700 hover:border-theme-soft'}
                        ${isCur ? 'ring-4 ring-theme-primary/20 border-theme-primary' : ''}
                      `}
                    >
                      <span className={`text-xs sm:text-base font-black ${isCur ? 'underline underline-offset-4' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      
                      <div className="mt-1">
                        {isMenstruation && <span className="text-lg animate-bounce-subtle">🩸</span>}
                        {isOvulation && <span className="text-lg">🌸</span>}
                        {!isMenstruation && !isOvulation && isFertile && <span className="text-xs opacity-50">✨</span>}
                      </div>

                      {log && (log.symptoms.length > 0 || log.moods.length > 0) && (
                         <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${isMenstruation ? 'bg-white' : 'bg-amber-400'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                 <div className="p-4 rounded-3xl bg-rose-50 border border-rose-100 flex items-center gap-3">
                    <span className="text-xl">🩸</span>
                    <span className="text-[10px] font-black text-rose-500 uppercase">Menstruação</span>
                 </div>
                 <div className="p-4 rounded-3xl bg-teal-50 border border-teal-100 flex items-center gap-3">
                    <span className="text-xl">🌸</span>
                    <span className="text-[10px] font-black text-teal-500 uppercase">Ovulação</span>
                 </div>
              </div>
            </section>
          </div>
        );

      case 'ajustes':
        return (
          <section className="space-y-6 pb-20">
            <h3 className="text-3xl font-serif font-bold text-gray-800 text-theme-primary">Configurações</h3>
            
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-theme-soft space-y-6">
                <h4 className="text-[10px] font-black text-theme-primary uppercase tracking-widest">Tema do Aplicativo</h4>
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {(Object.keys(THEMES) as AppTheme[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setSettings(prev => ({ ...prev, theme: t }))}
                            className={`flex-shrink-0 w-12 h-12 rounded-full border-4 transition-all ${settings.theme === t ? 'scale-110 border-gray-200' : 'border-transparent'}`}
                            style={{ backgroundColor: THEMES[t].primary }}
                        />
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-theme-soft space-y-8">
               <div className="space-y-6">
                 <div>
                    <label className="block text-xs font-black text-theme-primary uppercase mb-2">Duração do Ciclo (Dias)</label>
                    <input type="number" value={settings.avgCycleLength} onChange={(e) => setSettings(p => ({...p, avgCycleLength: parseInt(e.target.value) || 28}))} className="w-full h-14 px-6 rounded-2xl bg-theme-light border-none font-bold text-gray-700 outline-none" />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-theme-primary uppercase mb-2">Último Início</label>
                    <input type="date" value={settings.lastPeriodStartManual || ''} onChange={(e) => setSettings(p => ({...p, lastPeriodStartManual: e.target.value}))} className="w-full h-14 px-6 rounded-2xl bg-theme-light border-none font-bold text-gray-700 outline-none" />
                 </div>
               </div>
               <Button onClick={() => alert('Configurações salvas!')} className="w-full h-14 rounded-2xl">Salvar Perfil</Button>
            </div>
          </section>
        );
      
      default: return <div />;
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: 'var(--bg-app)' }}>
      <header className="px-6 py-8 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-3" onClick={() => setActiveScreen('inicio')}>
          <div className="w-10 h-10 bg-theme-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
             <span className="text-xl">🌙</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-800">Luna</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4">
        {renderScreen()}
      </main>

      {isQuickViewOpen && selectedDayDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/20 backdrop-blur-md">
           <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 shadow-2xl relative">
              <button onClick={() => setIsQuickViewOpen(false)} className="absolute top-8 right-8 text-gray-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h4 className="text-3xl font-serif font-bold text-gray-800 mb-2">{selectedDayDetails.title}</h4>
              <p className="text-sm text-gray-400 mb-8">{format(parseISO(selectedDayDetails.dKey), "dd 'de' MMMM", { locale: ptBR })}</p>
              
              <div className="bg-theme-light p-6 rounded-[2rem] mb-8">
                 <p className="text-[10px] font-black text-theme-primary uppercase mb-1">Chance de Gravidez</p>
                 <p className="text-xl font-bold text-gray-700">{selectedDayDetails.pregnancyChance}</p>
              </div>

              <Button className="w-full h-14 rounded-2xl mb-2" onClick={() => { setIsModalOpen(true); setIsQuickViewOpen(false); }}>Registrar Sintomas</Button>
           </div>
        </div>
      )}

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="bg-white/90 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-2xl p-2 flex justify-between items-center">
          <NavItem active={activeScreen === 'inicio'} onClick={() => setActiveScreen('inicio')} label="Hoje" icon="🏠" />
          <NavItem active={activeScreen === 'calendario'} onClick={() => setActiveScreen('calendario')} label="Agenda" icon="📅" />
          <NavItem active={activeScreen === 'historico'} onClick={() => setActiveScreen('historico')} label="Diário" icon="📖" />
          <NavItem active={activeScreen === 'ajustes'} onClick={() => setActiveScreen('ajustes')} label="Perfil" icon="👤" />
        </div>
      </nav>

      {isModalOpen && selectedDate && (
        <DayModal 
          date={selectedDate}
          existingLog={logs[selectedDate]}
          onSave={handleSaveLog}
          onDelete={handleDeleteLog}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 px-5 py-3 rounded-full transition-all duration-300 ${active ? 'bg-theme-primary text-white scale-105 shadow-lg' : 'text-gray-400 hover:text-theme-primary'}`}>
    <span className="text-xl">{icon}</span>
    <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'block' : 'hidden'}`}>{label}</span>
  </button>
);

export default App;
