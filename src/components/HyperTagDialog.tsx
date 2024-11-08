import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HyperTagDetails } from './HyperTagDetails';
import type { TaskHyperTag } from '@/types/library';

interface HyperTagDialogProps {
  tag: TaskHyperTag;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HyperTagDialog = memo(function HyperTagDialog({ 
  tag, 
  open, 
  onOpenChange 
}: HyperTagDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tag.term}</DialogTitle>
        </DialogHeader>
        <HyperTagDetails tag={tag} />
      </DialogContent>
    </Dialog>
  );
});