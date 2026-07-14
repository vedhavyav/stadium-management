import { User, Incident, Facility, Gate } from '../types';

export const INITIAL_USERS: User[] = [
  // Organizers
  {
    id: "USR-ORG-1",
    name: "Marcus Vance",
    role: "organizer",
    status: "active",
    currentLocation: { zone: "Control Room", x: 50, y: 50 },
    languagePref: "en"
  },
  // Volunteers
  {
    id: "USR-VOL-1",
    name: "Sarah Jenkins",
    role: "volunteer",
    status: "active",
    currentLocation: { zone: "Zone A - North Gate", x: 45, y: 22 },
    languagePref: "en"
  },
  {
    id: "USR-VOL-2",
    name: "Carlos Mendez",
    role: "volunteer",
    status: "active",
    currentLocation: { zone: "Zone B - West Concourse", x: 18, y: 55 },
    languagePref: "es"
  },
  {
    id: "USR-VOL-3",
    name: "Amira Kanaan",
    role: "volunteer",
    status: "on_break",
    currentLocation: { zone: "Zone C - South Concourse", x: 52, y: 84 },
    languagePref: "ar"
  },
  {
    id: "USR-VOL-4",
    name: "Jean-Pierre Blanc",
    role: "volunteer",
    status: "active",
    currentLocation: { zone: "Zone D - East Gate", x: 80, y: 48 },
    languagePref: "fr"
  },
  // Fans
  {
    id: "USR-FAN-1",
    name: "Diego Ramirez",
    role: "fan",
    status: "active",
    currentLocation: { zone: "Section 104", x: 26, y: 35 },
    languagePref: "es"
  },
  {
    id: "USR-FAN-2",
    name: "Emily Watson",
    role: "fan",
    status: "active",
    currentLocation: { zone: "Section 218", x: 74, y: 65 },
    languagePref: "en"
  }
];

export const INITIAL_FACILITIES: Facility[] = [
  // Concessions
  {
    id: "FAC-CON-1",
    name: "Taco World Cup Express",
    type: "concession",
    status: "open",
    waitTimeMins: 4,
    coordinates: { x: 30, y: 30 }
  },
  {
    id: "FAC-CON-2",
    name: "Golden Goal Burgers",
    type: "concession",
    status: "busy",
    waitTimeMins: 18,
    coordinates: { x: 70, y: 30 }
  },
  {
    id: "FAC-CON-3",
    name: "Striker Beer & Soft Drinks",
    type: "concession",
    status: "open",
    waitTimeMins: 8,
    coordinates: { x: 30, y: 70 }
  },
  {
    id: "FAC-CON-4",
    name: "World Arena Pretzels",
    type: "concession",
    status: "open",
    waitTimeMins: 3,
    coordinates: { x: 70, y: 70 }
  },
  // Restrooms
  {
    id: "FAC-REST-1",
    name: "North Restroom Block A",
    type: "restroom",
    status: "busy",
    waitTimeMins: 11,
    coordinates: { x: 50, y: 15 }
  },
  {
    id: "FAC-REST-2",
    name: "West Restroom Block B",
    type: "restroom",
    status: "open",
    waitTimeMins: 2,
    coordinates: { x: 12, y: 50 }
  },
  {
    id: "FAC-REST-3",
    name: "South Restroom Block C",
    type: "restroom",
    status: "busy",
    waitTimeMins: 15,
    coordinates: { x: 50, y: 85 }
  },
  {
    id: "FAC-REST-4",
    name: "East Restroom Block D",
    type: "restroom",
    status: "open",
    waitTimeMins: 4,
    coordinates: { x: 88, y: 50 }
  },
  // Medical & Exits
  {
    id: "FAC-MED-1",
    name: "Primary Medical Clinic (Zone A)",
    type: "medical_bay",
    status: "open",
    waitTimeMins: 0,
    coordinates: { x: 48, y: 28 }
  },
  {
    id: "FAC-MED-2",
    name: "Secondary Medical Center (Zone C)",
    type: "medical_bay",
    status: "open",
    waitTimeMins: 0,
    coordinates: { x: 52, y: 72 }
  }
];

