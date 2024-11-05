export type Status = string;

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface Column {
  id: Status;
  title: string;
  tasks: Task[];
  order: number;
}