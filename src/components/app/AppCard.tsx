'use client';

import { useState } from 'react';
import { ApplicationData } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Code } from 'lucide-react';
import { useSavedApps } from '@/hooks/use-saved-apps';
import { cn } from '@/lib/utils';
import { AppDetailsModal } from './AppDetailsModal';

export function AppCard({ app }: { app: ApplicationData }) {
  const { savedAppIds, toggleSave, isLoaded } = useSavedApps();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const isSaved = savedAppIds.includes(app.id);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSave(app.id);
  };
  
  return (
    <>
      <Card
        className="group relative cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 hover:border-accent"
        onClick={() => setIsDetailsOpen(true)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium font-headline truncate pr-10" title={app.name}>
            {app.name}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={handleSaveClick}
            aria-label={isSaved ? 'Unsave application' : 'Save application'}
          >
            <Star
              className={cn(
                'h-5 w-5 transition-all text-muted-foreground group-hover:text-amber-400',
                isSaved ? 'fill-amber-400 text-amber-400' : 'fill-transparent'
              )}
            />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Code className="h-3 w-3" />
            <span>Version {app.version}</span>
          </div>
        </CardContent>
      </Card>
      <AppDetailsModal
        app={app}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </>
  );
}
