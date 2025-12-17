import React, { useState, useEffect } from 'react' // Vérifie que cette ligne est présente
import { 
  PiggyBank, Target, RefreshCw, Plus, Trash2, 
  HeartHandshake, CalendarDays, ArrowUpRight, 
  TrendingDown, CircleDollarSign, Briefcase // Avec une Majuscule
} from 'lucide-react'

export default function FinanceTab({ myClub, supabase, dynamicRadius, updateClubTheme }) {
  const [stats, setStats] = useState({ adulte: 0, jeune: 0, retraite: 0 });
  const [sponsors, setSponsors] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newSponsor, setNewSponsor] = useState({ name: '', amount: '', periodicity: 'annuel' });
  const [newExpense, setNewExpense] = useState({ label: '', amount: '', category: 'Matériel', periodicity: 'ponctuel' });

  // Catégories exhaustives pour un club Pro
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

  useEffect(() => { loadFinanceData(); }, []);

  async function loadFinanceData() {
    setLoading(true);
    await Promise.all([calculateMemberStats(), fetchSponsors(), fetchExpenses()]);
    setLoading(false);
  }

  async function calculateMemberStats() {
    const { data } = await supabase.from('members').select('category').eq('club_id', myClub.id);
    if (data) {
      const counts = data.reduce((acc, m) => {
        const key = m.category?.toLowerCase() === 'retraite' ? 'retraite' : m.category?.toLowerCase() === 'jeune' ? 'jeune' : 'adulte';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, { adulte: 0, jeune: 0, retraite: 0 });
      setStats(counts);
    }
  }

  async function fetchSponsors() {
    const { data } = await supabase.from('sponsors').select('*').eq('club_id', myClub.id);
    setSponsors(data || []);
  }

  async function fetchExpenses() {
    const { data } = await supabase.from('expenses').select('*').eq('club_id', myClub.id);
    setExpenses(data || []);
  }

  // LOGIQUE DE CALCUL
  const revCotis = (stats.adulte * (parseFloat(myClub.price_adulte) || 0)) + 
                   (stats.jeune * (parseFloat(myClub.price_jeune) || 0)) + 
                   (stats.retraite * (parseFloat(myClub.price_retraite) || 0));
  
  const revSponsors = sponsors.reduce((acc, s) => acc + (s.periodicity === 'mensuel' ? s.amount * 12 : s.amount), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.periodicity === 'mensuel' ? e.amount * 12 : e.amount), 0);
  
  const totalRevenus = revCotis + revSponsors;
  const resultatNet = totalRevenus - totalExpenses;

  async function addAction(table, item, setItem, refreshFn) {
    const { error } = await supabase.from(table).insert([{ ...item, amount: parseFloat(item.amount), club_id: myClub.id }]);
    if (!error) { 
        if(table === 'sponsors') setItem({ name: '', amount: '', periodicity: 'annuel' });
        else setItem({ label: '', amount: '', category: 'Matériel', periodicity: 'ponctuel' });
        refreshFn(); 
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 italic font-black uppercase">
      
      {/* 1. DASHBOARD DE PERFORMANCE */}
      <div className="bg-slate-900 text-white p-10 flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden" style={{ borderRadius: dynamicRadius }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex items-center gap-6 relative z-10">
            <div className="p-5 bg-emerald-500/20 text-emerald-400 rounded-[2rem] border border-emerald-500/30"><PiggyBank size={40} /></div>
            <div>
                <h3 className="text-3xl tracking-tighter leading-none">Pilotage Financier</h3>
                <p className="text-[10px] opacity-40 mt-2 tracking-[0.4em]">Solde prévisionnel de fin d'exercice</p>
            </div>
        </div>
        <div className="text-right relative z-10 mt-6 md:mt-0">
            <p className={`text-7xl tracking-tighter leading-none ${resultatNet >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                {resultatNet.toFixed(0)}€
            </p>
            <div className="flex items-center justify-end gap-2 mt-4">
               <div className={`w-2 h-2 rounded-full ${resultatNet >= 0 ? 'bg-emerald-400' : 'bg-rose-500'}`}></div>
               <p className="text-[10px] opacity-60 tracking-widest">{resultatNet >= 0 ? 'Budget excédentaire' : 'Déficit à combler'}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLONNE GAUCHE (LEVIERS & REVENUS FIXES) */}
        <div className="lg:col-span-4 space-y-6">
            {/* TARIFS (GRIS) */}
            <section className="bg-slate-50 p-8 border border-slate-200" style={{ borderRadius: dynamicRadius }}>
                <h4 className="text-[10px] text-slate-400 mb-6 flex items-center gap-2 tracking-widest"><Target size={14}/> Barème Cotisations</h4>
                <div className="space-y-4">
                    <PriceInput label="Adulte" field="price_adulte" value={myClub.price_adulte} update={updateClubTheme} radius={dynamicRadius} />
                    <PriceInput label="Jeune" field="price_jeune" value={myClub.price_jeune} update={updateClubTheme} radius={dynamicRadius} />
                    <PriceInput label="Retraité" field="price_retraite" value={myClub.price_retraite} update={updateClubTheme} radius={dynamicRadius} />
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="flex justify-between text-[11px] mb-2"><span>Total Cotis.</span><span>{revCotis.toFixed(0)}€</span></div>
                    <div className="flex justify-between text-[11px]"><span>Total Sponsors</span><span>{revSponsors.toFixed(0)}€</span></div>
                </div>
            </section>

            {/* QUICK STATS (INDIGO) */}
            <section className="bg-indigo-50/50 p-8 border border-indigo-100" style={{ borderRadius: dynamicRadius }}>
                <h4 className="text-[10px] text-indigo-400 mb-6 tracking-widest uppercase">Volume de Revenus</h4>
                <div className="text-3xl text-indigo-900 mb-1">{totalRevenus.toFixed(0)}€</div>
                <p className="text-[9px] text-indigo-400 font-bold">Entrées brutes cumulées</p>
            </section>
        </div>

        {/* COLONNE DROITE (DÉPENSES & SPONSORS) */}
        <div className="lg:col-span-8 space-y-6">
            
            {/* GESTION DES DÉPENSES (ROSE) */}
            <section className="bg-rose-50/30 p-8 border border-rose-100 shadow-sm" style={{ borderRadius: dynamicRadius }}>
                <div className="flex justify-between items-center mb-8">
                    <h4 className="text-[10px] text-rose-500 flex items-center gap-2 tracking-widest"><TrendingDown size={18} /> Plan de dépenses exhaustif</h4>
                    <span className="text-rose-600 text-2xl">-{totalExpenses.toFixed(0)}€</span>
                </div>

                <form className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10" onSubmit={(e) => {e.preventDefault(); addAction('expenses', newExpense, setNewExpense, fetchExpenses)}}>
                    <select className="bg-white border border-rose-100 p-4 text-[10px] font-black" style={{ borderRadius: dynamicRadius }} value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                        {categoriesDepenses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input className="bg-white border border-rose-100 p-4 text-[10px]" style={{ borderRadius: dynamicRadius }} placeholder="NOM DE LA DÉPENSE (EX: SALAIRE LUCAS)" value={newExpense.label} onChange={e => setNewExpense({...newExpense, label: e.target.value})} required />
                    <input className="bg-white border border-rose-100 p-4 text-[10px]" style={{ borderRadius: dynamicRadius }} type="number" placeholder="MONTANT" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} required />
                    <div className="flex gap-2">
                        <select className="flex-1 bg-rose-100 border-none px-4 text-[9px] font-black" style={{ borderRadius: dynamicRadius }} value={newExpense.periodicity} onChange={e => setNewExpense({...newExpense, periodicity: e.target.value})}>
                            <option value="ponctuel">Ponctuel (Facture)</option>
                            <option value="mensuel">Mensuel (Récurrent)</option>
                        </select>
                        <button type="submit" className="bg-rose-500 text-white px-6 hover:bg-rose-600 shadow-lg shadow-rose-200" style={{ borderRadius: dynamicRadius }}><Plus /></button>
                    </div>
                </form>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {categoriesDepenses.map(cat => {
                        const items = expenses.filter(e => e.category === cat);
                        if (items.length === 0) return null;
                        return (
                            <div key={cat} className="mb-6">
                                <p className="text-[8px] text-rose-300 mb-2 ml-1 tracking-[0.2em]">{cat}</p>
                                {items.map(e => (
                                    <div key={e.id} className="flex justify-between items-center p-4 bg-white border border-rose-50 mb-2" style={{ borderRadius: `calc(${dynamicRadius} / 2)` }}>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-800 leading-none">{e.label}</span>
                                            <span className="text-[7px] text-slate-300 mt-1">{e.periodicity === 'mensuel' ? 'Débit mensuel automatique' : 'Paiement unique'}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-rose-600 text-xs">-{e.periodicity === 'mensuel' ? e.amount * 12 : e.amount}€</span>
                                            <Trash2 size={14} className="text-rose-100 hover:text-rose-500 cursor-pointer" onClick={() => {/* delete */}} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* SPONSORS & DONS (VERT) */}
            <section className="bg-emerald-50/40 p-8 border border-emerald-100" style={{ borderRadius: dynamicRadius }}>
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] text-emerald-600 flex items-center gap-2 tracking-widest"><HeartHandshake size={16} /> Mécénat & Subventions</h4>
                    <span className="text-emerald-600 text-xl">+{revSponsors.toFixed(0)}€</span>
                </div>
                <form className="flex gap-2 mb-6" onSubmit={(e) => {e.preventDefault(); addAction('sponsors', newSponsor, setNewSponsor, fetchSponsors)}}>
                    <input className="flex-[2] bg-white border border-emerald-100 p-3 text-[10px]" style={{ borderRadius: dynamicRadius }} placeholder="PARTENAIRE OU TYPE SUBVENTION" value={newSponsor.name} onChange={e => setNewSponsor({...newSponsor, name: e.target.value})} required />
                    <input className="flex-1 bg-white border border-emerald-100 p-3 text-[10px]" style={{ borderRadius: dynamicRadius }} type="number" placeholder="SOMME" value={newSponsor.amount} onChange={e => setNewSponsor({...newSponsor, amount: e.target.value})} required />
                    <button type="submit" className="bg-emerald-500 text-white px-4" style={{ borderRadius: dynamicRadius }}><Plus size={18}/></button>
                </form>
            </section>
        </div>
      </div>
    </div>
  )
}

function PriceInput({ label, field, value, update, radius }) {
    return (
        <div className="relative">
            <label className="text-[8px] text-slate-400 absolute -top-2 left-3 bg-slate-50 px-1 z-10">{label}</label>
            <input type="number" value={value || 0} onChange={(e) => update(field, e.target.value)} 
                   className="w-full bg-white p-3 text-[10px] border border-slate-200 focus:border-indigo-300 outline-none transition-all" 
                   style={{ borderRadius: radius }} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] opacity-20">€</span>
        </div>
    )
}