'use client';
import { AppList } from "@/components/app/AppList";
import { ApplicationData } from "@/lib/definitions";
import { AddAppModal } from "@/components/app/AddAppModal";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useMemoFirebase } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

function AppSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            ))}
        </div>
    );
}


export default function Home() {
  const firestore = useFirestore();

  const appsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'applications'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: apps, isLoading } = useCollection<Omit<ApplicationData, 'createdAt' | 'updatedAt'> & {createdAt: any, updatedAt: any}>(appsQuery);

  const formattedApps = useMemo(() => {
    if (!apps) return [];
    return apps.map(app => ({
      ...app,
      createdAt: app.createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: app.updatedAt?.toDate().toISOString() || new Date().toISOString(),
    }));
  }, [apps]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Applications</h1>
          <p className="text-muted-foreground">Browse and manage your hosted applications.</p>
        </div>
        <AddAppModal />
      </div>
      {isLoading ? <AppSkeleton /> : <AppList initialApps={formattedApps} />}
    </div>
  );
}
