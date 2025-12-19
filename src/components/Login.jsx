import React, { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Trophy, Smartphone, Download, MailCheck, ArrowLeft } from 'lucide-react';

export default function Login({ supabase, isNotAdmin, handleLogout }) {
  const [showEmailSent, setShowEmailSent] = useState(false);

  // ÉCRAN : REDIRECTION MOBILE (MEMBRES)
  if (isNotAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 text-center">
        <div className="max-w-lg w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Smartphone size={40} className="text-indigo-600" />
          </div>
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter italic text-slate-900">Espace Joueur</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed italic normal-case">
            La console web est réservée aux administrateurs. 
            Téléchargez l'application mobile pour gérer votre profil et vos parties.
          </p>
          
          <div className="space-y-4 mb-10">
            <button className="w-full flex items-center gap-4 p-5 bg-slate-900 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-all group">
               <Download size={20} className="text-white group-hover:bounce" />
               <div className="text-left">
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Disponible sur</p>
                 <p className="text-white font-bold italic uppercase tracking-wider text-sm">App Store / Google Play</p>
               </div>
            </button>
          </div>

          <button onClick={handleLogout} className="flex items-center gap-2 mx-auto text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Retour au Login Admin
          </button>
        </div>
      </div>
    );
  }

  // ÉCRAN : CONNEXION / INSCRIPTION
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9] p-4 relative overflow-hidden">
      {/* Éléments de design en arrière-plan */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-200/20 rounded-full blur-[120px]" />

      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] p-12 text-center border border-white relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-200 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
          <Trophy size={48} color="white" strokeWidth={2.5} />
        </div>

        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase mb-2">ChessManager</h1>
        <p className="text-[10px] text-slate-400 mb-10 tracking-[0.3em] font-black uppercase">Élite Club Management</p>
        
        <div className="text-left normal-case italic">
          <Auth 
            supabaseClient={supabase} 
            appearance={{ 
                theme: ThemeSupa,
                variables: {
                    default: {
                        colors: {
                            brand: '#4f46e5',
                            brandAccent: '#4338ca',
                            inputBackground: '#f8fafc',
                            inputText: '#0f172a',
                            inputBorder: '#e2e8f0',
                            inputBorderFocus: '#4f46e5',
                        },
                        radii: {
                            borderRadiusButton: '1.2rem',
                            buttonPadding: '1rem',
                            inputBorderRadius: '1.2rem',
                        },
                        fonts: {
                            bodyFontFamily: `inherit`,
                            buttonFontFamily: `inherit`,
                            inputFontFamily: `inherit`,
                            labelFontFamily: `inherit`,
                        }
                    }
                }
            }} 
            localization={{
              variables: {
                sign_up: {
                  email_label: 'Email professionnel',
                  password_label: 'Mot de passe sécurisé',
                  button_label: 'Créer mon espace club',
                  loading_button_label: 'Initialisation...',
                  confirmation_sent: 'Vérifiez votre boîte mail pour activer votre club !'
                },
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Mot de passe',
                  button_label: 'Accéder à la console',
                }
              }
            }}
            providers={[]} 
          />
        </div>

        <footer className="mt-10 pt-8 border-t border-slate-100">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Propulsé par l'IA Gemini 1.5 Flash
          </p>
        </footer>
      </div>
    </div>
  );
}