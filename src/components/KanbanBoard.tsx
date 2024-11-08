import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { AddColumnDialog } from './AddColumnDialog';
import { EditColumnDialog } from './EditColumnDialog';
import { ActionButton } from './buttons/ActionButton';
import { LibraryProvider } from '@/contexts/LibraryContext';
import { Plus, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveToGitHub, loadFromGitHub } from '@/lib/github';
import { getAuthToken } from '@/lib/storage';
import type { Column, Task, Status } from '@/types/kanban';
import type { Board } from '@/types/app';
import type { LibraryFile } from '@/types/library';

const defaultColumns: Column[] = [
  { id: 'column-1', title: 'To Do', tasks: [], order: 0 },
  { id: 'column-2', title: 'In Progress', tasks: [], order: 1 },
  { id: 'column-3', title: 'Done', tasks: [], order: 2 },
];

let nextTaskId = 4;
let nextColumnId = 4;

interface KanbanBoardProps {
  board: Board;
  libraries?: LibraryFile[];
  onEdit: (board: Board) => void;
  onDelete: (boardId: string) => void;
}

export function KanbanBoard({
  board,
  libraries = [],
  onEdit,
  onDelete,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadBoardData = useCallback(async () => {
    const token = getAuthToken();
    if (!token || !board.gitConfig) {
      toast({
        title: 'Configuration Required',
        description: 'Please configure GitHub settings first.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const content = await loadFromGitHub({
        token,
        ...board.gitConfig,
      });

      if (content) {
        const boardData = JSON.parse(content);
        setColumns(boardData.columns || defaultColumns);
        setTasks(boardData.tasks || []);

        // Update next IDs based on existing data
        const maxTaskId = Math.max(...(boardData.tasks?.map(t => parseInt(t.id.replace(/\D/g, ''))) || [0]));
        const maxColumnId = Math.max(...(boardData.columns?.map(c => parseInt(c.id.replace(/\D/g, ''))) || [0]));
        nextTaskId = maxTaskId + 1;
        nextColumnId = maxColumnId + 1;
      } else {
        setColumns(defaultColumns);
        setTasks([]);
      }
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        toast({
          title: 'Failed to Load Board',
          description: error.message || 'Could not load board data from GitHub',
          variant: 'destructive',
        });
      }
      setColumns(defaultColumns);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [board.gitConfig, toast]);

  useEffect(() => {
    setActiveTask(null);
    setActiveColumn(null);
    setShowAddDialog(false);
    loadBoardData();
  }, [board.id, loadBoardData]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id.toString();

    const task = tasks.find((t) => t.id === activeId);
    if (task) {
      setActiveTask(task);
      return;
    }

    const column = columns.find((c) => c.id === activeId);
    if (column) {
      setActiveColumn(column);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (activeTask) {
      const overTask = tasks.find((t) => t.id === overId);
      const overColumn = columns.find((c) => c.id === overId);

      if (overTask) {
        setTasks((tasks) => {
          const activeIndex = tasks.findIndex((t) => t.id === activeId);
          const overIndex = tasks.findIndex((t) => t.id === overId);

          if (activeTask.status === overTask.status) {
            return arrayMove(tasks, activeIndex, overIndex);
          }

          const updatedTasks = tasks.map((t) => {
            if (t.id === activeId) {
              return { ...t, status: overTask.status };
            }
            return t;
          });

          return arrayMove(updatedTasks, activeIndex, overIndex);
        });
      } else if (overColumn) {
        setTasks((tasks) =>
          tasks.map((t) =>
            t.id === activeId ? { ...t, status: overColumn.id } : t
          )
        );
      }
    } else {
      const activeColumnIndex = columns.findIndex((c) => c.id === activeId);
      const overColumnIndex = columns.findIndex((c) => c.id === overId);
      
      if (activeColumnIndex !== -1 && overColumnIndex !== -1 && activeColumnIndex !== overColumnIndex) {
        setColumns((columns) => {
          const newColumns = arrayMove(columns, activeColumnIndex, overColumnIndex);
          return newColumns.map((col, index) => ({ ...col, order: index }));
        });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      setActiveColumn(null);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const activeTask = tasks.find((t) => t.id === activeId);
    if (activeTask) {
      const overTask = tasks.find((t) => t.id === overId);
      const overColumn = columns.find((c) => c.id === overId);

      if (overTask) {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (activeIndex !== overIndex) {
          setTasks((tasks) => arrayMove(tasks, activeIndex, overIndex));
        }
      } else if (overColumn && activeTask.status !== overColumn.id) {
        setTasks((tasks) =>
          tasks.map((t) =>
            t.id === activeId ? { ...t, status: overColumn.id } : t
          )
        );
      }
    } else {
      const activeColumnIndex = columns.findIndex((c) => c.id === activeId);
      const overColumnIndex = columns.findIndex((c) => c.id === overId);
      
      if (activeColumnIndex !== -1 && overColumnIndex !== -1 && activeColumnIndex !== overColumnIndex) {
        setColumns((columns) => {
          const newColumns = arrayMove(columns, activeColumnIndex, overColumnIndex);
          return newColumns.map((col, index) => ({ ...col, order: index }));
        });
      }
    }

    setActiveTask(null);
    setActiveColumn(null);
  };

  const handleSave = async () => {
    const token = getAuthToken();
    if (!token) {
      toast({
        title: 'Authentication Required',
        description: 'Please configure your GitHub token in the app settings.',
        variant: 'destructive',
      });
      return;
    }

    if (!board.gitConfig) {
      toast({
        title: 'Configuration Error',
        description: 'Board configuration is missing or invalid.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const boardData = {
        columns,
        tasks,
      };

      await saveToGitHub({
        token,
        ...board.gitConfig,
      }, JSON.stringify(boardData, null, 2));

      toast({
        title: 'Changes Saved',
        description: 'Board data has been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save board data to GitHub',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTask = (columnId: Status, taskData: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = {
      id: `task-${nextTaskId++}`,
      status: columnId,
      ...taskData,
    };
    setTasks((tasks) => [...tasks, newTask]);
  };

  const handleEditTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((tasks) =>
      tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((tasks) => tasks.filter((task) => task.id !== taskId));
  };

  const handleAddColumn = (title: string) => {
    const newColumn: Column = {
      id: `column-${nextColumnId++}`,
      title,
      tasks: [],
      order: columns.length,
    };
    setColumns((columns) => [...columns, newColumn]);
    setShowAddDialog(false);
  };

  const handleEditColumn = (columnId: string, title: string) => {
    setColumns((columns) =>
      columns.map((col) =>
        col.id === columnId ? { ...col, title } : col
      )
    );
    setShowEditDialog(false);
  };

  const handleDeleteColumn = (columnId: string) => {
    const remainingColumns = columns.filter((col) => col.id !== columnId);
    if (remainingColumns.length > 0) {
      const defaultColumn = remainingColumns[0].id;
      setTasks((tasks) =>
        tasks.map((task) =>
          task.status === columnId ? { ...task, status: defaultColumn } : task
        )
      );
    }
    setColumns(remainingColumns);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading board...</span>
        </div>
      </div>
    );
  }

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const columnIds = sortedColumns.map(col => col.id);

  return (
    <LibraryProvider libraries={libraries}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">{board.name}</h1>
            <div className="flex items-center gap-2">
              <ActionButton
                variant="outline"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowAddDialog(true)}
              >
                Add Column
              </ActionButton>
              <ActionButton
                variant="default"
                size="sm"
                icon={<Save className="h-4 w-4" />}
                onClick={handleSave}
                isLoading={isSaving}
              >
                Save Changes
              </ActionButton>
            </div>
          </div>
          <div className="flex flex-col md:flex-row flex-wrap gap-4">
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {sortedColumns.map((column) => (
                <div key={column.id} className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]">
                  <KanbanColumn
                    column={column}
                    tasks={tasks.filter(task => task.status === column.id)}
                    onAddTask={(taskData) => handleAddTask(column.id, taskData)}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    onEditColumn={(title) => {
                      setEditingColumn(column);
                      setShowEditDialog(true);
                    }}
                    onDeleteColumn={() => handleDeleteColumn(column.id)}
                    libraries={libraries}
                  />
                </div>
              ))}
            </SortableContext>
          </div>
        </div>
        <DragOverlay>
          {activeTask ? (
            <TaskCard 
              task={activeTask} 
              onEdit={handleEditTask} 
              onDelete={handleDeleteTask}
              libraries={libraries}
            />
          ) : activeColumn ? (
            <div className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]">
              <KanbanColumn
                column={activeColumn}
                tasks={tasks.filter(task => task.status === activeColumn.id)}
                onAddTask={(taskData) => handleAddTask(activeColumn.id, taskData)}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onEditColumn={(title) => {
                  setEditingColumn(activeColumn);
                  setShowEditDialog(true);
                }}
                onDeleteColumn={() => handleDeleteColumn(activeColumn.id)}
                libraries={libraries}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
        <AddColumnDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSubmit={handleAddColumn}
        />
        <EditColumnDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSubmit={handleEditColumn}
          column={editingColumn}
        />
      </DndContext>
    </LibraryProvider>
  );
}