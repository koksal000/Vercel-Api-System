import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/server';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Application } from '@/lib/definitions';

export const dynamic = 'force-dynamic';

// CORS başlıkları
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: corsHeaders });
}


export async function GET() {
  try {
    const { firestore } = initializeFirebase();
    const appsCollection = collection(firestore, 'applications');
    const q = query(appsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const apps: Omit<Application, 'password'>[] = [];
    querySnapshot.forEach((doc) => {
      const appData = doc.data() as Application;
      // Güvenlik için parolayı yanıttan çıkar
      const { password, ...appWithoutPassword } = appData;
      apps.push(appWithoutPassword);
    });

    return NextResponse.json(apps, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching applications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(
        JSON.stringify({ message: 'Error fetching applications', error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
