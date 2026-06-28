
export interface Coordinates { lat: number; lon: number; }
export interface WeatherData { temp: number; humidity: number; pressure: number; wind_speed: number; wind_deg: number; wind_direction?: number; location_name: string; description: string; icon: string; uvi?: number; visibility?: number; feels_like?: number; source?: string; }
export interface DailyForecast { temp_max: number; temp_min: number; precipitation_prob: number; condition: string; icon: string; }
export interface ForecastDay {
  date: string;
  aqi: number;
  pm25: number;
  pm10: number;
  temp_max: number;
  temp_min: number;
  description: string;
  icon: string;
}
export interface DailyAQIForecast { date: string; dayName: string; aqi: number; status: string; }
export interface AirQualityData { aqi: number; aqi_us: number; aqi_cn?: number; co: number; no: number; no2: number; o3: number; so2: number; pm2_5: number; pm10: number; nh3: number; station_name?: string; data_source?: string; source?: string; temperature?: number; humidity?: number; }
export interface FullLocationData { coords: Coordinates; weather: WeatherData; forecast: DailyForecast; aqiForecast: DailyAQIForecast[]; air: AirQualityData; timestamp: number; }
export interface ChatMessage { id: string; role: 'user' | 'model'; text: string; timestamp: Date; }
export interface GeoLocation { name: string; lat: number; lon: number; country: string; state?: string; }
export interface HistoricalAirQualityPoint { dt: number; main: { aqi: number; }; components: { co: number; no: number; no2: number; o3: number; so2: number; pm2_5: number; pm10: number; nh3: number; }; }
export type TimeRange = '24h' | '7d' | '30d';
export enum LoadingState { IDLE = 'IDLE', LOADING = 'LOADING', SUCCESS = 'SUCCESS', ERROR = 'ERROR' }

export interface UserSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  aqiThreshold: number; // US AQI trigger
  pollutantAlertsEnabled: boolean; // Master toggle for specific gases
  pm25Threshold: number; // µg/m³
  coThreshold: number; // µg/m³
  no2Threshold: number; // µg/m³
  so2Threshold: number; // µg/m³
  o3Threshold: number; // µg/m³
}

// ==================== MULTI-SOURCE AGGREGATION TYPES ====================

export interface MultiSourceAQIData {
  source: string;
  aqi_us: number;
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
  nh3: number;
  confidence: number;
  timestamp: number;
  station_name?: string;
}

export interface MultiSourceWeatherData {
  source: string;
  temp: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_deg: number;
  description: string;
  icon: string;
  confidence: number;
  timestamp: number;
  location_name?: string;
}

export interface AggregatedAQIResult {
  aqi: number;
  aqi_us: number;
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
  nh3: number;
  confidence: number;
  sources: string[];
  method: 'weighted_avg' | 'median' | 'ml_ensemble';
  station_name: string;
  data_source: string;
}

export interface AggregatedWeatherResult {
  temp: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_deg: number;
  description: string;
  icon: string;
  location_name: string;
  confidence: number;
  sources: string[];
}
