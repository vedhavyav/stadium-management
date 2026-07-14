# Backend Schema Specification
## Project Name: ArenaOS — FIFA World Cup 2026 Smart Stadium & Operations Ecosystem

---

## 1. Relational Entity Relationship Diagram (ERD)
The database structure is designed to support real-time querying, crowd simulation, volunteer dispatching, and conversation histories.

```
+------------------+         +------------------+         +------------------+
|      users       |         |    incidents     |         |   incident_logs  |
+------------------+         +------------------+         +------------------+
| id (PK)          |<--------| assigned_to_id   |         | id (PK)          |
| email            |         | reporter_id      |         | incident_id (FK) |
| name             |         | id (PK)          |         | old_status       |
| role             |         | title            |         | new_status       |
| status           |         | description      |         | changed_at       |
| current_location |         | status           |         +------------------+
| language_pref    |         | category         |
+------------------+         | severity         |
                             | coordinates      |
                             | created_at       |
                             +------------------+

+------------------+         +------------------+         +------------------+
|    facilities    |         |      gates       |         |   chat_history   |
+------------------+         +------------------+         +------------------+
| id (PK)          |         | id (PK)          |         | id (PK)          |
| name             |         | name             |         | user_id (FK)     |
| type             |         | status           |         | role (user/model)|
| status           |         | flow_rate_in     |         | message          |
| wait_time_mins   |         | coordinates      |         | timestamp        |
| coordinates      |         +------------------+         +------------------+
+------------------+
```

---

## 2. JSON Schemas & TypeScript Definitions

### 2.1 Users Entity
Represents spectators, volunteer staff, and administrators.
```typescript
interface User {
  id: string; // "USR-101"
  email: string; // "diego@stadium.com"
  name: string;
  role: 'fan' | 'volunteer' | 'organizer';
  status: 'active' | 'inactive' | 'on_break' | 'busy'; // Volunteers status
  currentLocation: {
    zone: string; // "Zone A"
    x: number; // Percent width of map coordinate (0-100)
    y: number; // Percent height of map coordinate (0-100)
  };
  languagePref: 'en' | 'es' | 'fr' | 'pt' | 'ar' | 'de';
}
```

### 2.2 Incidents Entity
Represents stadium logs reported by volunteers or automated sensors.
```typescript
interface Incident {
  id: string; // "INC-502"
  title: string;
  description: string;
  status: 'pending' | 'dispatched' | 'in_progress' | 'resolved';
  category: 'medical' | 'maintenance' | 'security' | 'crowd_control' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  coordinates: { x: number; y: number };
  reporterId: string; // User ID
  assignedToId: string | null; // Volunteer User ID
  createdAt: string; // ISO DateTime
  resolvedAt: string | null;
}
```

### 2.3 Facilities (Concessions/Restrooms) Entity
Allows real-time crowd status monitoring and routing.
```typescript
interface Facility {
  id: string; // "FAC-01"
  name: string;
  type: 'concession' | 'restroom' | 'medical_bay' | 'exit';
  status: 'open' | 'closed' | 'busy';
  waitTimeMins: number; // Simulated queue time
  coordinates: { x: number; y: number };
}
```

### 2.4 Gates Entity
For entry point crowd flow monitoring.
```typescript
interface Gate {
  id: string; // "GATE-C"
  name: string;
  status: 'open' | 'congested' | 'closed';
  flowRateIn: number; // Fans entering per minute
  coordinates: { x: number; y: number };
}
```

### 2.5 Chat History Entity
Stores dialogues for conversational context.
```typescript
interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'model';
  message: string;
  timestamp: string; // ISO DateTime
}
```

---

## 3. Seed Data Simulation
The local database state will boot with the following structure:
```json
{
  "users": [
    {
      "id": "USR-VOL-1",
      "email": "sarah@stadium.com",
      "name": "Sarah Jenkins",
      "role": "volunteer",
      "status": "active",
      "currentLocation": { "zone": "Zone B", "x": 42.5, "y": 68.2 },
      "languagePref": "en"
    },
    {
      "id": "USR-FAN-1",
      "email": "diego@stadium.com",
      "name": "Diego Ramirez",
      "role": "fan",
      "status": "active",
      "currentLocation": { "zone": "Zone C", "x": 12.0, "y": 30.5 },
      "languagePref": "es"
    }
  ],
  "facilities": [
    {
      "id": "FAC-CON-1",
      "name": "Taco World Cup Express",
      "type": "concession",
      "status": "open",
      "waitTimeMins": 4,
      "coordinates": { "x": 25.0, "y": 80.0 }
    },
    {
      "id": "FAC-CON-2",
      "name": "Golden Goal Burgers",
      "type": "concession",
      "status": "open",
      "waitTimeMins": 18,
      "coordinates": { "x": 75.0, "y": 82.0 }
    },
    {
      "id": "FAC-REST-1",
      "name": "Zone A Restrooms",
      "type": "restroom",
      "status": "busy",
      "waitTimeMins": 12,
      "coordinates": { "x": 15.0, "y": 15.0 }
    }
  ],
  "incidents": [
    {
      "id": "INC-001",
      "title": "Water Spill near Gate 4",
      "description": "Large beverage puddle causing slipping hazard.",
      "status": "in_progress",
      "category": "maintenance",
      "severity": "medium",
      "coordinates": { "x": 40.5, "y": 66.8 },
      "reporterId": "USR-VOL-1",
      "assignedToId": "USR-VOL-1",
      "createdAt": "2026-07-14T12:00:00.000Z",
      "resolvedAt": null
    }
  ]
}
```
