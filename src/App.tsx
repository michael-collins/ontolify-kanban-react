import { useState, useEffect } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Plus, Settings, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { BoardDialog } from '@/components/BoardDialog';
import { AppConfigDialog } from '@/components/AppConfigDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { saveToGitHub, loadFromGitHub } from '@/lib/github';
import { getAuthToken } from '@/lib/storage';
import type { Board, AppConfig } from '@/types/app';

const initialConfig: AppConfig = {
  gitConfig: null,
  boards: [],
};

export function App() {
  const [config, setConfig] = useState<AppConfig>(initialConfig);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [showBoardDialog, setShowBoardDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const token = getAuthToken();
    if (token && config.gitConfig) {
      try {
        const content = await loadFromGitHub({
          token,
          ...config.gitConfig,
        });
        const loadedConfig = JSON.parse(content) as AppConfig;
        setConfig(loadedConfig);
        
        if (loadedConfig.boards.length > 0 && !selectedBoardId) {
          setSelectedBoardId(loadedConfig.boards[0].id);
        }
      } catch (error: any) {
        if (error?.response?.status !== 404) {
          toast({
            title: 'Failed to load configuration',
            description: error.message,
            variant: 'destructive',
          });
        }
      }
    }
  };

  const handleBoardSubmit = async (data: Partial<Board>) => {
    const updatedBoards = [...config.boards];
    let newBoard: Board;
    
    if (editingBoard) {
      const index = updatedBoards.findIndex(b => b.id === editingBoard.id);
      if (index !== -1) {
        newBoard = {
          ...editingBoard,
          ...data,
          lastModified: new Date().toISOString(),
        };
        updatedBoards[index] = newBoard;
      }
    } else {
      newBoard = {
        id: crypto.randomUUID(),
        name: data.name!,
        gitConfig: data.gitConfig!,
        lastModified: new Date().toISOString(),
      };
      updatedBoards.push(newBoard);
    }

    const updatedConfig = {
      ...config,
      boards: updatedBoards,
    };
    setConfig(updatedConfig);
    setShowBoardDialog(false);
    setEditingBoard(null);

    const token = getAuthToken();
    if (token && updatedConfig.gitConfig) {
      try {
        await saveToGitHub({
          token,
          ...updatedConfig.gitConfig,
        }, JSON.stringify(updatedConfig, null, 2));

        setSelectedBoardId(newBoard.id);

        toast({
          title: editingBoard ? 'Board Updated' : 'Board Created',
          description: `Successfully ${editingBoard ? 'updated' : 'created'} "${newBoard.name}"`,
        });
      } catch (error: any) {
        toast({
          title: 'Failed to save board',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  };

  const handleConfigSubmit = async (updatedConfig: AppConfig) => {
    setConfig(updatedConfig);
    setShowConfigDialog(false);

    const token = getAuthToken();
    if (token && updatedConfig.gitConfig) {
      try {
        await saveToGitHub({
          token,
          ...updatedConfig.gitConfig,
        }, JSON.stringify(updatedConfig, null, 2));

        toast({
          title: 'Configuration Saved',
          description: 'App configuration has been updated successfully',
        });

        // Load boards after saving config
        await loadConfig();
      } catch (error: any) {
        toast({
          title: 'Failed to save configuration',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  };

  const handleEditBoard = (board: Board) => {
    setEditingBoard(board);
    setShowBoardDialog(true);
  };

  const handleDeleteBoard = async (boardId: string) => {
    const updatedBoards = config.boards.filter(b => b.id !== boardId);
    const updatedConfig = { ...config, boards: updatedBoards };
    
    setConfig(updatedConfig);
    if (selectedBoardId === boardId) {
      setSelectedBoardId(updatedBoards[0]?.id || null);
    }

    const token = getAuthToken();
    if (token && config.gitConfig) {
      try {
        await saveToGitHub({
          token,
          ...config.gitConfig,
        }, JSON.stringify(updatedConfig, null, 2));

        toast({
          title: 'Board Deleted',
          description: 'The board has been removed successfully',
        });
      } catch (error: any) {
        toast({
          title: 'Failed to delete board',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  };

  const selectedBoard = config.boards.find(b => b.id === selectedBoardId);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30">
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Kanban Boards</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowConfigDialog(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <Button
            className="w-full gap-2"
            onClick={() => {
              setEditingBoard(null);
              setShowBoardDialog(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Board
          </Button>
          <div className="space-y-2">
            {config.boards.map(board => (
              <div key={board.id} className="flex items-center gap-2">
                <Button
                  variant={selectedBoardId === board.id ? 'secondary' : 'ghost'}
                  className="flex-1 justify-start"
                  onClick={() => setSelectedBoardId(board.id)}
                >
                  {board.name}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditBoard(board)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleDeleteBoard(board.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {selectedBoard ? (
          <KanbanBoard
            board={selectedBoard}
            onEdit={handleEditBoard}
            onDelete={handleDeleteBoard}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a board or create a new one
          </div>
        )}
      </div>

      <BoardDialog
        open={showBoardDialog}
        onOpenChange={setShowBoardDialog}
        onSubmit={handleBoardSubmit}
        board={editingBoard}
      />

      <AppConfigDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
        config={config}
        onSubmit={handleConfigSubmit}
      />
    </div>
  );
}

export default App;