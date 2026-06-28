// constants.ts
// All API keys are loaded from environment variables.
// Never hardcode keys here. Copy .env.example to .env and fill in your values.

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