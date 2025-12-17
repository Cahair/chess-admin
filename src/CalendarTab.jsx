import React, { useState, useEffect } from 'react' // Import corrigé pour useState
import { 
  ChevronLeft, ChevronRight, Plus, Trash2, Clock, 
  MapPin, Tag, MessageSquare, Home, Plane, Info
} from 'lucide-react' // 'Info' avec majuscule corrigé

export default function CalendarTab({ myClub, supabase, dynamicRadius }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [newEvent, setNewEvent] = useState({
    competition: '', opponent: '', date: '', time: '14:15',
    location: '', isHome: true, team_tag: '', description: ''
  });

  useEffect(() => { fetchEvents(); }, []);

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

  async function handleSubmit(e) {
    e.preventDefault();
    const fullTimestamp = `${newEvent.date}T${newEvent.time}:00`;
    const title = `${newEvent.competition} : ${newEvent.isHome ? myClub.name : newEvent.opponent} VS ${newEvent.isHome ? newEvent.opponent : myClub.name}`;
    
    const { error } = await supabase.from('events').insert([{
      title: title,
      start_date: fullTimestamp,
      location: newEvent.isHome ? (myClub.address || 'Salle du Club') : newEvent.location,
      category: 'Match',
      visibility_tag: newEvent.team_tag.toUpperCase(),
      description: newEvent.description,
      club_id: myClub.id
    }]);

    if (!error) {
      setNewEvent({ ...newEvent, competition: '', opponent: '', date: '', location: '', team_tag: '', description: '' });
      fetchEvents();
    }
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const calendarDays = [];
    for (let i = 0; i < adjustedFirstDay; i++) calendarDays.push(null);
    for (let i = 1; i <= days; i++) calendarDays.push(new Date(year, month, i));
    return calendarDays;
  };

  const calendarDays = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  async function deleteEvent(id) {
    if (window.confirm("Supprimer ce match ?")) {
      await supabase.from('events').delete().eq('id', id);
      setEvents(events.filter(e => e.id !== id));
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 italic uppercase font-black text-slate-900">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FORMULAIRE */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 shadow-xl border border-slate-100" style={{ borderRadius: dynamicRadius }}>
            <h3 className="text-sm mb-6 flex items-center gap-2 text-indigo-600"><Plus size={18}/> Nouveau Match</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required className="w-full bg-slate-50 p-3 text-[10px] border-2 border-transparent focus:border-indigo-500 outline-none font-black"
                placeholder="COMPÉTITION" value={newEvent.competition} onChange={e => setNewEvent({...newEvent, competition: e.target.value.toUpperCase()})}
                style={{ borderRadius: `calc(${dynamicRadius}/2)` }} />
              <input required className="w-full bg-indigo-50 p-3 text-[10px] border-2 border-indigo-100 focus:border-indigo-500 outline-none font-black"
                placeholder="TAG ÉQUIPE (N2, JEUNES...)" value={newEvent.team_tag} onChange={e => setNewEvent({...newEvent, team_tag: e.target.value.toUpperCase()})}
                style={{ borderRadius: `calc(${dynamicRadius}/2)` }} />
              <input required className="w-full bg-slate-50 p-3 text-[10px] border-2 border-transparent focus:border-indigo-500 outline-none font-black"
                placeholder="ADVERSAIRE" value={newEvent.opponent} onChange={e => setNewEvent({...newEvent, opponent: e.target.value.toUpperCase()})}
                style={{ borderRadius: `calc(${dynamicRadius}/2)` }} />
              
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button type="button" onClick={() => setNewEvent({...newEvent, isHome: true})} className={`flex-1 py-2 text-[8px] rounded-lg transition-all ${newEvent.isHome ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>DOMICILE</button>
                <button type="button" onClick={() => setNewEvent({...newEvent, isHome: false})} className={`flex-1 py-2 text-[8px] rounded-lg transition-all ${!newEvent.isHome ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>EXTÉRIEUR</button>
              </div>

              {!newEvent.isHome && <input required className="w-full bg-slate-50 p-3 text-[10px] font-black" placeholder="LIEU" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value.toUpperCase()})} style={{ borderRadius: `calc(${dynamicRadius}/2)` }} />}

              <div className="grid grid-cols-2 gap-2">
                <input type="date" required className="w-full bg-slate-50 p-3 text-[10px] font-black" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} style={{ borderRadius: `calc(${dynamicRadius}/2)` }} />
                <input type="time" required className="w-full bg-slate-50 p-3 text-[10px] text-center font-black" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} style={{ borderRadius: `calc(${dynamicRadius}/2)` }} />
              </div>
              <textarea className="w-full bg-slate-50 p-3 text-[10px] font-black normal-case italic" placeholder="Commentaire..." value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} style={{ borderRadius: `calc(${dynamicRadius}/2)` }} />
              <button type="submit" className="w-full bg-slate-900 text-white py-4 text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-md" style={{ borderRadius: dynamicRadius }}>ENREGISTRER</button>
            </form>
          </div>
        </div>

        {/* CALENDRIER */}
        <div className="lg:col-span-8">
          <div className="bg-white shadow-xl border border-slate-100 overflow-hidden" style={{ borderRadius: dynamicRadius }}>
            <div className="bg-slate-900 p-6 flex items-center justify-between text-white">
              <h2 className="text-xl tracking-tighter italic">{monthName}</h2>
              <div className="flex gap-2">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-white/10 rounded-full"><ChevronLeft size={20}/></button>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-white/10 rounded-full"><ChevronRight size={20}/></button>
              </div>
            </div>
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-black tracking-widest py-3 text-center">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 min-h-[500px]">
              {calendarDays.map((day, idx) => {
                const dayEvents = day ? events.filter(e => new Date(e.start_date).toDateString() === day.toDateString()) : [];
                return (
                  <div key={idx} className={`border-r border-b border-slate-100 p-2 min-h-[100px] ${!day ? 'bg-slate-50/50' : ''}`}>
                    {day && <span className={`text-[10px] font-black ${dayEvents.length > 0 ? 'text-indigo-600 underline' : 'text-slate-300'}`}>{day.getDate()}</span>}
                    <div className="mt-2 space-y-1">
                      {dayEvents.map(event => (
                        <div key={event.id} className="group relative bg-indigo-600 text-white p-1 rounded text-[7px] leading-tight shadow-sm">
                          <p className="truncate font-black">{event.visibility_tag}</p>
                          <div className="absolute z-50 bottom-full left-0 mb-2 w-48 hidden group-hover:block bg-white border p-3 shadow-2xl rounded-xl normal-case italic font-medium text-slate-900">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[8px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-black">{event.visibility_tag}</span>
                              <button onClick={() => deleteEvent(event.id)} className="text-rose-500"><Trash2 size={12}/></button>
                            </div>
                            <p className="text-[10px] font-black mb-1">{event.title}</p>
                            <div className="text-[8px] text-slate-500 space-y-1">
                              <p className="flex items-center gap-1"><Clock size={10}/> {new Date(event.start_date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</p>
                              <p className="flex items-center gap-1"><MapPin size={10}/> {event.location}</p>
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
  )
}