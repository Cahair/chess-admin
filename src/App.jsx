import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { 
  Users, LogOut, Search, Trophy, Settings, 
  Star, Euro, Calendar as CalendarIcon 
} from 'lucide-react'

// Import de tes onglets
import FinanceTab from './FinanceTab'
import MembersTab from './MembersTab'
import SettingsTab from './SettingsTab'
import CalendarTab from './CalendarTab'

const genAI = new GoogleGenerativeAI("AIzaSyAuPeXom6MXGE_n0W1cRsv7A7FICR9LZVw");

export default function App() {
  const [session, setSession] = useState(null)
  const [myClub, setMyClub] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [newMember, setNewMember] = useState({ 
    first_name: '', 
    last_name: '', 
    elo: '', 
    license_status: 'en_attente',
    category: 'Adulte',
    license_number: ''
  })
  const [activeTab, setActiveTab] = useState('membres')
  const [sortConfig, setSortConfig] = useState({ key: 'last_name', direction: 'asc' });

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
      const { data: clubData } = await supabase.from('clubs').select('*').eq('admin_id', session.user.id).maybeSingle(); 
      if (!clubData) { setMyClub(null); return; }
      setMyClub(clubData);
      const { data: membersData } = await supabase.from('members').select('*').eq('club_id', clubData.id);
      setMembers(membersData || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  async function toggleLicenseStatus(id, currentStatus) {
    const nextStatus = currentStatus === 'valide' ? 'expire' : currentStatus === 'expire' ? 'en_attente' : 'valide';
    await supabase.from('members').update({ license_status: nextStatus }).eq('id', id);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, license_status: nextStatus } : m));
  }

  async function updateClubTheme(field, value) {
    setMyClub(prev => ({ ...prev, [field]: value }));
    await supabase.from('clubs').update({ [field]: value }).eq('id', myClub.id);
  }

  async function deleteMember(id) {
    if (!window.confirm("Supprimer ce membre ?")) return;
    await supabase.from('members').delete().eq('id', id);
    setMembers(prev => prev.filter(m => m.id !== id));
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
      const prompt = `Extrais les membres du club d'échecs depuis cette image. 
Pour chaque joueur, récupère : le NOM (en majuscules), le Prénom, l'ELO actuel, et le Numéro de licence si visible.
Réponds uniquement en JSON sous cette forme : 
[{"last_name": "NOM", "first_name": "Prenom", "elo": 1500, "license_number": "A12345"}]`;
      const result = await model.generateContent([prompt, { inlineData: { data: imageData, mimeType: file.type } }]);
      const rawData = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());
      const formatted = rawData.map(m => ({ 
        ...m, 
        last_name: m.last_name.toUpperCase(), 
        club_id: myClub.id, 
        elo: parseInt(m.elo) || 0, 
        license_status: 'en_attente',
        category: 'Adulte' 
      }));
      await supabase.from('members').upsert(formatted, { onConflict: 'first_name, last_name, club_id' });
      fetchClubAndMembers();
    } catch (error) { alert(error.message); }
    setLoading(false);
  }

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-black text-indigo-600 animate-pulse italic uppercase tracking-widest text-sm">Chargement...</div>

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center border border-white">
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
        <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter italic text-slate-900">Accès en attente</h2>
        <button onClick={() => supabase.auth.signOut()} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest">Déconnexion</button>
      </div>
    </div>
  )

  const dynamicRadius = myClub.border_radius || '1.2rem';
  const dynamicFontFamily = myClub.custom_font ? `'${myClub.custom_font}', sans-serif` : 'inherit';
  const defaultFontClass = myClub.font_family || 'font-sans';

  return (
    <div 
      className={`min-h-screen bg-[#F8FAFC] flex antialiased text-slate-900 overflow-x-hidden italic uppercase ${myClub.custom_font ? '' : defaultFontClass}`}
      style={{ fontFamily: dynamicFontFamily }}
    >
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-slate-900 text-slate-400 hidden lg:flex flex-col shrink-0 border-r border-slate-800">
        <div className="h-32 flex items-center px-8 border-b border-slate-800/50">
          <div className="flex items-center gap-4 overflow-hidden">
            {myClub.logo_url ? (
              <img src={myClub.logo_url} className="w-12 h-12 object-contain bg-white/5 p-1 rounded-xl shrink-0" />
            ) : (
              <div className="p-2 bg-indigo-500/10 rounded-xl shrink-0"><Trophy size={24} style={{ color: myClub.primary_color || '#6366f1' }} /></div>
            )}
            <span className="text-white font-black text-xl tracking-tighter italic uppercase truncate">{myClub.name.split(' ')[0]}</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 mt-6 space-y-2 font-black">
          <button onClick={() => setActiveTab('membres')} 
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl w-full transition-all border ${activeTab === 'membres' ? 'bg-slate-800 text-white border-slate-700 shadow-inner' : 'border-transparent hover:text-white hover:bg-slate-800/50'}`}>
            <Users size={20} /> Membres
          </button>
          
          <button onClick={() => setActiveTab('finance')} 
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl w-full transition-all border ${activeTab === 'finance' ? 'bg-slate-800 text-white border-slate-700 shadow-inner' : 'border-transparent hover:text-white hover:bg-slate-800/50'}`}>
            <Euro size={20} /> Trésorerie
          </button>

          <button onClick={() => setActiveTab('calendrier')} 
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl w-full transition-all border ${activeTab === 'calendrier' ? 'bg-slate-800 text-white border-slate-700 shadow-inner' : 'border-transparent hover:text-white hover:bg-slate-800/50'}`}>
            <CalendarIcon size={20} /> Calendrier
          </button>

          <button onClick={() => setActiveTab('parametres')} 
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl w-full transition-all border ${activeTab === 'parametres' ? 'bg-slate-800 text-white border-slate-700 shadow-inner' : 'border-transparent hover:text-white hover:bg-slate-800/50'}`}>
            <Settings size={20} /> Paramètres
          </button>
        </nav>

        <div className="p-8 border-t border-slate-800/20">
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 rounded-2xl w-full font-bold transition-all text-sm italic uppercase">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-auto h-screen px-6 lg:px-12 py-10">
        <header className="flex justify-between items-center mb-12 italic uppercase">
          <div className="max-w-full overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase truncate" style={{ color: myClub.primary_color || '#1e293b' }}>
                {activeTab === 'membres' ? myClub.name : 
                 activeTab === 'finance' ? "Trésorerie" : 
                 activeTab === 'calendrier' ? "Calendrier" : "Paramètres"}
            </h2>
          </div>
          {activeTab === 'membres' && (
            <div className="relative group w-full md:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input className="pl-12 pr-8 py-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none w-full md:w-96 font-bold shadow-sm focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner uppercase" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          )}
        </header>

        {/* LOGIQUE D'AFFICHAGE DES ONGLETS */}
        <div className="pb-20">
            {activeTab === 'membres' ? (
              <MembersTab 
                members={members} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                newMember={newMember} setNewMember={setNewMember} handleImageUpload={handleImageUpload}
                toggleLicenseStatus={toggleLicenseStatus} deleteMember={deleteMember}
                requestSort={(key) => {
                  let direction = 'asc';
                  if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
                  setSortConfig({ key, direction });
                }}
                sortConfig={sortConfig} myClub={myClub} supabase={supabase}
                fetchClubAndMembers={fetchClubAndMembers}
              />
            ) : activeTab === 'finance' ? (
              <FinanceTab myClub={myClub} supabase={supabase} dynamicRadius={dynamicRadius} updateClubTheme={updateClubTheme} />
            ) : activeTab === 'calendrier' ? (
              <CalendarTab myClub={myClub} supabase={supabase} dynamicRadius={dynamicRadius} />
            ) : (
              <SettingsTab myClub={myClub} updateClubTheme={updateClubTheme} />
            )}
        </div>
      </main>
    </div>
  )
}