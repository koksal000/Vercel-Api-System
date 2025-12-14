'use client';
import { useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Application } from '@/lib/definitions';
import { HtmlPreview } from '@/components/app/HtmlPreview';
import { Skeleton } from '@/components/ui/skeleton';
import { Frown } from 'lucide-react';

export default function PreviewPage({ params }: { params: { appId: string } }) {
  const { appId } = params;
  const firestore = useFirestore();

  const appRef = useMemoFirebase(() => {
    if (!firestore || !appId) return null;
    return doc(firestore, 'applications', appId);
  }, [firestore, appId]);

  const { data: app, isLoading, error } = useDoc<Application>(appRef);

  useEffect(() => {
    if (app) {
      document.title = `${app.name} - Preview`;
    }
  }, [app]);

  if (isLoading) {
    return <Skeleton className="w-screen h-screen rounded-none" />;
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center text-center p-4 bg-background">
        <Frown className="w-16 h-16 text-destructive" />
        <h2 className="mt-4 text-2xl font-semibold text-destructive">Error Loading Preview</h2>
        <p className="mt-2 text-muted-foreground">Could not load the application preview. The application may not exist or you may not have permission to view it.</p>
        <p className="mt-4 text-xs text-muted-foreground font-mono">{error.message}</p>
      </div>
    );
  }
  
  if (!app || app.deleted) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center text-center p-4 bg-background">
        <Frown className="w-16 h-16 text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-semibold">Application Not Found</h2>
        <p className="mt-2 text-muted-foreground">The application with ID "{appId}" could not be found.</p>
      </div>
    );
  }

  return (
      <div className="fixed inset-0 w-full h-full">
        <HtmlPreview htmlContent={app.htmlContent} />
      </div>
  );
}
