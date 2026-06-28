// ============================================
// AIRSENSE PRO - MULTI-SOURCE API SERVICE
// Aggregates data from 8 APIs with priority weighting
// ============================================

import type { Coordinates, AirQualityData, WeatherData, ForecastDay, FullLocationData } from '../types';
import {
  API_KEY_IQAIR,
  API_KEY_WAQI,
  API_KEY_WEATHER,
  API_KEY_ACCUWEATHER,
  API_KEY_WEATHERAPI,
  API_PRIORITIES,
  DEFAULT_AIR_QUALITY,
  DEFAULT_WEATHER
} from '../constants';

// ============================================
// TYPES
// ============================================

interface APIResponse {
  source: string;
  priority: number;
  data: Partial<AirQualityData> | null;
  weather?: Partial<WeatherData> | null;
  error?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const calculateUSAQI = (pm25: number): number => {
  const breakpoints = [
    { cLow: 0, cHigh: 12, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 }
  ];

  for (const bp of breakpoints) {
    if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
      return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow);
    }
  }
  return pm25 > 500 ? 500 : 0;
};

const isInIndia = (lat: number, lon: number): boolean => {
  return lat >= 6 && lat <= 36 && lon >= 68 && lon <= 98;
};

// ============================================
// API SOURCE 1: IQAir (Priority: 1.0)
// ============================================

export const fetchFromIQAir = async (coords: Coordinates): Promise<APIResponse> => {
  const source = 'IQAir';
  try {
    const url = `https://api.airvisual.com/v2/nearest_city?lat=${coords.lat}&lon=${coords.lon}&key=${API_KEY_IQAIR}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`IQAir returned ${response.status}`);
    }

    const json = await response.json();

    if (json.status !== 'success' || !json.data?.current) {
      throw new Error('Invalid IQAir response');
    }

    const current = json.data.current;
    const pollution = current.pollution || {};
    const weather = current.weather || {};

    return {
      source,
      priority: API_PRIORITIES.IQAIR,
      data: {
        aqi_us: pollution.aqius || 0,
        aqi_cn: pollution.aqicn || 0,
        pm2_5: pollution.mainus === 'p2' ? pollution.aqius * 0.4 : 25,
        pm10: pollution.mainus === 'p1' ? pollution.aqius * 0.8 : 50,
        source: 'IQAir'
      },
      weather: {
        temp: weather.tp || 25,
        humidity: weather.hu || 50,
        pressure: weather.pr || 1013,
        wind_speed: weather.ws || 5,
        description: weather.ic ? getWeatherDescription(weather.ic) : 'Clear',
        icon: weather.ic || '01d',
        source: 'IQAir'
      }
    };
  } catch (error) {
    console.log(`[${source}] Failed:`, error);
    return { source, priority: API_PRIORITIES.IQAIR, data: null, error: String(error) };
  }
};

// ============================================
// API SOURCE 2: CPCB - India (Priority: 0.95)
// ============================================

export const fetchFromCPCB = async (coords: Coordinates): Promise<APIResponse> => {
  const source = 'CPCB';

  // Only fetch for Indian locations
  if (!isInIndia(coords.lat, coords.lon)) {
    return { source, priority: API_PRIORITIES.CPCB, data: null, error: 'Not in India' };
  }

  try {
    // CPCB public API endpoint
    const url = `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&limit=100`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CPCB returned ${response.status}`);
    }

    const json = await response.json();

    if (!json.records || json.records.length === 0) {
      throw new Error('No CPCB data available');
    }

    // Find nearest station
    let nearestStation = json.records[0];
    let minDistance = Infinity;

    for (const record of json.records) {
      if (record.latitude && record.longitude) {
        const dist = Math.sqrt(
          Math.pow(coords.lat - parseFloat(record.latitude), 2) +
          Math.pow(coords.lon - parseFloat(record.longitude), 2)
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestStation = record;
        }
      }
    }

    const pm25 = parseFloat(nearestStation.pm25) || parseFloat(nearestStation.PM25) || 0;
    const pm10 = parseFloat(nearestStation.pm10) || parseFloat(nearestStation.PM10) || 0;

    return {
      source,
      priority: API_PRIORITIES.CPCB,
      data: {
        aqi_us: calculateUSAQI(pm25),
        pm2_5: pm25,
        pm10: pm10,
        no2: parseFloat(nearestStation.no2) || parseFloat(nearestStation.NO2) || 0,
        so2: parseFloat(nearestStation.so2) || parseFloat(nearestStation.SO2) || 0,
        co: parseFloat(nearestStation.co) || parseFloat(nearestStation.CO) || 0,
        o3: parseFloat(nearestStation.ozone) || parseFloat(nearestStation.O3) || 0,
        source: 'CPCB'
      }
    };
  } catch (error) {
    console.log(`[${source}] Failed:`, error);
    return { source, priority: API_PRIORITIES.CPCB, data: null, error: String(error) };
  }
};

// ============================================
// API SOURCE 3: WAQI (Priority: 0.85)
// ============================================

export const fetchFromWAQI = async (coords: Coordinates): Promise<APIResponse> => {
  const source = 'WAQI';
  try {
    const url = `https://api.waqi.info/feed/geo:${coords.lat};${coords.lon}/?token=${API_KEY_WAQI}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`WAQI returned ${response.status}`);
    }

    const json = await response.json();

    if (json.status !== 'ok' || !json.data) {
      throw new Error('Invalid WAQI response');
    }

    const data = json.data;
    const iaqi = data.iaqi || {};

    return {
      source,
      priority: API_PRIORITIES.WAQI,
      data: {
        aqi_us: data.aqi || 0,
        pm2_5: iaqi.pm25?.v || 0,
        pm10: iaqi.pm10?.v || 0,
        o3: iaqi.o3?.v || 0,
        no2: iaqi.no2?.v || 0,
        so2: iaqi.so2?.v || 0,
        co: iaqi.co?.v || 0,
        temperature: iaqi.t?.v,
        humidity: iaqi.h?.v,
        source: 'WAQI'
      },
      weather: iaqi.t?.v ? {
        temp: iaqi.t.v,
        humidity: iaqi.h?.v || 50,
        pressure: iaqi.p?.v || 1013,
        wind_speed: iaqi.w?.v || 5,
        source: 'WAQI'
      } : null
    };
  } catch (error) {
    console.log(`[${source}] Failed:`, error);
    return { source, priority: API_PRIORITIES.WAQI, data: null, error: String(error) };
  }
};

// ============================================
// API SOURCE 4: AQICN (Priority: 0.8)
// ============================================

export const fetchFromAQICN = async (coords: Coordinates): Promise<APIResponse> => {
  const source = 'AQICN';
  try {
    // AQICN uses same token as WAQI
    const url = `https://api.waqi.info/feed/geo:${coords.lat};${coords.lon}/?token=${API_KEY_WAQI}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`AQICN returned ${response.status}`);
    }

    const json = await response.json();

    if (json.status !== 'ok' || !json.data) {
      throw new Error('Invalid AQICN response');
    }

    const data = json.data;
    const iaqi = data.iaqi || {};

    return {
      source,
      priority: API_PRIORITIES.AQICN,
      data: {
        aqi_us: data.aqi || 0,
        pm2_5: iaqi.pm25?.v || 0,
        pm10: iaqi.pm10?.v || 0,
        o3: iaqi.o3?.v || 0,
        no2: iaqi.no2?.v || 0,
        so2: iaqi.so2?.v || 0,
        co: iaqi.co?.v || 0,
        source: 'AQICN'
      }
    };
  } catch (error) {
    console.log(`[${source}] Failed:`, error);
    return { source, priority: API_PRIORITIES.AQICN, data: null, error: String(error) };
  }
};

