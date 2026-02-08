
import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Target, ChevronRight, TrendingUp, Edit3, Trash2, X, Info, Sparkles, Pause, Play, CheckCircle } from 'lucide-react';
import { Button } from '../components/Button';

export const GoalsList: React.FC = () => {
  const { goals, setGoals } = useStore();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateAmount, setUpdateAmount] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);
  const [showEdu, setShowEdu] = useState(false);
  const [filter, setFilter] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');

  const goal = goals.find(g => g.id === selectedGoal);

  const handleUpdate = () => {
    if (goal && updateAmount) {
      const amt = parseFloat(updateAmount);
      setGoals(goals.map(g => g.id === goal.id ? { ...g, currentAmount: g.currentAmount + amt } : g));
      setShowUpdate(false);
      setUpdateAmount('');
    }
  };

  const toggleStatus = () => {
    if (goal) {
      const newStatus = goal.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      setGoals(goals.map(g => g.id === goal.id ? {...g, status: newStatus} : g));
    }
  };

  const markComplete = () => {
    if (goal) {
      setGoals(goals.map(g => g.id === goal.id ? {...g, status: 'COMPLETED'} : g));
      setSelectedGoal(null);
    }
  };

  if (selectedGoal && goal) {
    return (
      <div className="p-6 space-y-8 animate-in slide-in-from-bottom duration-300">
        <button onClick={() => setSelectedGoal(null)} className="text-slate-400 font-bold mb-4 flex items-center gap-2"><X size={18}/> Close</button>
        
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 text-center space-y-6 relative overflow-hidden">
          {goal.status === 'PAUSED' && (
             <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
               <Pause size={10} fill="currentColor"/> PAUSED
             </div>
          )}

          <div className="relative inline-block">
            <svg className="w-48 h-48 -rotate-90">
              <circle cx="96" cy="96" r="80" fill="none" stroke="#f1f5f9" strokeWidth="12" />
              <circle 
                cx="96" cy="96" r="80" fill="none" stroke={goal.status === 'PAUSED' ? '#cbd5e1' : '#10b981'} strokeWidth="12" 
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - goal.currentAmount / goal.targetAmount)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-black">${goal.currentAmount.toLocaleString()}</div>
              <div className="text-slate-400 text-sm font-medium">of ${goal.targetAmount.toLocaleString()}</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold">{goal.name}</h2>
          
          <div className="grid grid-cols-3 gap-2">
            <button onClick={toggleStatus} className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center gap-1">
              {goal.status === 'ACTIVE' ? <Pause className="text-amber-500" /> : <Play className="text-emerald-500" />}
              <span className="text-[10px] font-bold text-slate-500 uppercase">{goal.status === 'ACTIVE' ? 'Pause' : 'Resume'}</span>
            </button>
            <button onClick={markComplete} className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center gap-1">
              <CheckCircle className="text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Finish</span>
            </button>
            <button onClick={() => setShowAdjust(true)} className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center gap-1">
              <Edit3 className="text-indigo-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Edit</span>
            </button>
          </div>
          
          <Button size="full" onClick={() => setShowUpdate(true)} disabled={goal.status !== 'ACTIVE'}>Log Manual Progress</Button>
        </div>
      </div>
    );
  }

  const filteredGoals = goals.filter(g => filter === 'ACTIVE' ? (g.status === 'ACTIVE' || g.status === 'PAUSED') : g.status === 'COMPLETED');

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Plan</h1>
        <button className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200"><Plus size={24} /></button>
      </header>

      <div className="flex bg-slate-200/50 p-1 rounded-xl">
        <button onClick={() => setFilter('ACTIVE')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${filter === 'ACTIVE' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>ACTIVE</button>
        <button onClick={() => setFilter('COMPLETED')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${filter === 'COMPLETED' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>COMPLETED</button>
      </div>

      <div className="grid gap-4">
        {filteredGoals.map((goal) => (
          <button key={goal.id} onClick={() => setSelectedGoal(goal.id)} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all text-left">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${goal.status === 'PAUSED' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <TrendingUp size={28} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{goal.name}</h3>
                <p className="text-sm text-slate-500">${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-300" />
          </button>
        ))}
        {filteredGoals.length === 0 && (
          <div className="p-12 text-center text-slate-400">No {filter.toLowerCase()} goals found.</div>
        )}
      </div>
    </div>
  );
};
