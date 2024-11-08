import { useState, useEffect, useCallback } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BoardDialog } from '@/components/BoardDialog';
import { LibraryDialog } from '@/components/LibraryDialog';
import { AppConfigDialog } from '@/components/AppConfigDialog';
import { SidebarTabs } from '@/components/SidebarTabs';
import { TopBar } from '@/components/TopBar';
import { LibraryItemDetails } from '@/components/LibraryItemDetails';
import { LibraryUploadZone } from '@/components/LibraryUploadZone';
import { useToast } from '@/hooks/use-toast';
import { saveToGitHub, loadFromGitHub } from '@/lib/github';
import { getAuthToken } from '@/lib/storage';
import type { Board, AppConfig } from '@/types/app';
import type { LibraryFile } from '@/types/library';

const initialConfig: AppConfig = {
  gitConfig: null,
  boards: [],
  libraries: [],
};

const defaultColumns = [
  { id: 'column-1', title: 'To Do', tasks: [], order: 0 },
  { id: 'column-2', title: 'In Progress', tasks: [], order: 1 },
  { id: 'column-3', title: 'Done', tasks: [], order: 2 },
];

function App() {
  const [config, setConfig] = useState<AppConfig>(initialConfig);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('boards');
  const [showBoardDialog, setShowBoardDialog] = useState(false);
  const [showLibraryDialog, setShowLibraryDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [editingLibrary, setEditingLibrary] = useState<LibraryFile | null>(null);
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
        // Ensure libraries array exists and gitConfig is preserved
        const normalizedConfig = {
          ...loadedConfig,
          libraries: loadedConfig.libraries?.map(lib => ({
            ...lib,
            gitConfig: lib.gitConfig || null
          })) || [],
        };
        setConfig(normalizedConfig);
        
        if (normalizedConfig.boards.length > 0 && !selectedBoardId) {
          setSelectedBoardId(normalizedConfig.boards[0].id);
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
        description: 'Please configure GitHub settings first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Ensure libraries array exists and gitConfig is preserved
      const configToSave = {
        ...updatedConfig,
        libraries: updatedConfig.libraries?.map(lib => ({
          ...lib,
          gitConfig: lib.gitConfig || null
        })) || [],
      };

      await saveToGitHub({
        token,
        ...configToSave.gitConfig,
      }, JSON.stringify(configToSave, null, 2));

      setConfig(configToSave);
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
    if (!config.gitConfig) {
      toast({
        title: 'Configuration Required',
        description: 'Please configure GitHub repository settings first.',
        variant: 'destructive',
      });
      return;
    }

    const updatedBoards = [...config.boards];
    let newBoard: Board;
    
    const boardName = data.name!;
    const safeName = boardName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
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
        return;
      }
    } else {
      newBoard = {
        id: crypto.randomUUID(),
        name: boardName,
        gitConfig: {
          owner: config.gitConfig.owner,
          repo: config.gitConfig.repo,
          path: `boards/${safeName}.json`,
        },
        lastModified: new Date().toISOString(),
      };
      updatedBoards.push(newBoard);

      // Initialize empty board data
      const token = getAuthToken();
      if (token) {
        try {
          await saveToGitHub({
            token,
            ...newBoard.gitConfig,
          }, JSON.stringify({
            columns: defaultColumns,
            tasks: [],
          }, null, 2));
        } catch (error) {
          console.error('Failed to initialize board:', error);
          toast({
            title: 'Board Initialization Failed',
            description: 'Could not create the initial board structure.',
            variant: 'destructive',
          });
          return;
        }
      }
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
      setActiveTab('boards');
    } catch (error) {
      return;
    }
  };

  const handleLibrarySubmit = async (data: Partial<LibraryFile>) => {
    const updatedLibraries = [...(config.libraries || [])];
    let newLibrary: LibraryFile;
    
    if (editingLibrary) {
      const index = updatedLibraries.findIndex(l => l.id === editingLibrary.id);
      if (index !== -1) {
        newLibrary = {
          ...editingLibrary,
          ...data,
          lastModified: new Date().toISOString(),
        };
        updatedLibraries[index] = newLibrary;
      } else {
        return;
      }
    } else {
      newLibrary = {
        id: crypto.randomUUID(),
        name: data.name!,
        gitConfig: data.gitConfig!,
        lastModified: new Date().toISOString(),
      };
      updatedLibraries.push(newLibrary);
    }

    const updatedConfig = {
      ...config,
      libraries: updatedLibraries,
    };

    try {
      await saveConfig(updatedConfig);
      setShowLibraryDialog(false);
      setEditingLibrary(null);
      setSelectedLibraryId(newLibrary.id);
      setActiveTab('library');
    } catch (error) {
      return;
    }
  };

  const handleConfigSubmit = async (updatedConfig: AppConfig) => {
    try {
      await saveConfig(updatedConfig);
      setShowConfigDialog(false);
    } catch (error) {
      return;
    }
  };

  const handleEditBoard = (board: Board) => {
    setEditingBoard(board);
    setShowBoardDialog(true);
  };

  const handleDeleteBoard = async (boardId: string) => {
    const token = getAuthToken();
    if (!token || !config.gitConfig) {
      toast({
        title: 'Configuration Error',
        description: 'Please configure GitHub settings first.',
        variant: 'destructive',
      });
      return;
    }

    const board = config.boards.find(b => b.id === boardId);
    if (!board) return;

    try {
      // Delete board data file if it exists
      if (board.gitConfig) {
        try {
          const { data } = await loadFromGitHub({
            token,
            ...board.gitConfig,
          });
          if (data) {
            await saveToGitHub({
              token,
              ...board.gitConfig,
              sha: data.sha,
              message: `Delete board ${board.name}`,
            });
          }
        } catch (error: any) {
          if (error?.response?.status !== 404) {
            throw error;
          }
        }
      }

      // Update config without the deleted board
      const updatedBoards = config.boards.filter(b => b.id !== boardId);
      const updatedConfig = { ...config, boards: updatedBoards };
      
      await saveConfig(updatedConfig);
      
      if (selectedBoardId === boardId) {
        setSelectedBoardId(updatedBoards[0]?.id || null);
      }

      toast({
        title: 'Board Deleted',
        description: 'The board has been deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Delete Board',
        description: error.message || 'Could not delete the board',
        variant: 'destructive',
      });
    }
  };

  const handleEditLibrary = (library: LibraryFile) => {
    setEditingLibrary(library);
    setShowLibraryDialog(true);
  };

  const handleDeleteLibrary = async (libraryId: string) => {
    const token = getAuthToken();
    if (!token || !config.gitConfig) {
      toast({
        title: 'Configuration Error',
        description: 'Please configure GitHub settings first.',
        variant: 'destructive',
      });
      return;
    }

    const library = config.libraries.find(l => l.id === libraryId);
    if (!library) return;

    try {
      // Delete library file if it exists
      if (library.gitConfig) {
        try {
          const { data } = await loadFromGitHub({
            token,
            ...library.gitConfig,
          });
          if (data) {
            await saveToGitHub({
              token,
              ...library.gitConfig,
              sha: data.sha,
              message: `Delete library ${library.name}`,
            });
          }
        } catch (error: any) {
          if (error?.response?.status !== 404) {
            throw error;
          }
        }
      }

      // Update config without the deleted library
      const updatedLibraries = config.libraries.filter(l => l.id !== libraryId);
      const updatedConfig = { ...config, libraries: updatedLibraries };
      
      await saveConfig(updatedConfig);
      
      if (selectedLibraryId === libraryId) {
        setSelectedLibraryId(null);
      }

      toast({
        title: 'Library Deleted',
        description: 'The library has been deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Delete Library',
        description: error.message || 'Could not delete the library',
        variant: 'destructive',
      });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Clear the selection from the other tab
    if (tab === 'boards') {
      setSelectedLibraryId(null);
    } else {
      setSelectedBoardId(null);
    }
  };

  const handleLibraryUpload = async (newLibrary: LibraryFile) => {
    const updatedLibraries = [...(config.libraries || []), newLibrary];
    const updatedConfig = { ...config, libraries: updatedLibraries };
    
    try {
      await saveConfig(updatedConfig);
      setSelectedLibraryId(newLibrary.id);
      setActiveTab('library');
    } catch (error) {
      toast({
        title: 'Failed to Save Library',
        description: 'Could not update app configuration',
        variant: 'destructive',
      });
    }
  };

  const selectedBoard = config.boards.find(b => b.id === selectedBoardId);
  const selectedLibrary = config.libraries.find(l => l.id === selectedLibraryId);

  const renderContent = () => {
    if (activeTab === 'boards') {
      if (selectedBoard) {
        return (
          <KanbanBoard
            board={selectedBoard}
            libraries={config.libraries}
            onEdit={handleEditBoard}
            onDelete={handleDeleteBoard}
          />
        );
      }
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <p className="mb-4">No board selected</p>
          <Button onClick={() => setShowBoardDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create a Board
          </Button>
        </div>
      );
    } else {
      if (selectedLibrary) {
        return <LibraryItemDetails library={selectedLibrary} />;
      }
      return (
        <LibraryUploadZone
          appGitConfig={config.gitConfig}
          onUploadComplete={handleLibraryUpload}
        />
      );
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-background">
      <TopBar onConfigureApp={() => setShowConfigDialog(true)} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r">
          <SidebarTabs
            boards={config.boards}
            libraries={config.libraries}
            selectedBoardId={selectedBoardId}
            selectedLibraryId={selectedLibraryId}
            onSelectBoard={setSelectedBoardId}
            onSelectLibrary={setSelectedLibraryId}
            onAddBoard={() => {
              setEditingBoard(null);
              setShowBoardDialog(true);
            }}
            onEditBoard={handleEditBoard}
            onDeleteBoard={handleDeleteBoard}
            onAddLibrary={() => {
              setEditingLibrary(null);
              setShowLibraryDialog(true);
            }}
            onEditLibrary={handleEditLibrary}
            onDeleteLibrary={handleDeleteLibrary}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>

      <BoardDialog
        open={showBoardDialog}
        onOpenChange={setShowBoardDialog}
        onSubmit={handleBoardSubmit}
        board={editingBoard}
      />

      <LibraryDialog
        open={showLibraryDialog}
        onOpenChange={setShowLibraryDialog}
        onSubmit={handleLibrarySubmit}
        library={editingLibrary}
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