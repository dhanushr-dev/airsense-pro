# 🌬️ AirSense Pro - Next-Generation AI Air Quality Tracker

<div align="center">
  <img width="1200" height="475" alt="AirSense Pro Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  <p align="center">
    <strong>A high-performance web and mobile application integrating 8 multi-source APIs with Google Gemini AI for advanced environmental tracking.</strong>
  </p>

  <p align="center">
    <a href="https://airsensepro.netlify.app">🌐 Live Web Application</a>
  </p>
</div>

---

## ✨ Features

- **🌐 8 Multi-Source API Aggregation**: Dynamically queries and weighs data from multiple leading air quality networks:
  - **CPCB (Central Pollution Control Board - India)** (Official government data)
  - **IQAir / AirVisual**
  - **WAQI (World Air Quality Index)**
  - **OpenAQ**
  - **OpenWeatherMap**
  - **AccuWeather**
  - **WeatherAPI.com**
- **🤖 AirSense Bot (Google Gemini)**: Built-in context-aware chatbot powered by `gemini-2.5-flash` to answer environmental questions, evaluate safety profiles, and give tailored health recommendations.
- **📈 ML Insights & Historical Data**: Access predicted AQI trends and view a full **Calendar History** chart tracking pollutant variations over time.
- **🗺️ Interactive Map**: Real-time Leaflet Map visualizing live geographical air quality index distributions.
- **📊 Gas Gauges & Pollutant Breakdown**: Visualizes core chemical concentrations (PM2.5, PM10, CO, NO2, O3, SO2) with dynamic range counters.
- **⚡ Android & Mobile Ready**: Full integration with **Capacitor** allowing one-click builds for native Android devices.
- **🗣️ Multi-language Localization**: High-fidelity support for regional and global languages.
- **🔔 Custom Settings & Alerts**: Set personalized warning thresholds for pollutant limits with notifications.

---

## 🛠️ Tech Stack

- **Core**: React 18, TypeScript, Vite
- **Styling**: Vanilla CSS with modern dark mode and responsive layout grids
- **Maps**: Leaflet & React-Leaflet
- **Charts**: Recharts (for trends, predictions, and timeline analyses)
- **AI Integration**: Google GenAI SDK (`@google/genai`)
- **Native Wrapper**: Capacitor (App, Device, Geolocation, Splash Screen)
- **Icons**: Lucide React

---

## 🚀 Run Locally

### Prerequisites
- Node.js (v18+)
- npm

### 1. Clone the repository and install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env` and fill in your private API keys:
```bash
cp .env.example .env
```

Define the following environment variables:
```env
# Google Gemini API
VITE_API_KEY=YOUR_GEMINI_API_KEY

# Weather & AQI APIs
VITE_API_KEY_IQAIR=YOUR_IQAIR_API_KEY
VITE_API_KEY_WAQI=YOUR_WAQI_API_KEY
VITE_API_KEY_WEATHER=YOUR_OPENWEATHERMAP_API_KEY
VITE_API_KEY_ACCUWEATHER=YOUR_ACCUWEATHER_API_KEY
VITE_API_KEY_WEATHERAPI=YOUR_WEATHERAPI_API_KEY

# City-Specific Distributed Keys (IQAir)
VITE_API_KEY_IQAIR_CITY_1=YOUR_IQAIR_CITY_KEY_1
VITE_API_KEY_IQAIR_CITY_2=YOUR_IQAIR_CITY_KEY_2
VITE_API_KEY_IQAIR_CITY_3=YOUR_IQAIR_CITY_KEY_3
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Android Build Instructions

For compiling and running the native Android wrapper:

1. **Build the production web assets**:
   ```bash
   npm run build:web
   ```

2. **Sync the android assets with Capacitor**:
   ```bash
   npx cap sync android
   ```

3. **Open Android Studio**:
   ```bash
   npx cap open android
   ```

4. Run the app on a connected physical device or emulator directly inside Android Studio.
