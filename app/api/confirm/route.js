import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const SUBSCRIBERS_FILE = join(process.cwd(), 'data', 'subscribers.json');
const CONFIRMATIONS_FILE = join(process.cwd(), 'data', 'confirmations.json');

async function getSubscribers() {
  try { return JSON.parse(await readFile(SUBSCRIBERS_FILE, 'utf-8')); }
  catch { return {}; }
}
async function saveSubscribers(data) {
  await writeFile(SUBSCRIBERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
async function getConfirmations() {
  try { return JSON.parse(await readFile(CONFIRMATIONS_FILE, 'utf-8')); }
  catch { return {}; }
}
async function saveConfirmations(data) {
  await writeFile(CONFIRMATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: '缺少确认 token' }, { status: 400 });

  const confirmations = await getConfirmations();
  const record = confirmations[token];
  if (!record) return NextResponse.json({ error: '无效或已过期的确认链接' }, { status: 400 });

  const createdAt = new Date(record.createdAt);
  const hoursDiff = (Date.now() - createdAt) / (1000 * 60 * 60);
  if (hoursDiff > 24) return NextResponse.json({ error: '确认链接已过期（24小时有效期）' }, { status: 410 });

  const subscribers = await getSubscribers();
  subscribers[record.email] = { subscribedAt: new Date().toISOString(), confirmed: true };
  delete confirmations[token];
  await saveSubscribers(subscribers);
  await saveConfirmations(confirmations);

  const base = new URL(request.url).origin;
  return NextResponse.redirect(`${base}/?subscribed=true`);
}
