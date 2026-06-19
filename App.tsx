import React, { useState, useCallback, useEffect } from 'react';
import { onAuthStateChanged, signInWithRedirect, signOut, GoogleAuthProvider, linkWithPopup, reauthenticateWithPopup, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider, db, calendarScope } from './services/firebaseConfig';
import { doc, setDoc, getDoc } from "firebase/firestore"; 

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import ProgramEditorScreen from './screens/ProgramEditorScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { Screen, User, Workout, Program, WorkoutExercise } from './types';
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

  // ✅ NEW: Handle redirect result on app initialization (runs once on mount)
  // This captures the authentication result after user returns from Google OAuth redirect
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User has successfully authenticated via redirect
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential) {
            setAccessToken(credential.accessToken || null);
            console.log('✅ [AUTH] Redirect authentication successful. User:', result.user.email);
          }
        }
      } catch (error: any) {
        console.error('❌ [AUTH] Error handling redirect result:', error);
        console.error('[AUTH] Error code:', error.code);
        console.error('[AUTH] Error message:', error.message);
        
        // Handle specific redirect errors for better UX
        if (error.code === 'auth/popup-blocked') {
          console.error('[AUTH] Authentication popup was blocked by browser');
        } else if (error.code === 'auth/cancelled-popup-request') {
          console.log('[AUTH] User cancelled authentication');
        } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
          console.error('[AUTH] Redirect authentication not supported in this environment');
        }
      }
    };

    handleRedirectResult();
  }, []);

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

  /**
   * ✅ UPDATED: Uses signInWithRedirect instead of signInWithPopup
   * Renamed from handleLogin to handleGoogleSignIn for clarity
   * 
   * Flow:
   * 1. User clicks "Sign in with Google" button
   * 2. signInWithRedirect redirects to Google OAuth consent screen
   * 3. User authenticates and consents
   * 4. Google redirects back to app with auth code
   * 5. getRedirectResult (in first useEffect) captures and processes the result
   * 6. onAuthStateChanged detects the new user and proceeds
   */
  const handleGoogleSignIn = useCallback(async () => {
    try {
      console.log('🔄 [AUTH] Initiating redirect to Google authentication...');
      await signInWithRedirect(auth, googleProvider);
      // Note: After this line executes, the browser redirects to Google
      // The app will reload after user authenticates at Google
      // The getRedirectResult useEffect above will handle the result on the new page load
    } catch (error: any) {
      console.error('❌ [AUTH] Authentication error:', error);
      console.error('[AUTH] Error code:', error.code);
      console.error('[AUTH] Error message:', error.message);
      
      // Show user-friendly error messages for common issues
      if (error.code === 'auth/popup-blocked') {
        alert('Authentication popup was blocked. Please check your browser settings and try again.');
      } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
        alert('Redirect authentication is not supported in this environment.');
      } else if (error.code === 'auth/unauthorized-domain') {
        alert('This domain is not authorized in Firebase Console. Please contact the administrator.');
      } else {
        alert('Authentication failed. Please try again.');
      }
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setAccessToken(null);
      console.log('✅ [AUTH] User logged out successfully');
    } catch (error) {
      console.error('❌ [AUTH] Logout error:', error);
    }
  }, []);

  /**
   * Calendar scheduling still uses reauthenticateWithPopup
   * This is intentional because:
   * 1. We need immediate feedback (popup is synchronous)
   * 2. It's a secondary scope request (not the initial auth)
   * 3. Popup is acceptable for permission re-auth scenarios
   */
  const handleSchedule = useCallback(async (workouts: Workout[]) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        alert("Please log in first.");
        return;
    }
    if (!workouts || workouts.length === 0) {
        alert("Your active program has no workouts to schedule.");
        return;
    }

    try {
        const calendarProvider = new GoogleAuthProvider();
        calendarProvider.addScope(calendarScope);

        // Re-authenticate to get the new scope. This is the correct way to ask for additional permissions.
        const result = await reauthenticateWithPopup(currentUser, calendarProvider);
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
            // User closed the popup, do nothing.
            console.log("User cancelled calendar permission request");
        } else {
            alert(`Failed to get calendar permission. Error: ${error.message}`);
        }
    }
  }, []);

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
