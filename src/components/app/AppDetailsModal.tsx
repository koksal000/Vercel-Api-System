'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { ApplicationData } from '@/lib/definitions';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Eye, Edit, Key, Loader2, ArrowLeft, Link as LinkIcon, Copy } from 'lucide-react';
import { HtmlPreview } from './HtmlPreview';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

const UpdateAppSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Application name is required.'),
  version: z.string().min(1, 'Version is required.'),
  htmlContent: z.string().min(1, 'HTML content is required.'),
  authPassword: z.string().min(1, 'Password is required to update.'),
});
type UpdateFormValues = z.infer<typeof UpdateAppSchema>;

type View = 'details' | 'update';

export function AppDetailsModal({ app, isOpen, onClose }: { app: ApplicationData; isOpen: boolean; onClose: () => void; }) {
  const [view, setView] = useState<View>('details');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(UpdateAppSchema),
    defaultValues: {
      id: app.id,
      name: app.name,
      version: app.version,
      htmlContent: app.htmlContent,
      authPassword: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        id: app.id,
        name: app.name,
        version: app.version,
        htmlContent: app.htmlContent,
        authPassword: '',
      });
    }
  }, [isOpen, app]);


  const onUpdateSubmit = (values: UpdateFormValues) => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Firestore not available' });
        return;
    }
    startTransition(async () => {
      const appRef = doc(firestore, 'applications', values.id);
      
      const { id, name, version, htmlContent, authPassword } = values;

      updateDocumentNonBlocking(appRef, {
        name,
        version,
        htmlContent,
        password: authPassword,
        updatedAt: serverTimestamp(),
      });
      
      toast({ title: 'Application Updated!', description: 'Your changes have been published.' });
      form.reset({ ...values, authPassword: '' });
      setView('details');
      onClose();
    });
  };
  
  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setView('details');
        form.reset({
            id: app.id,
            name: app.name,
            version: app.version,
            htmlContent: app.htmlContent,
            authPassword: '',
        });
    }, 300);
  }
  
  const copyToClipboard = (textToCopy: string, type: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast({ title: 'Copied!', description: `${type} copied to clipboard.` });
  }

  const renderContent = () => {
    const apiUrl = `https://vercel-api-system.vercel.app/api/apps/${app.id}`;
    switch(view) {
      case 'update':
        return (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('details')}><ArrowLeft className="h-4 w-4" /></Button>
                <div>
                    <DialogTitle>Update {app.name}</DialogTitle>
                    <DialogDescription>Enter password to modify application.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onUpdateSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>App Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="version" render={({ field }) => (<FormItem><FormLabel>Version</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="htmlContent" render={({ field }) => (<FormItem><FormLabel>HTML Content</FormLabel><FormControl><Textarea {...field} className="font-code min-h-[150px]" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="authPassword" render={({ field }) => (<FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} placeholder="••••••••" /></FormControl><FormMessage /></FormItem>)} />
                <DialogFooter>
                  <Button type="submit" disabled={isPending} className="bg-accent hover:bg-accent/90">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        );
      case 'details':
      default:
        return (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">{app.name}</DialogTitle>
              <DialogDescription>Version {app.version}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                    <Label className="text-right text-muted-foreground pt-2">App ID</Label>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={app.id} className="font-code" />
                       <Button variant="outline" size="icon" onClick={() => copyToClipboard(app.id, 'App ID')}>
                          <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                </div>
                 <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                    <Label className="text-right text-muted-foreground pt-2">API URL</Label>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={apiUrl} className="font-code" />
                       <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiUrl, 'API URL')}>
                          <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                    <Label className="text-right text-muted-foreground">Created</Label>
                    <span>{formatDate(app.createdAt)}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                    <Label className="text-right text-muted-foreground">Last Updated</Label>
                    <span>{formatDate(app.updatedAt)}</span>
                </div>
            </div>
            <DialogFooter className="sm:justify-start gap-2">
              <Button asChild>
                <Link href={`/preview/${app.id}`} target="_blank">
                  <Eye className="mr-2 h-4 w-4" /> View Output
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setView('update')}><Edit className="mr-2 h-4 w-4" /> Update</Button>
            </DialogFooter>
          </>
        );
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[625px]">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
