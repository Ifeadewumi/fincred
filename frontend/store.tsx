
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, Goal, CheckIn, AppState, Tab, Message, NudgeSchedule } from './types';
import { authService, goalsService, dashboardService, setToken, getToken, removeToken } from './services/api';

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

  // Auth & API
  isLoading: boolean;
  error: string | null;
  setError: (e: string | null) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  refreshData: () => Promise<void>;
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
  const [nudgeSchedules, setNudgeSchedules] = useState<NudgeSchedule[]>([]);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const [me, goalsData, dashboardData] = await Promise.all([
        authService.getMe().catch(e => { console.error(e); return null; }),
        goalsService.list().catch(e => { console.error(e); return []; }),
        dashboardService.getSummary().catch(e => { console.error(e); return null; }),
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
        // Need to map backend goals to frontend Goal interface if names differ
        // Assuming direct mapping for MVP or close enough
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
      // After register, we probably need them to verify email or auto-login.
      // API returns message. backend says: "Registration process started..."
      // For MVP dev mode, we might want to auto-login if verify is skipped.
      // For now, let's assume they go to verify screen or login.
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
      streak, milestones,
      isLoading, error, setError, login, register, logout, refreshData
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
