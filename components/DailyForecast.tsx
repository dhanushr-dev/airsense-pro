import React from 'react';
import { CloudRain, ArrowUp, ArrowDown, Sun, Cloud, CloudLightning, CloudSnow, BrainCircuit, Activity, Wind } from 'lucide-react';
import { DailyForecast } from '../types';
import { useLanguage } from './LanguageContext';

interface DailyForecastProps {
  forecast: DailyForecast;
  currentTemp: number;
  currentAQI?: number;
}

const DailyForecastCard: React.FC<DailyForecastProps> = ({ forecast, currentTemp }) => {
  const { t } = useLanguage();

  const getWeatherTranslation = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('clear')) return t.weatherClear || condition;
    if (c.includes('cloud')) return t.weatherClouds || condition;
    if (c.includes('rain')) return t.weatherRain || condition;
    if (c.includes('drizzle')) return t.weatherDrizzle || condition;
    if (c.includes('thunder')) return t.weatherThunderstorm || condition;
    if (c.includes('snow')) return t.weatherSnow || condition;
    if (c.includes('mist')) return t.weatherMist || condition;
    if (c.includes('smoke')) return t.weatherSmoke || condition;
    if (c.includes('haze')) return t.weatherHaze || condition;
    if (c.includes('dust')) return t.weatherDust || condition;
    if (c.includes('fog')) return t.weatherFog || condition;
    if (c.includes('sand')) return t.weatherSand || condition;
    if (c.includes('ash')) return t.weatherAsh || condition;
    if (c.includes('squall')) return t.weatherSquall || condition;
    if (c.includes('tornado')) return t.weatherTornado || condition;
    return condition;
  };

  // Helper to choose icon based on openweather icon code
  const getWeatherIcon = (code: string) => {
    if (code.startsWith('01')) return <Sun className="text-yellow-400" size={32} />;
    if (code.startsWith('02') || code.startsWith('03')) return <Cloud className="text-slate-300" size={32} />;
    if (code.startsWith('09') || code.startsWith('10')) return <CloudRain className="text-blue-400" size={32} />;
    if (code.startsWith('11')) return <CloudLightning className="text-purple-400" size={32} />;
    if (code.startsWith('13')) return <CloudSnow className="text-white" size={32} />;
    return <Cloud className="text-slate-400" size={32} />;
  };

  // ML-based AQI impact prediction based on weather
  const getWeatherAQIImpact = () => {
    const condition = forecast.condition?.toLowerCase() || '';
    const rainProb = forecast.precipitation_prob || 0;

    if (condition.includes('rain') || rainProb > 50) {
      return { impact: 'improving', label: t.rainClearsPollutants, color: 'text-green-400' };
    }
    if (condition.includes('wind') || condition.includes('storm')) {
      return { impact: 'improving', label: t.windDispersesParticles, color: 'text-green-400' };
    }
    if (condition.includes('fog') || condition.includes('mist')) {
      return { impact: 'worsening', label: t.fogTrapsPollutants, color: 'text-red-400' };
    }
    if (condition.includes('clear') || condition.includes('sun')) {
      return { impact: 'monitoring', label: t.clearSkyOzoneRisk, color: 'text-yellow-400' };
    }
    return { impact: 'stable', label: t.stableConditions, color: 'text-slate-400' };
  };

  // Best outdoor time based on weather
  const getBestOutdoorTime = () => {
    if (currentTemp > 35) return t.earlyMorning;
    if (currentTemp > 30) return t.morningOrEvening;
    if (currentTemp < 10) return t.middayTime;
    return t.anyTimeToday;
  };

  const weatherImpact = getWeatherAQIImpact();

  return (
    <div className="glass-panel p-4 rounded-xl border-l-4 border-indigo-500 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-slate-400 text-xs uppercase tracking-wider">{t.todayForecast}</p>
            <BrainCircuit size={10} className="text-purple-400" />
          </div>
          <div className="mt-2 flex items-center gap-3">
            {getWeatherIcon(forecast.icon)}
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-white">{Math.round(currentTemp)}°</p>
                <p className="text-sm font-medium text-slate-300 capitalize">{getWeatherTranslation(forecast.condition)}</p>
              </div>
              {forecast.precipitation_prob > 0 && (
                <div className="flex items-center gap-1 text-xs text-blue-300 mt-0.5">
                  <CloudRain size={12} />
                  <span>{forecast.precipitation_prob}% {t.rain}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* High/Low Temps */}
      <div className="flex items-center gap-4 bg-slate-800/40 rounded-lg p-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-red-500/20 p-1 rounded">
            <ArrowUp size={12} className="text-red-400" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase">{t.high}</span>
            <p className="text-sm font-bold">{Math.round(forecast.temp_max)}°</p>
          </div>
        </div>
        <div className="w-px h-8 bg-white/10"></div>
        <div className="flex items-center gap-2">
          <div className="bg-blue-500/20 p-1 rounded">
            <ArrowDown size={12} className="text-blue-400" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase">{t.low}</span>
            <p className="text-sm font-bold">{Math.round(forecast.temp_min)}°</p>
          </div>
        </div>
      </div>

      {/* ML Weather-AQI Insights */}
      <div className="grid grid-cols-2 gap-2">
        {/* AQI Impact */}
        <div className={`px-2 py-1.5 rounded-lg bg-slate-800/30 border border-white/5`}>
          <div className="flex items-center gap-1 mb-0.5">
            <Activity size={10} className="text-purple-400" />
            <span className="text-[8px] text-slate-500 uppercase">{t.aqiImpact}</span>
          </div>
          <p className={`text-[10px] font-bold ${weatherImpact.color}`}>{weatherImpact.label}</p>
        </div>

        {/* Best Time */}
        <div className="px-2 py-1.5 rounded-lg bg-slate-800/30 border border-white/5">
          <div className="flex items-center gap-1 mb-0.5">
            <Wind size={10} className="text-cyan-400" />
            <span className="text-[8px] text-slate-500 uppercase">{t.bestOutdoor}</span>
          </div>
          <p className="text-[10px] font-bold text-cyan-400">{getBestOutdoorTime()}</p>
        </div>
      </div>
    </div>
  );
};

export default DailyForecastCard;