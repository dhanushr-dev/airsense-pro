
import React, { useState, useCallback, useEffect } from 'react';
import IntroAnimation from './components/IntroAnimation';
import PermissionScreen from './components/PermissionScreen';
import MapComponent from './components/MapComponent';

import AQITrendChart from './components/AQITrendChart';
import { DEFAULT_SETTINGS } from './constants';
import MLInsights from './components/MLInsights';
import Chatbot from './components/Chatbot';
import IndianCities from './components/IndianCities';
import SearchBar from './components/SearchBar';
import AlertBanner from './components/AlertBanner';
import AnalysisModal from './components/AnalysisModal';
import GasGauge from './components/GasGauge';
import AnimatedCounter from './components/AnimatedCounter';
import DailyForecastCard from './components/DailyForecast';
import InfoModal from './components/InfoModal';
import CalendarHistory from './components/CalendarHistory';
import Recommendations from './components/Recommendations';
import AQIForecast from './components/AQIForecast';
import SettingsModal from './components/SettingsModal';
import { FullLocationData, Coordinates, LoadingState, UserSettings } from './types';
import { fetchFullLocationData } from './services/api';
import { Wind, Droplets, Gauge, Navigation, MapPin, AlertCircle, BarChart3, LocateFixed, RefreshCw, Info, Calendar, Settings, HelpCircle, Sun, Eye } from 'lucide-react';
import TutorialModal from './components/TutorialModal';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import LanguageSelector from './components/LanguageSelector';
import { notificationService, registerServiceWorker } from './services/notifications';

const POLLUTANT_INFO = {
  pm: {
    title: "Particulate Matter (PM2.5 & PM10)",
    content: "PM2.5 refers to fine particles with a diameter of less than 2.5 micrometers, which can penetrate deep into lungs and enter the bloodstream. PM10 are coarser particles (dust, pollen) that irritate the eyes, nose, and throat. High levels are dangerous for respiratory health."
  },
  co: {
    title: "Carbon Monoxide (CO)",
    content: "A colorless, odorless gas produced by incomplete combustion of fossil fuels (vehicles, stoves). High levels reduce the blood's ability to carry oxygen to body tissues, leading to dizziness and fatigue."
  },
  no2: {
    title: "Nitrogen Dioxide (NO2)",
    content: "Primarily gets in the air from the burning of fuel (emissions from cars, trucks and buses, power plants). Breathing air with a high concentration of NO2 can irritate airways in the human respiratory system."
  },
  o3: {
    title: "Ozone (O3)",
    content: "Ground-level ozone is not emitted directly into the air, but is created by chemical reactions between oxides of nitrogen (NOx) and volatile organic compounds (VOC) in the presence of sunlight. It causes smog and triggers asthma."
  },
  so2: {
    title: "Sulfur Dioxide (SO2)",
    content: "Produced from the burning of fossil fuels (coal and oil) and the smelting of mineral ores. It causes irritation of the nose and throat and can form acid rain."
  },
  humidity: {
    title: "Humidity & Pressure",
    content: "High humidity can make pollutants heavier and keep them closer to the ground (trapping smog). Pressure systems dictate weather patterns; low pressure often brings wind and rain which can clear air, while high pressure can trap pollutants."
  }
};

const STORAGE_KEY = 'airsense_last_location';
const SETTINGS_KEY = 'airsense_settings';



