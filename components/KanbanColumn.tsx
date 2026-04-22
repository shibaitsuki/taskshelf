'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Task, Priority, PRIORITIES } from '@/lib/types';
import TaskCard from './TaskCard';

interface Props {
  priority: Priority;
  tasks: Task[];
  onAddTask: (priority: Priority) => void;
  onEditTask: (task: Task) => void;
  onAddSubtask: (parentId: string) => void;
}

export default function KanbanColumn({ priority, tasks, onAddTask, onEditTask, onAddSubtask }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: priority });
  const info = PRIORITIES.find(p => p.value === priority)!;
  const rootTasks = tasks.filter(t => !t.parent_id);

  return (
    <div className="flex flex-col min-w-0 w-full">
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border-b-2 ${info.bg} border ${info.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-sm ${info.color}`}>{info.label}</span>
          <span className="text-xs bg-white/60 text-gray-500 rounded-full px-2 py-0.5">
            {rootTasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(priority)}
          className={`${info.color} hover:opacity-70 transition-opacity`}
          title="タスクを追加"
        >
          <Plus size={18} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-2 rounded-b-xl border border-t-0 min-h-32 transition-colors ${info.bg} ${
          isOver ? 'ring-2 ring-inset ring-blue-400' : ''
        }`}
      >
        <SortableContext
          items={rootTasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {rootTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onAddSubtask={onAddSubtask}
            />
          ))}
        </SortableContext>

        {rootTasks.length === 0 && (
          <button
            onClick={() => onAddTask(priority)}
            className="w-full py-4 text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1"
          >
            <Plus size={14} />
            タスクを追加
          </button>
        )}
      </div>
    </div>
  );
}
