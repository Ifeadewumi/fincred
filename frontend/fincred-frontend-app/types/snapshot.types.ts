export type DebtType = 'credit_card' | 'student_loan' | 'car_loan' | 'mortgage' | 'personal_loan' | 'other';
export type PayFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface Income {
    id: string;
    source_label?: string;
    amount: number;
    frequency: PayFrequency;
}

export interface Expense {
    id: string;
    total_amount: number;
}

export interface Debt {
    id: string;
    label?: string; // Changed from name to label to match backend
    type: DebtType; // Changed from debt_type to type to match backend
    balance: number;
    interest_rate_annual: number;
    min_payment: number;
}

export interface SavingsAccount {
    id: string;
    label: string;
    balance: number;
}

export interface FinancialSnapshot {
    income?: Income;
    expenses?: Expense;
    debts: Debt[];
    savings: SavingsAccount[];
}

export type Snapshot = FinancialSnapshot;

export interface CreateSnapshotRequest {
    net_monthly_income: number;
    total_fixed_expenses: number;
    incomes?: Omit<Income, 'id'>[];
    expenses?: Omit<Expense, 'id'>[];
    debts?: Omit<Debt, 'id'>[];
    savings_accounts?: Omit<SavingsAccount, 'id'>[];
}
export interface SnapshotPutRequest {
    income?: {
        amount: number;
        frequency: PayFrequency;
        source_label?: string;
    };
    expenses?: {
        total_amount: number;
    };
    debts?: {
        type: DebtType;
        label?: string;
        balance: number;
        interest_rate_annual: number;
        min_payment: number;
    }[];
    savings?: {
        label?: string;
        balance: number;
    }[];
}
