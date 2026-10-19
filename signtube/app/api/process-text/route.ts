import { NextResponse } from 'next/server';
import { tokenizeSentence, simplifySentence } from '@/lib/nlp';

export async function POST(request: Request) {
  try {
    const { sentence } = await request.json();

    if (!sentence) {
      return NextResponse.json({ error: 'Sentence is required' }, { status: 400 });
    }

    const simplified = simplifySentence(sentence);
    const tokens = tokenizeSentence(simplified);

    return NextResponse.json({ tokens });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process text' }, { status: 500 });
  }
}
