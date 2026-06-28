import React, { useEffect, useState } from 'react';
import { Wind, Activity, Globe, Zap, CheckCircle2 } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing Core Systems...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress Bar Simulation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 5; // Random increments
      });
    }, 100);

    // Stage Management
    const timer1 = setTimeout(() => { setStep(1); setLoadingText('Calibrating Sensors...'); }, 500);
    const timer2 = setTimeout(() => { setStep(2); setLoadingText('Connecting to Satellite Network...'); }, 1500);
    const timer3 = setTimeout(() => { setStep(3); setLoadingText('Loading AI Models...'); }, 3000);
    const timer4 = setTimeout(() => { setStep(4); }, 4500); // Complete
    const timer5 = setTimeout(onComplete, 5000); // Unmount

    return () => {
      clearInterval(interval);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onComplete]);

  if (step === 5) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617] overflow-hidden transition-all duration-1000 ${step === 4 ? 'opacity-0 scale-105 blur-lg' : 'opacity-100'}`}>

      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
        <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)] animate-pulse-glow"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Icon Container with sophisticated animations */}
        <div className="relative mb-12">
          {/* Outer Rotating Rings */}
          <div className="absolute -inset-20 border border-blue-500/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute -inset-20 border-t border-r border-blue-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>

          <div className="absolute -inset-14 border border-purple-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
          <div className="absolute -inset-14 border-b border-l border-purple-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>

          {/* Glowing Core */}
          <div className={`relative bg-slate-900/50 backdrop-blur-2xl p-8 rounded-full border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.2)] transition-all duration-700 ${step >= 2 ? 'shadow-[0_0_150px_rgba(59,130,246,0.4)]' : ''}`}>

            {/* Center Icon */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <Wind
                size={64}
                className={`text-blue-400 absolute transition-all duration-700 ${step === 1 ? 'scale-110 opacity-100' : 'scale-100 opacity-50'}`}
              />
              <Globe
                size={64}
                className={`text-purple-400 absolute transition-all duration-700 ${step === 2 ? 'scale-110 opacity-100 rotate-12' : 'scale-50 opacity-0'}`}
              />
              <Zap
                size={64}
                className={`text-yellow-400 absolute transition-all duration-700 ${step === 3 ? 'scale-110 opacity-100' : 'scale-50 opacity-0'}`}
              />
              <CheckCircle2
                size={64}
                className={`text-green-400 absolute transition-all duration-700 ${step >= 4 ? 'scale-125 opacity-100' : 'scale-50 opacity-0'}`}
              />
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-slide-up bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-400">
            AirSense Pro
          </h1>

          <div className="h-8 flex items-center justify-center gap-2 text-blue-400 font-mono text-xs uppercase tracking-[0.3em]">
            {step < 4 ? <Activity size={14} className="animate-pulse" /> : <CheckCircle2 size={14} />}
            <span className="w-64 text-left">{step >= 4 ? 'System Ready' : loadingText}</span>
          </div>
        </div>

        {/* Premium Progress Bar */}
        <div className="mt-12 w-80 h-1 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-200 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <div className="mt-2 flex justify-between w-80 text-[10px] text-slate-500 font-mono">
          <span>INITIALIZING</span>
          <span>{Math.min(Math.round(progress), 100)}%</span>
        </div>

      </div>

      {/* Decorative Bottom Elements */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`w-1 h-12 bg-gradient-to-b from-blue-500/0 via-blue-500/20 to-blue-500/0 animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }}></div>
        ))}
      </div>
    </div>
  );
};

export default IntroAnimation;