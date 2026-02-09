
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, Goal, CheckIn, AppState, Tab, Message, NudgeSchedule } from './types';
import { authService, goalsService, dashboardService, onboardingService, actionPlanService, nudgeService, userService, setToken, getToken, removeToken } from './services/api';

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
  sessionId: string | null;
  setSessionId: (id: string | null) => void;

  // Auth & API
  isLoading: boolean;
  error: string | null;
  setError: (e: string | null) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  refreshData: () => Promise<void>;

  // Persistence
  saveSnapshot: () => Promise<void>;
  saveGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  saveUser: (u: Partial<UserProfile>) => Promise<void>;
  createActionPlan: (goalId: string, action: any) => Promise<void>;
  toggleNudge: (id: string, isActive: boolean) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>('landing');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading to check token
  const [error, setError] = useState<string | null>(null);

  const [streak, setStreak] = useState(0);
  const [milestones, setMilestones] = useState<string[]>([]);

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nudgeSchedules, setNudgeSchedules] = useState<NudgeSchedule[]>([]);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const [me, goalsData, dashboardData] = await Promise.all([
        authService.getMe().catch(e => { console.error(e); return null; }),
        goalsService.list().catch(e => { console.error(e); return []; }),
        dashboardService.getSummary().catch(e => { console.error(e); return null; }),
        nudgeService.list().catch(e => { console.error(e); return []; }),
      ]);

      if (me) {
        // Map backend user/profile to frontend UserProfile
        setUser(prev => ({
          ...prev,
          name: me.profile?.full_name || me.email,
          ...me.profile // Spread other profile fields
        }));
      }

      if (goalsData) {
        setGoals(goalsData.map((g: any) => ({
          ...g,
          targetAmount: g.target_amount,
          currentAmount: g.current_balance || 0,
          targetDate: g.target_date,
        })));
      }

      // Handle Dashboard Data if needed
    } catch (err: any) {
      console.error("Failed to refresh data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      if (token) {
        await refreshData();
        setState('main');
      } else {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { access_token } = await authService.login({ username: email, password: pass });
      setToken(access_token);
      await refreshData();
      setState('main');
    } catch (e: any) {
      setError(e.message || 'Login failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.register({ email, password: pass, full_name: name });
    } catch (e: any) {
      setError(e.message || 'Registration failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setState('landing');
    setUser({} as UserProfile);
    setGoals([]);
  };

  const saveSnapshot = async () => {
    try {
      // Map frontend user profile to backend snapshot format
      const snapshotData = {
        monthly_income: user.monthlyIncome,
        pay_frequency: user.payFrequency || 'Monthly',
        currency: user.currency || 'USD',
        fixed_expenses: user.fixedExpenses,
        debt_total: user.debts.reduce((acc, d) => acc + d.balance, 0),
        savings_balance: user.assets.reduce((acc, a) => acc + a.balance, 0),
      };
      await onboardingService.submitSnapshot(snapshotData);
    } catch (e) {
      console.error("Failed to save snapshot", e);
    }
  };

  const saveGoal = async (goal: Goal) => {
    try {
      const payload = {
        name: goal.name,
        target_amount: goal.targetAmount,
        target_date: goal.targetDate,
        priority: goal.priority?.toUpperCase() || 'MEDIUM',
        status: 'ACTIVE',
        why: goal.why,
      };
      await goalsService.create(payload);
      await refreshData();
    } catch (e) {
      console.error("Failed to save goal", e);
    }
  };

  const updateGoal = async (goal: Goal) => {
    try {
      const payload = {
        name: goal.name,
        target_amount: goal.targetAmount,
        current_balance: goal.currentAmount,
        status: goal.status,
      };
      await goalsService.update(goal.id, payload);
      // Optimistic update
      setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
    } catch (e) {
      console.error("Failed to update goal", e);
      await refreshData();
    }
  };


  const deleteGoal = async (id: string) => {
    try {
      await goalsService.delete(id);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (e) {
      console.error("Failed to delete goal", e);
      await refreshData();
    }
  };

  const saveUser = async (u: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...u }));
    try {
      // Map frontend UserProfile fields to backend ProfileUpdate schema
      // Backend expects: full_name, age, country, persona, etc.
      // We need to be careful with field names.
      // UserProfile has 'name', backend has 'full_name'.
      const payload: any = { ...u };
      if (u.name) payload.full_name = u.name;

      await userService.updateProfile(payload);
    } catch (e) {
      console.error("Failed to save user profile", e);
    }
  };

  const createActionPlan = async (goalId: string, action: any) => {
    try {
      await actionPlanService.create(goalId, action);
      // Refresh to see if it affects anything (e.g. nudges)
    } catch (e) {
      console.error("Failed to create action plan", e);
    }
  };

  const toggleNudge = async (id: string, isActive: boolean) => {
    // Optimistic update
    setNudgeSchedules(prev => prev.map(n => n.id === id ? { ...n, isActive } : n));

    try {
      // Backend expects 'active' | 'paused'
      const status = isActive ? 'active' : 'paused';

      await nudgeService.update(id, { status });
    } catch (e) {
      console.error("Failed to toggle nudge", e);
      await refreshData();
    }
  };

  const addCheckIn = (c: CheckIn) => {
    setCheckIns(prev => [c, ...prev]);
  };

  return (
    <StoreContext.Provider value={{
      state, setState, activeTab, setActiveTab,
      user, setUser, goals, setGoals,
      checkIns, addCheckIn,
      messages, setMessages, sessionId, setSessionId,
      nudgeSchedules, setNudgeSchedules,
      streak, milestones,
      isLoading, error, setError, login, register, logout, refreshData,
      saveSnapshot, saveGoal, updateGoal, deleteGoal, saveUser, createActionPlan, toggleNudge
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
