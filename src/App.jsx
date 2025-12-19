import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Search, Trophy, LogOut } from 'lucide-react'

// Imports de configuration et composants
import { NAVIGATION_TABS } from './config/navigation'
import Login from './components/Login'
import DashboardTab from './tabs/DashboardTab' 
import FinanceTab from './tabs/FinanceTab'
import MembersTab from './tabs/MembersTab'
import SettingsTab from './tabs/SettingsTab'
import CalendarTab from './tabs/CalendarTab'
import DocumentsTab from './tabs/DocumentsTab'

export default function App() {
  const [session, setSession] = useState(null)
  const [myClub, setMyClub] = useState(null)
  const [isNotAdmin, setIsNotAdmin] = useState(false)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard') 
  const [memberFilter, setMemberFilter] = useState('tous') // État pour le filtrage automatique
  const [sortConfig, setSortConfig] = useState({ key: 'last_name', direction: 'asc' });

  const [newMember, setNewMember] = useState({ 
    first_name: '', last_name: '', elo: '', 
    license_status: 'en_attente', category: 'Adulte', license_number: ''
  })

  // 1. Gestion de la session utilisateur
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false);
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (!session) {
        setLoading(false);
        setMyClub(null);
        setIsNotAdmin(false);
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Chargement des données dès que la session est détectée
  useEffect(() => {
    if (session) {
      fetchClubAndMembers();
    }
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
        setIsNotAdmin(true); 
        setLoading(false);
        return;
      }

      setMyClub(clubData);
      setIsNotAdmin(false);

      const { data: membersData } = await supabase
        .from('members')
        .select('*')
        .eq('club_id', clubData.id);
      
      setMembers(membersData || []);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 3. Rendu dynamique des onglets avec logique de filtrage
  const renderTabContent = () => {
    if (!myClub) return null;

    const commonProps = { 
      myClub, 
      supabase, 
      dynamicRadius: myClub.border_radius || '1.2rem',
      updateClubTheme: async (field, value) => {
        setMyClub(prev => ({ ...prev, [field]: value }));
        await supabase.from('clubs').update({ [field]: value }).eq('id', myClub.id);
      }
    };
    
    switch (activeTab) {
      case 'dashboard': 
        return <DashboardTab 
          members={members} 
          {...commonProps}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            // Si on redirige vers membres depuis une alerte, on active le filtre
            if (tab === 'membres') setMemberFilter('en_attente'); 
            else setMemberFilter('tous');
          }} 
        />;
      case 'membres':
        return <MembersTab 
          members={members} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm}
          initialFilter={memberFilter} // Passe le filtre automatique
          newMember={newMember} 
          setNewMember={setNewMember} 
          fetchClubAndMembers={fetchClubAndMembers}
          sortConfig={sortConfig}
          requestSort={(key) => {
            let direction = 'asc';
            if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
            setSortConfig({ key, direction });
          }}
          {...commonProps}
          handleImageUpload={() => alert("Scanner IA activé")}
        />;
      case 'finance': return <FinanceTab {...commonProps} updateClubTheme={commonProps.updateClubTheme} />;
      case 'calendrier': return <CalendarTab {...commonProps} />;
      case 'documents': return <DocumentsTab members={members} refreshData={fetchClubAndMembers} {...commonProps} />;
      case 'parametres': return <SettingsTab {...commonProps} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-black text-indigo-600 animate-pulse italic uppercase tracking-widest text-sm">
        INITIALISATION...
      </div>
    );
  }

  if (!session || isNotAdmin) {
    return <Login supabase={supabase} isNotAdmin={isNotAdmin} handleLogout={handleLogout} />;
  }

  const currentTabLabel = NAVIGATION_TABS.find(t => t.id === activeTab)?.label;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex antialiased text-slate-900 overflow-x-hidden italic uppercase font-sans">
      
      {/* SIDEBAR */}
      {/* SIDEBAR */}
<aside className="w-72 bg-slate-900 text-slate-400 hidden lg:flex flex-col shrink-0 border-r border-slate-800">
  <div className="h-32 flex items-center px-6 border-b border-slate-800/50"> {/* Réduction légère du padding horizontal */}
    <div className="flex items-center gap-4 w-full"> {/* Ajout de w-full */}
      <div className="p-2 bg-indigo-500/10 rounded-xl shrink-0">
         <Trophy size={24} style={{ color: myClub?.primary_color || '#6366f1' }} />
      </div>
      {/* Modification ici : suppression de truncate et ajout de leading-tight */}
      <span className="text-white font-black text-lg tracking-tighter italic uppercase leading-tight break-words">
        {myClub?.name || "ADMIN"}
      </span>
    </div>
  </div>
  
  {/* ... reste de la Sidebar */}
        
        <nav className="flex-1 px-4 mt-6 space-y-2">
          {NAVIGATION_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id} 
                onClick={() => {
                   setActiveTab(tab.id);
                   setMemberFilter('tous'); // Réinitialise le filtre lors d'un clic manuel
                }} 
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl w-full transition-all border font-black ${activeTab === tab.id ? 'bg-slate-800 text-white border-slate-700 shadow-inner' : 'border-transparent hover:text-white hover:bg-slate-800/50'}`}
              >
                <Icon size={20} /> {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="p-8 border-t border-slate-800/20">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 rounded-2xl w-full font-bold transition-all text-sm italic uppercase tracking-widest">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ZONE DE CONTENU */}
      <main className="flex-1 overflow-auto h-screen px-6 lg:px-12 py-10">
  <header className="flex justify-between items-center mb-12">
    {/* Ajout de pr-2 pour éviter que l'italique ne soit coupé */}
    <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase truncate pr-2" 
        style={{ color: myClub?.primary_color || '#1e293b' }}>
      {activeTab === 'dashboard' ? "Tableau de Bord" : (activeTab === 'membres' ? myClub?.name : currentTabLabel)}
    </h2>
          {activeTab === 'membres' && (
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="pl-12 pr-8 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] w-full font-black shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all uppercase" 
                placeholder="RECHERCHER..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          )}
        </header>

        <div className="pb-20">
          {renderTabContent()}
        </div>
      </main>
    </div>
  )
}