import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Loader2, Search, LayoutGrid, CalendarDays, BrainCircuit, Sparkles, Info } from 'lucide-react';
import { Coordinates } from '../types';
import { fetchHistoricalAirQuality, fetchAirQualityData, fetchAirQualityForecast, calculateUSAQI } from '../services/api';
import { predictForDate, CalendarAnalysis, initializeMLModels } from '../services/ml';

interface CalendarHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  coords: Coordinates;
  locationName: string;
  currentAQI?: number;
}

const CalendarHistory: React.FC<CalendarHistoryProps> = ({ isOpen, onClose, coords, locationName, currentAQI = 75 }) => {
  const [mode, setMode] = useState<'day' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // YYYY-MM

  const [loading, setLoading] = useState(false);
  const [dayResult, setDayResult] = useState<{
    aqi: number; date: string; pm2_5?: number; pm10?: number;
    co?: number; no2?: number; o3?: number; so2?: number; dataPoints?: number;
    isMLPrediction?: boolean; mlConfidence?: number; mlFactors?: string[];
  } | null>(null);
  const [monthResult, setMonthResult] = useState<{
    date: string; aqi: number; pm2_5?: number; pm10?: number; no2?: number; o3?: number;
    isMLPrediction?: boolean; mlConfidence?: number;
  }[]>([]);
  const [error, setError] = useState('');

  // Initialize ML on mount
  useEffect(() => {
    initializeMLModels();
  }, []);

  const getStatusColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (aqi <= 100) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (aqi <= 150) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (aqi <= 200) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  };

  const getStatusLabel = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    return 'Hazardous';
  };

  const handleFetch = async () => {
    if (mode === 'day' && !selectedDate) return;
    if (mode === 'month' && !selectedMonth) return;

    setLoading(true);
    setError('');
    setDayResult(null);
    setMonthResult([]);

    try {
      const today = new Date().toISOString().split('T')[0];
      const isToday = mode === 'day' && selectedDate === today;
      const isFuture = mode === 'day' && selectedDate > today;

      if (isToday) {
        // Use LIVE API for today's data
        const liveData = await fetchAirQualityData(coords);
        setDayResult({
          aqi: liveData.aqi_us,
          date: selectedDate,
          pm2_5: Math.round(liveData.pm2_5 * 10) / 10,
          pm10: Math.round(liveData.pm10 * 10) / 10,
          co: Math.round(liveData.co),
          no2: Math.round(liveData.no2 * 10) / 10,
          o3: Math.round(liveData.o3 * 10) / 10,
          so2: Math.round(liveData.so2 * 10) / 10,
          dataPoints: 1,
          isMLPrediction: false
        });
        setLoading(false);
        return;
      }

      if (isFuture) {
        // Check if date is within 5-day API forecast range
        const targetDate = new Date(selectedDate);
        const daysAhead = Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        if (daysAhead <= 5) {
          // Use SAME API data as 5-day forecast for consistency
          try {
            const forecastData = await fetchAirQualityForecast(coords);
            const matchingDay = forecastData.find(f => f.date === selectedDate);

            if (matchingDay) {
              // Use API forecast DIRECTLY (same value as 5-day forecast card)
              setDayResult({
                aqi: matchingDay.aqi,
                date: selectedDate,
                dataPoints: 0,
                isMLPrediction: false,
                mlConfidence: Math.max(0.60, 0.95 - (daysAhead - 1) * 0.08),
                mlFactors: ['7-API ML Aggregated forecast (same as 5-Day Forecast card)']
              });
              setLoading(false);
              return;
            }
          } catch (e) {
            // Fall through to ML prediction
          }
        }

        // Use ML prediction for dates beyond API forecast range (>5 days)
        const mlPrediction: CalendarAnalysis = predictForDate(targetDate, currentAQI, 75);
        setDayResult({
          aqi: mlPrediction.predictedAQI,
          date: selectedDate,
          dataPoints: 0,
          isMLPrediction: true,
          mlConfidence: mlPrediction.confidence,
          mlFactors: [...mlPrediction.factors, 'Beyond 5-day API range - using ML prediction']
        });
        setLoading(false);
        return;
      }

      // For past dates, use historical API
      let startUnix, endUnix;

      if (mode === 'day') {
        const dateObj = new Date(selectedDate);
        startUnix = Math.floor(dateObj.getTime() / 1000);
        endUnix = startUnix + 86400;
      } else {
        const [year, month] = selectedMonth.split('-').map(Number);
        const dateObj = new Date(year, month - 1, 1);
        startUnix = Math.floor(dateObj.getTime() / 1000);
        const lastDay = new Date(year, month, 0);
        endUnix = Math.floor(lastDay.getTime() / 1000) + 86400 - 1;
      }

      const data = await fetchHistoricalAirQuality(coords, startUnix, endUnix);

      if (data && data.length > 0) {
        if (mode === 'day') {
          const totals = data.reduce((acc, curr) => ({
            pm2_5: acc.pm2_5 + curr.components.pm2_5,
            pm10: acc.pm10 + curr.components.pm10,
            co: acc.co + curr.components.co,
            no2: acc.no2 + curr.components.no2,
            o3: acc.o3 + curr.components.o3,
            so2: acc.so2 + curr.components.so2,
            no: acc.no + curr.components.no,
            nh3: acc.nh3 + curr.components.nh3
          }), { pm2_5: 0, pm10: 0, co: 0, no2: 0, o3: 0, so2: 0, no: 0, nh3: 0 });

          const count = data.length;
          const avgPm25 = totals.pm2_5 / count;
          const aqi = calculateUSAQI(avgPm25);

          setDayResult({
            aqi,
            date: selectedDate,
            pm2_5: Math.round(avgPm25 * 10) / 10,
            pm10: Math.round(totals.pm10 / count * 10) / 10,
            co: Math.round(totals.co / count),
            no2: Math.round(totals.no2 / count * 10) / 10,
            o3: Math.round(totals.o3 / count * 10) / 10,
            so2: Math.round(totals.so2 / count * 10) / 10,
            dataPoints: count,
            isMLPrediction: false
          });
        } else {
          // Month mode with potential ML predictions for future days
          const dailyGroups: Record<string, { pm2_5: number[]; pm10: number[]; co: number[]; no2: number[]; o3: number[]; so2: number[] }> = {};

          data.forEach(item => {
            const date = new Date(item.dt * 1000).toISOString().split('T')[0];
            if (!dailyGroups[date]) {
              dailyGroups[date] = { pm2_5: [], pm10: [], co: [], no2: [], o3: [], so2: [] };
            }
            dailyGroups[date].pm2_5.push(item.components.pm2_5);
            dailyGroups[date].pm10.push(item.components.pm10);
            dailyGroups[date].co.push(item.components.co);
            dailyGroups[date].no2.push(item.components.no2);
            dailyGroups[date].o3.push(item.components.o3);
            dailyGroups[date].so2.push(item.components.so2);
          });

          const dailyAverages = Object.keys(dailyGroups).map(date => {
            const g = dailyGroups[date];
            const avgPm25 = g.pm2_5.reduce((a, b) => a + b, 0) / g.pm2_5.length;
            return {
              date,
              aqi: calculateUSAQI(avgPm25),
              pm2_5: Math.round(avgPm25),
              pm10: Math.round(g.pm10.reduce((a, b) => a + b, 0) / g.pm10.length),
              no2: Math.round(g.no2.reduce((a, b) => a + b, 0) / g.no2.length),
              o3: Math.round(g.o3.reduce((a, b) => a + b, 0) / g.o3.length),
              isMLPrediction: false,
              mlConfidence: undefined
            };
          }).sort((a, b) => a.date.localeCompare(b.date));

          setMonthResult(dailyAverages);
        }
      } else {
        setError('No data available for this period.');
      }
    } catch (e) {
      setError('Failed to fetch historical data.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
          <h3 className="font-bold text-white flex items-center gap-2">
            <CalendarIcon size={18} className="text-purple-400" />
            AI Time Travel
            <BrainCircuit size={14} className="text-purple-400" />
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <Sparkles size={16} className="text-purple-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-purple-300 font-bold">ML-Powered Predictions</p>
              <p className="text-[10px] text-slate-400">
                Future dates use our neural network to predict AQI based on seasonal patterns, day of week, and current conditions.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Check past or <span className="text-purple-400 font-bold">predict future</span> Air Quality for <span className="text-white font-medium">{locationName}</span>.
          </p>

          {/* Toggle Mode */}
          <div className="bg-slate-800 p-1 rounded-lg flex gap-1 border border-white/5">
            <button
              onClick={() => { setMode('day'); setMonthResult([]); setDayResult(null); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'day' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <CalendarDays size={14} /> Single Day
            </button>
            <button
              onClick={() => { setMode('month'); setMonthResult([]); setDayResult(null); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'month' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <LayoutGrid size={14} /> Full Month
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase">Select {mode === 'day' ? 'Date' : 'Month'}</label>
            {mode === 'day' ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            ) : (
              <input
                type="month"
                max={new Date().toISOString().slice(0, 7)}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            )}
          </div>

          <button
            onClick={handleFetch}
            disabled={loading || (mode === 'day' ? !selectedDate : !selectedMonth)}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            {loading ? 'Analyzing...' : selectedDate > new Date().toISOString().split('T')[0] ? '🤖 ML Predict' : 'Get History'}
          </button>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          {/* Result Display - Single Day */}
          {dayResult && (
            <div className="mt-4 p-4 bg-slate-800 rounded-xl border border-white/5 animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  {dayResult.isMLPrediction ? (
                    <span className="flex items-center gap-1 text-purple-400">
                      <BrainCircuit size={12} /> ML Prediction for
                    </span>
                  ) : dayResult.dataPoints === 1 ? 'Live Data for' : 'Historical Data for'}
                </p>
                <span className="text-xs text-slate-500">{dayResult.date}</span>
              </div>

              {/* ML Confidence */}
              {dayResult.isMLPrediction && dayResult.mlConfidence && (
                <div className="mb-3 p-2 bg-purple-500/10 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-400">🤖 AI Confidence</span>
                    <span className="font-bold text-white">{Math.round(dayResult.mlConfidence * 100)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                      style={{ width: `${dayResult.mlConfidence * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Main AQI Display */}
              <div className="text-center mb-4">
                <div className="text-5xl font-black text-white mb-2">{dayResult.aqi}</div>
                <div className={`text-xs font-bold px-4 py-1.5 rounded-full inline-block border ${getStatusColor(dayResult.aqi)}`}>
                  {getStatusLabel(dayResult.aqi)}
                </div>
              </div>

              {/* ML Factors */}
              {dayResult.isMLPrediction && dayResult.mlFactors && dayResult.mlFactors.length > 0 && (
                <div className="mb-3 space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Info size={10} /> Prediction factors:
                  </div>
                  {dayResult.mlFactors.map((factor, idx) => (
                    <div key={idx} className="text-[10px] text-slate-400 pl-3 border-l border-purple-500/30">
                      {factor}
                    </div>
                  ))}
                </div>
              )}

              {/* Pollutant Breakdown Grid */}
              {!dayResult.isMLPrediction && dayResult.dataPoints !== 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-slate-900/50 p-2 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase">PM2.5</div>
                    <div className="text-sm font-bold text-purple-400">{dayResult.pm2_5 ?? '-'}</div>
                    <div className="text-[9px] text-slate-600">µg/m³</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase">PM10</div>
                    <div className="text-sm font-bold text-blue-400">{dayResult.pm10 ?? '-'}</div>
                    <div className="text-[9px] text-slate-600">µg/m³</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase">CO</div>
                    <div className="text-sm font-bold text-orange-400">{dayResult.co ?? '-'}</div>
                    <div className="text-[9px] text-slate-600">µg/m³</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase">NO₂</div>
                    <div className="text-sm font-bold text-red-400">{dayResult.no2 ?? '-'}</div>
                    <div className="text-[9px] text-slate-600">µg/m³</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase">O₃</div>
                    <div className="text-sm font-bold text-cyan-400">{dayResult.o3 ?? '-'}</div>
                    <div className="text-[9px] text-slate-600">µg/m³</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase">SO₂</div>
                    <div className="text-sm font-bold text-yellow-400">{dayResult.so2 ?? '-'}</div>
                    <div className="text-[9px] text-slate-600">µg/m³</div>
                  </div>
                </div>
              )}

              {/* Data Source Info */}
              <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-2">
                {dayResult.isMLPrediction ? (
                  <>
                    <BrainCircuit size={10} className="text-purple-400" />
                    <span className="text-purple-400">Neural Network Prediction</span>
                  </>
                ) : dayResult.dataPoints === 1 ? (
                  <span className="text-green-400">🔴 Live data from ML Aggregated (7 APIs)</span>
                ) : (
                  <span>Based on {dayResult.dataPoints} historical measurements</span>
                )}
              </div>
            </div>
          )}

          {/* Result Display - Month Grid */}
          {monthResult.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Daily Averages</span>
                <span className="text-xs text-slate-500">{monthResult.length} Days</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {monthResult.map((day) => {
                  const dayNum = parseInt(day.date.split('-')[2]);
                  return (
                    <div
                      key={day.date}
                      className={`p-2 rounded-lg border text-center transition-all hover:scale-105 cursor-pointer ${getStatusColor(day.aqi)}`}
                      title={`${day.date}\nAQI: ${day.aqi}\nPM2.5: ${day.pm2_5 ?? '-'} µg/m³\nPM10: ${day.pm10 ?? '-'} µg/m³\nNO₂: ${day.no2 ?? '-'} µg/m³\nO₃: ${day.o3 ?? '-'} µg/m³`}
                    >
                      <div className="text-[10px] opacity-70 font-medium">{dayNum}</div>
                      <div className="text-sm font-bold">{day.aqi}</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-2">Hover over a day to see pollutant details</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-slate-800/30 flex items-center justify-center gap-2">
          <BrainCircuit size={12} className="text-purple-400" />
          <span className="text-[10px] text-slate-500">Powered by AirSense ML Engine</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarHistory;