import React, { useState } from 'react'
import { 
  FileText, ShieldCheck, Clock, Upload, 
  Download, Trash2, Search, CheckCircle2, Loader2, ChevronUp, ChevronDown 
} from 'lucide-react'

// --- UTILITAIRE DE COMPRESSION (En dehors du composant) ---
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; // Optimisation pour documents
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEG 70% pour un rapport poids/qualité idéal
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.7);
      };
    };
  });
};

export default function DocumentsTab({ members, supabase, dynamicRadius, refreshData }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [processing, setProcessing] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'last_name', direction: 'asc' })

  // --- LOGIQUE DE TRI ---
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  const sortedMembers = [...members]
    .filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortConfig.key] || '';
      const valB = b[sortConfig.key] || '';
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  // --- FONCTION D'UPLOAD OPTIMISÉE ---
  async function handleFileUpload(e, memberId, docType) {
    let file = e.target.files[0];
    if (!file) return;

    // Blocage si fichier > 10 Mo
    if (file.size > 10 * 1024 * 1024) {
      alert("Le fichier est trop lourd (Max 10 Mo).");
      return;
    }

    const key = `${memberId}-${docType}`;
    setProcessing(key);

    try {
      // Compression si image pour éviter les lenteurs
      if (file.type.startsWith('image/')) {
        file = await compressImage(file);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${memberId}/${docType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('member-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const columnName = docType === 'certificat' ? 'doc_certificat' : 'doc_autorisation';
      
      const { error: updateError } = await supabase
        .from('members')
        .update({ [columnName]: fileName })
        .eq('id', memberId);

      if (updateError) throw updateError;
      
      refreshData();
    } catch (error) {
      alert("Erreur d'envoi : " + error.message);
    } finally {
      setProcessing(null);
    }
  }

  // --- FONCTION DE SUPPRESSION ---
  async function handleDeleteFile(memberId, filePath, docType) {
    if (!window.confirm("Supprimer ce document ?")) return;
    const key = `${memberId}-${docType}`;
    setProcessing(key);

    try {
      await supabase.storage.from('member-documents').remove([filePath]);
      const columnName = docType === 'certificat' ? 'doc_certificat' : 'doc_autorisation';
      await supabase.from('members').update({ [columnName]: null }).eq('id', memberId);
      refreshData();
    } catch (error) {
      alert("Erreur de suppression : " + error.message);
    } finally {
      setProcessing(null);
    }
  }

  async function downloadFile(path) {
    const { data } = await supabase.storage.from('member-documents').getPublicUrl(path);
    window.open(data.publicUrl, '_blank');
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'valide': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'en_attente': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'expire': return 'text-rose-500 bg-rose-50 border-rose-100';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 italic uppercase font-black">
      
      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-slate-100 shadow-sm flex items-center gap-4" style={{ borderRadius: dynamicRadius }}>
          <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200"><ShieldCheck size={24} /></div>
          <div>
            <p className="text-[10px] text-slate-400 tracking-widest font-black uppercase">Licences Valides</p>
            <p className="text-2xl text-slate-900 mt-1">{members.filter(m => m.license_status === 'valide').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 border border-slate-100 shadow-sm flex items-center gap-4" style={{ borderRadius: dynamicRadius }}>
          <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-200"><Clock size={24} /></div>
          <div>
            <p className="text-[10px] text-slate-400 tracking-widest font-black uppercase tracking-tighter">En Attente FFE</p>
            <p className="text-2xl text-slate-900 mt-1">{members.filter(m => m.license_status === 'en_attente').length}</p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 text-white shadow-xl" style={{ borderRadius: dynamicRadius }}>
          <p className="text-[9px] text-indigo-400 tracking-[0.2em] mb-2 font-black uppercase italic">Coffre-fort Premium</p>
          <p className="text-[10px] normal-case font-medium opacity-60 leading-tight italic">Optimisation automatique des flux documentaires.</p>
        </div>
      </div>

      {/* TABLEAU */}
      <div className="bg-white border border-slate-100 shadow-xl overflow-hidden" style={{ borderRadius: dynamicRadius }}>
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-sm tracking-tighter flex items-center gap-2 italic"><FileText size={20} className="text-indigo-600" /> Registre Documentaire</h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input className="pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-[10px] w-full md:w-64 outline-none font-black" placeholder="RECHERCHER..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] text-slate-400 tracking-widest border-b border-slate-50">
                <th className="p-6 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('last_name')}>
                   <div className="flex items-center gap-2">Membre {sortConfig.key === 'last_name' && (sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}</div>
                </th>
                <th className="p-6 text-center cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('license_status')}>
                   <div className="flex items-center justify-center gap-2">État Licence {sortConfig.key === 'license_status' && (sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}</div>
                </th>
                <th className="p-6 text-center">Certificat Médical</th>
                <th className="p-6 text-center cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('category')}>
                   <div className="flex items-center justify-center gap-2">Catégorie {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}</div>
                </th>
                <th className="p-6 text-right">Autorisation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors font-black uppercase italic">
                  <td className="p-6">
                    <p className="text-[11px] text-slate-900 leading-none">{member.last_name} {member.first_name}</p>
                    <p className="text-[8px] text-slate-400 mt-1">{member.license_number || 'SANS NUMÉRO'}</p>
                  </td>
                  
                  <td className="p-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[8px] border font-black ${getStatusColor(member.license_status)}`}>
                      {member.license_status}
                    </span>
                  </td>

                  <td className="p-6 text-center">
                    <DocActionCell 
                      loading={processing === `${member.id}-certificat`}
                      filePath={member.doc_certificat}
                      onUpload={(e) => handleFileUpload(e, member.id, 'certificat')}
                      onDelete={() => handleDeleteFile(member.id, member.doc_certificat, 'certificat')}
                      onDownload={() => downloadFile(member.doc_certificat)}
                    />
                  </td>

                  <td className="p-6 text-center text-[10px] text-slate-500">
                    {member.category}
                  </td>

                  <td className="p-6 text-right">
                    {member.category === 'Jeune' ? (
                      <DocActionCell 
                        loading={processing === `${member.id}-autorisation`}
                        filePath={member.doc_autorisation}
                        onUpload={(e) => handleFileUpload(e, member.id, 'autorisation')}
                        onDelete={() => handleDeleteFile(member.id, member.doc_autorisation, 'autorisation')}
                        onDownload={() => downloadFile(member.doc_autorisation)}
                      />
                    ) : <span className="text-[8px] text-slate-200">N/A</span>}
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

// --- SOUS-COMPOSANT DE CELLULE ---
function DocActionCell({ loading, filePath, onUpload, onDelete, onDownload }) {
  if (loading) return <div className="flex justify-center"><Loader2 size={16} className="animate-spin text-indigo-500" /></div>;
  
  if (filePath) {
    return (
      <div className="flex items-center justify-center gap-2 animate-in zoom-in duration-300">
        <button onClick={onDownload} className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all shadow-sm">
          <CheckCircle2 size={12} /> <span className="text-[7px] font-black uppercase tracking-tighter">Reçu</span>
        </button>
        <button onClick={onDelete} className="p-1 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={12} /></button>
      </div>
    );
  }

  return (
    <label className="flex flex-col items-center justify-center group cursor-pointer transition-all">
      <div className="p-2 bg-slate-50 text-slate-300 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all border border-dashed border-slate-200"><Upload size={14} /></div>
      <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={onUpload} />
    </label>
  );
}