import React from 'react';
import { User, Screen, Workout } from '../types';

interface DashboardScreenProps {
  user: User;
  onNavigate: (screen: Screen, params?: any) => void;
  onLogout: () => void;
  onStartWorkout: (workout: Workout, programId: string, programName: string) => void;
  onSchedule: (workouts: Workout[]) => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onNavigate, onLogout, onStartWorkout, onSchedule }) => {
  // Placeholder content
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.displayName}!</p>
      <button onClick={onLogout}>Logout</button>
      {/* Add more placeholder content or basic functionality as needed */}
    </div>
  );
};

export default DashboardScreen;
