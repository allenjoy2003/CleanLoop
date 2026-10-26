import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  SparklesIcon, TrophyIcon, FireIcon,
  CurrencyRupeeIcon, CheckBadgeIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';

const RewardsPage = () => {
  const { t, i18n } = useTranslation();
  const { user, fetchProfile } = useAuth();

  const [rewardData, setRewardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeemCredits, setRedeemCredits] = useState(100);
  const [redeeming, setRedeeming] = useState(false);

  const isMl = i18n.language === 'ml';

  const loadRewards = async () => {
    try {
      const res = await api.get('/rewards/my_rewards/');
      setRewardData(res.data);
      setLoading(false);
    } catch (err) {
      console.warn(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  const handleRedeem = async () => {
    if (redeemCredits <= 0) return;
    setRedeeming(true);
    try {
      const res = await api.post('/rewards/redeem_to_wallet/', {
        credits: redeemCredits
      });
      toast.success(res.data.message);
      loadRewards();
      fetchProfile();
    } catch (err) {
      const msg = err.response?.data?.error || "Redemption failed.";
      toast.error(msg);
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white">
          {isMl ? "ഗ്രീൻ ക്രെഡിറ്റുകളും റിവാർഡുകളും" : "Green Credits & Citizen Rewards"}
        </h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Earn points for properly segregating waste, completing pickups, recycling scrap, and maintaining weekly streaks.
        </p>
      </div>

      {/* Rewards Status Card */}
      <div className="glass-card rounded-3xl p-8 border-2 border-emerald-500/30 shadow-2xl bg-gradient-to-br from-emerald-900/40 via-[#1F5D3A]/30 to-[#D4A017]/20 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Available Credits */}
        <div className="space-y-1 text-center md:text-left">
          <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400">
            Available to Redeem
          </span>
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <SparklesIcon className="w-8 h-8 text-[#D4A017]" />
            <span className="text-5xl font-black text-[#1F5D3A] dark:text-white">
              {rewardData?.current_green_credits || 0}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Lifetime Earned: {rewardData?.total_green_credits || 0} pts
          </p>
        </div>

        {/* Current Badge Level */}
        <div className="text-center md:text-left p-4 rounded-2xl bg-white/60 dark:bg-stone-900/60 border border-emerald-500/20 space-y-1">
          <span className="text-[10px] uppercase font-bold text-stone-500">
            Current Citizen Rank
          </span>
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <TrophyIcon className="w-6 h-6 text-[#D4A017]" />
            <h3 className="text-lg font-black text-stone-900 dark:text-white">
              {isMl ? rewardData?.current_badge?.name_ml : rewardData?.current_badge?.name_en || "Seedling"}
            </h3>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            {isMl ? rewardData?.current_badge?.description_ml : rewardData?.current_badge?.description_en}
          </p>
        </div>

        {/* Streak Weeks */}
        <div className="text-center md:text-left p-4 rounded-2xl bg-white/60 dark:bg-stone-900/60 border border-emerald-500/20 space-y-1">
          <span className="text-[10px] uppercase font-bold text-stone-500">
            Consecutive Weekly Streak
          </span>
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <FireIcon className="w-6 h-6 text-amber-500" />
            <span className="text-2xl font-black text-amber-600">
              {rewardData?.streak_weeks || 0} Weeks Active
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            +15 bonus credits every consecutive Sunday!
          </p>
        </div>

      </div>

      {/* Redeem Credits to Wallet Section */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#D4A017]/40 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <CurrencyRupeeIcon className="w-5 h-5 text-[#D4A017]" />
          <span>Redeem Green Credits for Wallet Cash</span>
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-300">
          Conversion rate: <strong>100 Green Credits = ₹25.00</strong> credited directly to your Clean Loop wallet.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRedeemCredits(100)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border ${redeemCredits === 100 ? 'bg-amber-100 dark:bg-amber-950 border-[#D4A017] text-amber-900' : 'bg-white dark:bg-stone-800'}`}
            >
              100 pts (₹25)
            </button>
            <button
              onClick={() => setRedeemCredits(200)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border ${redeemCredits === 200 ? 'bg-amber-100 dark:bg-amber-950 border-[#D4A017] text-amber-900' : 'bg-white dark:bg-stone-800'}`}
            >
              200 pts (₹50)
            </button>
            <button
              onClick={() => setRedeemCredits(400)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border ${redeemCredits === 400 ? 'bg-amber-100 dark:bg-amber-950 border-[#D4A017] text-amber-900' : 'bg-white dark:bg-stone-800'}`}
            >
              400 pts (₹100)
            </button>
          </div>

          <button
            onClick={handleRedeem}
            disabled={redeeming || (rewardData?.current_green_credits || 0) < redeemCredits}
            className="px-6 py-3 rounded-2xl bg-[#1F5D3A] hover:bg-[#16472c] text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 glow-primary ml-auto"
          >
            {redeeming ? "Redeeming..." : `Redeem ${redeemCredits} pts for ₹${(redeemCredits / 100 * 25).toFixed(0)}`}
          </button>
        </div>
      </div>

      {/* Badges Hierarchy Roadmap */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-stone-900 dark:text-white">
          Citizen Eco-Badges Roadmap
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {rewardData?.all_badges?.map((badge) => {
            const unlocked = (rewardData?.total_green_credits || 0) >= badge.points_required;
            return (
              <div
                key={badge.id}
                className={`p-6 rounded-3xl border transition-all space-y-3 ${
                  unlocked
                    ? 'glass-card border-emerald-500 shadow-lg'
                    : 'bg-stone-100/60 dark:bg-stone-900/40 border-stone-300 dark:border-stone-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-xs"
                    style={{ backgroundColor: badge.color }}
                  >
                    🏆
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {badge.points_required} pts
                  </span>
                </div>

                <h3 className="font-bold text-base text-stone-900 dark:text-white">
                  {isMl ? badge.name_ml : badge.name_en}
                </h3>

                <p className="text-xs text-stone-600 dark:text-stone-400">
                  {isMl ? badge.description_ml : badge.description_en}
                </p>

                {unlocked && (
                  <span className="inline-block text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Unlocked & Active
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Point Logs */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-stone-900 dark:text-white">
          Green Credit Activity Ledger
        </h2>

        <div className="overflow-x-auto rounded-3xl border border-stone-200 dark:border-stone-700 shadow-lg bg-white dark:bg-stone-800">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 uppercase text-[11px] font-black border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="py-3 px-6">Reason</th>
                <th className="py-3 px-6">Description</th>
                <th className="py-3 px-6">Credits</th>
                <th className="py-3 px-6">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
              {rewardData?.recent_activity?.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 px-6 font-bold whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px]">
                      {log.reason}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-stone-700 dark:text-stone-300">
                    {log.description}
                  </td>
                  <td className={`py-3 px-6 font-black whitespace-nowrap ${log.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {log.points > 0 ? `+${log.points}` : log.points} pts
                  </td>
                  <td className="py-3 px-6 text-stone-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!rewardData?.recent_activity || rewardData.recent_activity.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-500">
                    No reward transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default RewardsPage;
