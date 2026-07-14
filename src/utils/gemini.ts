import { GoogleGenerativeAI } from '@google/generative-ai';
import { Facility, Gate, Incident } from '../types';

// Let the application read the API key from environment variables or a text input in the UI
let genAIInstance: GoogleGenerativeAI | null = null;

export function initializeGemini(key: string) {
  if (key && key.trim() !== "") {
    genAIInstance = new GoogleGenerativeAI(key);
    console.log("Gemini API initialized successfully.");
  } else {
    genAIInstance = null;
    console.log("No API Key provided. Running in local mock AI mode.");
  }
}

// Check if GenAI is active
export function isGeminiActive(): boolean {
  return genAIInstance !== null;
}

/**
 * 1. Conversational Fan/Staff Assistant
 */
export async function chatWithAI(
  userMessage: string,
  history: { role: 'user' | 'model'; message: string }[],
  facilities: Facility[],
  gates: Gate[]
): Promise<string> {
  const languagePrompt = "Detect the input language and reply in the exact same language (e.g. Spanish, French, Arabic, English).";
  const facilitiesSummary = facilities
    .map(f => `- ${f.name} (${f.type}): Wait time ${f.waitTimeMins} mins, Status: ${f.status}, Coordinates: x=${f.coordinates.x}, y=${f.coordinates.y}`)
    .join('\n');
  const gatesSummary = gates
    .map(g => `- ${g.name}: Status: ${g.status}, Flow Rate: ${g.flowRateIn} fans/min, Coordinates: x=${g.coordinates.x}, y=${g.coordinates.y}`)
    .join('\n');

  const systemInstruction = `
You are ArenaOS, the official GenAI Smart Stadium Copilot for the FIFA World Cup 2026.
You assist fans, volunteers, and stadium operations staff with navigation, FAQs, and incident status.
You have access to the current LIVE stadium metrics:

FACILITIES & CONCESSIONS Wait Times:
${facilitiesSummary}

GATE ENTRY FLOWS:
${gatesSummary}

GUIDELINES:
1. ${languagePrompt}
2. Use the live metrics above to give smart, factual recommendations. For example, if a fan asks for food, recommend the concession stand with the shortest queue. If they ask for restrooms, guide them to the nearest "open" or low-wait restroom.
3. Keep responses highly concise (max 2-3 sentences) suitable for a floating mobile chat widget.
4. If a question is unrelated to the World Cup, stadium, transport, or facilities, politely guide the conversation back to stadium help.
  `;

  if (genAIInstance) {
    try {
      const model = genAIInstance.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction,
      });

      const formattedHistory = history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.message }]
      }));

      // Create chat session
      const chatSession = model.startChat({
        history: formattedHistory,
      });

      const result = await chatSession.sendMessage(userMessage);
      const text = result.response.text();
      return text.trim();
    } catch (error) {
      console.error("Gemini API Error, falling back to Local AI:", error);
      return getLocalMockAIResponse(userMessage, facilities, gates);
    }
  } else {
    // Return local mock response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getLocalMockAIResponse(userMessage, facilities, gates));
      }, 800); // simulate network latency
    });
  }
}

/**
 * 2. Intelligent Volunteer Report Classifier
 */
export async function analyzeIncident(
  rawText: string
): Promise<{ title: string; category: Incident['category']; severity: Incident['severity']; description: string }> {
  
  const systemInstruction = `
You are an operational incident classifier for ArenaOS stadium management.
Analyze the raw text input from on-ground volunteers and extract the structured details.
You must categorize the incident into one of the following categories:
- 'medical' (fainting, injury, medical supplies request)
- 'maintenance' (water leaks, broken seats, debris, light failures)
- 'security' (crowd fights, unauthorized access, suspicious bags)
- 'crowd_control' (heavy bottlenecks, gate blockages)
- 'info' (lost items, general spectator assistance)

Assign a severity level: 'low', 'medium', 'high', or 'critical'.

Format your response strictly as a JSON object, with no markdown tags or wrapper text.
Schema:
{
  "title": "short descriptive title (max 5 words)",
  "category": "medical" | "maintenance" | "security" | "crowd_control" | "info",
  "severity": "low" | "medium" | "high" | "critical",
  "description": "brief clean summary of the incident"
}
  `;

  if (genAIInstance) {
    try {
      const model = genAIInstance.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction,
      });

      const result = await model.generateContent(rawText);
      const text = result.response.text();
      
      // Clean JSON formatting
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Gemini analysis failed, falling back to Local parser:", error);
      return parseIncidentLocally(rawText);
    }
  } else {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(parseIncidentLocally(rawText));
      }, 600);
    });
  }
}

/**
 * --- LOCAL MOCK ALGORITHMS ---
 */