// ============================================
// API SOURCE 5: WeatherAPI.com (Priority: 0.75)
// ============================================

export const fetchFromWeatherAPI = async (coords: Coordinates): Promise<APIResponse> => {
  const source = 'WeatherAPI';
  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY_WEATHERAPI}&q=${coords.lat},${coords.lon}&aqi=yes`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`WeatherAPI returned ${response.status}`);
    }

    const json = await response.json();

    if (!json.current) {
      throw new Error('Invalid WeatherAPI response');
    }

    const current = json.current;
    const aqi = current.air_quality || {};

    return {
      source,
      priority: API_PRIORITIES.WEATHERAPI,
      data: {
        aqi_us: aqi['us-epa-index'] ? aqi['us-epa-index'] * 50 : 0, // Convert 1-6 scale to AQI
        pm2_5: aqi.pm2_5 || 0,
        pm10: aqi.pm10 || 0,
        o3: aqi.o3 || 0,
        no2: aqi.no2 || 0,
        so2: aqi.so2 || 0,
        co: aqi.co ? aqi.co / 1000 : 0, // Convert µg/m³ to mg/m³
        source: 'WeatherAPI'
      },
      weather: {
        temp: current.temp_c || 25,
        feels_like: current.feelslike_c || 25,
        humidity: current.humidity || 50,
        pressure: current.pressure_mb || 1013,
        wind_speed: current.wind_kph ? current.wind_kph / 3.6 : 5,
        wind_direction: current.wind_degree || 0,
        description: current.condition?.text || 'Clear',
        icon: current.condition?.icon || '',
        source: 'WeatherAPI'
      }
    };
  } catch (error) {
    console.log(`[${source}] Failed:`, error);
    return { source, priority: API_PRIORITIES.WEATHERAPI, data: null, error: String(error) };
  }
};

// ============================================
// API SOURCE 6: OpenAQ (Priority: 0.7)
// ============================================

export const fetchFromOpenAQ = async (coords: Coordinates): Promise<APIResponse> => {
  const source = 'OpenAQ';
  try {
    const url = `https://api.openaq.org/v2/latest?coordinates=${coords.lat},${coords.lon}&radius=50000&limit=10`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`OpenAQ returned ${response.status}`);
    }

    const json = await response.json();

    if (!json.results || json.results.length === 0) {
      throw new Error('No OpenAQ data available');
    }

    // Aggregate measurements from nearest stations
    let pm25 = 0, pm10 = 0, o3 = 0, no2 = 0, so2 = 0, co = 0;

    for (const result of json.results) {
      for (const measurement of result.measurements || []) {
        switch (measurement.parameter) {
          case 'pm25': pm25 = pm25 || measurement.value; break;
          case 'pm10': pm10 = pm10 || measurement.value; break;
          case 'o3': o3 = o3 || measurement.value; break;
          case 'no2': no2 = no2 || measurement.value; break;
          case 'so2': so2 = so2 || measurement.value; break;
          case 'co': co = co || measurement.value; break;
        }
      }
    }

    return {
      source,
      priority: API_PRIORITIES.OPENAQ,
      data: {
        aqi_us: calculateUSAQI(pm25),
        pm2_5: pm25,
        pm10: pm10,
        o3: o3,
        no2: no2,
        so2: so2,
        co: co / 1000, // Convert µg/m³ to mg/m³
        source: 'OpenAQ'
      }
    };
  } catch (error) {
    console.log(`[${source}] Failed:`, error);
    return { source, priority: API_PRIORITIES.OPENAQ, data: null, error: String(error) };
  }
};

// ============================================
// API SOURCE 7: AccuWeather (Priority: 0.65)
// ============================================

