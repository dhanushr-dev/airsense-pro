import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, HeartPulse, ShieldCheck, AlertOctagon, BrainCircuit, Activity, Sun, Moon } from 'lucide-react';
import { predictHealthRisk, HealthRiskPrediction } from '../services/ml';

interface RecommendationsProps {
  aqi: number;
  pollutants?: { pm25: number; pm10: number; co: number; no2: number; o3: number; so2: number };
}

import { useLanguage } from './LanguageContext';

const Recommendations: React.FC<RecommendationsProps> = ({ aqi, pollutants }) => {
  const { t } = useLanguage();
  const [healthRisk, setHealthRisk] = useState<HealthRiskPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPrediction = async () => {
      setIsLoading(true);
      try {
        const defaultPollutants = pollutants || {
          pm25: aqi * 0.4,
          pm10: aqi * 0.6,
          co: aqi * 20,
          no2: aqi * 0.3,
          o3: aqi * 0.4,
          so2: aqi * 0.1
        };
        const prediction = predictHealthRisk(aqi, defaultPollutants);
        setHealthRisk(prediction);
      } catch (error) {
        console.error('[Recommendations] ML prediction failed:', error);
      }
      setIsLoading(false);
    };

    loadPrediction();
  }, [aqi, pollutants]);

  const getAdvice = (aqiValue: number) => {
    const baseAdvice = {
      excellent: {
        status: t.excellentAir,
        color: "text-green-400",
        bg: "bg-green-500/10",
        border: "border-green-500/30",
        icon: <ShieldCheck className="text-green-400" size={24} />,
        dos: t.rec_excellent_do.split('|'),
        donts: t.rec_excellent_dont.split('|')
      },
      moderate: {
        status: t.moderate,
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        icon: <ShieldCheck className="text-yellow-400" size={24} />,
        dos: t.rec_moderate_do.split('|'),
        donts: t.rec_moderate_dont.split('|')
      },
      unhealthy_sensitive: {
        status: t.unhealthyForSensitive,
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
        icon: <HeartPulse className="text-orange-400" size={24} />,
        dos: t.rec_sensitive_do.split('|'),
        donts: t.rec_sensitive_dont.split('|')
      },
      unhealthy: {
        status: t.unhealthy,
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        icon: <AlertOctagon className="text-red-400" size={24} />,
        dos: t.rec_unhealthy_do.split('|'),
        donts: t.rec_unhealthy_dont.split('|')
      },
      hazardous: {
        status: t.hazardous,
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
        icon: <AlertOctagon className="text-purple-400" size={24} />,
        dos: t.rec_hazardous_do.split('|'),
        donts: t.rec_hazardous_dont.split('|')
      }
    };

    if (aqiValue <= 50) return baseAdvice.excellent;
    if (aqiValue <= 100) return baseAdvice.moderate;
    if (aqiValue <= 150) return baseAdvice.unhealthy_sensitive;
    if (aqiValue <= 200) return baseAdvice.unhealthy;
    return baseAdvice.hazardous;
  };

  const getCurrentTimeAdvice = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 8) {
      return { icon: <Sun size={14} />, text: "Early morning - typically best air quality", color: "text-green-400" };
    } else if (hour >= 8 && hour < 11) {
      return { icon: <Activity size={14} />, text: "Morning rush hour - elevated traffic pollution", color: "text-yellow-400" };
    } else if (hour >= 11 && hour < 16) {
      return { icon: <Sun size={14} />, text: "Midday - ozone levels may rise", color: "text-orange-400" };
    } else if (hour >= 16 && hour < 20) {
      return { icon: <Activity size={14} />, text: "Evening rush hour - elevated traffic pollution", color: "text-yellow-400" };
    } else {
      return { icon: <Moon size={14} />, text: "Night time - typically lower pollution", color: "text-blue-400" };
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl border backdrop-blur-md bg-slate-800/30 border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <BrainCircuit className="text-purple-400 animate-pulse" size={24} />
          <div>
            <h3 className="text-xs text-slate-300 uppercase tracking-wider font-semibold">AI Analyzing Health Risk...</h3>
            <div className="h-4 w-32 bg-slate-700 rounded animate-pulse mt-1" />
          </div>
        </div>
      </div>
    );
  }

  const advice = getAdvice(aqi);
  const timeAdvice = getCurrentTimeAdvice();

  return (
    <div className={`p-6 rounded-2xl border backdrop-blur-md ${advice.bg} ${advice.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          {advice.icon}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs text-slate-300 uppercase tracking-wider font-semibold">{t.recommendations}</h3>
              <BrainCircuit size={12} className="text-purple-400" />
            </div>
            <p className={`font-bold text-lg ${advice.color}`}>{advice.status}</p>
          </div>
        </div>
        {healthRisk && (
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase">Risk Score</div>
            <div className={`text-xl font-black ${healthRisk.riskScore <= 20 ? 'text-green-400' :
              healthRisk.riskScore <= 40 ? 'text-yellow-400' :
                healthRisk.riskScore <= 60 ? 'text-orange-400' :
                  healthRisk.riskScore <= 80 ? 'text-red-400' : 'text-purple-400'
              }`}>
              {healthRisk.riskScore}/100
            </div>
          </div>
        )}
      </div>

      {/* Time-based advice */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 mb-4 ${timeAdvice.color}`}>
        {timeAdvice.icon}
        <span className="text-xs">{timeAdvice.text}</span>
      </div>

      {/* Outdoor Activity Safety */}
      {healthRisk && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 ${healthRisk.outdoorActivitySafe ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
          {healthRisk.outdoorActivitySafe ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          <span className="text-xs font-bold">
            Outdoor Activities: {healthRisk.outdoorActivitySafe ? 'SAFE' : 'NOT RECOMMENDED'}
          </span>
        </div>
      )}

      {/* Sensitive Group Warning */}
      {healthRisk?.sensitiveGroupWarning && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 text-orange-400 mb-4">
          <AlertOctagon size={14} />
          <span className="text-xs font-bold">⚠ Sensitive groups (children, elderly, asthma) should take extra precautions</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Do's */}
        <div>
          <h4 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
            <CheckCircle2 size={16} /> {t.whatToDo}
          </h4>
          <ul className="space-y-2">
            {advice.dos.map((item, idx) => (
              <li key={idx} className="text-sm text-slate-300 pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-green-500/50">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Don'ts */}
        <div>
          <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
            <XCircle size={16} /> {t.whatToAvoid}
          </h4>
          <ul className="space-y-2">
            {advice.donts.map((item, idx) => (
              <li key={idx} className="text-sm text-slate-300 pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-red-500/50">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;