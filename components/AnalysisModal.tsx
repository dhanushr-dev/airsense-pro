import React, { useState, useEffect } from 'react';
import { X, Search, Trash2, TrendingUp, TrendingDown, Loader2, BrainCircuit, Zap, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Coordinates, GeoLocation, HistoricalAirQualityPoint } from '../types';
import { searchLocations, fetchHistoricalAirQuality } from '../services/api';
import { analyzeTrends, TrendAnalysis } from '../services/ml';

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLocation: string;
    currentCoords: Coordinates;
}

interface LocationSeries {
    id: string;
    name: string;
    color: string;
    data: HistoricalAirQualityPoint[];
    mlAnalysis?: TrendAnalysis | null;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, currentLocation, currentCoords }) => {
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
    const [comparisonLocations, setComparisonLocations] = useState<LocationSeries[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GeoLocation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);

    // Load Main Location History
    useEffect(() => {
        if (isOpen) {
            setComparisonLocations([]);
            loadHistory(currentCoords, currentLocation, 0);
        }
    }, [isOpen, timeRange]);

    const loadHistory = async (coords: Coordinates, name: string, colorIndex: number) => {
        setIsLoading(true);
        const end = Math.floor(Date.now() / 1000);
        let start = end;

        if (timeRange === '7d') start = end - (7 * 24 * 3600);
        if (timeRange === '30d') start = end - (30 * 24 * 3600);
        if (timeRange === '90d') start = end - (90 * 24 * 3600);

        const data = await fetchHistoricalAirQuality(coords, start, end);

        // Run ML trend analysis
        let mlAnalysis: TrendAnalysis | null = null;
        if (data && data.length > 0) {
            const mlData = data.map(d => ({
                hour: new Date(d.dt * 1000).getHours(),
                aqi: Math.round((d.main?.aqi || 1) * 50) // Use AQI from API (scaled)
            }));
            mlAnalysis = analyzeTrends(mlData);
        }

        const series: LocationSeries = {
            id: `${coords.lat}-${coords.lon}`,
            name,
            color: COLORS[colorIndex % COLORS.length],
            data,
            mlAnalysis
        };

        setComparisonLocations(prev => {
            const exists = prev.find(p => p.id === series.id);
            if (exists) return prev;
            return [...prev, series];
        });
        setIsLoading(false);
    };

    // Process data for Recharts
    useEffect(() => {
        if (comparisonLocations.length === 0) return;

        const baseSeries = comparisonLocations[0];
        if (!baseSeries.data || baseSeries.data.length === 0) return;

        const processed = baseSeries.data.map((point, idx) => {
            const date = new Date(point.dt * 1000);
            const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

            const item: any = {
                date: point.dt * 1000,
                label,
            };

            comparisonLocations.forEach(loc => {
                const locPoint = loc.data[idx];
                if (locPoint) {
                    // Use AQI value (scaled from API aqi 1-5 to 0-500 scale)
                    item[loc.name] = Math.round((locPoint.main?.aqi || 1) * 50);
                }
            });

            return item;
        });

        const limit = 50;
        const step = Math.ceil(processed.length / limit);
        const sampled = processed.filter((_, i) => i % step === 0);

        setHistoryData(sampled);
    }, [comparisonLocations]);

    const handleSearch = async () => {
        if (searchQuery.length < 2) return;
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
    };

    const addLocation = (loc: GeoLocation) => {
        loadHistory({ lat: loc.lat, lon: loc.lon }, loc.name, comparisonLocations.length);
        setSearchResults([]);
        setSearchQuery('');
    };

    const removeLocation = (id: string) => {
        setComparisonLocations(prev => prev.filter(l => l.id !== id));
    };

    const formatHour = (hour: number) => {
        return hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
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
            case 'daily_cycle': return 'bg-blue-500/20 text-blue-400';
            case 'weekly_cycle': return 'bg-purple-500/20 text-purple-400';
            case 'event_driven': return 'bg-red-500/20 text-red-400';
            default: return 'bg-green-500/20 text-green-400';
        }
    };

    if (!isOpen) return null;

    const primaryAnalysis = comparisonLocations[0]?.mlAnalysis;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 w-full md:max-w-6xl h-full md:h-[85vh] rounded-none md:rounded-2xl border-0 md:border border-white/10 shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="text-blue-400" />
                            ML Historical Analysis
                            <BrainCircuit size={20} className="text-purple-400" />
                        </h2>
                        <p className="text-slate-400 text-sm">AI-powered trend analysis & pattern recognition</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

                    {/* Sidebar Controls */}
                    <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 p-4 md:p-6 bg-slate-900/50 overflow-y-auto custom-scrollbar max-h-[200px] md:max-h-none shrink-0">

                        {/* ML Insights Panel */}
                        {primaryAnalysis && (
                            <div className="mb-6 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <BrainCircuit size={14} className="text-purple-400" />
                                    <span className="text-xs font-bold text-purple-400">ML Insights</span>
                                </div>
                                <div className="space-y-2">
                                    <div className={`px-2 py-1 rounded text-[10px] font-bold inline-block ${getPatternColor(primaryAnalysis.pattern)}`}>
                                        {getPatternLabel(primaryAnalysis.pattern)}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        <div className="bg-slate-800/50 p-2 rounded">
                                            <div className="text-slate-500">Avg AQI</div>
                                            <div className="font-bold text-white">{primaryAnalysis.avgAQI}</div>
                                        </div>
                                        <div className="bg-slate-800/50 p-2 rounded">
                                            <div className="text-slate-500">Std Dev</div>
                                            <div className="font-bold text-white">±{primaryAnalysis.stdDev}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1 text-red-400 text-[10px]">
                                            <TrendingUp size={10} />
                                            <span>Peak: {primaryAnalysis.peakHours.slice(0, 3).map(h => formatHour(h)).join(', ')}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-green-400 text-[10px]">
                                            <TrendingDown size={10} />
                                            <span>Best: {primaryAnalysis.bestHours.slice(0, 3).map(h => formatHour(h)).join(', ')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Time Range</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {(['7d', '30d', '90d'] as const).map(range => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${timeRange === range ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                    >
                                        {range.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Comparisons</h3>

                            {/* Add Location Search */}
                            <div className="relative mb-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add City to Compare..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                    <button onClick={handleSearch} className="bg-slate-700 p-2 rounded-lg hover:bg-slate-600 border border-white/10">
                                        <Search size={16} />
                                    </button>
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                        {searchResults.map((res, idx) => (
                                            <button
                                                key={`${res.lat}-${res.lon}-${idx}`}
                                                onClick={() => addLocation(res)}
                                                className="w-full text-left p-2 hover:bg-white/5 text-sm text-slate-300 border-b border-white/5 last:border-none"
                                            >
                                                <span className="font-bold text-white">{res.name}</span>, {res.country}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {comparisonLocations.map(loc => (
                                    <div key={loc.id} className="p-3 bg-slate-800/50 rounded-lg border border-white/5">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: loc.color }}></div>
                                                <span className="text-sm font-medium text-slate-200 truncate">{loc.name}</span>
                                            </div>
                                            {comparisonLocations.length > 1 && (
                                                <button onClick={() => removeLocation(loc.id)} className="text-slate-500 hover:text-red-400 p-1">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        {loc.mlAnalysis && (
                                            <div className="flex items-center gap-2 text-[9px] text-slate-500">
                                                <Activity size={10} />
                                                <span>Avg: {loc.mlAnalysis.avgAQI} AQI</span>
                                                <span>•</span>
                                                <span>{getPatternLabel(loc.mlAnalysis.pattern)}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Chart Area */}
                    <div className="flex-1 p-4 md:p-6 flex flex-col min-h-[300px]">
                        <div className="flex-1 bg-slate-800/30 rounded-2xl border border-white/5 p-4 relative flex flex-col">
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10 rounded-2xl">
                                    <Loader2 className="animate-spin text-blue-500" size={32} />
                                    <span className="text-xs text-slate-400 mt-2">ML analyzing patterns...</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                                    <Zap size={16} className="text-yellow-400" />
                                    AQI (Air Quality Index)
                                </h3>
                                {primaryAnalysis && (
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                        <BrainCircuit size={12} className="text-purple-400" />
                                        Pattern: {getPatternLabel(primaryAnalysis.pattern)}
                                    </div>
                                )}
                            </div>

                            <div className="flex-grow">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={historyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis
                                            dataKey="label"
                                            stroke="#94a3b8"
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            stroke="#94a3b8"
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                        <Legend verticalAlign="top" height={36} />
                                        {comparisonLocations.map(loc => (
                                            <Line
                                                key={loc.id}
                                                type="monotone"
                                                dataKey={loc.name}
                                                stroke={loc.color}
                                                strokeWidth={3}
                                                dot={false}
                                                activeDot={{ r: 6 }}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* ML Footer */}

                    </div>

                </div>
            </div>
        </div>
    );
};

export default AnalysisModal;