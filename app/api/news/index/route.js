import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const latestPath = join(process.cwd(), 'data', 'latest.json');
    const data = await readFile(latestPath, 'utf-8');
    const articles = JSON.parse(data);
    return NextResponse.json(articles, {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=300, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json([], {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
