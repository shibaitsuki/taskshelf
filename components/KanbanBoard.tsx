'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Task, Priority, PRIORITIES } from '@/lib/types';
import { fetchTasks, updateTask, buildTree } from '@/lib/tasks';
import KanbanColumn from './KanbanColumn';
import TaskModal from './TaskModal';
import TaskCard from './TaskCard';
import { RefreshCw } from 'lucide-react';

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addingParentId, setAddingParentId] = useState<string | null | undefined>(undefined);
  const [addingPriority, setAddingPriority] = useState<Priority>('medium');

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const flat = await fetchTasks();
      setTasks(flat);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tasksByPriority = (priority: Priority): Task[] => {
    const flat = tasks.filter(t => t.priority === priority);
    return buildTree(flat);
  };

  function openAdd(priority: Priority) {
    setEditingTask(null);
    setAddingParentId(null);
    setAddingPriority(priority);
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setAddingParentId(undefined);
    setModalOpen(true);
  }

  function openAddSubtask(parentId: string) {
    const parent = tasks.find(t => t.id === parentId);
    setEditingTask(null);
    setAddingParentId(parentId);
    setAddingPriority(parent?.priority ?? 'medium');
    setModalOpen(true);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const t = tasks.find(t => t.id === event.active.id);
    setActiveTask(t ?? null);
  }

  async function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const overId = over.id as string;

    const isPriority = PRIORITIES.map(p => p.value).includes(overId as Priority);
    if (isPriority) {
      const newPriority = overId as Priority;
      const activeT = tasks.find(t => t.id === active.id);
      if (activeT && activeT.priority !== newPriority) {
        setTasks(prev =>
          prev.map(t => t.id === active.id ? { ...t, priority: newPriority } : t)
        );
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const isPriority = PRIORITIES.map(p => p.value).includes(overId as Priority);

    const activeT = tasks.find(t => t.id === activeId);
    if (!activeT) return;

    if (isPriority) {
      const newPriority = overId as Priority;
      if (activeT.priority !== newPriority) {
        await updateTask(activeId, { priority: newPriority });
        await load();
      }
      return;
    }

    const overT = tasks.find(t => t.id === overId);
    if (!overT) return;

    if (activeT.priority === overT.priority) {
      const samePriority = tasks.filter(t => t.priority === activeT.priority && !t.parent_id);
      const oldIdx = samePriority.findIndex(t => t.id === activeId);
      const newIdx = samePriority.findIndex(t => t.id === overId);
      if (oldIdx === -1 || newIdx === -1) return;

      const reordered = arrayMove(samePriority, oldIdx, newIdx);
      const updates = reordered.map((t, i) => ({ id: t.id, position: i }));

      setTasks(prev => {
        const others = prev.filter(t => t.priority !== activeT.priority || t.parent_id);
        const updated = reordered.map((t, i) => ({ ...t, position: i }));
        return [...others, ...updated];
      });

      await Promise.all(updates.map(u => updateTask(u.id, { position: u.position })));
    } else {
      await updateTask(activeId, { priority: overT.priority });
      await load();
    }
  }

  const flatActiveTask = activeTask
    ? { ...activeTask, subtasks: buildTree(tasks.filter(t => t.priority === activeTask.priority)).find(t => t.id === activeTask.id)?.subtasks }
    : null;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
        <h1 className="text-lg font-bold text-gray-800">Taskshelf</h1>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">更新</span>
        </button>
      </header>

      {loading && tasks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <RefreshCw size={24} className="animate-spin mr-2" />
          読み込み中...
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-3 p-4 h-full min-w-max lg:min-w-0 lg:grid lg:grid-cols-4">
              {PRIORITIES.map(p => (
                <div key={p.value} className="w-72 lg:w-auto flex flex-col">
                  <KanbanColumn
                    priority={p.value}
                    tasks={tasksByPriority(p.value)}
                    onAddTask={openAdd}
                    onEditTask={openEdit}
                    onAddSubtask={openAddSubtask}
                  />
                </div>
              ))}
            </div>
          </div>

          <DragOverlay>
            {flatActiveTask && (
              <TaskCard
                task={flatActiveTask}
                onEdit={() => {}}
                onAddSubtask={() => {}}
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {modalOpen && (
        <TaskModal
          task={editingTask}
          parentId={addingParentId}
          defaultPriority={addingPriority}
          onClose={() => setModalOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
