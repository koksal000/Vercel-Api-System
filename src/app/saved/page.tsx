'use client';
import { useEffect, useState, useMemo } from 'react';
import { getApplications } from "@/app/actions";
import { ApplicationData } from "@/lib/definitions";
import { useSavedApps } from '@/hooks/use-saved-apps';
import { AppList } from '@/components/app/AppList';
import { Skeleton } from '@/components/ui/skeleton';
import { Frown } from 'lucide-react';

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
    const [allApps, setAllApps] = useState<ApplicationData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { savedAppIds, isLoaded: isSavedAppsLoaded } = useSavedApps();

    useEffect(() => {
        async function fetchApps() {
            setIsLoading(true);
            const result = await getApplications();
            if (result.success && result.data) {
                setAllApps(result.data);
            }
            setIsLoading(false);
        }
        fetchApps();
    }, []);

    const savedApps = useMemo(() => {
        return allApps
            .filter(app => savedAppIds.includes(app.id))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [allApps, savedAppIds]);
    
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
