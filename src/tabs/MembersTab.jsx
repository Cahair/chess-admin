import React, { useState, useEffect } from 'react'
import { 
  Users, Plus, BrainCircuit, Trash2, TrendingUp, Star, 
  CheckCircle2, Clock, AlertCircle, ChevronUp, ChevronDown, 
  ArrowUpDown 
} from 'lucide-react'

// Importation corrigée pour remonter à la racine de src
import { supabase as supabaseClient } from "../supabaseClient";

export default function MembersTab({ 
  members = [], 
  searchTerm = '', 
  setSearchTerm, 
  newMember, 
  setNewMember, 
  handleImageUpload, 
  toggleLicenseStatus, 
  deleteMember, 
  requestSort, 
  sortConfig, 
  myClub, 
  supabase, 
  fetchClubAndMembers,
  initialFilter = 'tous' // Nouvelle prop pour le filtrage automatique
}) {
  
  // État local pour gérer le filtre de statut (tous, en_attente, valide)
  const [statusFilter, setStatusFilter] = useState(initialFilter);

  // Synchronisation du filtre si initialFilter change (ex: clic sur urgence depuis le dashboard)
  useEffect(() => {
    setStatusFilter(initialFilter);
  }, [initialFilter]);

  // SÉCURITÉ : Si les données du club ne sont pas encore chargées, on ne rend rien 
  if (!myClub) {
    return (
      <div className="p-10 text-center font-black italic text-slate-400 animate-pulse uppercase tracking-widest">
        Initialisation du registre...
      </div>
    );
  }

  const client = supabase || supabaseClient;
  const dynamicRadius = myClub?.border_radius || '1rem';

  const getSortedMembers = (list) => {
    return [...list].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (sortConfig.key === 'elo') return sortConfig.direction === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      valA = valA?.toString().toLowerCase() || "";
      valB = valB?.toString().toLowerCase() || "";
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // LOGIQUE DE FILTRAGE MISE À JOUR : prend en compte la recherche ET le statut
  const filteredAndSortedMembers = getSortedMembers(
    members.filter(m => {
      const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase());
      
      // Filtre de statut
      if (statusFilter === 'en_attente') {
        return matchesSearch && m.license_status === 'en_attente';
      }
      if (statusFilter === 'valide') {
        return matchesSearch && m.license_status === 'valide';
      }
      
      return matchesSearch;
    })
  );

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={14} className="opacity-20 group-hover:opacity-100" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-indigo-600" /> : <ChevronDown size={14} className="text-indigo-600" />;
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 italic">
        <StatCard icon={<Users />} label="Effectif" value={`${members.length} membres`} color="blue" themeColor={myClub?.primary_color} radius={dynamicRadius} />
        <StatCard icon={<Clock />} label="À Valider" value={`${members.filter(m => m.license_status === 'en_attente').length}`} color="amber" themeColor={myClub?.secondary_color} radius={dynamicRadius} />
        <StatCard icon={<CheckCircle2 />} label="Licenciés" value={`${members.filter(m => m.license_status === 'valide').length}`} color="emerald" themeColor="#10b981" radius={dynamicRadius} />
      </div>

      {/* BARRE DE FILTRES RAPIDES (PASTELS) */}
      <div className="flex flex-wrap gap-4 font-black italic uppercase">
        <button 
          onClick={() => setStatusFilter('tous')}
          className={`px-6 py-3 rounded-2xl text-[9px] tracking-widest border transition-all ${statusFilter === 'tous' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
          style={{ borderRadius: `calc(${dynamicRadius} / 1.5)` }}
        >
          Tous les membres
        </button>
        <button 
          onClick={() => setStatusFilter('en_attente')}
          className={`px-6 py-3 rounded-2xl text-[9px] tracking-widest border transition-all ${statusFilter === 'en_attente' ? 'bg-rose-500 text-white shadow-lg' : 'bg-rose-50 text-rose-400 border-rose-100'}`}
          style={{ borderRadius: `calc(${dynamicRadius} / 1.5)` }}
        >
          En attente ({members.filter(m => m.license_status === 'en_attente').length})
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
        {/* FORMULAIRE D'AJOUT */}
        <div className="xl:col-span-2 bg-white p-8 border border-slate-200 shadow-sm flex flex-col justify-center" style={{ borderRadius: dynamicRadius }}>
          <h3 className="text-[10px] font-black mb-6 uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3"><Plus size={16} /> Nouveau Licencié</h3>
          <form className="grid grid-cols-1 lg:grid-cols-2 gap-4" onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await client.from('members').insert([{ 
                ...newMember, 
                elo: parseInt(newMember.elo) || 0, 
                club_id: myClub.id,
                category: newMember.category || 'Adulte'
            }]);
            if (!error) {
              setNewMember({ first_name: '', last_name: '', elo: '', license_status: 'en_attente', category: 'Adulte', license_number: '' });
              fetchClubAndMembers();
            }
          }}>
            <input className="bg-slate-50 border-none px-5 py-4 font-bold outline-none shadow-inner text-sm uppercase" style={{ borderRadius: dynamicRadius }} placeholder="Prénom" value={newMember.first_name} onChange={e => setNewMember({...newMember, first_name: e.target.value})} required />
            <input className="bg-slate-50 border-none px-5 py-4 font-bold outline-none shadow-inner text-sm uppercase" style={{ borderRadius: dynamicRadius }} placeholder="Nom" value={newMember.last_name} onChange={e => setNewMember({...newMember, last_name: e.target.value})} required />
            
            <div className="grid grid-cols-2 gap-4">
                <input className="bg-slate-50 border-none px-5 py-4 font-bold text-center text-sm uppercase shadow-inner" style={{ borderRadius: dynamicRadius }} type="number" placeholder="ELO" value={newMember.elo} onChange={e => setNewMember({...newMember, elo: e.target.value})} />
                <input className="bg-slate-50 border-none px-5 py-4 font-bold text-center text-sm uppercase shadow-inner" style={{ borderRadius: dynamicRadius }} placeholder="N° Licence" value={newMember.license_number} onChange={e => setNewMember({...newMember, license_number: e.target.value})} />
            </div>

            <select 
              className="bg-slate-50 border-none px-5 py-4 font-bold outline-none shadow-inner text-sm uppercase" 
              style={{ borderRadius: dynamicRadius }}
              value={newMember.category || 'Adulte'} 
              onChange={e => setNewMember({...newMember, category: e.target.value})}
            >
              <option value="Adulte">Catégorie : Adulte</option>
              <option value="Jeune">Catégorie : Jeune</option>
              <option value="Retraite">Catégorie : Retraité</option>
            </select>

            <button type="submit" className="lg:col-span-2 h-[52px] px-10 font-black uppercase text-[10px] tracking-widest text-white shadow-lg transition-transform active:scale-95" style={{ backgroundColor: myClub?.primary_color || '#1e293b', borderRadius: dynamicRadius }}>
                Ajouter le membre au registre
            </button>
          </form>
        </div>

        {/* SCANNER IA */}
        <div className="p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[250px]" 
             style={{ background: `linear-gradient(135deg, ${myClub?.primary_color || '#6366f1'} 0%, ${myClub?.secondary_color || '#4338ca'} 100%)`, borderRadius: dynamicRadius }}>
          <BrainCircuit className="absolute -right-12 -bottom-12 text-white/10" size={250} />
          <div className="relative z-10 text-center">
            <h3 className="text-3xl font-black mb-1 italic uppercase tracking-tighter leading-none">Scanner IA</h3>
            <a href="http://www.echecs.asso.fr/ListeClubs.aspx" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/70 underline block mb-6 hover:text-white transition-colors uppercase font-bold tracking-widest">
              Ouvrir la liste FFE
            </a>
            <label className="bg-white px-8 py-4 font-black cursor-pointer inline-block shadow-2xl text-[11px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95" style={{ color: myClub?.primary_color || '#6366f1', borderRadius: dynamicRadius }}>
              Mettre à jour via capture
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* TABLEAU DES MEMBRES */}
      <div className="bg-white shadow-sm border border-slate-200 overflow-hidden mb-20" style={{ borderRadius: dynamicRadius }}>
        <div className="px-8 lg:px-12 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs italic">Registre des membres</h3>
          <span className="text-[10px] font-black bg-white px-4 py-2 rounded-full border border-slate-200 text-slate-400 uppercase tracking-tighter italic shadow-sm">{filteredAndSortedMembers.length} Licenciés</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="px-8 lg:px-12 py-6 pl-14 cursor-pointer group hover:bg-slate-50" onClick={() => requestSort('last_name')}>
                  <div className="flex items-center gap-2">Licencié <SortIcon column="last_name" /></div>
                </th>
                <th className="px-8 lg:px-12 py-6 text-center">Catégorie</th>
                <th className="px-8 lg:px-12 py-6 text-center cursor-pointer group hover:bg-slate-50" onClick={() => requestSort('elo')}>
                  <div className="flex items-center justify-center gap-2">Niveau ELO <SortIcon column="elo" /></div>
                </th>
                <th className="px-8 lg:px-12 py-6 text-center cursor-pointer group hover:bg-slate-50" onClick={() => requestSort('license_status')}>
                  <div className="flex items-center justify-center gap-2">État Licence <SortIcon column="license_status" /></div>
                </th>
                <th className="px-8 lg:px-12 py-6 text-right uppercase font-black text-slate-400 tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAndSortedMembers.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/40 transition-colors group">
                  <td className="px-8 lg:px-12 py-6 flex items-center gap-4 lg:gap-6 min-w-[300px] uppercase">
                    <div className="w-12 h-12 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0 transition-all group-hover:scale-110" 
                         style={{ backgroundColor: myClub?.primary_color || '#6366f1', borderRadius: `calc(${dynamicRadius} / 2)` }}>
                      {m.first_name?.[0]}{m.last_name?.[0]}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 italic uppercase tracking-tight text-lg leading-tight">{m.last_name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{m.first_name} {m.license_number && `• ${m.license_number}`}</div>
                    </div>
                  </td>
                  <td className="px-8 lg:px-12 py-6 text-center">
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-md uppercase">
                      {m.category || 'Adulte'}
                    </span>
                  </td>
                  <td className="px-8 lg:px-12 py-6 text-center">
                    <span className="bg-slate-50 px-4 lg:px-6 py-2 rounded-full font-black text-[11px] text-slate-600 border border-slate-100">
                      {m.elo} PTS
                    </span>
                  </td>
                  <td className="px-8 lg:px-12 py-6 text-center">
                    <button 
                      onClick={() => toggleLicenseStatus(m.id, m.license_status)}
                      className={`flex items-center gap-2 mx-auto px-4 py-2 font-black text-[10px] uppercase tracking-wider transition-all border-2 ${
                        m.license_status === 'valide' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        m.license_status === 'expire' ? 'bg-red-50 text-red-600 border-red-100' : 
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}
                      style={{ borderRadius: `calc(${dynamicRadius} / 2)` }}
                    >
                      {m.license_status === 'valide' ? <CheckCircle2 size={14}/> : m.license_status === 'expire' ? <AlertCircle size={14}/> : <Clock size={14}/>}
                      {m.license_status?.replace('_', ' ')}
                    </button>
                  </td>
                  <td className="px-8 lg:px-12 py-6 text-right">
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
  )
}

function StatCard({ icon, label, value, color, themeColor, radius }) {
  const colors = { 
    blue: "bg-blue-50 text-blue-600", 
    emerald: "bg-emerald-100 text-emerald-700", 
    amber: "bg-amber-50 text-amber-600" 
  };
  return (
    <div className="bg-white p-6 lg:p-8 border border-slate-200 shadow-sm flex items-center gap-5 h-full min-w-0" style={{ borderRadius: radius }}>
      <div className={`${colors[color] || colors.blue} p-4 lg:p-5 rounded-[1.2rem] shadow-inner shrink-0`}>
        {icon && React.isValidElement(icon) ? React.cloneElement(icon, { size: 28, style: { color: themeColor || '#4f46e5' } }) : null}
      </div>
      <div className="min-w-0 uppercase italic">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 truncate">{label}</p>
        <p className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter truncate leading-none">{value}</p>
      </div>
    </div>
  )
}