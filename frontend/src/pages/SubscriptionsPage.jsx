import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  SparklesIcon, CheckBadgeIcon, ShieldCheckIcon,
  CalendarDaysIcon, PauseIcon, PlayIcon, XMarkIcon
} from '@heroicons/react/24/outline';

const SubscriptionsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [userSubs, setUserSubs] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [useWalletCredits, setUseWalletCredits] = useState(true);
  const [loading, setLoading] = useState(false);

  const isMl = i18n.language === 'ml';

  const fetchData = async () => {
    try {
      const [plansRes, subsRes] = await Promise.all([
        api.get('/subscriptions/plans/'),
        api.get('/subscriptions/user-subscriptions/')
      ]);
      setPlans(plansRes.data);
      setUserSubs(subsRes.data);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubscribe = async (plan) => {
    if (!user) {
      toast.error("Please sign in to subscribe.");
      return;
    }
    setLoading(true);

    try {
      // Step 1: Create Razorpay Order with Wallet deduction support
      const orderRes = await api.post('/payments/order/create/', {
        purpose: 'subscription',
        plan_id: plan.id,
        use_wallet: useWalletCredits
      });

      const orderData = orderRes.data;

      // If 100% paid by wallet credits
      if (orderData.is_fully_paid) {
        toast.success("Subscribed successfully using Clean Loop Wallet credits!");
        fetchData();
        setLoading(false);
        return;
      }

      // Step 2: Open Razorpay Checkout (Test Mode)
      const options = {
        key: orderData.razorpay_key_id,
        amount: Math.round(orderData.razorpay_amount_paid * 100),
        currency: "INR",
        name: "Clean Loop Kochi",
        description: `${plan.name_en} (${plan.plan_type})`,
        image: "/logo.svg",
        order_id: orderData.order_id.startsWith("order_mock_") ? undefined : orderData.order_id,
        handler: async function (response) {
          try {
            await api.post('/payments/order/verify/', {
              payment_id: orderData.payment_id,
              razorpay_order_id: orderData.order_id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || "mock_signature"
            });
            toast.success("Payment verified and subscription activated!");
            fetchData();
          } catch (err) {
            toast.error("Payment verification failed.");
          }
        },
        prefill: {
          name: user.name || "Resident",
          contact: user.phone || ""
        },
        theme: {
          color: "#1F5D3A"
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback simulation in test mode if Razorpay JS blocked
        await api.post('/payments/order/verify/', {
          payment_id: orderData.payment_id,
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: "test_sig"
        });
        toast.success("Test Mode: Subscription activated!");
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to initiate subscription payment.");
    } finally {
      setLoading(false);
    }
  };

  const handlePauseResume = async (sub, action) => {
    try {
      await api.post(`/subscriptions/user-subscriptions/${sub.id}/${action}/`);
      toast.success(`Subscription ${action === 'pause' ? 'paused' : 'resumed'}`);
      fetchData();
    } catch (err) {
      toast.error(`Failed to ${action} subscription.`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 dark:text-white">
          {isMl ? "വീട്ടുപടിക്കൽ ശേഖരണ പ്ലാനുകൾ" : "Doorstep Waste Collection Plans"}
        </h1>
        <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base">
          {isMl
            ? "നിത്യേനയുള്ള അടുക്കള മാലിന്യ ശേഖരണത്തിനും പുനരുപയോഗ വസ്തുക്കൾക്കും അനുയോജ്യമായ പ്ലാനുകൾ."
            : "Hassle-free scheduled collection for your home or apartment with automated pickups and wallet integration."
          }
        </p>
      </div>

      {/* Active User Subscriptions */}
      {userSubs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-stone-900 dark:text-white">
            My Active Subscriptions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userSubs.map((sub) => (
              <div
                key={sub.id}
                className="glass-card rounded-3xl p-6 border-2 border-emerald-500/30 shadow-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Code: {sub.subscription_code}
                    </span>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                      {isMl ? sub.plan_details?.name_ml : sub.plan_details?.name_en}
                    </h3>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    sub.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {sub.status}
                  </span>
                </div>

                <div className="text-xs text-stone-600 dark:text-stone-300 space-y-1">
                  <p><strong>Window:</strong> {sub.preferred_time_window}</p>
                  <p><strong>Valid Until:</strong> {sub.end_date}</p>
                  <p><strong>Address:</strong> {sub.address_details?.full_address}</p>
                </div>

                {/* Next scheduled pickups list */}
                {sub.scheduled_pickups?.length > 0 && (
                  <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
                    <p className="text-[11px] font-bold text-stone-500 mb-2">Upcoming Scheduled Dates:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {sub.scheduled_pickups.slice(0, 5).map((sp) => (
                        <span key={sp.id} className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[11px] font-semibold">
                          📅 {sp.scheduled_date}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-stone-200 dark:border-stone-700 flex gap-2">
                  {sub.status === 'active' ? (
                    <button
                      onClick={() => handlePauseResume(sub, 'pause')}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold hover:bg-stone-100 flex items-center gap-1"
                    >
                      <PauseIcon className="w-4 h-4" /> Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePauseResume(sub, 'resume')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1"
                    >
                      <PlayIcon className="w-4 h-4" /> Resume
                    </button>
                  )}

                  <button
                    onClick={() => handlePauseResume(sub, 'cancel')}
                    className="px-3 py-1.5 rounded-xl text-rose-600 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 ml-auto"
                  >
                    Cancel Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Plans Pricing Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-stone-900 dark:text-white">
            Available Service Tiers
          </h2>

          <label className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer">
            <input
              type="checkbox"
              checked={useWalletCredits}
              onChange={(e) => setUseWalletCredits(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Use Clean Loop Wallet Credits if available</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`glass-card rounded-3xl p-8 border transition-all flex flex-col justify-between relative ${
                plan.is_popular
                  ? 'border-2 border-emerald-500 shadow-2xl ring-2 ring-emerald-500/20'
                  : 'border-stone-200 dark:border-stone-700/80 shadow-lg'
              }`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#1F5D3A] text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                  Most Popular in Kochi
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                    {isMl ? plan.name_ml : plan.name_en}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    {isMl ? plan.description_ml : plan.description_en}
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-[#1F5D3A] dark:text-emerald-400">
                    ₹{plan.price_inr}
                  </span>
                  {Number(plan.original_price_inr) > 0 && (
                    <span className="text-sm text-stone-400 line-through">
                      ₹{plan.original_price_inr}
                    </span>
                  )}
                  <span className="text-xs text-stone-500 font-bold uppercase">
                    / {plan.plan_type}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-700">
                  <p className="text-[11px] font-bold uppercase text-stone-500">
                    Included Features:
                  </p>
                  <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                    {(isMl ? plan.features_ml : plan.features_en)?.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckBadgeIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all ${
                    plan.is_popular
                      ? 'bg-[#1F5D3A] hover:bg-[#16472c] text-white glow-primary'
                      : 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:opacity-90'
                  }`}
                >
                  {loading ? "Processing..." : `Subscribe Now (₹${plan.price_inr})`}
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default SubscriptionsPage;
