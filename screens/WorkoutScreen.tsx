import React from 'react';
import { Screen, Workout } from '../types';

interface WorkoutScreenProps {
  workout: Workout;
  programId: string;
  programName: string;
  onNavigate: (screen: Screen) => void;
}

const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ workout, programId, programName, onNavigate }) => {
  return (
    <div>
      <h1>Workout: {workout.name}</h1>
      <p>From program: {programName}</p>
      <button onClick={() => onNavigate(Screen.DASHBOARD)}>Back to Dashboard</button>
    </div>
  );
};

export default WorkoutScreen;
