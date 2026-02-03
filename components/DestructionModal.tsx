import React from 'react';
import { AlertTriangle, Trash2, X, Skull } from 'lucide-react';

interface DestructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

const DestructionModal: React.FC<DestructionModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "CONFIRM PURGE", 
  description = "This action will permanently erase the selected protocol logs. Data recovery is impossible." 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop with red tint */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-[#0b0f19] border border-red-500/30 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.2)] overflow-hidden hardware-accel animate-slide-up">
        
        {/* Animated Warning Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse"></div>
        
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 shadow-inner">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white font-mono tracking-tight flex items-center gap-2">
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Technical Deco */}
          <div className="mt-6 p-3 bg-black/40 rounded-lg border border-red-500/10 flex items-center justify-between font-mono text-[10px] text-red-400/60">
             <span>SECURE_DELETE_ALGORITHM</span>
             <span>STATUS: WAITING_CONFIRMATION</span>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold font-mono tracking-wide transition-colors border border-transparent hover:border-white/10"
            >
              ABORT
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold font-mono tracking-wide transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] flex items-center justify-center gap-2 active:scale-95 border border-red-500"
            >
              <Trash2 className="w-4 h-4" />
              EXECUTE PURGE
            </button>
          </div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute bottom-0 right-0 p-2 opacity-20 pointer-events-none">
            <Skull className="w-24 h-24 text-red-500 -mb-6 -mr-6 transform -rotate-12" />
        </div>
      </div>
    </div>
  );
};

export default DestructionModal;