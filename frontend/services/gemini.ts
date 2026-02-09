import { aiService } from "./api";
import { UserProfile, Goal } from "../types";

export const getMotivationalQuote = async (): Promise<string> => {
  try {
    const { quote } = await aiService.getQuote();
    return quote;
  } catch (error) {
    console.error("Failed to fetch quote:", error);
    return "Your future self will thank you for the habits you build today.";
  }
};

export const getFeasibilityExplanation = async (user: UserProfile, goal: Goal): Promise<string> => {
  try {
    const debtTotal = user.debts.reduce((acc, d) => acc + d.balance, 0);
    const { analysis } = await aiService.analyzeFeasibility({
      monthly_income: user.monthlyIncome,
      fixed_expenses: user.fixedExpenses,
      total_debt: debtTotal,
      goal_name: goal.name,
      goal_target: goal.targetAmount,
      monthly_contribution: goal.monthlyContribution
    });
    return analysis;
  } catch (error) {
    console.error("Feasibility analysis failed:", error);
    return "Error calculating feasibility. Please review your numbers manually.";
  }
};

export const getCheckInFeedback = async (score: number, mood: number, notes: string): Promise<string> => {
  try {
    const { feedback } = await aiService.getCheckInFeedback({ score, mood, notes });
    return feedback;
  } catch (error) {
    console.error("Feedback generation failed:", error);
    return "Consistency is key. Keep going!";
  }
};
