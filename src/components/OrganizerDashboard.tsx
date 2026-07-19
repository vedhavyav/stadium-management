import React from 'react';
import { User, Incident } from '../types';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Users, 
  TrendingUp 
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

interface OrganizerDashboardProps {
  handleGenerateAIAdvice: () => void;
  isAdvisorLoading: boolean;
  advisorRecommendation: string;
  incidents: Incident[];
  unresolvedIncidentsCount: number;
  averageFacilityWaitTime: number;
  activeVolunteersCount: number;
  handleAutoDispatch: (incidentId: string) => void;
  users: User[];
  gateChartData: Array<{ name: string; flow: number; status: string }>;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  handleGenerateAIAdvice,
  isAdvisorLoading,
  advisorRecommendation,
  incidents,
  unresolvedIncidentsCount,
  averageFacilityWaitTime,
  activeVolunteersCount,
  handleAutoDispatch,
  users,
  gateChartData,
}) => {
  return (
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
            className={`px-3 py-1 bg-pitch-emerald text-black text-[11px] font-bold rounded-lg hover:bg-pitch-emerald/90 transition-all uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-emerald ${isAdvisorLoading ? 'animate-pulse opacity-60' : ''}`}
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
              {unresolvedIncidentsCount}
            </span>
          </div>
          <ShieldAlert className="w-8 h-8 text-pitch-error opacity-30" />
        </div>

        <div className="glass-panel p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-300 block uppercase font-bold">Avg Wait Time</span>
            <span className="text-xl font-extrabold font-sporty text-pitch-cyan">
              {averageFacilityWaitTime}m
            </span>
          </div>
          <Clock className="w-8 h-8 text-pitch-cyan opacity-30" />
        </div>

        <div className="glass-panel p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-300 block uppercase font-bold">Active Staff</span>
            <span className="text-xl font-extrabold font-sporty text-white">
              {activeVolunteersCount}
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
                        className="bg-pitch-emerald text-black text-[9px] font-bold px-2 py-1 rounded hover:bg-pitch-emerald/90 transition-all uppercase focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pitch-emerald"
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
  );
};
