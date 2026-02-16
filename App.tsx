import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { Logo, LunaBrandText } from './components/Logo';
import { DayLog, CycleStats, UserSettings, CYCLE_PHASES, CyclePhaseType, AppTheme } from './types';
import { getCalendarDays, formatDate, calculateCycleStats, getCyclePhase, getPregnancyChance } from './utils/dateUtils';

type Screen = 'inicio' | 'calendario' | 'historico' | 'ajustes';

const THEMES: Record<AppTheme, { primary: string; light: string; soft: string; bg: string }> = {
  rose: { primary: '#c18c8e', light: '#fcf4f4', soft: '#f3d8d9', bg: '#fffafb' },
  sky: { primary: '#9dbcd4', light: '#f4f8fc', soft: '#e5edf3', bg: '#f4f8fc' },
  emerald: { primary: '#9db8a6', light: '#f4fcf6', soft: '#e5f3e9', bg: '#f4fcf6' },
  violet: { primary: '#a69db8', light: '#f6f4fc', soft: '#e9e5f3', bg: '#f6f4fc' },
  midnight: { primary: '#6e6a6b', light: '#f9f9f9', soft: '#e5e5e5', bg: '#f9f9f9' },
};

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('inicio');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<Record<string, DayLog>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState<UserSettings>({
    userName: '',
    avgCycleLength: 28,
    avgPeriodLength: 5,
    lastPeriodStartManual: undefined,
    theme: 'rose'
  });

  const appName = settings.userName || 'Luna';

  useEffect(() => {
    const savedLogs = localStorage.getItem('luna_logs_v5');
    if (savedLogs) try { setLogs(JSON.parse(savedLogs)); } catch (e) {}
    const savedSettings = localStorage.getItem('luna_settings_v5');
    if (savedSettings) try { setSettings(JSON.parse(savedSettings)); } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem('luna_logs_v5', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('luna_settings_v5', JSON.stringify(settings));
    const config = THEMES[settings.theme || 'rose'];
    const root = document.documentElement;
    root.style.setProperty('--primary', config.primary);
    root.style.setProperty('--primary-light', config.light);
    root.style.setProperty('--primary-soft', config.soft);
    root.style.setProperty('--bg-app', config.bg);
    document.title = `${appName} - Controle Menstrual`;
  }, [settings, appName]);

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
    const pregnancyChance = getPregnancyChance(day, stats);
    let dayOfCycle = null;
    if (stats.lastPeriodStart) {
        const diff = differenceInDays(day, parseISO(stats.lastPeriodStart)) + 1;
        dayOfCycle = diff > 0 ? ((diff - 1) % stats.avgCycleLength) + 1 : null;
    }
    const phase = dayOfCycle ? getCyclePhase(dayOfCycle, stats) : null;
    return { isMenstruation, isPredicted, isOvulation, isFertile, log, dKey, phase, dayOfCycle, pregnancyChance };
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'inicio':
        return (
          <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="bg-white rounded-[3.5rem] p-12 text-center shadow-[0_20px_50px_rgba(193,140,142,0.15)] border border-theme-soft relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-[#c18c8e]"></div>
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-theme-primary opacity-60 mb-6">
                 Bem-vinda, {appName}
               </h2>
               <div className="text-6xl font-serif font-black text-gray-800 leading-tight">
                 {nextPeriodIn !== null ? (
                   nextPeriodIn > 0 ? <><span className="text-theme-primary">{nextPeriodIn}</span><span className="text-3xl ml-2 text-gray-400">dias</span></> : 
                   nextPeriodIn === 0 ? <span className="text-theme-primary text-4xl">Chegou hoje! 🩸</span> : <span className="text-orange-400 text-4xl">Atrasada</span>
                 ) : "Olá! ✨"}
               </div>
               <p className="mt-8 text-gray-500 font-bold text-sm tracking-wide">
                 {nextPeriodIn !== null ? `Seu próximo ciclo começa em ${format(parseISO(stats.nextPeriodDate!), "dd/MM", { locale: ptBR })}` : "Toque no calendário para começar seu registro."}
               </p>
            </section>

            {currentPhase && (
              <section className={`rounded-[3rem] p-10 text-white shadow-2xl ${CYCLE_PHASES[currentPhase].color === 'bg-rose-500' ? 'bg-[#c18c8e]' : CYCLE_PHASES[currentPhase].color} transition-all`}>
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-3xl font-serif font-black">{CYCLE_PHASES[currentPhase].name}</h3>
                   <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                     {currentPhase === 'menstrual' ? '🌙' : currentPhase === 'folicular' ? '🌱' : currentPhase === 'ovulatoria' ? '🌸' : '✨'}
                   </div>
                </div>
                <p className="text-white/90 text-sm leading-relaxed mb-8 font-medium">{CYCLE_PHASES[currentPhase].description}</p>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20">
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 mb-2">Sugestão Luna</p>
                   <p className="font-bold text-white text-base">{CYCLE_PHASES[currentPhase].advice}</p>
                </div>
              </section>
            )}

            <Button size="lg" className="w-full rounded-[3rem] h-24 text-xl uppercase tracking-[0.2em] shadow-xl" onClick={() => setActiveScreen('calendario')}>
                Abrir Calendário
            </Button>
          </div>
        );

      case 'calendario':
        return (
          <div className="space-y-6 pb-32 animate-in fade-in duration-500">
            <section className="bg-white rounded-[3.5rem] p-8 shadow-2xl border border-theme-soft">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-serif font-black text-gray-800 capitalize px-2">
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <div className="flex gap-3">
                  <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="w-12 h-12 flex items-center justify-center bg-theme-light text-theme-primary rounded-2xl border border-theme-soft active:scale-90 transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="w-12 h-12 flex items-center justify-center bg-theme-light text-theme-primary rounded-2xl border border-theme-soft active:scale-90 transition-all">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-3">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                  <div key={d} className="text-center py-2 text-[10px] font-black text-theme-primary/40 uppercase tracking-widest">{d}</div>
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
                        relative flex flex-col items-center justify-center h-16 sm:h-20 rounded-[1.5rem] transition-all duration-300 border-2
                        ${!active ? 'opacity-10' : 'opacity-100'}
                        ${status.isMenstruation ? 'bg-theme-primary border-theme-primary text-white shadow-xl scale-105 z-10' : 
                          status.isOvulation ? 'bg-[#d49da0] border-[#d49da0] text-white shadow-lg scale-105 z-10' :
                          status.isFertile ? 'bg-theme-light border-theme-soft text-theme-primary' :
                          status.isPredicted ? 'bg-white border-theme-soft border-dashed text-theme-primary/30' :
                          'bg-gray-50 border-transparent text-gray-400 hover:bg-white hover:border-theme-soft'}
                        ${isCur ? 'ring-4 ring-theme-primary/20 ring-offset-2 animate-today' : ''}
                      `}
                    >
                      <span className="text-xs sm:text-sm font-black">{format(day, 'd')}</span>
                      {status.isMenstruation && <div className="absolute bottom-2 w-1 h-1 rounded-full bg-white"></div>}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        );

      case 'historico':
        const historyLogs = (Object.values(logs) as DayLog[]).sort((a, b) => b.date.localeCompare(a.date));
        return (
          <div className="space-y-6 pb-32 animate-in slide-in-from-right-4 duration-500">
             <h3 className="text-3xl font-serif font-black text-theme-primary px-2">Diário</h3>
             {historyLogs.length === 0 ? (
               <div className="p-20 text-center text-gray-300 font-bold bg-white rounded-[3.5rem] border-4 border-dashed border-gray-50">
                 Seu diário está em branco.<br/>Comece registrando hoje.
               </div>
             ) : (
               historyLogs.map(log => (
                 <div key={log.date} onClick={() => handleDayClick(log.date)} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-theme-soft flex items-center justify-between hover:shadow-2xl transition-all cursor-pointer">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-theme-primary uppercase tracking-widest">{format(parseISO(log.date), "dd 'de' MMMM", { locale: ptBR })}</p>
                      <h4 className="text-xl font-black text-gray-800 mt-1">{log.isPeriod ? "Menstruação 🩸" : "Notas do Dia"}</h4>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {log.moods.slice(0, 3).map(m => <span key={m} className="px-3 py-1 bg-theme-light text-theme-primary text-[9px] font-black rounded-full uppercase border border-theme-soft">{m}</span>)}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                    </div>
                 </div>
               ))
             )}
          </div>
        );

      case 'ajustes':
        return (
          <div className="space-y-8 pb-32 animate-in fade-in duration-500">
             <h3 className="text-3xl font-serif font-black text-theme-primary px-2">Perfil</h3>
             <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl border border-theme-soft space-y-12">
                <section className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-theme-primary tracking-[0.2em] block">Seu Nome</label>
                  <input type="text" value={settings.userName || ''} onChange={e => setSettings(p => ({...p, userName: e.target.value}))} className="w-full h-18 px-8 rounded-2xl bg-gray-50 border-2 border-transparent font-black text-gray-800 focus:bg-white focus:border-theme-primary outline-none transition-all" placeholder="Como quer ser chamada?" />
                </section>
                <section className="space-y-6">
                  <div className="flex justify-between items-center bg-theme-light p-6 rounded-3xl border border-theme-soft">
                    <span className="text-sm font-black text-theme-primary uppercase tracking-wider">Ciclo Médio</span>
                    <input type="number" value={settings.avgCycleLength} onChange={e => setSettings(p => ({...p, avgCycleLength: parseInt(e.target.value) || 28}))} className="w-16 bg-transparent text-right font-black text-theme-primary text-xl outline-none" />
                  </div>
                </section>
                <div className="pt-8">
                  <Button className="w-full h-20 rounded-[2.5rem] font-black text-lg" onClick={() => setActiveScreen('inicio')}>Salvar Alterações ✨</Button>
                </div>
                <p className="text-[10px] text-center font-bold text-gray-300 uppercase tracking-[0.3em] pt-10">Luna • Privacidade Absoluta</p>
             </div>
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <div className="min-h-screen transition-all duration-500" style={{ backgroundColor: 'var(--bg-app)' }}>
      <header className="px-8 py-12 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-5 cursor-pointer" onClick={() => setActiveScreen('inicio')}>
          <Logo className="w-16 h-16 shadow-2xl bg-white rounded-full" />
          <LunaBrandText />
        </div>
        <div className="w-10 h-10 flex items-center justify-center bg-theme-light rounded-full border border-theme-soft text-theme-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6">
        {renderScreen()}
      </main>

      {isQuickViewOpen && selectedDate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-black/40 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white rounded-[3.5rem] w-full max-w-sm p-12 shadow-2xl relative border-t-[12px] border-theme-primary">
              <button onClick={() => setIsQuickViewOpen(false)} className="absolute top-8 right-8 text-gray-300 hover:text-theme-primary">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="mb-10 text-center">
                <p className="text-[10px] font-black text-theme-primary uppercase tracking-[0.2em] mb-4">
                  {format(parseISO(selectedDate), "EEEE, dd/MM", { locale: ptBR })}
                </p>
                <h4 className="text-4xl font-serif font-black text-gray-800 leading-tight">
                  {getDayStatus(parseISO(selectedDate)).isMenstruation ? "Seu Ciclo 🩸" : "Dia de Luna ✨"}
                </h4>
              </div>
              <div className="flex flex-col gap-4">
                <Button className="w-full h-20 rounded-[2.5rem] text-base font-black uppercase tracking-widest" onClick={() => { setIsModalOpen(true); setIsQuickViewOpen(false); }}>
                  Anotar Sintomas
                </Button>
                <button onClick={() => setIsQuickViewOpen(false)} className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fechar</button>
              </div>
           </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pointer-events-none">
        <div className="glass-nav rounded-[3rem] shadow-2xl p-3 flex justify-between items-center max-w-md mx-auto pointer-events-auto border border-theme-soft/30">
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
  <button onClick={onClick} className={`flex flex-col items-center gap-1 px-5 py-4 rounded-[2.5rem] transition-all duration-300 ${active ? 'bg-theme-primary text-white scale-105 shadow-xl' : 'text-gray-300 hover:text-theme-primary hover:bg-theme-light'}`}>
    <span className="text-2xl">{icon}</span>
    <span className={`text-[7px] font-black uppercase tracking-widest ${active ? 'block' : 'hidden'}`}>{label}</span>
  </button>
);

export default App;