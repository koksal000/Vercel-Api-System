'use client';
import { useMemo } from 'react';
import { ApplicationData } from "@/lib/definitions";
import { useSavedApps } from '@/hooks/use-saved-apps';
import { AppList } from '@/components/app/AppList';
import { Skeleton } from '@/components/ui/skeleton';
import { Frown } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

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


export default function SavedPage() {
    const { savedAppIds, isLoaded: isSavedAppsLoaded } = useSavedApps();
    const firestore = useFirestore();

    const appsQuery = useMemoFirebase(() => {
        if (!firestore || !isSavedAppsLoaded || savedAppIds.length === 0) return null;
        return query(collection(firestore, 'applications'), where('id', 'in', savedAppIds));
    }, [firestore, isSavedAppsLoaded, savedAppIds]);

    const { data: savedAppsData, isLoading } = useCollection<Omit<ApplicationData, 'createdAt' | 'updatedAt'> & {createdAt: any, updatedAt: any}>(appsQuery);

    const savedApps = useMemo(() => {
        if (!savedAppsData) return [];
        return savedAppsData
            .map(app => ({
                ...app,
                createdAt: app.createdAt?.toDate().toISOString() || new Date().toISOString(),
                updatedAt: app.updatedAt?.toDate().toISOString() || new Date().toISOString(),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [savedAppsData]);
    
    const showLoading = isLoading || !isSavedAppsLoaded;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline tracking-tight">Saved Applications</h1>
                    <p className="text-muted-foreground">Your bookmarked applications, sorted alphabetically.</p>
                </div>
            </div>
            
            {showLoading ? (
                <AppSkeleton />
            ) : savedApps.length > 0 ? (
                <AppList initialApps={savedApps} isSavedPage={true} />
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-20 bg-card rounded-lg border border-dashed">
                    <Frown className="w-16 h-16 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">No Saved Applications</h2>
                    <p className="mt-2 text-muted-foreground">You haven't saved any applications yet. <br /> Find an app you like and click the star to save it.</p>
                </div>
            )}
        </div>
    );
}
