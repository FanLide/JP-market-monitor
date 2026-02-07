import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const DATA_FILE = path.join(process.cwd(), '..', 'data', 'tasks.json');

export async function POST(req: Request) {
  const newTask = await req.json();
  let tasks = [];
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    tasks = JSON.parse(data);
  } catch {}

  if (!newTask.id) newTask.id = Date.now().toString();

  tasks.push(newTask);
  await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2));

  return NextResponse.json(newTask);
}
