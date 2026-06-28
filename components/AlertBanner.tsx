import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, X, Volume2 } from 'lucide-react';
import { AirQualityData, UserSettings } from '../types';
import { detectAnomaly } from '../services/ml';

interface AlertBannerProps {
  data: AirQualityData;
  settings: UserSettings;
  timestamp: number;
  historicalAvg?: number;
  historicalStdDev?: number;
}

const AlertBanner: React.FC<AlertBannerProps> = ({
  data,
  settings,
  timestamp,
  historicalAvg = 75,
  historicalStdDev = 25
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertLevel, setAlertLevel] = useState<'warning' | 'danger' | 'critical'>('warning');
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedRef = useRef<number>(0);

  // Play alert sound - louder and clearer
  const playAlertSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn("AudioContext not supported");
        return;
      }

      // Close any existing audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      // Create oscillator and gain node
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Use triangle wave for alert sound (clearer than sine)
      osc.type = 'triangle';

      const now = ctx.currentTime;

      // Two-tone alert beep pattern (2 beeps)
      // First beep
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(600, now + 0.15);
      // Second beep
      osc.frequency.setValueAtTime(800, now + 0.3);
      osc.frequency.setValueAtTime(600, now + 0.45);

      // Volume envelope
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.setValueAtTime(0.4, now + 0.15);
      gain.gain.setValueAtTime(0.1, now + 0.2);
      gain.gain.setValueAtTime(0.4, now + 0.3);
      gain.gain.setValueAtTime(0.4, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.start(now);
      osc.stop(now + 0.6);

      console.log("[AlertBanner] Playing sound");
    } catch (e) {
      console.error("Alert sound failed:", e);
    }
  };

  // Check for alerts
  useEffect(() => {
    const aqi = data.aqi_us;
    let shouldShow = false;
    let message = '';
    let level: 'warning' | 'danger' | 'critical' = 'warning';

    // Determine alert based on AQI level
    if (aqi >= 300) {
      level = 'critical';
      message = '🚨 Hazardous Air! Stay Indoors';
      shouldShow = true;
    } else if (aqi >= 200) {
      level = 'danger';
      message = '⚠️ Very Unhealthy - Avoid Outdoor Activities';
      shouldShow = true;
    } else if (aqi >= settings.aqiThreshold) {
      level = 'warning';
      message = `⚠️ AQI ${aqi} - Poor Air Quality`;
      shouldShow = true;
    } else if (settings.pollutantAlertsEnabled) {
      // Check individual pollutants
      const alerts: string[] = [];
      if (data.pm2_5 >= settings.pm25Threshold) alerts.push('PM2.5');
      if (data.co >= settings.coThreshold) alerts.push('CO');
      if (data.no2 >= settings.no2Threshold) alerts.push('NO₂');
      if (data.o3 >= settings.o3Threshold) alerts.push('O₃');
      if (data.so2 >= settings.so2Threshold) alerts.push('SO₂');

      if (alerts.length > 0) {
        level = 'warning';
        message = `⚠️ High ${alerts.join(', ')} Levels`;
        shouldShow = true;
      } else {
        // Check for ML anomaly
        const anomaly = detectAnomaly(aqi, historicalAvg, historicalStdDev);
        if (anomaly.isAnomaly && anomaly.severity !== 'normal') {
          level = 'warning';
          message = `🔍 Unusual Pattern: ${anomaly.possibleCause}`;
          shouldShow = true;
        }
      }
    }

    // Update state
    setAlertLevel(level);
    setAlertMessage(message);
    setIsVisible(shouldShow);

    // Play sound and vibrate if showing alert and timestamp changed
    if (shouldShow && timestamp !== lastPlayedRef.current) {
      lastPlayedRef.current = timestamp;

      if (settings.soundEnabled) {
        // Small delay to ensure user interaction has occurred (browser requirement)
        setTimeout(() => {
          playAlertSound();
        }, 100);
      }

      if (settings.vibrationEnabled && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [data, settings, timestamp, historicalAvg, historicalStdDev]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setIsVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, timestamp]);

  const getBgColor = () => {
    switch (alertLevel) {
      case 'critical': return 'bg-red-600';
      case 'danger': return 'bg-orange-500';
      default: return 'bg-amber-500';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-0 left-0 w-full ${getBgColor()} text-white shadow-lg z-[100] cursor-pointer animate-pulse`}
      onClick={() => setIsVisible(false)}
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle size={22} className="shrink-0 animate-bounce" />
          <span className="font-semibold text-sm sm:text-base">{alertMessage}</span>
          {settings.soundEnabled && <Volume2 size={16} className="opacity-70" />}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
          className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default AlertBanner;
