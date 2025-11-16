import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NextRequest, NextResponse } from 'next/server';
import { Application } from '@/lib/definitions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const appRef = doc(db, 'apps', id);
    const appSnap = await getDoc(appRef);

    if (!appSnap.exists()) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const appData = appSnap.data() as Application;

    const responseData = {
      id: appData.id,
      name: appData.name,
      version: appData.version,
      htmlContent: appData.htmlContent,
      updatedAt: appData.updatedAt.toDate().toISOString(),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
