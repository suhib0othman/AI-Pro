import React from 'react';

interface OnboardingScreenProps {
  onComplete: (settings: any) => void;
  isGenerating: boolean;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, isGenerating }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Replace with actual form data
    const settings = { fitnessLevel: 'intermediate', goals: ['strength'] };
    onComplete(settings);
  };

  return (
    <div>
      <h1>Onboarding</h1>
      <form onSubmit={handleSubmit}>
        {/* Add form fields for user settings here */}
        <button type="submit" disabled={isGenerating}>
          {isGenerating ? 'Generating Program...' : 'Complete Onboarding'}
        </button>
      </form>
    </div>
  );
};

export default OnboardingScreen;