export const fetchFromAccuWeather = async (coords: Coordinates): Promise<APIResponse> => {
  const source = 'AccuWeather';
  try {
    // First get location key
    const locationUrl = `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${API_KEY_ACCUWEATHER}&q=${coords.lat},${coords.lon}`;
    const locationResponse = await fetch(locationUrl);

    if (!locationResponse.ok) {
      throw new Error(`AccuWeather location returned ${locationResponse.status}`);
    }

    const locationData = await locationResponse.json();
    const locationKey = locationData.Key;

    if (!locationKey) {
      throw new Error('No AccuWeather location key');
    }

    // Get current conditions
    const conditionsUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${API_KEY_ACCUWEATHER}&details=true`;
    const conditionsResponse = await fetch(conditionsUrl);

    if (!conditionsResponse.ok) {
      throw new Error(`AccuWeather conditions returned ${conditionsResponse.status}`);
    }

    const conditionsData = await conditionsResponse.json();
    const current = conditionsData[0];

    if (!current) {
      throw new Error('No AccuWeather current conditions');
    }

    return {
      source,
      priority: API_PRIORITIES.ACCUWEATHER,
      data: null, // AccuWeather doesn't provide AQI in free tier
      weather: {
        temp: current.Temperature?.Metric?.Value || 25,
        feels_like: current.RealFeelTemperature?.Metric?.Value || 25,
        humidity: current.RelativeHumidity || 50,
        pressure: current.Pressure?.Metric?.Value || 1013,
        wind_speed: current.Wind?.Speed?.Metric?.Value ? current.Wind.Speed.Metric.Value / 3.6 : 5,
        wind_direction: current.Wind?.Direction?.Degrees || 0,
        description: current.WeatherText || 'Clear',
        icon: current.WeatherIcon?.toString() || '01',
        source: 'AccuWeather'
      }
    };
  } catch (error) {
    console.log(`[${source}] Failed:`, error);
    return { source, priority: API_PRIORITIES.ACCUWEATHER, data: null, error: String(error) };
  }
};

// ============================================
// API SOURCE 8: OpenWeatherMap (Priority: 0.6)
// ============================================

export const fetchFromOpenWeatherMap = async (coords: Coordinates): Promise<APIResponse> => {
  const source = 'OpenWeatherMap';
  try {
    // Fetch weather
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY_WEATHER}&units=metric`;
    const weatherResponse = await fetch(weatherUrl);

    // Fetch air pollution
    const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY_WEATHER}`;
    const pollutionResponse = await fetch(pollutionUrl);

    if (!weatherResponse.ok || !pollutionResponse.ok) {
      throw new Error(`OpenWeatherMap returned error`);
    }

    const weatherData = await weatherResponse.json();
    const pollutionData = await pollutionResponse.json();

    const components = pollutionData.list?.[0]?.components || {};
    const main = pollutionData.list?.[0]?.main || {};

    return {
      source,
      priority: API_PRIORITIES.OPENWEATHERMAP,
      data: {
        aqi_us: main.aqi ? main.aqi * 50 : calculateUSAQI(components.pm2_5 || 0), // Convert 1-5 scale
        pm2_5: components.pm2_5 || 0,
        pm10: components.pm10 || 0,
        o3: components.o3 || 0,
        no2: components.no2 || 0,
        so2: components.so2 || 0,
        co: components.co ? components.co / 1000 : 0,
        source: 'OpenWeatherMap'
      },
      weather: {
        temp: weatherData.main?.temp || 25,
        feels_like: weatherData.main?.feels_like || 25,
        humidity: weatherData.main?.humidity || 50,
        pressure: weatherData.main?.pressure || 1013,
        wind_speed: weatherData.wind?.speed || 5,
        wind_direction: weatherData.wind?.deg || 0,
        description: weatherData.weather?.[0]?.description || 'Clear',
        icon: weatherData.weather?.[0]?.icon || '01d',
        source: 'OpenWeatherMap'
      }
    };
  } catch (error) {
    console.log(`[${source}] Failed:`, error);
    return { source, priority: API_PRIORITIES.OPENWEATHERMAP, data: null, error: String(error) };
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getWeatherDescription = (iconCode: string): string => {
  const descriptions: Record<string, string> = {
    '01d': 'Clear Sky', '01n': 'Clear Night',
    '02d': 'Few Clouds', '02n': 'Few Clouds',
    '03d': 'Scattered Clouds', '03n': 'Scattered Clouds',
    '04d': 'Broken Clouds', '04n': 'Broken Clouds',
    '09d': 'Shower Rain', '09n': 'Shower Rain',
    '10d': 'Rain', '10n': 'Rain',
    '11d': 'Thunderstorm', '11n': 'Thunderstorm',
    '13d': 'Snow', '13n': 'Snow',
    '50d': 'Mist', '50n': 'Mist'
  };
  return descriptions[iconCode] || 'Clear';
};

// ============================================
// AGGREGATION LOGIC
// ============================================

export const aggregateAirQualityData = (responses: APIResponse[]): AirQualityData => {
  // Filter successful responses and sort by priority
  const validResponses = responses
    .filter(r => r.data !== null)
    .sort((a, b) => b.priority - a.priority);

  if (validResponses.length === 0) {
    console.log('[API] No valid responses, using fallback data');
    return DEFAULT_AIR_QUALITY as AirQualityData;
  }

  console.log(`[API] Aggregating from ${validResponses.length} sources:`, validResponses.map(r => `${r.source}(${r.priority})`).join(', '));

  // Use highest priority source as base
  const primary = validResponses[0];
  const result: AirQualityData = {
    aqi: Math.ceil((primary.data!.aqi_us || 50) / 50),
    aqi_us: primary.data!.aqi_us || 0,
    aqi_cn: primary.data!.aqi_cn || primary.data!.aqi_us || 0,
    pm2_5: primary.data!.pm2_5 || 0,
    pm10: primary.data!.pm10 || 0,
    o3: primary.data!.o3 || 0,
    no2: primary.data!.no2 || 0,
    so2: primary.data!.so2 || 0,
    co: primary.data!.co || 0,
    no: primary.data!.no || 0,
    nh3: primary.data!.nh3 || 0,
    source: primary.source
  };

  // Fill in missing values from lower priority sources
  for (let i = 1; i < validResponses.length; i++) {
    const resp = validResponses[i];
    if (!result.pm2_5 && resp.data!.pm2_5) result.pm2_5 = resp.data!.pm2_5;
    if (!result.pm10 && resp.data!.pm10) result.pm10 = resp.data!.pm10;
    if (!result.o3 && resp.data!.o3) result.o3 = resp.data!.o3;
    if (!result.no2 && resp.data!.no2) result.no2 = resp.data!.no2;
    if (!result.so2 && resp.data!.so2) result.so2 = resp.data!.so2;
    if (!result.co && resp.data!.co) result.co = resp.data!.co;
  }

  // Recalculate AQI if we have PM2.5
  if (result.pm2_5 > 0) {
    result.aqi_us = calculateUSAQI(result.pm2_5);
  }

  return result;
};

export const aggregateWeatherData = (responses: APIResponse[]): WeatherData => {
  // Filter responses with weather data and sort by priority
  const validResponses = responses
    .filter(r => r.weather !== null && r.weather !== undefined)
    .sort((a, b) => b.priority - a.priority);

  if (validResponses.length === 0) {
    console.log('[API] No valid weather responses, using fallback');
    return DEFAULT_WEATHER as WeatherData;
  }

  const primary = validResponses[0];
  return {
    temp: primary.weather!.temp || 25,
    feels_like: primary.weather!.feels_like || primary.weather!.temp || 25,
    humidity: primary.weather!.humidity || 50,
    pressure: primary.weather!.pressure || 1013,
    wind_speed: primary.weather!.wind_speed || 5,
    wind_deg: primary.weather!.wind_deg || primary.weather!.wind_direction || 0,
    wind_direction: primary.weather!.wind_direction || primary.weather!.wind_deg || 0,
    description: primary.weather!.description || 'Clear',
    icon: primary.weather!.icon || '01d',
    location_name: primary.weather!.location_name || 'Current Location',
    source: primary.source
  };
};

// ============================================
// MAIN EXPORT FUNCTIONS - IQAir Primary
// ============================================

export const fetchAirQualityData = async (coords: Coordinates): Promise<AirQualityData> => {
  console.log(`[API] Fetching air quality from IQAir for lat=${coords.lat.toFixed(4)}, lon=${coords.lon.toFixed(4)}`);

  let aqi_us = 50;
  let pm2_5 = 15;
  let pm10 = 30;
  let co = 400;
  let no2 = 20;
  let o3 = 30;
  let so2 = 5;
  let source = 'fallback';

  // Try IQAir first
  try {
    const url = `https://api.airvisual.com/v2/nearest_city?lat=${coords.lat}&lon=${coords.lon}&key=${API_KEY_IQAIR}`;
    const response = await fetch(url);

    if (response.ok) {
      const json = await response.json();
      console.log('[API] IQAir response:', JSON.stringify(json.data?.current?.pollution));

      if (json.status === 'success' && json.data?.current?.pollution) {
        const pollution = json.data.current.pollution;

        // Get the US AQI value directly
        aqi_us = pollution.aqius || 50;

        // IQAir returns actual PM2.5 concentration in 'p2' field (in µg/m³)
        // The value might be a concentration or an AQI sub-index
        // Check for direct concentration value first
        if (typeof pollution.p2 !== 'undefined' && pollution.p2 !== null) {
          // If p2 is present, use it as PM2.5 concentration
          pm2_5 = pollution.p2;
        } else if (pollution.mainus === 'p2') {
          // Fallback: If main pollutant is PM2.5, reverse calculate from AQI
          // Using EPA AQI breakpoints to estimate PM2.5
          if (aqi_us <= 50) pm2_5 = aqi_us * 0.24;
          else if (aqi_us <= 100) pm2_5 = 12 + (aqi_us - 50) * 0.468;
          else if (aqi_us <= 150) pm2_5 = 35.5 + (aqi_us - 100) * 0.398;
          else if (aqi_us <= 200) pm2_5 = 55.5 + (aqi_us - 150) * 1.898;
          else pm2_5 = 150.5 + (aqi_us - 200) * 0.998;
        } else {
          // Default estimate
          pm2_5 = aqi_us * 0.3;
        }

        pm10 = pm2_5 * 1.8;
        source = 'IQAir';
        console.log(`[API] IQAir AQI: ${aqi_us}, PM2.5: ${pm2_5}, mainus: ${pollution.mainus}`);
      }
    }
  } catch (error) {
    console.log('[API] IQAir failed, trying WAQI:', error);
  }

  // Fallback to WAQI or get additional gas levels
  try {
    const url = `https://api.waqi.info/feed/geo:${coords.lat};${coords.lon}/?token=${API_KEY_WAQI}`;
    const response = await fetch(url);

    if (response.ok) {
      const json = await response.json();
      if (json.status === 'ok' && json.data) {
        const iaqi = json.data.iaqi || {};

        // Use WAQI as primary source if IQAir failed
        if (source === 'fallback') {
          aqi_us = json.data.aqi || aqi_us;
          pm2_5 = iaqi.pm25?.v || pm2_5;
          pm10 = iaqi.pm10?.v || pm10;
          source = 'WAQI';
          console.log(`[API] WAQI AQI: ${aqi_us}, PM2.5: ${pm2_5}`);
        }
        // Don't override IQAir PM values - keep IQAir as primary source

        // Always get gas levels from WAQI
        co = iaqi.co?.v || co;
        no2 = iaqi.no2?.v || no2;
        o3 = iaqi.o3?.v || o3;
        so2 = iaqi.so2?.v || so2;
      }
    }
  } catch (error) {
    console.log('[API] WAQI failed:', error);
  }

  return {
    aqi: Math.ceil(aqi_us / 50),
    aqi_us,
    aqi_cn: aqi_us,
    pm2_5: Math.round(pm2_5 * 10) / 10,
    pm10: Math.round(pm10 * 10) / 10,
    co,
    no: 0,
    no2,
    o3,
    so2,
    nh3: 0,
    source
  } as AirQualityData;
};

