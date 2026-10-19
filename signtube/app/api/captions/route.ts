import { NextResponse } from 'next/server';
import { fetchCaptions } from '@/lib/captions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  try {
    const captions = await fetchCaptions(videoId);
    return NextResponse.json(captions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch captions' }, { status: 500 });
  }
}
