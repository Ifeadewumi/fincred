
import React from 'react';
import { useStore } from '../store';
import { Flame, Target, ChevronRight, AlertCircle, Clock, Award, TrendingUp, Sparkles } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { streak, goals, user, milestones } = useStore();
  const topGoal = goals[0];

  return (
    <div className="p-6 space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user.name}!</p>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-50 px-4 py-2 rounded-full border border-orange-100 text-orange-600 font-bold shadow-sm">
          <Flame size={20} fill="currentColor" />
          <span>{streak} Week Streak!</span>
        </div>
      </header>

      {/* Primary Goal Focus */}
      {topGoal ? (
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Target size={120} />
          </div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="text-emerald-500" size={20} />
                <h3 className="font-bold text-lg">{topGoal.name}</h3>
              </div>
              <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">
                {topGoal.status}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-slate-900">
                {Math.round((topGoal.currentAmount / topGoal.targetAmount) * 100)}%
              </div>
            </div>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full mb-6 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.4)]" 
              style={{ width: `${(topGoal.currentAmount / topGoal.targetAmount) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Remaining</div>
              <div className="text-xl font-bold">${(topGoal.targetAmount - topGoal.currentAmount).toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Target</div>
              <div className="text-xl font-bold">{new Date(topGoal.targetDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
        </section>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
          <Sparkles className="mx-auto mb-4 text-emerald-400" size={32} />
          <p className="text-slate-500 font-medium">Your journey starts here.</p>
          <button className="mt-4 text-emerald-600 font-bold">Define your first goal</button>
        </div>
      )}

      {/* Milestones & Behavioral Celebrations */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Award size={16} /> Recent Achievements
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {milestones.map((m, i) => (
            <div key={i} className="flex-shrink-0 bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Award size={20} />
              </div>
              <span className="font-bold text-sm whitespace-nowrap">{m}</span>
            </div>
          ))}
        </div>
      </section>

      {/* AI Dynamic Nudge */}
      <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <TrendingUp size={120} />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <div className="font-bold text-lg">Weekly Summary</div>
              <p className="text-indigo-100 text-sm">You're 12% ahead of schedule this month!</p>
            </div>
          </div>
          <ChevronRight className="opacity-50" />
        </div>
      </div>
    </div>
  );
};
