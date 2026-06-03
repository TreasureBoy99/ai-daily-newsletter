import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const indexPath = join(process.cwd(), 'data', 'index.json');
    const indexData = await readFile(indexPath, 'utf-8');
    const dates = JSON.parse(indexData);
    return NextResponse.json(dates, {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=300, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json([], {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
