export interface UserLocation {
  zone: string;
  x: number; // percentage coordinate 0-100 on stadium SVG
  y: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'fan' | 'volunteer' | 'organizer';
  status: 'active' | 'inactive' | 'on_break' | 'busy';
  currentLocation: UserLocation;
  languagePref: 'en' | 'es' | 'fr' | 'pt' | 'ar' | 'de';
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'dispatched' | 'in_progress' | 'resolved';
  category: 'medical' | 'maintenance' | 'security' | 'crowd_control' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  coordinates: { x: number; y: number };
  reporterId: string;
  assignedToId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface Facility {
  id: string;
  name: string;
  type: 'concession' | 'restroom' | 'medical_bay' | 'exit';
  status: 'open' | 'closed' | 'busy';
  waitTimeMins: number;
  coordinates: { x: number; y: number };
}

export interface Gate {
  id: string;
  name: string;
  status: 'open' | 'congested' | 'closed';
  flowRateIn: number; // simulated fans/min entering
  coordinates: { x: number; y: number };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  message: string;
  timestamp: string;
}

export interface AppState {
  users: User[];
  incidents: Incident[];
  facilities: Facility[];
  gates: Gate[];
  chatHistory: ChatMessage[];
  selectedUser: User;
}
