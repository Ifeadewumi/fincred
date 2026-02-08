
import React, { useState } from 'react';
import { useStore } from '../store';
import { TrendingUp, Plus, ChevronRight, Zap, Play, Calculator, ArrowDown, HelpCircle, X } from 'lucide-react';
import { Button } from '../components/Button';

export const PlanningEngine: React.FC = () => {
  const { user, goals } = useStore();
  const [showSim, setShowSim] = useState(false);

  const surplus = user.monthlyIncome - user.fixedExpenses;
  const totalPlanned = goals.reduce((acc, g) => acc + g.monthlyContribution, 0);

  return (
    <div className="p-6 space-y-8 pb-24">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Plan</h1>
        <button onClick={() => setShowSim(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-100">
          <Calculator size={16} /> SIMULATOR
        </button>
      </header>

      {/* Financial Waterfall Visualization */}
      <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Monthly Cashflow</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Net Income</span>
            <span className="font-bold text-emerald-600">+${user.monthlyIncome}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 px-4"><ArrowDown size={14}/></div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Must-Haves</span>
            <span className="font-bold text-rose-500">-${user.fixedExpenses}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 px-4"><ArrowDown size={14}/></div>
          <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <span className="font-bold text-emerald-900">Total Surplus</span>
            <span className="font-black text-emerald-700">${surplus}</span>
          </div>
        </div>
      </section>

      {/* Priority Allocation (The Waterfall) */}
      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
          Goal Allocation <HelpCircle size={14}/>
        </h3>
        {goals.map((g, i) => (
          <div key={g.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">#{i+1}</div>
              <div>
                <div className="font-bold text-slate-900">{g.name}</div>
                <div className="text-xs text-slate-400">{g.priority} Priority</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-black text-slate-900">${g.monthlyContribution}</div>
              <div className="text-[10px] text-emerald-600 font-bold uppercase">Allocated</div>
            </div>
          </div>
        ))}
        {surplus - totalPlanned > 0 && (
          <div className="bg-slate-100 p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400 text-xs font-bold">
            UNUSED BUFFER: ${surplus - totalPlanned}
          </div>
        )}
      </section>

      {showSim && <ScenarioSimulator onClose={() => setShowSim(false)} />}
    </div>
  );
};

const ScenarioSimulator = ({ onClose }: { onClose: () => void }) => {
  const [inc, setInc] = useState(0);
  const [cost, setCost] = useState(0);

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-8 space-y-8 animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Calculator className="text-indigo-600"/> What-If Sandbox</h2>
          <button onClick={onClose}><X className="text-slate-400"/></button>
        </div>
        <p className="text-slate-500 text-sm">See how small changes affect your time to financial freedom.</p>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">One-time windfal / Extra income ($)</label>
            <input type="number" className="w-full p-4 rounded-2xl border-2 border-slate-100 font-bold text-xl" value={inc || ''} onChange={e => setInc(parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">One-time expense / Purchase ($)</label>
            <input type="number" className="w-full p-4 rounded-2xl border-2 border-slate-100 font-bold text-xl" value={cost || ''} onChange={e => setCost(parseFloat(e.target.value) || 0)} placeholder="0.00" />
          </div>
        </div>

        <div className="bg-indigo-600 p-6 rounded-3xl text-white space-y-2">
          <div className="flex justify-between"><span>Impact on Net Worth</span><span className="font-bold">{inc - cost >= 0 ? '+' : ''}${inc - cost}</span></div>
          <div className="flex justify-between text-xs text-indigo-100"><span>Timeline Shift</span><span className="font-bold">{inc - cost >= 0 ? '- 2 Weeks' : '+ 1 Week'}</span></div>
        </div>

        <Button size="full" variant="outline" onClick={onClose}>Close Simulator</Button>
      </div>
    </div>
  );
}
