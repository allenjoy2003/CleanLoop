import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import {
  ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon,
  SparklesIcon, CameraIcon, BookOpenIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AIChatbotWidget = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: i18n.language === 'ml' 
        ? "നമസ്കാരം! ഞാൻ ക്ലീൻ ലൂപ്പ് AI അസിസ്റ്റന്റാണ്. കൊച്ചിയിലെ മാലിന്യ തരംതിരിക്കൽ, ബിന്നുകൾ, പിഴകൾ എന്നിവയെക്കുറിച്ച് ചോദിക്കാം."
        : "Hello! I am Clean Loop Kochi Assistant. Ask me how to sort waste, find which bin to use, check penalties, or estimate scrap value."
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMessage = { id: Date.now(), sender: 'user', text: inputText.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat/', {
        prompt: userMessage.text,
        language: i18n.language
      });

      const replyText = res.data.response || "I am currently unable to answer. Please check the waste guide.";
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        text: replyText
      }]);
    } catch (err) {
      toast.error("Failed to connect to AI assistant.");
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'assistant',
        text: "Sorry, I encountered an error. Please try again in a moment."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#1F5D3A] text-white font-semibold shadow-2xl hover:bg-[#18482d] hover:scale-105 transition-all glow-primary"
        >
          <SparklesIcon className="w-5 h-5 text-amber-300 animate-pulse" />
          <span className="text-sm">Kochi AI Assistant</span>
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] glass-card rounded-2xl shadow-2xl flex flex-col border border-emerald-600/30 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="p-4 bg-[#1F5D3A] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Clean Loop AI Assistant</h3>
                <p className="text-[11px] text-emerald-200">Grounded in Kochi Waste Rules</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-emerald-100 hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF5E9]/50 dark:bg-stone-900/60">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] p-3 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#1F5D3A] text-white rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-bl-none border border-stone-200 dark:border-stone-700 shadow-xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-stone-800 p-3 rounded-2xl text-xs text-stone-500 rounded-bl-none flex items-center gap-2 border border-stone-200 dark:border-stone-700">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className="px-3 py-2 bg-stone-100 dark:bg-stone-800/80 border-t border-stone-200 dark:border-stone-700 flex gap-1.5 overflow-x-auto text-[11px] text-stone-600 dark:text-stone-300">
            <button
              onClick={() => setInputText("Which bin for milk packets?")}
              className="px-2 py-1 rounded-md bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 whitespace-nowrap hover:bg-emerald-50"
            >
              🥛 Milk packets bin?
            </button>
            <button
              onClick={() => setInputText("What is fine for burning leaves?")}
              className="px-2 py-1 rounded-md bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 whitespace-nowrap hover:bg-emerald-50"
            >
              🔥 Fine for burning?
            </button>
            <button
              onClick={() => setInputText("Current rate of copper wire?")}
              className="px-2 py-1 rounded-md bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 whitespace-nowrap hover:bg-emerald-50"
            >
              ⚡ Copper rate?
            </button>
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything about waste in Kochi..."
              className="flex-1 px-3 py-2 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-300 dark:border-stone-700 focus:outline-hidden focus:ring-2 focus:ring-[#1F5D3A] text-stone-900 dark:text-stone-100"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2 rounded-xl bg-[#1F5D3A] hover:bg-[#18482d] text-white disabled:opacity-50 transition-colors"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIChatbotWidget;