export const fetchWeatherData = async (coords: Coordinates): Promise<WeatherData> => {
  console.log(`[API] Fetching weather from IQAir`);

  let temp = 25;
  let humidity = 50;
  let pressure = 1013;
  let wind_speed = 3;
  let description = 'Clear';
  let icon = '01d';

  // Try IQAir first
  try {
    const url = `https://api.airvisual.com/v2/nearest_city?lat=${coords.lat}&lon=${coords.lon}&key=${API_KEY_IQAIR}`;
    const response = await fetch(url);

    if (response.ok) {
      const json = await response.json();
      if (json.status === 'success' && json.data?.current?.weather) {
        const weather = json.data.current.weather;
        temp = weather.tp ?? temp;
        humidity = weather.hu ?? humidity;
        pressure = weather.pr ?? pressure;
        wind_speed = weather.ws ?? wind_speed;
        icon = weather.ic || icon;
        description = getWeatherDescription(icon);
        console.log(`[API] IQAir weather: ${temp}°C, ${description}`);
      }
    }
  } catch (error) {
    console.log('[API] IQAir weather failed:', error);
  }

  return {
    temp,
    humidity,
    pressure,
    wind_speed,
    wind_direction: 180,
    description,
    icon,
    source: 'IQAir'
  } as WeatherData;
};


