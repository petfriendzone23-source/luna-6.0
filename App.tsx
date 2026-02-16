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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState<UserSettings>({
    userName: '',
    avgCycleLength: 28,
    avgPeriodLength: 5,
    lastPeriodStartManual: undefined,
    theme: 'rose'
  });

  const appName = settings.userName || 'Luna';

  // Carregar dados iniciais
  useEffect(() => {
    const savedLogs = localStorage.getItem('luna_logs_v5');
    if (savedLogs) try { setLogs(JSON.parse(savedLogs)); } catch (e) {}
    const savedSettings = localStorage.getItem('luna_settings_v5');
    if (savedSettings) try { setSettings(JSON.parse(savedSettings)); } catch (e) {}
  }, []);

  // Persistência Automática
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
    
    // Atualiza o título da página com o nome do usuário
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
    
    let dayOfCycle = null;
    if (stats.lastPeriodStart) {
        const diff = differenceInDays(day, parseISO(stats.lastPeriodStart)) + 1;
        dayOfCycle = diff > 0 ? ((diff - 1) % stats.avgCycleLength) + 1 : null;
    }
    const phase = dayOfCycle ? getCyclePhase(dayOfCycle, stats) : null;

    return { isMenstruation, isPredicted, isOvulation, isFertile, log, dKey, phase, dayOfCycle };
  };

  // Funções de Backup
  const exportBackup = () => {
    const data = { logs, settings, version: '5.0', exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appName.toLowerCase()}-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.logs) setLogs(data.logs);
        if (data.settings) setSettings(data.settings);
        alert('Dados importados com sucesso! ✨');
      } catch (err) {
        alert(`Erro ao importar arquivo. Certifique-se de que é um backup ${appName} válido.`);
      }
    };
    reader.readAsText(file);
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'inicio':
        return (
          <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="bg-white rounded-[3rem] p-10 text-center shadow-2xl border border-theme-soft relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-theme-primary to-indigo-400"></div>
               <h2 className="text-[10px] font-black uppercase tracking-widest text-theme-primary opacity-70 mb-4">
                 Olá, {appName}! ✨
               </h2>
               <div className="text-5xl font-serif font-black text-gray-800 leading-tight">
                 {nextPeriodIn !== null ? (
                   nextPeriodIn > 0 ? <><span className="text-theme-primary">{nextPeriodIn}</span> dias</> : 
                   nextPeriodIn === 0 ? <span className="text-theme-primary">Menstruação hoje! 🩸</span> : <span className="text-orange-600">Atrasada</span>
                 ) : "Bem-vinda!"}
               </div>
               <p className="mt-4 text-gray-600 font-extrabold text-sm">
                 {nextPeriodIn !== null ? `Próximo ciclo: ${format(parseISO(stats.nextPeriodDate!), "dd/MM", { locale: ptBR })}` : "Configure seu ciclo no perfil."}
               </p>
            </section>

            {currentPhase && (
              <section className={`rounded-[2.5rem] p-8 text-white shadow-2xl ${CYCLE_PHASES[currentPhase].color} transition-all border-b-8 border-black/10`}>
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-2xl font-serif font-black">{CYCLE_PHASES[currentPhase].name}</h3>
                   <span className="text-3xl">
                     {currentPhase === 'menstrual' ? '🩸' : currentPhase === 'folicular' ? '🌱' : currentPhase === 'ovulatoria' ? '🌸' : '🌙'}
                   </span>
                </div>
                <p className="text-white text-sm leading-relaxed mb-6 font-bold">{CYCLE_PHASES[currentPhase].description}</p>
                <div className="bg-black/15 backdrop-blur-md p-5 rounded-3xl border border-white/30">
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/80 mb-1 font-bold">Dica para você</p>
                   <p className="font-black text-white">{CYCLE_PHASES[currentPhase].advice}</p>
                </div>
              </section>
            )}

            <Button size="lg" className="w-full rounded-[2.5rem] h-20 text-xl uppercase tracking-widest shadow-2xl" onClick={() => setActiveScreen('calendario')}>
                Ver Calendário
            </Button>
          </div>
        );

      case 'calendario':
        return (
          <div className="space-y-6 pb-32 animate-in fade-in duration-500">
            <section className="bg-white rounded-[2.5rem] p-6 shadow-2xl border border-theme-soft">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-serif font-black text-gray-800 capitalize px-2">
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="w-12 h-12 flex items-center justify-center bg-theme-primary text-white rounded-2xl shadow-lg active:scale-90 transition-all">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="w-12 h-12 flex items-center justify-center bg-theme-primary text-white rounded-2xl shadow-lg active:scale-90 transition-all">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                  <div key={d} className="text-center py-2 text-[10px] font-black text-theme-primary uppercase">{d}</div>
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
                        ${!active ? 'opacity-20' : 'opacity-100'}
                        ${status.isMenstruation ? 'bg-theme-primary border-theme-primary text-white shadow-xl scale-105 z-10' : 
                          status.isOvulation ? 'bg-teal-500 border-teal-400 text-white shadow-xl scale-105 z-10' :
                          status.isFertile ? 'bg-teal-50 border-teal-200 text-teal-700' :
                          status.isPredicted ? 'bg-rose-50 border-rose-200 border-dashed text-rose-400' :
                          'bg-gray-100 border-transparent text-gray-800 hover:bg-white hover:border-theme-soft'}
                        ${isCur ? 'ring-4 ring-theme-primary/30 ring-offset-2 animate-today' : ''}
                      `}
                    >
                      <span className="text-xs sm:text-sm font-black mb-1">{format(day, 'd')}</span>
                      <div className="flex items-center justify-center h-4">
                        {status.isMenstruation && <span className="text-base">🩸</span>}
                        {status.isOvulation && <span className="text-base">🌸</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        );

      case 'historico':
        const historyLogs = (Object.values(logs) as DayLog[]).sort((a: DayLog, b: DayLog) => b.date.localeCompare(a.date));
        return (
          <div className="space-y-6 pb-32 animate-in slide-in-from-right-4 duration-500">
             <h3 className="text-3xl font-serif font-black text-theme-primary px-2">Histórico de {appName}</h3>
             {historyLogs.length === 0 ? (
               <div className="p-16 text-center text-gray-400 font-bold bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
                 Sem registros salvos.<br/>Toque no calendário para começar.
               </div>
             ) : (
               historyLogs.map(log => (
                 <div key={log.date} onClick={() => handleDayClick(log.date)} className="bg-white p-6 rounded-[2rem] shadow-xl border border-theme-soft flex items-center justify-between group cursor-pointer hover:shadow-2xl transition-all">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-theme-primary uppercase">{format(parseISO(log.date), "dd 'de' MMMM", { locale: ptBR })}</p>
                      <h4 className="text-xl font-black text-gray-800">{log.isPeriod ? "Menstruação Ativa 🩸" : "Registros do Dia ✨"}</h4>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {log.moods.map(m => <span key={m} className="px-3 py-1 bg-amber-400 text-white text-[9px] font-black rounded-full uppercase shadow-sm">{m}</span>)}
                        {log.symptoms.length > 0 && <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[9px] font-black rounded-full uppercase">{log.symptoms.length} sintomas</span>}
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" className="ml-4 font-black">EDITAR</Button>
                 </div>
               ))
             )}
          </div>
        );

      case 'ajustes':
        return (
          <div className="space-y-8 pb-32 animate-in fade-in duration-500">
             <h3 className="text-3xl font-serif font-black text-theme-primary px-2">Configurações</h3>
             
             <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-theme-soft space-y-10">
                {/* Nome do Usuário */}
                <section className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-theme-primary tracking-widest block font-black">Como quer ser chamada?</label>
                  <input 
                    type="text" 
                    placeholder="Seu nome aqui..."
                    value={settings.userName || ''} 
                    onChange={e => setSettings(p => ({...p, userName: e.target.value}))} 
                    className="w-full h-16 px-6 rounded-2xl bg-gray-50 border-2 border-gray-100 font-black text-gray-800 focus:border-theme-primary outline-none transition-all" 
                  />
                </section>

                {/* Segurança e Dados */}
                <section className="bg-theme-light p-6 rounded-[2rem] border-2 border-theme-soft">
                  <h4 className="text-[10px] font-black uppercase text-theme-primary tracking-widest mb-4">Segurança e Backup</h4>
                  <p className="text-xs font-bold text-gray-600 mb-6">Seus dados são salvos apenas neste celular. Para não perdê-los ao trocar de aparelho, faça um backup.</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="primary" size="sm" className="w-full text-[10px]" onClick={exportBackup}>
                      EXPORTAR BACKUP
                    </Button>
                    <Button variant="outline" size="sm" className="w-full text-[10px]" onClick={() => fileInputRef.current?.click()}>
                      IMPORTAR BACKUP
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={importBackup} />
                  </div>
                </section>

                <section>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-6">Cor do Aplicativo</label>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {(Object.keys(THEMES) as AppTheme[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setSettings(p => ({ ...p, theme: t }))}
                                className={`flex-shrink-0 w-14 h-14 rounded-2xl border-4 transition-all ${settings.theme === t ? 'scale-110 border-gray-800 shadow-2xl' : 'border-transparent opacity-50'}`}
                                style={{ backgroundColor: THEMES[t].primary }}
                            />
                        ))}
                    </div>
                </section>

                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-theme-primary tracking-widest block font-black">Ciclo Médio (Dias)</label>
                      <input type="number" value={settings.avgCycleLength} onChange={e => setSettings(p => ({...p, avgCycleLength: parseInt(e.target.value) || 28}))} className="w-full h-16 px-6 rounded-2xl bg-gray-50 border-2 border-gray-100 font-black text-gray-800 focus:border-theme-primary outline-none transition-all" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-theme-primary tracking-widest block font-black">Data da última Menstruação</label>
                      <input type="date" value={settings.lastPeriodStartManual || ''} onChange={e => setSettings(p => ({...p, lastPeriodStartManual: e.target.value}))} className="w-full h-16 px-6 rounded-2xl bg-gray-50 border-2 border-gray-100 font-black text-gray-800 focus:border-theme-primary outline-none transition-all" />
                   </div>
                </div>

                <div className="pt-4">
                  <Button className="w-full h-20 rounded-[2rem] font-black text-lg shadow-2xl" onClick={() => alert('Configurações salvas localmente! ✨')}>
                    SALVAR TUDO
                  </Button>
                </div>

                <p className="text-[9px] text-center font-bold text-gray-300 uppercase tracking-widest">{appName} v5.0 • Dados 100% Privados</p>
             </div>
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <div className="min-h-screen transition-all duration-500 overflow-x-hidden" style={{ backgroundColor: 'var(--bg-app)' }}>
      <header className="px-8 py-12 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveScreen('inicio')}>
          <div className="w-12 h-12 bg-theme-primary rounded-2xl flex items-center justify-center text-white shadow-2xl rotate-6 border-b-4 border-black/20">
             <span className="text-2xl font-serif font-black">{(appName[0] || 'L').toUpperCase()}</span>
          </div>
          <h1 className="text-3xl font-serif font-black text-gray-800 tracking-tight">{appName}</h1>
        </div>
        <div className="text-[9px] font-black text-theme-primary/50 uppercase tracking-[0.2em]">Salvamento Ativo</div>
      </header>

      <main className="max-w-2xl mx-auto px-6">
        {renderScreen()}
      </main>

      {isQuickViewOpen && selectedDate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-black/60 backdrop-blur-lg animate-in fade-in">
           <div className="bg-white rounded-[3rem] w-full max-w-sm p-12 shadow-2xl relative animate-in zoom-in-95 border-t-8 border-theme-primary">
              <button onClick={() => setIsQuickViewOpen(false)} className="absolute top-8 right-8 text-gray-300 hover:text-theme-primary transition-colors">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="mb-12">
                <p className="text-[11px] font-black text-theme-primary uppercase tracking-widest mb-3">
                  {format(parseISO(selectedDate), "EEEE, dd/MM", { locale: ptBR })}
                </p>
                <h4 className="text-4xl font-serif font-black text-gray-800 leading-tight">
                  {getDayStatus(parseISO(selectedDate)).isMenstruation ? "Sua Menstruação 🩸" : `Dia de ${appName} ✨`}
                </h4>
              </div>

              <div className="flex flex-col gap-4">
                <Button className="w-full h-20 rounded-[2rem] text-lg font-black uppercase shadow-xl" onClick={() => { setIsModalOpen(true); setIsQuickViewOpen(false); }}>
                  Anotar Sintomas
                </Button>
                <button onClick={() => setIsQuickViewOpen(false)} className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-theme-primary">Voltar</button>
              </div>
           </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pointer-events-none">
        <div className="glass-nav rounded-[3rem] shadow-[0_-15px_40px_rgba(0,0,0,0.08)] p-2.5 flex justify-between items-center max-w-md mx-auto pointer-events-auto border-4 border-white/50">
          <NavItem active={activeScreen === 'inicio'} onClick={() => setActiveScreen('inicio'} label="Home" icon="🏠" />
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
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 px-6 py-4 rounded-[2.5rem] transition-all duration-300 ${active ? 'bg-theme-primary text-white scale-110 shadow-2xl shadow-theme-primary/30' : 'text-gray-400 hover:text-theme-primary hover:bg-theme-light'}`}>
    <span className="text-2xl">{icon}</span>
    <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${active ? 'block' : 'hidden'}`}>{label}</span>
  </button>
);

export default App;