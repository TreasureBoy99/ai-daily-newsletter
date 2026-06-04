import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const SUBSCRIBERS_FILE = join(process.cwd(), 'data', 'subscribers.json');

async function getSubscribers() {
  try { return JSON.parse(await readFile(SUBSCRIBERS_FILE, 'utf-8')); }
  catch { return {}; }
}
async function saveSubscribers(data) {
  await writeFile(SUBSCRIBERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: '请提供邮箱地址' }, { status: 400 });
    const subscribers = await getSubscribers();
    if (!subscribers[email]) return NextResponse.json({ error: '该邮箱未订阅' }, { status: 404 });
    delete subscribers[email];
    await saveSubscribers(subscribers);
    return NextResponse.json({ message: '已取消订阅' });
  } catch { return NextResponse.json({ error: '操作失败' }, { status: 500 }); }
}
