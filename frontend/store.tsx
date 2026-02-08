
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, Goal, CheckIn, AppState, Tab, Message, NudgeSchedule } from './types';

interface StoreContextType {
  state: AppState;
  setState: (s: AppState) => void;
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  checkIns: CheckIn[];
  addCheckIn: (c: CheckIn) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  nudgeSchedules: NudgeSchedule[];
  setNudgeSchedules: React.Dispatch<React.SetStateAction<NudgeSchedule[]>>;
  streak: number;
  milestones: string[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>('landing');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [streak, setStreak] = useState(4);
  const [milestones, setMilestones] = useState<string[]>(['First Goal Created', '1 Week Streak']);

  const [user, setUser] = useState<UserProfile>({
    name: '',
    age: 0,
    country: 'USA',
    currency: '$',
    persona: null,
    employmentStatus: 'Full-time',
    monthlyIncome: 0,
    payFrequency: 'Monthly',
    fixedExpenses: 0,
    debts: [],
    assets: [],
    reminderFrequency: 'Weekly',
  });

  const [goals, setGoals] = useState<Goal[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: "Hello! I'm your FinCRED Coach. How can I help you with your wealth journey today?", timestamp: new Date() }
  ]);
  const [nudgeSchedules, setNudgeSchedules] = useState<NudgeSchedule[]>([
    { id: '1', type: 'weekly_summary', channel: 'email', isActive: true },
    { id: '2', type: 'pre_transfer_reminder', channel: 'push', isActive: true },
    { id: '3', type: 'checkin_reminder', channel: 'push', isActive: true },
  ]);

  const addCheckIn = (c: CheckIn) => {
    setCheckIns(prev => [c, ...prev]);
  };

  return (
    <StoreContext.Provider value={{
      state, setState, activeTab, setActiveTab,
      user, setUser, goals, setGoals,
      checkIns, addCheckIn,
      messages, setMessages,
      nudgeSchedules, setNudgeSchedules,
      streak, milestones
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
