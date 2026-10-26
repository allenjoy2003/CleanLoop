import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LocationPickerMap from '../components/LocationPickerMap';
import toast from 'react-hot-toast';
import {
  CurrencyRupeeIcon, SparklesIcon, ScaleIcon,
  CheckCircleIcon, PlusIcon, TrashIcon
} from '@heroicons/react/24/outline';

const SellScrapPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedCat = searchParams.get('category');

  const [categories, setCategories] = useState([]);
  const [selectedItems, setSelectedItems] = useState([
    { category_id: preSelectedCat || '', estimated_weight_kg: 5.0 }
  ]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  
  // Custom new address map
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddressText, setNewAddressText] = useState('');
  const [newLat, setNewLat] = useState(10.0159);
  const [newLng, setNewLng] = useState(76.3419);

  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeWindow, setTimeWindow] = useState("10:00 AM - 01:00 PM");
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const isMl = i18n.language === 'ml';

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/sell-scrap' } });
      return;
    }

    api.get('/scrap/categories/')
      .then(res => {
        setCategories(res.data);
        if (preSelectedCat) {
          setSelectedItems([{ category_id: preSelectedCat, estimated_weight_kg: 5.0 }]);
        } else if (res.data.length > 0) {
          setSelectedItems([{ category_id: res.data[0].id, estimated_weight_kg: 5.0 }]);
        }
      })
      .catch(err => console.warn(err));

    api.get('/accounts/addresses/').then(res => {
      setAddresses(res.data);
      if (res.data.length > 0) {
        const def = res.data.find(a => a.is_default) || res.data[0];
        setSelectedAddressId(def.id);
      } else {
        setShowNewAddress(true);
      }
    }).catch(err => console.warn(err));
  }, [user, navigate, preSelectedCat]);

  const addItemRow = () => {
    if (categories.length > 0) {
      setSelectedItems(prev => [...prev, { category_id: categories[0].id, estimated_weight_kg: 5.0 }]);
    }
  };

  const removeItemRow = (idx) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx, field, value) => {
    setSelectedItems(prev => {
      const copy = [...prev];
      copy[idx][field] = value;
      return copy;
    });
  };

  // Compute live estimated payout
  const totalEstimatedPayout = selectedItems.reduce((sum, item) => {
    const cat = categories.find(c => c.id === Number(item.category_id));
    if (!cat) return sum;
    return sum + (Number(item.estimated_weight_kg || 0) * Number(cat.current_rate_per_kg || 0));
  }, 0);

  const handleLocationPicked = (loc) => {
    setNewLat(loc.lat);
    setNewLng(loc.lng);
    setNewAddressText(loc.address);
  };

  const handleScrapSubmit = async (e) => {
    e?.preventDefault();
    if (selectedItems.length === 0) {
      toast.error("Please add at least one scrap category.");
      return;
    }

    setLoading(true);

    try {
      let finalAddressId = selectedAddressId;
      if (showNewAddress || !finalAddressId) {
        if (!newAddressText.trim()) {
          toast.error("Please provide doorstep address.");
          setLoading(false);
          return;
        }
        const addrRes = await api.post('/accounts/addresses/', {
          label: 'home',
          full_address: newAddressText,
          latitude: newLat,
          longitude: newLng,
          is_default: addresses.length === 0
        });
        finalAddressId = addrRes.data.id;
      }

      const payload = {
        address: finalAddressId,
        pickup_date: pickupDate,
        preferred_time_window: timeWindow,
        notes: notes,
        items: selectedItems.map(it => ({
          category_id: Number(it.category_id),
          estimated_weight_kg: Number(it.estimated_weight_kg)
        }))
      };

      const res = await api.post('/scrap/requests/', payload);
      toast.success("Doorstep Scrap Pickup Scheduled!");
      navigate('/wallet');
    } catch (err) {
      toast.error("Failed to request scrap pickup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold">
          <CurrencyRupeeIcon className="w-4 h-4" />
          <span>Doorstep Weighing with Calibrated Digital Scales</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white">
          {isMl ? "ആക്രി വിൽക്കുക - വീട്ടുപടിക്കൽ പിക്കപ്പ്" : "Sell Scrap - Doorstep Pickup"}
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Sell old newspapers, delivery boxes, metals, wiring, appliances, and batteries for instant cash payout to your Clean Loop wallet.
        </p>
      </div>

      <form onSubmit={handleScrapSubmit} className="space-y-8">
        
        {/* Scrap Items & Weight Calculator */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#D4A017]/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <ScaleIcon className="w-5 h-5 text-[#D4A017]" />
              <span>Select Scrap Items & Approx Weights</span>
            </h3>

            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/20 transition-colors"
            >
              <PlusIcon className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {selectedItems.map((item, idx) => {
              const currentCat = categories.find(c => c.id === Number(item.category_id));
              const subtotal = (Number(item.estimated_weight_kg || 0) * Number(currentCat?.current_rate_per_kg || 0)).toFixed(2);

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center shadow-xs"
                >
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                      Scrap Category
                    </label>
                    <select
                      value={item.category_id}
                      onChange={(e) => updateItemRow(idx, 'category_id', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-semibold"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {isMl ? c.name_ml : c.name_en} (₹{c.current_rate_per_kg}/kg)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                      Approx Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={item.estimated_weight_kg}
                      onChange={(e) => updateItemRow(idx, 'estimated_weight_kg', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-3 text-right">
                    <span className="block text-[10px] uppercase font-bold text-stone-500">
                      Est. Payout
                    </span>
                    <span className="text-base font-black text-[#1F5D3A] dark:text-emerald-400">
                      ₹{subtotal}
                    </span>
                  </div>

                  <div className="sm:col-span-1 text-center">
                    {selectedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Estimated Payout Card */}
          <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-[#D4A017]/40 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300">
              Estimated Total Doorstep Payout:
            </span>
            <span className="text-2xl font-black text-[#1F5D3A] dark:text-emerald-400">
              ₹{totalEstimatedPayout.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Address Selection */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              Doorstep Pickup Address
            </h3>
            <button
              type="button"
              onClick={() => setShowNewAddress(!showNewAddress)}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              {showNewAddress ? "Use Saved Address" : "+ Drop Pin / New Address"}
            </button>
          </div>

          {!showNewAddress && addresses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedAddressId === addr.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {addr.label}
                  </span>
                  <p className="text-xs text-stone-800 dark:text-stone-200 font-medium mt-1">
                    {addr.full_address}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <LocationPickerMap
                initialLat={newLat}
                initialLng={newLng}
                onLocationChange={handleLocationPicked}
              />
              <input
                type="text"
                value={newAddressText}
                onChange={(e) => setNewAddressText(e.target.value)}
                placeholder="Doorstep address details..."
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-[#1F5D3A] outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Date & Time Slot */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-stone-900 dark:text-white">
            Schedule Scrap Agent Visit
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">
                Preferred Date
              </label>
              <input
                type="date"
                value={pickupDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-semibold focus:ring-2 focus:ring-[#1F5D3A] outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">
                Time Window
              </label>
              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-semibold focus:ring-2 focus:ring-[#1F5D3A] outline-hidden"
              >
                <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Morning)</option>
                <option value="12:00 PM - 03:00 PM">12:00 PM - 03:00 PM (Afternoon)</option>
                <option value="03:00 PM - 06:00 PM">03:00 PM - 06:00 PM (Evening)</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-[#D4A017] hover:bg-amber-500 text-stone-950 font-black text-base shadow-xl transition-all flex items-center justify-center gap-2 glow-gold disabled:opacity-50"
        >
          {loading ? "Scheduling Agent Visit..." : "Schedule Scrap Pickup & Lock Rates"}
        </button>

      </form>
    </div>
  );
};

export default SellScrapPage;
