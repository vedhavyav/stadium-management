import React from 'react';
import { User, Incident } from '../types';
import { 
  User as UserIcon, 
  Activity, 
  CheckCircle, 
  FileText, 
  AlertTriangle 
} from 'lucide-react';
import { getLanguageLabel } from '../utils/lang';

interface VolunteerDashboardProps {
  volunteerUsers: User[];
  selectedVolunteerId: string;
  setSelectedVolunteerId: (val: string) => void;
  currentVolunteer: User;
  assignedIncident: Incident | null;
  handleUpdateTaskStatus: (incidentId: string, status: 'in_progress' | 'resolved') => void;
  volunteerCopilotAns: string;
  volunteerCopilotQ: string;
  setVolunteerCopilotQ: (val: string) => void;
  handleSendVolunteerCopilot: (text: string) => void;
  isVolCopilotTyping: boolean;
  volunteerTranslateInput: string;
  setVolunteerTranslateInput: (val: string) => void;
  handleTranslateMessage: () => void;
  isTranslating: boolean;
  volunteerTranslateOutput: string;
  handleReportIncident: (e: React.FormEvent) => void;
  volunteerReportText: string;
  setVolunteerReportText: (val: string) => void;
  isSubmittingReport: boolean;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({
  volunteerUsers,
  selectedVolunteerId,
  setSelectedVolunteerId,
  currentVolunteer,
  assignedIncident,
  handleUpdateTaskStatus,
  volunteerCopilotAns,
  volunteerCopilotQ,
  setVolunteerCopilotQ,
  handleSendVolunteerCopilot,
  isVolCopilotTyping,
  volunteerTranslateInput,
  setVolunteerTranslateInput,
  handleTranslateMessage,
  isTranslating,
  volunteerTranslateOutput,
  handleReportIncident,
  volunteerReportText,
  setVolunteerReportText,
  isSubmittingReport,
}) => {
  return (
    <div className="flex flex-col gap-6 fade-in">
      
      {/* Volunteer Identity selector */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center font-bold text-xs text-blue-300">
            <UserIcon className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-300 uppercase font-semibold">Active Volunteer Profile</span>
            <select 
              value={selectedVolunteerId}
              onChange={(e) => setSelectedVolunteerId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-emerald border-b border-pitch-border pb-0.5"
            >
              {volunteerUsers.map(v => (
                <option key={v.id} value={v.id} className="bg-slate-950 text-white">
                  {v.name} ({getLanguageLabel(v.languagePref)})
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
                  className="flex-1 bg-pitch-gold text-black py-2 rounded-lg text-xs font-bold hover:bg-pitch-gold/90 transition-all uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-gold"
                >
                  Mark as In Progress
                </button>
              ) : (
                <button 
                  onClick={() => handleUpdateTaskStatus(assignedIncident.id, 'resolved')}
                  className="flex-1 bg-pitch-emerald text-black py-2 rounded-lg text-xs font-bold hover:bg-pitch-emerald/90 transition-all uppercase flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-emerald"
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
              className="px-2 py-1 rounded bg-slate-900 border border-pitch-border text-[9px] hover:border-pitch-cyan hover:text-pitch-cyan text-gray-400 focus:outline-none"
            >
              🚫 Prohibited Items
            </button>
            <button 
              onClick={() => handleSendVolunteerCopilot("Lost child protocol?")}
              className="px-2 py-1 rounded bg-slate-900 border border-pitch-border text-[9px] hover:border-pitch-cyan hover:text-pitch-cyan text-gray-400 focus:outline-none"
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
              className="flex-1 bg-slate-900 border border-pitch-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-pitch-cyan text-gray-100 placeholder:text-gray-500 focus:ring-2 focus:ring-pitch-cyan"
            />
            <button 
              onClick={() => handleSendVolunteerCopilot(volunteerCopilotQ)}
              className="px-3 py-1.5 bg-pitch-cyan text-black font-bold rounded-lg text-xs hover:bg-pitch-cyan/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-cyan"
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
              className="flex-1 bg-slate-900 border border-pitch-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-pitch-cyan text-gray-100 placeholder:text-gray-500 focus:ring-2 focus:ring-pitch-cyan"
              aria-label="Spectator query to translate"
            />
            <button 
              type="button"
              onClick={handleTranslateMessage}
              className="px-3 py-1.5 bg-pitch-cyan text-black font-bold rounded-lg text-xs hover:bg-pitch-cyan/90 transition-all uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-cyan"
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
            className="w-full bg-slate-900 border border-pitch-border rounded-lg p-2.5 text-xs focus:outline-none focus:border-pitch-error text-gray-100 placeholder:text-gray-500 resize-none focus:ring-2 focus:ring-pitch-error"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmittingReport}
          className="bg-pitch-error text-white py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-all uppercase flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-error"
        >
          {isSubmittingReport ? 'Parsing Incident...' : 'Submit AI Report'}
        </button>
      </form>

    </div>
  );
};
