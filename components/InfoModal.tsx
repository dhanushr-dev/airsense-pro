import React from 'react';
import { X, Info } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Info size={20} className="text-blue-400" />
            {title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-slate-300 leading-relaxed text-sm">
            {content}
          </p>
        </div>
        <div className="p-4 bg-slate-950/50 text-xs text-slate-500 text-center border-t border-white/5">
          Source: World Health Organization (WHO) Guidelines
        </div>
      </div>
    </div>
  );
};

export default InfoModal;