export const fetchFullLocationData = async (coords: Coordinates): Promise<FullLocationData> => {
  console.log(`[API] Fetching data primarily from IQAir for lat=${coords.lat.toFixed(4)}, lon=${coords.lon.toFixed(4)}`);

  // Primary data from IQAir
  let iqairData: any = null;
  let iqairSuccess = false;

  try {
    const url = `https://api.airvisual.com/v2/nearest_city?lat=${coords.lat}&lon=${coords.lon}&key=${API_KEY_IQAIR}`;
    const response = await fetch(url);

    if (response.ok) {
      const json = await response.json();
      if (json.status === 'success' && json.data?.current) {
        iqairData = json.data;
        iqairSuccess = true;
        const p = json.data.current.pollution;
        console.log(`[API] IQAir SUCCESS - City: ${json.data.city}, AQI US: ${p?.aqius}, Main: ${p?.mainus}`);
      } else {
        console.log('[API] IQAir response not success:', json.status);
      }
    } else {
      console.log('[API] IQAir HTTP error:', response.status);
    }
  } catch (error) {
    console.log('[API] IQAir failed:', error);
  }

  // Backup: Get gas levels from WAQI
  let waqiData: any = null;
  try {
    const url = `https://api.waqi.info/feed/geo:${coords.lat};${coords.lon}/?token=${API_KEY_WAQI}`;
    const response = await fetch(url);

    if (response.ok) {
      const json = await response.json();
      if (json.status === 'ok' && json.data) {
        waqiData = json.data;
        console.log('[API] WAQI gas levels fetched successfully');
      }
    }
  } catch (error) {
    console.log('[API] WAQI failed:', error);
  }

  // Fetch UV Index and Visibility from OpenWeatherMap
  let uvIndex = 0;
  let visibility = 10000; // Default 10km
  try {
    const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY_WEATHER}&units=metric`;
    const owmResponse = await fetch(owmUrl);
    if (owmResponse.ok) {
      const owmJson = await owmResponse.json();
      // Get visibility from OpenWeatherMap (in meters)
      visibility = owmJson.visibility || 10000;
      console.log(`[API] OpenWeatherMap Visibility: ${visibility}m`);
    }

    // Try One Call API 3.0 for UV (with subscription, if available)
    const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${coords.lat}&lon=${coords.lon}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY_WEATHER}`;
    const oneCallResponse = await fetch(oneCallUrl);
    if (oneCallResponse.ok) {
      const oneCallJson = await oneCallResponse.json();
      uvIndex = oneCallJson.current?.uvi || 0;
      console.log(`[API] OpenWeatherMap UV Index: ${uvIndex}`);
    } else {
      // Fallback: Estimate UV based on time of day and latitude
      const hour = new Date().getHours();
      const isDaytime = hour >= 6 && hour <= 18;
      const latitudeFactor = Math.cos(Math.abs(coords.lat) * Math.PI / 180);
      const timeFactor = isDaytime ? Math.sin((hour - 6) * Math.PI / 12) : 0;
      uvIndex = Math.round(10 * latitudeFactor * timeFactor * 10) / 10;
      console.log(`[API] UV Index estimated: ${uvIndex}`);
    }
  } catch (error) {
    console.log('[API] OpenWeatherMap fetch failed:', error);
    // Estimate UV based on time of day
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour <= 18;
    uvIndex = isDaytime ? Math.round(5 * Math.sin((hour - 6) * Math.PI / 12) * 10) / 10 : 0;
  }

  // Extract IQAir data or use defaults
  const pollution = iqairData?.current?.pollution || {};
  const weather = iqairData?.current?.weather || {};

  // Calculate AQI and pollutant values
  const aqi_us = pollution.aqius || waqiData?.aqi || 50;

  // PM2.5 - Prefer IQAir values (calculated from AQI), fallback to WAQI
  let pm2_5 = 0;

  // First priority: Calculate from IQAir AQI using EPA breakpoints
  if (pollution.aqius) {
    const iqairAqi = pollution.aqius;
    if (pollution.mainus === 'p2' || !pollution.mainus) {
      // Use EPA AQI breakpoints to reverse-calculate PM2.5
      if (iqairAqi <= 50) pm2_5 = iqairAqi * 0.24;
      else if (iqairAqi <= 100) pm2_5 = 12 + (iqairAqi - 50) * 0.468;
      else if (iqairAqi <= 150) pm2_5 = 35.5 + (iqairAqi - 100) * 0.398;
      else if (iqairAqi <= 200) pm2_5 = 55.5 + (iqairAqi - 150) * 1.898;
      else pm2_5 = 150.5 + (iqairAqi - 200) * 0.998;
    } else {
      pm2_5 = iqairAqi * 0.3; // Estimate if main pollutant is not PM2.5
    }
    console.log(`[API] PM2.5 from IQAir AQI(${iqairAqi}): ${pm2_5.toFixed(1)} µg/m³`);
  }

  // Fallback to WAQI if IQAir calculation failed
  if (!pm2_5 && waqiData?.iaqi?.pm25?.v) {
    pm2_5 = waqiData.iaqi.pm25.v;
    console.log(`[API] PM2.5 from WAQI fallback: ${pm2_5} µg/m³`);
  }

  // Default if all sources fail
  if (!pm2_5) pm2_5 = aqi_us * 0.3;

  // PM10 - Calculate from IQAir PM2.5, fallback to WAQI
  let pm10 = pm2_5 * 1.8; // Typical PM2.5 to PM10 ratio
  if (waqiData?.iaqi?.pm10?.v) {
    pm10 = waqiData.iaqi.pm10.v; // Use WAQI if available for PM10 specifically
  }

  // Gas levels from WAQI
  const iaqi = waqiData?.iaqi || {};
  const co = iaqi.co?.v || 400;
  const no2 = iaqi.no2?.v || 20;
  const o3 = iaqi.o3?.v || 30;
  const so2 = iaqi.so2?.v || 5;

  // Weather data - prefer OpenWeatherMap for accuracy, fallback to IQAir
  let temp = weather.tp ?? 25;
  let humidity = weather.hu ?? 50;
  let pressure = weather.pr ?? 1013;
  let wind_speed = weather.ws ?? 3;
  let weatherIcon = weather.ic || '01d';
  let weatherDescription = getWeatherDescription(weatherIcon);

  // Fetch accurate weather from OpenWeatherMap
  try {
    const owmWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY_WEATHER}&units=metric`;
    const owmWeatherResponse = await fetch(owmWeatherUrl);

    if (owmWeatherResponse.ok) {
      const owmWeatherJson = await owmWeatherResponse.json();

      // Use OpenWeatherMap data for accurate weather conditions
      temp = owmWeatherJson.main?.temp ?? temp;
      humidity = owmWeatherJson.main?.humidity ?? humidity;
      pressure = owmWeatherJson.main?.pressure ?? pressure;
      wind_speed = owmWeatherJson.wind?.speed ?? wind_speed;

      // Get weather icon and description from OpenWeatherMap
      const owmIcon = owmWeatherJson.weather?.[0]?.icon;
      const owmDescription = owmWeatherJson.weather?.[0]?.description;

      if (owmIcon) weatherIcon = owmIcon;
      if (owmDescription) weatherDescription = owmDescription;

      console.log(`[API] OpenWeatherMap Weather - Temp: ${temp}°C, Humidity: ${humidity}%, Wind: ${wind_speed} m/s, Condition: ${weatherDescription}`);
    }
  } catch (error) {
    console.log('[API] OpenWeatherMap weather failed, using IQAir data:', error);
  }

  // Get location name - try Nominatim first (more reliable)
  let locationName = iqairData?.city || 'Unknown Location';

  if (locationName === 'Unknown Location' || !iqairData?.city) {
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lon}&format=json&addressdetails=1`;
      const nominatimResponse = await fetch(nominatimUrl, {
        headers: { 'User-Agent': 'AirSensePro/1.0' }
      });
      if (nominatimResponse.ok) {
        const nominatimData = await nominatimResponse.json();
        const address = nominatimData.address || {};
        const city = address.city || address.town || address.village || address.suburb || address.county || '';
        const state = address.state || '';
        const country = address.country || '';
        if (city) {
          locationName = city + (state ? `, ${state}` : '') + (country ? `, ${country}` : '');
        }
      }
    } catch (e) {
      console.log('[API] Nominatim failed:', e);
    }
  } else {
    // Format IQAir location name
    const state = iqairData?.state || '';
    const country = iqairData?.country || '';
    locationName = iqairData.city + (state ? `, ${state}` : '') + (country ? `, ${country}` : '');
  }

  // Fetch REAL daily forecast from OpenWeatherMap 5-day/3-hour forecast API
  let forecast = {
    temp_max: temp + 4,
    temp_min: temp - 4,
    precipitation_prob: 0,
    condition: weatherDescription,
    icon: weatherIcon
  };

  try {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY_WEATHER}&units=metric`;
    const forecastResponse = await fetch(forecastUrl);

    if (forecastResponse.ok) {
      const forecastJson = await forecastResponse.json();
      const todayDate = new Date().toISOString().split('T')[0];

      // Filter forecast entries for today
      const todayForecasts = forecastJson.list?.filter((item: any) => {
        const itemDate = item.dt_txt?.split(' ')[0];
        return itemDate === todayDate;
      }) || [];

      if (todayForecasts.length > 0) {
        // Calculate min/max from all today's forecast entries
        let maxTemp = -Infinity;
        let minTemp = Infinity;
        let maxPop = 0;
        let primaryCondition = weatherDescription;
        let primaryIcon = weatherIcon;

        todayForecasts.forEach((entry: any) => {
          const entryTemp = entry.main?.temp || temp;
          if (entryTemp > maxTemp) maxTemp = entryTemp;
          if (entryTemp < minTemp) minTemp = entryTemp;

          // Get max precipitation probability
          const pop = (entry.pop || 0) * 100; // Convert 0-1 to percentage
          if (pop > maxPop) maxPop = pop;

          // Use the weather from the middle of the day (around noon)
          const hour = parseInt(entry.dt_txt?.split(' ')[1]?.split(':')[0] || '0');
          if (hour >= 11 && hour <= 14) {
            primaryCondition = entry.weather?.[0]?.description || primaryCondition;
            primaryIcon = entry.weather?.[0]?.icon || primaryIcon;
          }
        });

        // If we don't have enough data for today, also check tomorrow's first entries
        if (todayForecasts.length < 3) {
          const allForecasts = forecastJson.list || [];
          if (allForecasts.length > 0) {
            allForecasts.slice(0, 8).forEach((entry: any) => {
              const entryTemp = entry.main?.temp || temp;
              if (entryTemp > maxTemp) maxTemp = entryTemp;
              if (entryTemp < minTemp) minTemp = entryTemp;
            });
          }
        }

        forecast = {
          temp_max: maxTemp !== -Infinity ? Math.round(maxTemp) : temp + 4,
          temp_min: minTemp !== Infinity ? Math.round(minTemp) : temp - 4,
          precipitation_prob: Math.round(maxPop),
          condition: primaryCondition,
          icon: primaryIcon
        };

        console.log(`[API] OpenWeatherMap Forecast - High: ${forecast.temp_max}°C, Low: ${forecast.temp_min}°C, Rain: ${forecast.precipitation_prob}%`);
      }
    }
  } catch (error) {
    console.log('[API] OpenWeatherMap forecast failed, using estimates:', error);
  }

  // Fetch 5-day AQI forecast from WeatherAPI (real data)
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const aqiForecast: { date: string; dayName: string; aqi: number; status: string }[] = [];

  try {
    const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY_WEATHERAPI}&q=${coords.lat},${coords.lon}&days=6&aqi=yes`;
    const forecastResponse = await fetch(forecastUrl);

    if (forecastResponse.ok) {
      const forecastData = await forecastResponse.json();

      // Extract AQI from WeatherAPI forecast
      for (const day of forecastData.forecast?.forecastday || []) {
        const aqiData = day.day?.air_quality || {};
        // WeatherAPI returns US EPA index (1-6 scale), convert to 0-500 AQI scale
        const usEpaIndex = aqiData['us-epa-index'] || 2;
        // Map EPA index to AQI ranges: 1=0-50, 2=51-100, 3=101-150, 4=151-200, 5=201-300, 6=301-500
        const aqiRanges = [25, 75, 125, 175, 250, 400];
        const forecastAqi = aqiRanges[Math.min(usEpaIndex - 1, 5)] || 75;

        const forecastDate = new Date(day.date);
        let status = 'Good';
        if (forecastAqi > 300) status = 'Hazardous';
        else if (forecastAqi > 200) status = 'Very Unhealthy';
        else if (forecastAqi > 150) status = 'Unhealthy';
        else if (forecastAqi > 100) status = 'Unhealthy for Sensitive';
        else if (forecastAqi > 50) status = 'Moderate';

        aqiForecast.push({
          date: day.date,
          dayName: dayNames[forecastDate.getDay()],
          aqi: forecastAqi,
          status
        });
      }
      console.log(`[API] WeatherAPI 5-Day AQI Forecast loaded: ${aqiForecast.map(f => f.aqi).join(', ')}`);
    }
  } catch (error) {
    console.log('[API] WeatherAPI forecast failed:', error);
  }

  // Fallback: Generate based on current IQAir AQI if WeatherAPI fails
  if (aqiForecast.length < 6) {
    console.log('[API] Using IQAir-based AQI forecast fallback');
    for (let i = aqiForecast.length; i < 6; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);

      // Use current IQAir AQI with slight trend variation
      const trend = i === 0 ? 0 : (i * 2) * (Math.random() > 0.5 ? 1 : -1);
      const forecastAqi = Math.max(10, Math.min(500, Math.round(aqi_us + trend)));

      let status = 'Good';
      if (forecastAqi > 300) status = 'Hazardous';
      else if (forecastAqi > 200) status = 'Very Unhealthy';
      else if (forecastAqi > 150) status = 'Unhealthy';
      else if (forecastAqi > 100) status = 'Unhealthy for Sensitive';
      else if (forecastAqi > 50) status = 'Moderate';

      aqiForecast.push({
        date: forecastDate.toISOString().split('T')[0],
        dayName: dayNames[forecastDate.getDay()],
        aqi: forecastAqi,
        status
      });
    }
  }

  console.log(`[API] Data ready - AQI: ${aqi_us}, PM2.5: ${pm2_5.toFixed(1)}, Location: ${locationName}`);

  return {
    coords,
    weather: {
      temp,
      humidity,
      pressure,
      wind_speed,
      wind_deg: 180,
      location_name: locationName,
      description: weatherDescription,
      icon: weatherIcon,
      uvi: uvIndex,
      visibility: visibility
    },
    forecast,
    aqiForecast,
    air: {
      aqi: Math.ceil(aqi_us / 50),
      aqi_us,
      co,
      no: 0,
      no2,
      o3,
      so2,
      pm2_5: Math.round(pm2_5 * 10) / 10,
      pm10: Math.round(pm10 * 10) / 10,
      nh3: 0,
      station_name: iqairSuccess ? 'IQAir' : 'WAQI',
      data_source: iqairSuccess ? 'IQAir' : 'WAQI'
    },
    timestamp: Date.now()
  };
};



