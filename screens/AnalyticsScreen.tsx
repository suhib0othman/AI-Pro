import React from 'react';
import { Screen } from '../types';

interface AnalyticsScreenProps {
  onNavigate: (screen: Screen) => void;
}

const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onNavigate }) => {
  return (
    <div>
      <h1>Analytics</h1>
      <button onClick={() => onNavigate(Screen.DASHBOARD)}>Go to Dashboard</button>
    </div>
  );
};

export default AnalyticsScreen;
