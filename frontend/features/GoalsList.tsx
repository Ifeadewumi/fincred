
import React, { useState } from 'react';
import { useStore } from '../store';
import { Plus, Target, ChevronRight, TrendingUp, Edit3, Trash2, X, Info, Sparkles, Pause, Play, CheckCircle } from 'lucide-react';
import { Button } from '../components/Button';

export const GoalsList: React.FC = () => {
  const { goals, updateGoal, deleteGoal, createActionPlan } = useStore();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [actionPlanType, setActionPlanType] = useState('automated_transfer');
  const [actionFrequency, setActionFrequency] = useState('monthly');
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateAmount, setUpdateAmount] = useState('');
  const [showAdjust, setShowAdjust] = useState(false);
  const [filter, setFilter] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');

  const goal = goals.find(g => g.id === selectedGoal);

  const handleUpdate = () => {
    if (goal && updateAmount) {
      const amt = parseFloat(updateAmount);
      updateGoal({ ...goal, currentAmount: goal.currentAmount + amt });
      setShowUpdate(false);
      setUpdateAmount('');
    }
  };

  const toggleStatus = () => {
    if (goal) {
      const newStatus = goal.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      updateGoal({ ...goal, status: newStatus });
    }
  };

  const markComplete = () => {
    if (goal) {
      updateGoal({ ...goal, status: 'COMPLETED' });
      setSelectedGoal(null);
    }
  };

  if (selectedGoal && goal) {
    return (
      <div className="p-6 space-y-8 animate-in slide-in-from-bottom duration-300">
        <button onClick={() => setSelectedGoal(null)} className="text-slate-400 font-bold mb-4 flex items-center gap-2"><X size={18} /> Close</button>

        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 text-center space-y-6 relative overflow-hidden">
          {goal.status === 'PAUSED' && (
            <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
              <Pause size={10} fill="currentColor" /> PAUSED
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

          <div className="grid grid-cols-4 gap-2">
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
            <button onClick={() => { if (confirm('Delete this goal?')) { deleteGoal(goal.id); setSelectedGoal(null); } }} className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center gap-1">
              <Trash2 className="text-rose-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Delete</span>
            </button>
          </div>

          <div className="flex gap-2">
            <Button size="full" onClick={() => setShowUpdate(true)} disabled={goal.status !== 'ACTIVE'}>Log Progress</Button>
            <Button variant="secondary" onClick={() => setShowActionPlan(true)}>Add Action Plan</Button>
          </div>
        </div>

        {showActionPlan && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl w-full max-w-sm p-8 space-y-6 animate-in zoom-in duration-300">
              <h3 className="text-xl font-bold">Create Action Plan</h3>
              <p className="text-slate-500">Automate your success.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">TYPE</label>
                  <select className="w-full p-3 bg-slate-50 rounded-xl" value={actionPlanType} onChange={e => setActionPlanType(e.target.value)}>
                    <option value="automated_transfer">Automated Transfer</option>
                    <option value="manual_habit">Manual Habit (Save Cash)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">FREQUENCY</label>
                  <select className="w-full p-3 bg-slate-50 rounded-xl" value={actionFrequency} onChange={e => setActionFrequency(e.target.value)}>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">AMOUNT</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                    <input type="number" className="w-full p-3 pl-8 bg-slate-50 rounded-xl font-bold" placeholder="0.00" id="ap-amount" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setShowActionPlan(false)}>Cancel</Button>
                <Button className="flex-1" onClick={() => {
                  const amtCtx = document.getElementById('ap-amount') as HTMLInputElement;
                  if (amtCtx && amtCtx.value) {
                    createActionPlan(goal.id, {
                      type: actionPlanType,
                      frequency: actionFrequency,
                      amount: parseFloat(amtCtx.value)
                    });
                    setShowActionPlan(false);
                    alert('Action Plan Created!');
                  }
                }}>Create</Button>
              </div>
            </div>
          </div>
        )}

        {showUpdate && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl w-full max-w-sm p-8 space-y-6 animate-in zoom-in duration-300">
              <h3 className="text-xl font-bold">Log Progress</h3>
              <p className="text-slate-500">How much did you verify saving?</p>
              <div className="relative">
                <span className="absolute left-4 top-4 text-slate-400 font-bold">$</span>
                <input type="number" className="w-full p-4 pl-8 rounded-xl border text-2xl font-bold" value={updateAmount} onChange={(e) => setUpdateAmount(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setShowUpdate(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleUpdate}>Save</Button>
              </div>
            </div>
          </div>
        )}
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
