
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { UserProfile, Persona, Debt, Asset, Goal } from '../types';
import { ChevronRight, Plus, Trash2, CheckCircle, Info, ShieldCheck, Zap, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';
import { getFeasibilityExplanation } from '../services/gemini';

export const OnboardingFlow: React.FC = () => {
  const { setState, setUser, user, setGoals } = useStore();
  const [step, setStep] = useState(0);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(Math.max(0, step - 1));

  const renderStep = () => {
    switch (step) {
      case 0: return <IntroStep next={nextStep} user={user} setUser={setUser} />;
      case 1: return <FinancialSnapshotIncome next={nextStep} user={user} setUser={setUser} />;
      case 2: return <FinancialSnapshotExpenses next={nextStep} user={user} setUser={setUser} />;
      case 3: return <FinancialSnapshotDebts next={nextStep} user={user} setUser={setUser} />;
      case 4: return <FinancialSnapshotAssets next={nextStep} user={user} setUser={setUser} />;
      case 5: return <GoalDiscovery next={nextStep} user={user} setGoals={setGoals} />;
      case 6: return <PlanReview next={nextStep} user={user} prev={prevStep} />;
      case 7: return <CommitmentStep next={nextStep} />;
      case 8: return <ActionSetup finish={() => setState('main')} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24 flex flex-col">
      <div className="flex items-center gap-2 mb-8">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div 
            key={i} 
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= step ? 'bg-emerald-500' : 'bg-slate-200'
            }`} 
          />
        ))}
      </div>
      {renderStep()}
    </div>
  );
};

const IntroStep = ({ next, user, setUser }: any) => {
  const personas: Persona[] = ['Crush Debt', 'Build Safety Net', 'Start FIRE'];
  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">C</div>
        <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 max-w-[85%]">
          <p className="text-slate-800">Hi! I'm your FinCRED Coach. What brings you here today?</p>
        </div>
      </div>
      <div className="grid gap-3">
        {personas.map((p) => (
          <button key={p} onClick={() => { setUser({ ...user, persona: p }); next(); }} className={`p-4 rounded-xl border-2 text-left transition-all ${user.persona === p ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white'}`}>
            <div className="font-bold">{p}</div>
          </button>
        ))}
      </div>
      <div className="space-y-4">
        <label className="text-sm font-semibold text-slate-500 uppercase">Your Info</label>
        <input placeholder="Name" className="w-full p-4 rounded-xl border border-slate-200" value={user.name} onChange={(e) => setUser({...user, name: e.target.value})} />
        <div className="flex gap-3">
          <input type="number" placeholder="Age" className="w-20 p-4 rounded-xl border border-slate-200" value={user.age || ''} onChange={(e) => setUser({...user, age: parseInt(e.target.value)})} />
          <input placeholder="Country" className="flex-1 p-4 rounded-xl border border-slate-200" value={user.country} onChange={(e) => setUser({...user, country: e.target.value})} />
        </div>
      </div>
      <Button disabled={!user.name || !user.persona} onClick={next} size="full">Continue</Button>
    </div>
  );
};

