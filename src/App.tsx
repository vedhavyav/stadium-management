import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { FAN_START_LOCATION,DEFAULT_VOLUNTEER_ID} from './constants';
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
import { MapDisplay } from './components/MapDisplay';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthPortal } from './components/AuthPortal';
import { FanDashboard } from './components/FanDashboard';
import { VolunteerDashboard } from './components/VolunteerDashboard';
import { OrganizerDashboard } from './components/OrganizerDashboard';
import { Key } from 'lucide-react';

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
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>(DEFAULT_VOLUNTEER_ID); // default to Carlos
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

  // Memoized collections to optimize render cycles and maximize efficiency
  const volunteerUsers = useMemo(() => users.filter(u => u.role === 'volunteer'), [users]);
  const activeVolunteersCount = useMemo(() => users.filter(u => u.role === 'volunteer' && u.status === 'active').length, [users]);
  const unresolvedIncidentsCount = useMemo(() => incidents.filter(inc => inc.status !== 'resolved').length, [incidents]);
  const averageFacilityWaitTime = useMemo(() => {
    if (facilities.length === 0) return 0;
    return Math.round(facilities.reduce((sum, f) => sum + f.waitTimeMins, 0) / facilities.length);
  }, [facilities]);

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
      // Pause updates if page is not active (Page Visibility API)
      if (document.hidden) return;
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

  // Helper to append a single ChatMessage object to the active fan list
  const appendChatMessage = useCallback((role: 'user' | 'model', message: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(),
      role,
      message,
      timestamp: new Date().toISOString()
    };
    setFanChat(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  // --- Chat submission handles ---
  const handleSendFanMessage = useCallback(async (textToSend?: string) => {
    const messageText = textToSend || chatInput;
    if (!messageText.trim()) return;

    if (!textToSend) setChatInput('');

    const newUserMessage = appendChatMessage('user', messageText);
    const nextHistory = [...fanChat, newUserMessage].map(h => ({ role: h.role, message: h.message }));

    setIsChatTyping(true);
    try {
      const response = await chatWithAI(
        messageText,
        nextHistory,
        facilities,
        gates
      );
      appendChatMessage('model', response);
    } catch (err) {
      console.error("Gemini Copilot conversation failure:", err);
    } finally {
      setIsChatTyping(false);
    }
  }, [chatInput, fanChat, facilities, gates, appendChatMessage]);

  // Helper utility to fetch volunteer stadium policy/rules answers from fallback or Gemini
  const fetchVolunteerProtocolAnswer = useCallback(async (question: string) => {
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
    return chatWithAI(
      `Staff Question: ${question}. Protocol Context: ${protocolDocsPrompt}`,
      [],
      facilities,
      gates
    );
  }, [facilities, gates]);

  // --- Volunteer quick protocol Q&A ---
  const handleSendVolunteerCopilot = useCallback(async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setVolunteerCopilotQ(textToSend);
    setIsVolCopilotTyping(true);

    try {
      const answer = await fetchVolunteerProtocolAnswer(textToSend);
      setVolunteerCopilotAns(answer);
    } catch (e) {
      console.error("Volunteer copilot lookup failure:", e);
      setVolunteerCopilotAns("Lost bags must be brought to Zone A medical center. Clear plastic bags only are allowed in the stands.");
    } finally {
      setIsVolCopilotTyping(false);
    }
  }, [fetchVolunteerProtocolAnswer]);

  // --- Ground-staff incident submission ---
  const handleReportIncident = useCallback(async (e: React.FormEvent) => {
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
  }, [volunteerReportText, currentVolunteer, assignedIncident]);

  // --- GenAI Operations Advisor Logic ---
  const handleGenerateAIAdvice = useCallback(async () => {
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
  }, [incidents, gates, facilities, users, isApiConfigured]);

  // --- Dispatch Controller (Organizer Actions) ---
  const handleAutoDispatch = useCallback((incidentId: string) => {
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
  }, [incidents, users]);

  // --- GenAI Volunteer Translation Logic ---
  const handleTranslateMessage = useCallback(async () => {
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
  }, [volunteerTranslateInput, isApiConfigured, facilities, gates]);

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
      
      const fanLocation: UserLocation = FAN_START_LOCATION; // Diego location
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
  const gateChartData = useMemo(() => gates.map(g => ({
    name: g.name.replace(" Entrance)", "").replace("Gate ", "Gate "),
    flow: g.flowRateIn,
    status: g.status
  })), [gates]);



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
      <AuthPortal
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authName={authName}
        setAuthName={setAuthName}
        authRole={authRole}
        setAuthRole={setAuthRole}
        authLang={authLang}
        setAuthLang={setAuthLang}
        isSignUpMode={isSignUpMode}
        setIsSignUpMode={setIsSignUpMode}
        authError={authError}
        setAuthError={setAuthError}
        handleAuthSubmit={handleAuthSubmit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-pitch-bg text-gray-100 flex flex-col font-sans select-none pb-8">
      {/* Skip Navigation Link for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-pitch-emerald text-black px-4 py-2 rounded-lg font-bold z-[100] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pitch-emerald"
      >
        Skip to main content
      </a>
      {/* --- Global Header --- */}
      <Header
        currentUser={currentUser!}
        handleSignOut={handleSignOut}
        showApiModal={showApiModal}
        setShowApiModal={setShowApiModal}
        isApiConfigured={isApiConfigured}
      />

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
      <main id="main-content" className="flex-1 w-full max-w-[1600px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* --- LEFT HAND SIDE: MAP DISPLAY & DETAILS (8 cols) --- */}
        <section className="lg:col-span-7 flex flex-col gap-6 w-full">
          <MapDisplay
            facilities={facilities}
            gates={gates}
            incidents={incidents}
            users={users}
            role={role}
            selectedFacility={selectedFacility}
            setSelectedFacility={setSelectedFacility}
            selectedIncident={selectedIncident}
            setSelectedIncident={setSelectedIncident}
            simActive={simActive}
            setSimActive={setSimActive}
            navigationPath={navigationPath}
            setNavigationPath={setNavigationPath}
            handleSendFanMessage={handleSendFanMessage}
            handleAutoDispatch={handleAutoDispatch}
          />
        </section>

        {/* --- RIGHT HAND SIDE: ACTION BOARDS & CHATS (5 cols) --- */}
        <section className="lg:col-span-5 flex flex-col gap-6 w-full">

          {/* ========================================================================= */}
          {/* 1. FAN PORTAL VIEW */}
          {/* ========================================================================= */}
          {role === 'fan' && (
            <FanDashboard
              currentUser={currentUser!}
              fanChat={fanChat}
              chatInput={chatInput}
              setChatInput={setChatInput}
              isChatTyping={isChatTyping}
              handleSendFanMessage={handleSendFanMessage}
              handleTriggerQuickNavigation={handleTriggerQuickNavigation}
              chatEndRef={chatEndRef}
            />
          )}

          {/* ========================================================================= */}
          {/* 2. VOLUNTEER VIEW */}
          {/* ========================================================================= */}
          {role === 'volunteer' && (
            <VolunteerDashboard
              volunteerUsers={volunteerUsers}
              selectedVolunteerId={selectedVolunteerId}
              setSelectedVolunteerId={setSelectedVolunteerId}
              currentVolunteer={currentVolunteer!}
              assignedIncident={assignedIncident || null}
              handleUpdateTaskStatus={handleUpdateTaskStatus}
              volunteerCopilotAns={volunteerCopilotAns}
              volunteerCopilotQ={volunteerCopilotQ}
              setVolunteerCopilotQ={setVolunteerCopilotQ}
              handleSendVolunteerCopilot={handleSendVolunteerCopilot}
              isVolCopilotTyping={isVolCopilotTyping}
              volunteerTranslateInput={volunteerTranslateInput}
              setVolunteerTranslateInput={setVolunteerTranslateInput}
              handleTranslateMessage={handleTranslateMessage}
              isTranslating={isTranslating}
              volunteerTranslateOutput={volunteerTranslateOutput}
              handleReportIncident={handleReportIncident}
              volunteerReportText={volunteerReportText}
              setVolunteerReportText={setVolunteerReportText}
              isSubmittingReport={isSubmittingReport}
            />
          )}

          {role === 'organizer' && (
            <OrganizerDashboard
              handleGenerateAIAdvice={handleGenerateAIAdvice}
              isAdvisorLoading={isAdvisorLoading}
              advisorRecommendation={advisorRecommendation}
              incidents={incidents}
              unresolvedIncidentsCount={unresolvedIncidentsCount}
              averageFacilityWaitTime={averageFacilityWaitTime}
              activeVolunteersCount={activeVolunteersCount}
              handleAutoDispatch={handleAutoDispatch}
              users={users}
              gateChartData={gateChartData}
            />
          )}

        </section>

      </main>

      <Footer />
    </div>
  );
}
