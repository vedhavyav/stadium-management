# ArenaOS — FIFA World Cup 2026 Smart Stadium & Operations Ecosystem

ArenaOS is a real-time, Generative AI-enabled stadium operations and visitor management portal designed for the **FIFA World Cup 2026**. During massive sports events, crowd safety, language barriers, and operational response times are critical. ArenaOS bridges the gap between **Fans**, **Volunteers**, and **Control Room Organizers** to ensure a safe, efficient, and memorable match day.

---

## 1. Chosen Vertical & Core personas
Our solution is focused on **Smart Stadiums & Tournament Operations** for the FIFA World Cup 2026. It supports three distinct user perspectives:
*   **The Fan ( Diego )**: Needs real-time multi-lingual crowd navigation, digital ticket guidelines, and concession/restroom wait-time assistance.
*   **The Volunteer ( Sarah / Carlos )**: Needs automated task dispatching, instant on-ground stadium protocol lookup, and simplified incident reporting with AI classification.
*   **The Organizer ( Marcus )**: Needs a high-level command center with live stadium map overlays, operations metrics, automatic dispatch suggestions, and ingress/egress gate analytics.

---

## 2. Solution Features & How It Works

### 2.1 Interactive SVG Stadium Map
*   Rendered dynamically on a single SVG canvas, providing top-down visualizations of seating blocks, gates, restrooms, concessions, active incident warnings, and volunteer locations.
*   Supports **Dynamic Path Drawing** (electric cyan path-finding lines) from user coordinates directly to low-queue amenities.

### 2.2 Live Crowd & Queue Simulator
*   Simulates background crowd flow rates at stadium gates (e.g., Gate A-D) and fluctuates queue wait-times at concessions and restrooms every 5 seconds.
*   Alerts the organizer control room immediately when gate flows exceed safety thresholds ("Congested" state) or facilities become backlogged.

### 2.3 GenAI-Powered Fan Copilot (Gemini API)
*   **Context-Aware Chat**: Feeds current live wait times and gate statuses directly to the Gemini API system prompts. Fans can ask: *"Where should I get food?"* and the AI will scan the database to suggest: *"Visit Taco World Cup Express, it has a 4-minute wait compared to Golden Goal Burgers which is 18 minutes."*
*   **Multilingual Support**: Automatically detects input languages (English, Spanish, French, Arabic, German) and replies in the user's native tongue.

### 2.4 Ground Staff Q&A & Incident Dispatcher
*   **Protocol Copilot**: Volunteers can ask questions regarding ticketing discrepancies, prohibited items, or medical protocols, retrieving instant guidelines.
*   **Auto-Dispatch Loop**: When a volunteer reports an incident (e.g., *"Medical emergency, spectator fainted near Section 104"*), the system uses Gemini to extract key metadata:
    ```json
    {
      "title": "Medical aid required",
      "category": "medical",
      "severity": "critical",
      "description": "Spectator fainted near Section 104"
    }
    ```
    The Control Room is immediately alerted with a pulsing warning on the dashboard. The system then automatically calculates the closest available volunteer using Euclidean distance grids and dispatches them to the incident coordinates.

---

## 3. Technology Stack & Size Optimization
*   **Frontend**: React 18, Vite 5, Tailwind CSS v3.
*   **Graphics & Visualization**: Recharts (fully responsive SVG bar charts), Lucide Icons.
*   **GenAI Engine**: `@google/generative-ai` SDK (Gemini 1.5 Flash model for low-latency).
*   **Design Paradigm**: Modern "Midnight Pitch" glassmorphism, responsive mobile-first layouts, and keyframe CSS animations.
*   **Size Constraint**: **Total repository size is under 1.5 MB** (excluding node_modules), safely below the 10 MB limit, achieved by using CSS gradients and SVG drawings instead of bulky visual assets.

---

## 4. Architectural Assumptions
1.  **AI Fallback Mechanism**: If the Google Gemini API key is missing or invalid, the platform automatically falls back to an **offline rule-based mock AI classifier** that parses query keywords and scans live metrics to produce intelligent advice.
2.  **Mock Location Coordinates**: The fan Diego Ramirez is assumed to be positioned at coordinate `(26, 35)` near Section 104. Volunteers' positions are updated in the in-memory database.
3.  **Simulated Real-Time Feed**: Crowd flows, wait-times, and active alarms are updated reactively on the client side using a background interval timer to demonstrate dashboard capabilities without requiring a persistent server websocket.

---

## 5. Development & Local Setup Instructions

### Prerequisites
Make sure you have Node.js (v18+) and npm installed on your system.

### Installation
1.  Clone the repository inside your environment:
    ```bash
    git clone https://github.com/vedhavyav/stadium-management.git
    cd stadium-management
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the local development server:
    ```bash
    npm run dev
    ```
    The application will launch on `http://localhost:3000`.

4.  Configure Gemini API:
    *   Click on the **Key Icon** 🔑 in the top header.
    *   Input your Google Gemini API Key and save.
    *   The indicator will switch to **Gemini 1.5 Live**. (If left blank, the app runs on its built-in fallback AI).

5.  Build the project for production:
    ```bash
    npm run build
    ```
