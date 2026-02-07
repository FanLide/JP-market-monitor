import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const DATA_FILE = path.join(process.cwd(), '..', 'data', 'tasks.json');

// Helper to read/write
async function getTasks() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveTasks(tasks: any[]) {
  await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2));
}

// GET: List tasks
export async function GET() {
  const tasks = await getTasks();
  return NextResponse.json(tasks);
}

// POST: Add task
export async function POST(req: Request) {
  const newTask = await req.json();
  const tasks = await getTasks();
  
  // Assign ID if new
  if (!newTask.id) {
    newTask.id = Date.now().toString();
  }
  
  // Add to list
  tasks.push(newTask);
  await saveTasks(tasks);
  
  return NextResponse.json(newTask);
}

// PUT: Update task
export async function PUT(req: Request) {
  const updatedTask = await req.json();
  const tasks = await getTasks();
  
  const index = tasks.findIndex((t: any) => t.id === updatedTask.id);
  if (index !== -1) {
    tasks[index] = updatedTask;
    await saveTasks(tasks);
    return NextResponse.json(updatedTask);
  }
  return NextResponse.json({ error: 'Task not found' }, { status: 404 });
}

// DELETE: Remove task
export async function DELETE(req: Request) {
  const { id } = await req.json();
  const tasks = await getTasks();
  
  const newTasks = tasks.filter((t: any) => t.id !== id);
  await saveTasks(newTasks);
  
  return NextResponse.json({ success: true });
}
