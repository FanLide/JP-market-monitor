import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const DATA_FILE = path.join(process.cwd(), '..', 'data', 'tasks.json');

// PUT: Update task
export async function PUT(req: Request) {
  const updatedTask = await req.json();
  
  // Read
  let tasks = [];
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    tasks = JSON.parse(data);
  } catch {}

  // Find & Update
  const index = tasks.findIndex((t: any) => t.id === updatedTask.id);
  
  if (index !== -1) {
    tasks[index] = updatedTask;
    await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2));
    return NextResponse.json(updatedTask);
  }
  
  return NextResponse.json({ error: 'Task not found' }, { status: 404 });
}

// DELETE: Remove task
export async function DELETE(req: Request) {
  const { id } = await req.json();
  let tasks = [];
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    tasks = JSON.parse(data);
  } catch {}
  
  const newTasks = tasks.filter((t: any) => t.id !== id);
  await fs.writeFile(DATA_FILE, JSON.stringify(newTasks, null, 2));
  
  return NextResponse.json({ success: true });
}
