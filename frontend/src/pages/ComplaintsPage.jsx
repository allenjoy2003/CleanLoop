import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LocationPickerMap from '../components/LocationPickerMap';
import toast from 'react-hot-toast';
import {
  ExclamationCircleIcon, CameraIcon, MapPinIcon,
  CheckCircleIcon, ClockIcon, ShieldExclamationIcon
} from '@heroicons/react/24/outline';

const ComplaintsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New Grievance form
  const [category, setCategory] = useState('illegal_dumping');
  const [description, setDescription] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [lat, setLat] = useState(10.0159);
  const [lng, setLng] = useState(76.3419);
  const [images, setImages] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const isMl = i18n.language === 'ml';

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints/');
      setComplaints(res.data);
      setLoading(false);
    } catch (err) {
      console.warn(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleLocationPicked = (loc) => {
    setLat(loc.lat);
    setLng(loc.lng);
    setLocationAddress(loc.address);
  };

  const handleSubmitComplaint = async (e) => {
    e?.preventDefault();
    if (!description.trim() || !locationAddress.trim()) {
      toast.error("Please enter a description and location pin.");
      return;
    }
    setSubmitting(true);

    const formData = new FormData();
    formData.append('category', category);
    formData.append('description', description);
    formData.append('location_address', locationAddress);
    formData.append('latitude', lat);
    formData.append('longitude', lng);
    for (let i = 0; i < images.length; i++) {
      formData.append('images', images[i]);
    }

    try {
      await api.post('/complaints/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Civic complaint registered. You will earn +25 Green Credits upon verification!");
      setDescription('');
      setImages([]);
      setShowForm(false);
      fetchComplaints();
    } catch (err) {
      toast.error("Failed to submit grievance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-bold">
          <ShieldExclamationIcon className="w-4 h-4" />
          <span>Kochi Municipal Grievance & Blackspot Reporting</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white">
          {isMl ? "മാലിന്യ പരാതികൾ അറിയിക്കുക" : "Civic Complaints & Illegal Dumping"}
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Report illegal blackspots, burning of waste, or missed collections. Verified reports earn <strong>+25 Green Credits</strong>.
        </p>
      </div>

      {/* Button to toggle new report */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 rounded-2xl bg-[#1F5D3A] hover:bg-[#16472c] text-white font-bold text-xs sm:text-sm shadow-md transition-all glow-primary"
        >
          {showForm ? "Cancel Report" : "+ Report New Grievance"}
        </button>
      </div>

      {/* Complaint Submission Form */}
      {showForm && (
        <form onSubmit={handleSubmitComplaint} className="glass-card rounded-3xl p-6 sm:p-8 border border-rose-500/30 shadow-2xl space-y-6 animate-in fade-in duration-300">
          <h3 className="text-lg font-bold text-stone-900 dark:text-white">
            Register Civic Waste Grievance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Grievance Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-semibold"
              >
                <option value="illegal_dumping">Illegal Dumping / Blackspot</option>
                <option value="missed_collection">Missed Doorstep Collection</option>
                <option value="overflowing_bin">Overflowing Community Bin</option>
                <option value="burning_waste">Burning of Waste or Plastic</option>
                <option value="waterbody_dumping">Canal or Lake Dumping</option>
                <option value="other">Other Grievance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                Attach Proof Photos (optional)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImages(Array.from(e.target.files))}
                className="w-full text-xs text-stone-600 dark:text-stone-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
              Description of the Issue
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details: time observed, commercial establishment involved, exact landmark..."
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs sm:text-sm focus:ring-2 focus:ring-[#1F5D3A] outline-hidden"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-stone-500">
              Pin Exact Location on Map
            </label>
            <LocationPickerMap
              initialLat={lat}
              initialLng={lng}
              onLocationChange={handleLocationPicked}
            />
            <input
              type="text"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              placeholder="Location details or landmark in Kochi..."
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs focus:ring-2 focus:ring-[#1F5D3A] outline-hidden"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-[#1F5D3A] hover:bg-[#16472c] text-white font-bold text-sm shadow-xl transition-all disabled:opacity-50"
          >
            {submitting ? "Submitting to Municipal Portal..." : "Submit Grievance to KMC Team"}
          </button>
        </form>
      )}

      {/* Existing Grievance Tickets List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-stone-900 dark:text-white">
          My Reported Tickets
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="glass-card rounded-3xl p-6 border border-stone-200 dark:border-stone-700 shadow-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                  #{c.ticket_number}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  c.status === 'resolved' 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {c.status.replace('_', ' ')}
                </span>
              </div>

              <h3 className="font-bold text-base text-stone-900 dark:text-white">
                {c.category.replace('_', ' ').toUpperCase()}
              </h3>

              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {c.description}
              </p>

              <div className="text-[11px] text-stone-500 flex items-center gap-1">
                <MapPinIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="truncate">{c.location_address}</span>
              </div>

              {c.admin_response && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300">
                  <strong>Municipal Action:</strong> {c.admin_response}
                </div>
              )}

              {c.credits_awarded && (
                <span className="inline-block text-[10px] font-bold text-emerald-600">
                  🎉 +25 Green Credits Credited for Verified Reporting!
                </span>
              )}
            </div>
          ))}
          {complaints.length === 0 && (
            <p className="text-xs text-stone-500 py-4 col-span-2 text-center">
              You haven't reported any civic grievances yet. Help keep Kochi clean!
            </p>
          )}
        </div>
      </div>

    </div>
  );
};

export default ComplaintsPage;