// ============================================
// FORECAST FUNCTIONS
// ============================================

export const fetchAirQualityForecast = async (coords: Coordinates): Promise<ForecastDay[]> => {
  console.log(`[API] Fetching AQI forecast`);

  const forecasts: ForecastDay[] = [];

  try {
    // Try WeatherAPI for forecast
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY_WEATHERAPI}&q=${coords.lat},${coords.lon}&days=5&aqi=yes`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();

      for (const day of data.forecast?.forecastday || []) {
        const aqi = day.day?.air_quality || {};
        forecasts.push({
          date: day.date,
          aqi: aqi['us-epa-index'] ? aqi['us-epa-index'] * 50 : 50,
          pm25: aqi.pm2_5 || 25,
          pm10: aqi.pm10 || 50,
          temp_max: day.day?.maxtemp_c || 30,
          temp_min: day.day?.mintemp_c || 20,
          description: day.day?.condition?.text || 'Clear',
          icon: day.day?.condition?.icon || ''
        });
      }
    }
  } catch (error) {
    console.log('[API] Forecast fetch failed:', error);
  }

  // Fill with placeholder data if needed
  while (forecasts.length < 5) {
    const date = new Date();
    date.setDate(date.getDate() + forecasts.length);
    forecasts.push({
      date: date.toISOString().split('T')[0],
      aqi: 50 + Math.random() * 50,
      pm25: 15 + Math.random() * 20,
      pm10: 30 + Math.random() * 40,
      temp_max: 28 + Math.random() * 8,
      temp_min: 18 + Math.random() * 8,
      description: 'Partly Cloudy',
      icon: '02d'
    });
  }

  return forecasts;
};

export const fetchHistoricalAirQuality = async (coords: Coordinates, start: number, end: number): Promise<any[]> => {
  console.log(`[API] Fetching historical AQI from ${new Date(start * 1000).toISOString()} to ${new Date(end * 1000).toISOString()}`);

  const history: any[] = [];

  // Get current data from IQAir as base
  const currentData = await fetchAirQualityData(coords);
  const basePm25 = currentData.pm2_5;
  const basePm10 = currentData.pm10;
  const baseNo2 = currentData.no2;
  const baseCo = currentData.co;
  const baseO3 = currentData.o3;
  const baseSo2 = currentData.so2;

  console.log(`[API] Base IQAir values - PM2.5: ${basePm25}, AQI: ${currentData.aqi_us}`);

  // Calculate number of data points (hourly data)
  const duration = end - start;
  const hours = Math.floor(duration / 3600);
  const stepHours = Math.max(1, Math.floor(hours / 50)); // Limit to ~50 points
  // const totalPoints = Math.floor(hours / stepHours) + 1;

  for (let i = 0; i <= hours; i += stepHours) {
    const dt = start + (i * 3600);
    const hourOfDay = new Date(dt * 1000).getHours();
    const isLastPoint = (i + stepHours > hours);

    let pm2_5, pm10, no2, co, o3, so2;

    if (isLastPoint) {
      // Last point = exact current IQAir values
      pm2_5 = basePm25;
      pm10 = basePm10;
      no2 = baseNo2;
      co = baseCo;
      o3 = baseO3;
      so2 = baseSo2;
    } else {
      // Historical points = slight variation around base values
      const diurnalFactor = 1 + 0.15 * Math.sin((hourOfDay - 8) * Math.PI / 12);
      const randomFactor = 0.9 + Math.random() * 0.2;

      pm2_5 = Math.max(1, basePm25 * diurnalFactor * randomFactor);
      pm10 = Math.max(1, basePm10 * diurnalFactor * randomFactor);
      no2 = Math.max(0.1, baseNo2 * randomFactor);
      co = Math.max(100, baseCo * randomFactor);
      o3 = Math.max(1, baseO3 * randomFactor);
      so2 = Math.max(0.1, baseSo2 * randomFactor);
    }

    history.push({
      dt,
      components: { pm2_5, pm10, no2, co, o3, so2 }
    });
  }

  console.log(`[API] Generated ${history.length} historical data points, last PM2.5: ${basePm25}`);
  return history;
};

// ============================================
// SEARCH FUNCTIONS
// ============================================

export const searchLocations = async (query: string): Promise<{ name: string; lat: number; lon: number; country: string; state?: string }[]> => {
  console.log(`[API] Searching locations: ${query}`);

  const results: { name: string; lat: number; lon: number; country: string; state?: string }[] = [];

  // Try OpenWeatherMap first
  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY_WEATHER}`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      for (const item of data) {
        results.push({
          name: item.name,
          lat: item.lat,
          lon: item.lon,
          country: item.country || '',
          state: item.state
        });
      }
      if (results.length > 0) {
        console.log(`[API] OpenWeatherMap geocoding returned ${results.length} results`);
        return results;
      }
    }
  } catch (error) {
    console.log('[API] OpenWeatherMap geocoding failed:', error);
  }

  // Fallback to Nominatim (OpenStreetMap) - no API key required
  try {
    console.log('[API] Trying Nominatim fallback for search...');
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    const nominatimResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'AirSensePro/1.0'
      }
    });

    if (nominatimResponse.ok) {
      const nominatimData = await nominatimResponse.json();
      for (const item of nominatimData) {
        const address = item.address || {};
        results.push({
          name: item.name || address.city || address.town || address.village || item.display_name.split(',')[0],
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          country: address.country_code?.toUpperCase() || '',
          state: address.state || address.region
        });
      }
      console.log(`[API] Nominatim returned ${results.length} results`);
    }
  } catch (error) {
    console.log('[API] Nominatim search failed:', error);
  }

  return results;
};

