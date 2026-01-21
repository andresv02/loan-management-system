'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { addCompany } from '@/lib/actions';

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function AddCompanyDialog({ open, onOpenChange, children }: AddCompanyDialogProps) {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addCompany(name.trim());
    setName('');
    onOpenChange(false);
    // Refresh the page to show the new company
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Compañía</DialogTitle>
          <DialogDescription>
            Ingrese el nombre de la compañía para agregarla al sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Nombre de la Compañía</Label>
              <Input
                id="companyName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingrese nombre de compañía"
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit">Agregar Compañía</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}