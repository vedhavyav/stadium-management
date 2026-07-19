import { useState, useEffect, useRef } from 'react';
import { 
  User,Incident, Facility, 
  Gate, 
  ChatMessage, 
  UserLocation 
} from './types';
import { 
  INITIAL_USERS, 
  INITIAL_FACILITIES, 
  INITIAL_GATES, 
  INITIAL_INCIDENTS, 
  simulateStadiumChanges, 
  getClosestAvailableVolunteer,
  calculateDistance
} from './data/mockDb';
import { 
  initializeGemini, 
  chatWithAI, 
  analyzeIncident 
} from './utils/gemini';
import { 
  signInUser, 
  signUpUser, 
  logOutUser, 
  getCurrentUserProfile, 
  auth 
} from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Clock, 
  Navigation, 
  ShieldAlert, 
  Activity, 
  User as UserIcon, 
  Key, 
  Map as MapIcon, 
  Ticket, 
  TrendingUp,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export default function App() {
  // --- State Variables ---
  const [role, setRole] = useState<'fan' | 'volunteer' | 'organizer'>('fan');
  const [users] = useState<User[]>(INITIAL_USERS);
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [gates, setGates] = useState<Gate[]>(INITIAL_GATES);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  
  // Firebase Auth states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authName, setAuthName] = useState<string>('');
  const [authRole, setAuthRole] = useState<'fan' | 'volunteer' | 'organizer'>('fan');
  const [authLang, setAuthLang] = useState<User['languagePref']>('en');
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // GenAI Operations Advisor states
  const [advisorRecommendation, setAdvisorRecommendation] = useState<string>(
    "Awaiting operations logs... Click 'Generate AI Advice' below to get real-time recommendations."
  );
  const [isAdvisorLoading, setIsAdvisorLoading] = useState<boolean>(false);
  
  // App state controls
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiConfigured, setIsApiConfigured] = useState<boolean>(false);
  const [showApiModal, setShowApiModal] = useState<boolean>(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Simulation controls
  const [simActive, setSimActive] = useState<boolean>(true);

  // Fan Portal State
  const [fanChat, setFanChat] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      message: "Hi Diego! I'm your ArenaOS Copilot for the Mexico vs USA match at the Estadio Azteca. I can show you walking paths, gates, and find facilities with the shortest wait times. What can I do for you?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatTyping, setIsChatTyping] = useState<boolean>(false);
  const [navigationPath, setNavigationPath] = useState<{ from: UserLocation; to: { x: number; y: number }; label: string } | null>(null);

  // Volunteer Portal State
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('USR-VOL-2'); // default to Carlos
  const [volunteerReportText, setVolunteerReportText] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);
  const [volunteerCopilotQ, setVolunteerCopilotQ] = useState<string>('');
  const [volunteerCopilotAns, setVolunteerCopilotAns] = useState<string>('');
  const [isVolCopilotTyping, setIsVolCopilotTyping] = useState<boolean>(false);

  // GenAI Volunteer Translation states
  const [volunteerTranslateInput, setVolunteerTranslateInput] = useState<string>('');
  const [volunteerTranslateOutput, setVolunteerTranslateOutput] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // DOM Refs
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Firebase Auth Observer ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      setAuthError(null);
      if (fUser) {
        const profile = getCurrentUserProfile(fUser.uid, fUser.email || '');
        setCurrentUser(profile);
        setRole(profile.role);
        // If volunteer logs in, sync their volunteer ID
        if (profile.role === 'volunteer') {
          setSelectedVolunteerId(profile.id);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // --- Auth Sign In / Sign Up handler ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (isSignUpMode) {
        if (!authName.trim()) {
          throw new Error("Display Name is required.");
        }
        await signUpUser(authEmail, authPassword, authName, authRole, authLang);
      } else {
        await signInUser(authEmail, authPassword);
      }
      // reset forms
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "Authentication failed.";
      if (err.code === 'auth/invalid-email') errMsg = "Invalid email format.";
      if (err.code === 'auth/weak-password') errMsg = "Password must be at least 6 characters.";
      if (err.code === 'auth/wrong-password') errMsg = "Incorrect password.";
      if (err.code === 'auth/email-already-in-use') errMsg = "This email is already registered.";
      setAuthError(errMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    try {
      await logOutUser();
    } catch (err) {
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  // --- Initialize Gemini API Key ---
  const handleSaveApiKey = () => {
    initializeGemini(apiKey);
    setIsApiConfigured(apiKey.trim() !== '');
    setShowApiModal(false);
  };

  // --- Real-time Simulator Loop ---
  useEffect(() => {
    if (!simActive) return;
    const interval = setInterval(() => {
      const { facilities: nextF, gates: nextG } = simulateStadiumChanges(facilities, gates);
      setFacilities(nextF);
      setGates(nextG);
    }, 5000);
    return () => clearInterval(interval);
  }, [facilities, gates, simActive]);

  // Scroll fan chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [fanChat]);

  // Get active volunteer profile
  const currentVolunteer = users.find(u => u.id === selectedVolunteerId) || users[1];
  const assignedIncident = incidents.find(
    inc => inc.assignedToId === currentVolunteer.id && inc.status !== 'resolved'
  );

  // --- Chat submission handles ---
  const handleSendFanMessage = async (textToSend?: string) => {
    const messageText = textToSend || chatInput;
    if (!messageText.trim()) return;

    if (!textToSend) setChatInput('');

    const newUserMessage: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      message: messageText,
      timestamp: new Date().toISOString()
    };

    const nextHistory = [...fanChat, newUserMessage];
    setFanChat(nextHistory);
    setIsChatTyping(true);

    try {
      const response = await chatWithAI(
        messageText,
        nextHistory.map(h => ({ role: h.role, message: h.message })),
        facilities,
        gates
      );

      setFanChat(prev => [...prev, {
        id: Math.random().toString(),
        role: 'model',
        message: response,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatTyping(false);
    }
  };

  // --- Volunteer quick protocol Q&A ---
  const handleSendVolunteerCopilot = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setVolunteerCopilotQ(textToSend);
    setIsVolCopilotTyping(true);

    const protocolDocsPrompt = `
      You are the ArenaOS Staff Protocol Copilot.
      Answer the volunteer's question regarding World Cup stadium protocol.
      Use these rules:
      - Baggage: spectators can only bring clear bags under 12x6x12 inches.
      - Lost items: Deliver all items to the primary Medical Clinic/Info hub in Zone A.
      - Medical Emergencies: Volunteer must stay with the fan, report immediately via the app, and wait for medical dispatch.
      - Ticket Issues: Send spectator to the nearest ticketing container outside Gate B or D.
      Keep answer very brief (1-2 sentences).
    `;

    try {
      const answer = await chatWithAI(
        `Staff Question: ${textToSend}. Protocol Context: ${protocolDocsPrompt}`,
        [],
        facilities,
        gates
      );
      setVolunteerCopilotAns(answer);
    } catch (e) {
      setVolunteerCopilotAns("Lost bags must be brought to Zone A medical center. Clear plastic bags only are allowed in the stands.");
    } finally {
      setIsVolCopilotTyping(false);
    }
  };

  // --- Ground-staff incident submission ---
  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerReportText.trim()) return;

    setIsSubmittingReport(true);
    try {
      // Analyze text via GenAI
      const analysis = await analyzeIncident(volunteerReportText);
      
      // Create new incident
      const newIncident: Incident = {
        id: `INC-${Math.floor(100 + Math.random() * 900)}`,
        title: analysis.title,
        description: analysis.description,
        status: 'pending',
        category: analysis.category,
        severity: analysis.severity,
        coordinates: currentVolunteer.currentLocation, // reported at volunteer location
        reporterId: currentVolunteer.id,
        assignedToId: null,
        createdAt: new Date().toISOString(),
        resolvedAt: null
      };

      setIncidents(prev => [newIncident, ...prev]);
      setVolunteerReportText('');
      
      // Auto dispatch if volunteer is free and reports it
      if (!assignedIncident) {
        // Assign to self automatically
        setIncidents(prev => 
          prev.map(inc => inc.id === newIncident.id 
            ? { ...inc, status: 'in_progress', assignedToId: currentVolunteer.id } 
            : inc
          )
        );
      }
    } catch (error) {
      console.error("Incident reporting failed", error);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // --- GenAI Operations Advisor Logic ---
  const handleGenerateAIAdvice = async () => {
    setIsAdvisorLoading(true);
    setAdvisorRecommendation("Analyzing live stadium data feed...");
    
    const unresolvedIncidents = incidents.filter(inc => inc.status !== 'resolved');
    const congestedGates = gates.filter(g => g.status === 'congested');
    const longestWaitFac = [...facilities].sort((a, b) => b.waitTimeMins - a.waitTimeMins)[0];
    
    const operationalLogs = `
      - Unresolved Incidents: ${unresolvedIncidents.length} (${unresolvedIncidents.map(i => `${i.title} [${i.severity}]`).join(', ') || 'None'})
      - Congested Gates: ${congestedGates.length} (${congestedGates.map(g => g.name).join(', ') || 'None'})
      - Facility Bottleneck: ${longestWaitFac ? `${longestWaitFac.name} at ${longestWaitFac.waitTimeMins} mins` : 'None'}
      - Active Volunteers: ${users.filter(u => u.role === 'volunteer' && u.status === 'active').length}
    `;

    try {
      if (isApiConfigured) {
        const response = await chatWithAI(
          `System Role: You are the Lead Operations Director AI for the FIFA 2026 World Cup at Estadio Azteca. 
          Provide a concise, bulleted operational suggestion list (maximum 3 bullet points, maximum 50 words total) 
          based on these current stadium conditions:
          ${operationalLogs}
          Focus only on critical tasks: volunteer re-routing, crowd flow redirection, and dispatch. Keep it professional and action-oriented.`,
          [],
          facilities,
          gates
        );
        setAdvisorRecommendation(response);
      } else {
        // Smart Local fallback advice generator based on metrics
        await new Promise(resolve => setTimeout(resolve, 800)); // simulate AI thinking
        const recommendations: string[] = [];
        if (unresolvedIncidents.length > 0) {
          recommendations.push(`⚠️ Dispatch volunteers to resolve pending incident: ${unresolvedIncidents[0].title}.`);
        }
        if (congestedGates.length > 0) {
          recommendations.push(`🚦 Redirect arriving spectators from ${congestedGates[0].name} to open gates.`);
        }
        if (longestWaitFac && longestWaitFac.waitTimeMins > 10) {
          recommendations.push(`🛒 Redeploy snack-bar queue marshals to assist at ${longestWaitFac.name} (${longestWaitFac.waitTimeMins} min queue).`);
        }
        if (recommendations.length === 0) {
          recommendations.push(`✅ Operations normal. Keep monitoring gates and concession wait times.`);
        }
        setAdvisorRecommendation(recommendations.join('\n'));
      }
    } catch (err) {
      console.error(err);
      setAdvisorRecommendation("Error generating advice. Please check your Gemini API key.");
    } finally {
      setIsAdvisorLoading(false);
    }
  };

  // --- Dispatch Controller (Organizer Actions) ---
  const handleAutoDispatch = (incidentId: string) => {
    const incident = incidents.find(inc => inc.id === incidentId);
    if (!incident) return;

    // Find nearest active available volunteer
    const nearestVolunteer = getClosestAvailableVolunteer(incident.coordinates, users, incidents);
    
    if (nearestVolunteer) {
      setIncidents(prev => 
        prev.map(inc => inc.id === incidentId 
          ? { ...inc, status: 'dispatched', assignedToId: nearestVolunteer.id } 
          : inc
        )
      );
      
      // Update users status/log
      alert(`AI System dispatched ${nearestVolunteer.name} to "${incident.title}" (Distance: ${Math.round(calculateDistance(nearestVolunteer.currentLocation, incident.coordinates))}m)`);
    } else {
      alert("No available volunteers at the moment. All active volunteers are currently busy!");
    }
  };

  // --- GenAI Volunteer Translation Logic ---
  const handleTranslateMessage = async () => {
    if (!volunteerTranslateInput.trim()) return;
    setIsTranslating(true);
    setVolunteerTranslateOutput("Translating spectator query...");
    try {
      if (isApiConfigured) {
        const response = await chatWithAI(
          `System Role: You are a professional translation bot for FIFA 2026 stadium volunteer staff.
          Translate the following spectator message into English, preserving tone and intent. 
          Respond with ONLY the translated text:
          "${volunteerTranslateInput}"`,
          [],
          facilities,
          gates
        );
        setVolunteerTranslateOutput(response);
      } else {
        // Smart Local keyword translator
        await new Promise(resolve => setTimeout(resolve, 600)); // simulate thinking
        const text = volunteerTranslateInput.toLowerCase();
        let translation = "Could not translate. Using fallback: ";
        if (text.includes('agua') || text.includes('fuite') || text.includes('water') || text.includes('leak')) {
          translation = "Translated from Spanish/French: 'There is a water leak / wet area nearby.'";
        } else if (text.includes('baño') || text.includes('toilette') || text.includes('restroom') || text.includes('wc')) {
          translation = "Translated from Spanish/French: 'Where is the nearest restroom/toilet?'";
        } else if (text.includes('médico') || text.includes('medecin') || text.includes('hurt') || text.includes('fainted')) {
          translation = "Translated from Spanish/French: 'Medical assistance is requested. Someone is injured or unwell.'";
        } else if (text.includes('pelea') || text.includes('dispute') || text.includes('fight')) {
          translation = "Translated from Spanish/French: 'Security concern. Spectators are arguing/fighting.'";
        } else {
          translation = `Translated from foreign spectator language: "${volunteerTranslateInput}"`;
        }
        setVolunteerTranslateOutput(translation);
      }
    } catch (err) {
      console.error(err);
      setVolunteerTranslateOutput("Translation failed. Please check your Gemini configuration.");
    } finally {
      setIsTranslating(false);
    }
  };

  // --- Volunteer task controls ---
  const handleUpdateTaskStatus = (incidentId: string, nextStatus: Incident['status']) => {
    setIncidents(prev => 
      prev.map(inc => inc.id === incidentId 
        ? { 
            ...inc, 
            status: nextStatus,
            resolvedAt: nextStatus === 'resolved' ? new Date().toISOString() : null
          } 
        : inc
      )
    );
  };

  // --- Map Routing triggered from Fan Quick Chips ---
  const handleTriggerQuickNavigation = (facilityType: Facility['type']) => {
    // find facility with lowest wait time
    const matches = facilities.filter(f => f.type === facilityType && f.status === 'open');
    if (matches.length > 0) {
      const best = matches.reduce((best, cur) => cur.waitTimeMins < best.waitTimeMins ? cur : best, matches[0]);
      
      const fanLocation: UserLocation = { zone: "Section 104", x: 26, y: 35 }; // Diego location
      setNavigationPath({
        from: fanLocation,
        to: best.coordinates,
        label: best.name
      });
      setSelectedFacility(best);

      // Trigger chat prompt
      handleSendFanMessage(`Show me how to walk to the nearest open ${facilityType === 'restroom' ? 'toilet' : 'food stand'}`);
    }
  };

  // --- Dashboard Data compilation ---
  const gateChartData = gates.map(g => ({
    name: g.name.replace(" Entrance)", "").replace("Gate ", "Gate "),
    flow: g.flowRateIn,
    status: g.status
  }));



  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center text-gray-100 font-sans">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pitch-emerald to-pitch-cyan flex items-center justify-center font-bold text-3xl animate-bounce shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          ⚽
        </div>
        <h2 className="mt-6 font-sporty font-bold text-lg tracking-wide animate-pulse">Initializing ArenaOS Secure Portal...</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">Connecting Firebase Services</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-pitch-bg flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Background Decorative Pitch Lines */}
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <ellipse cx="50" cy="50" rx="40" ry="45" fill="none" stroke="#FFF" strokeWidth="1" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="#FFF" strokeWidth="1" />
          </svg>
        </div>

        <div className="glass-panel w-full max-w-md p-6 md:p-8 rounded-2xl border border-pitch-border shadow-2xl relative z-10 fade-in">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pitch-emerald to-pitch-cyan flex items-center justify-center font-bold text-2xl text-black shadow-lg glow-emerald mb-3">
              ⚽
            </div>
            <h1 className="font-sporty font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-pitch-emerald to-pitch-cyan">
              ArenaOS Portal
            </h1>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-1">
              FIFA World Cup 2026 Smart Stadium
            </p>
          </div>

          {/* Form Switcher */}
          <div className="flex border-b border-pitch-border pb-3 mb-5 gap-4">
            <button 
              onClick={() => { setIsSignUpMode(false); setAuthError(null); }}
              className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 ${!isSignUpMode ? 'border-pitch-emerald text-pitch-emerald' : 'border-transparent text-gray-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setIsSignUpMode(true); setAuthError(null); }}
              className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 ${isSignUpMode ? 'border-pitch-emerald text-pitch-emerald' : 'border-transparent text-gray-400 hover:text-white'}`}
            >
              Register Account
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-400 flex items-center gap-2 slide-up">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 text-xs">
            {isSignUpMode && (
              <div>
                <label className="block text-[9px] font-semibold text-gray-400 uppercase mb-1">Display Name</label>
                <input 
                  type="text"
                  placeholder="Diego Ramirez"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-slate-900 border border-pitch-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-pitch-emerald text-gray-100"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[9px] font-semibold text-gray-400 uppercase mb-1">Email Address</label>
              <input 
                type="email"
                placeholder="diego@stadium.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-slate-900 border border-pitch-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-pitch-emerald text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] font-semibold text-gray-400 uppercase mb-1">Password</label>
              <input 
                type="password"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-slate-900 border border-pitch-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-pitch-emerald text-gray-100"
                required
              />
            </div>

            {isSignUpMode && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-semibold text-gray-400 uppercase mb-1">Choose Role</label>
                  <select 
                    value={authRole}
                    onChange={(e) => setAuthRole(e.target.value as any)}
                    className="w-full bg-slate-900 border border-pitch-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-pitch-emerald text-gray-100"
                  >
                    <option value="fan">Fan Spectator</option>
                    <option value="volunteer">Volunteer Staff</option>
                    <option value="organizer">Command Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-gray-400 uppercase mb-1">Language</label>
                  <select 
                    value={authLang}
                    onChange={(e) => setAuthLang(e.target.value as any)}
                    className="w-full bg-slate-900 border border-pitch-border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-pitch-emerald text-gray-100"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="pt">Português</option>
                    <option value="de">Deutsch</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-pitch-emerald text-black py-2.5 rounded-lg text-xs font-bold hover:bg-pitch-emerald/90 transition-all uppercase mt-2 shadow-lg shadow-pitch-emerald/20"
            >
              {isSignUpMode ? 'Register New Profile' : 'Authenticate Credentials'}
            </button>
          </form>

          {/* Test credentials tips */}
          <div className="mt-6 border-t border-pitch-border/50 pt-4 text-[10px] text-gray-400">
            <span className="font-semibold block text-[10px] text-pitch-gold uppercase mb-1">💡 Pre-seeded testing accounts:</span>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Fan</strong>: <code className="text-gray-300">diego@stadium.com</code></li>
              <li><strong>Volunteer</strong>: <code className="text-gray-300">sarah@stadium.com</code></li>
              <li><strong>Organizer</strong>: <code className="text-gray-300">marcus@stadium.com</code></li>
            </ul>
            <p className="mt-2 text-gray-500 font-medium italic">Password for all is <code className="text-gray-400">password</code></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pitch-bg text-gray-100 flex flex-col font-sans select-none pb-8">
      {/* --- Global Header --- */}
      <header className="border-b border-pitch-border bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pitch-emerald to-pitch-cyan flex items-center justify-center font-bold text-xl text-black shadow-lg">
            ⚽
          </div>
          <div>
            <h1 className="font-sporty font-extrabold text-lg md:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-pitch-emerald to-pitch-cyan">
              ArenaOS
            </h1>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
              FIFA World Cup 2026 Operations
            </p>
          </div>
        </div>

        {/* --- Profile Details & Logout --- */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] text-gray-300 font-semibold">{currentUser.name}</span>
            <span className="text-[10px] font-extrabold text-pitch-emerald uppercase tracking-wider">
              {currentUser.role === 'fan' ? 'Fan Spectator' : currentUser.role === 'volunteer' ? 'Volunteer Staff' : 'Command Center Organizer'}
            </span>
          </div>
          <button 
            onClick={handleSignOut}
            className="px-3 py-1.5 bg-slate-900 border border-pitch-border hover:border-red-900/50 hover:bg-red-950/10 text-gray-300 hover:text-red-400 rounded-lg text-xs font-bold transition-all uppercase"
          >
            Sign Out
          </button>
        </div>

        {/* --- Gemini configuration widget --- */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowApiModal(!showApiModal)}
            className={`p-2 rounded-full border transition-all ${isApiConfigured ? 'border-pitch-emerald bg-pitch-emerald/10 text-pitch-emerald' : 'border-pitch-border hover:bg-white/5 text-gray-400'}`}
            title="Configure Gemini API Key"
            aria-label="Configure Gemini API Key"
          >
            <Key className="w-4.5 h-4.5" />
          </button>
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] text-gray-400">AI Engine Status</span>
            <span className={`text-xs font-bold ${isApiConfigured ? 'text-pitch-emerald' : 'text-pitch-gold'}`}>
              {isApiConfigured ? 'Gemini 1.5 Live' : 'Local Fallback AI'}
            </span>
          </div>
        </div>
      </header>

      {/* --- API Key Config Modal --- */}
      {showApiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-pitch-border shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-pitch-emerald">
                <Key className="w-5 h-5" />
                <h3 className="font-sporty font-bold text-lg">Configure Gemini API Key</h3>
              </div>
              <button 
                onClick={() => setShowApiModal(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Enter your Gemini API key to enable live generation for multi-lingual chats, automated location analysis, and incident routing. If left empty, the app runs on a smart local fallback.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase mb-1">API Key</label>
              <input 
                type="password" 
                placeholder="AIzaSy..." 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                className="w-full bg-slate-900 border border-pitch-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pitch-emerald text-gray-100"
              />
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button 
                onClick={() => { setApiKey(''); initializeGemini(''); setIsApiConfigured(false); setShowApiModal(false); }}
                className="px-3 py-2 rounded-lg bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-950/60"
              >
                Clear Key
              </button>
              <button 
                onClick={handleSaveApiKey}
                className="px-4 py-2 rounded-lg bg-pitch-emerald text-black font-bold hover:bg-pitch-emerald/90"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Main Dashboard Container --- */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* --- LEFT HAND SIDE: MAP DISPLAY & DETAILS (8 cols) --- */}
        <section className="lg:col-span-7 flex flex-col gap-6 w-full">
          
          {/* Map Canvas */}
          <div className="glass-panel rounded-2xl overflow-hidden flex flex-col relative w-full">
            
            {/* Map Header bar */}
            <div className="px-4 py-3 bg-slate-900/50 border-b border-pitch-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapIcon className="w-4.5 h-4.5 text-pitch-emerald" />
                <h2 className="font-sporty font-bold text-sm tracking-wide">Stadium Interactive Map</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-pitch-emerald rounded-full animate-ping" />
                <span className="text-[11px] text-gray-400 font-semibold uppercase">Live Stadium Feed</span>
                <button 
                  onClick={() => setSimActive(!simActive)}
                  className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${simActive ? 'bg-pitch-emerald/20 text-pitch-emerald border border-pitch-emerald/40' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
                >
                  {simActive ? 'Sim: Active' : 'Sim: Paused'}
                </button>
              </div>
            </div>

            {/* Stadium Visual (SVG Viewport) */}
            <div className="bg-[#0b0e14] p-4 flex items-center justify-center min-h-[360px] md:min-h-[440px] relative">
              <svg 
                viewBox="0 0 100 100" 
                className="w-full max-w-[480px] h-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                role="img"
                aria-label="Interactive visual layout map of the stadium"
              >
                <title>Stadium Interactive Map</title>
                {/* Outer Stadium Perimeter Ring */}
                <ellipse cx="50" cy="50" rx="46" ry="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <ellipse cx="50" cy="50" rx="46" ry="42" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="1" />
                
                {/* Stands Seating Areas (Concentric Bands) */}
                <ellipse cx="50" cy="50" rx="38" ry="32" fill="none" stroke="#161B22" strokeWidth="6" />
                <ellipse cx="50" cy="50" rx="31" ry="24" fill="none" stroke="#21262d" strokeWidth="4" />
                
                {/* Inner Grass Soccer Pitch */}
                <rect x="30" y="34" width="40" height="32" rx="2" fill="#064e3b" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
                {/* Soccer Pitch Markings */}
                <line x1="50" y1="34" x2="50" y2="66" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
                <rect x="30" y="42" width="6" height="16" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
                <rect x="64" y="42" width="6" height="16" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />

                {/* Section Labels */}
                <text x="50" y="12" fill="rgba(255,255,255,0.25)" fontSize="3.5" textAnchor="middle" fontWeight="bold">SEC 200 (North)</text>
                <text x="50" y="90" fill="rgba(255,255,255,0.25)" fontSize="3.5" textAnchor="middle" fontWeight="bold">SEC 100 (South)</text>
                <text x="12" y="52" fill="rgba(255,255,255,0.25)" fontSize="3.5" textAnchor="middle" fontWeight="bold">SEC 110</text>
                <text x="88" y="52" fill="rgba(255,255,255,0.25)" fontSize="3.5" textAnchor="middle" fontWeight="bold">SEC 120</text>

                {/* Draw Navigation Line Path Overlay if active */}
                {navigationPath && (
                  <>
                    <path
                      d={`M ${navigationPath.from.x} ${navigationPath.from.y} L ${navigationPath.to.x} ${navigationPath.to.y}`}
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="1.2"
                      strokeDasharray="2,2"
                      className="pulse-path"
                    />
                    {/* User Marker */}
                    <circle cx={navigationPath.from.x} cy={navigationPath.from.y} r="2.2" fill="#3B82F6" className="pulse-path-node" />
                    <text x={navigationPath.from.x} y={navigationPath.from.y - 3} fill="#93C5FD" fontSize="2.5" fontWeight="bold" textAnchor="middle">You</text>
                  </>
                )}

                {/* --- RENDER GATES --- */}
                {gates.map(g => {
                  let gateColor = '#10B981'; // Open
                  if (g.status === 'congested') gateColor = '#F59E0B';
                  if (g.status === 'closed') gateColor = '#EF4444';

                  return (
                    <g 
                      key={g.id} 
                      className="cursor-pointer" 
                      onClick={() => setSelectedFacility(null)}
                      role="button"
                      aria-label={`${g.name}. Status: ${g.status}`}
                    >
                      <title>{g.name} ({g.status})</title>
                      <circle cx={g.coordinates.x} cy={g.coordinates.y} r="2.8" fill={gateColor} opacity="0.8" />
                      <circle cx={g.coordinates.x} cy={g.coordinates.y} r="1.5" fill="#0D1117" />
                      <text x={g.coordinates.x} y={g.coordinates.y - 4} fill="#F3F4F6" fontSize="2.2" fontWeight="bold" textAnchor="middle">
                        {g.name[5]}
                      </text>
                    </g>
                  );
                })}

                {/* --- RENDER FACILITIES --- */}
                {facilities.map(f => {
                  let color = '#374151';
                  if (f.type === 'concession') color = '#06B6D4'; // cyan
                  if (f.type === 'restroom') color = '#8B5CF6'; // purple
                  if (f.type === 'medical_bay') color = '#EF4444'; // red

                  const isHighlighted = selectedFacility?.id === f.id;
                  
                  return (
                    <g 
                      key={f.id} 
                      className="cursor-pointer" 
                      onClick={(e) => { e.stopPropagation(); setSelectedFacility(f); }}
                      role="button"
                      aria-label={`${f.name}. Queue wait time: ${f.waitTimeMins} minutes`}
                    >
                      <title>{f.name} - Wait: {f.waitTimeMins} mins</title>
                      {isHighlighted && (
                        <circle cx={f.coordinates.x} cy={f.coordinates.y} r="5" fill="none" stroke="#F59E0B" strokeWidth="0.8" className="pulse-path-node" />
                      )}
                      <circle 
                        cx={f.coordinates.x} 
                        cy={f.coordinates.y} 
                        r={isHighlighted ? "3" : "2.2"} 
                        fill={color} 
                        className="transition-all duration-300"
                      />
                      {/* Facility Icon Letters */}
                      <text x={f.coordinates.x} y={f.coordinates.y + 0.8} fill="#FFF" fontSize="2.4" textAnchor="middle" fontWeight="bold">
                        {f.type === 'concession' ? 'F' : f.type === 'restroom' ? 'W' : 'M'}
                      </text>
                    </g>
                  );
                })}

                {/* --- RENDER ACTIVE VOLUNTEERS (Staff map view / Command dashboard) --- */}
                {role !== 'fan' && users.filter(u => u.role === 'volunteer').map(v => (
                  <g key={v.id} className="cursor-pointer">
                    <title>{v.name}</title>
                    <circle cx={v.currentLocation.x} cy={v.currentLocation.y} r="2.5" fill="#3B82F6" stroke="#FFF" strokeWidth="0.4" />
                    {/* Small tag */}
                    <text x={v.currentLocation.x} y={v.currentLocation.y - 3.5} fill="#93C5FD" fontSize="2" fontWeight="bold" textAnchor="middle">
                      {v.name.split(' ')[0]}
                    </text>
                  </g>
                ))}

                {/* --- RENDER PULSING INCIDENTS --- */}
                {incidents.filter(inc => inc.status !== 'resolved').map(inc => {
                  const isSec = inc.category === 'security';
                  const isMed = inc.category === 'medical';
                  const color = isMed ? '#EF4444' : isSec ? '#F59E0B' : '#EC4899';
                  
                  return (
                    <g 
                      key={inc.id} 
                      className="cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setSelectedIncident(inc); }}
                      role="button"
                      aria-label={`Incident reported: ${inc.title}. Severity: ${inc.severity}`}
                    >
                      <title>Incident Alert: {inc.title} ({inc.severity})</title>
                      <circle cx={inc.coordinates.x} cy={inc.coordinates.y} r="3.2" fill={color} className="pulse-error" />
                      <circle cx={inc.coordinates.x} cy={inc.coordinates.y} r="1.5" fill="#FFF" />
                      <text x={inc.coordinates.x} y={inc.coordinates.y - 4} fill="#FDA4AF" fontSize="2.2" fontWeight="bold" textAnchor="middle">
                        ⚠
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Map Legend */}
              <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-pitch-border rounded-lg p-2 flex flex-col gap-1 text-[10px] text-gray-300">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
                  <span>Concessions (F)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                  <span>Restrooms (W)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <span>Medical (M)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  <span>Gates (A-D)</span>
                </div>
                {role !== 'fan' && (
                  <div className="flex items-center gap-1.5 border-t border-pitch-border pt-1 mt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] border border-white" />
                    <span>Volunteers</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-pink-500 pulse-error" />
                  <span>Incidents (⚠)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Overlay Panel */}
          {(selectedFacility || selectedIncident) && (
            <div className="glass-panel p-4 rounded-xl border border-pitch-border slide-up flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {selectedFacility && (
                <>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${selectedFacility.type === 'concession' ? 'bg-cyan-900/60 text-pitch-cyan' : selectedFacility.type === 'restroom' ? 'bg-purple-900/60 text-purple-400' : 'bg-red-950/60 text-pitch-error'}`}>
                      {selectedFacility.type === 'concession' ? '🍔' : selectedFacility.type === 'restroom' ? '🚻' : '🏥'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{selectedFacility.name}</h4>
                      <p className="text-xs text-gray-400 capitalize">{selectedFacility.type} • Status: <span className="font-semibold text-white">{selectedFacility.status}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <span className="text-[10px] text-gray-400 block uppercase">Est. Wait Line</span>
                      <span className={`text-base font-extrabold flex items-center gap-1 ${selectedFacility.waitTimeMins > 12 ? 'text-pitch-error' : 'text-pitch-emerald'}`}>
                        <Clock className="w-4 h-4" /> {selectedFacility.waitTimeMins} mins
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const fanLocation: UserLocation = { zone: "Section 104", x: 26, y: 35 };
                        setNavigationPath({
                          from: fanLocation,
                          to: selectedFacility.coordinates,
                          label: selectedFacility.name
                        });
                        handleSendFanMessage(`Directions to ${selectedFacility.name}`);
                      }}
                      className="bg-pitch-cyan text-black px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-pitch-cyan/90 transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Navigate Path
                    </button>
                    <button 
                      onClick={() => setSelectedFacility(null)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}

              {selectedIncident && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-500 font-bold text-lg">
                      ⚠
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-red-400 flex items-center gap-1.5">
                        {selectedIncident.title}
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${selectedIncident.severity === 'critical' ? 'bg-red-600 text-white' : selectedIncident.severity === 'high' ? 'bg-orange-600 text-white' : 'bg-yellow-600 text-black'}`}>
                          {selectedIncident.severity}
                        </span>
                      </h4>
                      <p className="text-xs text-gray-300 mt-0.5">{selectedIncident.description}</p>
                      <p className="text-[10px] text-gray-500 mt-1">Reported by: {users.find(u => u.id === selectedIncident.reporterId)?.name || 'Sensor'} • Status: <span className="uppercase font-bold text-gray-300">{selectedIncident.status}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {role === 'organizer' && selectedIncident.status === 'pending' && (
                      <button 
                        onClick={() => handleAutoDispatch(selectedIncident.id)}
                        className="bg-pitch-gold text-black px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-pitch-gold/90 transition-all"
                      >
                        AI Dispatch Staff
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedIncident(null)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </section>

        {/* --- RIGHT HAND SIDE: ACTION BOARDS & CHATS (5 cols) --- */}
        <section className="lg:col-span-5 flex flex-col gap-6 w-full">

          {/* ========================================================================= */}
          {/* 1. FAN PORTAL VIEW */}
          {/* ========================================================================= */}
          {role === 'fan' && (
            <div className="flex flex-col gap-6 fade-in">
              
              {/* Ticket Widget */}
              <div className="glass-panel p-4 rounded-2xl relative overflow-hidden bg-gradient-to-r from-slate-900 to-emerald-950/20 border-l-4 border-pitch-emerald">
                <div className="absolute right-[-20px] top-[-10px] opacity-10 text-9xl">🎫</div>
                <div className="flex items-center justify-between mb-3 border-b border-pitch-border pb-2">
                  <div className="flex items-center gap-1.5 text-pitch-emerald font-bold text-xs uppercase tracking-wider">
                    <Ticket className="w-4 h-4" /> Match Ticket
                  </div>
                  <span className="text-[10px] bg-pitch-emerald/20 text-pitch-emerald px-2 py-0.5 rounded font-bold uppercase">Zone C Entrance</span>
                </div>
                
                <h3 className="font-sporty font-extrabold text-base tracking-wide">MEXICO vs USA</h3>
                <p className="text-[11px] text-gray-400">FIFA World Cup Group Stage • Estadio Azteca</p>
                
                <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                  <div>
                    <span className="text-[9px] text-gray-500 block uppercase font-bold">Holder</span>
                    <span className="font-semibold">Diego Ramirez</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 block uppercase font-bold">Section</span>
                    <span className="font-semibold text-pitch-cyan">Sec 104</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 block uppercase font-bold">Gate</span>
                    <span className="font-semibold text-pitch-gold">Gate B</span>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Chips */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Quick Venue Actions</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleTriggerQuickNavigation('restroom')}
                    className="glass-panel p-3 rounded-xl text-left hover:border-pitch-cyan/50 hover:bg-slate-900/60 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h5 className="text-xs font-bold">Find Restrooms</h5>
                      <p className="text-[9px] text-gray-500 group-hover:text-gray-300">Locate shortest line</p>
                    </div>
                    <span className="text-lg">🚻</span>
                  </button>

                  <button 
                    onClick={() => handleTriggerQuickNavigation('concession')}
                    className="glass-panel p-3 rounded-xl text-left hover:border-pitch-cyan/50 hover:bg-slate-900/60 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h5 className="text-xs font-bold">Find Tacos / Burgers</h5>
                      <p className="text-[9px] text-gray-500 group-hover:text-gray-300">Avoid queue bottlenecks</p>
                    </div>
                    <span className="text-lg">🍔</span>
                  </button>
                </div>
              </div>

              {/* GenAI Copilot Assistant */}
              <div className="glass-panel rounded-2xl flex flex-col h-[400px] bg-slate-950/40 relative">
                
                {/* Copilot Header */}
                <div className="px-4 py-3 bg-slate-900/70 border-b border-pitch-border flex items-center justify-between rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-pitch-emerald rounded-full" />
                    <h3 className="font-sporty font-bold text-xs">ArenaOS AI Assistant</h3>
                  </div>
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Gemini Copilot</span>
                </div>

                {/* Chat Message Scroll */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {fanChat.map((chat) => {
                    const isModel = chat.role === 'model';
                    return (
                      <div 
                        key={chat.id} 
                        className={`flex flex-col max-w-[85%] ${isModel ? 'self-start' : 'self-end'}`}
                      >
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${isModel ? 'bg-slate-900 border border-pitch-border' : 'bg-pitch-emerald text-black font-semibold'}`}>
                          {chat.message}
                        </div>
                        <span className={`text-[8px] text-gray-500 mt-0.5 ${isModel ? 'self-start pl-1' : 'self-end pr-1'}`}>
                          {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  {isChatTyping && (
                    <div className="self-start max-w-[85%]">
                      <div className="bg-slate-900 border border-pitch-border px-4 py-2.5 rounded-2xl text-xs text-gray-400 italic flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-pitch-emerald animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-pitch-emerald animate-bounce delay-150" />
                        <span className="w-1.5 h-1.5 rounded-full bg-pitch-emerald animate-bounce delay-300" />
                        ArenaOS is translating & thinking...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Suggestion Chips inside Chat */}
                <div className="px-3 py-1 flex gap-1.5 overflow-x-auto border-t border-pitch-border/30 bg-slate-950/60 scrollbar-none">
                  <button 
                    onClick={() => handleSendFanMessage("Where is Section 104?")}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 border border-pitch-border text-[9px] font-medium hover:bg-white/10 hover:border-gray-400 transition-all text-gray-300"
                  >
                    📍 Where is Section 104?
                  </button>
                  <button 
                    onClick={() => handleSendFanMessage("What is the bag policy?")}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 border border-pitch-border text-[9px] font-medium hover:bg-white/10 hover:border-gray-400 transition-all text-gray-300"
                  >
                    💼 Bag Policy
                  </button>
                  <button 
                    onClick={() => handleSendFanMessage("Is Gate B open?")}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 border border-pitch-border text-[9px] font-medium hover:bg-white/10 hover:border-gray-400 transition-all text-gray-300"
                  >
                    🚪 Gate B Flow
                  </button>
                </div>

                {/* Chat Input form */}
                <div className="p-3 border-t border-pitch-border bg-slate-950/90 rounded-b-2xl flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Ask Copilot (English, Spanish, French...)"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendFanMessage()}
                    className="flex-1 bg-slate-900 border border-pitch-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pitch-emerald text-gray-100 placeholder:text-gray-500"
                  />
                  <button 
                    onClick={() => handleSendFanMessage()}
                    className="p-2 bg-pitch-emerald text-black rounded-xl hover:bg-pitch-emerald/90 transition-all shadow-md flex items-center justify-center"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. VOLUNTEER VIEW */}
          {/* ========================================================================= */}
          {role === 'volunteer' && (
            <div className="flex flex-col gap-6 fade-in">
              
              {/* Volunteer Identity selector */}
              <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center font-bold text-xs text-blue-300">
                    <UserIcon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase font-semibold">Active Volunteer Profile</span>
                    <select 
                      value={selectedVolunteerId}
                      onChange={(e) => setSelectedVolunteerId(e.target.value)}
                      className="bg-transparent text-xs font-bold text-white focus:outline-none border-b border-pitch-border pb-0.5"
                    >
                      {users.filter(u => u.role === 'volunteer').map(v => (
                        <option key={v.id} value={v.id} className="bg-slate-950 text-white">
                          {v.name} ({v.languagePref.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">Duty Location</span>
                  <span className="text-xs font-bold text-pitch-cyan">{currentVolunteer.currentLocation.zone}</span>
                </div>
              </div>

              {/* Task Dashboard card */}
              <div className="glass-panel p-4 rounded-xl border border-pitch-border">
                <h3 className="font-sporty font-bold text-xs uppercase tracking-wider mb-3 text-pitch-emerald flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> Assigned Task
                </h3>
                
                {assignedIncident ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                          ⚠ {assignedIncident.title}
                        </span>
                        <span className="text-[8px] bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded font-bold uppercase">
                          {assignedIncident.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 leading-normal">{assignedIncident.description}</p>
                      <p className="text-[10px] text-gray-500 mt-2">
                        Location coordinates on map: x={assignedIncident.coordinates.x}, y={assignedIncident.coordinates.y}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {assignedIncident.status === 'dispatched' ? (
                        <button 
                          onClick={() => handleUpdateTaskStatus(assignedIncident.id, 'in_progress')}
                          className="flex-1 bg-pitch-gold text-black py-2 rounded-lg text-xs font-bold hover:bg-pitch-gold/90 transition-all uppercase"
                        >
                          Mark as In Progress
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateTaskStatus(assignedIncident.id, 'resolved')}
                          className="flex-1 bg-pitch-emerald text-black py-2 rounded-lg text-xs font-bold hover:bg-pitch-emerald/90 transition-all uppercase flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" /> Resolve Incident
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-gray-500 border border-dashed border-pitch-border rounded-lg">
                    ✨ Zone is clear. No incidents currently assigned.
                  </div>
                )}
              </div>

              {/* Q&A AI protocol search */}
              <div className="glass-panel p-4 rounded-xl">
                <h3 className="font-sporty font-bold text-xs uppercase tracking-wider mb-2 text-pitch-cyan flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Protocol Q&A Helper
                </h3>
                <p className="text-[10px] text-gray-400 mb-3">Ask about stadium rules, prohibited items, or evacuation routes.</p>
                
                <div className="flex flex-col gap-3">
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleSendVolunteerCopilot("What items are prohibited?")}
                      className="px-2 py-1 rounded bg-slate-900 border border-pitch-border text-[9px] hover:border-pitch-cyan hover:text-pitch-cyan text-gray-400"
                    >
                      🚫 Prohibited Items
                    </button>
                    <button 
                      onClick={() => handleSendVolunteerCopilot("Lost child protocol?")}
                      className="px-2 py-1 rounded bg-slate-900 border border-pitch-border text-[9px] hover:border-pitch-cyan hover:text-pitch-cyan text-gray-400"
                    >
                      👶 Lost Child
                    </button>
                  </div>

                  {volunteerCopilotAns && (
                    <div className="p-3 bg-slate-900/60 border border-pitch-border rounded-lg text-xs leading-relaxed text-gray-300">
                      <span className="font-bold text-pitch-cyan text-[10px] block uppercase mb-1">Copilot Answer</span>
                      {volunteerCopilotAns}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Ask about bag rules, ticketing..."
                      value={volunteerCopilotQ}
                      onChange={(e) => setVolunteerCopilotQ(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendVolunteerCopilot(volunteerCopilotQ)}
                      className="flex-1 bg-slate-900 border border-pitch-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-pitch-cyan text-gray-100 placeholder:text-gray-500"
                    />
                    <button 
                      onClick={() => handleSendVolunteerCopilot(volunteerCopilotQ)}
                      className="px-3 py-1.5 bg-pitch-cyan text-black font-bold rounded-lg text-xs hover:bg-pitch-cyan/90 transition-all"
                      disabled={isVolCopilotTyping}
                    >
                      Ask
                    </button>
                  </div>
                </div>
              </div>

              {/* GenAI Translation & Summary Assistant */}
              <div className="glass-panel p-4 rounded-xl border border-pitch-cyan/30 flex flex-col gap-3">
                <h3 className="font-sporty font-bold text-xs uppercase tracking-wider text-pitch-cyan flex items-center gap-1.5">
                  ✨ Spectator Query Translator
                </h3>
                <p className="text-[10px] text-gray-400">
                  Translate queries from non-English speaking spectators (e.g., Spanish, French) instantly to coordinate assistance.
                </p>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g., '¿Dónde está el baño más cercano?' or 'Il y a une fuite d'eau'"
                      value={volunteerTranslateInput}
                      onChange={(e) => setVolunteerTranslateInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTranslateMessage()}
                      className="flex-1 bg-slate-900 border border-pitch-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-pitch-cyan text-gray-100 placeholder:text-gray-500"
                      aria-label="Spectator query to translate"
                    />
                    <button 
                      type="button"
                      onClick={handleTranslateMessage}
                      className="px-3 py-1.5 bg-pitch-cyan text-black font-bold rounded-lg text-xs hover:bg-pitch-cyan/90 transition-all uppercase"
                      disabled={isTranslating}
                    >
                      {isTranslating ? '...' : 'Translate'}
                    </button>
                  </div>

                  {volunteerTranslateOutput && (
                    <div className="p-3 bg-slate-900/60 border border-pitch-border rounded-lg text-xs leading-relaxed text-gray-300">
                      <span className="font-bold text-pitch-cyan text-[10px] block uppercase mb-1">Translation Result</span>
                      {volunteerTranslateOutput}
                    </div>
                  )}
                </div>
              </div>

              {/* Reporting Incident Form */}
              <form onSubmit={handleReportIncident} className="glass-panel p-4 rounded-xl border border-pitch-border flex flex-col gap-3">
                <h3 className="font-sporty font-bold text-xs uppercase tracking-wider text-pitch-error flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Report Stadium Incident
                </h3>
                
                <div>
                  <label className="block text-[9px] font-semibold text-gray-400 uppercase mb-1">What did you observe?</label>
                  <textarea 
                    rows={2}
                    placeholder="Describe incident in natural language. e.g., 'A spectator fainted in Sec 104' or 'Water spill near Gate 4'"
                    value={volunteerReportText}
                    onChange={(e) => setVolunteerReportText(e.target.value)}
                    className="w-full bg-slate-900 border border-pitch-border rounded-lg p-2.5 text-xs focus:outline-none focus:border-pitch-error text-gray-100 placeholder:text-gray-500 resize-none"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmittingReport}
                  className="bg-pitch-error text-white py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-all uppercase flex items-center justify-center gap-1.5"
                >
                  {isSubmittingReport ? 'Parsing Incident...' : 'Submit AI Report'}
                </button>
              </form>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. ORGANIZER VIEW (CONTROL ROOM) */}
          {/* ========================================================================= */}
          {role === 'organizer' && (
            <div className="flex flex-col gap-6 fade-in">
              
              {/* GenAI Operations Advisor Widget */}
              <div className="glass-panel p-4 rounded-xl border border-pitch-emerald/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-pitch-emerald/20 flex items-center justify-center text-pitch-emerald text-xs">
                      ✨
                    </div>
                    <h3 className="font-sporty font-bold text-xs uppercase tracking-wider text-pitch-emerald">GenAI Operations Advisor</h3>
                  </div>
                  <button
                    onClick={handleGenerateAIAdvice}
                    disabled={isAdvisorLoading}
                    className={`px-3 py-1 bg-pitch-emerald text-black text-[11px] font-bold rounded-lg hover:bg-pitch-emerald/90 transition-all uppercase ${isAdvisorLoading ? 'animate-pulse opacity-60' : ''}`}
                    aria-label="Generate AI Advice"
                  >
                    {isAdvisorLoading ? 'Analyzing...' : 'Generate Advice'}
                  </button>
                </div>
                <div className="bg-slate-950/60 rounded-lg p-3 border border-pitch-border/50 text-xs text-gray-200 leading-relaxed whitespace-pre-line">
                  {advisorRecommendation}
                </div>
              </div>

              {/* Analytics metrics grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-300 block uppercase font-bold">Incidents Logged</span>
                    <span className="text-xl font-extrabold font-sporty text-pitch-emerald">{incidents.length}</span>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-pitch-gold opacity-30" />
                </div>

                <div className="glass-panel p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-300 block uppercase font-bold">Unresolved Logs</span>
                    <span className="text-xl font-extrabold font-sporty text-pitch-error">
                      {incidents.filter(inc => inc.status !== 'resolved').length}
                    </span>
                  </div>
                  <ShieldAlert className="w-8 h-8 text-pitch-error opacity-30" />
                </div>

                <div className="glass-panel p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-300 block uppercase font-bold">Avg Wait Time</span>
                    <span className="text-xl font-extrabold font-sporty text-pitch-cyan">
                      {Math.round(facilities.reduce((sum, f) => sum + f.waitTimeMins, 0) / facilities.length)}m
                    </span>
                  </div>
                  <Clock className="w-8 h-8 text-pitch-cyan opacity-30" />
                </div>

                <div className="glass-panel p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-300 block uppercase font-bold">Active Staff</span>
                    <span className="text-xl font-extrabold font-sporty text-white">
                      {users.filter(u => u.role === 'volunteer' && u.status === 'active').length}
                    </span>
                  </div>
                  <Users className="w-8 h-8 text-white opacity-30" />
                </div>
              </div>

              {/* Incidents Ticker */}
              <div className="glass-panel p-4 rounded-xl flex flex-col gap-3">
                <h3 className="font-sporty font-bold text-xs uppercase tracking-wider text-pitch-emerald">Live Incident Queue</h3>
                
                <div className="max-h-[220px] overflow-y-auto flex flex-col gap-2 pr-1">
                  {incidents.length > 0 ? (
                    incidents.map((inc) => {
                      const isSec = inc.category === 'security';
                      const isMed = inc.category === 'medical';
                      const color = isMed ? 'border-red-900/60 bg-red-950/10' : isSec ? 'border-amber-900/60 bg-amber-950/10' : 'border-pitch-border bg-slate-900/40';
                      
                      return (
                        <div 
                          key={inc.id} 
                          className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs ${color}`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-bold truncate text-[11px]">{inc.title}</span>
                              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded ${inc.severity === 'critical' ? 'bg-red-600 text-white' : inc.severity === 'high' ? 'bg-orange-600 text-white' : 'bg-yellow-600 text-black'}`}>
                                {inc.severity}
                              </span>
                            </div>
                            <p className="text-gray-400 text-[10px] truncate">{inc.description}</p>
                            <span className="text-[8px] text-gray-500">
                              Status: <span className="uppercase text-gray-300 font-bold">{inc.status}</span>
                            </span>
                          </div>

                          <div className="flex flex-col gap-1 items-end">
                            {inc.status === 'pending' ? (
                              <button 
                                onClick={() => handleAutoDispatch(inc.id)}
                                className="bg-pitch-emerald text-black text-[9px] font-bold px-2 py-1 rounded hover:bg-pitch-emerald/90 transition-all uppercase"
                              >
                                Auto Assign
                              </button>
                            ) : inc.status !== 'resolved' ? (
                              <span className="text-[9px] text-gray-400 bg-slate-800 px-2 py-1 rounded border border-pitch-border font-medium">
                                Assigned: {users.find(u => u.id === inc.assignedToId)?.name.split(' ')[0]}
                              </span>
                            ) : (
                              <span className="text-[9px] text-pitch-emerald font-bold flex items-center gap-0.5">
                                ✓ Resolved
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 py-6 text-xs border border-dashed border-pitch-border rounded-lg">
                      No stadium incidents logged yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Chart statistics */}
              <div className="glass-panel p-4 rounded-xl flex flex-col gap-4">
                <h3 className="font-sporty font-bold text-xs uppercase tracking-wider text-pitch-cyan flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Live Traffic & Flow rate
                </h3>

                <div className="h-[140px] w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gateChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#6B7280" fontSize={10} />
                      <YAxis stroke="#6B7280" fontSize={10} />
                      <ChartTooltip 
                        contentStyle={{ background: '#0D1117', borderColor: 'rgba(255,255,255,0.08)' }} 
                        labelClassName="text-white"
                      />
                      <Bar dataKey="flow" fill="#06B6D4" radius={[4, 4, 0, 0]}>
                        {gateChartData.map((entry, index) => {
                          const color = entry.status === 'congested' ? '#F59E0B' : '#10B981';
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

        </section>

      </main>

      {/* --- Footer Details --- */}
      <footer className="mt-8 text-center text-xs text-gray-500 border-t border-pitch-border/30 pt-4 px-4 w-full">
        <p className="font-sporty tracking-wide">ArenaOS Smart Stadium Operations Dashboard • FIFA World Cup 2026 Sandbox</p>
        <p className="text-[10px] text-gray-600 mt-1">Designed by Antigravity AI Code Companion for Vedhavya Vadite.</p>
      </footer>
    </div>
  );
}
