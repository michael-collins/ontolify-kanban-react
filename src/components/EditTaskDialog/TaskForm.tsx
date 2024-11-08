import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskTermSelector } from './TaskTermSelector';
import type { Task } from '@/types/kanban';
import type { TaskHyperTag } from '@/types/library';
import type { LibraryFile } from '@/types/library';

interface FormState {
  title: string;
  description: string;
  priority: Task['priority'];
  dueDate: string;
  hyperTags: TaskHyperTag[];
  selectedTerm: string;
  termPopoverOpen: boolean;
}

interface TaskFormProps {
  formState: FormState;
  setFormState: (state: FormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  libraries?: LibraryFile[];
}

export function TaskForm({
  formState,
  setFormState,
  onSubmit,
  onCancel,
  libraries = [],
}: TaskFormProps) {
  const handleInputChange = useCallback((field: keyof FormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, [setFormState]);

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formState.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter task title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formState.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Enter task description"
          required
        />
      </div>

      {libraries.length > 0 && (
        <TaskTermSelector
          formState={formState}
          setFormState={setFormState}
          libraries={libraries}
        />
      )}

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select 
          value={formState.priority} 
          onValueChange={(value: Task['priority']) => handleInputChange('priority', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={formState.dueDate}
          onChange={(e) => handleInputChange('dueDate', e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}