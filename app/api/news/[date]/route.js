import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { date } = params;

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 });
  }

  try {
    const filePath = join(process.cwd(), 'data', `ai-news-${date}.json`);
    const data = await readFile(filePath, 'utf-8');
    const articles = JSON.parse(data);
    return NextResponse.json(articles, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'No data for this date.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to load data.' }, {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
