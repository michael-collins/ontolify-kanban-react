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
  onConfigureApp,
}: BoardListProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Boards</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onConfigureApp}
            >
              <Github className="h-4 w-4" />
              Configure
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              onClick={onAddBoard}
            >
              <Plus className="h-4 w-4" />
              New Board
            </Button>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {boards.map((board) => (
            <div
              key={board.id}
              className={cn(
                'flex items-center justify-between p-2 rounded-lg transition-colors',
                selectedBoardId === board.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted/60'
              )}
            >
              <button
                className="flex-1 text-left px-2"
                onClick={() => onSelectBoard(board.id)}
              >
                <div className="font-medium">{board.name}</div>
                {board.gitConfig && (
                  <div className="text-sm opacity-70 flex items-center gap-1 mt-1">
                    <Github className="h-3 w-3" />
                    {board.gitConfig.owner}/{board.gitConfig.repo}
                  </div>
                )}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-8 w-8',
                      selectedBoardId === board.id
                        ? 'hover:bg-primary-foreground/10'
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
                    className="text-red-600 focus:text-red-600"
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