import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { MapPinIcon, CheckBadgeIcon, ClockIcon } from '@heroicons/react/24/outline';

const zoneIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const ServiceAreasPage = () => {
  const { t, i18n } = useTranslation();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMl = i18n.language === 'ml';

  useEffect(() => {
    api.get('/accounts/zones/')
      .then(res => {
        setZones(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.warn(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 dark:text-white">
          {isMl ? "ക്ലീൻ ലൂപ്പ് സേവന മേഖലകൾ (കൊച്ചി)" : "Clean Loop Service Zones in Kochi"}
        </h1>
        <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base">
          {isMl
            ? "കൊച്ചി കോർപ്പറേഷനിലും തൃക്കാക്കര, കളമശ്ശേരി നഗരസഭകളിലുമുള്ള ഞങ്ങളുടെ സജീവ സേവന മേഖലകൾ."
            : "Doorstep waste pickup and certified scrap collection operational across major Kochi wards & municipal zones."
          }
        </p>
      </div>

      {/* Leaflet Service Map */}
      <div className="h-[420px] sm:h-[480px] w-full rounded-3xl overflow-hidden border border-stone-300 dark:border-stone-700 shadow-xl relative z-0">
        <MapContainer
          center={[9.9816, 76.2799]}
          zoom={12}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {zones.map((zone) => (
            <React.Fragment key={zone.id}>
              <Marker
                position={[Number(zone.center_lat), Number(zone.center_lng)]}
                icon={zoneIcon}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <p className="font-bold text-emerald-800 text-sm">
                      {isMl ? zone.name_ml : zone.name_en}
                    </p>
                    <p className="text-stone-600">{zone.ward_numbers}</p>
                    <p className="text-emerald-700 font-bold">✓ Daily Morning Fleet Active</p>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[Number(zone.center_lat), Number(zone.center_lng)]}
                radius={2200}
                pathOptions={{
                  fillColor: '#1F5D3A',
                  fillOpacity: 0.15,
                  color: '#1F5D3A',
                  weight: 2
                }}
              />
            </React.Fragment>
          ))}
        </MapContainer>
      </div>

      {/* Zone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="glass-card p-6 rounded-3xl border border-emerald-500/20 shadow-md hover:shadow-xl transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Operational Zone
              </span>
              <CheckBadgeIcon className="w-5 h-5 text-emerald-600" />
            </div>

            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              {isMl ? zone.name_ml : zone.name_en}
            </h3>

            <p className="text-xs text-stone-600 dark:text-stone-300">
              <strong>Coverage:</strong> {zone.ward_numbers}
            </p>

            <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4 text-emerald-600" /> 07:00 AM - 11:30 AM
              </span>
              <span className="text-emerald-700 font-semibold">Active Fleet</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ServiceAreasPage;
