
import React from 'react';
import { Home, ClipboardList, MessageSquare, User } from 'lucide-react';
import { useStore } from '../store';
import { Tab } from '../types';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab } = useStore();

  const navItems: { id: Tab, label: string, icon: any }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'plan', label: 'My Plan', icon: ClipboardList },
    { id: 'coach', label: 'Coach', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1 pb-24 overflow-y-auto">
        {children}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-bottom z-50">
        <div className="flex justify-around items-center px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center space-y-1 w-1/4 transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
