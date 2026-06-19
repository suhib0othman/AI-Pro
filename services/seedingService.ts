import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { handleFirestoreError } from "../firebase";
import { OperationType } from "../firebase";

const exercises = [
    { id: 'squat', name: 'Squat', muscleGroups: ['Quads', 'Glutes', 'Hamstrings'] },
    { id: 'bench-press', name: 'Bench Press', muscleGroups: ['Chest', 'Triceps', 'Shoulders'] },
    { id: 'deadlift', name: 'Deadlift', muscleGroups: ['Back', 'Glutes', 'Hamstrings'] },
    { id: 'overhead-press', name: 'Overhead Press', muscleGroups: ['Shoulders', 'Triceps'] },
    { id: 'pull-ups', name: 'Pull Ups', muscleGroups: ['Back', 'Biceps'] },
    { id: 'bent-over-row', name: 'Bent Over Row', muscleGroups: ['Back', 'Biceps'] },
    { id: 'lunges', name: 'Lunges', muscleGroups: ['Quads', 'Glutes'] },
    { id: 'bicep-curls', name: 'Bicep Curls', muscleGroups: ['Biceps'] },
    { id: 'tricep-dips', name: 'Tricep Dips', muscleGroups: ['Triceps'] },
    { id: 'plank', name: 'Plank', muscleGroups: ['Core'] }
];

export const seedExerciseLibrary = async () => {
    try {
        const exercisesCollection = collection(db, "exercises");
        const snapshot = await getDocs(exercisesCollection);
        
        if (snapshot.empty) {
            console.log("Seeding exercise library...");
            const batch = writeBatch(db);
            exercises.forEach(exercise => {
                const docRef = doc(exercisesCollection, exercise.id);
                batch.set(docRef, { name: exercise.name, muscleGroups: exercise.muscleGroups });
            });
            await batch.commit();
            console.log("Exercise library seeded.");
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "exercises");
    }
};
