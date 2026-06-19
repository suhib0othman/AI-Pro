import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { handleFirestoreError } from "../firebase";
import { OperationType } from "../firebase";

export const updateUserSettings = async (uid: string, settings: any) => {
  try {
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, { settings });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};
