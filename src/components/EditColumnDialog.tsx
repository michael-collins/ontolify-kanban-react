import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Column } from '@/types/kanban';

interface EditColumnDialogProps {
  column: Column | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string) => void;
}

export function EditColumnDialog({ column, open, onOpenChange, onSubmit }: EditColumnDialogProps) {
  const [title, setTitle] = useState('');

  // Reset form when dialog opens with current column data
  useEffect(() => {
    if (open && column) {
      setTitle(column.title);
    } else {
      setTitle('');
    }
  }, [open, column]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(title);
    onOpenChange(false);
  };

  // Don't render the dialog if there's no column to edit
  if (!column) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Column</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter column title"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}