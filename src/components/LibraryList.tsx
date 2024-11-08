import { useState } from 'react';
import { Github, MoreVertical, Pencil, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconButton } from './buttons/IconButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLibraryItems } from '@/hooks/use-library-items';
import type { LibraryFile } from '@/types/library';

interface LibraryListProps {
  libraries: LibraryFile[];
  onAddLibrary: () => void;
  onEditLibrary: (library: LibraryFile) => void;
  onDeleteLibrary: (libraryId: string) => void;
  onSelectLibrary?: (libraryId: string) => void;
  selectedLibraryId?: string | null;
}

export function LibraryList({
  libraries = [],
  onAddLibrary,
  onEditLibrary,
  onDeleteLibrary,
  onSelectLibrary,
  selectedLibraryId,
}: LibraryListProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refresh } = useLibraryItems(libraries);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <Button
          variant="default"
          size="sm"
          className="w-full gap-2"
          onClick={onAddLibrary}
        >
          <Plus className="h-4 w-4" />
          Add Tags
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {libraries && libraries.length > 0 ? (
            libraries.map((library) => (
              <div
                key={library.id}
                className={cn(
                  'flex items-start justify-between p-2 rounded-lg hover:bg-muted/60',
                  selectedLibraryId === library.id && 'bg-muted'
                )}
                onClick={() => onSelectLibrary?.(library.id)}
                role="button"
                tabIndex={0}
              >
                <div className="flex-1 text-left px-2 min-w-0">
                  <div className="font-medium break-words">
                    {library.name}
                  </div>
                  {library.gitConfig && (
                    <div className="text-sm opacity-70 flex items-center gap-1 mt-1 break-all">
                      <Github className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {library.gitConfig.owner}/{library.gitConfig.repo}
                      </span>
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton
                      icon={<MoreVertical className="h-4 w-4" />}
                      className="h-8 w-8 hover:bg-muted"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditLibrary(library)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRefresh()}>
                      <RefreshCw className={cn(
                        "h-4 w-4 mr-2",
                        isRefreshing && "animate-spin"
                      )} />
                      Refresh
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDeleteLibrary(library.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No libraries added yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}