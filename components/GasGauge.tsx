import React from 'react';
import { TrendingUp, TrendingDown, Minus, BrainCircuit } from 'lucide-react';

interface GasGaugeProps {
  label: string;
  value: number;
  unit: string;
  max: number;
  goodLimit: number;
  poorLimit: number;
  historicalAvg?: number; // For ML comparison
}

const GasGauge: React.FC<GasGaugeProps> = ({ label, value, unit, max, goodLimit, poorLimit, historicalAvg }) => {
  // Calculate percentage for the marker position, capped at 100%
  const percentage = Math.min(Math.max((value / max) * 100), 100);

  // Determine status text
  let status = "Good";
  let statusColor = "text-green-400";

  if (value > poorLimit) {
    status = "Poor";
    statusColor = "text-red-400";
  } else if (value > goodLimit) {
    status = "Fair";
    statusColor = "text-yellow-400";
  }

  // ML-based trend comparison (if historical average is available)
  const getMLInsight = () => {
    // Use default historical averages if not provided
    const defaultAvg = goodLimit * 0.8; // Assume historical is around 80% of good limit
    const avgValue = historicalAvg || defaultAvg;

    const percentDiff = ((value - avgValue) / avgValue) * 100;

    if (percentDiff < -15) {
      return { trend: 'improving', icon: <TrendingDown size={10} />, color: 'text-green-400', text: `${Math.abs(Math.round(percentDiff))}% below avg` };
    } else if (percentDiff > 15) {
      return { trend: 'worsening', icon: <TrendingUp size={10} />, color: 'text-red-400', text: `${Math.round(percentDiff)}% above avg` };
    } else {
      return { trend: 'stable', icon: <Minus size={10} />, color: 'text-slate-400', text: 'Near average' };
    }
  };

  const mlInsight = getMLInsight();

  // Health recommendation based on gas type and level
  const getHealthTip = () => {
    if (value <= goodLimit) return null;

    switch (label) {
      case 'CO':
        return value > poorLimit ? 'High CO - ventilate area' : 'Moderate CO - avoid heavy exertion';
      case 'NO2':
        return value > poorLimit ? 'High NO₂ - stay indoors' : 'Moderate NO₂ - limit outdoor time';
      case 'O3':
        return value > poorLimit ? 'High ozone - avoid outdoor activities' : 'Moderate ozone - exercise indoors';
      case 'SO2':
        return value > poorLimit ? 'High SO₂ - close windows' : 'Moderate SO₂ - sensitive groups caution';
      default:
        return null;
    }
  };

  const healthTip = getHealthTip();

  return (
    <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</span>
            <BrainCircuit size={10} className="text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white mt-0.5">
            {value.toFixed(1)} <span className="text-xs text-slate-500 font-normal">{unit}</span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xs font-bold ${statusColor}`}>{status}</span>
          {/* ML Trend */}
          <div className={`flex items-center gap-0.5 justify-end mt-0.5 ${mlInsight.color}`}>
            {mlInsight.icon}
            <span className="text-[9px]">{mlInsight.text}</span>
          </div>
        </div>
      </div>

      {/* The Gauge Bar */}
      <div className="relative h-2 w-full bg-slate-700 rounded-full overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: `linear-gradient(90deg, 
              #4ade80 0%, 
              #4ade80 ${(goodLimit / max) * 100}%, 
              #facc15 ${(poorLimit / max) * 100}%, 
              #f87171 100%)`
          }}
        ></div>
      </div>

      {/* Marker Indicator */}
      <div className="relative w-full h-2 -mt-2">
        <div
          className="absolute top-0 h-full w-1 bg-white shadow-[0_0_10px_white] rounded-full transform -translate-x-1/2 transition-all duration-1000 ease-out"
          style={{ left: `${percentage}%` }}
        ></div>
      </div>

      {/* Scale Labels */}
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>0</span>
        <span>{max}</span>
      </div>

      {/* Health Tip (if elevated) */}
      {healthTip && (
        <div className="mt-2 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-[9px] text-yellow-400">💡 {healthTip}</p>
        </div>
      )}
    </div>
  );
};

export default GasGauge;