import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from './TaskForm';
import type { Task } from '@/types/kanban';
import type { LibraryFile } from '@/types/library';

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (updates: Partial<Task>) => void;
  libraries?: LibraryFile[];
}

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onSubmit,
  libraries = [],
}: EditTaskDialogProps) {
  const [formState, setFormState] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate || '',
    hyperTags: task.hyperTags || [],
    selectedTerm: '',
    termPopoverOpen: false,
  });

  useEffect(() => {
    if (open) {
      setFormState({
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate || '',
        hyperTags: task.hyperTags || [],
        selectedTerm: '',
        termPopoverOpen: false,
      });
    }
  }, [open, task]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<Task> = {};
    
    if (formState.title !== task.title) updates.title = formState.title;
    if (formState.description !== task.description) updates.description = formState.description;
    if (formState.priority !== task.priority) updates.priority = formState.priority;
    if (formState.dueDate !== task.dueDate) updates.dueDate = formState.dueDate;
    if (JSON.stringify(formState.hyperTags) !== JSON.stringify(task.hyperTags)) {
      updates.hyperTags = formState.hyperTags;
    }

    onSubmit(updates);
    onOpenChange(false);
  }, [formState, task, onSubmit, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
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