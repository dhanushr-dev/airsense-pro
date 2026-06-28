// constants.ts
// All API keys are loaded from environment variables.
// Never hardcode keys here. Copy .env.example to .env and fill in your values.

import type { UserSettings } from './types';

export const GEMINI_API_KEY =
  import.meta.env.VITE_API_KEY || '';

export const IQAIR_API_KEY =
  import.meta.env.VITE_API_KEY_IQAIR || '';

export const WAQI_API_KEY =
  import.meta.env.VITE_API_KEY_WAQI || '';

export const WEATHER_API_KEY =
  import.meta.env.VITE_API_KEY_WEATHER || '';

export const ACCUWEATHER_API_KEY =
  import.meta.env.VITE_API_KEY_ACCUWEATHER || '';

export const WEATHERAPI_KEY =
  import.meta.env.VITE_API_KEY_WEATHERAPI || '';

export const IQAIR_CITY_KEY_1 =
  import.meta.env.VITE_API_KEY_IQAIR_CITY_1 || '';

export const IQAIR_CITY_KEY_2 =
  import.meta.env.VITE_API_KEY_IQAIR_CITY_2 || '';

export const IQAIR_CITY_KEY_3 =
  import.meta.env.VITE_API_KEY_IQAIR_CITY_3 || '';

// ============================================
// API KEY ALIASES
// (match the import names used across the codebase)
// ============================================

export const API_KEY_IQAIR = IQAIR_API_KEY;
export const API_KEY_WAQI = WAQI_API_KEY;
export const API_KEY_WEATHER = WEATHER_API_KEY;
export const API_KEY_ACCUWEATHER = ACCUWEATHER_API_KEY;
export const API_KEY_WEATHERAPI = WEATHERAPI_KEY;

// ============================================
// API PRIORITY WEIGHTS
// Higher value = more trusted source
// ============================================

export const API_PRIORITIES = {
  IQAIR: 1.0,
  CPCB: 0.95,
  WAQI: 0.85,
  AQICN: 0.8,
  WEATHERAPI: 0.75,
  OPENAQ: 0.7,
  ACCUWEATHER: 0.65,
  OPENWEATHERMAP: 0.6,
};

// ============================================
// INDIAN CITIES
// Used by IndianCities component for AQI dashboard
// ============================================

export const INDIAN_CITIES: { name: string; state: string; lat: number; lon: number }[] = [
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
];

// ============================================
// DEFAULT USER SETTINGS
// ============================================

export const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  aqiThreshold: 150,
  pollutantAlertsEnabled: true,
  pm25Threshold: 35.5,
  coThreshold: 10000,
  no2Threshold: 100,
  so2Threshold: 75,
  o3Threshold: 100,
};

// ============================================
// DEFAULT FALLBACK DATA
// Used when all API sources fail
// ============================================

export const DEFAULT_AIR_QUALITY = {
  aqi: 1,
  aqi_us: 50,
  aqi_cn: 50,
  pm2_5: 12,
  pm10: 25,
  o3: 30,
  no2: 20,
  so2: 5,
  co: 400,
  no: 0,
  nh3: 0,
  source: 'Fallback',
};

export const DEFAULT_WEATHER = {
  temp: 25,
  feels_like: 25,
  humidity: 50,
  pressure: 1013,
  wind_speed: 5,
  wind_deg: 0,
  wind_direction: 0,
  description: 'Clear',
  icon: '01d',
  location_name: 'Current Location',
  source: 'Fallback',
};
