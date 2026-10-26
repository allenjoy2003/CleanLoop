import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HeartIcon } from '@heroicons/react/24/solid';

const Footer = () => {
  const { t, i18n } = useTranslation();

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-emerald-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Clean Loop" className="w-10 h-10" />
              <span className="text-2xl font-black text-white">Clean Loop</span>
            </div>
            <p className="text-sm text-stone-400">
              {t('tagline')}
            </p>
            <p className="text-xs text-stone-500">
              Smart waste management and doorstep scrap collection platform dedicated to Kochi City, Kerala, India.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/guide" className="hover:text-emerald-400 transition-colors">Waste Segregation Guide</Link></li>
              <li><Link to="/rules" className="hover:text-emerald-400 transition-colors">Kochi Rules & Fines</Link></li>
              <li><Link to="/scrap-rates" className="hover:text-emerald-400 transition-colors">Today's Scrap Rate Card</Link></li>
              <li><Link to="/service-areas" className="hover:text-emerald-400 transition-colors">Coverage Zones in Kochi</Link></li>
            </ul>
          </div>

          {/* Citizen Services */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Resident Services
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/book-pickup" className="hover:text-emerald-400 transition-colors">Doorstep Waste Pickup</Link></li>
              <li><Link to="/sell-scrap" className="hover:text-emerald-400 transition-colors">Sell Scrap for Cash</Link></li>
              <li><Link to="/complaints" className="hover:text-emerald-400 transition-colors">Report Illegal Dumping</Link></li>
              <li><Link to="/impact" className="hover:text-emerald-400 transition-colors">CO2 Impact Dashboard</Link></li>
            </ul>
          </div>

          {/* Municipal Partnership & Disclaimer */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Local Authority Note
            </h4>
            <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700 text-xs text-stone-400 space-y-2">
              <p>
                Operating in coordination with Kochi Municipal Corporation (KMC) & Haritha Karma Sena units.
              </p>
              <p className="text-[11px] text-amber-400/90 italic">
                Indicative rules & fines. Verify current guidelines with Kochi Municipal Corporation / Kerala LSGD.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© {new Date().getFullYear()} Clean Loop Kochi. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Crafted for a cleaner Kerala with</span>
            <HeartIcon className="w-4 h-4 text-emerald-500" />
            <span>in Kochi</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
