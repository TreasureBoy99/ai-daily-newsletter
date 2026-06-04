import { NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

const SUBSCRIBERS_FILE = join(process.cwd(), 'data', 'subscribers.json');
const CONFIRMATIONS_FILE = join(process.cwd(), 'data', 'confirmations.json');

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getSubscribers() {
  try { return JSON.parse(await readFile(SUBSCRIBERS_FILE, 'utf-8')); }
  catch { return {}; }
}

async function saveSubscribers(data) {
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  await writeFile(SUBSCRIBERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function getConfirmations() {
  try { return JSON.parse(await readFile(CONFIRMATIONS_FILE, 'utf-8')); }
  catch { return {}; }
}

async function saveConfirmations(data) {
  await writeFile(CONFIRMATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email || !isValidEmail(email))
      return NextResponse.json({ error: '请提供有效的邮箱地址' }, { status: 400 });

    const subscribers = await getSubscribers();
    if (subscribers[email])
      return NextResponse.json({ error: '该邮箱已订阅' }, { status: 409 });

    const confirmToken = crypto.randomBytes(16).toString('hex');
    const confirmations = await getConfirmations();
    confirmations[confirmToken] = { email, createdAt: new Date().toISOString() };
    await saveConfirmations(confirmations);

    const resendKey = process.env.RESEND_API_KEY;
    const confirmUrl = `https://ai-daily-newsletter.vercel.app/api/confirm?token=${confirmToken}`;

    if (resendKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'AI Daily Newsletter <newsletter@ai-daily-newsletter.com>',
            to: email,
            subject: 'Confirm your AI Daily Newsletter subscription',
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <h2>AI Daily Newsletter</h2>
              <p>Click below to confirm your subscription:</p>
              <a href="${confirmUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">Confirm</a>
              <p style="color:#888;font-size:12px;margin-top:20px;">This link expires in 24 hours.</p>
            </div>`,
          }),
        });
        if (!res.ok) console.error('Resend error:', await res.text());
      } catch (err) { console.error('Failed to send confirmation email:', err); }
    }

    return NextResponse.json({ message: '已发送确认邮件，请查收并点击确认链接完成订阅' });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: '订阅失败，请稍后重试' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ usage: 'POST /api/subscribe with { "email": "your@email.com" }' });
}
