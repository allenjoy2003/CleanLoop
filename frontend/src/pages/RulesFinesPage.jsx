import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import {
  ExclamationTriangleIcon, MagnifyingGlassIcon,
  SparklesIcon, InformationCircleIcon, ScaleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const RulesFinesPage = () => {
  const { t, i18n } = useTranslation();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Rules Q&A Assistant state
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState(null);
  const [qaLoading, setQaLoading] = useState(false);

  const isMl = i18n.language === 'ml';

  useEffect(() => {
    api.get('/waste-info/rules/')
      .then(res => {
        setRules(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.warn(err);
        setLoading(false);
      });
  }, []);

  const handleAskQA = async (e) => {
    e?.preventDefault();
    if (!qaQuestion.trim() || qaLoading) return;
    setQaLoading(true);

    try {
      const res = await api.post('/ai/rules-qa/', {
        question: qaQuestion,
        language: i18n.language
      });
      setQaAnswer(res.data);
    } catch (err) {
      toast.error("Failed to answer question. Please check the rules table below.");
    } finally {
      setQaLoading(false);
    }
  };

  const filteredRules = rules.filter(r => {
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    const q = searchTerm.toLowerCase();
    const matchesSearch = r.rule_en.toLowerCase().includes(q) || 
                          r.rule_ml.toLowerCase().includes(q) || 
                          r.penalty_en.toLowerCase().includes(q) || 
                          r.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Title & Statutory Disclaimer Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 dark:text-white">
          {isMl ? "കൊച്ചി മാലിന്യ നിയമങ്ങളും പിഴകളും" : "Kochi Waste Rules & Penalties Directory"}
        </h1>
        <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base">
          {isMl 
            ? "അലക്ഷ്യമായി മാലിന്യം തള്ളൽ, തീയിടൽ, പ്ലാസ്റ്റിക് നിരോധനം എന്നിവ സംബന്ധിച്ച നിയമങ്ങൾ."
            : "Search applicable bye-laws and fines in Kochi city, ask plain-language questions, and stay compliant."
          }
        </p>

        {/* Mandatory Visible Disclaimer */}
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/40 text-amber-900 dark:text-amber-300 text-xs text-left flex items-start gap-3 shadow-xs">
          <InformationCircleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">
              {isMl ? "നിയമപരമായ അറിയിപ്പ്" : "Statutory Notice"}
            </span>
            <p className="font-medium leading-relaxed">
              <strong>Indicative information.</strong> Verify current rules, bye-laws, and fine amounts with Kochi Municipal Corporation / Kerala Local Self Government Department. Entries marked with a warning flag require independent verification before legal reliance.
            </p>
          </div>
        </div>
      </div>

      {/* Rules & Fines Plain-Language AI Assistant Box */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-xl space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1F5D3A] text-white flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="font-black text-lg text-stone-900 dark:text-white">
              {isMl ? "നിയമ സഹായി (Rules Q&A Assistant)" : "Plain-Language Rules Assistant"}
            </h3>
            <p className="text-xs text-stone-500">
              Ask questions like: "Can I burn dry leaves in my yard?", "What happens if a shop uses banned plastic?"
            </p>
          </div>
        </div>

        <form onSubmit={handleAskQA} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={qaQuestion}
            onChange={(e) => setQaQuestion(e.target.value)}
            placeholder="Type your question in English or Malayalam..."
            className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-[#1F5D3A] outline-hidden"
          />
          <button
            type="submit"
            disabled={qaLoading || !qaQuestion.trim()}
            className="px-6 py-3 rounded-2xl bg-[#1F5D3A] hover:bg-[#16482d] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 glow-primary"
          >
            {qaLoading ? "Searching Rules..." : "Ask Assistant"}
          </button>
        </form>

        {qaAnswer && (
          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-emerald-500/30 space-y-3 animate-in fade-in duration-300">
            <p className="text-sm font-semibold text-stone-900 dark:text-white leading-relaxed">
              {qaAnswer.answer}
            </p>
            {qaAnswer.relevant_rules?.length > 0 && (
              <div className="pt-2 border-t border-stone-200 dark:border-stone-700 space-y-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  Relevant Rule Reference:
                </span>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  {isMl ? qaAnswer.relevant_rules[0].rule_ml : qaAnswer.relevant_rules[0].rule_en} — <strong>Penalty: {isMl ? qaAnswer.relevant_rules[0].penalty_ml : qaAnswer.relevant_rules[0].penalty_en}</strong>
                </p>
              </div>
            )}
            <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
              {qaAnswer.disclaimer}
            </p>
          </div>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80 relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-3.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search rules, penalties, burning..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm focus:ring-2 focus:ring-[#1F5D3A] outline-hidden shadow-xs"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-[#1F5D3A] outline-hidden shadow-xs"
        >
          <option value="all">All Categories</option>
          <option value="open_dumping">Open Dumping & Littering</option>
          <option value="waste_burning">Waste Burning</option>
          <option value="waterbody_dumping">Canal & Lake Dumping</option>
          <option value="plastic_ban">Plastic Ban Violations</option>
          <option value="commercial">Commercial Generators</option>
          <option value="biomedical">Biomedical & Sanitary</option>
          <option value="construction">Construction Debris</option>
          <option value="e_waste">E-Waste Violations</option>
        </select>
      </div>

      {/* Rules and Fines Searchable Table */}
      <div className="overflow-x-auto rounded-3xl border border-stone-300 dark:border-stone-700 shadow-xl bg-white dark:bg-stone-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-100 dark:bg-stone-900 border-b border-stone-300 dark:border-stone-700 text-xs font-black uppercase tracking-wider text-stone-600 dark:text-stone-300">
              <th className="py-4 px-6">Category</th>
              <th className="py-4 px-6">Violation / Rule</th>
              <th className="py-4 px-6">Prescribed Penalty</th>
              <th className="py-4 px-6">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-700 text-xs sm:text-sm">
            {filteredRules.map((rule) => (
              <tr key={rule.id} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                <td className="py-4 px-6 font-bold whitespace-nowrap">
                  <span className="px-2.5 py-1 rounded-full bg-stone-200/80 dark:bg-stone-700 text-stone-800 dark:text-stone-200 text-[11px]">
                    {rule.category.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="py-4 px-6 max-w-md">
                  <p className="font-semibold text-stone-900 dark:text-white">
                    {isMl ? rule.rule_ml : rule.rule_en}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Source: {isMl ? rule.source_ml : rule.source_en}
                  </p>
                </td>
                <td className="py-4 px-6 font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                  {isMl ? rule.penalty_ml : rule.penalty_en}
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  {rule.needs_verification ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-extrabold text-[10px]">
                      <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-600" />
                      Verify with KMC
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold text-[10px]">
                      Verified
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filteredRules.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-stone-500">
                  No rules found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default RulesFinesPage;
