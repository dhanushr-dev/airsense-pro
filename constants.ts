// ============================================
// AIRSENSE PRO - API CONFIGURATION
// Multi-Source API Keys with Priority Weights
// ============================================

// API Keys - Primary Sources
export const API_KEY_IQAIR = import.meta.env.VITE_API_KEY_IQAIR || ''; // IQAir/AirVisual - Primary AQI + Weather
export const API_KEY_WAQI = import.meta.env.VITE_API_KEY_WAQI || ''; // WAQI - Global Air Quality Index
export const API_KEY_WEATHER = import.meta.env.VITE_API_KEY_WEATHER || ''; // OpenWeatherMap - Weather + Air Pollution
export const API_KEY_ACCUWEATHER = import.meta.env.VITE_API_KEY_ACCUWEATHER || ''; // AccuWeather - Weather Data
export const API_KEY_WEATHERAPI = import.meta.env.VITE_API_KEY_WEATHERAPI || ''; // WeatherAPI.com - Weather + AQI

// IQAir API Keys for Indian Cities (distributed for faster loading)
export const API_KEYS_IQAIR_CITIES = [
  import.meta.env.VITE_API_KEY_IQAIR_CITY_1 || '', // Key 1: Cities 0-3 (Mumbai, Delhi, Bangalore, Hyderabad)
  import.meta.env.VITE_API_KEY_IQAIR_CITY_2 || '', // Key 2: Cities 4-7 (Ahmedabad, Chennai, Kolkata, Pune)
  import.meta.env.VITE_API_KEY_IQAIR_CITY_3 || '', // Key 3: Cities 8-11 (Lucknow, Nagpur, Kanpur, Jaipur)
];


// CPCB doesn't require API key - uses public endpoints
// OpenAQ doesn't require API key - uses public endpoints  
// AQICN uses same token as WAQI

// API Priority Weights (higher = more trusted)
export const API_PRIORITIES = {
  IQAIR: 1.0,        // Highest priority - Primary source
  CPCB: 0.95,        // Official Indian Government data
  WAQI: 0.85,        // Global Air Quality Index
  AQICN: 0.8,        // Air Quality Open Data
  WEATHERAPI: 0.75,  // WeatherAPI.com
  OPENAQ: 0.7,       // Open Air Quality Data
  ACCUWEATHER: 0.65, // AccuWeather
  OPENWEATHERMAP: 0.6 // OpenWeatherMap
};

// Indian Cities for ranking display (with state names and API key group)
export const INDIAN_CITIES = [
  // Group 1 (API Key 1) - Metro Cities
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lon: 72.8777, keyIndex: 0 },
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.209, keyIndex: 0 },
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lon: 77.5946, keyIndex: 0 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.4867, keyIndex: 0 },
  // Group 2 (API Key 2) - Major Cities
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, keyIndex: 1 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, keyIndex: 1 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, keyIndex: 1 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, keyIndex: 1 },
  // Group 3 (API Key 3) - Growing Cities
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, keyIndex: 2 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882, keyIndex: 2 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319, keyIndex: 2 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, keyIndex: 2 },
];

// AQI Category definitions
export const AQI_CATEGORIES = {
  GOOD: { min: 0, max: 50, label: 'Good', color: '#00e400' },
  MODERATE: { min: 51, max: 100, label: 'Moderate', color: '#ffff00' },
  UNHEALTHY_SENSITIVE: { min: 101, max: 150, label: 'Unhealthy for Sensitive Groups', color: '#ff7e00' },
  UNHEALTHY: { min: 151, max: 200, label: 'Unhealthy', color: '#ff0000' },
  VERY_UNHEALTHY: { min: 201, max: 300, label: 'Very Unhealthy', color: '#8f3f97' },
  HAZARDOUS: { min: 301, max: 500, label: 'Hazardous', color: '#7e0023' }
};

// Pollutant breakpoints for US EPA AQI calculation
export const AQI_BREAKPOINTS = {
  pm25: [
    { cLow: 0, cHigh: 12, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 }
  ],
  pm10: [
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
    { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
    { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
    { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
    { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
    { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500 }
  ],
  o3: [
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
    { cLow: 55, cHigh: 70, iLow: 51, iHigh: 100 },
    { cLow: 71, cHigh: 85, iLow: 101, iHigh: 150 },
    { cLow: 86, cHigh: 105, iLow: 151, iHigh: 200 },
    { cLow: 106, cHigh: 200, iLow: 201, iHigh: 300 }
  ],
  no2: [
    { cLow: 0, cHigh: 53, iLow: 0, iHigh: 50 },
    { cLow: 54, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
    { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
    { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
    { cLow: 1250, cHigh: 2049, iLow: 301, iHigh: 500 }
  ],
  so2: [
    { cLow: 0, cHigh: 35, iLow: 0, iHigh: 50 },
    { cLow: 36, cHigh: 75, iLow: 51, iHigh: 100 },
    { cLow: 76, cHigh: 185, iLow: 101, iHigh: 150 },
    { cLow: 186, cHigh: 304, iLow: 151, iHigh: 200 },
    { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
    { cLow: 605, cHigh: 1004, iLow: 301, iHigh: 500 }
  ],
  co: [
    { cLow: 0, cHigh: 4.4, iLow: 0, iHigh: 50 },
    { cLow: 4.5, cHigh: 9.4, iLow: 51, iHigh: 100 },
    { cLow: 9.5, cHigh: 12.4, iLow: 101, iHigh: 150 },
    { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
    { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
    { cLow: 30.5, cHigh: 50.4, iLow: 301, iHigh: 500 }
  ]
};

// Default fallback data
export const DEFAULT_AIR_QUALITY = {
  aqi: 1,
  aqi_us: 50,
  aqi_cn: 50,
  pm2_5: 12,
  pm10: 25,
  o3: 30,
  no2: 20,
  so2: 5,
  co: 0.5,
  no: 0,
  nh3: 0,
  temperature: 25,
  humidity: 50,
  source: 'fallback'
};

export const DEFAULT_WEATHER = {
  temp: 25,
  feels_like: 25,
  humidity: 50,
  pressure: 1013,
  wind_speed: 5,
  wind_deg: 180,
  wind_direction: 180,
  description: 'Clear',
  icon: '01d',
  location_name: 'Current Location',
  source: 'fallback'
};

// Default user settings for alerts and notifications
export const DEFAULT_SETTINGS = {
  soundEnabled: true,
  vibrationEnabled: true,
  aqiThreshold: 150,
  pollutantAlertsEnabled: true,
  pm25Threshold: 35,
  coThreshold: 4000,
  no2Threshold: 40,
  so2Threshold: 40,
  o3Threshold: 100
};