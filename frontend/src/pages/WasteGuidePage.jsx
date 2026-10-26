import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import {
  SparklesIcon, MagnifyingGlassIcon, BookOpenIcon,
  LightBulbIcon, InformationCircleIcon, CameraIcon,
  CheckCircleIcon, XCircleIcon, ArrowRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const WasteGuidePage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'categories';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [categories, setCategories] = useState([]);
  const [facts, setFacts] = useState([]);
  const [tips, setTips] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // AI Multimodal Vision Scanner state
  const [scannerImage, setScannerImage] = useState(null);
  const [scannerPreview, setScannerPreview] = useState(null);
  const [scannerResult, setScannerResult] = useState(null);
  const [scannerLoading, setScannerLoading] = useState(false);

  const isMl = i18n.language === 'ml';

  useEffect(() => {
    // Fetch categories with guides
    api.get('/waste-info/categories/')
      .then(res => {
        setCategories(res.data);
        if (res.data.length > 0) setSelectedCategory(res.data[0]);
      })
      .catch(err => console.warn(err));

    // Fetch facts & tips
    api.get('/waste-info/facts/').then(res => setFacts(res.data)).catch(err => console.warn(err));
    api.get('/waste-info/tips/').then(res => setTips(res.data)).catch(err => console.warn(err));
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScannerImage(file);
      setScannerPreview(URL.createObjectURL(file));
      setScannerResult(null);
    }
  };

  const runAIScanner = async () => {
    if (!scannerImage) {
      toast.error("Please upload or capture a photo first.");
      return;
    }
    setScannerLoading(true);
    const formData = new FormData();
    formData.append('photo', scannerImage);
    formData.append('language', i18n.language);

    try {
      const res = await api.post('/ai/identify-waste/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setScannerResult(res.data);
      toast.success("AI Analysis Complete!");
    } catch (err) {
      toast.error("AI scanning failed. Please try again.");
    } finally {
      setScannerLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name_en.toLowerCase().includes(q) || c.name_ml.toLowerCase().includes(q) || c.bin_color_en.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 dark:text-white">
          {isMl ? "മാലിന്യ തരംതിരിക്കൽ സമഗ്ര മാർഗ്ഗരേഖ" : "Comprehensive Kochi Waste Guide"}
        </h1>
        <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base">
          {isMl 
            ? "ശാസ്ത്രീയമായ തരംതിരിക്കൽ, ബിൻ നിറങ്ങൾ, വസ്തുതകൾ, പ്രായോഗിക ടിപ്പുകൾ എന്നിവ അറിയാം."
            : "Search bins, segregation rules, Kerala waste facts, and identify items with multimodal AI."
          }
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 rounded-2xl bg-stone-200/80 dark:bg-stone-800 border border-stone-300 dark:border-stone-700">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-white dark:bg-[#1F5D3A] text-stone-900 dark:text-white shadow-md'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            {isMl ? "എങ്ങനെ വേർതിരിക്കണം" : "How to Dispose (Categories)"}
          </button>

          <button
            onClick={() => setActiveTab('ai-scanner')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'ai-scanner'
                ? 'bg-[#1F5D3A] text-white shadow-md glow-primary'
                : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900'
            }`}
          >
            <SparklesIcon className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>{isMl ? "AI ഫോട്ടോ സ്കാനർ" : "AI Photo Scanner"}</span>
          </button>

          <button
            onClick={() => setActiveTab('facts')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'facts'
                ? 'bg-white dark:bg-[#1F5D3A] text-stone-900 dark:text-white shadow-md'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            {isMl ? "വസ്തുതകൾ (Facts)" : "Waste Facts"}
          </button>

          <button
            onClick={() => setActiveTab('tips')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'tips'
                ? 'bg-white dark:bg-[#1F5D3A] text-stone-900 dark:text-white shadow-md'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            {isMl ? "ടിപ്പുകൾ (Tips)" : "Practical Tips"}
          </button>
        </div>
      </div>

      {/* TAB 1: How to Dispose (Categories + Full Guides) */}
      {activeTab === 'categories' && (
        <div className="space-y-8">
          {/* Search bar */}
          <div className="max-w-md mx-auto relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category, e.g. plastic, glass, food..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-[#1F5D3A] outline-hidden shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Category selection list */}
            <div className="lg:col-span-4 space-y-2.5">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    selectedCategory?.id === cat.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-emerald-300'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-stone-900 dark:text-white">
                      {isMl ? cat.name_ml : cat.name_en}
                    </p>
                    <span 
                      className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: cat.color_hex }}
                    >
                      {isMl ? cat.bin_color_ml : cat.bin_color_en}
                    </span>
                  </div>
                  {cat.is_scrap_eligible && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                      Scrap Cash
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Detailed Guide view for selected category */}
            <div className="lg:col-span-8">
              {selectedCategory ? (
                <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-emerald-500/20 shadow-xl">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-700">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
                        {isMl ? selectedCategory.name_ml : selectedCategory.name_en}
                      </h2>
                      <p className="text-xs text-stone-500 mt-1">
                        {isMl ? selectedCategory.description_ml : selectedCategory.description_en}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div 
                        className="px-3 py-1.5 rounded-xl text-white font-bold text-xs shadow-xs"
                        style={{ backgroundColor: selectedCategory.color_hex }}
                      >
                        {isMl ? selectedCategory.bin_color_ml : selectedCategory.bin_color_en}
                      </div>

                      {selectedCategory.is_scrap_eligible && (
                        <Link
                          to="/sell-scrap"
                          className="px-3 py-1.5 rounded-xl bg-[#D4A017] text-stone-950 font-bold text-xs shadow-xs hover:bg-amber-400 transition-colors"
                        >
                          Sell as Scrap
                        </Link>
                      )}
                    </div>
                  </div>

                  {selectedCategory.guide ? (
                    <div className="space-y-6 text-sm">
                      
                      {/* What it is */}
                      <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
                        <h4 className="font-bold text-stone-900 dark:text-white text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          {isMl ? "എന്താണ് ഇത്?" : "What it is"}
                        </h4>
                        <p className="text-stone-700 dark:text-stone-300">
                          {isMl ? selectedCategory.guide.what_it_is_ml : selectedCategory.guide.what_it_is_en}
                        </p>
                      </div>

                      {/* Do's and Don'ts */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                          <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                            <span>{isMl ? "ചെയ്യേണ്ടവ (Do's)" : "Do's"}</span>
                          </h4>
                          <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                            {(isMl ? selectedCategory.guide.dos_ml : selectedCategory.guide.dos_en)?.map((d, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-600">•</span>
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2">
                          <h4 className="font-bold text-rose-800 dark:text-rose-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <XCircleIcon className="w-4 h-4 text-rose-600" />
                            <span>{isMl ? "ചെയ്യാൻ പാടില്ലാത്തവ (Don'ts)" : "Don'ts"}</span>
                          </h4>
                          <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                            {(isMl ? selectedCategory.guide.donts_ml : selectedCategory.guide.donts_en)?.map((d, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-rose-600">•</span>
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Who collects and how to prepare */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            {isMl ? "ആരാണ് ശേഖരിക്കുന്നത്?" : "Who Collects It?"}
                          </h4>
                          <p className="text-stone-700 dark:text-stone-300 text-xs font-semibold">
                            {isMl ? selectedCategory.guide.who_collects_ml : selectedCategory.guide.who_collects_en}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-teal-700 dark:text-teal-400">
                            {isMl ? "എങ്ങനെ നൽകണം?" : "How to Prepare"}
                          </h4>
                          <p className="text-stone-700 dark:text-stone-300 text-xs">
                            {isMl ? selectedCategory.guide.how_to_prepare_ml : selectedCategory.guide.how_to_prepare_en}
                          </p>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <p className="text-stone-500 text-sm">Disposal guide details being compiled by municipal team.</p>
                  )}

                  <div className="pt-4 flex gap-3">
                    <Link
                      to="/book-pickup"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1F5D3A] text-white font-bold text-xs shadow-md hover:bg-[#17482d] transition-all"
                    >
                      <span>Book Pickup for this Waste</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                </div>
              ) : null}
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: AI Multimodal Photo Waste Scanner */}
      {activeTab === 'ai-scanner' && (
        <div className="max-w-3xl mx-auto glass-card rounded-3xl p-6 sm:p-10 space-y-8 border border-emerald-500/20 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <SparklesIcon className="w-4 h-4 text-amber-400" />
              <span>Google Gemini 2.5 Vision Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
              {isMl ? "ഫോട്ടോ വഴി മാലിന്യം തിരിച്ചറിയാം" : "Instant Photo Waste Classifier"}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              Upload a picture of any item, wrapper, bottle or circuit board. Our AI returns the proper bin color, segregation steps, and whether you can sell it for scrap cash in Kochi.
            </p>
          </div>

          {/* Upload Area */}
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-emerald-500/40 rounded-3xl bg-emerald-50/30 dark:bg-emerald-950/20 space-y-4">
            {scannerPreview ? (
              <div className="relative group max-w-xs overflow-hidden rounded-2xl shadow-lg border border-stone-300 dark:border-stone-700">
                <img src={scannerPreview} alt="Waste item preview" className="w-full h-56 object-cover" />
                <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center font-bold text-xs opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  Change Photo
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center cursor-pointer space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-[#1F5D3A] dark:text-emerald-300">
                  <CameraIcon className="w-7 h-7" />
                </div>
                <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
                  Upload Photo or Take Picture
                </span>
                <span className="text-xs text-stone-500">Supports JPG, PNG up to 8MB</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}

            <button
              onClick={runAIScanner}
              disabled={scannerLoading || !scannerImage}
              className="px-6 py-3 rounded-2xl bg-[#1F5D3A] hover:bg-[#16472c] text-white font-bold text-sm shadow-xl disabled:opacity-50 transition-all flex items-center gap-2 glow-primary"
            >
              {scannerLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Analyzing with Gemini...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4 text-amber-300" />
                  <span>Classify & Suggest Disposal</span>
                </>
              )}
            </button>
          </div>

          {/* AI Structured JSON Result Card */}
          {scannerResult && (
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-800 border-2 border-emerald-500/30 shadow-xl space-y-5 animate-in fade-in duration-300">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-700">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                    Confidence: {(Number(scannerResult.confidence_score) * 100).toFixed(0)}%
                  </span>
                  <h3 className="text-xl font-black text-stone-900 dark:text-white">
                    {scannerResult.item_name}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-bold text-xs border border-blue-300">
                    {scannerResult.bin_color}
                  </span>
                  {scannerResult.is_scrap_eligible && (
                    <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold text-xs border border-amber-300">
                      Eligible for Scrap Cash
                    </span>
                  )}
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-stone-500">
                  Step-by-Step Disposal:
                </h4>
                <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                  {scannerResult.disposal_steps?.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {scannerResult.note && (
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-400">
                  <strong>Kochi Note:</strong> {scannerResult.note}
                </div>
              )}

              {/* Action Shortcuts */}
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to="/book-pickup"
                  className="px-4 py-2 rounded-xl bg-[#1F5D3A] text-white font-bold text-xs shadow-xs hover:bg-[#17482d]"
                >
                  Book Pickup
                </Link>
                {scannerResult.is_scrap_eligible && (
                  <Link
                    to="/sell-scrap"
                    className="px-4 py-2 rounded-xl bg-[#D4A017] text-stone-950 font-bold text-xs shadow-xs hover:bg-amber-400"
                  >
                    Sell as Scrap
                  </Link>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 3: Waste Facts */}
      {activeTab === 'facts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facts.map((f) => (
            <div key={f.id} className="glass-card p-6 rounded-3xl space-y-3 border border-emerald-500/20 hover:shadow-xl transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <span className="inline-block text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {f.tag}
                </span>
                <p className="text-sm font-semibold text-stone-900 dark:text-white leading-relaxed">
                  {isMl ? f.fact_ml : f.fact_en}
                </p>
              </div>
              <p className="text-[11px] text-stone-400 pt-2 border-t border-stone-200 dark:border-stone-700 italic">
                Source: {isMl ? f.source_ml : f.source_en}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Practical Tips */}
      {activeTab === 'tips' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tips.map((t) => (
            <div key={t.id} className="glass-card p-6 rounded-3xl space-y-3 border border-emerald-500/20 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  {t.category}
                </span>
                {t.is_today_tip && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ⭐ Today's Tip
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base text-stone-900 dark:text-white">
                {isMl ? t.title_ml : t.title_en}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {isMl ? t.content_ml : t.content_en}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default WasteGuidePage;
