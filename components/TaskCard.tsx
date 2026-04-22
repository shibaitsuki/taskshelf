'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Calendar, GripVertical, Plus } from 'lucide-react';
import { useState } from 'react';
import { Task, PRIORITIES, STATUSES } from '@/lib/types';

interface Props {
  task: Task;
  depth?: number;
  onEdit: (task: Task) => void;
  onAddSubtask: (parentId: string) => void;
}

export default function TaskCard({ task, depth = 0, onEdit, onAddSubtask }: Props) {
  const [expanded, setExpanded] = useState(true);
  const hasSubtasks = (task.subtasks?.length ?? 0) > 0;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: depth > 0,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priorityInfo = PRIORITIES.find(p => p.value === task.priority)!;
  const statusInfo = STATUSES.find(s => s.value === task.status)!;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div ref={setNodeRef} style={style} className={depth > 0 ? 'ml-4 mt-1' : 'mb-2'}>
      <div
        className={`rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow ${
          depth > 0 ? 'border-l-4 border-l-gray-300' : ''
        } ${task.status === 'done' ? 'opacity-60' : ''}`}
      >
        <div className="p-3">
          <div className="flex items-start gap-2">
            {depth === 0 && (
              <button
                {...attributes}
                {...listeners}
                className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
              >
                <GripVertical size={16} />
              </button>
            )}

            {hasSubtasks && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            {!hasSubtasks && depth === 0 && <div className="w-4 flex-shrink-0" />}

            <div className="flex-1 min-w-0">
              <button
                onClick={() => onEdit(task)}
                className="text-left w-full"
              >
                <p className={`text-sm font-medium text-gray-800 break-words ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{task.description}</p>
                )}
              </button>

              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorityInfo.color} ${priorityInfo.bg} border`}>
                  {priorityInfo.label}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                  {statusInfo.label}
                </span>
                {task.due_date && (
                  <span className={`text-xs flex items-center gap-0.5 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    <Calendar size={11} />
                    {new Date(task.due_date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                  </span>
                )}
                {hasSubtasks && (
                  <span className="text-xs text-gray-400">
                    {task.subtasks!.filter(s => s.status === 'done').length}/{task.subtasks!.length} 完了
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => onAddSubtask(task.id)}
              className="mt-0.5 text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0"
              title="サブタスクを追加"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </div>

      {expanded && hasSubtasks && (
        <div className="mt-1">
          {task.subtasks!.map(sub => (
            <TaskCard
              key={sub.id}
              task={sub}
              depth={depth + 1}
              onEdit={onEdit}
              onAddSubtask={onAddSubtask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
