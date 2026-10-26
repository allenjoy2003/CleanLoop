import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  UserCircleIcon, PhoneIcon, EnvelopeIcon,
  LanguageIcon, MapPinIcon, BellIcon
} from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const { i18n } = useTranslation();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notifySms, setNotifySms] = useState(user?.notify_sms ?? true);
  const [notifyEmail, setNotifyEmail] = useState(user?.notify_email ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name,
        email,
        notify_sms: notifySms,
        notify_email: notifyEmail,
        preferred_language: i18n.language
      });
    } catch (err) {
      // toast shown in context
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white">
            Citizen Profile & Preferences
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Registered phone: <strong>{user?.phone}</strong> ({user?.role?.toUpperCase()})
          </p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900"
        >
          Sign Out
        </button>
      </div>

      <form onSubmit={handleSave} className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-xl space-y-6">
        <h3 className="font-bold text-base text-stone-900 dark:text-white">
          Contact Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Allen Thomas"
              className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-[#1F5D3A] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
              Email Address (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="resident@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-[#1F5D3A] outline-hidden"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-stone-200 dark:border-stone-700 space-y-3">
          <h3 className="font-bold text-base text-stone-900 dark:text-white">
            Notification Preferences
          </h3>

          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notifySms}
                onChange={(e) => setNotifySms(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Send SMS alerts via Twilio when waste collector is on the way</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Email receipts and monthly CO2 impact summaries</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-2xl bg-[#1F5D3A] text-white font-bold text-sm shadow-md hover:bg-[#16472c] transition-all disabled:opacity-50"
        >
          {saving ? "Saving Changes..." : "Save Preferences"}
        </button>
      </form>

      {/* Saved addresses overview */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-stone-900 dark:text-white">
          Saved Doorstep Addresses
        </h3>
        <div className="space-y-2">
          {user?.addresses?.map((a) => (
            <div key={a.id} className="p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 flex items-start gap-3">
              <MapPinIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700">{a.label}</span>
                <p className="text-xs text-stone-800 dark:text-stone-200 font-medium">{a.full_address}</p>
                <p className="text-[11px] text-stone-500">Ward: {a.ward || 'Kochi'}</p>
              </div>
            </div>
          ))}
          {(!user?.addresses || user.addresses.length === 0) && (
            <p className="text-xs text-stone-500">No saved addresses yet. Address will be saved when you book your first pickup.</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProfilePage;
