import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIChatbotWidget from './components/AIChatbotWidget';

// Pages
import HomePage from './pages/HomePage';
import WasteGuidePage from './pages/WasteGuidePage';
import RulesFinesPage from './pages/RulesFinesPage';
import ScrapRatesPage from './pages/ScrapRatesPage';
import ServiceAreasPage from './pages/ServiceAreasPage';
import LoginPage from './pages/LoginPage';
import BookPickupPage from './pages/BookPickupPage';
import SellScrapPage from './pages/SellScrapPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import WalletPage from './pages/WalletPage';
import RewardsPage from './pages/RewardsPage';
import ComplaintsPage from './pages/ComplaintsPage';
import ImpactDashboardPage from './pages/ImpactDashboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF5E9] dark:bg-[#0d1e15] text-stone-900 dark:text-stone-100 transition-colors duration-300">
      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/guide" element={<WasteGuidePage />} />
          <Route path="/rules" element={<RulesFinesPage />} />
          <Route path="/scrap-rates" element={<ScrapRatesPage />} />
          <Route path="/service-areas" element={<ServiceAreasPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Customer Logged-in Flows */}
          <Route path="/book-pickup" element={<BookPickupPage />} />
          <Route path="/sell-scrap" element={<SellScrapPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/complaints" element={<ComplaintsPage />} />
          <Route path="/impact" element={<ImpactDashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin Role Only Dashboard */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      <AIChatbotWidget />
    </div>
  );
}

export default App;
