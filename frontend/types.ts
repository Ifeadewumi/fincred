
export type Persona = 'Crush Debt' | 'Build Safety Net' | 'Start FIRE' | 'Save for Goal';
export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface Debt {
  id: string;
  name: string;
  type: string;
  balance: number;
  interestRate: number;
  minPayment: number;
}

export interface Asset {
  id: string;
  name: string;
  balance: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'High' | 'Med' | 'Low';
  why: string;
  monthlyContribution: number;
  isAutomated: boolean;
  status: GoalStatus;
}

export interface UserProfile {
  name: string;
  age: number;
  country: string;
  currency: string;
  persona: Persona | null;
  employmentStatus: string;
  monthlyIncome: number;
  payFrequency: 'Monthly' | 'Bi-weekly';
  fixedExpenses: number;
  debts: Debt[];
  assets: Asset[];
  reminderFrequency: 'Daily' | 'Weekly' | 'Monthly';
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface NudgeSchedule {
  id: string;
  type: 'weekly_summary' | 'pre_transfer_reminder' | 'checkin_reminder';
  channel: 'email' | 'push';
  isActive: boolean;
}

export interface EducationSnippet {
  id: string;
  title: string;
  content: string;
  topic: 'debt_methods' | 'emergency_fund' | 'fire_basics' | 'timeline_optimization';
  contextFeasibility?: string;
}

export interface CheckIn {
  id: string;
  date: string;
  movedMoney: 'Yes' | 'No' | 'Partial';
  spendingScore: 'Under' | 'Over' | 'On Track';
  mood: number;
  notes: string;
}

export type AppState = 'landing' | 'auth' | 'verify' | 'onboarding' | 'main';
export type Tab = 'home' | 'plan' | 'coach' | 'profile';
