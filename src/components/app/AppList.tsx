'use client';
import { useState, useMemo } from 'react';
import { ApplicationData } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { AppCard } from './AppCard';
import { Search, Frown } from 'lucide-react';

export function AppList({ initialApps, isSavedPage = false }: { initialApps: ApplicationData[], isSavedPage?: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredApps = useMemo(() => {
    if (!searchTerm) return initialApps;
    return initialApps.filter(app =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, initialApps]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={isSavedPage ? "Search saved apps..." : "Search all applications..."}
          className="pl-10 w-full md:w-1/2 lg:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredApps.map(app => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-card rounded-lg border border-dashed">
            <Frown className="w-16 h-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No Applications Found</h2>
            <p className="mt-2 text-muted-foreground">
                {initialApps.length > 0 ? "No applications match your search." : "There are no applications to display yet."}
            </p>
        </div>
      )}
    </div>
  );
}
