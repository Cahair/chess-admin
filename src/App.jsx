import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { 
  Users, Plus, LogOut, Search, Trophy, BrainCircuit, 
  Trash2, TrendingUp, Star, Palette, CheckCircle2, Clock, AlertCircle 
} from 'lucide-react'

const genAI = new GoogleGenerativeAI("AIzaSyAuPeXom6MXGE_n0W1cRsv7A7FICR9LZVw");

export default function App() {
  const [session, setSession] = useState(null)
  const [myClub, setMyClub] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [newMember, setNewMember] = useState({ first_name: '', last_name: '', elo: '', license_status: 'en_attente' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) fetchClubAndMembers()
    else setLoading(false)
  }, [session])

  async function fetchClubAndMembers() {
    try {
      setLoading(true);
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('admin_id', session.user.id)
        .maybeSingle(); 

      if (clubError) throw clubError;
      if (!clubData) {
        setMyClub(null); setMembers([]); return; 
      }

      setMyClub(clubData);
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('club_id', clubData.id)
        .order('last_name', { ascending: true });

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  // --- NOUVELLE FONCTION : GESTION RAPIDE DES LICENCES ---
  async function toggleLicenseStatus(id, currentStatus) {
    const nextStatus = currentStatus === 'valide' ? 'expire' : currentStatus === 'expire' ? 'en_attente' : 'valide';
    const { error } = await supabase
      .from('members')
      .update({ license_status: nextStatus })
      .eq('id', id);

    if (!error) {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, license_status: nextStatus } : m));
    }
  }

  async function updateClubTheme(field, value) {
    try {
      setMyClub(prev => ({ ...prev, [field]: value }));
      const { error } = await supabase
        .from('clubs')
        .update({ [field]: value })
        .eq('id', myClub.id);
      if (error) throw error;
    } catch (error) {
      console.error(error.message);
      fetchClubAndMembers();
    }
  }

  async function deleteMember(id) {
    if (!window.confirm("Supprimer ce membre ?")) return;
    try {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      alert("Erreur : " + error.message);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file || !myClub) return;
    setLoading(true);
    try {
      const imageData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = "Extrais les membres. JSON uniquement: [{'last_name': 'NOM', 'first_name': 'Prenom', 'elo': 1500}]";
      const result = await model.generateContent([prompt, { inlineData: { data: imageData, mimeType: file.type } }]);
      const rawData = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
      const formatted = rawData.map(m => ({ 
        ...m, 
        last_name: m.last_name.toUpperCase(), 
        club_id: myClub.id, 
        elo: parseInt(m.elo) || 0,
        license_status: 'en_attente'
      }));
      await supabase.from('members').upsert(formatted, { onConflict: 'first_name, last_name, club_id' });
      fetchClubAndMembers();
    } catch (error) { alert("Erreur IA: " + error.message); }
    setLoading(false);
  }

  const filteredMembers = members.filter(m => 
    m.last_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.first_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-black text-indigo-600 animate-pulse italic uppercase tracking-widest text-sm text-center px-4">Initialisation sécurisée...</div>

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center">
        <Trophy size={48} className="text-indigo-600 mx-auto mb-6" />
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase mb-8">ChessManager</h1>
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]} />
      </div>
    </div>
  )

  if (!myClub) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl">
        <Star size={48} className="text-amber-500 mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter italic">Accès en attente</h2>
        <p className="text-slate-500 mb-8 font-medium italic">Votre compte n'est pas encore lié à un club.</p>
        <button onClick={() => supabase.auth.signOut()} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest">Déconnexion</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-900 overflow-x-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 text-slate-400 hidden lg:flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-8 text-white font-black text-2xl flex items-center gap-3 tracking-tighter italic uppercase">
          <Trophy size={24} style={{ color: myClub.primary_color || '#6366f1' }} /> ChessManager
        </div>
        <nav className="flex-1 px-4 mt-4 text-xs font-bold uppercase tracking-widest">
          <div className="flex items-center gap-3 bg-slate-800/50 text-white px-5 py-4 rounded-2xl font-bold border border-slate-700/50">
            <Users size={20} /> Membres
          </div>
        </nav>
        <div className="p-8 border-t border-slate-800/20">
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 rounded-2xl w-full font-bold transition-all text-sm italic italic uppercase">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto h-screen px-6 lg:px-12 py-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="max-w-full overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase truncate" style={{ color: myClub.primary_color || '#1e293b' }}>{myClub.name}</h2>
            <div className="flex items-center gap-2 font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">
                <span className="w-2 h-2 shrink-0 rounded-full animate-pulse" style={{ backgroundColor: myClub.secondary_color || myClub.primary_color }}></span>
                Console d'administration
            </div>
          </div>
          <div className="relative group w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="pl-12 pr-8 py-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none w-full md:w-96 font-bold shadow-sm focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </header>

        <div className="space-y-10 max-w-7xl mx-auto">
          {/* STATS AVEC GESTION LICENCES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <StatCard icon={<Users />} label="Effectif" value={`${members.length} membres`} color="blue" themeColor={myClub.primary_color} />
            <StatCard icon={<Clock />} label="À Valider" value={`${members.filter(m => m.license_status === 'en_attente').length}`} color="amber" themeColor={myClub.secondary_color} />
            <StatCard icon={<CheckCircle2 />} label="Licenciés" value={`${members.filter(m => m.license_status === 'valide').length}`} color="emerald" themeColor="#10b981" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
            <div className="xl:col-span-2 space-y-8 flex flex-col min-w-0">
              
              {/* PANNEAU DE PERSONNALISATION */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 italic">
                <div className="flex items-center gap-5">
                    <div className="p-4 rounded-[1.5rem] bg-slate-50 text-slate-400 shrink-0"><Palette size={28} /></div>
                    <div className="min-w-0"><h4 className="text-lg font-black uppercase tracking-tighter text-slate-800 italic leading-none truncate">Identité Visuelle</h4><p className="text-xs text-slate-400 font-medium italic mt-1 truncate">Personnalisez votre espace.</p></div>
                </div>
                <div className="flex gap-4 shrink-0">
                    <input type="color" value={myClub.primary_color || '#6366f1'} onChange={(e) => updateClubTheme('primary_color', e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-4 border-slate-100 bg-transparent" />
                    <input type="color" value={myClub.secondary_color || '#f43f5e'} onChange={(e) => updateClubTheme('secondary_color', e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-4 border-slate-100 bg-transparent" />
                </div>
              </div>

              {/* FORMULAIRE MANUEL OPTIMISÉ */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex-1">
                <h3 className="text-[10px] font-black mb-6 uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3 italic"><Plus size={16} /> Nouveau Licencié</h3>
                <form className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4" onSubmit={async (e) => {
                  e.preventDefault();
                  await supabase.from('members').insert([{ ...newMember, elo: parseInt(newMember.elo), club_id: myClub.id }]);
                  setNewMember({ first_name: '', last_name: '', elo: '', license_status: 'en_attente' });
                  fetchClubAndMembers();
                }}>
                  <input className="flex-1 bg-slate-50 border-none rounded-xl px-5 py-4 font-bold outline-none shadow-inner text-sm" placeholder="Prénom" value={newMember.first_name} onChange={e => setNewMember({...newMember, first_name: e.target.value})} required />
                  <input className="flex-1 bg-slate-50 border-none rounded-xl px-5 py-4 font-bold outline-none shadow-inner text-sm" placeholder="Nom" value={newMember.last_name} onChange={e => setNewMember({...newMember, last_name: e.target.value})} required />
                  <input className="w-full lg:w-24 bg-slate-50 border-none rounded-xl px-5 py-4 font-bold text-center text-sm" type="number" placeholder="ELO" value={newMember.elo} onChange={e => setNewMember({...newMember, elo: e.target.value})} />
                  <button className="h-[52px] px-10 rounded-xl font-black uppercase text-[10px] tracking-widest text-white shadow-lg shrink-0" style={{ backgroundColor: myClub.primary_color || '#1e293b' }}>Ajouter</button>
                </form>
              </div>
            </div>

            {/* SCANNER IA */}
            <div className="p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[300px]" 
                 style={{ background: `linear-gradient(135deg, ${myClub.primary_color || '#6366f1'} 0%, ${myClub.secondary_color || '#4338ca'} 100%)` }}>
              <BrainCircuit className="absolute -right-12 -bottom-12 text-white/10" size={250} />
              <div className="relative z-10">
                <h3 className="text-3xl font-black mb-2 italic uppercase tracking-tighter">Scanner IA</h3>
                <p className="text-white/80 text-xs mb-8 font-medium italic">Importez vos listes FFE.</p>
                <label className="bg-white px-8 py-4 rounded-xl font-black cursor-pointer block text-center shadow-2xl text-[11px] uppercase tracking-widest" 
                       style={{ color: myClub.primary_color || '#6366f1' }}>
                  Sélectionner capture
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* TABLEAU DES MEMBRES AVEC GESTION LICENCES */}
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden mb-20">
            <div className="px-8 lg:px-12 py-8 bg-slate-50/50 border-b border-slate-100">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs italic">Registre des membres</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 italic">
                    <th className="px-8 lg:px-12 py-6">Licencié</th>
                    <th className="px-8 lg:px-12 py-6 text-center">Niveau ELO</th>
                    <th className="px-8 lg:px-12 py-6 text-center">État Licence</th>
                    <th className="px-8 lg:px-12 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMembers.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/40 transition-colors group italic">
                      <td className="px-8 lg:px-12 py-6 flex items-center gap-4 lg:gap-6 min-w-[300px] uppercase">
                        <div className="w-12 h-12 rounded-2xl text-white flex items-center justify-center font-black text-sm shadow-md shrink-0" 
                             style={{ backgroundColor: myClub.primary_color || '#6366f1' }}>
                          {m.first_name[0]}{m.last_name[0]}
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="font-black text-slate-900 italic uppercase tracking-tight text-lg truncate">{m.last_name}</div>
                          <div className="text-[10px] lg:text-[11px] text-slate-400 font-bold uppercase tracking-widest truncate">{m.first_name}</div>
                        </div>
                      </td>
                      <td className="px-8 lg:px-12 py-6 text-center">
                        <span className="bg-slate-50 px-4 py-2 rounded-full font-black text-[11px] text-slate-600 border border-slate-100 whitespace-nowrap">
                          {m.elo} PTS
                        </span>
                      </td>
                      
                      {/* STATUT LICENCE INTERACTIF */}
                      <td className="px-8 lg:px-12 py-6 text-center italic uppercase">
                        <button 
                          onClick={() => toggleLicenseStatus(m.id, m.license_status)}
                          className={`flex items-center gap-2 mx-auto px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95 border-2 ${
                            m.license_status === 'valide' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            m.license_status === 'expire' ? 'bg-red-50 text-red-600 border-red-100' : 
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}
                        >
                          {m.license_status === 'valide' ? <CheckCircle2 size={14}/> : m.license_status === 'expire' ? <AlertCircle size={14}/> : <Clock size={14}/>}
                          {m.license_status?.replace('_', ' ')}
                        </button>
                      </td>

                      <td className="px-8 lg:px-12 py-6 text-right italic uppercase">
                        <button onClick={() => deleteMember(m.id)} className="text-slate-200 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-xl">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value, color, themeColor }) {
  const colors = { blue: "bg-blue-50 text-blue-600", emerald: "bg-emerald-100 text-emerald-700", amber: "bg-amber-50 text-amber-600" }
  return (
    <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-5 h-full italic uppercase">
      <div className={`${colors[color]} p-4 lg:p-5 rounded-[1.5rem] shadow-inner shrink-0`}>
        {React.cloneElement(icon, { size: 28, style: { color: themeColor } })}
      </div>
      <div className="min-w-0 uppercase italic">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic mb-1 truncate">{label}</p>
        <p className="text-xl lg:text-2xl font-black text-slate-900 italic tracking-tighter uppercase truncate leading-none">{value}</p>
      </div>
    </div>
  )
}