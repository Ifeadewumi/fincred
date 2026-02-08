
import React from 'react';
import { StoreProvider, useStore } from './store';
import { LandingScreen } from './features/LandingScreen';
import { AuthScreen } from './features/AuthScreen';
import { OnboardingFlow } from './features/OnboardingFlow';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './features/Dashboard';
import { GoalsList } from './features/GoalsList';
import { CoachTab } from './features/CoachTab';
import { ProfileTab } from './features/ProfileTab';
import { PlanningEngine } from './features/PlanningEngine';

const AppContent: React.FC = () => {
  const { state, activeTab } = useStore();

  if (state === 'landing') return <LandingScreen />;
  if (state === 'auth') return <AuthScreen />;
  if (state === 'onboarding') return <OnboardingFlow />;

  return (
    <MainLayout>
      {activeTab === 'home' && <Dashboard />}
      {activeTab === 'plan' && <PlanningEngine />}
      {activeTab === 'coach' && <CoachTab />}
      {activeTab === 'profile' && <ProfileTab />}
    </MainLayout>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
