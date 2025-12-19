import { 
  LayoutDashboard, // Icône pour le Dashboard
  Users, 
  Euro, 
  Calendar, 
  ShieldCheck, 
  Settings 
} from 'lucide-react';

export const NAVIGATION_TABS = [
  { 
    id: 'dashboard', 
    label: 'Tableau de Bord', 
    icon: LayoutDashboard 
  },
  { 
    id: 'membres', 
    label: 'Membres', 
    icon: Users 
  },
  { 
    id: 'finance', 
    label: 'Trésorerie', 
    icon: Euro 
  },
  { 
    id: 'calendrier', 
    label: 'Calendrier', 
    icon: Calendar 
  },
  { 
    id: 'documents', 
    label: 'Coffre-fort', 
    icon: ShieldCheck 
  },
  { 
    id: 'parametres', 
    label: 'Paramètres', 
    icon: Settings 
  }
];