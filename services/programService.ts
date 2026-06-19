import { collection, getDocs, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { handleFirestoreError } from "../firebase";
import { OperationType } from "../firebase";
import { Program, Workout, Exercise } from "../types";

export const getExerciseLibrary = async (): Promise<Exercise[]> => {
  try {
    const exercisesSnapshot = await getDocs(collection(db, "exercises"));
    return exercisesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "exercises");
    return [];
  }
};

export const saveProgram = async (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>, workouts: Omit<Workout, 'id'>[]): Promise<string> => {
  const batch = writeBatch(db);
  
  try {
    const programRef = doc(collection(db, "programs"));
    batch.set(programRef, { 
      ...program, 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    for (const workout of workouts) {
      const workoutRef = doc(collection(db, `programs/${programRef.id}/workouts`));
      batch.set(workoutRef, workout);
    }

    await batch.commit();
    return programRef.id;

  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `programs/{new_program}`);
    throw error;
  }
};
