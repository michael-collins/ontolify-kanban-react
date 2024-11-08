import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from './TaskForm';
import type { Task } from '@/types/kanban';
import type { LibraryFile } from '@/types/library';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Omit<Task, 'id' | 'status'>) => void;
  libraries?: LibraryFile[];
}

const initialFormState = {
  title: '',
  description: '',
  priority: 'medium' as Task['priority'],
  dueDate: '',
  hyperTags: [],
  selectedTerm: '',
  termPopoverOpen: false,
};

export function AddTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  libraries = [],
}: AddTaskDialogProps) {
  const [formState, setFormState] = useState(initialFormState);

  useEffect(() => {
    if (!open) {
      setFormState(initialFormState);
    }
  }, [open]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const { selectedTerm, termPopoverOpen, ...taskData } = formState;
    onSubmit(taskData);
    onOpenChange(false);
  }, [formState, onSubmit, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <TaskForm
          formState={formState}
          setFormState={setFormState}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          libraries={libraries}
        />
      </DialogContent>
    </Dialog>
  );
}