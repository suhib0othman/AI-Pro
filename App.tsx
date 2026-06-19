import React, { useState, useCallback, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider, db, calendarScope } from './services/firebaseConfig';
import { doc, setDoc, getDoc } from "firebase/firestore"; 

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import ProgramEditorScreen from './screens/ProgramEditorScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { Screen, User, Workout, Program } from './types';
import { updateUserSettings } from './services/userService';
import { generateWorkoutProgram } from './services/geminiService';
import { saveProgram } from './services/programService';
import { getExerciseLibrary } from './services/programService';
import { seedExerciseLibrary } from './services/seedingService';
import { scheduleWorkouts } from './services/calendarService';


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.DASHBOARD);
  const [screenParams, setScreenParams] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingProgram, setIsGeneratingProgram] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Main auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        let userData: User;

        if (userDocSnap.exists()) {
          userData = userDocSnap.data() as User;
          setUser(userData);
        } else {
          const newUser: User = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'New User',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
          };
          await setDoc(userDocRef, newUser);
          userData = newUser;
          setUser(userData);
        }

        // Seed the database with exercises if it's empty
        await seedExerciseLibrary();

        // Check for onboarding
        if (!userData.settings) {
          setCurrentScreen(Screen.ONBOARDING);
        } else {
          setCurrentScreen(Screen.DASHBOARD);
        }

      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleNavigate = (screen: Screen, params: any = {}) => {
    setCurrentScreen(screen);
    setScreenParams(params);
  };

  const handleStartWorkout = (workout: Workout, programId: string, programName: string) => {
    handleNavigate(Screen.WORKOUT, { workout, programId, programName });
  };

  const handleOnboardingComplete = async (settings: any) => {
    if (!user) return;
    setIsGeneratingProgram(true);

    try {
      // 1. Save user settings
      await updateUserSettings(user.uid, settings);
      const updatedUser = { ...user, settings };
      setUser(updatedUser);
      console.log("Step 1: Settings saved.");

      // 2. Get exercise library to pass to the AI
      console.log("Step 2: Fetching exercise library...");
      const exerciseLibrary = await getExerciseLibrary();
      if (exerciseLibrary.length === 0) {
        throw new Error("Exercise library is empty. Cannot generate a program.");
      }

      // 3. Generate program from AI using the library
      console.log("Step 3: Generating program from AI...");
      const aiProgram = await generateWorkoutProgram(settings, exerciseLibrary);
      console.log("AI Program received:", aiProgram);

      // 4. Save the fully populated program to Firestore
      console.log("Step 4: Saving populated program to Firestore...");
      const programToSave: Omit<Program, 'id' | 'createdAt' | 'updatedAt'> = {
        name: aiProgram.name,
        description: aiProgram.description,
        createdBy: user.uid,
        isPublic: false,
      };
      // The AI now returns workouts with correct exercise IDs, so no more mapping is needed.
      await saveProgram(programToSave, aiProgram.workouts);
      console.log("Step 5: Program saved successfully.");

      // 6. Navigate to dashboard
      handleNavigate(Screen.DASHBOARD);

    } catch (error) {
      console.error("Full onboarding flow failed:", error);
      alert("There was an error creating your personalized program. Please try again.");
    } finally {
      setIsGeneratingProgram(false);
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        setAccessToken(credential.accessToken || null);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setAccessToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const handleSchedule = useCallback(async (workouts: Workout[]) => {
    if (!user) {
        alert("Please log in first.");
        return;
    }
    if (!workouts || workouts.length === 0) {
        alert("Your active program has no workouts to schedule.");
        return;
    }

    try {
        googleProvider.addScope(calendarScope);
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const currentAccessToken = credential?.accessToken;

        if (currentAccessToken) {
            alert("Got calendar access. Scheduling workouts now...");
            await scheduleWorkouts(workouts, currentAccessToken);
            alert("Workouts scheduled successfully for the upcoming week!");
        } else {
            alert("Could not get calendar access. Please try again.");
        }
    } catch (error: any) {
        console.error("Calendar scheduling error:", error);
        if (error.code === 'auth/popup-blocked') {
            alert("Popup blocked. Please allow popups for this site to grant calendar permissions.");
        } else if (error.code === 'auth/cancelled-popup-request') {
            console.log("User cancelled calendar permission request");
        } else {
            alert(`Failed to get calendar permission. Error: ${error.message}`);
        }
    }
  }, [user]);

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.ONBOARDING:
        return <OnboardingScreen onComplete={handleOnboardingComplete} isGenerating={isGeneratingProgram} />;
      case Screen.DASHBOARD:
        return <DashboardScreen user={user!} onNavigate={handleNavigate} onLogout={handleLogout} onStartWorkout={handleStartWorkout} onSchedule={handleSchedule} />;
      case Screen.ANALYTICS:
        return <AnalyticsScreen onNavigate={handleNavigate} />;
      case Screen.PROGRAM_EDITOR:
        return <ProgramEditorScreen onNavigate={handleNavigate} programId={screenParams.programId} />;
      case Screen.WORKOUT:
        return <WorkoutScreen workout={screenParams.workout} programId={screenParams.programId} programName={screenParams.programName} onNavigate={handleNavigate} />;
      default:
        return <DashboardScreen user={user!} onNavigate={handleNavigate} onLogout={handleLogout} onStartWorkout={handleStartWorkout} onSchedule={handleSchedule} />;
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={handleGoogleSignIn} />;
  }

  return (
    <div className="min-h-screen bg-brand-dark font-sans">
      {renderScreen()}
    </div>
  );
};

export default App;
