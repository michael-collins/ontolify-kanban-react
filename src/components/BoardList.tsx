import { MoreVertical, Plus, Trash2, Pencil, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Board } from '@/types/board';

interface BoardListProps {
  boards: Board[];
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onAddBoard: () => void;
  onEditBoard: (board: Board) => void;
  onDeleteBoard: (boardId: string) => void;
  onConfigureApp: () => void;
}

export function BoardList({
  boards,
  selectedBoardId,
  onSelectBoard,
  onAddBoard,
  onEditBoard,
  onDeleteBoard,
}: BoardListProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <Button
          variant="default"
          size="sm"
          className="w-full gap-2"
          onClick={onAddBoard}
        >
          <Plus className="h-4 w-4" />
          New Board
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {boards.map((board) => (
            <div
              key={board.id}
              className={cn(
                'flex items-start justify-between p-2 rounded-lg transition-colors',
                selectedBoardId === board.id
                  ? 'bg-secondary/90 hover:bg-secondary'
                  : 'hover:bg-muted/60'
              )}
            >
              <button
                className="flex-1 text-left px-2 min-w-0"
                onClick={() => onSelectBoard(board.id)}
              >
                <div className="font-medium break-words">
                  {board.name}
                </div>
                {board.gitConfig && (
                  <div className="text-sm opacity-70 flex items-center gap-1 mt-1 break-all">
                    <Github className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {board.gitConfig.owner}/{board.gitConfig.repo}
                    </span>
                  </div>
                )}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-8 w-8 shrink-0',
                      selectedBoardId === board.id
                        ? 'hover:bg-secondary-foreground/10'
                        : 'hover:bg-muted'
                    )}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditBoard(board)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDeleteBoard(board.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}