// ============================================
// INDIAN CITIES - IQAir Only API (Using Coordinates)
// Separate API key to avoid rate limit conflicts
// ============================================

const API_KEY_IQAIR_CITIES = 'ca7567c5-9f77-42a3-b134-9f64780a555d'; // Dedicated key for Indian cities

export const fetchCityAQI = async (cityName: string, state: string, country: string = 'India', lat?: number, lon?: number): Promise<AirQualityData> => {
  console.log(`[API] Fetching AQI from IQAir for city: ${cityName}`);

  let aqi_us = 50;
  let pm2_5 = 15;
  let pm10 = 30;
  let co = 400;
  let no2 = 20;
  let o3 = 30;
  let so2 = 5;
  let source = 'IQAir';

  // Method 1: Try nearest_city with coordinates (more reliable, bypasses city name issues)
  if (lat && lon) {
    try {
      const url = `https://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${API_KEY_IQAIR_CITIES}`;
      const response = await fetch(url);

      if (response.ok) {
        const json = await response.json();

        if (json.status === 'success' && json.data?.current?.pollution) {
          const pollution = json.data.current.pollution;
          aqi_us = pollution.aqius || 50;

          // Calculate PM2.5 from IQAir AQI using EPA breakpoints
          const iqairAqi = pollution.aqius;
          if (pollution.mainus === 'p2' || !pollution.mainus) {
            if (iqairAqi <= 50) pm2_5 = iqairAqi * 0.24;
            else if (iqairAqi <= 100) pm2_5 = 12 + (iqairAqi - 50) * 0.468;
            else if (iqairAqi <= 150) pm2_5 = 35.5 + (iqairAqi - 100) * 0.398;
            else if (iqairAqi <= 200) pm2_5 = 55.5 + (iqairAqi - 150) * 1.898;
            else pm2_5 = 150.5 + (iqairAqi - 200) * 0.998;
          } else {
            pm2_5 = iqairAqi * 0.3;
          }
          pm10 = pm2_5 * 1.8;

          // Estimate gas levels based on AQI
          co = Math.round(aqi_us * 8);
          no2 = Math.round(aqi_us * 0.4);
          o3 = Math.round(aqi_us * 0.5);
          so2 = Math.round(aqi_us * 0.1);

          console.log(`[API] IQAir SUCCESS for ${cityName} (coords): AQI=${aqi_us}, PM2.5=${pm2_5.toFixed(1)}`);

          return {
            aqi: Math.ceil(aqi_us / 50),
            aqi_us,
            aqi_cn: aqi_us,
            pm2_5: Math.round(pm2_5 * 10) / 10,
            pm10: Math.round(pm10 * 10) / 10,
            co, no: 0, no2, o3, so2, nh3: 0, source
          } as AirQualityData;
        } else if (json.status === 'call_limit_reached') {
          console.log(`[API] IQAir rate limit reached for ${cityName}`);
        }
      } else if (response.status === 429) {
        console.log(`[API] IQAir rate limited (429) for ${cityName}`);
      }
    } catch (error) {
      console.log(`[API] IQAir nearest_city failed for ${cityName}:`, error);
    }
  }

  // Method 2: Fallback to city name endpoint
  try {
    const url = `https://api.airvisual.com/v2/city?city=${encodeURIComponent(cityName)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}&key=${API_KEY_IQAIR_CITIES}`;
    const response = await fetch(url);

    if (response.ok) {
      const json = await response.json();

      if (json.status === 'success' && json.data?.current?.pollution) {
        const pollution = json.data.current.pollution;
        aqi_us = pollution.aqius || 50;

        const iqairAqi = pollution.aqius;
        if (pollution.mainus === 'p2' || !pollution.mainus) {
          if (iqairAqi <= 50) pm2_5 = iqairAqi * 0.24;
          else if (iqairAqi <= 100) pm2_5 = 12 + (iqairAqi - 50) * 0.468;
          else if (iqairAqi <= 150) pm2_5 = 35.5 + (iqairAqi - 100) * 0.398;
          else if (iqairAqi <= 200) pm2_5 = 55.5 + (iqairAqi - 150) * 1.898;
          else pm2_5 = 150.5 + (iqairAqi - 200) * 0.998;
        } else {
          pm2_5 = iqairAqi * 0.3;
        }
        pm10 = pm2_5 * 1.8;
        co = Math.round(aqi_us * 8);
        no2 = Math.round(aqi_us * 0.4);
        o3 = Math.round(aqi_us * 0.5);
        so2 = Math.round(aqi_us * 0.1);

        console.log(`[API] IQAir SUCCESS for ${cityName} (name): AQI=${aqi_us}`);
      } else if (json.status === 'call_limit_reached') {
        console.log(`[API] IQAir rate limit for ${cityName}`);
      } else {
        console.log(`[API] IQAir invalid response for ${cityName}:`, json.status);
      }
    }
  } catch (error) {
    console.log(`[API] IQAir city request failed for ${cityName}:`, error);
  }

  return {
    aqi: Math.ceil(aqi_us / 50),
    aqi_us,
    aqi_cn: aqi_us,
    pm2_5: Math.round(pm2_5 * 10) / 10,
    pm10: Math.round(pm10 * 10) / 10,
    co, no: 0, no2, o3, so2, nh3: 0, source
  } as AirQualityData;
};


