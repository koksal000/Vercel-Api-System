'use client';

import { useState, useTransition, useEffect, FC } from 'react';
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
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';

const AuthSchema = z.object({
  password: z.string().min(1, "Password is required."),
});
type AuthFormValues = z.infer<typeof AuthSchema>;

const UpdateAppSchema = z.object({
  name: z.string().min(1, 'Application name is required.'),
  version: z.string().min(1, 'Version is required.'),
  description: z.string().min(1, 'Description is required.'),
  htmlContent: z.string().min(1, 'HTML content is required.'),
});
type UpdateFormValues = z.infer<typeof UpdateAppSchema>;

type View = 'details' | 'auth' | 'update';

const DetailsView: FC<{ app: ApplicationData; onEdit: () => void }> = ({ app, onEdit }) => {
    const { toast } = useToast();
    const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/apps/${app.id}`: '';

    const copyToClipboard = (textToCopy: string, type: string) => {
        navigator.clipboard.writeText(textToCopy);
        toast({ title: 'Copied!', description: `${type} copied to clipboard.` });
    }

    return (
        <>
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">{app.name}</DialogTitle>
              <DialogDescription>Version {app.version}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                    <Label className="text-right text-muted-foreground pt-2">Description</Label>
                    <p className="pt-2 leading-relaxed">{app.description || <span className="text-muted-foreground">No description provided.</span>}</p>
                </div>
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
              <Button variant="outline" onClick={onEdit}><Edit className="mr-2 h-4 w-4" /> Update</Button>
            </DialogFooter>
        </>
    );
};

const AuthView: FC<{ app: ApplicationData; onBack: () => void; onAuthenticated: () => void; }> = ({ app, onBack, onAuthenticated }) => {
    const authForm = useForm<AuthFormValues>({
        resolver: zodResolver(AuthSchema),
        defaultValues: { password: '' },
    });

    const onAuthSubmit = (values: AuthFormValues) => {
        if (values.password === app.password) {
            onAuthenticated();
        } else {
            authForm.setError('password', { type: 'manual', message: 'Incorrect password.' });
        }
    };
    
    return (
        <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
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
};

const UpdateView: FC<{ app: ApplicationData; onBack: () => void; onClose: () => void; }> = ({ app, onBack, onClose }) => {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
    
    const updateForm = useForm<UpdateFormValues>({
        resolver: zodResolver(UpdateAppSchema),
        defaultValues: {
            name: app.name,
            version: app.version,
            description: app.description || '',
            htmlContent: app.htmlContent,
        },
    });

    useEffect(() => {
        updateForm.reset({
            name: app.name,
            version: app.version,
            description: app.description || '',
            htmlContent: app.htmlContent,
        });
    }, [app, updateForm]);

    const onUpdateSubmit = (values: UpdateFormValues) => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Firestore not available' });
            return;
        }
        startTransition(async () => {
            const appRef = doc(firestore, 'applications', app.id);
            updateDocumentNonBlocking(appRef, {
                ...values,
                updatedAt: serverTimestamp(),
            });
            toast({ title: 'Application Updated!', description: 'Your changes have been published.' });
            onClose();
        });
    };

    const onDeleteConfirm = () => {
        if (!firestore) {
           toast({ variant: 'destructive', title: 'Delete Failed', description: 'Firestore not available' });
           return;
       }
       startTransition(async () => {
           const appRef = doc(firestore, 'applications', app.id);
           await deleteDoc(appRef);
           toast({ title: 'Application Deleted', description: `${app.name} has been permanently deleted.` });
           setDeleteAlertOpen(false);
           onClose();
       });
     };

    return (
        <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
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
                <FormField control={updateForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={updateForm.control} name="htmlContent" render={({ field }) => (<FormItem><FormLabel>HTML Content</FormLabel><FormControl><Textarea {...field} className="font-code min-h-[150px]" /></FormControl><FormMessage /></FormItem>)} />
                <DialogFooter className="justify-between pt-4">
                  <Button type="button" variant="destructive" onClick={() => setDeleteAlertOpen(true)} disabled={isPending}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                  </Button>
                  <Button type="submit" disabled={isPending} className="bg-accent hover:bg-accent/90">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the application
                             from the database.
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
};


export function AppDetailsModal({ app, isOpen, onClose }: { app: ApplicationData; isOpen: boolean; onClose: () => void; }) {
  const [view, setView] = useState<View>('details');

  useEffect(() => {
    if (isOpen) {
      setView('details');
    }
  }, [isOpen]);
  
  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setView('details');
    }, 300);
  }

  const renderContent = () => {
    switch(view) {
      case 'auth':
        return <AuthView app={app} onBack={() => setView('details')} onAuthenticated={() => setView('update')} />;
      case 'update':
        return <UpdateView app={app} onBack={() => setView('details')} onClose={handleClose} />;
      case 'details':
      default:
        return <DetailsView app={app} onEdit={() => setView('auth')} />;
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

    