import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Wallet, Calendar, Bell, 
  ArrowUpRight, Sparkles, ChevronRight,
  ArrowRightCircle, Plus, Loader2, Settings
} from 'lucide-react';

export default function DashboardTab({ myClub, members = [], dynamicRadius, setActiveTab, supabase }) {
  const [soldeAnim, setSoldeAnim] = useState(0);
  const [showChart, setShowChart] = useState(false);
  
  // Rétablissement complet de vos états d'origine pour les événements
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [quickEvent, setQuickEvent] = useState({ 
    title: '', 
    category: 'Match',
    team_tag: '',
    start_date: '', 
    start_time: '14:00',
    location: '',
    description: ''
  });
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [events, setEvents] = useState([]);

  const stats = useMemo(() => {
    const total = members.length;
    const adultes = members.filter(m => ['adulte', 'adultes'].includes(m.category?.toLowerCase())).length;
    const jeunes = members.filter(m => ['jeune', 'jeunes'].includes(m.category?.toLowerCase())).length;
    const retraites = members.filter(m => ['retraite', 'retraité', 'retraités'].includes(m.category?.toLowerCase())).length;
    const enAttente = members.filter(m => m.license_status?.toLowerCase() === 'en_attente');
    return { total, adultes, jeunes, retraites, enAttente, count: enAttente.length };
  }, [members]);

  useEffect(() => {
    if (!myClub?.id) return;
    let timer;

    const calculateRealBalance = async () => {
      // Calcul Cotisations (basé sur les membres chargés)
      const counts = members.reduce((acc, m) => {
        const cat = (m.category || '').toLowerCase();
        if (cat.includes('retraite') || cat.includes('retraité')) acc.retraite++;
        else if (cat.includes('jeune')) acc.jeune++;
        else acc.adulte++;
        return acc;
      }, { adulte: 0, jeune: 0, retraite: 0 });

      const revCotis = (counts.adulte * (parseFloat(myClub.price_adulte) || 0)) + 
                       (counts.jeune * (parseFloat(myClub.price_jeune) || 0)) + 
                       (counts.retraite * (parseFloat(myClub.price_retraite) || 0));

      // Fetch Sponsors & Dépenses depuis Supabase
      const [sponsorsRes, expensesRes] = await Promise.all([
        supabase.from('sponsors').select('amount, periodicity').eq('club_id', myClub.id),
        supabase.from('expenses').select('amount, periodicity').eq('club_id', myClub.id)
      ]);

      const revSponsors = (sponsorsRes.data || []).reduce((acc, s) => acc + (s.periodicity === 'mensuel' ? s.amount * 12 : s.amount), 0);
      const totalExpenses = (expensesRes.data || []).reduce((acc, e) => acc + (e.periodicity === 'mensuel' ? e.amount * 12 : e.amount), 0);

      const target = revCotis + revSponsors - totalExpenses;

      // Animation du solde
      let start = 0;
      const steps = 50;
      const stepValue = target / steps;
      let currentStep = 0;

      timer = setInterval(() => {
        currentStep++;
        start += stepValue;
        if (currentStep >= steps) { 
          setSoldeAnim(target); 
          clearInterval(timer); 
        } else { 
          setSoldeAnim(Math.floor(start)); 
        }
      }, 20);
    };

    calculateRealBalance();
    setTimeout(() => setShowChart(true), 500);
    return () => { if(timer) clearInterval(timer); };
  }, [myClub, members]);

  const fetchEvents = async () => {
    if (!myClub?.id) return;
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('club_id', myClub.id)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(3);
    if (data) setEvents(data);
  };

  useEffect(() => { fetchEvents(); }, [myClub?.id]);

  // Rétablissement de votre fonction d'ajout complète
  const addQuickEvent = async (e) => {
    e.preventDefault();
    if (!quickEvent.title || !quickEvent.start_date || !quickEvent.start_time) return;
    
    setLoadingEvent(true);
    const startIso = `${quickEvent.start_date}T${quickEvent.start_time}:00`;
    const d = new Date(startIso);
    d.setHours(d.getHours() + 2);
    const pad = (n) => n < 10 ? '0'+n : n;
    const endIso = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

    const { error } = await supabase.from('events').insert([{
      title: quickEvent.title,
      start_date: startIso,
      end_date: endIso,
      club_id: myClub.id,
      category: quickEvent.category,
      team_tag: quickEvent.category === 'Match' ? quickEvent.team_tag : null,
      location: quickEvent.location,
      description: quickEvent.description
    }]);

    if (!error) {
      setQuickEvent({ title: '', category: 'Match', team_tag: '', start_date: '', start_time: '14:00', location: '', description: '' });
      setIsAddingEvent(false);
      fetchEvents();
    }
    setLoadingEvent(false);
  };

  const primary = myClub?.primary_color || '#6366f1';

  return (
    <div className="space-y-6 font-sans italic uppercase font-black text-slate-800 animate-fadeIn overflow-hidden">
      
      {/* BANNIÈRE AVEC CTA CONFIGURATION MIS EN AVANT */}
      <div className="relative p-8 bg-indigo-50/30 border border-indigo-100 shadow-sm overflow-hidden" 
           style={{ borderRadius: dynamicRadius }}>
        <div className="absolute -right-20 -top-20 w-48 h-48 bg-white/50 rounded-full animate-soft-float" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-indigo-400" />
              <span className="text-[9px] tracking-[0.4em] text-indigo-400/70 font-bold">Pilotage Stratégique</span>
            </div>
            <h2 className="text-3xl lg:text-4xl tracking-tighter text-slate-900 leading-none">
              Console <span style={{ color: primary }}>{myClub?.name || 'Club'}</span>
            </h2>
          </div>

          <div className="flex flex-col items-end gap-2">
            <p className="text-[8px] tracking-[0.2em] text-slate-400 normal-case font-bold">Configurez votre application mobile —&gt;</p>
            <button 
              onClick={() => setActiveTab('parametres')}
              className="group flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all duration-300 hover:scale-105"
            >
              <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-[10px] tracking-widest">Configuration</span>
              <ArrowRightCircle size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TRÉSORERIE */}
        <div className="bg-emerald-50/40 p-6 border border-emerald-100 flex flex-col justify-between group transition-all" 
             style={{ borderRadius: dynamicRadius }}>
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-2xl text-emerald-500 shadow-sm border border-emerald-100"><Wallet size={18} /></div>
              <div className="flex items-center gap-1 text-emerald-600 text-[9px] bg-emerald-100/50 px-2 py-0.5 rounded-lg"><ArrowUpRight size={12} /> +8.2%</div>
            </div>
            <p className="text-[9px] text-emerald-700/50 tracking-widest mb-1 font-bold italic">Solde Actif</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl tracking-tighter text-emerald-900 font-mono">{soldeAnim.toLocaleString()}</span>
              <span className="text-xl text-emerald-300 font-mono">€</span>
            </div>
          </div>
          <button onClick={() => setActiveTab('finance')} className="w-full py-3 bg-white border border-emerald-200 text-emerald-700 text-[8px] tracking-[0.3em] rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm font-black italic uppercase">
            Détails Finance <ChevronRight size={14} />
          </button>
        </div>

        {/* EFFECTIF */}
        <div className="bg-blue-50/40 p-6 border border-blue-100 flex flex-col justify-between group transition-all" 
             style={{ borderRadius: dynamicRadius }}>
          <div>
            <h3 className="text-[9px] text-blue-700/50 tracking-[0.3em] mb-4 font-bold italic uppercase">Analyse Membres</h3>
            <div className="flex items-center gap-6 mb-4">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="#fff" strokeWidth="8" fill="none" />
                  <circle cx="50" cy="50" r="42" stroke={primary} strokeWidth="8" fill="none"
                    strokeDasharray="264"
                    style={{ strokeDashoffset: showChart ? 264 - (264 * (stats.adultes / (stats.total || 1))) : 264, transition: 'stroke-dashoffset 2s ease-out', strokeLinecap: 'round' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xl text-blue-900 font-mono italic">{stats.total}</div>
              </div>
              <div className="space-y-1">
                <LegendItem color={primary} label="Ad." count={stats.adultes} />
                <LegendItem color="#93c5fd" label="Jeu." count={stats.jeunes} />
                <LegendItem color="#cbd5e1" label="Ret." count={stats.retraites} />
              </div>
            </div>
          </div>
          <button onClick={() => setActiveTab('membres')} className="w-full py-3 bg-white border border-blue-200 text-blue-700 text-[8px] tracking-[0.3em] rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm font-black italic uppercase">
            Voir Registre <ChevronRight size={14} />
          </button>
        </div>

        {/* ALERTES */}
        <div className="bg-violet-50/40 p-6 border border-violet-100 flex flex-col justify-between group transition-all" 
             style={{ borderRadius: dynamicRadius }}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[9px] text-violet-700/50 tracking-[0.3em] flex items-center gap-2 font-bold italic uppercase"><Bell size={14} className="text-violet-400" /> Notifications</h3>
              <span className="bg-violet-500 text-white text-[9px] px-2 py-0.5 rounded-lg shadow-sm font-black">{stats.count}</span>
            </div>
            <div className="space-y-1.5 overflow-y-auto max-h-[90px] pr-2 custom-scrollbar">
              {stats.enAttente.slice(0, 3).map((m) => (
                <div key={m.id} className="p-2 bg-white/60 rounded-xl border border-violet-100 text-[8px] text-violet-900 flex justify-between items-center transition-all hover:bg-white">
                  <span className="truncate italic font-black uppercase">{m.last_name}</span>
                  <div className="h-1 w-1 rounded-full bg-violet-400 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setActiveTab('membres')} className="mt-3 w-full py-3 bg-violet-500 text-white text-[8px] tracking-[0.3em] rounded-xl hover:bg-violet-600 transition-all shadow-lg font-black italic uppercase">
            Traiter l'urgence <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ÉPHÉMÉRIDE : FORMULAIRE COMPLET RÉTABLI */}
      <div className="bg-orange-50/30 p-6 border border-orange-100 shadow-sm" style={{ borderRadius: dynamicRadius }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[9px] text-orange-700/50 tracking-[0.3em] flex items-center gap-2 font-bold italic uppercase"><Calendar size={14} /> 3 Prochains Événements</h3>
          <button onClick={() => setActiveTab('calendrier')} className="text-[8px] text-orange-600 border-b border-orange-200 pb-0.5 hover:text-orange-800 transition-colors font-black italic uppercase">Agenda Complet</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isAddingEvent ? (
            <form onSubmit={addQuickEvent} className="col-span-1 md:col-span-2 flex flex-col gap-2 p-4 bg-white rounded-[1.5rem] border border-orange-200 shadow-xl animate-in zoom-in duration-300">
              <div className="grid grid-cols-2 gap-2">
                <input 
                  autoFocus className="col-span-2 bg-orange-50/50 border-none p-2.5 text-[9px] font-black italic outline-none rounded-lg" 
                  placeholder="TITRE..." value={quickEvent.title} onChange={e => setQuickEvent({...quickEvent, title: e.target.value.toUpperCase()})} required 
                />
                <select 
                  className="bg-orange-50/50 border-none p-2.5 text-[9px] font-black italic outline-none rounded-lg"
                  value={quickEvent.category} onChange={e => setQuickEvent({...quickEvent, category: e.target.value})}
                >
                  <option value="Match">Match</option>
                  <option value="Entraînement">Entraînement</option>
                  <option value="Réunion">Réunion</option>
                </select>
                <input 
                  className="bg-orange-50/50 border-none p-2.5 text-[9px] font-black italic outline-none rounded-lg" 
                  placeholder="LIEU..." value={quickEvent.location} onChange={e => setQuickEvent({...quickEvent, location: e.target.value.toUpperCase()})} 
                />
                <input 
                  type="date" className="bg-orange-50/50 border-none p-2.5 text-[9px] font-black outline-none rounded-lg" 
                  value={quickEvent.start_date} onChange={e => setQuickEvent({...quickEvent, start_date: e.target.value})} required 
                />
                <input 
                  type="time" className="bg-orange-50/50 border-none p-2.5 text-[9px] font-black outline-none rounded-lg" 
                  value={quickEvent.start_time} onChange={e => setQuickEvent({...quickEvent, start_time: e.target.value})} required 
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loadingEvent} className="flex-1 bg-orange-500 text-white rounded-lg text-[8px] font-black py-2">
                  {loadingEvent ? <Loader2 size={12} className="animate-spin mx-auto" /> : "VALIDER"}
                </button>
                <button type="button" onClick={() => setIsAddingEvent(false)} className="px-6 bg-slate-100 text-slate-400 rounded-lg text-[8px] font-black uppercase italic">Annuler</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setIsAddingEvent(true)} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-orange-200 rounded-[1.5rem] bg-white/50 text-orange-400 hover:bg-white hover:text-orange-600 transition-all group">
              <Plus size={20} className="group-hover:scale-110 transition-transform mb-1" />
              <span className="text-[8px] font-black tracking-widest uppercase italic">Planifier</span>
            </button>
          )}

          {events.map((evt) => {
            const d = new Date(evt.start_date);
            return (
              <div key={evt.id} className="flex gap-3 p-3 bg-white rounded-[1.5rem] border border-orange-100 shadow-sm transition-all hover:border-orange-300">
                <div className="h-10 w-10 bg-orange-50 rounded-xl flex flex-col items-center justify-center border border-orange-100 text-orange-600 shrink-0">
                  <span className="text-xs font-black italic leading-none">{d.getDate()}</span>
                  <span className="text-[6px] font-bold uppercase">{d.toLocaleString('fr-FR', { month: 'short' })}</span>
                </div>
                <div className="flex flex-col justify-center truncate italic">
                  <p className="text-[9px] text-slate-900 mb-0.5 truncate font-black uppercase">{evt.title}</p>
                  <p className="text-[7px] text-slate-400 font-medium normal-case">{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • {evt.location || 'Club'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, count }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
      <div className="flex flex-col leading-none italic">
        <span className="text-[7px] text-slate-400 font-bold mb-0.5 uppercase tracking-tighter">{label}</span>
        <span className="text-[10px] text-slate-900 font-black font-mono leading-none">{count}</span>
      </div>
    </div>
  );
}