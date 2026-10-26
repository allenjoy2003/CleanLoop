import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LocationPickerMap from '../components/LocationPickerMap';
import toast from 'react-hot-toast';
import {
  CalendarDaysIcon, ClockIcon, MapPinIcon,
  CheckCircleIcon, PhotoIcon, TruckIcon
} from '@heroicons/react/24/outline';

const BookPickupPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  
  // Custom new address map state
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddressText, setNewAddressText] = useState('');
  const [newAddressWard, setNewAddressWard] = useState('Kakkanad');
  const [newLat, setNewLat] = useState(10.0159);
  const [newLng, setNewLng] = useState(76.3419);

  // Date and Slots
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');

  const [estimatedKg, setEstimatedKg] = useState(5.0);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const isMl = i18n.language === 'ml';

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/book-pickup' } });
      return;
    }

    // Fetch waste categories
    api.get('/waste-info/categories/').then(res => setCategories(res.data)).catch(err => console.warn(err));

    // Fetch user saved addresses
    api.get('/accounts/addresses/').then(res => {
      setAddresses(res.data);
      if (res.data.length > 0) {
        const def = res.data.find(a => a.is_default) || res.data[0];
        setSelectedAddressId(def.id);
      } else {
        setShowNewAddress(true);
      }
    }).catch(err => console.warn(err));
  }, [user, navigate]);

  // Fetch slots whenever pickup date changes
  useEffect(() => {
    if (!pickupDate) return;
    api.get(`/collections/slots/?date=${pickupDate}`)
      .then(res => {
        setSlots(res.data);
        if (res.data.length > 0) {
          const avail = res.data.find(s => s.is_available) || res.data[0];
          setSelectedSlotId(avail.id);
        }
      })
      .catch(err => console.warn(err));
  }, [pickupDate]);

  const toggleCategory = (id) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleLocationPicked = (loc) => {
    setNewLat(loc.lat);
    setNewLng(loc.lng);
    setNewAddressText(loc.address);
    if (loc.suburb) setNewAddressWard(loc.suburb);
  };

  const handleBookingSubmit = async (e) => {
    e?.preventDefault();
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one waste category.");
      return;
    }

    setLoading(true);

    try {
      let finalAddressId = selectedAddressId;

      // Create new address if requested
      if (showNewAddress || !finalAddressId) {
        if (!newAddressText.trim()) {
          toast.error("Please enter your doorstep address or pin on map.");
          setLoading(false);
          return;
        }
        const addrRes = await api.post('/accounts/addresses/', {
          label: 'home',
          full_address: newAddressText,
          ward: newAddressWard,
          latitude: newLat,
          longitude: newLng,
          is_default: addresses.length === 0
        });
        finalAddressId = addrRes.data.id;
      }

      // Create booking payload
      const bookingData = {
        address: finalAddressId,
        slot: selectedSlotId || null,
        pickup_date: pickupDate,
        preferred_time_window: slots.find(s => s.id === selectedSlotId)?.slot_label || "08:00 AM - 11:00 AM",
        estimated_quantity_kg: estimatedKg,
        notes: notes,
        items: selectedCategories.map(catId => ({
          category_id: catId,
          approx_weight_kg: (estimatedKg / selectedCategories.length).toFixed(1)
        }))
      };

      const res = await api.post('/collections/bookings/', bookingData);
      toast.success("Doorstep Waste Pickup Booked!");
      navigate('/impact');
    } catch (err) {
      const msg = err.response?.data?.slot || err.response?.data?.error || "Booking failed. Please try again.";
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white">
          {isMl ? "വീട്ടുപടിക്കൽ മാലിന്യ ശേഖരണം ബുക്ക് ചെയ്യുക" : "Book Doorstep Waste Collection"}
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Scheduled collection by authorized municipal operators and Haritha Karma Sena fleet across Kochi.
        </p>
      </div>

      <form onSubmit={handleBookingSubmit} className="space-y-8">
        
        {/* Step 1: Select Waste Types */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#1F5D3A] text-white flex items-center justify-center font-bold text-xs">
              1
            </span>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              Choose Waste Category
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((cat) => {
              const active = selectedCategories.includes(cat.id);
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-left transition-all relative ${
                    active
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500 shadow-md'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-emerald-300'
                  }`}
                >
                  <p className="text-xs font-bold text-stone-900 dark:text-white">
                    {isMl ? cat.name_ml : cat.name_en}
                  </p>
                  <span
                    className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: cat.color_hex }}
                  >
                    {isMl ? cat.bin_color_ml : cat.bin_color_en}
                  </span>
                  {active && (
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 absolute top-2 right-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Address Selection or Map Dropping */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#1F5D3A] text-white flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                Doorstep Pickup Address (Kochi)
              </h3>
            </div>

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
                  <p className="text-[11px] text-stone-500 mt-1">Ward: {addr.ward}</p>
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
                placeholder="Doorstep building, house number, road..."
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-[#1F5D3A] outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Step 3: Date and Slot Capacity */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#1F5D3A] text-white flex items-center justify-center font-bold text-xs">
              3
            </span>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              Preferred Date & Capacity Slot
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">
                Pickup Date
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
                Estimated Weight (kg)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="100"
                value={estimatedKg}
                onChange={(e) => setEstimatedKg(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-semibold focus:ring-2 focus:ring-[#1F5D3A] outline-hidden"
              />
            </div>
          </div>

          {/* Slots list */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold uppercase text-stone-500">
              Available Zone Slots
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  disabled={!s.is_available}
                  onClick={() => setSelectedSlotId(s.id)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedSlotId === s.id
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-md'
                      : s.is_available
                        ? 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-emerald-400'
                        : 'bg-stone-100 dark:bg-stone-900 text-stone-400 border-stone-200 dark:border-stone-800 cursor-not-allowed opacity-60'
                  }`}
                >
                  <p className="text-xs font-semibold">{s.slot_label}</p>
                  <p className="text-[10px] mt-0.5">
                    {s.is_available ? `${s.capacity - s.booked_count} slots left` : "FULL"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">
              Pickup Instructions / Notes (optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Leave bins near the porch gate, ring bell..."
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs sm:text-sm focus:ring-2 focus:ring-[#1F5D3A] outline-hidden"
            />
          </div>
        </div>

        {/* Submit Booking */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-[#1F5D3A] hover:bg-[#16472c] text-white font-bold text-base shadow-xl transition-all flex items-center justify-center gap-2 glow-primary disabled:opacity-50"
        >
          {loading ? "Confirming Booking..." : "Confirm Doorstep Waste Pickup"}
        </button>

      </form>
    </div>
  );
};

export default BookPickupPage;
