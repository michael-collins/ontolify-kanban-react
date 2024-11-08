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
import type { LibraryFile } from '@/types/library';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Omit<Task, 'id' | 'status'>) => void;
  libraries?: LibraryFile[];
}

const defaultFormState = {
  title: '',
  description: '',
  priority: 'medium' as Task['priority'],
  dueDate: '',
  selectedTerm: '',
  termPopoverOpen: false,
  hyperTags: []
};

export function AddTaskDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  libraries = []
}: AddTaskDialogProps) {
  const [formState, setFormState] = useState(defaultFormState);
  const { items: libraryItems } = useLibraryItems(libraries);

  useEffect(() => {
    if (!open) {
      setFormState(defaultFormState);
    }
  }, [open]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedItem = libraryItems.find(item => item.term === formState.selectedTerm);
    
    let finalDescription = formState.description;
    if (selectedItem) {
      finalDescription = `${formState.description}\n\nTerm: ${selectedItem.term}\nDefinition: ${selectedItem.definition}\nCategory: ${selectedItem.category}\nAssociated Material: ${selectedItem.associatedMaterial}`;
    }

    onSubmit({
      title: formState.title,
      description: finalDescription,
      priority: formState.priority,
      dueDate: formState.dueDate,
      hyperTags: selectedItem ? [{
        term: selectedItem.term,
        libraryItemId: selectedItem.id,
        libraryFileId: selectedItem.libraryFileId
      }] : []
    });

    onOpenChange(false);
  }, [formState, libraryItems, onSubmit, onOpenChange]);

  const handleTermSelect = useCallback((term: string) => {
    setFormState(prev => ({
      ...prev,
      selectedTerm: term === prev.selectedTerm ? '' : term,
      termPopoverOpen: false
    }));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
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

          {libraries.length > 0 && (
            <div className="space-y-2">
              <Label>Term</Label>
              <Popover 
                open={formState.termPopoverOpen} 
                onOpenChange={(open) => setFormState(prev => ({ ...prev, termPopoverOpen: open }))}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={formState.termPopoverOpen}
                    className="w-full justify-between"
                    type="button"
                  >
                    {formState.selectedTerm || "Select term..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search terms..." />
                    <CommandEmpty>No terms found.</CommandEmpty>
                    <CommandGroup>
                      {libraryItems.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.term}
                          onSelect={handleTermSelect}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formState.selectedTerm === item.term ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {item.term}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

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

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}