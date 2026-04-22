'use client';

import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Task, Priority, Status, PRIORITIES, STATUSES } from '@/lib/types';
import { createTask, updateTask, deleteTask } from '@/lib/tasks';

interface Props {
  task: Task | null;
  parentId?: string | null;
  defaultPriority?: Priority;
  onClose: () => void;
  onSaved: () => void;
}

export default function TaskModal({ task, parentId, defaultPriority = 'medium', onClose, onSaved }: Props) {
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? defaultPriority);
  const [status, setStatus] = useState<Status>(task?.status ?? 'todo');
  const [dueDate, setDueDate] = useState(task?.due_date ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('タイトルは必須です'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          status,
          due_date: dueDate || null,
        });
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          status,
          parent_id: parentId ?? null,
          due_date: dueDate || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError('保存に失敗しました');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm('このタスクを削除しますか？サブタスクも削除されます。')) return;
    try {
      await deleteTask(task.id);
      onSaved();
      onClose();
    } catch (err) {
      setError('削除に失敗しました');
      console.error(err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-800">
            {isEdit ? 'タスクを編集' : parentId ? 'サブタスクを追加' : 'タスクを追加'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 rounded p-2">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">タイトル *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="タスク名を入力"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">詳細</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="詳細を入力（任意）"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">重要度</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ステータス</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as Status)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">期日</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700"
              >
                <Trash2 size={15} />
                削除
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
