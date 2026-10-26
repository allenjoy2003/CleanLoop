import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  CurrencyRupeeIcon, SparklesIcon, ScaleIcon,
  InformationCircleIcon, ArrowRightIcon, TruckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ScrapRatesPage = () => {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Smart Price Estimator state
  const [estText, setEstText] = useState('');
  const [estResult, setEstResult] = useState(null);
  const [estLoading, setEstLoading] = useState(false);

  const isMl = i18n.language === 'ml';

  useEffect(() => {
    api.get('/scrap/categories/')
      .then(res => {
        setCategories(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.warn(err);
        setLoading(false);
      });
  }, []);

  const handleEstimate = async (e) => {
    e?.preventDefault();
    if (!estText.trim() || estLoading) return;
    setEstLoading(true);

    try {
      const res = await api.post('/ai/estimate-scrap/', {
        description: estText
      });
      setEstResult(res.data);
    } catch (err) {
      toast.error("Failed to estimate scrap price.");
    } finally {
      setEstLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold">
          <CurrencyRupeeIcon className="w-4 h-4" />
          <span>Live Kochi Wholesale Scrap Benchmarks</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 dark:text-white">
          {isMl ? "ഇന്നത്തെ ആക്രി വില നിരക്കുകൾ" : "Today's Scrap Rate Card (Kochi)"}
        </h1>
        <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base">
          {isMl
            ? "വീട്ടുപടിക്കൽ ഡിജിറ്റൽ ത്രാസ് ഉപയോഗിച്ച് അളന്ന് കൃത്യമായ വില നൽകുന്നു. ആക്രി വിൽക്കാൻ ഇപ്പോൾ തന്നെ ബുക്ക് ചെയ്യുക."
            : "Transparent per-kg rates for recyclable paper, metals, batteries, and e-waste. Doorstep collection with instant wallet payout."
          }
        </p>
      </div>

      {/* Smart Scrap Price Estimator (AI Feature) */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#D4A017]/40 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D4A017] text-white flex items-center justify-center shadow-md">
            <SparklesIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-lg text-stone-900 dark:text-white">
              {isMl ? "സ്മാർട്ട് ആക്രി വില കണക്കുകൂട്ടൽ" : "Smart Scrap Price Estimator"}
            </h3>
            <p className="text-xs text-stone-500">
              Describe what you have: e.g. "2 bundles of old Malayalam newspapers, 10 Amazon delivery boxes, and 2 kg copper wires"
            </p>
          </div>
        </div>

        <form onSubmit={handleEstimate} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={estText}
            onChange={(e) => setEstText(e.target.value)}
            placeholder="Describe your scrap items..."
            className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-[#D4A017] outline-hidden"
          />
          <button
            type="submit"
            disabled={estLoading || !estText.trim()}
            className="px-6 py-3 rounded-2xl bg-[#D4A017] hover:bg-amber-500 text-stone-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 glow-gold"
          >
            {estLoading ? "Estimating..." : "Estimate Payout"}
          </button>
        </form>

        {estResult && (
          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-[#D4A017]/30 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-700">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-500">
                Estimated Total Payout:
              </span>
              <span className="text-2xl font-black text-[#1F5D3A] dark:text-emerald-400">
                {estResult.total_estimated_payout_inr}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {estResult.items?.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 space-y-1">
                  <div className="flex justify-between font-bold text-xs">
                    <span>{isMl ? item.category_ml : item.category}</span>
                    <span className="text-amber-600">₹{item.rate_per_kg}/kg</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span>Range: {item.estimated_weight_range_kg}</span>
                    <span className="font-semibold text-emerald-600">{item.estimated_payout_range_inr}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-stone-500 italic">
                {estResult.disclaimer}
              </p>
              <Link
                to="/sell-scrap"
                className="px-5 py-2 rounded-xl bg-[#1F5D3A] text-white font-bold text-xs shadow-xs hover:bg-[#16472c] transition-all"
              >
                Proceed to Book Scrap Pickup
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Live Rate Card Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-stone-900 dark:text-white">
            Official Per-Kg Rates
          </h2>
          <span className="text-xs text-stone-500">
            Rates updated daily by Clean Loop Municipal Admin
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="glass-card rounded-3xl p-6 border border-stone-200 dark:border-stone-700/80 shadow-md hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-stone-900 dark:text-white">
                    {isMl ? cat.name_ml : cat.name_en}
                  </h3>
                  <span className="text-2xl font-black text-[#1F5D3A] dark:text-emerald-400">
                    ₹{cat.current_rate_per_kg}
                    <span className="text-xs text-stone-500 font-medium">/kg</span>
                  </span>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {isMl ? cat.description_ml : cat.description_en}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs">
                <span className="text-stone-500">
                  Min. Pickup: <strong>{cat.min_weight_kg} kg</strong>
                </span>
                <Link
                  to={`/sell-scrap?category=${cat.id}`}
                  className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Sell This</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to action */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#1F5D3A] to-[#144427] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-2xl font-black">Got bulk scrap or office e-waste?</h3>
          <p className="text-sm text-emerald-100">Schedule our heavy vehicle fleet with digital platform scales across Kochi.</p>
        </div>
        <Link
          to="/sell-scrap"
          className="px-6 py-3.5 rounded-2xl bg-[#D4A017] hover:bg-amber-400 text-stone-950 font-black text-sm shadow-xl transition-all whitespace-nowrap glow-gold"
        >
          Book Doorstep Scrap Pickup
        </Link>
      </div>

    </div>
  );
};

export default ScrapRatesPage;
