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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Eye, Edit, Key, Loader2, ArrowLeft, Link as LinkIcon, Copy, Trash2 } from 'lucide-react';
import { HtmlPreview } from './HtmlPreview';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

const AuthSchema = z.object({
  password: z.string().min(1, "Password is required."),
});
type AuthFormValues = z.infer<typeof AuthSchema>;

const UpdateAppSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Application name is required.'),
  version: z.string().min(1, 'Version is required.'),
  htmlContent: z.string().min(1, 'HTML content is required.'),
});
type UpdateFormValues = z.infer<typeof UpdateAppSchema>;

type View = 'details' | 'auth' | 'update';

export function AppDetailsModal({ app, isOpen, onClose }: { app: ApplicationData; isOpen: boolean; onClose: () => void; }) {
  const [view, setView] = useState<View>('details');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const authForm = useForm<AuthFormValues>({
    resolver: zodResolver(AuthSchema),
    defaultValues: { password: '' },
  });

  const updateForm = useForm<UpdateFormValues>({
    resolver: zodResolver(UpdateAppSchema),
  });

  useEffect(() => {
    if (isOpen) {
      updateForm.reset({
        id: app.id,
        name: app.name,
        version: app.version,
        htmlContent: app.htmlContent,
      });
      authForm.reset();
    }
  }, [isOpen, app]);


  const onAuthSubmit = (values: AuthFormValues) => {
    if (values.password === app.password) {
      setView('update');
    } else {
      authForm.setError('password', { type: 'manual', message: 'Incorrect password.' });
    }
  };

  const onUpdateSubmit = (values: UpdateFormValues) => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Firestore not available' });
        return;
    }
    startTransition(async () => {
      const appRef = doc(firestore, 'applications', values.id);
      
      const { id, name, version, htmlContent } = values;

      updateDocumentNonBlocking(appRef, {
        name,
        version,
        htmlContent,
        updatedAt: serverTimestamp(),
      });
      
      toast({ title: 'Application Updated!', description: 'Your changes have been published.' });
      handleClose();
    });
  };

  const onDeleteConfirm = () => {
     if (!firestore) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: 'Firestore not available' });
        return;
    }
    startTransition(() => {
        const appRef = doc(firestore, 'applications', app.id);
        updateDocumentNonBlocking(appRef, {
            deleted: true,
            updatedAt: serverTimestamp(),
        });
        toast({ title: 'Application Deleted', description: `${app.name} has been deleted.` });
        setDeleteAlertOpen(false);
        handleClose();
    });
  };
  
  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setView('details');
    }, 300);
  }
  
  const copyToClipboard = (textToCopy: string, type: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast({ title: 'Copied!', description: `${type} copied to clipboard.` });
  }

  const renderContent = () => {
    const apiUrl = `https://vercel-api-system.vercel.app/api/apps/${app.id}`;
    switch(view) {
      case 'auth':
        return (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('details')}><ArrowLeft className="h-4 w-4" /></Button>
                <div>
                  <DialogTitle>Authentication Required</DialogTitle>
                  <DialogDescription>Enter the password for '{app.name}' to continue.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <Form {...authForm}>
              <form onSubmit={authForm.handleSubmit(onAuthSubmit)} className="space-y-4 py-4">
                <FormField control={authForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Update Password</FormLabel>
                    <FormControl><Input type="password" {...field} placeholder="••••••••" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit" disabled={authForm.formState.isSubmitting} className="bg-accent hover:bg-accent/90">
                    {authForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Authenticate
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        );
      case 'update':
        return (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('details')}><ArrowLeft className="h-4 w-4" /></Button>
                <div>
                    <DialogTitle>Update {app.name}</DialogTitle>
                    <DialogDescription>Modify application details below.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4 py-4">
                <FormField control={updateForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>App Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={updateForm.control} name="version" render={({ field }) => (<FormItem><FormLabel>Version</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={updateForm.control} name="htmlContent" render={({ field }) => (<FormItem><FormLabel>HTML Content</FormLabel><FormControl><Textarea {...field} className="font-code min-h-[150px]" /></FormControl><FormMessage /></FormItem>)} />
                <DialogFooter className="justify-between">
                  <Button type="button" variant="destructive" onClick={() => setDeleteAlertOpen(true)} disabled={isPending}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
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
              <Button variant="outline" onClick={() => setView('auth')}><Edit className="mr-2 h-4 w-4" /> Update</Button>
            </DialogFooter>
          </>
        );
    }
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[625px]">
        {renderContent()}
      </DialogContent>
    </Dialog>

    <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    "{app.name}" application.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDeleteConfirm} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Continue
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
