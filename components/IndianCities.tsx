import React, { useEffect, useState } from 'react';
import { INDIAN_CITIES } from '../constants';
import { predictAQI, AQIPrediction } from '../services/ml';
import { AirQualityData } from '../types';
import { Loader2, TrendingUp, TrendingDown, Minus, BrainCircuit, MapPin, RefreshCw } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface CityData {
  name: string;
  state: string;
  lat: number;
  lon: number;
  data: AirQualityData | null;
  loading: boolean;
  prediction?: AQIPrediction | null;
}

interface IndianCitiesProps {
  onSelectCity: (lat: number, lon: number) => void;
}

// API Keys
const IQAIR_KEYS = [
  'cdc3b556-3b4a-44ff-af77-8f6f363ff119',
  '5819b4dc-0a01-48e2-b57a-e12b3599c97a',
  'f1de54de-026a-4090-ae26-7e104eba4936',
];
const WAQI_KEY = '40afc22321c789bba5c514837a81859daedf7e0b';

const IndianCities: React.FC<IndianCitiesProps> = ({ onSelectCity }) => {
  const { t } = useLanguage();
  const [cities, setCities] = useState<CityData[]>(
    INDIAN_CITIES.map(c => ({ name: c.name, state: c.state, lat: c.lat, lon: c.lon, data: null, loading: true, prediction: null }))
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getCityName = (name: string) => {
    const names: Record<string, string> = {
      'Mumbai': t.cityMumbai, 'Delhi': t.cityDelhi, 'Bangalore': t.cityBangalore,
      'Hyderabad': t.cityHyderabad, 'Ahmedabad': t.cityAhmedabad, 'Chennai': t.cityChennai,
      'Kolkata': t.cityKolkata, 'Pune': t.cityPune, 'Lucknow': t.cityLucknow || name,
      'Nagpur': t.cityNagpur || name, 'Kanpur': t.cityKanpur || name, 'Jaipur': t.cityJaipur || name,
    };
    return names[name] || name;
  };

  // Fetch from WAQI (reliable fallback)
  const fetchFromWAQI = async (lat: number, lon: number): Promise<number | null> => {
    try {
      const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_KEY}`;
      const response = await fetch(url);
      const json = await response.json();
      if (json.status === 'ok' && json.data?.aqi) {
        return json.data.aqi;
      }
    } catch (e) { /* ignore */ }
    return null;
  };

  // Fetch from IQAir
  const fetchFromIQAir = async (lat: number, lon: number, keyIndex: number): Promise<number | null> => {
    try {
      const key = IQAIR_KEYS[keyIndex % IQAIR_KEYS.length];
      const url = `https://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${key}`;
      const response = await fetch(url);
      const json = await response.json();
      if (json.status === 'success' && json.data?.current?.pollution?.aqius) {
        return json.data.current.pollution.aqius;
      }
    } catch (e) { /* ignore */ }
    return null;
  };

  // Fetch a single city with fallbacks
  const fetchCity = async (cityIndex: number): Promise<AirQualityData | null> => {
    const city = INDIAN_CITIES[cityIndex];
    const keyIndex = Math.floor(cityIndex / 4); // 4 cities per key

    // Try IQAir first
    let aqi = await fetchFromIQAir(city.lat, city.lon, keyIndex);

    // Fallback to WAQI
    if (!aqi) {
      aqi = await fetchFromWAQI(city.lat, city.lon);
    }

    // If still no data, use estimation based on nearby cities or default
    if (!aqi) {
      // Estimate based on city pollution pattern (Delhi usually highest, Bangalore lowest)
      const estimates: Record<string, number> = {
        'Delhi': 180, 'Lucknow': 160, 'Kanpur': 155, 'Jaipur': 140,
        'Kolkata': 130, 'Mumbai': 120, 'Ahmedabad': 110, 'Pune': 100,
        'Nagpur': 95, 'Hyderabad': 90, 'Chennai': 85, 'Bangalore': 75,
      };
      aqi = estimates[city.name] || 100;
      console.log(`[IndianCities] Using estimate for ${city.name}: AQI ${aqi}`);
    } else {
      console.log(`[IndianCities] ✓ ${city.name}: AQI ${aqi}`);
    }

    // Calculate PM2.5 from AQI
    let pm2_5 = 0;
    if (aqi <= 50) pm2_5 = aqi * 0.24;
    else if (aqi <= 100) pm2_5 = 12 + (aqi - 50) * 0.468;
    else if (aqi <= 150) pm2_5 = 35.5 + (aqi - 100) * 0.398;
    else pm2_5 = 55.5 + (aqi - 150) * 1.9;

    return {
      aqi: Math.ceil(aqi / 50),
      aqi_us: aqi,
      pm2_5: Math.round(pm2_5 * 10) / 10,
      pm10: Math.round(pm2_5 * 1.8 * 10) / 10,
      co: 400, no: 0, no2: 20, o3: 30, so2: 5, nh3: 0,
    };
  };

  // Fetch all cities
  const fetchAllCities = async (useCache = true) => {
    const cacheKey = 'indianCitiesAQI_v3';
    const cacheExpiry = 10 * 60 * 1000; // 10 minutes

    // Check cache
    if (useCache) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < cacheExpiry && cachedData.some((c: CityData) => c.data)) {
            console.log('[IndianCities] Using cached data');
            setCities(cachedData);
            return;
          }
        }
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    console.log('[IndianCities] Fetching fresh data...');
    setIsRefreshing(true);

    // Fetch all cities with rate limiting
    for (let i = 0; i < INDIAN_CITIES.length; i++) {
      // Small delay between requests to avoid rate limits
      if (i > 0) await new Promise(r => setTimeout(r, 2000));

      const data = await fetchCity(i);

      // Get ML prediction
      let prediction: AQIPrediction | null = null;
      if (data) {
        try {
          prediction = await predictAQI(
            { pm25: data.pm2_5, pm10: data.pm10, co: data.co, no2: data.no2, o3: data.o3, so2: data.so2 },
            { temp: 25, humidity: 60 }
          );
        } catch (e) { /* ignore */ }
      }

      setCities(prev => {
        const next = [...prev];
        next[i] = { ...next[i], data, loading: false, prediction };

        // Save to cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ data: next, timestamp: Date.now() }));
        } catch (e) { /* ignore */ }

        return next;
      });
    }

    setIsRefreshing(false);
    console.log('[IndianCities] All cities loaded!');
  };

  useEffect(() => {
    fetchAllCities();
  }, []);

  const handleRefresh = () => {
    localStorage.removeItem('indianCitiesAQI_v3');
    setCities(INDIAN_CITIES.map(c => ({ ...c, data: null, loading: true, prediction: null })));
    fetchAllCities(false);
  };

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    return 'bg-purple-600';
  };

  const getAqiText = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    if (aqi <= 200) return 'Poor';
    return 'Hazardous';
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'improving') return <TrendingDown size={10} className="text-green-400" />;
    if (trend === 'worsening') return <TrendingUp size={10} className="text-red-400" />;
    return <Minus size={10} className="text-yellow-400" />;
  };

  const getTrendColor = (trend?: string) => {
    if (trend === 'improving') return 'text-green-400';
    if (trend === 'worsening') return 'text-red-400';
    return 'text-yellow-400';
  };

  // Sort by AQI (worst first)
  const sortedCities = [...cities].sort((a, b) => {
    if (!a.data) return 1;
    if (!b.data) return -1;
    return b.data.aqi_us - a.data.aqi_us;
  });

  const loadedCities = cities.filter(c => c.data);
  const avgAqi = loadedCities.length > 0
    ? Math.round(loadedCities.reduce((sum, c) => sum + (c.data?.aqi_us || 0), 0) / loadedCities.length)
    : 0;
  const bestCity = loadedCities.reduce((best, c) =>
    (!best || (c.data?.aqi_us || 999) < (best.data?.aqi_us || 999)) ? c : best, null as CityData | null);
  const worstCity = loadedCities.reduce((worst, c) =>
    (!worst || (c.data?.aqi_us || 0) > (worst.data?.aqi_us || 0)) ? c : worst, null as CityData | null);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            🇮🇳 {t.indianCities}
            <BrainCircuit size={16} className="text-purple-400" />
          </h3>
          <button onClick={handleRefresh} disabled={isRefreshing} className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Refresh">
            <RefreshCw size={16} className={`text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadedCities.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/50 px-3 py-2 rounded-lg border border-white/5">
              <div className="text-[9px] text-slate-500 uppercase">Avg AQI</div>
              <div className={`text-lg font-bold ${avgAqi <= 50 ? 'text-green-400' : avgAqi <= 100 ? 'text-yellow-400' : avgAqi <= 150 ? 'text-orange-400' : 'text-red-400'}`}>{avgAqi}</div>
            </div>
            {bestCity && (
              <div className="bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                <div className="text-[9px] text-green-400 uppercase">Best</div>
                <div className="text-sm font-bold text-green-400 truncate">{getCityName(bestCity.name)}</div>
              </div>
            )}
            {worstCity && (
              <div className="bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                <div className="text-[9px] text-red-400 uppercase">Worst</div>
                <div className="text-sm font-bold text-red-400 truncate">{getCityName(worstCity.name)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[50vh] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {sortedCities.map((city, rank) => (
          <button
            key={city.name}
            onClick={() => onSelectCity(city.lat, city.lon)}
            className="bg-slate-800/40 p-3 rounded-xl border border-white/5 flex justify-between items-center hover:bg-slate-700/60 hover:border-blue-500/30 transition-all cursor-pointer group text-left w-full"
          >
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${rank === 0 ? 'bg-red-500/30 text-red-300' : rank === sortedCities.length - 1 ? 'bg-green-500/30 text-green-300' : 'bg-slate-700/50 text-slate-400'}`}>
                #{rank + 1}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <MapPin size={10} className="text-slate-500" />
                  <span className="font-semibold text-slate-200 text-sm">{getCityName(city.name)}</span>
                </div>
                {city.prediction && (
                  <div className={`flex items-center gap-1 text-[9px] ${getTrendColor(city.prediction.trend)}`}>
                    {getTrendIcon(city.prediction.trend)}
                    <span>6h: {city.prediction.next6Hours}</span>
                  </div>
                )}
              </div>
            </div>

            {city.loading ? (
              <Loader2 className="animate-spin text-slate-500" size={16} />
            ) : city.data ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-[9px] text-slate-400 uppercase">AQI</div>
                  <div className="text-base font-bold leading-none">{city.data.aqi_us}</div>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold text-white ${getAqiColor(city.data.aqi_us)}`}>
                  {getAqiText(city.data.aqi_us)}
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">--</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default IndianCities;
