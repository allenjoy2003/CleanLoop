import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  SparklesIcon, ArrowTrendingUpIcon, ShieldCheckIcon,
  BellIcon, ShareIcon, TrophyIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ImpactDashboardPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [impactData, setImpactData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMl = i18n.language === 'ml';

  useEffect(() => {
    Promise.all([
      api.get('/impact/personal-impact/'),
      api.get('/impact/notifications/')
    ]).then(([impRes, notifRes]) => {
      setImpactData(impRes.data);
      setNotifications(notifRes.data.results || []);
      setLoading(false);
    }).catch(err => {
      console.warn(err);
      setLoading(false);
    });
  }, []);

  const handleShareCard = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Clean Loop Impact in Kochi',
        text: `I've saved ${impactData?.co2_saved_kg || 0}kg of CO2 and diverted ${impactData?.total_waste_diverted_kg || 0}kg of waste in Kochi with Clean Loop!`,
        url: window.location.href,
      }).catch(err => console.log('Share canceled'));
    } else {
      navigator.clipboard.writeText(`I've saved ${impactData?.co2_saved_kg || 0}kg of CO2 and diverted ${impactData?.total_waste_diverted_kg || 0}kg of waste in Kochi with Clean Loop!`);
      toast.success("Impact stats copied to clipboard!");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white">
            {isMl ? "എന്റെ പരിസ്ഥിതി സംഭാവന" : "My Personal Impact & Eco Metrics"}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            Tracking your household's waste diversion, scrap earnings, and verified CO2 footprint reduction in Kochi.
          </p>
        </div>

        <button
          onClick={handleShareCard}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 shadow-sm hover:bg-stone-50 transition-all"
        >
          <ShareIcon className="w-4 h-4 text-emerald-600" />
          <span>Share Impact Badge</span>
        </button>
      </div>

      {/* 4 Impact Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-3xl p-6 border border-emerald-500/20 shadow-lg space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Total Diverted from Dumps
          </span>
          <p className="text-3xl font-black text-[#1F5D3A] dark:text-white">
            {impactData?.total_waste_diverted_kg || 0} <span className="text-sm font-medium text-stone-500">kg</span>
          </p>
          <p className="text-xs text-stone-500">From {impactData?.pickups_count || 0} successful pickups</p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-emerald-500/20 shadow-lg space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Scrap Sold for Cash
          </span>
          <p className="text-3xl font-black text-[#D4A017]">
            ₹{impactData?.money_earned_inr || 0}
          </p>
          <p className="text-xs text-stone-500">{impactData?.scrap_recycled_kg || 0} kg raw scrap recycled</p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-emerald-500/20 shadow-lg space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
            CO2 Greenhouse Gas Avoided
          </span>
          <p className="text-3xl font-black text-teal-600 dark:text-teal-300">
            {impactData?.co2_saved_kg || 0} <span className="text-sm font-medium text-stone-500">kg</span>
          </p>
          <p className="text-xs text-stone-500">Factor: 1.85 kg CO2/kg recycled</p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-emerald-500/20 shadow-lg space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Trees-Equivalent Saved
          </span>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-300">
            {impactData?.trees_equivalent || 0} <span className="text-sm font-medium text-stone-500">trees</span>
          </p>
          <p className="text-xs text-stone-500">Urban green canopy equivalent</p>
        </div>
      </div>

      {/* Monthly Recharts Chart */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-700 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              6-Month Household Recycling Trend
            </h3>
            <p className="text-xs text-stone-500">Kilograms of waste segregated & CO2 saved</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Verified Data
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={impactData?.monthly_trend || []}>
              <defs>
                <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stop-color="#1F5D3A" stop-opacity={0.8}/>
                  <stop offset="95%" stop-color="#1F5D3A" stop-opacity={0}/>
                </linearGradient>
                <linearGradient id="colorSeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stop-color="#D4A017" stop-opacity={0.8}/>
                  <stop offset="95%" stop-color="#D4A017" stop-opacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#888888" fontSize={12} />
              <YAxis stroke="#888888" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1c1917',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Area type="monotone" dataKey="co2_saved" stroke="#1F5D3A" fillOpacity={1} fill="url(#colorCo2)" name="CO2 Saved (kg)" />
              <Area type="monotone" dataKey="segregated_kg" stroke="#D4A017" fillOpacity={1} fill="url(#colorSeg)" name="Segregated Waste (kg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Notifications Centre */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BellIcon className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-bold text-stone-900 dark:text-white">
            Notifications & Collection Alerts
          </h2>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                n.is_read
                  ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                  : 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-xs'
              }`}
            >
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                  {isMl ? n.title_ml : n.title_en}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  {isMl ? n.message_ml : n.message_en}
                </p>
                <span className="text-[10px] text-stone-400">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-xs text-stone-500 py-4 text-center">
              No new notifications.
            </p>
          )}
        </div>
      </div>

    </div>
  );
};

export default ImpactDashboardPage;
