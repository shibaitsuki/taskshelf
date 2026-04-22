import { supabase } from './supabase';
import { Task, Priority, Status } from './types';

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('position', { ascending: true });
  if (error) throw error;
  return data as Task[];
}

export async function createTask(task: {
  title: string;
  description?: string;
  priority: Priority;
  status?: Status;
  parent_id?: string | null;
  due_date?: string | null;
  position?: number;
}): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export function buildTree(tasks: Task[]): Task[] {
  const map = new Map<string, Task>();
  const roots: Task[] = [];

  for (const t of tasks) {
    map.set(t.id, { ...t, subtasks: [] });
  }
  for (const t of map.values()) {
    if (t.parent_id && map.has(t.parent_id)) {
      map.get(t.parent_id)!.subtasks!.push(t);
    } else if (!t.parent_id) {
      roots.push(t);
    }
  }
  return roots;
}
