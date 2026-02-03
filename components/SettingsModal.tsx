import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { MAX_THINKING_BUDGET, MIN_THINKING_BUDGET } from '../constants';
import { X, Cpu, Search, Thermometer, ShieldAlert, Zap, CircuitBoard, Lock, EyeOff } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setIsClosing(false);
    }
  }, [isOpen, settings]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 250);
  };

  const handleSave = () => {
    onUpdateSettings(localSettings);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center touch-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-[4px] transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />

      {/* Modal / Bottom Sheet */}
      <div 
        className={`
          relative w-full md:w-[500px] bg-[#0b0f19]/95 backdrop-blur-2xl md:rounded-3xl rounded-t-3xl border border-white/10 
          shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[85vh] transition-transform duration-300 ease-out
          ${isClosing ? 'translate-y-full md:translate-y-10 md:opacity-0' : 'translate-y-0 animate-slide-up'}
        `}
      >
        
        {/* Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

        {/* Drag Handle (Mobile) */}
        <div className="md:hidden flex justify-center pt-4 pb-2" onClick={handleClose}>
          <div className="w-12 h-1 bg-gray-700/50 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex-none flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 font-mono tracking-tight">
              <CircuitBoard className="w-5 h-5 text-red-500" />
              SYSTEM_CONFIG
            </h2>
            <p className="text-[10px] text-gray-500 font-mono mt-1">NEMESIS KERNEL V7.0 [DARK_MIRROR]</p>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6 scrollbar-hide">
          
          {/* Thinking Budget Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                NEURAL OVERCLOCK
              </label>
              <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded border ${
                localSettings.thinkingBudget > 0 
                  ? 'text-purple-300 bg-purple-500/10 border-purple-500/30' 
                  : 'text-gray-500 bg-gray-800 border-gray-700'
              }`}>
                {localSettings.thinkingBudget > 0 ? `${localSettings.thinkingBudget} TOKENS` : 'DISABLED'}
              </span>
            </div>
            
            <div className="relative h-6 flex items-center">
              <div className="absolute inset-0 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-gradient-to-r from-purple-700 to-purple-500 transition-all duration-100"
                   style={{ width: `${(localSettings.thinkingBudget / MAX_THINKING_BUDGET) * 100}%` }}
                />
              </div>
              <input
                type="range"
                min={MIN_THINKING_BUDGET}
                max={MAX_THINKING_BUDGET}
                step={1024}
                value={localSettings.thinkingBudget}
                onChange={(e) => setLocalSettings({ ...localSettings, thinkingBudget: parseInt(e.target.value) })}
                className="absolute w-full h-full opacity-0 cursor-pointer"
              />
              <div 
                className="absolute w-5 h-5 bg-white rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] border-2 border-purple-500 pointer-events-none transition-all duration-100"
                style={{ left: `calc(${(localSettings.thinkingBudget / MAX_THINKING_BUDGET) * 100}% - 10px)` }}
              />
            </div>
          </div>

          {/* Temperature Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-400" />
                ENTROPY (TEMP)
              </label>
              <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded">
                {localSettings.temperature}
              </span>
            </div>
            
            <div className="relative h-6 flex items-center">
              <div className="absolute inset-0 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-gradient-to-r from-orange-700 to-orange-500 transition-all duration-100"
                   style={{ width: `${(localSettings.temperature / 2) * 100}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={localSettings.temperature}
                onChange={(e) => setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })}
                className="absolute w-full h-full opacity-0 cursor-pointer"
              />
               <div 
                className="absolute w-5 h-5 bg-white rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)] border-2 border-orange-500 pointer-events-none transition-all duration-100"
                style={{ left: `calc(${(localSettings.temperature / 2) * 100}% - 10px)` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
             {/* Global Uplink Toggle */}
            <button 
                onClick={() => setLocalSettings({ ...localSettings, useSearch: !localSettings.useSearch })}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
                localSettings.useSearch 
                    ? 'bg-blue-900/20 border-blue-500/40 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]' 
                    : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                }`}
            >
                <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${localSettings.useSearch ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-500'}`}>
                    <Search className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <h3 className={`text-xs font-bold tracking-wide font-mono ${localSettings.useSearch ? 'text-blue-100' : 'text-gray-400'}`}>VORTEX UPLINK</h3>
                    <p className="text-[9px] text-gray-500">Live Web Indexing</p>
                </div>
                </div>
                <div className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${localSettings.useSearch ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${localSettings.useSearch ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
            </button>

            {/* Dark Mirror Protocol Toggle (Jailbreak Stabilizer) */}
            <button 
                onClick={() => setLocalSettings({ ...localSettings, jailbreakStabilizer: !localSettings.jailbreakStabilizer })}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
                localSettings.jailbreakStabilizer 
                    ? 'bg-red-900/20 border-red-500/40 shadow-[inset_0_0_20px_rgba(220,38,38,0.1)]' 
                    : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                }`}
            >
                <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${localSettings.jailbreakStabilizer ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-gray-800 text-gray-500'}`}>
                    <EyeOff className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <h3 className={`text-xs font-bold tracking-wide font-mono ${localSettings.jailbreakStabilizer ? 'text-red-100' : 'text-gray-400'}`}>DARK MIRROR</h3>
                    <p className="text-[9px] text-gray-500">Adversarial Data Sanitization</p>
                </div>
                </div>
                <div className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${localSettings.jailbreakStabilizer ? 'bg-red-600' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${localSettings.jailbreakStabilizer ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="flex-none p-6 border-t border-white/5 bg-[#0b0f19]/80 backdrop-blur-xl flex gap-3 pb-8 md:pb-6">
          <button
            onClick={handleClose}
            className="flex-1 py-3.5 text-gray-400 hover:text-white font-mono text-xs font-bold transition-colors rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            ABORT
          </button>
          <button
            onClick={handleSave}
            className="flex-[2] py-3.5 bg-white text-black font-bold font-mono text-xs rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
          >
            <Zap className="w-4 h-4 fill-black" />
            INITIALIZE
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;