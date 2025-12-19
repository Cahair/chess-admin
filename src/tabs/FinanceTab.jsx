import React, { useState, useEffect } from 'react' 
import { 
  PiggyBank, Target, Plus, Trash2, 
  HeartHandshake, TrendingDown, Wallet, ArrowUpRight
} from 'lucide-react'
import { supabase as supabaseClient } from "../supabaseClient";

export default function FinanceTab({ myClub, supabase, dynamicRadius, updateClubTheme }) {
  const [stats, setStats] = useState({ adulte: 0, jeune: 0, retraite: 0 });
  const [sponsors, setSponsors] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const client = supabase || supabaseClient;

  const [newSponsor, setNewSponsor] = useState({ name: '', amount: '', periodicity: 'annuel' });
  const [newExpense, setNewExpense] = useState({ label: '', amount: '', category: 'Matériel & Logiciels', periodicity: 'ponctuel' });

  const categoriesDepenses = [
    "FFE : Licences & Affiliations",
    "Rémunérations Entraîneurs",
    "Matériel & Logiciels",
    "Déplacements & Indemnités",
    "Locaux : Loyer & Charges",
    "Communication & Marketing",
    "Événements : Prix & Coupes",
    "Frais d'Arbitrage",
    "Assurances & Banque",
    "Buvette : Achats Stocks",
    "Autre / Imprévus"
  ];

  useEffect(() => { 
    if (myClub?.id) loadFinanceData(); 
  }, [myClub?.id]);

  async function loadFinanceData() {
    setLoading(true);
    await Promise.all([calculateMemberStats(), fetchSponsors(), fetchExpenses()]);
    setLoading(false);
  }

  async function calculateMemberStats() {
    const { data } = await client.from('members').select('category').eq('club_id', myClub.id);
    if (data) {
      const counts = data.reduce((acc, m) => {
        const cat = m.category?.toLowerCase();
        const key = cat?.includes('retraite') ? 'retraite' : cat?.includes('jeune') ? 'jeune' : 'adulte';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, { adulte: 0, jeune: 0, retraite: 0 });
      setStats(counts);
    }
  }

  async function fetchSponsors() {
    const { data } = await client.from('sponsors').select('*').eq('club_id', myClub.id);
    setSponsors(data || []);
  }

  async function fetchExpenses() {
    const { data } = await client.from('expenses').select('*').eq('club_id', myClub.id);
    setExpenses(data || []);
  }

  const revCotis = (stats.adulte * (parseFloat(myClub.price_adulte) || 0)) + 
                   (stats.jeune * (parseFloat(myClub.price_jeune) || 0)) + 
                   (stats.retraite * (parseFloat(myClub.price_retraite) || 0));
  
  const revSponsors = sponsors.reduce((acc, s) => acc + (s.periodicity === 'mensuel' ? s.amount * 12 : s.amount), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.periodicity === 'mensuel' ? e.amount * 12 : e.amount), 0);
  const resultatNet = (revCotis + revSponsors) - totalExpenses;

  async function addAction(table, item, setItem, refreshFn) {
    const { error } = await client.from(table).insert([{ ...item, amount: parseFloat(item.amount), club_id: myClub.id }]);
    if (!error) { 
        if(table === 'sponsors') setItem({ name: '', amount: '', periodicity: 'annuel' });
        else setItem({ label: '', amount: '', category: 'Matériel & Logiciels', periodicity: 'ponctuel' });
        refreshFn(); 
    }
  }

  async function deleteAction(table, id, refreshFn) {
    if (!window.confirm("Supprimer cet élément ?")) return;
    const { error } = await client.from(table).delete().eq('id', id);
    if (!error) refreshFn();
  }

  const primary = myClub?.primary_color || '#6366f1';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 italic font-black uppercase h-[calc(100vh-160px)] flex flex-col animate-fadeIn">
      
      {/* 1. RÉSUMÉ PERFORMANCE & BARÈME (Ligne du haut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
        <div className="lg:col-span-2 bg-slate-900 text-white p-8 flex justify-between items-center shadow-2xl relative overflow-hidden" style={{ borderRadius: dynamicRadius }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="flex items-center gap-6 relative z-10">
              <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30"><Wallet size={32} /></div>
              <div>
                  <h3 className="text-2xl tracking-tighter leading-none">Bilan Exercice</h3>
                  <p className="text-[9px] opacity-40 mt-1 tracking-[0.4em]">Solde final estimé</p>
              </div>
          </div>
          <div className="text-right relative z-10">
              <p className={`text-6xl tracking-tighter leading-none font-mono ${resultatNet >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {resultatNet.toLocaleString()}€
              </p>
          </div>
        </div>

        {/* BARÈME COLORÉ : Version Soft Indigo */}
        <div className="bg-indigo-50/50 p-6 border border-indigo-100 shadow-sm flex flex-col justify-center relative overflow-hidden" style={{ borderRadius: dynamicRadius }}>
          <div className="absolute -right-4 -top-4 opacity-5 text-indigo-900 rotate-12"><Target size={80} /></div>
          <h4 className="text-[8px] text-indigo-400 mb-4 flex items-center gap-2 tracking-[0.3em] font-black relative z-10">
            <Target size={12}/> Paramètres Cotisations
          </h4>
          <div className="grid grid-cols-3 gap-3 relative z-10">
            <PriceInput label="ADU." field="price_adulte" value={myClub.price_adulte} update={updateClubTheme} color="indigo" />
            <PriceInput label="JEU." field="price_jeune" value={myClub.price_jeune} update={updateClubTheme} color="indigo" />
            <PriceInput label="RET." field="price_retraite" value={myClub.price_retraite} update={updateClubTheme} color="indigo" />
          </div>
        </div>
      </div>

      {/* 2. GRILLE 50/50 : DÉPENSES vs SUBVENTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* COLONNE DÉPENSES */}
        <section className="bg-white p-8 border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden" style={{ borderRadius: dynamicRadius }}>
          <div className="flex justify-between items-center mb-8 shrink-0">
            <h4 className="text-[10px] text-rose-500 flex items-center gap-2 tracking-[0.3em] font-black"><TrendingDown size={20} /> Journal des Dépenses</h4>
            <div className="text-right leading-none">
              <span className="text-rose-600 text-2xl font-mono">-{totalExpenses.toLocaleString()}€</span>
              <p className="text-[7px] text-slate-300 mt-1 tracking-widest uppercase">Sorties Cumulées</p>
            </div>
          </div>

          <form className="flex flex-col gap-3 mb-8 shrink-0" onSubmit={(e) => {e.preventDefault(); addAction('expenses', newExpense, setNewExpense, fetchExpenses)}}>
            <div className="grid grid-cols-2 gap-2">
              <input className="bg-slate-50 border-none p-3 text-[10px] font-black rounded-xl outline-none" placeholder="LIBELLÉ..." value={newExpense.label} onChange={e => setNewExpense({...newExpense, label: e.target.value.toUpperCase()})} required />
              <select className="bg-slate-50 border-none p-3 text-[10px] font-black rounded-xl outline-none" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                {categoriesDepenses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <input className="flex-1 bg-slate-50 border-none p-3 text-[10px] font-black rounded-xl outline-none" type="number" placeholder="MONTANT €" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} required />
              <select className="w-32 bg-rose-50 text-rose-600 p-3 text-[10px] font-black rounded-xl outline-none" value={newExpense.periodicity} onChange={e => setNewExpense({...newExpense, periodicity: e.target.value})}>
                <option value="ponctuel">Une fois</option>
                <option value="mensuel">Mensuel</option>
              </select>
              <button type="submit" className="bg-rose-500 text-white px-6 rounded-xl hover:bg-rose-600 transition-all shadow-lg active:scale-95"><Plus size={20}/></button>
            </div>
          </form>

          <div className="flex-1 overflow-y-auto pr-3 premium-scroll space-y-6">
            {categoriesDepenses.map(cat => {
              const items = expenses.filter(e => e.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="text-[8px] text-slate-300 mb-3 ml-1 tracking-[0.2em] font-bold border-l-2 border-rose-100 pl-2">{cat}</p>
                  <div className="space-y-2">
                    {items.map(e => (
                      <div key={e.id} className="flex justify-between items-center p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white transition-all group">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-800 leading-none mb-1">{e.label}</span>
                          <span className="text-[7px] text-slate-400 uppercase italic font-medium">{e.periodicity === 'mensuel' ? 'Débit récurrent (x12)' : 'Transaction unique'}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-rose-600 text-[12px] font-mono">-{e.periodicity === 'mensuel' ? (e.amount * 12).toLocaleString() : e.amount.toLocaleString()}€</span>
                          <Trash2 size={14} className="text-slate-200 group-hover:text-rose-500 cursor-pointer transition-colors" onClick={() => deleteAction('expenses', e.id, fetchExpenses)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* COLONNE SUBVENTIONS */}
        <section className="bg-white p-8 border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden" style={{ borderRadius: dynamicRadius }}>
          <div className="flex justify-between items-center mb-8 shrink-0">
            <h4 className="text-[10px] text-emerald-600 flex items-center gap-2 tracking-[0.3em] font-black"><HeartHandshake size={20} /> Mécénat & Subventions</h4>
            <div className="text-right leading-none">
              <span className="text-emerald-600 text-2xl font-mono">+{revSponsors.toLocaleString()}€</span>
              <p className="text-[7px] text-slate-300 mt-1 tracking-widest uppercase">Entrées Diverses</p>
            </div>
          </div>

          <form className="flex flex-col gap-3 mb-8 shrink-0" onSubmit={(e) => {e.preventDefault(); addAction('sponsors', newSponsor, setNewSponsor, fetchSponsors)}}>
            <input className="bg-slate-50 border-none p-3 text-[10px] font-black rounded-xl outline-none" placeholder="NOM DU PARTENAIRE OU ORGANISME..." value={newSponsor.name} onChange={e => setNewSponsor({...newSponsor, name: e.target.value.toUpperCase()})} required />
            <div className="flex gap-2">
              <input className="flex-1 bg-slate-50 border-none p-3 text-[10px] font-black rounded-xl outline-none" type="number" placeholder="MONTANT €" value={newSponsor.amount} onChange={e => setNewSponsor({...newSponsor, amount: e.target.value})} required />
              <select className="w-32 bg-emerald-50 text-emerald-600 p-3 text-[10px] font-black rounded-xl outline-none" value={newSponsor.periodicity} onChange={e => setNewSponsor({...newSponsor, periodicity: e.target.value})}>
                <option value="annuel">Annuel</option>
                <option value="mensuel">Mensuel</option>
              </select>
              <button type="submit" className="bg-emerald-500 text-white px-6 rounded-xl hover:bg-emerald-600 transition-all shadow-lg active:scale-95"><Plus size={20}/></button>
            </div>
          </form>

          <div className="flex-1 overflow-y-auto pr-3 premium-scroll space-y-2">
            {sponsors.map(s => (
              <div key={s.id} className="flex justify-between items-center p-4 bg-emerald-50/20 border border-emerald-50 rounded-2xl hover:bg-emerald-50/40 transition-all group">
                <div className="flex flex-col">
                  <span className="text-[10px] text-emerald-900 font-black leading-none mb-1">{s.name}</span>
                  <span className="text-[7px] text-emerald-600/60 uppercase italic font-medium">{s.periodicity === 'mensuel' ? 'Apport mensuel' : 'Aide ponctuelle'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-emerald-600 text-[12px] font-mono">+{s.amount.toLocaleString()}€</span>
                  <Trash2 size={14} className="text-emerald-200 group-hover:text-rose-500 cursor-pointer transition-colors" onClick={() => deleteAction('sponsors', s.id, fetchSponsors)} />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

function PriceInput({ label, field, value, update, color = "slate" }) {
    const themes = {
      slate: "bg-slate-50 border-slate-100 focus:border-indigo-300",
      indigo: "bg-white border-indigo-100 focus:border-indigo-400"
    };
    
    return (
        <div className="relative">
            <label className={`text-[7px] absolute -top-1.5 left-2 bg-white px-1 z-10 font-bold tracking-tighter ${color === 'indigo' ? 'text-indigo-400' : 'text-slate-400'}`}>{label}</label>
            <input type="number" value={value || 0} onChange={(e) => update(field, e.target.value)} 
                   className={`w-full p-2.5 text-[10px] border outline-none transition-all font-black rounded-xl ${themes[color]}`} />
        </div>
    )
}