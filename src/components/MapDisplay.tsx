import React from 'react';
import { Facility, Gate, Incident, User, UserLocation } from '../types';
import { 
  Map as MapIcon, 
  Clock, 
  Navigation 
} from 'lucide-react';

interface MapDisplayProps {
  facilities: Facility[];
  gates: Gate[];
  incidents: Incident[];
  users: User[];
  role: 'fan' | 'volunteer' | 'organizer';
  selectedFacility: Facility | null;
  setSelectedFacility: (f: Facility | null) => void;
  selectedIncident: Incident | null;
  setSelectedIncident: (i: Incident | null) => void;
  simActive: boolean;
  setSimActive: (active: boolean) => void;
  navigationPath: { from: UserLocation; to: { x: number; y: number }; label: string } | null;
  setNavigationPath: (path: { from: UserLocation; to: { x: number; y: number }; label: string } | null) => void;
  handleSendFanMessage: (text?: string) => void;
  handleAutoDispatch: (incidentId: string) => void;
}

export const MapDisplay: React.FC<MapDisplayProps> = ({
  facilities,
  gates,
  incidents,
  users,
  role,
  selectedFacility,
  setSelectedFacility,
  selectedIncident,
  setSelectedIncident,
  simActive,
  setSimActive,
  navigationPath,
  setNavigationPath,
  handleSendFanMessage,
  handleAutoDispatch,
}) => {
  return (
    <>
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
                  className="bg-pitch-cyan text-black px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-pitch-cyan/90 transition-all focus:ring-2 focus:ring-pitch-cyan focus:outline-none"
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
                    className="bg-pitch-gold text-black px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-pitch-gold/90 transition-all focus:ring-2 focus:ring-pitch-gold focus:outline-none"
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
    </>
  );
};
