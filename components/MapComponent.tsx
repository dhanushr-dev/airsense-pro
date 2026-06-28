
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { Coordinates } from '../types';
import { API_KEY_WEATHER } from '../constants';

// Fix for default Leaflet marker icons in React
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

interface MapComponentProps {
  coords: Coordinates;
  onLocationSelect: (lat: number, lon: number) => void;
}

const LocationMarker = ({ coords }: { coords: Coordinates }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([coords.lat, coords.lon], 13);
  }, [coords, map]);
  return null;
}

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    // This fixes the "white map" issue by forcing Leaflet to recalculate container size
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

const MapEvents = ({ onSelect }: { onSelect: (lat: number, lon: number) => void }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ coords, onLocationSelect }) => {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden relative z-0 min-h-[300px] md:min-h-[400px]">
      <MapContainer
        center={[coords.lat, coords.lon]}
        zoom={10}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Standard Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Dark Mode">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay name="Temperature Heatmap">
            <TileLayer
              url={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY_WEATHER}`}
              attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Wind Speed">
            <TileLayer
              url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY_WEATHER}`}
              attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Precipitation">
            <TileLayer
              url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY_WEATHER}`}
              attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Clouds">
            <TileLayer
              url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY_WEATHER}`}
              attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Atmospheric Pressure">
            <TileLayer
              url={`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY_WEATHER}`}
              attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
            />
          </LayersControl.Overlay>
        </LayersControl>

        <Marker position={[coords.lat, coords.lon]} icon={icon}>
          <Popup>
            Selected Location <br /> Lat: {coords.lat.toFixed(4)}, Lon: {coords.lon.toFixed(4)}
          </Popup>
        </Marker>
        <LocationMarker coords={coords} />
        <MapResizer />
        <MapEvents onSelect={onLocationSelect} />
      </MapContainer>

      <div className="absolute bottom-5 left-5 z-[400] bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-lg border border-white/10 shadow-xl pointer-events-none max-w-[220px]">
        <p className="font-bold text-xs uppercase tracking-wider mb-1 text-blue-400">Map Layers</p>
        <p className="text-[10px] text-slate-300 leading-relaxed">
          Hover over the layers icon (top-right) to toggle Wind, Temperature, and other overlays.
        </p>
      </div>
    </div>
  );
};

export default MapComponent;
