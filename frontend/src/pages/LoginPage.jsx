import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  PhoneIcon, KeyIcon, ArrowRightIcon,
  ShieldCheckIcon, SparklesIcon
} from '@heroicons/react/24/outline';

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const { user, loginWithTokens } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState('');
  const [countdown, setCountdown] = useState(30);

  const otpInputs = useRef([]);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    let timer;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleRequestOTP = async (e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/accounts/auth/otp/request/', {
        phone: phoneNumber
      });
      toast.success(res.data.message || "OTP sent successfully!");
      if (res.data.dev_otp) {
        setDevOtpCode(res.data.dev_otp);
      }
      setStep('otp');
      setCountdown(30);
    } catch (err) {
      const errorMsg = err.response?.data?.phone?.[0] || err.response?.data?.error || "Failed to send OTP.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Paste support for 6 digits
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length === 6) {
        const arr = pasted.split('');
        setOtpValues(arr);
        otpInputs.current[5]?.focus();
        return;
      }
    }

    const val = value.slice(-1);
    const newArr = [...otpValues];
    newArr[index] = val;
    setOtpValues(newArr);

    if (val && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    const otpString = otpValues.join('');
    if (otpString.length !== 6) {
      toast.error("Please enter all 6 digits of the OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/accounts/auth/otp/verify/', {
        phone: phoneNumber,
        otp: otpString,
        name: name,
        preferred_language: i18n.language
      });

      toast.success("Welcome to Clean Loop!");
      loginWithTokens(res.data.user, res.data.access, res.data.refresh);

      if (res.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate(location.state?.from || '/');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Invalid OTP code.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Quick autofill buttons for Demo Customer and Admin
  const fillDemoCustomer = () => {
    setPhoneNumber("+919846098765");
  };
  const fillDemoAdmin = () => {
    setPhoneNumber("+919846012345");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-card rounded-3xl p-8 border border-emerald-500/30 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto">
            <img src="/logo.svg" alt="Clean Loop" className="w-full h-full" />
          </div>
          <h2 className="text-2xl font-black text-stone-900 dark:text-white">
            {step === 'phone' ? "Sign In / Sign Up" : "Enter Verification OTP"}
          </h2>
          <p className="text-xs text-stone-500">
            {step === 'phone' 
              ? "Verify with your 10-digit Indian mobile number via Twilio OTP."
              : `Enter the 6-digit code sent to ${phoneNumber}`
            }
          </p>
        </div>

        {/* STEP 1: Phone Input Form */}
        {step === 'phone' && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <PhoneIcon className="w-5 h-5 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+919846012345"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-semibold tracking-wide focus:ring-2 focus:ring-[#1F5D3A] outline-hidden"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#1F5D3A] hover:bg-[#16472c] text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 glow-primary disabled:opacity-50"
            >
              {loading ? "Sending SMS OTP..." : "Get OTP via SMS"}
              <ArrowRightIcon className="w-4 h-4" />
            </button>

            {/* Quick Demo Fill Buttons for convenience */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-2">
              <p className="text-[11px] font-bold text-center text-stone-500 uppercase tracking-wider">
                ⚡ Demo Fast-Fill Accounts
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={fillDemoCustomer}
                  className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold hover:bg-emerald-50 transition-colors text-left"
                >
                  <p className="font-bold text-emerald-800 dark:text-emerald-400">Demo Customer</p>
                  <p className="text-[10px] text-stone-500">+919846098765</p>
                </button>

                <button
                  type="button"
                  onClick={fillDemoAdmin}
                  className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold hover:bg-amber-50 transition-colors text-left"
                >
                  <p className="font-bold text-amber-700 dark:text-amber-400">KMC Admin</p>
                  <p className="text-[10px] text-stone-500">+919846012345</p>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 2: 6-Box OTP Input Form */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            {devOtpCode && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-300 text-center font-bold">
                🛠️ Dev Mode Active: Test OTP is <span className="text-sm font-black text-amber-600 underline">{devOtpCode}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-300 mb-2 text-center">
                6-Digit OTP Code
              </label>
              <div className="flex justify-between gap-2">
                {otpValues.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => otpInputs.current[idx] = el}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-black rounded-xl bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 focus:border-[#1F5D3A] focus:ring-2 focus:ring-[#1F5D3A]/30 outline-hidden"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">
                Your Full Name (optional for new user)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Allen Thomas"
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm outline-hidden focus:ring-2 focus:ring-[#1F5D3A]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#1F5D3A] hover:bg-[#16472c] text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 glow-primary disabled:opacity-50"
            >
              {loading ? "Verifying Token..." : "Verify & Sign In"}
            </button>

            <div className="flex items-center justify-between text-xs text-stone-500 pt-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-stone-600 dark:text-stone-400 hover:underline"
              >
                Change Phone
              </button>

              <button
                type="button"
                onClick={handleRequestOTP}
                disabled={countdown > 0}
                className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline disabled:opacity-50"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default LoginPage;
