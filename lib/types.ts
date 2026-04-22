export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type Status = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  parent_id: string | null;
  position: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: Task[];
}

export const PRIORITIES: { value: Priority; label: string; color: string; bg: string }[] = [
  { value: 'urgent', label: '緊急', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  { value: 'high',   label: '高',   color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  { value: 'medium', label: '中',   color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  { value: 'low',    label: '低',   color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
];

export const STATUSES: { value: Status; label: string }[] = [
  { value: 'todo',        label: '未着手' },
  { value: 'in_progress', label: '進行中' },
  { value: 'done',        label: '完了' },
];
