
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Goal } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getMotivationalQuote = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Provide a short, punchy 1-sentence financial motivation quote for someone starting their journey. No attributions.',
    });
    return response.text?.trim() || "Small steps lead to big wealth.";
  } catch (error) {
    return "Your future self will thank you for the habits you build today.";
  }
};

export const getFeasibilityExplanation = async (user: UserProfile, goal: Goal): Promise<string> => {
  const prompt = `
    User Snapshot:
    - Net Income: ${user.currency}${user.monthlyIncome} (${user.payFrequency})
    - Fixed Expenses: ${user.currency}${user.fixedExpenses}
    - Total Debt: ${user.currency}${user.debts.reduce((acc, d) => acc + d.balance, 0)}
    - Proposed Goal: ${goal.name} (Target: ${user.currency}${goal.targetAmount})
    - Monthly Savings Required: ${user.currency}${goal.monthlyContribution}
    
    Calculate wiggle room (Income - Expenses - Savings Goal). 
    Explain if this is "Comfortable", "Tight", or "Unrealistic". 
    Provide a supportive but honest 2-sentence explanation of why.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "The analysis is unavailable, but sticking to a budget is always the first step.";
  } catch (error) {
    return "Error calculating feasibility. Please review your numbers manually.";
  }
};

export const getCheckInFeedback = async (score: number, mood: number, notes: string): Promise<string> => {
  const prompt = `
    The user completed a weekly financial check-in.
    - Money moved: ${score === 1 ? 'Successfully' : score === 0.5 ? 'Partially' : 'Not moved'}
    - Mood: ${mood}/5
    - User Notes: "${notes}"
    
    Give 2 sentences of encouraging, habit-focused feedback.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "Great job checking in. Consistency is the secret ingredient to financial freedom!";
  } catch (error) {
    return "Consistency is key. Keep going!";
  }
};
