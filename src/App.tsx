import { useState, useEffect } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BoardDialog } from '@/components/BoardDialog';
import { AppConfigDialog } from '@/components/AppConfigDialog';
import { BoardList } from '@/components/BoardList';
import { TopBar } from '@/components/TopBar';
import { useToast } from '@/hooks/use-toast';
import { saveToGitHub, loadFromGitHub } from '@/lib/github';
import { getAuthToken } from '@/lib/storage';
import type { Board, AppConfig } from '@/types/app';

const initialConfig: AppConfig = {
  gitConfig: null,
  boards: [],
};

function App() {
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

  const saveConfig = async (updatedConfig: AppConfig) => {
    const token = getAuthToken();
    if (!token || !updatedConfig.gitConfig) {
      toast({
        title: 'Configuration Error',
        description: 'Please configure GitHub settings first',
        variant: 'destructive',
      });
      return;
    }

    try {
      await saveToGitHub({
        token,
        ...updatedConfig.gitConfig,
      }, JSON.stringify(updatedConfig, null, 2));

      setConfig(updatedConfig);
      toast({
        title: 'Configuration Saved',
        description: 'App configuration has been updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to save configuration',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
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
      } else {
        // Handle the case where the board isn't found
        return;
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

    try {
      await saveConfig(updatedConfig);
      setShowBoardDialog(false);
      setEditingBoard(null);
      setSelectedBoardId(newBoard.id);
    } catch (error) {
      // Error already handled in saveConfig
      return;
    }
  };

  const handleConfigSubmit = async (updatedConfig: AppConfig) => {
    try {
      await saveConfig(updatedConfig);
      setShowConfigDialog(false);
    } catch (error) {
      // Error already handled in saveConfig
      return;
    }
  };

  const handleEditBoard = (board: Board) => {
    setEditingBoard(board);
    setShowBoardDialog(true);
  };

  const handleDeleteBoard = async (boardId: string) => {
    const updatedBoards = config.boards.filter(b => b.id !== boardId);
    const updatedConfig = { ...config, boards: updatedBoards };
    
    try {
      await saveConfig(updatedConfig);
      
      if (selectedBoardId === boardId) {
        setSelectedBoardId(updatedBoards[0]?.id || null);
      }
    } catch (error) {
      // Error already handled in saveConfig
      return;
    }
  };

  const selectedBoard = config.boards.find(b => b.id === selectedBoardId);

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar onConfigureApp={() => setShowConfigDialog(true)} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r">
          <BoardList
            boards={config.boards}
            selectedBoardId={selectedBoardId}
            onSelectBoard={setSelectedBoardId}
            onAddBoard={() => {
              setEditingBoard(null);
              setShowBoardDialog(true);
            }}
            onEditBoard={handleEditBoard}
            onDeleteBoard={handleDeleteBoard}
          />
        </div>
        <div className="flex-1 overflow-auto">
          {selectedBoard ? (
            <KanbanBoard
              board={selectedBoard}
              onEdit={handleEditBoard}
              onDelete={handleDeleteBoard}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="mb-4">No board selected</p>
              <Button onClick={() => setShowBoardDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create a Board
              </Button>
            </div>
          )}
        </div>
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