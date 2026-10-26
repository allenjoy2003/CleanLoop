import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
  SparklesIcon, ArrowRightIcon, TruckIcon,
  CurrencyRupeeIcon, ShieldCheckIcon, LightBulbIcon,
  ScaleIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({
    total_kg_diverted: 14280,
    households_served: 2460,
    co2_saved_kg: 26418,
    trees_equivalent: 1188,
    payouts_distributed_inr: 84250
  });
  const [todayTip, setTodayTip] = useState(null);

  useEffect(() => {
    // Fetch live public platform stats & today's tip
    api.get('/impact/stats/public/')
      .then(res => setStats(res.data))
      .catch(err => console.warn("Stats fetch failed:", err));

    api.get('/waste-info/today-tip/')
      .then(res => setTodayTip(res.data))
      .catch(err => console.warn("Tip fetch failed:", err));
  }, []);

  const isMl = i18n.language === 'ml';

  return (
    <div className="space-y-20 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/50 text-[#1F5D3A] dark:text-emerald-300 text-xs font-bold tracking-wide">
                <SparklesIcon className="w-4 h-4 text-[#D4A017]" />
                <span>{t('hero.badge')}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-stone-900 dark:text-white leading-[1.15]">
                {t('hero.title_1')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1F5D3A] via-emerald-600 to-[#D4A017] dark:from-emerald-400 dark:via-teal-300 dark:to-yellow-300">
                  {t('hero.title_2')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl leading-relaxed">
                {t('hero.description')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/book-pickup"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-[#1F5D3A] hover:bg-[#16472c] text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all glow-primary group"
                >
                  <TruckIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  <span>{t('hero.cta_book')}</span>
                </Link>

                <Link
                  to="/sell-scrap"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white dark:bg-stone-800 border-2 border-[#D4A017] text-stone-900 dark:text-white font-bold text-base shadow-md hover:bg-amber-50 dark:hover:bg-stone-700/60 transition-all glow-gold"
                >
                  <CurrencyRupeeIcon className="w-5 h-5 text-[#D4A017]" />
                  <span>{t('hero.cta_scrap')}</span>
                </Link>
              </div>

              {/* Kochi specific tags */}
              <div className="flex flex-wrap gap-2 pt-2 text-xs text-stone-500 dark:text-stone-400">
                <span className="px-2.5 py-1 rounded-md bg-stone-200/70 dark:bg-stone-800">📍 Fort Kochi</span>
                <span className="px-2.5 py-1 rounded-md bg-stone-200/70 dark:bg-stone-800">📍 Kakkanad & InfoPark</span>
                <span className="px-2.5 py-1 rounded-md bg-stone-200/70 dark:bg-stone-800">📍 Marine Drive</span>
                <span className="px-2.5 py-1 rounded-md bg-stone-200/70 dark:bg-stone-800">📍 Edappally & Kaloor</span>
              </div>
            </motion.div>

            {/* Right Hero Visual Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/20 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A017]/10 rounded-full blur-2xl" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1F5D3A] flex items-center justify-center text-white font-bold">
                      <ScaleIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-white">Daily Doorstep Fleet</h4>
                      <p className="text-xs text-stone-500">Kochi Haritha Karma Sena Partner</p>
                    </div>
                  </div>
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>

                {/* Animated Kerala Counter Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60">
                    <p className="text-2xl sm:text-3xl font-black text-[#1F5D3A] dark:text-emerald-400">
                      {Number(stats.total_kg_diverted).toLocaleString()}
                    </p>
                    <p className="text-xs font-semibold text-stone-500 mt-1">{t('hero.stat_diverted')}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60">
                    <p className="text-2xl sm:text-3xl font-black text-[#D4A017]">
                      {Number(stats.households_served).toLocaleString()}
                    </p>
                    <p className="text-xs font-semibold text-stone-500 mt-1">{t('hero.stat_households')}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60">
                    <p className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">
                      {Number(stats.co2_saved_kg).toLocaleString()}
                    </p>
                    <p className="text-xs font-semibold text-stone-500 mt-1">{t('hero.stat_co2')}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60">
                    <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-300">
                      {Number(stats.trees_equivalent).toLocaleString()}
                    </p>
                    <p className="text-xs font-semibold text-stone-500 mt-1">{t('hero.stat_trees')}</p>
                  </div>
                </div>

                {/* AI Instant Waste Scan Shortcut */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-[#1F5D3A] text-white flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <SparklesIcon className="w-4 h-4" /> Multimodal Vision AI
                    </p>
                    <p className="text-sm font-semibold">Unsure how to sort something?</p>
                  </div>
                  <Link
                    to="/guide?tab=ai-scanner"
                    className="px-3 py-1.5 rounded-xl bg-white text-stone-900 font-bold text-xs hover:bg-emerald-50 transition-colors shadow-xs"
                  >
                    Scan Photo
                  </Link>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Kasavu Pattern Divider */}
      <div className="kasavu-divider max-w-5xl mx-auto" />

      {/* Today's Waste Tip Highlight Card */}
      {todayTip && (
        <section className="max-w-4xl mx-auto px-4">
          <div className="p-6 rounded-3xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#D4A017] text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <LightBulbIcon className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-700 dark:text-amber-400">
                {isMl ? "ഇന്നത്തെ ടിപ്പ്" : "Today's Segregation Tip"}
              </span>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                {isMl ? todayTip.title_ml : todayTip.title_en}
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                {isMl ? todayTip.content_ml : todayTip.content_en}
              </p>
            </div>
            <Link
              to="/guide"
              className="px-4 py-2 rounded-xl bg-[#1F5D3A] hover:bg-[#16472c] text-white font-semibold text-xs whitespace-nowrap transition-all shadow-xs"
            >
              {t('common.view_all')}
            </Link>
          </div>
        </section>
      )}

      {/* How Clean Loop Works (4 Steps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white">
            {t('how_it_works.title')}
          </h2>
          <p className="text-stone-600 dark:text-stone-400 max-w-xl mx-auto text-sm sm:text-base">
            {t('how_it_works.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-3xl space-y-4 hover:shadow-xl transition-all border border-emerald-500/20">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#1F5D3A] dark:text-emerald-400 font-black text-lg">
              1
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">{t('how_it_works.step_1_title')}</h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{t('how_it_works.step_1_desc')}</p>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-4 hover:shadow-xl transition-all border border-emerald-500/20">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#1F5D3A] dark:text-emerald-400 font-black text-lg">
              2
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">{t('how_it_works.step_2_title')}</h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{t('how_it_works.step_2_desc')}</p>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-4 hover:shadow-xl transition-all border border-emerald-500/20">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-[#D4A017] font-black text-lg">
              3
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">{t('how_it_works.step_3_title')}</h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{t('how_it_works.step_3_desc')}</p>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-4 hover:shadow-xl transition-all border border-emerald-500/20">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-[#D4A017] font-black text-lg">
              4
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">{t('how_it_works.step_4_title')}</h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{t('how_it_works.step_4_desc')}</p>
          </div>
        </div>
      </section>

      {/* Service Highlights Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="p-8 rounded-3xl bg-gradient-to-br from-[#1F5D3A] to-[#144427] text-white space-y-4 shadow-xl">
            <TruckIcon className="w-10 h-10 text-emerald-300" />
            <h3 className="text-2xl font-bold">Doorstep Waste Collection</h3>
            <p className="text-sm text-emerald-100 leading-relaxed">
              Daily morning segregated wet waste collection + weekly recyclables in Kochi wards with real-time tracking.
            </p>
            <Link to="/book-pickup" className="inline-flex items-center gap-1.5 font-bold text-sm text-amber-300 hover:text-amber-200">
              <span>Book Single Pickup</span> <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-600 to-[#D4A017] text-white space-y-4 shadow-xl">
            <CurrencyRupeeIcon className="w-10 h-10 text-amber-100" />
            <h3 className="text-2xl font-bold">Doorstep Scrap Cashout</h3>
            <p className="text-sm text-amber-100 leading-relaxed">
              Sell copper, brass, iron, cartons, plastic, and e-waste. Digital scales, transparent rates, and instant wallet credit.
            </p>
            <Link to="/sell-scrap" className="inline-flex items-center gap-1.5 font-bold text-sm text-stone-950 hover:text-stone-800">
              <span>View Rate Card & Sell</span> <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-stone-800 to-stone-900 text-white space-y-4 shadow-xl border border-stone-700">
            <ShieldCheckIcon className="w-10 h-10 text-emerald-400" />
            <h3 className="text-2xl font-bold">Kochi Rules & Penalties</h3>
            <p className="text-sm text-stone-300 leading-relaxed">
              Understand Kochi Corporation bye-laws on open dumping, leaf burning, and plastic ban violations with live Q&A.
            </p>
            <Link to="/rules" className="inline-flex items-center gap-1.5 font-bold text-sm text-emerald-400 hover:text-emerald-300">
              <span>Browse Rules Directory</span> <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
};

export default HomePage;