export const INITIAL_GATES: Gate[] = [
  { id: "GATE-A", name: "Gate A (North Entrance)", status: "open", flowRateIn: 85, coordinates: { x: 50, y: 8 } },
  { id: "GATE-B", name: "Gate B (West Entrance)", status: "congested", flowRateIn: 180, coordinates: { x: 5, y: 50 } },
  { id: "GATE-C", name: "Gate C (South Entrance)", status: "open", flowRateIn: 60, coordinates: { x: 50, y: 92 } },
  { id: "GATE-D", name: "Gate D (East Entrance)", status: "open", flowRateIn: 110, coordinates: { x: 95, y: 50 } }
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "INC-001",
    title: "Slippery floor near Section 105",
    description: "Beverage spill at Section 105 walkway. Slipping hazard.",
    status: "in_progress",
    category: "maintenance",
    severity: "medium",
    coordinates: { x: 28, y: 45 },
    reporterId: "USR-VOL-2",
    assignedToId: "USR-VOL-2",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    resolvedAt: null
  },
  {
    id: "INC-002",
    title: "Concession congestion at Section 212",
    description: "Heavy queue line blocking pedestrian walkway.",
    status: "pending",
    category: "crowd_control",
    severity: "low",
    coordinates: { x: 68, y: 25 },
    reporterId: "USR-VOL-4",
    assignedToId: null,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    resolvedAt: null
  }
];

// Helper to calculate Euclidean distance between two 2D points
export function calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Function to find the nearest active and non-busy volunteer to coordinates
export function getClosestAvailableVolunteer(
  coords: { x: number; y: number },
  volunteers: User[],
  activeIncidents: Incident[]
): User | null {
  // Find which volunteers are currently assigned to in-progress incidents
  const busyVolunteerIds = new Set(
    activeIncidents
      .filter(inc => inc.status === 'in_progress' || inc.status === 'dispatched')
      .map(inc => inc.assignedToId)
      .filter((id): id is string => id !== null)
  );

  const eligibleVolunteers = volunteers.filter(
    v => v.role === 'volunteer' && v.status === 'active' && !busyVolunteerIds.has(v.id)
  );

  if (eligibleVolunteers.length === 0) return null;

  return eligibleVolunteers.reduce((closest, current) => {
    const dClosest = calculateDistance(closest.currentLocation, coords);
    const dCurrent = calculateDistance(current.currentLocation, coords);
    return dCurrent < dClosest ? current : closest;
  });
}

// Simulates real-time fluctuating statistics in the stadium
export function simulateStadiumChanges(
  facilities: Facility[],
  gates: Gate[]
): { facilities: Facility[]; gates: Gate[] } {
  const nextFacilities = facilities.map(f => {
    // wait times random walk: change by -2 to +2 minutes
    const change = Math.floor(Math.random() * 5) - 2;
    let nextWait = Math.max(0, f.waitTimeMins + change);
    
    // cap concession and restroom times
    if (f.type === 'concession') nextWait = Math.min(nextWait, 45);
    if (f.type === 'restroom') nextWait = Math.min(nextWait, 25);
    if (f.type === 'medical_bay') nextWait = 0;

    let nextStatus: 'open' | 'closed' | 'busy' = f.status;
    if (f.type !== 'medical_bay' && f.type !== 'exit') {
      nextStatus = nextWait > 12 ? 'busy' : 'open';
    }

    return {
      ...f,
      waitTimeMins: nextWait,
      status: nextStatus
    };
  });

  const nextGates = gates.map(g => {
    if (g.status === 'closed') return g;
    
    // flow rate random walk
    const change = Math.floor(Math.random() * 31) - 15; // change by -15 to +15 fans/min
    const nextFlow = Math.max(10, g.flowRateIn + change);
    const nextStatus: Gate['status'] = nextFlow > 150 ? 'congested' : 'open';

    return {
      ...g,
      flowRateIn: nextFlow,
      status: nextStatus
    };
  });

  return { facilities: nextFacilities, gates: nextGates };
}
