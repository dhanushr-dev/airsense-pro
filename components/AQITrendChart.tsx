import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeRange, Coordinates } from '../types';
import { fetchHistoricalAirQuality, calculateUSAQI } from '../services/api';
import { analyzeTrends, TrendAnalysis } from '../services/ml';
import { Loader2, TrendingUp, TrendingDown, BrainCircuit, Zap } from 'lucide-react';

interface AQITrendChartProps {
  coords: Coordinates;
}

const AQITrendChart: React.FC<AQITrendChartProps> = ({ coords }) => {
  const [range, setRange] = useState<TimeRange>('24h');
  const [metric, setMetric] = useState<'aqi' | 'pm2_5' | 'pm10' | 'no2'>('aqi');
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mlAnalysis, setMlAnalysis] = useState<TrendAnalysis | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const end = Math.floor(Date.now() / 1000);
      let start = end;

      // Determine start time based on range
      if (range === '24h') start = end - (24 * 3600);
      else if (range === '7d') start = end - (7 * 24 * 3600);
      else start = end - (30 * 24 * 3600);

      const history = await fetchHistoricalAirQuality(coords, start, end);

      // Process Data for Chart
      if (history && history.length > 0) {
        const processed = history.map(item => {
          const date = new Date(item.dt * 1000);
          let label = '';

          if (range === '24h') {
            label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else {
            label = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }

          const aqi = calculateUSAQI(item.components.pm2_5);

          return {
            name: label,
            timestamp: item.dt,
            hour: date.getHours(),
            aqi: aqi,
            pm2_5: item.components.pm2_5,
            pm10: item.components.pm10,
            no2: item.components.no2,
            co: item.components.co,
            o3: item.components.o3,
            so2: item.components.so2
          };
        });

        // Downsample for performance if needed
        const limit = 50;
        const step = Math.ceil(processed.length / limit);
        const sampled = processed.filter((_, i) => i % step === 0);

        setChartData(sampled);

        // Run ML trend analysis
        const mlData = processed.map(d => ({ hour: d.hour, aqi: d.aqi }));
        const analysis = analyzeTrends(mlData);
        setMlAnalysis(analysis);
      } else {
        setChartData([]);
        setMlAnalysis(null);
      }
      setIsLoading(false);
    };

    loadData();
  }, [range, coords]);

  const getMetricColor = (m: string) => {
    switch (m) {
      case 'aqi': return '#60a5fa'; // Blue
      case 'pm2_5': return '#a855f7'; // Purple
      case 'pm10': return '#f472b6'; // Pink
      case 'no2': return '#facc15'; // Yellow
      default: return '#60a5fa';
    }
  };

  const getMetricLabel = (m: string) => {
    switch (m) {
      case 'aqi': return 'AQI (US)';
      case 'pm2_5': return 'PM2.5 (µg/m³)';
      case 'pm10': return 'PM10 (µg/m³)';
      case 'no2': return 'NO₂ (µg/m³)';
      default: return m;
    }
  };

  const getPatternLabel = (pattern: string) => {
    switch (pattern) {
      case 'daily_cycle': return 'Daily Cycle';
      case 'weekly_cycle': return 'Weekly Pattern';
      case 'event_driven': return 'Event Driven';
      case 'seasonal': return 'Seasonal';
      default: return 'Stable';
    }
  };

  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'daily_cycle': return 'text-blue-400 bg-blue-500/20';
      case 'weekly_cycle': return 'text-purple-400 bg-purple-500/20';
      case 'event_driven': return 'text-red-400 bg-red-500/20';
      case 'seasonal': return 'text-orange-400 bg-orange-500/20';
      default: return 'text-green-400 bg-green-500/20';
    }
  };

  const formatHour = (hour: number) => {
    return hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs z-50">
          <p className="text-slate-400 mb-2 font-medium border-b border-slate-800 pb-1">{label}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex justify-between gap-3 text-blue-400 font-bold">
              <span>AQI:</span>
              <span>{d.aqi}</span>
            </div>
            <div className="flex justify-between gap-3 text-purple-400">
              <span>PM2.5:</span>
              <span>{d.pm2_5?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between gap-3 text-pink-400">
              <span>PM10:</span>
              <span>{d.pm10?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between gap-3 text-red-400">
              <span>NO₂:</span>
              <span>{d.no2?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between gap-3 text-orange-400">
              <span>CO:</span>
              <span>{d.co?.toFixed(0)}</span>
            </div>
            <div className="flex justify-between gap-3 text-cyan-400">
              <span>O₃:</span>
              <span>{d.o3?.toFixed(1)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-blue-400" size={18} />
          <h3 className="text-lg font-semibold text-slate-200">ML Trend Analysis</h3>
          <BrainCircuit size={14} className="text-purple-400" />
        </div>

        <div className="flex gap-2">
          {/* Metric Selector */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-white/5">
            {(['aqi', 'pm2_5', 'pm10', 'no2'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all uppercase ${metric === m
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {m.replace('_', '.')}
              </button>
            ))}
          </div>

          {/* Time Range Selector */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-white/5">
            {(['24h', '7d', '30d'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${range === r
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ML Insights Panel */}
      {mlAnalysis && !isLoading && (
        <div className="mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Pattern */}
          <div className={`px-2 py-1.5 rounded-lg ${getPatternColor(mlAnalysis.pattern)} flex items-center gap-1.5`}>
            <Zap size={12} />
            <span className="text-[10px] font-bold">{getPatternLabel(mlAnalysis.pattern)}</span>
          </div>

          {/* Average */}
          <div className="px-2 py-1.5 rounded-lg bg-slate-800/50 text-slate-300 flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500">Avg:</span>
            <span className="text-[10px] font-bold">{mlAnalysis.avgAQI} AQI</span>
          </div>

          {/* Peak Hours */}
          <div className="px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 flex items-center gap-1.5">
            <TrendingUp size={10} />
            <span className="text-[10px] font-bold">Peak: {mlAnalysis.peakHours.slice(0, 2).map(h => formatHour(h)).join(', ')}</span>
          </div>

          {/* Best Hours */}
          <div className="px-2 py-1.5 rounded-lg bg-green-500/10 text-green-400 flex items-center gap-1.5">
            <TrendingDown size={10} />
            <span className="text-[10px] font-bold">Best: {mlAnalysis.bestHours.slice(0, 2).map(h => formatHour(h)).join(', ')}</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="flex-grow min-h-[180px] relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <span className="text-xs text-slate-400">ML analyzing trends...</span>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradientMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getMetricColor(metric)} stopOpacity={0.4} />
                <stop offset="95%" stopColor={getMetricColor(metric)} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              tick={{ fontSize: 10 }}
              minTickGap={30}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              dx={-10}
              label={{ value: getMetricLabel(metric), angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 10 } }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey={metric}
              stroke={getMetricColor(metric)}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#gradientMetric)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default AQITrendChart;