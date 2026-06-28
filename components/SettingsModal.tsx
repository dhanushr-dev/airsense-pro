
import React, { useState } from 'react';
import { X, Settings, Volume2, VolumeX, Bell, AlertTriangle, Save, RotateCcw, Smartphone, Wind } from 'lucide-react';
import { UserSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [activeTab, setActiveTab] = useState<'notifications' | 'thresholds'>('notifications');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400">
              <Settings size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">App Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'notifications' ? 'border-blue-500 text-blue-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Bell size={16} /> Notifications
          </button>
          <button
            onClick={() => setActiveTab('thresholds')}
            className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'thresholds' ? 'border-blue-500 text-blue-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <AlertTriangle size={16} /> Alert Thresholds
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${localSettings.soundEnabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                    {localSettings.soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Sound Alerts</h3>
                    <p className="text-xs text-slate-400">Play a warning sound when thresholds are breached.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={localSettings.soundEnabled}
                    onChange={(e) => setLocalSettings({ ...localSettings, soundEnabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${localSettings.vibrationEnabled ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Vibration</h3>
                    <p className="text-xs text-slate-400">Vibrate device on critical alerts (mobile only).</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={localSettings.vibrationEnabled}
                    onChange={(e) => setLocalSettings({ ...localSettings, vibrationEnabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'thresholds' && (
            <div className="space-y-6">
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 items-start mb-4">
                <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-yellow-200/80">
                  Configure when the red alert banner appears. You can set the general AQI trigger or enable specific gas warnings.
                </p>
              </div>

              <div className="space-y-6">
                {/* AQI Slider */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">AQI Trigger (US Scale)</label>
                    <span className="text-sm font-bold text-blue-400">{localSettings.aqiThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={localSettings.aqiThreshold}
                    onChange={(e) => setLocalSettings({ ...localSettings, aqiThreshold: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Moderate (50)</span>
                    <span>Unhealthy (150)</span>
                    <span>Hazardous (300)</span>
                  </div>
                </div>

                {/* Specific Pollutant Toggle */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${localSettings.pollutantAlertsEnabled ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'}`}>
                      <Wind size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Specific Pollutant Alerts</h3>
                      <p className="text-xs text-slate-400">
                        Enable warnings for high PM2.5, CO, NO2, SO2, and O3 levels.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={localSettings.pollutantAlertsEnabled}
                      onChange={(e) => setLocalSettings({ ...localSettings, pollutantAlertsEnabled: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Conditional Sliders for Gases */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${localSettings.pollutantAlertsEnabled ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0 pointer-events-none'}`}>
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5 space-y-5">

                    {/* PM2.5 */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-slate-300">PM2.5 Threshold</label>
                        <span className="text-xs font-bold text-purple-400">{localSettings.pm25Threshold} µg/m³</span>
                      </div>
                      <input
                        type="range" min="10" max="100" step="5"
                        value={localSettings.pm25Threshold}
                        onChange={(e) => setLocalSettings({ ...localSettings, pm25Threshold: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>

                    {/* CO */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-slate-300">CO Threshold</label>
                        <span className="text-xs font-bold text-orange-400">{localSettings.coThreshold} µg/m³</span>
                      </div>
                      <input
                        type="range" min="1000" max="10000" step="500"
                        value={localSettings.coThreshold}
                        onChange={(e) => setLocalSettings({ ...localSettings, coThreshold: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>

                    {/* NO2 */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-slate-300">NO2 Threshold</label>
                        <span className="text-xs font-bold text-red-400">{localSettings.no2Threshold} µg/m³</span>
                      </div>
                      <input
                        type="range" min="10" max="200" step="10"
                        value={localSettings.no2Threshold}
                        onChange={(e) => setLocalSettings({ ...localSettings, no2Threshold: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>

                    {/* SO2 */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-slate-300">SO2 Threshold</label>
                        <span className="text-xs font-bold text-yellow-400">{localSettings.so2Threshold} µg/m³</span>
                      </div>
                      <input
                        type="range" min="5" max="300" step="5"
                        value={localSettings.so2Threshold}
                        onChange={(e) => setLocalSettings({ ...localSettings, so2Threshold: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                      />
                    </div>

                    {/* O3 */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs font-medium text-slate-300">O3 Threshold</label>
                        <span className="text-xs font-bold text-teal-400">{localSettings.o3Threshold} µg/m³</span>
                      </div>
                      <input
                        type="range" min="10" max="200" step="10"
                        value={localSettings.o3Threshold}
                        onChange={(e) => setLocalSettings({ ...localSettings, o3Threshold: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                      />
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-slate-950/50 flex justify-between items-center">
          <button
            onClick={handleReset}
            className="text-sm text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <RotateCcw size={16} /> Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Save size={18} /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
