import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface PermissionScreenProps {
  onGrant: () => void;
  isLoading: boolean;
}

const PermissionScreen: React.FC<PermissionScreenProps> = ({ onGrant, isLoading }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900 bg-[url('https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=2551&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      
      <div className="relative z-50 max-w-md w-full mx-4 p-8 glass-panel rounded-2xl text-center border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="mx-auto w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 ring-1 ring-blue-500/30">
          <MapPin size={40} className="text-blue-400" />
        </div>
        
        <h2 className="text-3xl font-bold mb-4 text-white">Enable Location</h2>
        <p className="text-slate-300 mb-8 leading-relaxed">
          To provide real-time hyper-local air quality data and AI insights, AirSense Pro needs access to your current location.
        </p>
        
        <button
          onClick={onGrant}
          disabled={isLoading}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
        >
          {isLoading ? (
            <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
          ) : (
            <>
              <Navigation size={20} />
              Allow Location Access
            </>
          )}
        </button>
        
        <p className="mt-6 text-xs text-slate-500">
          We respect your privacy. Location data is only processed locally to fetch weather info.
        </p>
      </div>
    </div>
  );
};

export default PermissionScreen;