import React from 'react';
import { Screen } from '../types';

interface ProgramEditorScreenProps {
  onNavigate: (screen: Screen) => void;
  programId?: string;
}

const ProgramEditorScreen: React.FC<ProgramEditorScreenProps> = ({ onNavigate, programId }) => {
  return (
    <div>
      <h1>Program Editor</h1>
      {programId && <p>Editing program: {programId}</p>}
      <button onClick={() => onNavigate(Screen.DASHBOARD)}>Go to Dashboard</button>
    </div>
  );
};

export default ProgramEditorScreen;
