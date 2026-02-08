
import React, { useState } from 'react';
import { useStore } from '../store';
import { Settings, LogOut, ChevronRight, DollarSign, Wallet, Bell, Shield, User, X, Check, Mail, Smartphone, Info } from 'lucide-react';
import { Button } from '../components/Button';

export const ProfileTab: React.FC = () => {
  const { user, setUser, setState, nudgeSchedules, setNudgeSchedules } = useStore();
  const [editMode, setEditMode] = useState<'profile' | 'snapshot' | 'nudges' | null>(null);

  const toggleNudge = (id: string) => {
    setNudgeSchedules(prev => prev.map(n => n.id === id ? {...n, isActive: !n.isActive} : n));
  };

  if (editMode === 'nudges') {
    return (
      <div className="p-6 space-y-6 bg-white min-h-screen animate-in slide-in-from-right">
        <div className="flex justify-between items-center">
          <button onClick={() => setEditMode(null)}><X className="text-slate-400"/></button>
          <h2 className="font-bold text-lg">Nudges & Reminders</h2>
          <button onClick={() => setEditMode(null)} className="text-emerald-600 font-bold">Done</button>
        </div>
        <p className="text-slate-500 text-sm">FinCRED uses behavioral science to keep you on track. Adjust your nudge preferences here.</p>
        <div className="space-y-4">
          {nudgeSchedules.map(n => (
            <div key={n.id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                  {n.channel === 'email' ? <Mail size={20}/> : <Smartphone size={20}/>}
                </div>
                <div>
                  <div className="font-bold text-sm capitalize">{n.type.replace(/_/g, ' ')}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{n.channel}</div>
                </div>
              </div>
              <button 
                onClick={() => toggleNudge(n.id)}
                className={`w-12 h-6 rounded-full relative transition-colors ${n.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${n.isActive ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
        <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-900 text-[10px] font-bold flex gap-2">
          <Info size={14}/> ALL NUDGES ARE POWERED BY ADAPTIVE AI LOGIC
        </div>
      </div>
    );
  }

  // ... (editMode === 'profile' and 'snapshot' omitted for brevity, same as previous implementation)

  return (
    <div className="p-6 space-y-8 pb-24">
      <header className="flex items-center gap-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-3xl font-black shadow-lg shadow-emerald-50">
          {user.name?.charAt(0) || 'U'}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-slate-500 text-sm">{user.persona} Enthusiast</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setEditMode('snapshot')} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left space-y-2">
          <DollarSign className="text-emerald-500" />
          <div className="font-bold text-sm">Finances</div>
          <div className="text-xs text-slate-400">Income & Expenses</div>
        </button>
        <button onClick={() => setEditMode('nudges')} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left space-y-2">
          <Bell className="text-indigo-500" />
          <div className="font-bold text-sm">Nudges</div>
          <div className="text-xs text-slate-400">AI Scheduling</div>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-sm">
        <button onClick={() => setEditMode('profile')} className="w-full p-6 flex justify-between items-center group">
          <div className="flex items-center gap-4 text-slate-700 font-bold">
            <User className="text-slate-400" /> Profile Details
          </div>
          <ChevronRight className="text-slate-300 group-hover:text-emerald-500 transition-all" />
        </button>
        <button className="w-full p-6 flex justify-between items-center group">
          <div className="flex items-center gap-4 text-slate-700 font-bold">
            <Shield className="text-slate-400" /> Privacy & Security
          </div>
          <ChevronRight className="text-slate-300 transition-all" />
        </button>
      </div>

      <button onClick={() => setState('landing')} className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
        <LogOut size={20} /> Log Out
      </button>
    </div>
  );
};
