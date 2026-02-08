
import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { getMotivationalQuote } from '../services/gemini';
import { Sparkles } from 'lucide-react';

export const LandingScreen: React.FC = () => {
  const { setState } = useStore();
  const [quote, setQuote] = useState<string>('Loading inspiration...');

  useEffect(() => {
    getMotivationalQuote().then(setQuote);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-emerald-600 text-white p-8">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm">
        <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-md shadow-2xl">
          <Sparkles size={48} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-4">FinCRED</h1>
        <p className="text-xl text-emerald-50 mb-8 opacity-90">Turn financial goals into done.</p>
        
        <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10 mb-8">
          <p className="italic text-lg">"{quote}"</p>
          <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-emerald-100">AI TIP OF THE DAY</div>
        </div>
      </div>

      <div className="w-full space-y-4 max-w-sm mb-12">
        <Button 
          variant="primary" 
          size="full" 
          className="bg-white text-emerald-600 shadow-none hover:bg-emerald-50"
          onClick={() => setState('auth')}
        >
          Get Started
        </Button>
        <button 
          onClick={() => setState('auth')}
          className="w-full py-2 font-medium text-emerald-100 hover:text-white transition-colors"
        >
          Log In
        </button>
      </div>
    </div>
  );
};
