'use client';

import { useState, useEffect } from 'react';

interface Task {
  id: string;
  name: string;
  keyword: string;
  priceThreshold: number;
  minPrice?: number;
  enabled: boolean;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load tasks
  useEffect(() => {
    fetch('/api/tasks/list')
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      });
  }, []);

  const toggleTask = async (task: Task) => {
    const updated = { ...task, enabled: !task.enabled };
    await fetch('/api/tasks/update', {
      method: 'PUT',
      body: JSON.stringify(updated),
    });
    setTasks(tasks.map(t => t.id === task.id ? updated : t));
  };

  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newTask = {
      id: editingTask?.id || Date.now().toString(),
      name: formData.get('name'),
      keyword: formData.get('keyword'),
      priceThreshold: Number(formData.get('priceThreshold')),
      minPrice: Number(formData.get('minPrice')),
      enabled: editingTask ? editingTask.enabled : true,
    };

    if (editingTask) {
      await fetch('/api/tasks/update', { method: 'PUT', body: JSON.stringify(newTask) });
      setTasks(tasks.map(t => t.id === newTask.id ? newTask as Task : t));
    } else {
      await fetch('/api/tasks/create', { method: 'POST', body: JSON.stringify(newTask) });
      setTasks([...tasks, newTask as Task]);
    }
    setShowModal(false);
    setEditingTask(null);
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    await fetch('/api/tasks/delete', { method: 'POST', body: JSON.stringify({ id }) });
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🕵️‍♂️ Japan Market Monitor</h1>
          <button 
            onClick={() => { setEditingTask(null); setShowModal(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Task
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid gap-4">
            {tasks.map(task => (
              <div key={task.id} className={`bg-white p-6 rounded-xl shadow-sm border ${task.enabled ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{task.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">Key: <span className="font-mono bg-gray-100 px-1 rounded">{task.keyword}</span></p>
                    <div className="mt-2 text-sm font-medium text-gray-700">
                      💰 Range: {task.minPrice || 0} JPY - {task.priceThreshold} JPY
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleTask(task)}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${task.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
                    >
                      {task.enabled ? 'ACTIVE' : 'PAUSED'}
                    </button>
                    <button onClick={() => { setEditingTask(task); setShowModal(true); }} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => deleteTask(task.id)} className="text-red-500 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingTask ? 'Edit Task' : 'New Task'}</h2>
            <form onSubmit={saveTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input name="name" defaultValue={editingTask?.name} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" placeholder="e.g. PS5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Keyword</label>
                <input name="keyword" defaultValue={editingTask?.keyword} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" placeholder="Search Query" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Price (JPY)</label>
                  <input name="minPrice" type="number" defaultValue={editingTask?.minPrice} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Price (JPY)</label>
                  <input name="priceThreshold" type="number" defaultValue={editingTask?.priceThreshold} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" placeholder="50000" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
