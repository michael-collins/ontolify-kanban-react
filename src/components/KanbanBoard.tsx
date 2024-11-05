import { useState } from 'react';
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
import { Button } from './ui/button';
import { Plus, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveToGitHub, loadFromGitHub } from '@/lib/github';
import { getAuthToken } from '@/lib/storage';
import type { Column, Task, Status } from '@/types/kanban';
import type { Board } from '@/types/app';

const defaultColumns: Column[] = [
  { id: 'column-1', title: 'To Do', tasks: [], order: 0 },
  { id: 'column-2', title: 'In Progress', tasks: [], order: 1 },
  { id: 'column-3', title: 'Done', tasks: [], order: 2 },
];

const defaultTasks: Task[] = [
  {
    id: '1',
    title: 'Add drag and drop',
    description: 'Implement DnD functionality using dnd-kit',
    status: 'column-1',
    priority: 'high',
    dueDate: '2024-03-20',
  },
  {
    id: '2',
    title: 'Style components',
    description: 'Apply shadcn/ui components and custom styling',
    status: 'column-2',
    priority: 'medium',
    dueDate: '2024-03-21',
  },
  {
    id: '3',
    title: 'Write documentation',
    description: 'Document the implementation and usage',
    status: 'column-3',
    priority: 'low',
    dueDate: '2024-03-22',
  },
];

let nextTaskId = 4;
let nextColumnId = 4;

interface KanbanBoardProps {
  board: Board;
  onEdit: (board: Board) => void;
  onDelete: (boardId: string) => void;
}

export function KanbanBoard({ board }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      
      if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
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
      
      if (
        activeColumnIndex !== -1 && 
        overColumnIndex !== -1 && 
        activeColumnIndex !== overColumnIndex
      ) {
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
        description: 'Board data has been saved to GitHub successfully.',
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
      id: String(nextTaskId++),
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
    setShowAddColumn(false);
  };

  const handleEditColumn = (columnId: string, title: string) => {
    setColumns((columns) =>
      columns.map((col) =>
        col.id === columnId ? { ...col, title } : col
      )
    );
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

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const columnIds = sortedColumns.map(col => col.id);
  const tasksMap = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {} as Record<Status, Task[]>);

  return (
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
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowAddColumn(true)}
            >
              <Plus className="h-4 w-4" />
              Add Column
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row flex-wrap gap-4">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {sortedColumns.map((column) => (
              <div key={column.id} className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]">
                <KanbanColumn
                  column={column}
                  tasks={tasksMap[column.id] || []}
                  onAddTask={(taskData) => handleAddTask(column.id, taskData)}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onEditColumn={handleEditColumn}
                  onDeleteColumn={handleDeleteColumn}
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
          />
        ) : activeColumn ? (
          <div className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]">
            <KanbanColumn
              column={activeColumn}
              tasks={tasksMap[activeColumn.id] || []}
              onAddTask={(taskData) => handleAddTask(activeColumn.id, taskData)}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onEditColumn={handleEditColumn}
              onDeleteColumn={handleDeleteColumn}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
      <AddColumnDialog
        open={showAddColumn}
        onOpenChange={setShowAddColumn}
        onSubmit={handleAddColumn}
      />
    </DndContext>
  );
}