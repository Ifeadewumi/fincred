export type DebtType = 'credit_card' | 'student_loan' | 'auto_loan' | 'mortgage' | 'personal_loan' | 'other';
export type PayFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface Income {
    id: string;
    source: string;
    amount: number;
    frequency: PayFrequency;
}

export interface Expense {
    id: string;
    category: string;
    amount: number;
}

export interface Debt {
    id: string;
    name: string;
    debt_type: DebtType;
    balance: number;
    interest_rate: number;
    minimum_payment: number;
}

export interface SavingsAccount {
    id: string;
    label: string;
    balance: number;
}

export interface FinancialSnapshot {
    id: string;
    user_id: string;
    net_monthly_income: number;
    total_fixed_expenses: number;
    incomes: Income[];
    expenses: Expense[];
    debts: Debt[];
    savings_accounts: SavingsAccount[];
    created_at: string;
    updated_at: string;
}

export interface CreateSnapshotRequest {
    net_monthly_income: number;
    total_fixed_expenses: number;
    incomes?: Omit<Income, 'id'>[];
    expenses?: Omit<Expense, 'id'>[];
    debts?: Omit<Debt, 'id'>[];
    savings_accounts?: Omit<SavingsAccount, 'id'>[];
}
