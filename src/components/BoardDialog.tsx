import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Board } from '@/types/app';

interface BoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Board>) => void;
  board: Board | null;
}

export function BoardDialog({ open, onOpenChange, onSubmit, board }: BoardDialogProps) {
  const [name, setName] = useState(board?.name || '');

  useEffect(() => {
    if (open) {
      if (board) {
        setName(board.name);
      } else {
        setName('');
      }
    }
  }, [open, board]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<Board> = { name };
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{board ? 'Edit Board' : 'New Board'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Board Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter board name"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name}>
              {board ? 'Save Changes' : 'Create Board'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}