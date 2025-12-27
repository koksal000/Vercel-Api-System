import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/server';
import { doc, getDoc } from 'firebase/firestore';
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

export async function GET(
  request: Request,
  { params }: { params: { appId: string } }
) {
  try {
    const { firestore } = initializeFirebase();
    const { appId } = params;

    if (!appId) {
      return new NextResponse(
        JSON.stringify({ message: 'Application ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appRef = doc(firestore, 'applications', appId);
    const appSnap = await getDoc(appRef);

    if (!appSnap.exists()) {
      return new NextResponse(
        JSON.stringify({ message: 'Application not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appData = appSnap.data() as Application;
    
    const responseData = {
      name: appData.name,
      version: appData.version,
      description: appData.description,
      htmlContent: appData.htmlContent,
    };

    return NextResponse.json(responseData, { headers: corsHeaders });

  } catch (error) {
    console.error(`Error fetching application ${params.appId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(
        JSON.stringify({ message: 'Error fetching application', error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
