import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const DATA_FILE = path.join(process.cwd(), '..', 'data', 'tasks.json');

export async function GET() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const tasks = JSON.parse(data);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error(error);
    return NextResponse.json([]);
  }
}
