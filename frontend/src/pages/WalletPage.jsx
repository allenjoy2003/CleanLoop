import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  BanknotesIcon, ArrowUpRightIcon, ArrowDownLeftIcon,
  CreditCardIcon, CurrencyRupeeIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';

const WalletPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [wallet, setWallet] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const fetchWalletData = async () => {
    try {
      const [walletRes, withRes] = await Promise.all([
        api.get('/scrap/wallet/my_wallet/'),
        api.get('/scrap/withdrawals/')
      ]);
      setWallet(walletRes.data);
      setWithdrawals(withRes.data);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleWithdraw = async (e) => {
    e?.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!upiId.trim()) {
      toast.error("Please provide your UPI ID or VPA (e.g. name@okaxis).");
      return;
    }
    setLoading(true);

    try {
      await api.post('/scrap/withdrawals/', {
        amount: amt,
        upi_id: upiId.trim()
      });
      toast.success("Withdrawal request submitted! Payout will be sent to your UPI ID.");
      setWithdrawAmount('');
      setShowWithdrawModal(false);
      fetchWalletData();
    } catch (err) {
      const msg = err.response?.data?.error || "Withdrawal failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      
      {/* Wallet Balance Hero */}
      <div className="glass-card rounded-3xl p-8 border-2 border-emerald-500/30 shadow-2xl bg-gradient-to-br from-emerald-900/40 to-[#1F5D3A]/30 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400">
            Clean Loop Scrap & Rewards Balance
          </span>
          <div className="flex items-baseline gap-1 justify-center sm:justify-start">
            <span className="text-3xl font-black text-stone-600 dark:text-stone-300">₹</span>
            <span className="text-5xl sm:text-6xl font-black text-[#1F5D3A] dark:text-white">
              {Number(wallet?.balance || 0).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Earnings from scrap pickups & redeemed Green Credits. Usable for subscriptions or withdrawable to UPI.
          </p>
        </div>

        <button
          onClick={() => setShowWithdrawModal(true)}
          className="px-6 py-3.5 rounded-2xl bg-[#D4A017] hover:bg-amber-400 text-stone-950 font-black text-sm shadow-xl transition-all flex items-center gap-2 glow-gold"
        >
          <BanknotesIcon className="w-5 h-5" />
          <span>Withdraw to UPI / Bank</span>
        </button>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="max-w-md w-full glass-card rounded-3xl p-6 border border-emerald-500/40 shadow-2xl space-y-5 bg-white dark:bg-stone-900">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                Request Payout Transfer
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  max={wallet?.balance || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Max ₹${wallet?.balance || 0}`}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-bold focus:ring-2 focus:ring-[#1F5D3A] outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">
                  UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@oksbi or 9846012345@paytm"
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-[#1F5D3A] outline-hidden"
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-[#1F5D3A] text-white text-xs font-bold hover:bg-[#16472c] transition-all disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History & Withdrawals Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-stone-900 dark:text-white">
          Wallet Transaction History
        </h2>

        <div className="overflow-x-auto rounded-3xl border border-stone-200 dark:border-stone-700 shadow-lg bg-white dark:bg-stone-800">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-300 uppercase text-[11px] font-black border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="py-3.5 px-6">Type</th>
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
              {wallet?.transactions?.map((t) => (
                <tr key={t.id} className="hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors">
                  <td className="py-3.5 px-6 font-bold whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      t.is_credit 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {t.is_credit ? <ArrowDownLeftIcon className="w-3.5 h-3.5" /> : <ArrowUpRightIcon className="w-3.5 h-3.5" />}
                      {t.txn_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-stone-700 dark:text-stone-300">
                    {t.description}
                  </td>
                  <td className={`py-3.5 px-6 font-black whitespace-nowrap ${t.is_credit ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-200'}`}>
                    {t.is_credit ? '+' : '-'}₹{t.amount}
                  </td>
                  <td className="py-3.5 px-6 text-stone-400 whitespace-nowrap">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!wallet?.transactions || wallet.transactions.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-500">
                    No wallet transactions recorded yet.
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

export default WalletPage;
