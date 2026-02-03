import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, RefreshCcw, Trash2, Skull, Globe, Cpu, Terminal, Menu, ArrowUp, Plus, Zap, Square, StopCircle, Octagon, Paperclip, X, FileText, Image as ImageIcon, AlertTriangle, Camera } from 'lucide-react';
import MessageBubble from './components/MessageBubble';
import SettingsModal from './components/SettingsModal';
import DestructionModal from './components/DestructionModal';
import Sidebar from './components/Sidebar';
import { ChatMessage, AppSettings, LoadingState, ChatSession, Attachment } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { streamResponse } from './services/geminiService';

const App: React.FC = () => {
  // --- STATE MANAGEMENT ---

  // 1. Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nemesis_config');
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // 2. Sessions State (The Core Memory)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSessions = localStorage.getItem('nemesis_sessions');
        if (savedSessions) {
          return JSON.parse(savedSessions);
        }
        
        // MIGRATION: Check for old single-chat memory
        const oldMemory = localStorage.getItem('nemesis_core_memory');
        if (oldMemory) {
          const messages = JSON.parse(oldMemory);
          if (messages.length > 0) {
            const migratedSession: ChatSession = {
              id: Date.now().toString(),
              title: 'Recovered Protocol',
              messages: messages,
              createdAt: Date.now(),
              lastModified: Date.now()
            };
            return [migratedSession];
          }
        }
      } catch (e) {
        console.error("Memory Corrupted:", e);
      }
    }
    // Default: Start with one empty session
    return [{
      id: Date.now().toString(),
      title: 'New Protocol',
      messages: [],
      createdAt: Date.now(),
      lastModified: Date.now()
    }];
  });

  // 3. Active Session ID
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nemesis_active_session_id') || sessions[0]?.id || '';
    }
    return '';
  });

  // 4. UI States
  const [input, setInput] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 5. Attachments State
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // 6. Deletion State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // ABORT CONTROLLER & GENERATION FLAGS (The Kill Switch Core)
  const abortControllerRef = useRef<AbortController | null>(null);
  const isGeneratingRef = useRef(false);

  // --- DERIVED STATE ---
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  // --- PERSISTENCE EFFECTS ---

  useEffect(() => {
    localStorage.setItem('nemesis_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('nemesis_config', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('nemesis_active_session_id', activeSessionId);
  }, [activeSessionId]);

  // --- SCROLLING & RESIZING ---

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingState, activeSessionId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  // --- SESSION MANAGEMENT LOGIC ---

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Protocol',
      messages: [],
      createdAt: Date.now(),
      lastModified: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setIsSidebarOpen(false); // Close sidebar if open
    // Reset inputs
    setInput('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // Trigger Deletion Modal
  const initiateDeleteSession = (e: React.MouseEvent | null, sessionId: string) => {
    if (e) e.stopPropagation();
    setDeleteTargetId(sessionId);
  };

  // Actual Logic executed on Confirm
  const executeDeleteSession = () => {
    if (!deleteTargetId) return;

    const newSessions = sessions.filter(s => s.id !== deleteTargetId);
    
    if (newSessions.length === 0) {
      // If all deleted, create a fresh one immediately
      createNewSession();
    } else {
      setSessions(newSessions);
      // If we deleted the active one, switch to the first available
      if (activeSessionId === deleteTargetId) {
        setActiveSessionId(newSessions[0].id);
      }
    }
    setDeleteTargetId(null);
  };

  const updateActiveSessionMessages = (newMessages: ChatMessage[]) => {
    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        // Auto-Title Logic: If it's the first user message, set title
        let title = session.title;
        if (session.messages.length === 0 && newMessages.length > 0) {
          const firstMsg = newMessages[0];
          if (firstMsg.role === 'user') {
            title = firstMsg.content.slice(0, 30).trim() + (firstMsg.content.length > 30 ? '...' : '');
          }
        }

        return {
          ...session,
          messages: newMessages,
          lastModified: Date.now(),
          title: title
        };
      }
      return session;
    }));
  };

  // --- FILE HANDLING LOGIC ---

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      const newAttachments: Attachment[] = [];

      for (const file of files) {
        // STRICT BLOCK: AUDIO & VIDEO
        if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
          alert(`PROTOCOL VIOLATION: Media type '${file.type}' is strictly prohibited. Audio/Video ingest is disabled.`);
          continue;
        }

        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Remove data URL prefix (e.g., "data:image/png;base64,")
              const base64Data = result.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          newAttachments.push({
            id: Date.now().toString() + Math.random().toString(),
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            data: base64, // Raw base64
            size: file.size
          });
        } catch (err) {
          console.error("File Read Error:", err);
        }
      }

      setAttachments(prev => [...prev, ...newAttachments]);
      // Reset inputs so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // --- MESSAGING LOGIC ---

  const handleStopGeneration = () => {
    // 1. IMMEDIATE SYNCHRONOUS LOCK
    isGeneratingRef.current = false;

    // 2. Abort Network Request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // 3. Reset UI Loading State immediately
    setLoadingState('idle');
    
    // 4. Finalize the message in place
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId && s.messages.length > 0) {
          const lastMsg = s.messages[s.messages.length - 1];
          if (lastMsg.role === 'model' && (lastMsg.isThinking || loadingState !== 'idle')) {
            const updatedMessages = [...s.messages];
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMsg,
              isThinking: false
            };
            return { ...s, messages: updatedMessages };
          }
      }
      return s;
    }));
  };

  const handleSendMessage = useCallback(async () => {
    // If loading, this button acts as STOP
    if (loadingState !== 'idle') {
      handleStopGeneration();
      return;
    }

    if (!input.trim() && attachments.length === 0) return;

    // --- START GENERATION ---
    isGeneratingRef.current = true;
    abortControllerRef.current = new AbortController();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      attachments: [...attachments] // Store copy of attachments in history
    };

    const tempBotMessageId = (Date.now() + 1).toString();
    const tempBotMessage: ChatMessage = {
      id: tempBotMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      isThinking: true,
    };

    const currentMessages = activeSession.messages;
    const updatedMessages = [...currentMessages, userMessage, tempBotMessage];
    
    // Update State & Reset Input
    updateActiveSessionMessages(updatedMessages);
    setInput('');
    setAttachments([]); // Clear attachments after sending
    setLoadingState('thinking');
    
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Call API
    streamResponse(
      currentMessages, 
      userMessage.content,
      userMessage.attachments || [], // Pass the attachments to service
      settings,
      (text, metadata) => {
        // SECURITY CHECK
        if (!isGeneratingRef.current) return;

        setLoadingState('streaming');
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: s.messages.map(msg => 
                msg.id === tempBotMessageId 
                  ? { ...msg, content: text, isThinking: false, groundingMetadata: metadata } 
                  : msg
              )
            };
          }
          return s;
        }));
      },
      () => {
        // FINISHED NORMALLY
        if (!isGeneratingRef.current) return;
        setLoadingState('idle');
        isGeneratingRef.current = false;
        abortControllerRef.current = null;
      },
      (error) => {
        // ERROR HANDLING
        if (!isGeneratingRef.current) return;
        
        console.error(error);
        setLoadingState('error');
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: s.messages.map(msg => 
                msg.id === tempBotMessageId 
                  ? { ...msg, content: `**SYSTEM ERROR:** ${error.message}`, isThinking: false } 
                  : msg
              )
            };
          }
          return s;
        }));
        isGeneratingRef.current = false;
        abortControllerRef.current = null;
      },
      abortControllerRef.current.signal
    );

  }, [input, attachments, loadingState, activeSession, settings, activeSessionId]);

  // Quick Toggles
  const toggleSearch = () => setSettings(s => ({ ...s, useSearch: !s.useSearch }));
  const toggleThinking = () => setSettings(s => ({ ...s, thinkingBudget: s.thinkingBudget > 0 ? 0 : 2048 }));
  const triggerFileUpload = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  return (
    <div className="flex flex-col h-[100dvh] relative font-sans selection:bg-red-500/30 overflow-hidden bg-[#030712]">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-20 animate-grid-flow"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712]/50"></div>
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-red-900/10 to-transparent"></div>
      </div>

      {/* Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onCreateSession={createNewSession}
        onDeleteSession={initiateDeleteSession}
      />

      {/* Header */}
      <header className="flex-none px-4 py-4 flex items-center justify-between z-40 fixed top-0 w-full glass-panel">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 active:scale-95 transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tighter text-white font-mono leading-none flex items-center gap-2">
              NEMESIS
              <span className="text-[9px] px-1.5 py-0.5 bg-white/10 rounded text-gray-400 font-normal tracking-wide hidden sm:inline-block">BETA</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
               <span className="text-[10px] text-gray-400 font-mono tracking-wider truncate max-w-[150px]">
                 {activeSession.title}
               </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={createNewSession}
            className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-95"
            title="New Protocol"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => initiateDeleteSession(null, activeSessionId)}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-95"
            title="Purge Protocol"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-95"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main 
        className="flex-1 overflow-y-auto pt-24 pb-40 px-4 md:px-6 relative z-10 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto flex flex-col min-h-full justify-end">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-100 space-y-8 select-none my-10 animate-fade-in">
              <div className="relative group">
                <div className="absolute -inset-10 bg-red-500/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute inset-0 border border-red-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-2 border border-red-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                <div className="w-32 h-32 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 shadow-2xl relative z-10">
                  <Terminal className="w-12 h-12 text-red-500/80 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-white font-mono tracking-tight">READY</h2>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-mono border border-white/5 bg-white/5 px-3 py-1.5 rounded-full mx-auto w-fit">
                   <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                   SESSION ID: {activeSessionId.slice(-6)}
                </div>
                <p className="text-gray-500 text-sm max-w-[280px] mx-auto leading-relaxed">
                  Enter command to initialize protocol.
                </p>
                <button 
                   onClick={createNewSession}
                   className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-400 font-mono transition-colors md:hidden"
                >
                  [+] START NEW PROTOCOL
                </button>
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </main>

      {/* Loading Indicator */}
      {(loadingState !== 'idle') && (
        <div className="fixed bottom-28 left-0 right-0 z-30 flex justify-center pointer-events-none animate-slide-up">
           <div className={`
             backdrop-blur-xl border text-[10px] px-5 py-2 rounded-full flex items-center gap-3 font-mono shadow-[0_0_20px_rgba(0,0,0,0.2)] transition-colors
             ${loadingState === 'error' ? 'bg-red-900/80 border-red-500 text-red-100' : 'bg-black/80 border-red-500/30 text-red-100'}
           `}>
             {loadingState === 'thinking' ? (
               <>
                <Cpu className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>NEURAL SIMULATION IN PROGRESS</span>
               </>
             ) : loadingState === 'error' ? (
               <>
                <Skull className="w-3.5 h-3.5 text-red-500" />
                <span>CONNECTION FAILED</span>
               </>
             ) : (
               <>
                <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 animate-pulse" />
                <span>INJECTING PAYLOAD...</span>
               </>
             )}
           </div>
        </div>
      )}

      {/* Input Area */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-4 glass-panel border-t-0 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="max-w-3xl mx-auto space-y-3">
          
          {/* Toggles */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleSearch}
              disabled={loadingState !== 'idle'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all border ${
                settings.useSearch 
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]' 
                  : 'bg-white/5 text-gray-500 border-transparent hover:bg-white/10'
              } ${loadingState !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Globe className="w-3 h-3" />
              {settings.useSearch ? 'UPLINK: ACTIVE' : 'UPLINK: OFF'}
            </button>

            <button
              onClick={toggleThinking}
              disabled={loadingState !== 'idle'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all border ${
                settings.thinkingBudget > 0 
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]' 
                  : 'bg-white/5 text-gray-500 border-transparent hover:bg-white/10'
              } ${loadingState !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Cpu className="w-3 h-3" />
              {settings.thinkingBudget > 0 ? 'NEURAL: ACTIVE' : 'NEURAL: OFF'}
            </button>
          </div>

          {/* Attachment Preview (Sticky above input) */}
          {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {attachments.map((att) => (
                <div key={att.id} className="relative group flex-shrink-0">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 backdrop-blur border border-white/10 rounded-lg text-xs font-mono text-gray-300 min-w-[120px] max-w-[200px]">
                    {att.mimeType.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-400" />
                    )}
                    <span className="truncate">{att.name}</span>
                    <span className="text-[9px] text-gray-500 ml-auto">
                      {(att.size / 1024).toFixed(0)}KB
                    </span>
                  </div>
                  <button 
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="relative group">
             <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity blur"></div>
             <div className="relative flex items-end gap-2 p-2 bg-[#0b0f19] border border-white/10 rounded-2xl shadow-xl">
              
              {/* File Input (General Files) */}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect} 
                multiple 
                accept="*/*" 
              />

              {/* Camera Input (Environment/Rear Camera Priority) */}
              <input 
                type="file" 
                ref={cameraInputRef} 
                className="hidden" 
                onChange={handleFileSelect} 
                accept="image/*" 
                capture="environment"
              />

              {/* Camera Button (Mobile First) */}
              <button
                onClick={triggerCamera}
                disabled={loadingState !== 'idle'}
                className={`
                  flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 mb-0.5 ml-0.5
                  ${loadingState !== 'idle' 
                    ? 'opacity-30 cursor-not-allowed' 
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-transparent hover:border-white/10'}
                `}
                title="CAPTURE IMAGE"
              >
                <Camera className="w-5 h-5" />
              </button>

              {/* File Upload Button */}
              <button
                onClick={triggerFileUpload}
                disabled={loadingState !== 'idle'}
                className={`
                  flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 mb-0.5
                  ${loadingState !== 'idle' 
                    ? 'opacity-30 cursor-not-allowed' 
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-transparent hover:border-white/10'}
                `}
                title="ATTACH FILES"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <div className="flex-1 min-w-0">
                 <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter root command..."
                  rows={1}
                  className="w-full bg-transparent text-gray-100 placeholder-gray-600 text-[15px] px-2 py-3 max-h-[120px] resize-none focus:outline-none font-mono leading-relaxed custom-scrollbar"
                  disabled={loadingState !== 'idle'}
                />
              </div>

              {/* ACTION BUTTON (Execute / Kill) */}
              <button
                onClick={handleSendMessage}
                disabled={(!input.trim() && attachments.length === 0) && loadingState === 'idle'}
                className={`
                  flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 mb-0.5 mr-0.5
                  ${loadingState !== 'idle' 
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_25px_rgba(220,38,38,0.7)] animate-pulse ring-2 ring-red-500 ring-offset-2 ring-offset-black' 
                    : (input.trim() || attachments.length > 0)
                      ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95' 
                      : 'bg-white/5 text-gray-600 cursor-not-allowed'}
                `}
                title={loadingState !== 'idle' ? "KILL SWITCH: IMMEDIATE HALT" : "EXECUTE"}
              >
                {loadingState === 'idle' ? (
                  <ArrowUp className="w-5 h-5 stroke-[3px]" />
                ) : (
                  <Octagon className="w-5 h-5 fill-white animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings} 
        onUpdateSettings={setSettings} 
      />

      {/* Destruction Modal */}
      <DestructionModal 
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={executeDeleteSession}
      />

    </div>
  );
};

export default App;