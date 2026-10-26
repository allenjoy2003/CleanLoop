import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { MapPinIcon, CrosshairIcon } from 'lucide-react';

// Custom clean Leaflet marker icon
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to center map smoothly
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const LocationPickerMap = ({ 
  initialLat = 10.0159, 
  initialLng = 76.3419, 
  onLocationChange,
  showAddressSearch = true 
}) => {
  const [position, setPosition] = useState({ lat: initialLat, lng: initialLng });
  const [addressText, setAddressText] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const debounceTimer = useRef(null);

  // Reverse Geocoding with Nominatim (debounced & respects 1 req/sec policy)
  const reverseGeocode = (lat, lng) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
          headers: { 'Accept-Language': 'en' }
        });
        if (res.data && res.data.display_name) {
          setAddressText(res.data.display_name);
          if (onLocationChange) {
            onLocationChange({
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
              address: res.data.display_name,
              suburb: res.data.address?.suburb || res.data.address?.neighbourhood || res.data.address?.city_district || 'Kochi'
            });
          }
        }
      } catch (err) {
        console.warn("Reverse geocode failed:", err);
      }
    }, 800);
  };

  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    const newPos = marker.getLatLng();
    setPosition(newPos);
    reverseGeocode(newPos.lat, newPos.lng);
  };

  // Browser Geolocation API
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setPosition({ lat: newLat, lng: newLng });
        reverseGeocode(newLat, newLng);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        console.warn("Location permission denied or unavailable:", err);
        alert("Location permission denied. You can manually drag the pin to your doorstep on the map.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Map click listener component
  function MapEvents() {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
        >
          <CrosshairIcon className="w-4 h-4" />
          <span>{isLocating ? "Detecting GPS..." : "Use My Current Location"}</span>
        </button>

        <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
          💡 Click anywhere on the map or drag the marker to your precise doorstep pin.
        </p>
      </div>

      <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-stone-300 dark:border-stone-700 shadow-inner relative z-0">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <ChangeView center={[position.lat, position.lng]} zoom={14} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents />
          <Marker
            position={[position.lat, position.lng]}
            draggable={true}
            eventHandlers={{ dragend: handleMarkerDragEnd }}
            icon={customIcon}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-emerald-800">Your Doorstep Pin</p>
                <p>{addressText || `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {addressText && (
        <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 flex items-start gap-2">
          <MapPinIcon className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <span className="truncate">{addressText}</span>
        </div>
      )}
    </div>
  );
};

export default LocationPickerMap;
