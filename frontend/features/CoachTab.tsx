
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { getCheckInFeedback } from '../services/gemini';
import { Star, Smile, Frown, Meh, SmilePlus, Angry, Send, History, BookOpen, ChevronRight, GraduationCap, MessageCircle, Info, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export const CoachTab: React.FC = () => {
  const { checkIns, addCheckIn, messages, setMessages, user } = useStore();
  const [mode, setMode] = useState<'chat' | 'checkin' | 'library'>('chat');
  const [checkingIn, setCheckingIn] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = { id: Date.now().toString(), role: 'user' as const, text: inputText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    // Placeholder for real AI integration
    setTimeout(() => {
      const modelMsg = { id: (Date.now() + 1).toString(), role: 'model' as const, text: `I'm analyzing your request regarding "${inputText}". Based on your current monthly surplus of ${user.currency}${user.monthlyIncome - user.fixedExpenses}, you have a strong buffer.`, timestamp: new Date() };
      setMessages(prev => [...prev, modelMsg]);
      setLoading(false);
    }, 1500);
  };

  const renderChat = () => (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${
              m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border rounded-tl-none shadow-sm'
            }`}>
              <p className="text-sm leading-relaxed">{m.text}</p>
              <div className={`text-[10px] mt-1 opacity-50 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2">
        <input 
          className="flex-1 bg-slate-50 border-none rounded-xl px-4 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          placeholder="Ask your coach anything..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <button type="submit" className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors">
          <Send size={20} />
        </button>
      </form>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen">
      <header className="p-6 bg-white border-b sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Coach</h1>
          <button onClick={() => setMode('checkin')} className="bg-emerald-50 text-emerald-600 text-xs font-black px-4 py-2 rounded-full flex items-center gap-2">
            <Sparkles size={14} /> WEEKLY CHECK-IN
          </button>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setMode('chat')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'chat' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>CHAT</button>
          <button onClick={() => setMode('library')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'library' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>LIBRARY</button>
        </div>
      </header>

      {mode === 'chat' && renderChat()}
      {mode === 'library' && <EducationLibrary />}
      {mode === 'checkin' && <CheckInFlow onExit={() => setMode('chat')} />}
    </div>
  );
};

const EducationLibrary = () => {
  const snippets = [
    { title: 'Debt Snowball Method', topic: 'debt_methods', desc: 'Focus on small wins first.' },
    { title: 'Debt Avalanche', topic: 'debt_methods', desc: 'Save the most interest over time.' },
    { title: 'The 4% Rule', topic: 'fire_basics', desc: 'Sustainable retirement withdrawal.' },
    { title: 'Emergency Fund 101', topic: 'emergency_fund', desc: 'Why 3-6 months matters.' }
  ];

  return (
    <div className="p-6 space-y-4 animate-in slide-in-from-right">
      {snippets.map((s, i) => (
        <button key={i} className="w-full bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <BookOpen size={24} />
            </div>
            <div>
              <div className="font-bold text-slate-900">{s.title}</div>
              <div className="text-xs text-slate-400">{s.desc}</div>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-300" />
        </button>
      ))}
    </div>
  );
};

const CheckInFlow = ({ onExit }: { onExit: () => void }) => {
  // Reusing Logic from previous implementation but with better styling
  return (
    <div className="fixed inset-0 z-[100] bg-white p-6">
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-xl font-bold">Weekly Check-in</h2>
        <button onClick={onExit} className="text-slate-400"><Info size={24} /></button>
      </div>
      <div className="text-center space-y-8 py-20">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center animate-pulse">
          <Sparkles size={48} />
        </div>
        <h3 className="text-2xl font-bold">Let's reflect on your week.</h3>
        <p className="text-slate-500">Updating your data helps the Coach provide better advice.</p>
        <Button size="full" onClick={onExit}>Start Now</Button>
      </div>
    </div>
  );
}
