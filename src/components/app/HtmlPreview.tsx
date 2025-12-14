'use client';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft } from 'lucide-react';

export function HtmlPreview({ htmlContent, onBack }: { htmlContent: string; onBack?: () => void }) {
  return (
    <>
      {onBack && (
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <DialogTitle>HTML Output Preview</DialogTitle>
              <DialogDescription>This is a render of the application's HTML content.</DialogDescription>
            </div>
          </div>
        </DialogHeader>
      )}
      <div className={onBack ? "mt-4 border rounded-lg overflow-hidden bg-white" : "w-screen h-screen"}>
        <iframe
          srcDoc={htmlContent}
          title="HTML Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-downloads"
        />
      </div>
    </>
  );
}