const App: React.FC = () => {
  const { t, language } = useLanguage(); // Get translations
  const [showIntro, setShowIntro] = useState(true);


  // Default to Delhi as fallback
  const DEFAULT_COORDS: Coordinates = { lat: 28.6139, lon: 77.2090 };

  // Initialize State from Local Storage if available, otherwise default
  const [currentCoords, setCurrentCoords] = useState<Coordinates>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_COORDS;
    } catch (e) {
      return DEFAULT_COORDS;
    }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  // Permission state - Always start as false to show Permission Screen
  const [hasPermission, setHasPermission] = useState(false);

  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [data, setData] = useState<FullLocationData | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [showToast, setShowToast] = useState<{ message: string, type: 'error' | 'info' } | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Check for first-time tutorial
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('airsense_tutorial_seen');
    if (!hasSeenTutorial && hasPermission) {
      // Only show after permission is granted
      setShowTutorial(true);
      localStorage.setItem('airsense_tutorial_seen', 'true');
    }
  }, [hasPermission]);

  // Initialize notifications and service worker
  useEffect(() => {
    // Register service worker for background notifications
    registerServiceWorker();

    // Request notification permission (non-blocking)
    notificationService.requestPermission().then(granted => {
      if (granted) {
        console.log('[App] Notification permission granted');
      }
    });
  }, []);

  // Info Modal State
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean, title: string, content: string }>({
    isOpen: false,
    title: '',
    content: ''
  });

  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    setShowToast({ message: "Preferences saved successfully.", type: 'info' });
    setTimeout(() => setShowToast(null), 3000);
  };

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { text: t.good, color: "text-green-400", border: "border-green-500" };
    if (aqi <= 100) return { text: t.moderate, color: "text-yellow-400", border: "border-yellow-500" };
    if (aqi <= 150) return { text: t.unhealthyForSensitive, color: "text-orange-400", border: "border-orange-500" };
    if (aqi <= 200) return { text: t.unhealthy, color: "text-red-400", border: "border-red-500" };
    if (aqi <= 300) return { text: t.veryUnhealthy, color: "text-purple-400", border: "border-purple-500" };
    return { text: t.hazardous, color: "text-rose-900", border: "border-rose-900" };
  };

  const fetchData = useCallback(async (coords: Coordinates) => {
    setLoadingState(LoadingState.LOADING);
    try {
      const result = await fetchFullLocationData(coords);
      setData(result);
      setLoadingState(LoadingState.SUCCESS);

      // Send notification for dangerous AQI levels
      if (result.air.aqi_us >= 150) {
        notificationService.sendAQIAlert(
          result.air.aqi_us,
          result.weather.location_name || 'Your location'
        );
      }

      // Cache location for background checks
      if ('caches' in window) {
        try {
          const cache = await caches.open('airsense-data');
          await cache.put('last-location', new Response(JSON.stringify(coords)));
        } catch (e) { /* ignore */ }
      }
    } catch (error) {
      console.error("Data fetch error:", error);
      setLoadingState(LoadingState.ERROR);
      setShowToast({ message: "Failed to load air quality data.", type: 'error' });
    }
  }, []);

  // Initial Live Location Check on Mount
  useEffect(() => {
    if (hasPermission) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setCurrentCoords(newCoords);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newCoords));
          setIsFallbackMode(false);
          fetchData(newCoords);
        },
        (error) => {
          console.warn("Startup: GPS failed", error);
          if (error.code === 1) {
            // Permission actually denied, revoke access so user sees PermissionScreen
            console.log("Permission revoked by user/browser");
            localStorage.removeItem(STORAGE_KEY);
            setHasPermission(false);
          } else {
            // Other errors (timeout, unavailable) -> keep using saved location or default
            console.warn("Using saved location");
            if (!data) fetchData(currentCoords);
          }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocationError = useCallback((message: string) => {
    console.log("Falling back to default location:", message);
    setCurrentCoords(DEFAULT_COORDS);
    setHasPermission(true);
    setIsFallbackMode(true);

    setShowToast({ message: `${message} Using default location (Delhi).`, type: 'info' });
    setTimeout(() => setShowToast(null), 6000);

    fetchData(DEFAULT_COORDS);
  }, [fetchData]);

  const handleLocationGrant = useCallback(() => {
    setLoadingState(LoadingState.LOADING);

    if (!navigator.geolocation) {
      handleLocationError("Geolocation is not supported by your browser.");
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      const newCoords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };

      setCurrentCoords(newCoords);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCoords));

      setHasPermission(true);
      setIsFallbackMode(false);
      fetchData(newCoords);

      if (hasPermission) {
        setShowToast({ message: "Updated to current live location.", type: 'info' });
        setTimeout(() => setShowToast(null), 3000);
      }
    };

    const errorHandler = (error: GeolocationPositionError) => {
      let msg = "Unable to retrieve location.";
      if (error.code === 1) msg = "Location permission denied.";
      if (error.code === 3) msg = "Location request timed out.";
      handleLocationError(msg);
    };

    navigator.geolocation.getCurrentPosition(
      successHandler,
      (error) => {
        if (error.code !== 1) {
          navigator.geolocation.getCurrentPosition(
            successHandler,
            errorHandler,
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
          );
        } else {
          errorHandler(error);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [fetchData, handleLocationError, hasPermission]);

  const handleLocationSelect = useCallback(async (lat: number, lon: number) => {
    const newCoords = { lat, lon };
    setCurrentCoords(newCoords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCoords));
    setHasPermission(true);
    setIsFallbackMode(false);
    fetchData(newCoords);
  }, [fetchData]);

  const openInfo = (key: keyof typeof POLLUTANT_INFO) => {
    setInfoModal({
      isOpen: true,
      title: POLLUTANT_INFO[key].title,
      content: POLLUTANT_INFO[key].content
    });
  };

  useEffect(() => {
    if (!hasPermission) return;
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing data...");
      fetchData(currentCoords);
    }, 60000);
    return () => clearInterval(intervalId);
  }, [hasPermission, currentCoords, fetchData]);

  if (showIntro) {
    return <IntroAnimation onComplete={() => setShowIntro(false)} />;
  }

  if (!hasPermission) {
    return <PermissionScreen onGrant={handleLocationGrant} isLoading={loadingState === LoadingState.LOADING} />;
  }

  const aqiStatus = data?.air ? getAQIStatus(data.air.aqi_us) : { text: "", color: "", border: "border-slate-500" };
  const today = new Date();
  const dateString = today.toLocaleDateString(language === 'en' ? 'en-US' : language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden relative">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-600/20 rounded-full blur-[80px] md:blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-600/20 rounded-full blur-[80px] md:blur-[100px] translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Popups and Modals */}
      {data && <AlertBanner data={data.air} settings={settings} timestamp={data.timestamp} />}

      <InfoModal
        isOpen={infoModal.isOpen}
        onClose={() => setInfoModal({ ...infoModal, isOpen: false })}
        title={infoModal.title}
        content={infoModal.content}
      />

      <CalendarHistory
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        coords={currentCoords}
        locationName={data?.weather.location_name || 'Current Location'}
        currentAQI={data?.air.aqi_us || 75}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={updateSettings}
      />

      <TutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 ${showToast.type === 'error' ? 'bg-red-500/90' : 'bg-slate-800/90 border border-slate-600'}`}>
            <AlertCircle size={18} className={showToast.type === 'error' ? 'text-white' : 'text-yellow-400'} />
            <span className="text-sm font-medium">{showToast.message}</span>
          </div>
        </div>
      )}

      {showAnalysis && data && (
        <AnalysisModal
          isOpen={showAnalysis}
          onClose={() => setShowAnalysis(false)}
          currentLocation={data.weather.location_name}
          currentCoords={currentCoords}
        />
      )}

      <div className={`relative z-10 container max-w-[1600px] mx-auto p-3 md:p-6 lg:p-8 ${(data?.air?.aqi ?? 0) >= 4 ? 'mt-4 md:mt-12' : ''}`}>

        <header className="relative z-[1000] flex flex-col xl:flex-row justify-between items-center mb-6 md:mb-8 glass-panel p-4 md:p-6 rounded-2xl gap-4 md:gap-6">
          <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-start">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="AirSense Pro" className="w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-lg shadow-blue-500/20 object-cover" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{t.appName}</h1>
                <p className="text-[10px] md:text-xs text-slate-400 tracking-wider uppercase">{t.realTimeAirQuality}</p>
              </div>
            </div>

            {/* Mobile Status Indicator */}
            <div className="xl:hidden flex flex-col items-end">
              <div className="text-xs text-slate-400 flex items-center justify-end gap-1">
                {isFallbackMode ? <MapPin size={10} className="text-yellow-500" /> : <Navigation size={10} className="text-blue-500" />}
                <span className="text-[10px]">{isFallbackMode ? t.defaultLocation : t.gps}</span>
              </div>
              <div className="font-semibold text-sm flex items-center gap-2 justify-end">
                <span className="truncate max-w-[120px]" title={data?.weather.location_name}>
                  {data?.weather.location_name || "Loading..."}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isFallbackMode ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
              </div>
            </div>
          </div>

          <div className="w-full xl:flex-1 flex justify-center order-2 min-h-[44px] md:min-h-[48px]">
            <SearchBar onLocationSelect={handleLocationSelect} />
          </div>

          <div className="flex items-center gap-2 md:gap-4 w-full xl:w-auto justify-between xl:justify-end order-3">
            <div className="flex gap-2 md:gap-3 flex-1 xl:flex-none justify-center xl:justify-end">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2.5 md:p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-white/5 flex items-center gap-2"
                title="Settings"
              >
                <Settings size={18} />
              </button>

              <button
                onClick={() => setShowTutorial(true)}
                className="p-2.5 md:p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-white/5 flex items-center gap-2"
                title="Help & Tutorial"
              >
                <HelpCircle size={18} />
              </button>

              {/* Language Selector */}
              <LanguageSelector compact />

              <button
                onClick={() => setShowCalendar(true)}
                className="p-2.5 md:p-3 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-xl transition-all border border-purple-500/30 flex items-center gap-2"
                title="Date Lookup"
              >
                <Calendar size={18} />
              </button>

              <button
                onClick={() => setShowAnalysis(true)}
                className="p-2.5 md:p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-white/5 shadow-lg flex items-center gap-2"
                title="View Analysis & History"
              >
                <BarChart3 size={18} />
                <span className="hidden lg:inline text-sm font-medium">{t.analysis}</span>
              </button>

              <button
                onClick={handleLocationGrant}
                disabled={loadingState === LoadingState.LOADING}
                className="p-2.5 md:p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 group"
                title="Get My Live Location"
              >
                {loadingState === LoadingState.LOADING ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <LocateFixed size={18} className="group-hover:scale-110 transition-transform" />
                )}
                <span className="hidden lg:inline text-sm font-medium">{t.locateMe}</span>
              </button>
            </div>

            <div className="text-right pl-2 border-l border-white/10 hidden xl:block">
              <div className="text-sm text-slate-400 flex items-center justify-end gap-1">
                {isFallbackMode ? (
                  <>
                    <MapPin size={12} className="text-yellow-500" />
                    {t.defaultLocation}
                  </>
                ) : (
                  <>
                    <Navigation size={12} className="text-blue-500" />
                    {t.gps} / {t.liveData}
                  </>
                )}
              </div>
              <div className="font-semibold text-lg flex items-center gap-2 justify-end">
                <span className="truncate max-w-[200px] md:max-w-[300px]" title={data?.weather.location_name}>
                  {data?.weather.location_name || "Loading..."}
                </span>
                <span className={`w-2 h-2 rounded-full animate-pulse ${isFallbackMode ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
              </div>
            </div>
          </div>
        </header>

        {loadingState === LoadingState.LOADING && !data && (
          <div className="h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
              <div className={`glass-panel p-4 md:p-6 rounded-xl border-l-4 ${aqiStatus.border} relative`}>
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div>
                    <p className="text-slate-400 text-xs uppercase flex flex-col">
                      <span>{t.airQualityIndex}</span>
                      <span className="text-[10px] text-slate-500 normal-case mt-0.5">{dateString}</span>
                    </p>
                    <h2 className="text-4xl md:text-5xl font-bold mt-1">
                      <AnimatedCounter value={data.air.aqi_us} />
                    </h2>
                  </div>
                  {/* Health Status Badge */}
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${data.air.aqi_us <= 50 ? 'bg-green-500/20 text-green-400' :
                    data.air.aqi_us <= 100 ? 'bg-yellow-500/20 text-yellow-400' :
                      data.air.aqi_us <= 150 ? 'bg-orange-500/20 text-orange-400' :
                        data.air.aqi_us <= 200 ? 'bg-red-500/20 text-red-400' :
                          'bg-purple-500/20 text-purple-400'
                    }`}>
                    {aqiStatus.text}
                  </div>
                </div>

                {/* User-friendly health message */}
                <div className={`text-xs md:text-sm mb-3 p-2 rounded-lg ${data.air.aqi_us <= 50 ? 'bg-green-500/10 text-green-300' :
                  data.air.aqi_us <= 100 ? 'bg-yellow-500/10 text-yellow-300' :
                    data.air.aqi_us <= 150 ? 'bg-orange-500/10 text-orange-300' :
                      data.air.aqi_us <= 200 ? 'bg-red-500/10 text-red-300' :
                        'bg-purple-500/10 text-purple-300'
                  }`}>
                  {data.air.aqi_us <= 50 && t.healthMsgGood}
                  {data.air.aqi_us > 50 && data.air.aqi_us <= 100 && t.healthMsgModerate}
                  {data.air.aqi_us > 100 && data.air.aqi_us <= 150 && t.healthMsgSensitive}
                  {data.air.aqi_us > 150 && data.air.aqi_us <= 200 && t.healthMsgUnhealthy}
                  {data.air.aqi_us > 200 && t.healthMsgHazardous}
                </div>

                {/* AQI Progress Bar */}
                <div className="relative h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-500 via-yellow-400 via-red-500 to-purple-800"></div>
                  <div className="absolute top-0 bottom-0 right-0 bg-slate-700 transition-all duration-1000" style={{ width: `${Math.max(0, 100 - (data.air.aqi_us / 500) * 100)}%` }}></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>{t.good}</span>
                  <span>{t.moderate}</span>
                  <span>{t.unhealthy}</span>
                  <span>{t.hazardous}</span>
                </div>

                {/* Data freshness indicator */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] text-slate-500">{t.liveData} • {data.air.data_source || 'IQAir'}</span>
                  </div>
                  <span className="text-[9px] text-slate-500">{t.updatedNow}</span>
                </div>
              </div>


              <DailyForecastCard forecast={data.forecast} currentTemp={data.weather.temp} />

              <div className="glass-panel p-4 md:p-6 rounded-xl border-l-4 border-cyan-500 relative group">
                <button onClick={() => openInfo('humidity')} className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all">
                  <Info size={16} />
                </button>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-slate-400 text-xs uppercase mb-1">{t.weatherConditions}</p>
                    <div className="flex items-end gap-2">
                      <h2 className="text-3xl md:text-4xl font-bold">{data.weather.humidity}%</h2>
                      <span className="text-xs text-slate-400 mb-1">{t.humidity}</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Wind size={14} className="text-cyan-400" />
                        <span>{t.wind}: <strong>{data.weather.wind_speed} m/s</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Gauge size={14} className="text-cyan-400" />
                        <span>{t.pressure}: <strong>{data.weather.pressure} hPa</strong></span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${(data.weather.uvi || 0) <= 2 ? 'text-green-400' :
                        (data.weather.uvi || 0) <= 5 ? 'text-yellow-400' :
                          (data.weather.uvi || 0) <= 7 ? 'text-orange-400' :
                            (data.weather.uvi || 0) <= 10 ? 'text-red-400' : 'text-purple-400'
                        }`}>
                        <Sun size={14} />
                        <span>UV Index: <strong>{(data.weather.uvi || 0).toFixed(1)}</strong>
                          <span className="text-slate-500 ml-1">
                            ({(data.weather.uvi || 0) <= 2 ? 'Low' :
                              (data.weather.uvi || 0) <= 5 ? 'Moderate' :
                                (data.weather.uvi || 0) <= 7 ? 'High' :
                                  (data.weather.uvi || 0) <= 10 ? 'Very High' : 'Extreme'})
                          </span>
                        </span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${(data.weather.visibility || 0) >= 10000 ? 'text-green-400' :
                        (data.weather.visibility || 0) >= 5000 ? 'text-yellow-400' :
                          (data.weather.visibility || 0) >= 1000 ? 'text-orange-400' : 'text-red-400'
                        }`}>
                        <Eye size={14} />
                        <span>Visibility: <strong>{((data.weather.visibility || 10000) / 1000).toFixed(1)} km</strong>
                          <span className="text-slate-500 ml-1">
                            ({(data.weather.visibility || 0) >= 10000 ? 'Clear' :
                              (data.weather.visibility || 0) >= 5000 ? 'Good' :
                                (data.weather.visibility || 0) >= 1000 ? 'Moderate' : 'Poor'})
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <Droplets size={32} className="text-cyan-400" />
                    <span className="text-[9px] text-slate-500 mt-1">
                      {data.weather.humidity < 30 ? t.dry :
                        data.weather.humidity < 60 ? t.comfort : t.humid}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-4 md:p-6 rounded-xl border-l-4 border-purple-500 relative group">
                <button onClick={() => openInfo('pm')} className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all">
                  <Info size={16} />
                </button>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-slate-400 text-xs uppercase">{t.particulateMatter}</p>
                  <div className={`px-2 py-0.5 rounded text-[9px] font-bold ${data.air.pm2_5 <= 12 ? 'bg-green-500/20 text-green-400' :
                    data.air.pm2_5 <= 35 ? 'bg-yellow-500/20 text-yellow-400' :
                      data.air.pm2_5 <= 55 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                    }`}>
                    {data.air.pm2_5 <= 12 ? t.good :
                      data.air.pm2_5 <= 35 ? t.moderate :
                        data.air.pm2_5 <= 55 ? t.unhealthy : t.veryUnhealthy}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg border ${data.air.pm2_5 <= 12 ? 'bg-green-500/10 border-green-500/20' :
                    data.air.pm2_5 <= 35 ? 'bg-yellow-500/10 border-yellow-500/20' :
                      data.air.pm2_5 <= 55 ? 'bg-orange-500/10 border-orange-500/20' :
                        'bg-red-500/10 border-red-500/20'
                    }`}>
                    <span className="text-[10px] text-slate-400 block">{t.fine}</span>
                    <span className="text-2xl md:text-3xl font-bold">{Math.round(data.air.pm2_5)}</span>
                    <span className="text-[9px] text-slate-500 block">µg/m³</span>
                  </div>
                  <div className={`p-3 rounded-lg border ${data.air.pm10 <= 54 ? 'bg-green-500/10 border-green-500/20' :
                    data.air.pm10 <= 154 ? 'bg-yellow-500/10 border-yellow-500/20' :
                      data.air.pm10 <= 254 ? 'bg-orange-500/10 border-orange-500/20' :
                        'bg-red-500/10 border-red-500/20'
                    }`}>
                    <span className="text-[10px] text-slate-400 block">{t.coarse}</span>
                    <span className="text-2xl md:text-3xl font-bold">{Math.round(data.air.pm10)}</span>
                    <span className="text-[9px] text-slate-500 block">µg/m³</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 text-center mt-2">
                  {data.air.pm2_5 <= 12 ? t.excellentAir :
                    data.air.pm2_5 <= 35 ? t.acceptableAir :
                      data.air.pm2_5 <= 55 ? t.wearMask :
                        t.avoidOutdoor}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
              <div className="xl:col-span-2 space-y-6 md:space-y-8">
                <div className="glass-panel p-1 rounded-2xl h-[350px] md:h-[450px] lg:h-[550px] shadow-2xl relative overflow-hidden group">
                  <MapComponent coords={currentCoords} onLocationSelect={handleLocationSelect} />
                </div>
                <div className="glass-panel p-6 rounded-2xl h-[350px]">
                  <AQITrendChart coords={currentCoords} />
                </div>
                <div className="glass-panel p-6 rounded-2xl">
                  <IndianCities onSelectCity={handleLocationSelect} />
                </div>
              </div>

              <div className="space-y-6 md:space-y-8">
                <Recommendations aqi={data.air.aqi_us} pollutants={{ pm25: data.air.pm2_5, pm10: data.air.pm10, co: data.air.co, no2: data.air.no2, o3: data.air.o3, so2: data.air.so2 }} />
                <AQIForecast forecast={data.aqiForecast} currentAQI={data.air.aqi_us} weather={{ temp: data.weather.temp, humidity: data.weather.humidity }} />
                <div className="glass-panel p-6 rounded-2xl h-[450px]">
                  <MLInsights data={data.air} weather={{ temp: data.weather.temp, humidity: data.weather.humidity }} />
                </div>
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge size={16} className="text-green-400" />
                      {t.gasLevels}
                    </div>
                    <span className="text-[10px] text-purple-400 font-normal normal-case flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                      {t.aiPowered}
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <button onClick={() => openInfo('co')} className="absolute -top-1 right-0 text-slate-600 hover:text-white z-10"><Info size={12} /></button>
                      <GasGauge label="CO" value={data.air.co} unit="µg/m³" max={15000} goodLimit={4400} poorLimit={9400} />
                    </div>
                    <div className="relative">
                      <button onClick={() => openInfo('no2')} className="absolute -top-1 right-0 text-slate-600 hover:text-white z-10"><Info size={12} /></button>
                      <GasGauge label="NO2" value={data.air.no2} unit="µg/m³" max={400} goodLimit={40} poorLimit={200} />
                    </div>
                    <div className="relative">
                      <button onClick={() => openInfo('o3')} className="absolute -top-1 right-0 text-slate-600 hover:text-white z-10"><Info size={12} /></button>
                      <GasGauge label="O3" value={data.air.o3} unit="µg/m³" max={300} goodLimit={60} poorLimit={140} />
                    </div>
                    <div className="relative">
                      <button onClick={() => openInfo('so2')} className="absolute -top-1 right-0 text-slate-600 hover:text-white z-10"><Info size={12} /></button>
                      <GasGauge label="SO2" value={data.air.so2} unit="µg/m³" max={500} goodLimit={20} poorLimit={350} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}

        <Chatbot locationData={data} />
      </div>
    </div>
  );
};

// Wrap with LanguageProvider for multi-language support
const AppWithLanguage: React.FC = () => (
  <LanguageProvider>
    <App />
  </LanguageProvider>
);

export default AppWithLanguage;
