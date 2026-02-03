import React from 'react';
import { Plus, MessageSquare, Trash2, X, ChevronRight, Terminal } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession
}) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-[300px] bg-[#030712]/95 border-r border-white/10 shadow-[10px_0_30px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-red-900/10 to-transparent">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-red-500" />
            <span className="font-mono font-bold text-white tracking-tight">LOG_HISTORY</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onCreateSession();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/30 text-white p-3.5 rounded-xl transition-all active:scale-95 group shadow-lg"
          >
            <Plus className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="font-mono text-xs font-bold tracking-wide">NEW_PROTOCOL</span>
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-hide">
          {sessions.length === 0 ? (
             <div className="text-center py-10 opacity-30">
                <p className="text-[10px] font-mono">NO LOGS FOUND</p>
             </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  onClose();
                }}
                className={`group relative flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all border ${
                  activeSessionId === session.id
                    ? 'bg-red-900/10 border-red-500/30 text-white'
                    : 'bg-transparent border-transparent hover:bg-white/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeSessionId === session.id ? 'text-red-400' : 'text-gray-600'}`} />
                
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-xs font-medium truncate font-mono">
                    {session.title || 'Untitled Protocol'}
                  </span>
                  <span className="text-[9px] opacity-40 font-mono">
                    {new Date(session.lastModified).toLocaleDateString()}
                  </span>
                </div>

                {/* Delete Action */}
                <button
                  onClick={(e) => onDeleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-all absolute right-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Active Indicator */}
                {activeSessionId === session.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-red-500 rounded-r-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-white/5 text-[9px] text-gray-600 font-mono text-center">
           SECURE_STORAGE: ENCRYPTED
        </div>
      </div>
    </>
  );
};

export default Sidebar;