import React from 'react';
import { User, ChatMessage } from '../types';
import { Ticket, Send } from 'lucide-react';

interface FanDashboardProps {
  currentUser: User;
  fanChat: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  isChatTyping: boolean;
  handleSendFanMessage: (text?: string) => void;
  handleTriggerQuickNavigation: (type: 'restroom' | 'concession') => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
}

export const FanDashboard: React.FC<FanDashboardProps> = ({
  currentUser,
  fanChat,
  chatInput,
  setChatInput,
  isChatTyping,
  handleSendFanMessage,
  handleTriggerQuickNavigation,
  chatEndRef,
}) => {
  return (
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
            <span className="text-[11px] text-gray-300 block uppercase font-bold">Holder</span>
            <span className="font-semibold">{currentUser.name}</span>
          </div>
          <div>
            <span className="text-[11px] text-gray-300 block uppercase font-bold">Section</span>
            <span className="font-semibold text-pitch-cyan">Sec 104</span>
          </div>
          <div>
            <span className="text-[11px] text-gray-300 block uppercase font-bold">Gate</span>
            <span className="font-semibold text-pitch-gold">Gate B</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Chips */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Quick Venue Actions</span>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handleTriggerQuickNavigation('restroom')}
            className="glass-panel p-3 rounded-xl text-left hover:border-pitch-cyan/50 hover:bg-slate-900/60 transition-all flex items-center justify-between group focus-visible:ring-2 focus-visible:ring-pitch-cyan focus-visible:outline-none"
          >
            <div>
              <h5 className="text-xs font-bold">Find Restrooms</h5>
              <p className="text-[11px] text-gray-300 group-hover:text-white">Locate shortest line</p>
            </div>
            <span className="text-lg">🚻</span>
          </button>

          <button 
            onClick={() => handleTriggerQuickNavigation('concession')}
            className="glass-panel p-3 rounded-xl text-left hover:border-pitch-cyan/50 hover:bg-slate-900/60 transition-all flex items-center justify-between group focus-visible:ring-2 focus-visible:ring-pitch-cyan focus-visible:outline-none"
          >
            <div>
              <h5 className="text-xs font-bold">Find Tacos / Burgers</h5>
              <p className="text-[11px] text-gray-300 group-hover:text-white">Avoid queue bottlenecks</p>
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
          <span className="text-[11px] text-gray-300 uppercase tracking-widest font-semibold">Gemini Copilot</span>
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
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 border border-pitch-border text-[9px] font-medium hover:bg-white/10 hover:border-gray-400 transition-all text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-cyan"
          >
            📍 Where is Section 104?
          </button>
          <button 
            onClick={() => handleSendFanMessage("What is the bag policy?")}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 border border-pitch-border text-[9px] font-medium hover:bg-white/10 hover:border-gray-400 transition-all text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-cyan"
          >
            💼 Bag Policy
          </button>
          <button 
            onClick={() => handleSendFanMessage("Is Gate B open?")}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 border border-pitch-border text-[9px] font-medium hover:bg-white/10 hover:border-gray-400 transition-all text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-cyan"
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
            className="flex-1 bg-slate-900 border border-pitch-border rounded-xl px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-cyan focus-visible:border-pitch-emerald text-gray-100 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-pitch-emerald"
          />
          <button 
            onClick={() => handleSendFanMessage()}
            className="p-2 bg-pitch-emerald text-black rounded-xl hover:bg-pitch-emerald/90 transition-all shadow-md flex items-center justify-center focus-visible:ring-2 focus-visible:ring-pitch-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-cyan"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
