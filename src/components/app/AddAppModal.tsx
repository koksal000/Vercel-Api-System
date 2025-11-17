'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Loader2, Copy } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { generateId } from '@/lib/utils';
import { doc, serverTimestamp } from 'firebase/firestore';

const AppSchema = z.object({
  name: z.string().min(1, 'Application name is required.'),
  version: z.string().min(1, 'Version is required.'),
  htmlContent: z.string().min(1, 'HTML content is required.'),
  password: z.string().min(4, 'Password must be at least 4 characters long.'),
});

type AppFormValues = z.infer<typeof AppSchema>;

export function AddAppModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const firestore = useFirestore();

  const form = useForm<AppFormValues>({
    resolver: zodResolver(AppSchema),
    defaultValues: {
      name: '',
      version: '1.0.0',
      htmlContent: '',
      password: '',
    },
  });

  const onSubmit = (values: AppFormValues) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Firebase is not available.',
      });
      return;
    }

    startTransition(async () => {
        const appId = generateId(10);
        const appRef = doc(firestore, 'applications', appId);
        const appData = {
          id: appId,
          ...values,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        setDocumentNonBlocking(appRef, appData, {});
        
        toast({
            title: 'Application Published!',
            description: 'Your new application is now live.',
        });
        setSubmittedId(appData.id);
        form.reset();
    });
  };

  const handleClose = () => {
    setOpen(false);
    setSubmittedId(null);
    form.reset();
  };

  const copyToClipboard = () => {
    if (submittedId) {
        navigator.clipboard.writeText(submittedId);
        toast({ title: 'Copied!', description: 'Application ID copied to clipboard.' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); else setOpen(true);}}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Application
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        {submittedId ? (
          <>
            <DialogHeader>
              <DialogTitle>🚀 Published Successfully!</DialogTitle>
              <DialogDescription>
                Your application has been published. Use the ID below to fetch its content.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 space-y-2">
                <Label htmlFor="app-id">Your Unique Application ID</Label>
                <div className="flex items-center gap-2">
                    <Input id="app-id" value={submittedId} readOnly className="font-code text-lg" />
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add a New Application</DialogTitle>
              <DialogDescription>
                Fill in the details below to publish a new application.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Application Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="version" render={({ field }) => (
                    <FormItem><FormLabel>Version</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="htmlContent" render={({ field }) => (
                  <FormItem><FormLabel>HTML Content</FormLabel><FormControl><Textarea {...field} className="font-code min-h-[150px]" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Update Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" type="button">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isPending} className="bg-accent hover:bg-accent/90">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Publish
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
