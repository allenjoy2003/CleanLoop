import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Bars3Icon, XMarkIcon, SunIcon, MoonIcon,
  UserCircleIcon, SparklesIcon, ShieldCheckIcon,
  MapPinIcon, BellIcon, BanknotesIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ml' ? 'en' : 'ml';
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.waste_guide'), path: '/guide' },
    { name: t('nav.rules_fines'), path: '/rules' },
    { name: t('nav.scrap_rates'), path: '/scrap-rates' },
    { name: t('nav.service_areas'), path: '/service-areas' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-emerald-900/10 dark:border-emerald-500/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 flex-shrink-0 relative">
              <img src="/logo.svg" alt="Clean Loop Logo" className="w-full h-full transform group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-[#1F5D3A] dark:text-emerald-400">
                  Clean Loop
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#D4A017]/20 text-[#D4A017] dark:text-yellow-400 border border-[#D4A017]/40">
                  Kochi
                </span>
              </div>
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 hidden sm:block">
                {t('tagline')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-semibold transition-colors duration-200 ${
                    active 
                      ? 'text-[#1F5D3A] dark:text-emerald-400 font-bold' 
                      : 'text-stone-700 dark:text-stone-300 hover:text-[#1F5D3A] dark:hover:text-emerald-400'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            {user && (
              <>
                <Link to="/book-pickup" className="text-sm font-semibold text-stone-700 dark:text-stone-300 hover:text-[#1F5D3A]">
                  {t('nav.book_pickup')}
                </Link>
                <Link to="/sell-scrap" className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 flex items-center gap-1">
                  <BanknotesIcon className="w-4 h-4" />
                  {t('nav.sell_scrap')}
                </Link>
                <Link to="/subscriptions" className="text-sm font-semibold text-stone-700 dark:text-stone-300 hover:text-[#1F5D3A]">
                  {t('nav.my_subscriptions')}
                </Link>
              </>
            )}

            {isAdmin && (
              <Link 
                to="/admin/dashboard" 
                className="text-xs uppercase font-extrabold tracking-wider px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-sm hover:bg-amber-500/20 transition-all"
              >
                <ShieldCheckIcon className="w-4 h-4" />
                {t('nav.admin_dashboard')}
              </Link>
            )}
          </nav>

          {/* Right Controls: Language, Theme, Auth */}
          <div className="flex items-center gap-3">
            {/* Language Toggle (EN / മലയാളം) */}
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1 shadow-xs"
              title="Change Language"
            >
              <span className={i18n.language === 'en' ? 'text-[#1F5D3A] dark:text-emerald-400 font-extrabold' : 'text-stone-500'}>EN</span>
              <span className="text-stone-400">/</span>
              <span className={i18n.language === 'ml' ? 'text-[#1F5D3A] dark:text-emerald-400 font-extrabold' : 'text-stone-500'}>മല</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <SunIcon className="w-5 h-5 text-amber-400" /> : <MoonIcon className="w-5 h-5 text-stone-700" />}
            </button>

            {/* User Profile or Sign In */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/impact"
                  className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 relative"
                  title="Impact & Notifications"
                >
                  <BellIcon className="w-5 h-5" />
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 text-[#1F5D3A] dark:text-emerald-300 text-sm font-semibold hover:shadow-xs transition-all"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  <span className="hidden md:inline-block max-w-[100px] truncate">
                    {user.name || user.phone}
                  </span>
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-[#1F5D3A] hover:bg-[#18482d] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all glow-primary"
              >
                {t('nav.signin')}
              </Link>
            )}

            {/* Mobile Hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Kasavu Gold Decorative Border Line */}
      <div className="kasavu-divider" />

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-card border-b border-emerald-900/10 px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium py-2 text-stone-800 dark:text-stone-200 hover:text-[#1F5D3A]"
            >
              {item.name}
            </Link>
          ))}

          {user && (
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
              <Link
                to="/book-pickup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium py-2 text-[#1F5D3A] dark:text-emerald-400"
              >
                {t('nav.book_pickup')}
              </Link>
              <Link
                to="/sell-scrap"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium py-2 text-emerald-600 dark:text-emerald-300"
              >
                {t('nav.sell_scrap')}
              </Link>
              <Link
                to="/subscriptions"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium py-2 text-stone-800 dark:text-stone-200"
              >
                {t('nav.my_subscriptions')}
              </Link>
              <Link
                to="/wallet"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium py-2 text-stone-800 dark:text-stone-200"
              >
                {t('nav.wallet')}
              </Link>
              <Link
                to="/complaints"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium py-2 text-stone-800 dark:text-stone-200"
              >
                {t('nav.complaints')}
              </Link>
              <Link
                to="/impact"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium py-2 text-stone-800 dark:text-stone-200"
              >
                {t('nav.impact')}
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-bold py-2 text-amber-600 dark:text-amber-400"
                >
                  {t('nav.admin_dashboard')}
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-base font-medium py-2 text-red-600 dark:text-red-400"
              >
                {t('nav.signout')}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
