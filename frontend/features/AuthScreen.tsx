
import React, { useState } from 'react';
import { useStore } from '../store';
import { Button } from '../components/Button';
import { Mail, Lock, ArrowLeft, Inbox } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { setState, state } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (isLogin) {
        setState('main');
      } else {
        setShowVerify(true);
      }
    }, 1000);
  };

  if (showVerify) {
    return (
      <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <Inbox size={40} />
        </div>
        <h2 className="text-3xl font-bold">Check your inbox</h2>
        <p className="text-slate-500 max-w-xs">We sent a verification link to <b>{email}</b>. Please click it to activate your account.</p>
        <Button size="full" onClick={() => setState('onboarding')}>I've verified my email</Button>
        <button onClick={() => setShowVerify(false)} className="text-emerald-600 font-bold">Back to Sign Up</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col">
      <button onClick={() => setState('landing')} className="mb-8 text-slate-400">
        <ArrowLeft size={24} />
      </button>

      <div className="flex-1">
        <h2 className="text-3xl font-bold mb-2">
          {isLogin ? 'Welcome back' : 'Join FinCRED'}
        </h2>
        <p className="text-slate-500 mb-10">
          {isLogin ? 'Log in to continue your journey.' : 'Let\'s start building your financial safety net.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
              <input type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="hello@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
              <input type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <Button type="submit" variant="primary" size="full" loading={loading}>
            {isLogin ? 'Log In' : 'Create Account'}
          </Button>
        </form>
      </div>

      <div className="mt-auto py-8 text-center">
        <button onClick={() => setIsLogin(!isLogin)} className="text-emerald-600 font-semibold">
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
        </button>
      </div>
    </div>
  );
};