const FinancialSnapshotIncome = ({ next, user, setUser }: any) => (
  <div className="space-y-8 animate-in slide-in-from-right">
    <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">C</div>
        <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
          <p>What's your monthly net income?</p>
        </div>
    </div>
    <div className="space-y-6">
      <div className="relative">
        <span className="absolute left-4 top-4 text-slate-400 font-bold">$</span>
        <input type="number" className="w-full p-4 pl-8 rounded-xl border text-2xl font-bold" value={user.monthlyIncome || ''} onChange={(e) => setUser({...user, monthlyIncome: parseFloat(e.target.value)})} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {['Monthly', 'Bi-weekly'].map(f => (
          <button key={f} onClick={() => setUser({...user, payFrequency: f as any})} className={`p-4 rounded-xl border-2 font-semibold ${user.payFrequency === f ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}>{f}</button>
        ))}
      </div>
    </div>
    <Button onClick={next} size="full" disabled={!user.monthlyIncome}>Next</Button>
  </div>
);

const FinancialSnapshotExpenses = ({ next, user, setUser }: any) => (
  <div className="space-y-8 animate-in slide-in-from-right">
    <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">C</div>
        <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
          <p>How much are your total fixed monthly expenses (Rent, Food, etc)?</p>
        </div>
    </div>
    <div className="relative">
      <span className="absolute left-4 top-4 text-slate-400 font-bold">$</span>
      <input type="number" className="w-full p-4 pl-8 rounded-xl border text-2xl font-bold" value={user.fixedExpenses || ''} onChange={(e) => setUser({...user, fixedExpenses: parseFloat(e.target.value)})} />
    </div>
    <Button onClick={next} size="full" disabled={!user.fixedExpenses}>Next</Button>
  </div>
);

const FinancialSnapshotDebts = ({ next, user, setUser }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newDebt, setNewDebt] = useState<Partial<Debt>>({ name: '', balance: 0, interestRate: 0, minPayment: 0 });
  return (
    <div className="space-y-8 animate-in slide-in-from-right">
      <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">C</div>
          <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
            <p>Any debts we should prioritize?</p>
          </div>
      </div>
      <div className="space-y-4">
        {user.debts.map((debt: Debt) => (
          <div key={debt.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
            <div><div className="font-bold">{debt.name}</div><div className="text-sm text-slate-500">${debt.balance} • {debt.interestRate}%</div></div>
            <button onClick={() => setUser({...user, debts: user.debts.filter((d: any) => d.id !== debt.id)})} className="text-slate-300 hover:text-rose-500"><Trash2 size={20} /></button>
          </div>
        ))}
        {isAdding ? (
          <div className="bg-white p-6 rounded-xl border-2 border-emerald-500 space-y-4">
            <input placeholder="Name" className="w-full p-3 border rounded-lg" value={newDebt.name} onChange={e => setNewDebt({...newDebt, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Balance" className="w-full p-3 border rounded-lg" value={newDebt.balance || ''} onChange={e => setNewDebt({...newDebt, balance: parseFloat(e.target.value)})} />
              <input type="number" placeholder="APR %" className="w-full p-3 border rounded-lg" value={newDebt.interestRate || ''} onChange={e => setNewDebt({...newDebt, interestRate: parseFloat(e.target.value)})} />
            </div>
            <div className="flex gap-3"><Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button><Button className="flex-1" onClick={() => { if(newDebt.name) { setUser({...user, debts: [...user.debts, {...newDebt, id: Date.now().toString()}]}); setIsAdding(false); setNewDebt({name:'', balance:0, interestRate:0}); } }}>Save</Button></div>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className="w-full py-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-slate-400 font-semibold"><Plus size={20} /> Add Debt</button>
        )}
      </div>
      <Button onClick={next} size="full">Next</Button>
    </div>
  );
};

const FinancialSnapshotAssets = ({ next, user, setUser }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({ name: '', balance: 0 });
  return (
    <div className="space-y-8 animate-in slide-in-from-right">
      <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">C</div>
          <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
            <p>What about your current savings or assets?</p>
          </div>
      </div>
      <div className="space-y-4">
        {user.assets.map((asset: Asset) => (
          <div key={asset.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
            <div><div className="font-bold">{asset.name}</div><div className="text-sm text-slate-500">${asset.balance}</div></div>
            <button onClick={() => setUser({...user, assets: user.assets.filter((a: any) => a.id !== asset.id)})} className="text-slate-300 hover:text-rose-500"><Trash2 size={20} /></button>
          </div>
        ))}
        {isAdding ? (
          <div className="bg-white p-6 rounded-xl border-2 border-emerald-500 space-y-4">
            <input placeholder="Asset Name" className="w-full p-3 border rounded-lg" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} />
            <input type="number" placeholder="Balance" className="w-full p-3 border rounded-lg" value={newAsset.balance || ''} onChange={e => setNewAsset({...newAsset, balance: parseFloat(e.target.value)})} />
            <div className="flex gap-3"><Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button><Button className="flex-1" onClick={() => { if(newAsset.name) { setUser({...user, assets: [...user.assets, {...newAsset, id: Date.now().toString()}]}); setIsAdding(false); setNewAsset({name:'', balance:0}); } }}>Save</Button></div>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className="w-full py-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-slate-400 font-semibold"><Plus size={20} /> Add Asset</button>
        )}
      </div>
      <Button onClick={next} size="full">Next</Button>
    </div>
  );
};

const GoalDiscovery = ({ next, user, setGoals }: any) => {
  const suggestions = [
    { title: "Save $1k Emergency Fund", amount: 1000 },
    { title: "Pay off Debt", amount: user.debts?.[0]?.balance || 500 },
    { title: "Investment Seed", amount: 5000 }
  ];
  return (
    <div className="space-y-8 animate-in slide-in-from-right">
      <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">C</div>
          <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100"><p>Let's pick your first target.</p></div>
      </div>
      <div className="space-y-4">
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => { setGoals([{ id: '1', name: s.title, targetAmount: s.amount, currentAmount: 0, targetDate: '2025-12-31', priority: 'High', why: '', monthlyContribution: Math.round(s.amount / 12), isAutomated: false }]); next(); }} className="w-full p-6 rounded-2xl border-2 bg-white text-left hover:border-emerald-500 transition-all">
            <div className="font-bold text-lg">{s.title}</div>
            <div className="text-slate-500 text-sm">Goal: ${s.amount.toLocaleString()}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

const PlanReview = ({ next, user, prev }: any) => {
  const { goals } = useStore();
  const goal = goals[0];
  const [verdict, setVerdict] = useState<'Comfortable' | 'Tight' | 'Unrealistic' | null>(null);
  const [explanation, setExplanation] = useState<string>('Analyzing your plan...');
  const [showEdu, setShowEdu] = useState(false);

  useEffect(() => {
    getFeasibilityExplanation(user, goal).then(res => {
      setExplanation(res);
      if (res.toLowerCase().includes('comfortable')) setVerdict('Comfortable');
      else if (res.toLowerCase().includes('tight')) setVerdict('Tight');
      else setVerdict('Unrealistic');
    });
  }, []);

  const badgeColors = {
    Comfortable: 'bg-emerald-100 text-emerald-700',
    Tight: 'bg-amber-100 text-amber-700',
    Unrealistic: 'bg-rose-100 text-rose-700'
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right">
      <h2 className="text-2xl font-bold">The Verdict</h2>
      <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
        <div className="flex justify-center">
          {verdict && <div className={`px-6 py-2 rounded-full font-black uppercase tracking-widest ${badgeColors[verdict]}`}>{verdict}</div>}
        </div>
        <p className="text-slate-700 text-center leading-relaxed">"{explanation}"</p>
        <div className="bg-slate-50 p-4 rounded-xl space-y-2">
          <div className="flex justify-between text-sm text-slate-500"><span>Required Monthly</span><span className="font-bold text-slate-900">${goal.monthlyContribution}</span></div>
          <div className="flex justify-between text-sm text-slate-500"><span>Remaining Income</span><span className="font-bold text-slate-900">${user.monthlyIncome - user.fixedExpenses - goal.monthlyContribution}</span></div>
        </div>
        <button onClick={() => setShowEdu(true)} className="w-full text-indigo-600 font-bold text-sm flex items-center justify-center gap-2"><Info size={16}/> Why is this "{verdict}"?</button>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" className="flex-1" onClick={prev}>Adjust Goal</Button>
        <Button className="flex-1" onClick={next}>Looks Good</Button>
      </div>

      {showEdu && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 space-y-6 animate-in zoom-in duration-300">
            <h3 className="text-xl font-bold">Snowball vs. Avalanche</h3>
            <p className="text-slate-600">The <b>Snowball</b> method focuses on paying smallest balances first for psychological wins. The <b>Avalanche</b> focuses on highest interest rates to save money.</p>
            <Button size="full" onClick={() => setShowEdu(false)}>Got it</Button>
          </div>
        </div>
      )}
    </div>
  );
};

const CommitmentStep = ({ next }: any) => {
  const { goals, setGoals } = useStore();
  const [why, setWhy] = useState('');
  const [pact, setPact] = useState(false);

  return (
    <div className="space-y-8 animate-in slide-in-from-right">
      <h2 className="text-2xl font-bold">Make it Personal</h2>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-500 uppercase">Why does this goal matter to you?</label>
          <textarea placeholder="e.g., I want to be debt-free so I can travel without guilt..." className="w-full h-32 p-4 rounded-2xl border bg-white focus:border-emerald-500 focus:outline-none" value={why} onChange={e => setWhy(e.target.value)} />
        </div>
        <div className="bg-emerald-50 p-6 rounded-2xl flex items-start gap-4">
          <input type="checkbox" className="w-6 h-6 rounded mt-1 accent-emerald-600" checked={pact} onChange={e => setPact(e.target.checked)} />
          <p className="text-emerald-900 font-medium leading-snug">I commit to sticking to this for at least 30 days to build the habit.</p>
        </div>
      </div>
      <Button size="full" disabled={!why || !pact} onClick={() => { setGoals(goals.map(g => ({...g, why}))); next(); }}>Seal the Pact</Button>
    </div>
  );
};

const ActionSetup = ({ finish }: any) => {
  const { goals, setGoals } = useStore();
  const goal = goals[0];
  const [automated, setAutomated] = useState(false);

  return (
    <div className="space-y-8 animate-in slide-in-from-right">
      <h2 className="text-2xl font-bold">Action Setup</h2>
      <div className="bg-white p-8 rounded-3xl border space-y-8">
        <div className="flex items-center justify-between">
          <div><div className="font-bold text-lg">Automated Transfer</div><div className="text-sm text-slate-500">I'll set it up in my bank</div></div>
          <button onClick={() => setAutomated(!automated)} className="text-emerald-600">{automated ? <ToggleRight size={48} /> : <ToggleLeft size={48} className="text-slate-300" />}</button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-slate-700"><Calendar className="text-emerald-500" /> <span>Every {automated ? 'Friday' : 'month on the 1st'}</span></div>
          <div className="flex items-center gap-3 text-slate-700"><Zap className="text-indigo-500" /> <span>Amount: ${goal.monthlyContribution}</span></div>
        </div>
        <div className="bg-indigo-50 p-4 rounded-xl text-indigo-900 text-xs font-medium flex gap-3">
          <ShieldCheck className="shrink-0" /> Note: FinCRED doesn't move your money yet. Please ensure this is set up in your banking app.
        </div>
      </div>
      <Button size="full" onClick={() => { setGoals(goals.map(g => ({...g, isAutomated: automated}))); finish(); }}>Finish & Start My Journey</Button>
    </div>
  );
};
