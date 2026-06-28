import React from 'react';
import { TrendingUp, TrendingDown, Minus, BrainCircuit, Calendar, Zap } from 'lucide-react';
import { DailyAQIForecast } from '../types';

interface AQIForecastProps {
  forecast: DailyAQIForecast[];
  currentAQI?: number;
  weather?: { temp: number; humidity: number };
}

const AQIForecast: React.FC<AQIForecastProps> = ({ forecast, currentAQI = 75 }) => {
  const getStatusColor = (aqi: number) => {
    if (aqi <= 50) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (aqi <= 100) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    if (aqi <= 150) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    if (aqi <= 200) return 'text-red-400 bg-red-500/10 border-red-500/30';
    return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
  };

  const getCategory = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    if (aqi <= 200) return 'Poor';
    return 'Hazardous';
  };

  // Calculate trend based on forecast data
  const getTrend = () => {
    if (!forecast || forecast.length < 2) return 'stable';
    const firstAqi = forecast[0]?.aqi || currentAQI;
    const lastAqi = forecast[forecast.length - 1]?.aqi || firstAqi;

    if (lastAqi < firstAqi * 0.85) return 'improving';
    if (lastAqi > firstAqi * 1.15) return 'worsening';
    return 'stable';
  };

  const trend = getTrend();

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving': return <TrendingDown className="text-green-400" size={16} />;
      case 'worsening': return <TrendingUp className="text-red-400" size={16} />;
      default: return <Minus className="text-yellow-400" size={16} />;
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'improving': return 'Improving';
      case 'worsening': return 'Worsening';
      default: return 'Stable';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'improving': return 'text-green-400';
      case 'worsening': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  // Use API forecast data - skip today (index 0) and show next 5 days
  const displayForecast = forecast?.slice(1, 6).map((day, idx) => ({
    day: day.dayName,
    date: day.date,
    aqi: day.aqi,
    category: day.status || getCategory(day.aqi),
    confidence: Math.max(0.60, 0.92 - idx * 0.06) // Confidence decreases for later days
  })) || [];

  if (!forecast || forecast.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="text-blue-400" size={18} />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">5-Day Forecast</h3>
        </div>
        <div className="text-center text-slate-400 py-4">
          <p className="text-sm">Loading forecast data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-400" size={18} />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">5-Day AQI Forecast</h3>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className={`text-xs font-bold ${getTrendColor()}`}>{getTrendText()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {displayForecast.map((day, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all hover:scale-105 ${getStatusColor(day.aqi)}`}
          >
            <div className="flex items-center gap-1 mb-1">
              <Calendar size={10} className="opacity-50" />
              <span className="text-xs font-bold opacity-70">{day.day}</span>
            </div>
            <span className="text-2xl font-black mb-0.5">{day.aqi}</span>
            <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">{day.category}</span>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-8 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/60 rounded-full"
                  style={{ width: `${day.confidence * 100}%` }}
                />
              </div>
              <span className="text-[8px] text-slate-400">{Math.round(day.confidence * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AQIForecast;