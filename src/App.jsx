import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { 
  Users, Upload, Plus, LogOut, Search, 
  Trophy, ChevronRight, BrainCircuit, 
  Trash2, TrendingUp, Star 
} from 'lucide-react'

// Configuration de l'IA - Remplacez par votre clé API
const genAI = new GoogleGenerativeAI("AIzaSyAuPeXom6MXGE_n0W1cRsv7A7FICR9LZVw");

export default function App() {
  // --- ÉTATS ---
  const [session, setSession] = useState(null)
  const [myClub, setMyClub] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [newMember, setNewMember] = useState({ first_name: '', last_name: '', elo: '' })

  // --- AUTHENTIFICATION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    if (session) fetchClubAndMembers()
  }, [session])

  async function fetchClubAndMembers() {
    const { data: clubData } = await supabase.from('clubs').select('*').eq('admin_id', session.user.id).single()
    if (clubData) {
      setMyClub(clubData)
      const { data: membersData } = await supabase
        .from('members')
        .select('*')
        .eq('club_id', clubData.id)
        .order('last_name', { ascending: true })
      setMembers(membersData || [])
    }
  }

  // --- ACTIONS : SUPPRESSION ---
  async function deleteMember(id) {
  // 1. Confirmation utilisateur
  const confirmed = window.confirm("Supprimer définitivement ce membre ?");
  if (!confirmed) return;

  try {
    // 2. Appel à Supabase
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // 3. Mise à jour locale de l'état (plus rapide que fetchClubAndMembers)
    setMembers(prev => prev.filter(member => member.id !== id));
    
  } catch (error) {
    console.error("Erreur suppression:", error.message);
    alert("Impossible de supprimer : " + error.message);
  }
}
  // --- ACTIONS : IMPORT IA AVEC UPSERT (ANTI-CONFLIT) ---
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const imageData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = "Extrais les membres du club d'échecs. Réponds uniquement en JSON: [{'last_name': 'NOM', 'first_name': 'Prenom', 'elo': 1500}]";
      
      const result = await model.generateContent([prompt, { inlineData: { data: imageData, mimeType: file.type } }]);
      const response = await result.response;
      const cleanJson = response.text().replace(/```json|```/g, "").trim();
      const rawData = JSON.parse(cleanJson);

      // --- NETTOYAGE DES DOUBLONS DANS L'IMAGE ---
      // On utilise une Map pour ne garder qu'une seule occurrence de chaque couple (Nom + Prénom)
      const uniqueMap = new Map();
      
      rawData.forEach(m => {
        const key = `${m.last_name.toUpperCase()}-${m.first_name.toLowerCase()}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, {
            last_name: m.last_name.toUpperCase(),
            first_name: m.first_name,
            elo: parseInt(m.elo) || 0,
            club_id: myClub.id
          });
        }
      });

      const formatted = Array.from(uniqueMap.values());

      // --- UPSERT SÉCURISÉ ---
      const { error } = await supabase
        .from('members')
        .upsert(formatted, { onConflict: 'first_name, last_name, club_id' });

      if (error) throw error;
      
      alert(`Synchronisation terminée : ${formatted.length} joueurs traités.`);
      fetchClubAndMembers();
    } catch (error) { 
      console.error(error);
      alert("Erreur de synchronisation : " + error.message);
    }
    setLoading(false);
  }
  // --- CALCULS STATISTIQUES ---
  const filteredMembers = members.filter(m => 
    m.last_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.first_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const averageElo = members.length > 0 
    ? Math.round(members.reduce((acc, curr) => acc + (curr.elo || 0), 0) / members.length) 
    : 0;

  const topPlayer = members.length > 0 
    ? [...members].sort((a, b) => b.elo - a.elo)[0] 
    : null;

  // --- RENDU ---
  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
      <BrainCircuit className="text-indigo-600 animate-pulse mb-4" size={48} />
      <p className="text-slate-600 font-bold tracking-tight">Intelligence Artificielle en action...</p>
    </div>
  )

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white text-center">
        <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
          <Trophy size={32} className="text-white" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">ChessManager</h1>
        <p className="text-slate-500 font-medium mb-10">Gérez votre club comme un grand maître</p>
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]} />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-900">
      
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-slate-400 hidden lg:flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-8 text-white font-black text-2xl flex items-center gap-3 tracking-tighter">
          <div className="bg-indigo-500 p-1.5 rounded-lg text-white"><Trophy size={20} /></div>
          ChessManager
        </div>
        <nav className="flex-1 px-4 mt-4">
          <div className="flex items-center gap-3 bg-indigo-600 text-white px-4 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-900/20">
            <Users size={20} /> Membres
          </div>
        </nav>
        <div className="p-6">
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-400/5 rounded-2xl w-full transition font-bold text-sm">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Section */}
      <main className="flex-1 overflow-auto h-screen">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{myClub?.name || "Mon Club"}</h2>
            <div className="flex items-center gap-2 text-indigo-600">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Administration active</p>
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              className="pl-12 pr-6 py-3 bg-slate-100 border-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-sm outline-none w-80 transition-all font-semibold shadow-inner"
              placeholder="Rechercher un joueur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto space-y-10">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCard icon={<Users />} label="Effectif" value={`${members.length} membres`} color="blue" />
            <StatCard icon={<TrendingUp />} label="Moyenne ELO" value={`${averageElo} pts`} color="emerald" />
            <StatCard icon={<Star />} label="Meilleur Joueur" value={topPlayer?.last_name || "---"} color="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Formulaire Manuel */}
            <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black mb-8 flex items-center gap-3 uppercase tracking-wider text-slate-400">
                <Plus size={20} className="text-indigo-600"/> Ajout manuel
              </h3>
              <form className="flex flex-wrap gap-4" onSubmit={async (e) => {
                e.preventDefault();
                await supabase.from('members').insert([{ ...newMember, elo: parseInt(newMember.elo), club_id: myClub.id }]);
                setNewMember({ first_name: '', last_name: '', elo: '' });
                fetchClubAndMembers();
              }}>
                <input className="flex-1 min-w-[150px] bg-slate-50 border-none rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Prénom" value={newMember.first_name} onChange={e => setNewMember({...newMember, first_name: e.target.value})} required />
                <input className="flex-1 min-w-[150px] bg-slate-50 border-none rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Nom" value={newMember.last_name} onChange={e => setNewMember({...newMember, last_name: e.target.value})} required />
                <input className="w-28 bg-slate-50 border-none rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500/20" type="number" placeholder="ELO" value={newMember.elo} onChange={e => setNewMember({...newMember, elo: e.target.value})} />
                <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 uppercase text-xs tracking-widest">Ajouter</button>
              </form>
            </div>

            {/* IA Scanner Card */}
            <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
              <BrainCircuit className="absolute -right-6 -bottom-6 text-white/10 group-hover:scale-125 transition duration-700" size={180} />
              <h3 className="text-2xl font-black mb-2 leading-none uppercase tracking-tighter italic">Scanner IA</h3>
              <p className="text-indigo-100 text-sm mb-8 font-medium">Mettez à jour votre liste FFE en 3 secondes.</p>
              <label className="bg-white text-indigo-600 px-6 py-4 rounded-2xl font-black cursor-pointer hover:shadow-2xl transition-all block text-center shadow-lg relative z-10 text-xs uppercase tracking-widest">
                Sélectionner capture
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-12 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm italic">Registre des licenciés</h3>
              <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2 rounded-2xl font-black text-[10px] uppercase border border-indigo-100">
                {filteredMembers.length} Joueurs actifs
              </div>
            </div>
            
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50">
                  <th className="px-12 py-6">Joueur / Club</th>
                  <th className="px-12 py-6 text-center">Niveau ELO</th>
                  <th className="px-12 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMembers.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-12 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center font-black text-sm group-hover:from-indigo-500 group-hover:to-indigo-600 group-hover:text-white transition-all shadow-inner">
                          {m.first_name[0]}{m.last_name[0]}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight italic">{m.last_name}</div>
                          <div className="text-sm text-slate-400 font-bold tracking-tight">{m.first_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-12 py-6 text-center">
                      <span className={`px-5 py-2 rounded-2xl font-black text-xs shadow-sm border ${m.elo > 2000 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                        {m.elo} pts
                      </span>
                    </td>
                    <td className="px-12 py-6 text-right">
  <button 
    onClick={(e) => {
      e.stopPropagation(); // Empêche le clic de se propager à la ligne
      deleteMember(m.id);
    }}
    className="relative z-30 text-slate-300 hover:text-red-500 transition-all p-3 hover:bg-red-50 rounded-2xl cursor-pointer"
    title="Supprimer le membre"
  >
    <Trash2 size={20} />
  </button>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

// Composant Helper pour les cartes de stats
function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600"
  }
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-6">
      <div className={`${colors[color]} p-5 rounded-3xl shadow-inner`}>
        {React.cloneElement(icon, { size: 32 })}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tighter italic">{value}</p>
      </div>
    </div>
  )
}