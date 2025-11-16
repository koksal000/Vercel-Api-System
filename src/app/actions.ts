'use server';

import { z } from 'zod';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, serverTimestamp, query, orderBy, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import { generateId } from '@/lib/utils';
import { Application, ApplicationData } from '@/lib/definitions';

const AppSchema = z.object({
  name: z.string().min(1, 'Application name is required.'),
  version: z.string().min(1, 'Version is required.'),
  htmlContent: z.string().min(1, 'HTML content is required.'),
  password: z.string().min(4, 'Password must be at least 4 characters long.'),
});

const UpdateAppSchema = AppSchema.omit({ password: true }).extend({
  id: z.string(),
  authPassword: z.string().min(1, 'Password is required to update.'),
});

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: { [key: string]: string[] | undefined };
};

export async function addApplication(formData: FormData): Promise<ActionResponse<{ id: string }>> {
  if (!db) return { success: false, error: 'Firebase not configured.' };
  
  const validatedFields = AppSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Invalid form data.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { name, version, htmlContent, password } = validatedFields.data;
  const appId = generateId(10);

  try {
    const appRef = doc(db, 'apps', appId);
    await setDoc(appRef, {
      id: appId,
      name,
      version,
      htmlContent,
      password, // In a real app, hash this!
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    revalidatePath('/');
    revalidatePath('/saved');
    return { success: true, data: { id: appId } };
  } catch (error) {
    console.error('Firebase Error:', error);
    return { success: false, error: 'Failed to create application.' };
  }
}

export async function getApplications(): Promise<ActionResponse<ApplicationData[]>> {
  if (!db) return { success: false, error: 'Firebase not configured.' };

  try {
    const appsCollection = collection(db, 'apps');
    const q = query(appsCollection, orderBy('createdAt', 'desc'));
    const appSnapshot = await getDocs(q);
    const appList = appSnapshot.docs.map(doc => {
      const data = doc.data() as Application;
      return {
        id: data.id,
        name: data.name,
        version: data.version,
        htmlContent: data.htmlContent,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
      };
    });
    return { success: true, data: appList };
  } catch (error) {
    console.error('Firebase Error:', error);
    return { success: false, error: 'Failed to fetch applications.' };
  }
}

export async function updateApplication(formData: FormData): Promise<ActionResponse<null>> {
    if (!db) return { success: false, error: 'Firebase not configured.' };

    const validatedFields = UpdateAppSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            success: false,
            error: 'Invalid form data.',
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { id, name, version, htmlContent, authPassword } = validatedFields.data;

    try {
        const appRef = doc(db, 'apps', id);
        const appSnap = await getDoc(appRef);

        if (!appSnap.exists()) {
            return { success: false, error: 'Application not found.' };
        }

        const appData = appSnap.data() as Application;

        // In a real app, compare hashed passwords
        if (appData.password !== authPassword) {
            return { success: false, error: 'Incorrect password.' };
        }

        await updateDoc(appRef, {
            name,
            version,
            htmlContent,
            updatedAt: serverTimestamp(),
        });

        revalidatePath('/');
        revalidatePath('/saved');
        revalidatePath(`/api/apps/${id}`);

        return { success: true, data: null };
    } catch (error) {
        console.error('Firebase Error:', error);
        return { success: false, error: 'Failed to update application.' };
    }
}