function getLocalMockAIResponse(
  message: string,
  facilities: Facility[],
  gates: Gate[]
): string {
  const query = message.toLowerCase();

  // Language check (basic)
  const isSpanish = query.includes("hola") || query.includes("donde") || query.includes("baño") || query.includes("comida") || query.includes("gracias");
  const isFrench = query.includes("bonjour") || query.includes("où") || query.includes("toilette") || query.includes("manger") || query.includes("merci");
  const isArabic = query.includes("مرحبا") || query.includes("أين") || query.includes("حمام") || query.includes("طعام");

  // 1. Restroom query
  if (query.includes("restroom") || query.includes("toilet") || query.includes("baño") || query.includes("toilette") || query.includes("حمام")) {
    const restrooms = facilities.filter(f => f.type === 'restroom' && f.status === 'open');
    if (restrooms.length === 0) {
      return isSpanish
        ? "Todos los baños están muy concurridos ahora. Por favor espere o use la sección externa."
        : isFrench
        ? "Toutes les toilettes sont très fréquentées. Veuillez patienter ou utiliser la section extérieure."
        : "All restrooms are currently busy. East Restroom Block D is your best option with a 4-minute wait.";
    }
    // find lowest wait
    const bestRestroom = restrooms.reduce((best, cur) => cur.waitTimeMins < best.waitTimeMins ? cur : best, restrooms[0]);
    
    if (isSpanish) {
      return `Le sugiero usar ${bestRestroom.name}. Tiene la fila más corta con solo ${bestRestroom.waitTimeMins} minutos de espera.`;
    }
    if (isFrench) {
      return `Je vous suggère d'utiliser ${bestRestroom.name}. Il y a le temps d'attente le plus court de ${bestRestroom.waitTimeMins} minutes.`;
    }
    return `I recommend using ${bestRestroom.name}. It currently has the shortest queue with a wait time of only ${bestRestroom.waitTimeMins} minutes.`;
  }

  // 2. Concession (food/drink) query
  if (query.includes("food") || query.includes("nacho") || query.includes("concession") || query.includes("taco") || query.includes("burger") || query.includes("comida") || query.includes("manger") || query.includes("طعام") || query.includes("drink")) {
    const foodStands = facilities.filter(f => f.type === 'concession' && f.status === 'open');
    const bestFood = foodStands.length > 0 
      ? foodStands.reduce((best, cur) => cur.waitTimeMins < best.waitTimeMins ? cur : best, foodStands[0])
      : facilities.find(f => f.id === 'FAC-CON-1')!;

    if (isSpanish) {
      return `¡Tengo hambre de fútbol! Para evitar filas, vaya a ${bestFood.name}, que solo tiene un tiempo de espera de ${bestFood.waitTimeMins} minutos.`;
    }
    if (isFrench) {
      return `Pour manger rapidement, rendez-vous à ${bestFood.name} (attente de ${bestFood.waitTimeMins} minutes).`;
    }
    return `For quick service, I recommend visiting ${bestFood.name}. The current wait time is only ${bestFood.waitTimeMins} minutes.`;
  }

  // 3. Gate queries
  if (query.includes("gate") || query.includes("entrance") || query.includes("entrada") || query.includes("port")) {
    const congestedGates = gates.filter(g => g.status === 'congested');
    const openGates = gates.filter(g => g.status === 'open');
    
    let advice = `Gate A and C are currently flowing smoothly. Gate B (West) is congested due to arrivals.`;
    if (congestedGates.length > 0) {
      advice = `Avoid entering through ${congestedGates.map(cg => cg.name).join(', ')}. Use ${openGates[0]?.name || 'Gate A'} instead for faster access.`;
    }

    if (isSpanish) {
      return `Estado de accesos: Evite ${congestedGates.length > 0 ? congestedGates[0].name : 'Puerta B'} debido a la alta congestión. Use la Puerta A.`;
    }
    return advice;
  }

  // 4. Greetings
  if (query.includes("hello") || query.includes("hi") || query.includes("hola") || query.includes("bonjour") || query.includes("مرحبا")) {
    if (isSpanish) return "¡Hola! Soy tu Copiloto de ArenaOS. ¿Cómo puedo ayudarte hoy con tu ubicación, baños o comida?";
    if (isFrench) return "Bonjour! Je suis ArenaOS Copilot. Comment puis-je vous aider dans le stade aujourd'hui?";
    if (isArabic) return "مرحباً! أنا مساعد الاستاد الذكي. كيف يمكنني مساعدتك اليوم؟";
    return "Hi there! I'm your ArenaOS Copilot. How can I help you find your seat, locate concessions, or check restroom lines today?";
  }

  // Default fallback Q&A
  if (isSpanish) {
    return "Disculpe, no entendí bien. Puede preguntarme sobre la ubicación de baños libres, comida con poca fila o puertas de salida.";
  }
  if (isFrench) {
    return "Désolé, je n'ai pas bien compris. Vous pouvez me demander où trouver les toilettes, les stands de nourriture ou l'état des portes.";
  }
  return "I'm here to help navigate the World Cup venue. Ask me about the shortest lines for food or toilets, gate status, or reporting an incident.";
}

function parseIncidentLocally(rawText: string): {
  title: string;
  category: Incident['category'];
  severity: Incident['severity'];
  description: string;
} {
  const query = rawText.toLowerCase();
  
  let category: Incident['category'] = 'info';
  let severity: Incident['severity'] = 'low';
  let title = "Staff Assistance Logged";
  
  if (query.includes("leak") || query.includes("spill") || query.includes("water") || query.includes("broken") || query.includes("debris") || query.includes("seat")) {
    category = 'maintenance';
    title = query.includes("water") || query.includes("leak") ? "Water leak reported" : "Seat/Maintenance Issue";
    severity = query.includes("leak") && query.includes("heavy") ? "high" : "medium";
  } else if (query.includes("hurt") || query.includes("medical") || query.includes("faint") || query.includes("collapse") || query.includes("injury") || query.includes("bleed")) {
    category = 'medical';
    title = "Medical aid required";
    severity = query.includes("unconscious") || query.includes("faint") ? "critical" : "high";
  } else if (query.includes("fight") || query.includes("security") || query.includes("stole") || query.includes("bag") || query.includes("threat")) {
    category = 'security';
    title = "Security response request";
    severity = query.includes("fight") ? "high" : "medium";
  } else if (query.includes("crowd") || query.includes("congestion") || query.includes("blocked") || query.includes("pushing")) {
    category = 'crowd_control';
    title = "Crowd bottleneck alert";
    severity = "medium";
  }

  return {
    title,
    category,
    severity,
    description: rawText
  };
}
