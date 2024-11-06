import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { AddTaskDialog } from './AddTaskDialog';
import { EditColumnDialog } from './EditColumnDialog';
import { IconButton } from './buttons/IconButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { Column, Task } from '@/types/kanban';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'status'>) => void;
  onEditTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onEditColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  isDragging?: boolean;
}

export function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditColumn,
  onDeleteColumn,
  isDragging = false,
}: KanbanColumnProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: column.id,
      data: column,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAddTask = (taskData: Omit<Task, 'id' | 'status'>) => {
    onAddTask(taskData);
    setShowAddDialog(false);
  };

  const handleEditColumn = (title: string) => {
    onEditColumn(column.id, title);
    setShowEditDialog(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group bg-muted/50 rounded-lg transition-colors hover:bg-muted/60',
          isDragging ? 'opacity-50' : ''
        )}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div
                className="opacity-50 cursor-grab active:cursor-grabbing hover:opacity-100 transition-opacity"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </div>
              <h2 className="font-semibold">{column.title}</h2>
            </div>
            <div className="flex items-center gap-1">
              <IconButton
                icon={<Plus className="h-4 w-4" />}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary hover:text-black"
                onClick={() => setShowAddDialog(true)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton
                    icon={<MoreVertical className="h-4 w-4" />}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDeleteColumn(column.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="space-y-3 min-h-[200px]">
            <SortableContext
              items={tasks}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </SortableContext>
          </div>
        </div>
      </div>
      <AddTaskDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleAddTask}
      />
      <EditColumnDialog
        column={column}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSubmit={handleEditColumn}
      />
    </>
  );
}