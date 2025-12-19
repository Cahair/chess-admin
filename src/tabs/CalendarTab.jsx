import React, { useState, useEffect } from 'react'; 
import { 
  ChevronLeft, ChevronRight, Plus, Trash2, Clock, 
  MapPin, Calendar as CalendarIcon, Trophy, Star
} from 'lucide-react';
import { supabase } from "../supabaseClient"; 

export default function CalendarTab({ myClub, dynamicRadius }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeForm, setActiveForm] = useState('match'); // 'match' ou 'autre'

  const [newEvent, setNewEvent] = useState({
    competition: '', opponent: '', date: '', time: '14:15',
    location: '', isHome: true, team_tag: '', description: ''
  });

  const [otherEvent, setOtherEvent] = useState({
    title: '', date: '', time: '18:00', 
    location: '', description: '', category: 'Entraînement'
  });

  useEffect(() => { 
    if (myClub?.id) fetchEvents(); 
  }, [myClub?.id]);

  async function fetchEvents() {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('club_id', myClub.id)
      .order('start_date', { ascending: true });
    setEvents(data || []);
    setLoading(false);
  }

  const handleMatchSubmit = async (e) => {
    e.preventDefault();
    const fullTimestamp = `${newEvent.date}T${newEvent.time}:00`;
    const title = `${newEvent.competition} : ${newEvent.isHome ? myClub.name : newEvent.opponent} VS ${newEvent.isHome ? newEvent.opponent : myClub.name}`;
    
    const { error } = await supabase.from('events').insert([{
      title: title,
      start_date: fullTimestamp,
      location: newEvent.isHome ? (myClub.address || 'Salle du Club') : newEvent.location,
      category: 'Match',
      visibility_tag: newEvent.team_tag.toUpperCase() || 'MATCH',
      description: newEvent.description,
      club_id: myClub.id
    }]);

    if (!error) {
      setNewEvent({ competition: '', opponent: '', date: '', time: '14:15', location: '', team_tag: '', description: '', isHome: true });
      fetchEvents();
    }
  };

  const handleOtherSubmit = async (e) => {
    e.preventDefault();
    const fullTimestamp = `${otherEvent.date}T${otherEvent.time}:00`;
    
    const { error } = await supabase.from('events').insert([{
      title: otherEvent.title.toUpperCase(),
      start_date: fullTimestamp,
      location: otherEvent.location,
      category: otherEvent.category,
      visibility_tag: otherEvent.category.toUpperCase().substring(0, 4),
      description: otherEvent.description,
      club_id: myClub.id
    }]);

    if (!error) {
      setOtherEvent({ title: '', date: '', time: '18:00', location: '', description: '', category: 'Entraînement' });
      fetchEvents();
    }
  };

  const deleteEvent = async (id) => {
    if (window.confirm("Supprimer cet événement ?")) {
      await supabase.from('events').delete().eq('id', id);
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const calendarDays = (() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    const daysArray = [];
    for (let i = 0; i < adjustedFirstDay; i++) daysArray.push(null);
    for (let i = 1; i <= days; i++) daysArray.push(new Date(year, month, i));
    return daysArray;
  })();

  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  const primary = myClub?.primary_color || '#6366f1';

  return (
    <div className="max-w-7xl mx-auto pb-20 italic uppercase font-black text-slate-800 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SECTION FORMULAIRES HARMONISÉE */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-2 border border-slate-100 shadow-sm flex" style={{ borderRadius: dynamicRadius }}>
            <button 
              onClick={() => setActiveForm('match')}
              className={`flex-1 py-3 text-[9px] tracking-widest transition-all ${activeForm === 'match' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}
              style={{ borderRadius: `calc(${dynamicRadius} / 1.5)` }}
            >
              Mode Match
            </button>
            <button 
              onClick={() => setActiveForm('autre')}
              className={`flex-1 py-3 text-[9px] tracking-widest transition-all ${activeForm === 'autre' ? 'bg-orange-50 text-orange-600' : 'text-slate-400'}`}
              style={{ borderRadius: `calc(${dynamicRadius} / 1.5)` }}
            >
              Événement
            </button>
          </div>

          <div className="bg-white p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-slate-50" style={{ borderRadius: dynamicRadius }}>
            <h3 className="text-[10px] tracking-[0.3em] mb-8 flex items-center gap-2 text-slate-400">
              <Plus size={16}/> {activeForm === 'match' ? 'Programmer Match' : 'Nouvel Événement'}
            </h3>

            {activeForm === 'match' ? (
              <form onSubmit={handleMatchSubmit} className="space-y-4">
                <Input placeholder="Compétition" value={newEvent.competition} onChange={v => setNewEvent({...newEvent, competition: v})} />
                <Input placeholder="Tag Équipe (N2, Jeunes...)" value={newEvent.team_tag} onChange={v => setNewEvent({...newEvent, team_tag: v})} color="indigo" />
                <Input placeholder="Adversaire" value={newEvent.opponent} onChange={v => setNewEvent({...newEvent, opponent: v})} />
                
                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                  <button type="button" onClick={() => setNewEvent({...newEvent, isHome: true})} className={`flex-1 py-3 text-[8px] rounded-xl transition-all ${newEvent.isHome ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Domicile</button>
                  <button type="button" onClick={() => setNewEvent({...newEvent, isHome: false})} className={`flex-1 py-3 text-[8px] rounded-xl transition-all ${!newEvent.isHome ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Extérieur</button>
                </div>

                {!newEvent.isHome && <Input placeholder="Lieu" value={newEvent.location} onChange={v => setNewEvent({...newEvent, location: v})} />}

                <div className="grid grid-cols-2 gap-3">
                  <input type="date" required className="bg-slate-50 p-4 text-[10px] font-black rounded-2xl outline-none" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                  <input type="time" required className="bg-slate-50 p-4 text-[10px] text-center font-black rounded-2xl outline-none" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-5 text-[9px] tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-lg" style={{ borderRadius: dynamicRadius }}>Enregistrer</button>
              </form>
            ) : (
              <form onSubmit={handleOtherSubmit} className="space-y-4">
                <Input placeholder="Titre de l'événement" value={otherEvent.title} onChange={v => setOtherEvent({...otherEvent, title: v})} color="orange" />
                <select className="w-full bg-slate-50 p-4 text-[10px] font-black outline-none rounded-2xl" value={otherEvent.category} onChange={e => setOtherEvent({...otherEvent, category: e.target.value})}>
                  <option value="Entraînement">Entraînement</option>
                  <option value="Tournoi">Tournoi</option>
                  <option value="Réunion">Réunion</option>
                  <option value="Autre">Autre</option>
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" required className="bg-slate-50 p-4 text-[10px] font-black rounded-2xl" value={otherEvent.date} onChange={e => setOtherEvent({...otherEvent, date: e.target.value})} />
                  <input type="time" required className="bg-slate-50 p-4 text-[10px] text-center font-black rounded-2xl" value={otherEvent.time} onChange={e => setOtherEvent({...otherEvent, time: e.target.value})} />
                </div>
                <Input placeholder="Lieu (Optionnel)" value={otherEvent.location} onChange={v => setOtherEvent({...otherEvent, location: v})} />
                <button type="submit" className="w-full bg-orange-500 text-white py-5 text-[9px] tracking-[0.3em] hover:bg-orange-600 transition-all shadow-lg" style={{ borderRadius: dynamicRadius }}>Ajouter</button>
              </form>
            )}
          </div>
        </div>

        {/* CALENDRIER HARMONISÉ */}
        <div className="lg:col-span-8">
          <div className="bg-white shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-slate-50 overflow-hidden" style={{ borderRadius: dynamicRadius }}>
            <div className="p-8 flex items-center justify-between border-b border-slate-50">
              <h2 className="text-3xl tracking-tighter text-slate-900">{monthName}</h2>
              <div className="flex gap-3">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all"><ChevronLeft size={20}/></button>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all"><ChevronRight size={20}/></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 bg-white text-[8px] text-slate-300 font-bold tracking-[0.4em] py-4 text-center border-b border-slate-50">
              {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map(day => <div key={day}>{day}</div>)}
            </div>

            <div className="grid grid-cols-7 min-h-[600px] divide-x divide-y divide-slate-50">
              {calendarDays.map((day, idx) => {
                const dayEvents = day ? events.filter(e => new Date(e.start_date).toDateString() === day.toDateString()) : [];
                return (
                  <div key={idx} className={`p-3 min-h-[120px] transition-colors ${!day ? 'bg-slate-50/30' : 'bg-white'}`}>
                    {day && (
                      <span className={`text-[10px] mb-2 block ${dayEvents.length > 0 ? 'text-indigo-600' : 'text-slate-200'}`}>
                        {day.getDate()}
                      </span>
                    )}
                    <div className="space-y-1.5">
                      {dayEvents.map(event => (
                        <div key={event.id} className="group relative">
                          <div 
                            className={`p-2 rounded-xl text-[7px] leading-tight border transition-all cursor-pointer ${
                              event.category === 'Match' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-orange-50 border-orange-100 text-orange-700'
                            }`}
                          >
                            <p className="truncate font-black">{event.visibility_tag}</p>
                            <p className="truncate normal-case italic font-medium opacity-70">{event.title.split(':')[1] || event.title}</p>
                          </div>

                          {/* TOOLTIP PREMIUM */}
                          <div className="absolute z-50 bottom-full left-0 mb-3 w-56 hidden group-hover:block bg-slate-900 text-white p-5 shadow-2xl rounded-3xl animate-fadeIn normal-case italic font-medium">
                            <div className="flex justify-between items-start mb-4">
                              <span className="text-[7px] bg-white/10 px-2 py-1 rounded-full uppercase font-black tracking-widest">{event.category}</span>
                              <button onClick={() => deleteEvent(event.id)} className="text-rose-400 hover:text-rose-300 transition-colors"><Trash2 size={14}/></button>
                            </div>
                            <p className="text-[11px] font-black mb-3 uppercase tracking-tight">{event.title}</p>
                            <div className="space-y-2 opacity-60 text-[9px]">
                              <p className="flex items-center gap-2 font-bold"><Clock size={12}/> {new Date(event.start_date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</p>
                              <p className="flex items-center gap-2 font-bold"><MapPin size={12}/> {event.location}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sous-composant Input harmonisé
function Input({ placeholder, value, onChange, color = "slate" }) {
  const colors = {
    indigo: "focus:border-indigo-400 bg-indigo-50/30",
    orange: "focus:border-orange-400 bg-orange-50/30",
    slate: "focus:border-slate-300 bg-slate-50"
  };
  return (
    <input 
      required 
      className={`w-full p-4 text-[10px] border-2 border-transparent outline-none font-black transition-all rounded-2xl ${colors[color]}`}
      placeholder={placeholder.toUpperCase()} 
      value={value} 
      onChange={e => onChange(e.target.value.toUpperCase())} 
    />
  );
}