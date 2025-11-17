import { initializeFirebase } from '@/firebase';

const { firestore } = initializeFirebase();

export const db = firestore;
