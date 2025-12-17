import React, { useState, useEffect } from 'react'
import { Palette, Upload, Image as ImageIcon, Loader2, Layout, Type, Search } from 'lucide-react'
import { supabase } from './supabaseClient'

export default function SettingsTab({ myClub, updateClubTheme }) {
  const [uploading, setUploading] = useState(false)

  // Liste étendue de polices Google Fonts
  const googleFonts = [
    "Inter", "Roboto", "Open Sans", "Montserrat", "Playfair Display", 
    "Oswald", "Lato", "Poppins", "Raleway", "Merriweather", 
    "Ubuntu", "Lora", "Fira Sans", "Quicksand", "Bebas Neue", "Space Grotesk"
  ];

  // Injection dynamique de la police choisie dans le document
  useEffect(() => {
    const fontToLoad = myClub.custom_font || (myClub.font_family === 'font-serif' ? 'Playfair Display' : 'Inter');
    const linkId = 'dynamic-google-font';
    
    // Nettoyage de l'ancien lien s'il existe
    let link = document.getElementById(linkId);
    if (link) link.remove();

    link = document.createElement('link');
    link.id = linkId;
    link.href = `https://fonts.googleapis.com/css2?family=${fontToLoad.replace(/\s+/g, '+')}:wght@400;700;900&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, [myClub.custom_font, myClub.font_family]);

  const radiusOptions = [
    { label: 'Anguleux', value: '0.375rem', desc: 'Sérieux & Classique' },
    { label: 'Moderne', value: '1.2rem', desc: 'Équilibré & Pro' },
    { label: 'Arrondi', value: '2.5rem', desc: 'Doux & Moderne' }
  ];

  const fontOptions = [
    { label: 'Standard Sans', value: 'font-sans', desc: 'Interface actuelle' },
    { label: 'Elegant Serif', value: 'font-serif', desc: 'Tradition' },
    { label: 'Tech Mono', value: 'font-mono', desc: 'Data & Précision' }
  ];

  async function handleLogoUpload(e) {
    try {
      setUploading(true)
      const file = e.target.files[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${myClub.id}-${Math.random()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('logos').getPublicUrl(fileName)
      await updateClubTheme('logo_url', data.publicUrl)
      alert("Logo mis à jour avec succès !")
    } catch (error) {
      alert("Erreur lors de l'envoi : " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const dynamicRadius = myClub.border_radius || '1.2rem';
  const dynamicFontFamily = myClub.custom_font ? `'${myClub.custom_font}', sans-serif` : 'inherit';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20" style={{ fontFamily: dynamicFontFamily }}>
      
      {/* SECTION LOGO */}
      <div className="bg-white p-10 border border-slate-200 shadow-sm transition-all duration-500" style={{ borderRadius: dynamicRadius }}>
        <div className="flex items-center gap-5 mb-10">
          <div className="p-5 rounded-[1.5rem] bg-amber-50 text-amber-600"><ImageIcon size={32} /></div>
          <div>
            <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-800 italic">Logo du Club</h4>
            <p className="text-sm text-slate-400 font-medium italic">Il sera visible sur la console et l'application mobile.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-40 h-40 bg-slate-50 border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all" style={{ borderRadius: dynamicRadius }}>
            {myClub.logo_url ? (
              <img src={myClub.logo_url} alt="Logo" className="w-full h-full object-contain p-4" />
            ) : (
              <ImageIcon size={40} className="text-slate-300" />
            )}
          </div>
          <div className="flex-1 space-y-4">
            <label className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest cursor-pointer shadow-xl active:scale-95 transition-all" style={{ borderRadius: dynamicRadius }}>
              {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              {uploading ? "Envoi en cours..." : "Changer le logo"}
              <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} className="hidden" />
            </label>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Format recommandé : PNG ou SVG (fond transparent)</p>
          </div>
        </div>
      </div>

      {/* SECTION TYPOGRAPHIE */}
      <div className="bg-white p-10 border border-slate-200 shadow-sm transition-all duration-500" style={{ borderRadius: dynamicRadius }}>
        <div className="flex items-center gap-5 mb-10">
          <div className="p-5 rounded-[1.5rem] bg-emerald-50 text-emerald-600"><Type size={32} /></div>
          <div>
            <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-800 italic">Typographie</h4>
            <p className="text-sm text-slate-400 font-medium italic">Définissez le caractère visuel de votre club.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {fontOptions.map((f) => (
            <button 
              key={f.value} 
              onClick={() => {
                updateClubTheme('font_family', f.value);
                updateClubTheme('custom_font', null); 
              }}
              className={`p-6 text-left border-2 transition-all group ${myClub.font_family === f.value && !myClub.custom_font ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-white'}`}
              style={{ borderRadius: dynamicRadius }}
            >
              <p className={`text-2xl mb-2 ${f.value}`}>Aa</p>
              <p className="font-black uppercase text-xs text-slate-900">{f.label}</p>
              <p className="text-[10px] text-slate-400 font-bold italic mt-1">{f.desc}</p>
            </button>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <Search size={18} className="text-slate-400" />
            <h5 className="font-black uppercase text-xs text-slate-500 tracking-widest">Bibliothèque Google Fonts</h5>
          </div>
          <select 
            value={myClub.custom_font || ""}
            onChange={(e) => updateClubTheme('custom_font', e.target.value)}
            className="w-full p-5 bg-slate-50 border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
            style={{ borderRadius: dynamicRadius }}
          >
            <option value="">-- Sélectionner une police personnalisée --</option>
            {googleFonts.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION FORMES & COULEURS */}
      <div className="bg-white p-10 border border-slate-200 shadow-sm transition-all duration-500" style={{ borderRadius: dynamicRadius }}>
        <div className="flex items-center gap-5 mb-10">
          <div className="p-5 rounded-[1.5rem] bg-indigo-50 text-indigo-600"><Layout size={32} /></div>
          <div>
            <h4 className="text-2xl font-black uppercase tracking-tighter text-slate-800 italic">Style & Couleurs</h4>
            <p className="text-sm text-slate-400 font-medium italic">Ajustez les formes et l'ambiance colorée.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {radiusOptions.map((opt) => (
            <button 
              key={opt.value} 
              onClick={() => updateClubTheme('border_radius', opt.value)}
              className={`p-6 text-left border-2 transition-all ${myClub.border_radius === opt.value ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-white'}`}
              style={{ borderRadius: opt.value }}
            >
              <div className="w-12 h-8 mb-4 border-2 border-slate-300" style={{ borderRadius: opt.value }} />
              <p className="font-black uppercase text-xs text-slate-900 tracking-widest">{opt.label}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Couleur Primaire</label>
            <div className="flex items-center gap-4">
              <input type="color" value={myClub.primary_color || '#6366f1'} onChange={(e) => updateClubTheme('primary_color', e.target.value)} className="w-20 h-20 rounded-3xl cursor-pointer border-8 border-slate-50 shadow-inner" />
              <code className="bg-slate-50 px-4 py-2 rounded-lg font-bold text-indigo-600 uppercase">{myClub.primary_color}</code>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Couleur Secondaire</label>
            <div className="flex items-center gap-4">
              <input type="color" value={myClub.secondary_color || '#f43f5e'} onChange={(e) => updateClubTheme('secondary_color', e.target.value)} className="w-20 h-20 rounded-3xl cursor-pointer border-8 border-slate-50 shadow-inner" />
              <code className="bg-slate-50 px-4 py-2 rounded-lg font-bold text-rose-600 uppercase">{myClub.secondary_color}</code>
            </div>
          </div>
        </div>

        {/* APERÇU MOBILE FINAL */}
        <div className="mt-16 flex flex-col items-center">
          <h5 className="font-black text-[10px] uppercase mb-10 text-slate-400 italic tracking-[0.3em]">Simulation Application Membre</h5>
          <div className="w-72 h-[480px] bg-white shadow-2xl border-[10px] border-slate-900 overflow-hidden flex flex-col transition-all duration-500"
               style={{ borderRadius: myClub.border_radius === '2.5rem' ? '4rem' : '2rem' }}>
            
            <div className="h-24 w-full flex items-center justify-center p-6 shrink-0" 
                 style={{ background: `linear-gradient(135deg, ${myClub.primary_color} 0%, ${myClub.secondary_color} 100%)` }}>
              {myClub.logo_url ? (
                <img src={myClub.logo_url} alt="logo" className="h-full object-contain brightness-0 invert" />
              ) : (
                <span className="text-white font-black text-sm italic uppercase tracking-widest">{myClub.name.split(' ')[0]}</span>
              )}
            </div>

            <div className="flex-1 p-6 space-y-6">
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-slate-100 rounded-full" />
                <div className="h-3 w-1/2 bg-slate-50 rounded-full" />
              </div>
              
              <div className="p-4 bg-slate-50 border border-slate-100 space-y-3" style={{ borderRadius: dynamicRadius }}>
                <div className="flex justify-between items-center">
                  <div className="h-2 w-16 bg-slate-200 rounded-full" />
                  <div className="h-5 w-5 bg-indigo-100 rounded-full" />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full" />
              </div>

              <div className="h-14 w-full flex items-center justify-center text-[11px] font-black uppercase text-white shadow-xl transition-all"
                   style={{ borderRadius: dynamicRadius, backgroundColor: myClub.primary_color }}>
                Accéder à ma licence
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}