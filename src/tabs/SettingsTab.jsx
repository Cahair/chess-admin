import React, { useState, useEffect } from 'react'
import { 
  Palette, Upload, Image as ImageIcon, Loader2, 
  Layout, Type, Smartphone, ShieldCheck,
  Users, Calendar, Trophy, Menu, Sparkles, Wand2, Plus
} from 'lucide-react'

export default function SettingsTab({ myClub, supabase, updateClubTheme }) {
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const googleFonts = ["Inter", "Roboto", "Montserrat", "Playfair Display", "Oswald", "Poppins", "Bebas Neue", "Space Grotesk"];

  const radiusOptions = [
    { label: 'Anguleux', value: '0.375rem' },
    { label: 'Moderne', value: '1.2rem' },
    { label: 'Arrondi', value: '2.5rem' }
  ];

  useEffect(() => {
    if (!myClub) return;
    const fontToLoad = myClub.custom_font || (myClub.font_family === 'font-serif' ? 'Playfair Display' : 'Inter');
    const linkId = 'dynamic-google-font';
    let link = document.getElementById(linkId);
    if (link) link.remove();
    link = document.createElement('link');
    link.id = linkId;
    link.href = `https://fonts.googleapis.com/css2?family=${fontToLoad.replace(/\s+/g, '+')}:wght@400;700;900&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, [myClub?.custom_font, myClub?.font_family]);

  const handleAiDesign = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-design', {
        body: { prompt: aiPrompt, fonts: googleFonts }
      });
      if (error) throw error;
      const jsonMatch = typeof data === 'string' ? data.match(/\{[\s\S]*\}/) : null;
      const aiConfig = jsonMatch ? JSON.parse(jsonMatch[0]) : data;

      if (aiConfig) {
        if (aiConfig.primary_color) await updateClubTheme('primary_color', aiConfig.primary_color);
        if (aiConfig.secondary_color) await updateClubTheme('secondary_color', aiConfig.secondary_color);
        if (aiConfig.accent_color) await updateClubTheme('accent_color', aiConfig.accent_color);
        if (aiConfig.border_radius) await updateClubTheme('border_radius', aiConfig.border_radius);
        if (aiConfig.custom_font) await updateClubTheme('custom_font', aiConfig.custom_font);
        if (aiConfig.slogan) await updateClubTheme('slogan', aiConfig.slogan);
      }
      setAiPrompt("");
      alert("IA : Design appliqué avec succès !");
    } catch (e) {
      alert(`Erreur technique : ${e.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleMobileModule = async (f) => await updateClubTheme(f, !(myClub[f] ?? true));

  async function handleLogoUpload(e) {
    try {
      setUploading(true)
      const file = e.target.files[0]; if (!file) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${myClub.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
      await updateClubTheme('logo_url', data.publicUrl);
    } catch (error) {
      alert("Erreur : " + error.message);
    } finally { setUploading(false); }
  }

  const dynamicRadius = myClub?.border_radius || '1.2rem';
  const primary = myClub?.primary_color || '#6366f1';
  const secondary = myClub?.secondary_color || '#f43f5e';
  const accent = myClub?.accent_color || '#10b981';

  if (!myClub) return null;

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fadeIn italic font-black uppercase text-slate-800">
      <div className="mb-12">
        <h2 className="text-4xl text-slate-900 mb-2 tracking-tighter">Paramètres du Club</h2>
        <p className="text-slate-400 text-sm normal-case font-medium tracking-wide">Personnalisez l'identité visuelle et les fonctionnalités de votre application.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* CONFIGURATION (GAUCHE) */}
        <div className="lg:col-span-7 space-y-12">
          
          {/* 1. ASSISTANT IA PREMIUM */}
          <div 
            className="relative p-[1px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-[0_20px_50px_rgba(79,70,229,0.3)] group"
            style={{ borderRadius: dynamicRadius }}
          >
            <div 
              className="relative bg-slate-900/95 backdrop-blur-2xl p-10 overflow-hidden"
              style={{ borderRadius: `calc(${dynamicRadius} - 1px)` }}
            >
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] animate-pulse delay-700" />
                <Sparkles className="absolute right-4 top-4 text-white/[0.03] rotate-12 group-hover:text-white/[0.07] transition-all duration-1000" size={200} />
              </div>

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] text-indigo-300 tracking-[0.3em] font-black italic">
                        Assistant IA // NEURAL INTERFACE
                      </span>
                    </div>
                    <h4 className="text-4xl text-white tracking-tighter flex items-center gap-5 font-black">
                      <Wand2 size={36} className="text-indigo-400 drop-shadow-[0_0_20px_rgba(129,140,248,0.8)]" /> 
                      DESIGN INTELLIGENT
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-[220px] leading-relaxed italic opacity-60 font-medium normal-case">
                    Redéfinissez votre identité visuelle par une simple commande textuelle.
                  </p>
                </div>

                <div className="relative flex items-center gap-4">
                  <div className="relative flex-1 group/input">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-10 group-hover/input:opacity-25 transition duration-500" />
                    <input 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="DÉCRIVEZ VOTRE VISION CRÉATIVE..." 
                      className="relative w-full bg-slate-950/60 border border-white/10 p-7 rounded-2xl text-lg text-white placeholder:text-white/10 outline-none focus:border-indigo-500/40 focus:bg-slate-950/90 transition-all font-bold tracking-widest shadow-2xl"
                    />
                  </div>
                  <button 
                    onClick={handleAiDesign}
                    disabled={aiLoading}
                    className="relative h-[82px] px-12 rounded-2xl bg-white text-slate-950 hover:bg-indigo-50 transition-all active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)] disabled:opacity-50 overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-indigo-200/30 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite] transition-transform" />
                    <div className="relative flex items-center justify-center gap-4">
                      {aiLoading ? <Loader2 size={30} className="animate-spin text-indigo-600" /> : <><span className="font-black text-base tracking-tighter">GÉNÉRER</span><Sparkles size={24} className="group-hover:rotate-45 transition-transform duration-500" /></>}
                    </div>
                  </button>
                </div>
                
                <div className="mt-8 flex items-center gap-8">
                  <div className="flex gap-1.5">{[1,2,3,4].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500/30" />)}</div>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                  <div className="flex items-center gap-3 opacity-30 group-hover:opacity-60 transition-opacity">
                    <span className="text-[9px] tracking-[0.5em] text-white font-black italic">SECURE CONNECTION</span>
                    <ShieldCheck size={12} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: IDENTITÉ VISUELLE */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-slate-400 border-b border-slate-200 pb-4">
              <Palette size={20} />
              <span className="tracking-widest text-sm">Identité Visuelle</span>
            </div>

            {/* LOGO & POLICE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 border border-slate-100 shadow-sm flex flex-col justify-between" style={{ borderRadius: dynamicRadius }}>
                <p className="text-xs text-slate-400 mb-6 tracking-widest flex items-center gap-3 uppercase font-black italic"><ImageIcon size={20}/> Logo Club</p>
                <label className="flex items-center gap-6 cursor-pointer group">
                  <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden rounded-2xl group-hover:border-indigo-400 transition-all shadow-inner">
                    {myClub.logo_url ? <img src={myClub.logo_url} className="w-full h-full object-contain p-2" /> : <Plus size={24} className="text-slate-300" />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 transition-all shadow-lg text-center">Parcourir</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>

              <div className="bg-white p-8 border border-slate-100 shadow-sm flex flex-col justify-between" style={{ borderRadius: dynamicRadius }}>
                <h5 className="text-xs text-slate-400 tracking-widest mb-6 flex items-center gap-3 uppercase font-black italic"><Type size={20}/> Typographie</h5>
                <select 
                  value={myClub.custom_font || ""}
                  onChange={(e) => updateClubTheme('custom_font', e.target.value)}
                  className="w-full p-4 bg-slate-50 border-none font-black text-sm text-slate-700 outline-none rounded-2xl focus:ring-2 focus:ring-indigo-500/10 shadow-inner"
                >
                  <option value="">Police standard</option>
                  {googleFonts.map(font => <option key={font} value={font}>{font}</option>)}
                </select>
              </div>
            </div>

            {/* NUANCIER */}
            <div className="bg-white p-10 border border-slate-100 shadow-sm" style={{ borderRadius: dynamicRadius }}>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-slate-50 rounded-xl text-slate-500"><Palette size={24} /></div>
                <h4 className="text-xl tracking-tighter">Palette de Couleurs</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <ColorPicker label="Primaire" value={primary} onChange={(v) => updateClubTheme('primary_color', v)} />
                <ColorPicker label="Secondaire" value={secondary} onChange={(v) => updateClubTheme('secondary_color', v)} />
                <ColorPicker label="Accent" value={accent} onChange={(v) => updateClubTheme('accent_color', v)} />
              </div>
              <div className="pt-6 border-t border-slate-50">
                <p className="text-[10px] text-slate-300 mb-3 font-black tracking-widest uppercase">Préréglages</p>
                <div className="flex gap-3">
                  {[
                    {p: '#1e293b', s: '#f43f5e', a: '#38bdf8'},
                    {p: '#1a472a', s: '#d4af37', a: '#ffffff'},
                    {p: '#4f46e5', s: '#10b981', a: '#f59e0b'},
                  ].map((c, i) => (
                    <button key={i} onClick={() => { updateClubTheme('primary_color', c.p); updateClubTheme('secondary_color', c.s); updateClubTheme('accent_color', c.a); }} className="w-14 h-6 rounded-lg flex overflow-hidden border border-slate-100 hover:scale-110 transition-transform shadow-sm">
                      <div className="flex-1" style={{backgroundColor: c.p}}/><div className="flex-1" style={{backgroundColor: c.s}}/><div className="flex-1" style={{backgroundColor: c.a}}/>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* BORDURES */}
            <div className="bg-white p-10 border border-slate-100 shadow-sm" style={{ borderRadius: dynamicRadius }}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-500"><Layout size={24} /></div>
                  <h4 className="text-xl tracking-tighter">Style des Formes</h4>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 px-3 py-1 rounded-lg text-slate-500 font-bold tracking-widest">{myClub.border_radius || '1.2rem'}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {radiusOptions.map((opt) => (
                  <button 
                    key={opt.value} 
                    onClick={() => updateClubTheme('border_radius', opt.value)}
                    className={`py-4 text-center border-2 transition-all text-[10px] font-black tracking-[0.1em] ${myClub.border_radius === opt.value ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600' : 'border-slate-100 bg-white text-slate-400'}`}
                    style={{ borderRadius: opt.value }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <input 
                  type="range" min="0" max="4" step="0.1" 
                  value={parseFloat(myClub.border_radius) || 1.2} 
                  onChange={(e) => updateClubTheme('border_radius', `${e.target.value}rem`)}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* SECTION: FONCTIONNALITÉS */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-slate-400 border-b border-slate-200 pb-4">
              <Smartphone size={20} />
              <span className="tracking-widest text-sm">Application Mobile</span>
            </div>

            <div className="bg-indigo-50/50 p-10 border border-indigo-100 shadow-sm" style={{ borderRadius: dynamicRadius }}>
              <h4 className="text-xl tracking-tighter mb-8 flex items-center gap-4 font-black">
                <Smartphone size={24} className="text-indigo-500"/> Visibilité des Modules
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ModuleToggle label="Membres" isActive={myClub.show_mobile_members ?? true} onToggle={() => toggleMobileModule('show_mobile_members')} />
                <ModuleToggle label="Classements" isActive={myClub.show_mobile_elo ?? true} onToggle={() => toggleMobileModule('show_mobile_elo')} />
                <ModuleToggle label="Calendrier" isActive={myClub.show_mobile_calendar ?? true} onToggle={() => toggleMobileModule('show_mobile_calendar')} />
                <ModuleToggle label="Documents" isActive={myClub.show_mobile_docs ?? true} onToggle={() => toggleMobileModule('show_mobile_docs')} />
              </div>
            </div>
          </div>
        </div>

        {/* SIMULATEUR MOBILE (DROITE) */}
        <div className="lg:col-span-5 flex justify-center lg:sticky lg:top-10 animate-slideIn">
  <div className="relative w-[340px] h-[680px] bg-slate-900 rounded-[3.5rem] border-[10px] border-slate-800 shadow-2xl overflow-hidden">
    <div 
      className="absolute inset-0 flex flex-col font-black italic uppercase transition-colors duration-500" 
      style={{ 
        fontFamily: myClub.custom_font ? `'${myClub.custom_font}', sans-serif` : 'inherit',
        backgroundColor: `${secondary}10` // Utilisation de la couleur secondaire en fond léger
      }}
    >
      {/* Status Bar */}
      <div className="h-12 w-full bg-white/80 backdrop-blur-md flex items-center justify-between px-10 pt-6">
        <div className="text-[10px] font-mono font-bold text-slate-900">9:41</div>
        <div className="flex gap-1.5"><div className="w-4 h-2 bg-slate-900 rounded-full" /><div className="w-2 h-2 bg-slate-900 rounded-full" /></div>
      </div>

      {/* Header : Impact de la couleur Primaire */}
      <div 
        className="p-8 border-b shadow-lg transition-all duration-500" 
        style={{ backgroundColor: primary, borderColor: `${accent}30` }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden bg-white shadow-inner">
            {myClub.logo_url ? (
              <img src={myClub.logo_url} className="w-full h-full object-contain p-2" />
            ) : (
              <Trophy size={20} style={{ color: primary }} />
            )}
          </div>
          <span className="text-base tracking-tighter truncate w-40 text-white drop-shadow-md">
            {myClub.name || "NOM DU CLUB"}
          </span>
        </div>
        {myClub.slogan && (
          <p className="text-[9px] text-white/80 mt-4 tracking-[0.3em] font-black leading-tight">
            {myClub.slogan}
          </p>
        )}
      </div>

      {/* Cartes : Impact de la couleur Accent et Secondaire */}
      {/* Cartes : Impact de la couleur Accent et Secondaire */}
<div className="flex-1 p-8 space-y-5 overflow-y-auto no-scrollbar">
  {myClub.show_mobile_members !== false && (
    <MobileCard icon={<Users size={22}/>} label="Membres" color={accent} secondaryColor={secondary} radius={dynamicRadius} />
  )}
  {myClub.show_mobile_elo !== false && (
    <MobileCard icon={<Trophy size={22}/>} label="Elo" color={accent} secondaryColor={secondary} radius={dynamicRadius} />
  )}
  {myClub.show_mobile_calendar !== false && (
    <MobileCard icon={<Calendar size={22}/>} label="Agenda" color={accent} secondaryColor={secondary} radius={dynamicRadius} />
  )}
  {/* AJOUTEZ CETTE LIGNE POUR LES DOCUMENTS */}
  {myClub.show_mobile_docs !== false && (
    <MobileCard icon={<ShieldCheck size={22}/>} label="Documents" color={accent} secondaryColor={secondary} radius={dynamicRadius} />
  )}
</div>

      {/* Bottom Nav : Rappel Primaire & Accent */}
      <div className="h-24 bg-white border-t border-slate-100 flex items-center justify-around px-10 pb-4">
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: primary }} />
          <span className="text-[7px] text-slate-400">Home</span>
        </div>
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `${accent}40` }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: `${accent}40` }} />
      </div>
    </div>
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-slate-800 rounded-b-3xl" />
  </div>
        </div>
      </div>
    </div>
  )
}

function MobileCard({ icon, label, color, radius }) {
  return (
    <div className="bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-6 transition-all hover:scale-[1.02]" style={{ borderRadius: `calc(${radius} / 1.2)` }}>
      <div className="p-3.5 rounded-2xl shadow-sm" style={{ backgroundColor: `${color}15`, color: color }}>{icon}</div>
      <span className="text-[13px] tracking-widest font-black uppercase italic">{label}</span>
    </div>
  );
}

function ModuleToggle({ label, isActive, onToggle }) {
  return (
    <div className="flex items-center justify-between p-5 bg-white/50 rounded-3xl border border-transparent hover:border-white transition-all group shadow-sm">
      <span className="text-xs font-black tracking-widest text-slate-600 uppercase italic">{label}</span>
      <button onClick={onToggle} className={`relative w-14 h-7 rounded-full transition-colors duration-300 shadow-inner ${isActive ? 'bg-indigo-500' : 'bg-slate-200'}`}>
        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${isActive ? 'translate-x-7' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-3 flex-1">
      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">{label}</span>
      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner group hover:border-indigo-200 transition-colors">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-12 h-12 rounded-2xl cursor-pointer border-none bg-transparent shadow-sm" />
        <input type="text" value={value.toUpperCase()} onChange={(e) => onChange(e.target.value)} className="bg-transparent border-none text-[13px] font-mono font-black w-20 outline-none text-slate-600" />
      </div>
    </div>
  );
}