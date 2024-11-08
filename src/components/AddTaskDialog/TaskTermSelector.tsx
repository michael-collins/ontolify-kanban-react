import { useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { useLibraryContext } from '@/contexts/LibraryContext';
import type { TaskHyperTag } from '@/types/library';
import type { LibraryFile } from '@/types/library';

interface FormState {
  hyperTags: TaskHyperTag[];
  selectedTerm: string;
  termPopoverOpen: boolean;
  [key: string]: any;
}

interface TaskTermSelectorProps {
  formState: FormState;
  setFormState: (state: FormState) => void;
  libraries?: LibraryFile[];
}

export function TaskTermSelector({
  formState,
  setFormState,
}: TaskTermSelectorProps) {
  const { items } = useLibraryContext();

  // Memoize the filtered and sorted items to prevent unnecessary re-renders
  const availableTerms = useMemo(() => {
    const usedTerms = new Set(formState.hyperTags.map(tag => tag.term));
    return items
      .filter(item => !usedTerms.has(item.term))
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [items, formState.hyperTags]);

  const handleTermSelect = useCallback((term: string) => {
    const libraryItem = items.find(item => item.term === term);
    if (!libraryItem) return;

    setFormState(prev => ({
      ...prev,
      hyperTags: [
        ...prev.hyperTags,
        {
          term: libraryItem.term,
          libraryItemId: libraryItem.id,
          libraryFileId: libraryItem.libraryFileId,
        }
      ],
      selectedTerm: '',
      termPopoverOpen: false
    }));
  }, [items, setFormState]);

  const removeTag = useCallback((term: string) => {
    setFormState(prev => ({
      ...prev,
      hyperTags: prev.hyperTags.filter(tag => tag.term !== term)
    }));
  }, [setFormState]);

  return (
    <div className="space-y-2">
      <Label>Terms</Label>
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
            Select terms...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" side="bottom" align="start">
          <Command>
            <CommandInput placeholder="Search terms..." />
            <CommandEmpty>No terms found.</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {availableTerms.map((item) => (
                <CommandItem
                  key={`${item.libraryFileId}-${item.id}`}
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
              key={`${tag.libraryFileId}-${tag.libraryItemId}`}
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
  );
}