import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLibraryItems } from '@/hooks/use-library-items';
import type { Task } from '@/types/kanban';
import type { TaskHyperTag } from '@/types/library';
import type { LibraryFile } from '@/types/library';

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (updates: Partial<Task>) => void;
  libraries?: LibraryFile[];
}

const createInitialState = (task: Task) => ({
  title: task.title,
  description: task.description,
  priority: task.priority,
  dueDate: task.dueDate || '',
  hyperTags: task.hyperTags || [],
  selectedTerm: '',
  openCombobox: false
});

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onSubmit,
  libraries = [], // Provide default empty array
}: EditTaskDialogProps) {
  const [formState, setFormState] = useState(() => createInitialState(task));
  const { items } = useLibraryItems(libraries);

  useEffect(() => {
    if (open) {
      setFormState(createInitialState(task));
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

  const handleTermSelect = useCallback((term: string) => {
    const libraryItem = items.find(item => item.term === term);
    if (libraryItem && !formState.hyperTags.some(tag => tag.term === term)) {
      setFormState(prev => ({
        ...prev,
        hyperTags: [...prev.hyperTags, {
          term: libraryItem.term,
          libraryItemId: libraryItem.id,
          libraryFileId: libraryItem.libraryFileId,
        }],
        selectedTerm: '',
        openCombobox: false
      }));
    }
  }, [items, formState.hyperTags]);

  const removeTag = useCallback((term: string) => {
    setFormState(prev => ({
      ...prev,
      hyperTags: prev.hyperTags.filter(tag => tag.term !== term)
    }));
  }, []);

  const showLibraryFeatures = libraries.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formState.title}
              onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formState.description}
              onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={formState.priority} 
              onValueChange={(value: Task['priority']) => 
                setFormState(prev => ({ ...prev, priority: value }))
              }
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
              onChange={(e) => setFormState(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
          {showLibraryFeatures && (
            <div className="space-y-2">
              <Label>Terms</Label>
              <Popover 
                open={formState.openCombobox} 
                onOpenChange={(open) => setFormState(prev => ({ ...prev, openCombobox: open }))}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={formState.openCombobox}
                    className="w-full justify-between"
                    type="button"
                  >
                    {formState.selectedTerm || "Select term..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search terms..." />
                    <CommandEmpty>No terms found.</CommandEmpty>
                    <CommandGroup>
                      {items.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.term}
                          onSelect={handleTermSelect}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formState.hyperTags.some(tag => tag.term === item.term)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {item.term}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {formState.hyperTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formState.hyperTags.map((tag) => (
                    <div
                      key={tag.term}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                    >
                      {tag.term}
                      <button
                        type="button"
                        onClick={() => removeTag(tag.term)}
                        className="text-secondary-foreground/50 hover:text-secondary-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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