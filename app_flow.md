# Webapp Application Flow
## Project Name: ArenaOS — FIFA World Cup 2026 Smart Stadium & Operations Ecosystem

---

## 1. Application Navigation Tree
ArenaOS is designed as a single portal with role-based navigation. A top switcher allows users to view the app as a Fan, Volunteer, or Organizer to simulate the entire ecosystem.

```mermaid
graph TD
    Entry[App Entry Portal] --> Switcher{Select Role}
    
    Switcher -->|Fan Perspective| FanDashboard[Fan Dashboard]
    FanDashboard --> FanChat[GenAI Copilot Chat]
    FanDashboard --> FanMap[Interactive Seat & Concession Map]
    FanDashboard --> FanTicket[My Digital Match Ticket]
    
    Switcher -->|Volunteer Perspective| VolDashboard[Volunteer Dashboard]
    VolDashboard --> VolTasks[Task Checklist / Assigned Incidents]
    VolTasks --> VolChat[Protocol Lookup Copilot]
    VolDashboard --> VolReport[Voice/Text Incident Reporting Form]
    
    Switcher -->|Organizer Perspective| OrgDashboard[Control Room Dashboard]
    OrgDashboard --> OrgMap[Live Crowd Heatmap & Staff Tracker]
    OrgDashboard --> OrgStats[Live Analytics & Charts]
    OrgDashboard --> OrgIncidents[Incident Log & Dispatch Controller]
```

---

## 2. Core User Flows

### 2.1 The Fan Journey (Finding Concessions & Help)
```mermaid
sequenceDiagram
    autonumber
    actor Fan
    participant WebApp as Fan UI
    participant Gemini as GenAI API
    participant DB as System DB State
    
    Fan->>WebApp: Clicks "Find food with shortest queue"
    WebApp->>DB: Query food concessions & current wait times
    DB-->>WebApp: Returns concession list (Hotdogs: 15m, Tacos: 4m, Pizza: 10m)
    WebApp->>WebApp: Filters & highlights lowest wait time (Tacos)
    Fan->>WebApp: "How do I walk there from Section 104?" (Chat input)
    WebApp->>Gemini: Sends user query + location (Section 104) + destination (Taco Stand Zone B)
    Gemini-->>WebApp: Returns translation & routing directions
    WebApp->>Fan: Renders step-by-step walk path on map & details in chat
```

---

### 2.2 Ground Operations Flow (Incident Dispatch Loop)
```mermaid
sequenceDiagram
    autonumber
    actor Volunteer
    participant WebApp as Operations Hub
    participant Gemini as GenAI Dispatcher
    actor Organizer
    
    Volunteer->>WebApp: Reports incident: "Medical emergency - fan fainted near Section 104"
    WebApp->>Gemini: Sends text for analysis
    Gemini->>Gemini: Extracts: Category = MEDICAL, Priority = HIGH, Location = Section 104
    Gemini-->>WebApp: Assigns metadata & updates incident DB
    WebApp->>Organizer: Sounds alert on Command Center screen
    WebApp->>WebApp: Finds closest active Volunteer (Sarah, 15 meters away)
    WebApp->>Volunteer: Sends notification + navigation map + instructions
    Volunteer->>WebApp: Marks task as "IN PROGRESS"
    Note over Volunteer, WebApp: Volunteer resolves medical issue
    Volunteer->>WebApp: Marks task as "RESOLVED"
    WebApp->>Organizer: Updates status to RESOLVED & logs response time
```

---

## 3. Dynamic State Changes
The application manages state reactivity across views. When a new incident is submitted:
1.  **Database**: Appends new incident object.
2.  **Organizer Dashboard**: 
    *   Increments "Active Incidents" counter.
    *   Adds a marker on the stadium map (flashing red beacon).
    *   Appends item to "Live Incident Log" with highest priority.
3.  **Volunteer View**: Updates volunteer screen if they are assigned.
4.  **Analytics**: Redraws real-time incident status charts.
