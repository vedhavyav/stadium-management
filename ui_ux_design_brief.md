# UI/UX Design Brief
## Project Name: ArenaOS — FIFA World Cup 2026 Smart Stadium & Operations Ecosystem

---

## 1. Visual Theme: "Midnight Pitch"
The UI design is inspired by a night-time stadium match under floodlights. It utilizes a deep dark mode background combined with glowing emerald, gold, and cyan accent colors. This scheme provides high contrast (critical for sunny or nighttime outdoor stadium usage) and evokes the premium atmosphere of the FIFA World Cup.

### 1.1 Color Palette
We use standard HSL-tailored colors for modern UI/UX design:

| Color Role | Color Hex | HSL Equivalent | Visual Representation |
| :--- | :--- | :--- | :--- |
| **Deep Background** | `#0D1117` | `hsl(215, 28%, 8%)` | Pitch-black night sky |
| **Pitch Emerald** | `#10B981` | `hsl(159, 84%, 44%)` | Vibrant pitch grass |
| **FIFA Gold** | `#F59E0B` | `hsl(38, 92%, 50%)` | World Cup trophy, highlighting priority actions |
| **Electric Cyan** | `#06B6D4` | `hsl(189, 94%, 43%)` | Tech floodlights, path lines |
| **Card Glass** | `#161B22` | `hsl(215, 20%, 11%)` | Sleek glass cards with 60% opacity |
| **Error / Alert** | `#EF4444` | `hsl(0, 84%, 60%)` | Security alerts, high queue wait times |

---

## 2. Typography
*   **Primary Font**: **Outfit** (Sans-serif) - Google Fonts. Gives a modern, energetic, sporty feel. Used for headers, navigation, and large figures.
*   **Secondary Font**: **Inter** - Clean, highly legible, optimized for reading maps and technical text. Used for chat messages, table contents, and logs.
*   **Scale**:
    *   `h1`: `2.25rem` (36px) | Bold | Tracking tight
    *   `h2`: `1.5rem` (24px) | Semi-Bold | Tracking tight
    *   `h3`: `1.25rem` (20px) | Medium
    *   `body`: `0.925rem` (14.8px) | Regular | Leading relaxed
    *   `caption`: `0.75rem` (12px) | Regular | Tracking wide

---

## 3. UI Layout & Roles

### 3.1 Role Selector Dashboard
Upon loading, the user can toggle between three role perspectives via a top navigation bar or overlay:
1.  **Fan View (Mobile-First)**: Emphasizes the AI Copilot and the dynamic map. Simplified layout with quick buttons (e.g., "Find restrooms", "Get food", "My Ticket").
2.  **Volunteer View (Mobile-First)**: Focuses on the current task card, queue incident reports, and a protocol reference tool.
3.  **Command Center (Desktop-Optimized)**: Multi-panel grid displaying live analytics, heatmaps, incident tickers, and staff locations.

---

## 4. Key Interface States

### 4.1 Card Glassmorphism
Interactive panels will use border-radius, background transparency, and backdrops:
```css
.glass-panel {
  background: rgba(22, 27, 34, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

### 4.2 Interactive Venue Map
*   **Design**: A stylized vector/SVG top-down representation of the stadium.
*   **Elements**:
    *   *Pulsing green/yellow/red dots* representing gates, restrooms, and concessions.
    *   *Path overlay*: Electric cyan lines showing path navigation.
    *   *Live Heatmap Layer*: A radial gradient overlay showing crowd densities.

### 4.3 Chat Console (Fan / Staff)
*   **Header**: Clean title with a green online status dot.
*   **Bubbles**: 
    *   User bubbles: Dark blue/emerald with white text, aligned right.
    *   AI bubbles: Glass background with a gold/cyan border, aligned left.
*   **Action Chips**: Inline suggestion buttons (e.g., *"How do I get to Gate C?"*, *"Show food wait times"*) that trigger instant responses.

---

## 5. Micro-Animations & Interactions
*   **Pulse Alerts**: High-severity incidents pulse red on the Command Center map.
*   **Queue Flow**: Animated arrows along navigation paths to guide fans step-by-step.
*   **Hover Glows**: Buttons and glass cards display a subtle glow on hover (`box-shadow: 0 0 15px rgba(16, 185, 129, 0.2)`).
*   **Page Transitions**: Smooth slide-in animations for active tasks and chat messages.
