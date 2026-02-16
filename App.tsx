
import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  parseISO,
  differenceInDays,
  startOfToday,
  subMonths,
  addMonths,
  isSameMonth,
  isToday,
  isValid
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayModal } from './components/DayModal';
import { Button } from './components/Button';
import { DayLog, CycleStats, UserSettings, SYMPTOMS, MOODS, CYCLE_PHASES, CyclePhaseType, AppTheme } from './types';
import { getCalendarDays, formatDate, calculateCycleStats, getCyclePhase } from './utils/dateUtils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

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

  const handleSaveSettings = () => {
    localStorage.setItem('luna_settings_v3', JSON.stringify(settings));
    alert('Configurações atualizadas!');
  };

  const clearData = () => {
    if (confirm('Tem certeza que deseja apagar todos os seus dados? Esta ação é irreversível.')) {
      setLogs({});
      setSettings({ avgCycleLength: 28, avgPeriodLength: 5, theme: 'rose' });
      localStorage.removeItem('luna_logs_v3');
      localStorage.removeItem('luna_settings_v3');
      alert('Dados apagados com sucesso.');
    }
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

  const selectedDayDetails = useMemo(() => {
    if (!selectedDate) return null;
    const status = getDayStatus(parseISO(selectedDate));
    let title = "Dia Comum";
    let desc = "Nenhum evento previsto para hoje.";
    let pregnancyChance = "Nula";

    if (status.isMenstruation) {
      title = "Menstruação";
      desc = `Fluxo ${status.log?.intensity || 'moderado'}. Mantenha-se hidratada!`;
      pregnancyChance = "Muito Baixa";
    } else if (status.isPredictedMenstruation) {
      title = "Previsão de Menstruação";
      desc = "Seu ciclo deve começar em breve. Prepare-se!";
      pregnancyChance = "Muito Baixa";
    } else if (status.isOvulation) {
      title = "Dia da Ovulação";
      desc = "Pico de fertilidade. Chance máxima de gravidez.";
      pregnancyChance = "Máxima";
    } else if (status.isFertile) {
      title = "Janela Fértil";
      desc = "Probabilidade de gravidez aumentada nestes dias.";
      pregnancyChance = "Alta";
    } else {
        pregnancyChance = "Baixa";
    }

    return { title, desc, pregnancyChance, ...status };
  }, [selectedDate, stats, logs]);

  const handleDayClick = (dKey: string) => {
    setSelectedDate(dKey);
    setIsQuickViewOpen(true);
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'inicio':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <section className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-gray-100 border border-theme-soft relative overflow-hidden">
               <div className="relative z-10 text-center py-4">
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] text-theme-primary opacity-60 mb-4">Status do Ciclo</h2>
                  <div className="text-5xl md:text-6xl font-serif font-bold text-gray-800 leading-tight">
                    {nextPeriodIn !== null ? (
                      nextPeriodIn > 0 ? (
                        <>Faltam <span className="text-theme-primary">{nextPeriodIn}</span> dias</>
                      ) : nextPeriodIn === 0 ? (
                        <span className="text-theme-primary">Menstruação hoje!</span>
                      ) : (
                        <><span className="text-theme-primary">{Math.abs(nextPeriodIn)}</span> dias de atraso</>
                      )
                    ) : (
                      "Bem-vinda"
                    )}
                  </div>
                  <p className="mt-4 text-gray-400 font-medium">
                    {nextPeriodIn !== null ? `Dia ${stats.currentDayOfCycle} do ciclo` : "Comece configurando seu ciclo."}
                  </p>
               </div>
               {stats.currentDayOfCycle && (
                 <div className="mt-8 h-2 bg-theme-light rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-theme-primary transition-all duration-1000" 
                        style={{ width: `${(stats.currentDayOfCycle / stats.avgCycleLength) * 100}%` }}
                    />
                 </div>
               )}
            </section>

            {currentPhase && (
              <section className={`rounded-[2.5rem] p-8 text-white shadow-xl ${CYCLE_PHASES[currentPhase].color} transition-all duration-500`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold">{CYCLE_PHASES[currentPhase].name}</h3>
                    <p className="text-white/80 text-sm font-medium mt-1">{CYCLE_PHASES[currentPhase].hormones}</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-6">{CYCLE_PHASES[currentPhase].description}</p>
                <div className="bg-black/5 p-4 rounded-2xl border border-white/10">
                   <p className="text-[10px] font-black uppercase tracking-wider text-white/60 mb-1">Dica de Bem-estar</p>
                   <p className="text-sm font-bold">{CYCLE_PHASES[currentPhase].advice}</p>
                </div>
              </section>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-[2rem] border border-theme-soft shadow-sm">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Duração Média</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.avgCycleLength} <span className="text-sm font-medium text-gray-400">dias</span></p>
               </div>
               <div className="bg-white p-6 rounded-[2rem] border border-theme-soft shadow-sm">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Chance de Gravidez</p>
                  <p className={`text-lg font-bold ${stats.fertileWindow.includes(formatDate(new Date())) ? 'text-teal-500' : 'text-gray-400'}`}>
                    {stats.fertileWindow.includes(formatDate(new Date())) ? "Alta" : "Baixa"}
                  </p>
               </div>
            </div>

            <Button 
                size="lg" 
                className="w-full h-16 rounded-[2rem] shadow-xl shadow-theme-light"
                onClick={() => setActiveScreen('calendario')}
            >
                Abrir Calendário Detalhado
            </Button>
          </div>
        );

      case 'calendario':
        return (
          <div className="space-y-6 animate-in fade-in duration-500 pb-28">
            <section className="bg-white rounded-[3.5rem] p-6 md:p-10 shadow-2xl shadow-theme-light border border-theme-soft">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-serif font-bold text-gray-800 capitalize">
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <div className="flex gap-3">
                  <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-3 bg-theme-light text-theme-primary rounded-2xl hover:bg-theme-soft transition-all shadow-sm">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-3 bg-theme-light text-theme-primary rounded-2xl hover:bg-theme-soft transition-all shadow-sm">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-8">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                  <div key={d} className="text-center py-2 text-[10px] font-black text-theme-primary opacity-30 uppercase tracking-[0.2em]">{d}</div>
                ))}
                {calendarDays.map(day => {
                  const { isMenstruation, isPredictedMenstruation, isOvulation, isFertile, log, dKey } = getDayStatus(day);
                  const active = isSameMonth(day, currentDate);
                  const isSel = selectedDate === dKey;
                  const isCurrent = isToday(day);

                  return (
                    <button
                      key={dKey}
                      onClick={() => handleDayClick(dKey)}
                      className={`
                        relative flex flex-col items-center justify-center h-14 sm:h-20 rounded-[1.25rem] transition-all duration-300 border-2 group
                        ${!active ? 'opacity-10 scale-90 grayscale' : 'opacity-100'}
                        ${isSel ? 'ring-4 ring-theme-primary ring-offset-2 z-10 scale-105' : ''}
                        ${isMenstruation ? 'bg-gradient-to-br from-rose-500 to-rose-600 border-rose-400 text-white shadow-lg shadow-rose-200' : 
                          isOvulation ? 'bg-gradient-to-br from-teal-400 to-teal-500 border-teal-300 text-white shadow-lg shadow-teal-100' :
                          isFertile ? 'bg-teal-50 border-teal-100 text-teal-600' :
                          isPredictedMenstruation ? 'bg-theme-light border-theme-primary border-dashed text-theme-primary' :
                          'bg-transparent border-gray-50 text-gray-700 hover:border-theme-soft hover:bg-theme-light/30'}
                        ${isCurrent && !isMenstruation && !isOvulation ? 'ring-2 ring-theme-soft border-theme-primary ring-offset-1' : ''}
                      `}
                    >
                      {isCurrent && !isMenstruation && !isOvulation && (
                        <div className="absolute inset-0 rounded-[1.25rem] ring-2 ring-theme-primary/30 animate-pulse" />
                      )}
                      
                      <span className={`text-xs sm:text-sm font-black mb-1 ${isCurrent ? 'underline decoration-2 underline-offset-4' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      
                      <div className="flex flex-col items-center gap-0.5">
                        {isMenstruation && (
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        )}
                        {isOvulation && (
                          <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                          </svg>
                        )}
                        {!isMenstruation && !isOvulation && isFertile && (
                          <div className="flex gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-sm" />
                          </div>
                        )}
                      </div>

                      {log && (log.symptoms.length > 0 || log.moods.length > 0 || log.medicalNotes) && (
                         <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${isMenstruation ? 'bg-white' : (log.medicalNotes ? 'bg-indigo-500' : 'bg-amber-400')}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <LegendCard 
                    icon={<svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>} 
                    color="bg-rose-500" 
                    label="Menstruação" 
                    desc="Fluxo atual"
                 />
                 <LegendCard 
                    icon={<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>} 
                    color="bg-teal-400" 
                    label="Ovulação" 
                    desc="Alta fertilidade"
                 />
              </div>
            </section>
          </div>
        );

      case 'historico':
        const historyLogs = (Object.values(logs) as DayLog[]).sort((a, b) => b.date.localeCompare(a.date));
        return (
          <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            <h3 className="text-3xl font-serif font-bold text-gray-800 px-2 text-theme-primary">Seu Histórico</h3>
            <div className="space-y-4">
                {historyLogs.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-dashed border-gray-200">
                    Nenhuma nota encontrada. Comece a registrar seus sintomas no calendário.
                </div>
                ) : (
                historyLogs.map(log => (
                    <div 
                        key={log.date} 
                        onClick={() => handleDayClick(log.date)} 
                        className="bg-white p-6 rounded-[2rem] shadow-sm border border-theme-soft flex justify-between items-center cursor-pointer hover:shadow-lg hover:border-theme-primary transition-all group"
                    >
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-theme-primary opacity-50 uppercase tracking-[0.1em]">{format(parseISO(log.date), "dd 'de' MMM", { locale: ptBR })}</p>
                        <h4 className="text-lg font-bold text-gray-800 group-hover:text-theme-primary transition-colors">
                            {log.isPeriod ? "Período Menstrual" : "Registro Diário"}
                        </h4>
                        <div className="flex gap-2 mt-2 overflow-hidden">
                            {log.moods.length > 0 && <span className="text-[10px] font-bold text-amber-500 uppercase whitespace-nowrap">{log.moods[0]}</span>}
                            {log.symptoms.length > 0 && <span className="text-[10px] font-bold text-indigo-400 uppercase whitespace-nowrap">• {log.symptoms.length} sintomas</span>}
                        </div>
                    </div>
                    <div className="bg-theme-light p-3 rounded-2xl text-theme-primary group-hover:bg-theme-primary group-hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                    </div>
                ))
                )}
            </div>
          </section>
        );

      case 'insights':
        const symptomCounts: Record<string, number> = {};
        (Object.values(logs) as DayLog[]).forEach(log => {
            log.symptoms.forEach(s => symptomCounts[s] = (symptomCounts[s] || 0) + 1);
        });
        const chartData = Object.entries(symptomCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);

        return (
          <section className="space-y-8 animate-in fade-in duration-500 pb-20">
            <h3 className="text-3xl font-serif font-bold text-gray-800 px-2 text-theme-primary">Análise & Insights</h3>
            
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-theme-soft">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8">Sintomas Recorrentes</h4>
              {chartData.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                        <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--primary)' : 'var(--primary-soft)'} />
                            ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
              ) : (
                <div className="py-12 text-center text-gray-300 italic text-sm">Registre mais sintomas para ver estatísticas.</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-theme-soft shadow-sm text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Ciclo Médio</p>
                    <p className="text-4xl font-serif font-bold text-theme-primary">{stats.avgCycleLength}</p>
                    <p className="text-xs text-gray-400 mt-1">Dias de intervalo</p>
                 </div>
                 <div className="bg-white p-8 rounded-[2.5rem] border border-theme-soft shadow-sm text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Duração Fluxo</p>
                    <p className="text-4xl font-serif font-bold text-indigo-400">{stats.avgPeriodLength}</p>
                    <p className="text-xs text-gray-400 mt-1">Dias de média</p>
                 </div>
            </div>
          </section>
        );

      case 'ajustes':
        return (
          <section className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 pb-20">
            <h3 className="text-3xl font-serif font-bold text-gray-800 px-2 text-theme-primary">Configurações</h3>
            
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-theme-soft space-y-6">
                <h4 className="text-xs font-black text-theme-primary uppercase tracking-widest">Personalização de Cores</h4>
                <div className="flex justify-between items-center gap-2 overflow-x-auto pb-2">
                    {(Object.keys(THEMES) as AppTheme[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setSettings(prev => ({ ...prev, theme: t }))}
                            className={`flex-shrink-0 w-12 h-12 rounded-full border-4 transition-all ${settings.theme === t ? 'scale-110 border-gray-200' : 'border-transparent'}`}
                            style={{ backgroundColor: THEMES[t].primary }}
                            title={t}
                        />
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-theme-soft space-y-8">
               <div className="space-y-6">
                 <div>
                    <label className="block text-xs font-black text-theme-primary opacity-60 uppercase tracking-widest mb-2">Duração Média do Ciclo</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={settings.avgCycleLength} 
                        onChange={(e) => setSettings(prev => ({ ...prev, avgCycleLength: parseInt(e.target.value) || 28 }))}
                        className="w-full h-14 px-6 rounded-2xl bg-theme-light border-2 border-transparent focus:border-theme-primary outline-none font-bold text-gray-700"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-theme-primary opacity-60 text-xs font-bold uppercase">dias</span>
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-black text-theme-primary opacity-60 uppercase tracking-widest mb-2">Duração da Menstruação</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={settings.avgPeriodLength} 
                        onChange={(e) => setSettings(prev => ({ ...prev, avgPeriodLength: parseInt(e.target.value) || 5 }))}
                        className="w-full h-14 px-6 rounded-2xl bg-theme-light border-2 border-transparent focus:border-theme-primary outline-none font-bold text-gray-700"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-theme-primary opacity-60 text-xs font-bold uppercase">dias</span>
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-black text-theme-primary opacity-60 uppercase tracking-widest mb-2">Último Início (Manual)</label>
                    <input 
                      type="date" 
                      value={settings.lastPeriodStartManual || ''} 
                      onChange={(e) => setSettings(prev => ({ ...prev, lastPeriodStartManual: e.target.value }))}
                      className="w-full h-14 px-6 rounded-2xl bg-theme-light border-2 border-transparent focus:border-theme-primary outline-none font-bold text-gray-700"
                    />
                 </div>
               </div>

               <div className="pt-6 border-t border-theme-soft space-y-3">
                  <Button onClick={handleSaveSettings} className="w-full h-14 rounded-2xl font-bold">
                    Salvar Alterações
                  </Button>
                  <button onClick={clearData} className="w-full h-14 text-red-400 font-bold border-2 border-red-50 rounded-2xl hover:bg-red-50 transition-colors uppercase text-[10px] tracking-widest">
                    Apagar Meus Dados
                  </button>
               </div>
            </div>

            <div className="bg-theme-primary opacity-90 rounded-[2.5rem] p-8 text-white shadow-lg">
                <h4 className="font-serif text-xl font-bold mb-2">Privacidade</h4>
                <p className="text-white/80 text-xs leading-relaxed">Luna é um aplicativo offline. Seus dados nunca saem do seu dispositivo.</p>
            </div>
          </section>
        );
    }
  };

  return (
    <div className="min-h-screen selection:bg-theme-light transition-colors duration-500" style={{ backgroundColor: 'var(--bg-app)' }}>
      <header className="px-6 py-6 flex items-center justify-between max-w-2xl mx-auto sticky top-0 backdrop-blur-md z-30" style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
        <div className="flex items-center gap-2" onClick={() => setActiveScreen('inicio')}>
          <div className="w-9 h-9 bg-theme-primary rounded-xl flex items-center justify-center text-white shadow-lg">
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </div>
          <h1 className="text-xl font-serif font-bold text-gray-800 cursor-pointer">Luna</h1>
        </div>
        <div className="flex gap-2">
            <div className="bg-white px-3 py-1.5 rounded-full border border-theme-soft shadow-sm text-[8px] font-black uppercase text-theme-primary">
                {stats.lastPeriodStart ? `Média ${stats.avgCycleLength}d` : 'Perfil Luna'}
            </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4">
        {renderScreen()}
      </main>

      {isQuickViewOpen && selectedDayDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/10 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl border border-theme-soft relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setIsQuickViewOpen(false)} 
                className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="mb-6">
                <p className="text-[10px] font-black text-theme-primary opacity-60 uppercase tracking-widest mb-1">
                  {format(parseISO(selectedDate!), "dd 'de' MMMM", { locale: ptBR })}
                </p>
                <h4 className={`text-2xl font-serif font-bold ${selectedDayDetails.isMenstruation ? 'text-theme-primary' : 'text-gray-800'}`}>
                  {selectedDayDetails.title}
                </h4>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-50 p-3 rounded-2xl text-center">
                    <p className="text-[8px] font-black text-gray-400 uppercase">Gravidez</p>
                    <p className="text-xs font-bold text-gray-700">{selectedDayDetails.pregnancyChance}</p>
                  </div>
                  <div className="flex-1 bg-gray-50 p-3 rounded-2xl text-center">
                    <p className="text-[8px] font-black text-gray-400 uppercase">Fase</p>
                    <p className="text-xs font-bold text-gray-700 capitalize">{selectedDayDetails.phase || '--'}</p>
                  </div>
                </div>

                {selectedDayDetails.log ? (
                  <div className="bg-theme-light p-4 rounded-2xl border border-theme-soft">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {selectedDayDetails.log.moods.slice(0, 4).map(m => <span key={m} className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-xl shadow-sm">{m}</span>)}
                      {selectedDayDetails.log.symptoms.slice(0, 4).map(s => <span key={s} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-xl shadow-sm">{s}</span>)}
                    </div>
                    {selectedDayDetails.log.notes && (
                      <p className="text-[10px] text-gray-500 italic line-clamp-2 mt-2">"{selectedDayDetails.log.notes}"</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic text-center py-4">Nenhum registro para este dia.</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button className="w-full h-12 rounded-2xl" onClick={() => { setIsModalOpen(true); setIsQuickViewOpen(false); }}>
                  {selectedDayDetails.log ? "Editar Registro" : "Registrar Agora"}
                </Button>
                <button 
                  onClick={() => setIsQuickViewOpen(false)}
                  className="w-full py-3 text-xs font-bold text-gray-400 uppercase tracking-widest"
                >
                  Voltar
                </button>
              </div>
           </div>
        </div>
      )}

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-2xl p-2 flex justify-between items-center">
          <NavItem active={activeScreen === 'inicio'} onClick={() => setActiveScreen('inicio')} label="Início" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />} />
          <NavItem active={activeScreen === 'calendario'} onClick={() => setActiveScreen('calendario')} label="Agenda" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />} />
          <NavItem active={activeScreen === 'historico'} onClick={() => setActiveScreen('historico')} label="Diário" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />} />
          <NavItem active={activeScreen === 'insights'} onClick={() => setActiveScreen('insights')} label="Insights" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />} />
          <NavItem active={activeScreen === 'ajustes'} onClick={() => setActiveScreen('ajustes')} label="Perfil" icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />} />
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

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-3xl transition-all duration-500 ${active ? 'bg-theme-primary text-white shadow-xl' : 'text-theme-primary opacity-30 hover:opacity-60'}`}>
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
    <span className={`text-[9px] font-black uppercase tracking-tight ${active ? 'block' : 'hidden'}`}>{label}</span>
  </button>
);

const LegendCard: React.FC<{ color: string; icon: React.ReactNode; label: string; desc: string }> = ({ color, icon, label, desc }) => (
  <div className="p-4 rounded-[2rem] bg-white border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2">
     <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center shadow-md`}>
        {icon}
     </div>
     <div>
        <p className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">{label}</p>
        <p className="text-[8px] font-medium text-gray-400">{desc}</p>
     </div>
  </div>
);

export default App;
