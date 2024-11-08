import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BoardList } from './BoardList';
import { LibraryList } from './LibraryList';
import { cn } from '@/lib/utils';
import type { Board } from '@/types/app';
import type { LibraryFile } from '@/types/library';

interface SidebarTabsProps {
  boards: Board[];
  libraries: LibraryFile[];
  selectedBoardId: string | null;
  selectedLibraryId: string | null;
  onSelectBoard: (boardId: string) => void;
  onSelectLibrary: (libraryId: string | null) => void;
  onAddBoard: () => void;
  onEditBoard: (board: Board) => void;
  onDeleteBoard: (boardId: string) => void;
  onAddLibrary: () => void;
  onEditLibrary: (library: LibraryFile) => void;
  onDeleteLibrary: (libraryId: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SidebarTabs({
  boards,
  libraries,
  selectedBoardId,
  selectedLibraryId,
  onSelectBoard,
  onSelectLibrary,
  onAddBoard,
  onEditBoard,
  onDeleteBoard,
  onAddLibrary,
  onEditLibrary,
  onDeleteLibrary,
  activeTab,
  onTabChange,
}: SidebarTabsProps) {
  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={onTabChange} className="h-full flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="boards"
            className={cn(
              'rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold',
              'data-[state=active]:border-primary'
            )}
          >
            Boards
          </TabsTrigger>
          <TabsTrigger
            value="library"
            className={cn(
              'rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold',
              'data-[state=active]:border-primary'
            )}
          >
            Library
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-hidden">
          <TabsContent value="boards" className="h-full m-0">
            <BoardList
              boards={boards}
              selectedBoardId={selectedBoardId}
              onSelectBoard={onSelectBoard}
              onAddBoard={onAddBoard}
              onEditBoard={onEditBoard}
              onDeleteBoard={onDeleteBoard}
            />
          </TabsContent>
          <TabsContent value="library" className="h-full m-0">
            <LibraryList
              libraries={libraries}
              onAddLibrary={onAddLibrary}
              onEditLibrary={onEditLibrary}
              onDeleteLibrary={onDeleteLibrary}
              onSelectLibrary={onSelectLibrary}
              selectedLibraryId={selectedLibraryId}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}