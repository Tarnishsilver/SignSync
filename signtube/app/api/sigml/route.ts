import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path for logging missing words
const MISSING_WORDS_FILE = path.join(process.cwd(), '..', 'data', 'missing_words.txt');

// Keep a Set in memory so we don't write duplicates in the same session
const loggedWords = new Set<string>();

function logMissingWord(word: string) {
  if (loggedWords.has(word)) return;
  loggedWords.add(word);

  try {
    // Append to file
    fs.appendFileSync(MISSING_WORDS_FILE, word + '\n', 'utf-8');
  } catch (e) {
    // If file doesn't exist yet, create it
    try {
      fs.writeFileSync(MISSING_WORDS_FILE, word + '\n', 'utf-8');
    } catch {}
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word')?.toLowerCase().trim();

  if (!word) {
    return NextResponse.json({ error: 'word is required' }, { status: 400 });
  }

  // Skip very short meaningless tokens
  if (word.length === 0) {
    return NextResponse.json({ found: false, paths: [] });
  }

  const publicSigmlDir = path.join(process.cwd(), 'public', 'avatar', 'sigml');
  const dataSigmlDir = path.join(process.cwd(), '..', 'data', 'sigml');

  function ensureInPublic(filename: string): boolean {
    const publicPath = path.join(publicSigmlDir, filename);
    const dataPath = path.join(dataSigmlDir, filename);

    if (fs.existsSync(publicPath)) return true;
    if (fs.existsSync(dataPath)) {
      try {
        fs.copyFileSync(dataPath, publicPath);
        return true;
      } catch { return false; }
    }
    return false;
  }

  // Check if the word has a matching sigml file
  const wordFile = `${word}.sigml`;
  const wordExists = ensureInPublic(wordFile);

  if (wordExists) {
    return NextResponse.json({
      found: true,
      paths: [`sigml/${wordFile}`]
    });
  } else {
    // Log this missing word for future .sigml creation
    logMissingWord(word);

    // Fingerspelling fallback: spell letter by letter
    const chars = word.split('');
    const paths: string[] = [];

    for (const char of chars) {
      if (/^[a-z0-9]$/.test(char)) {
        const charFile = `${char}.sigml`;
        if (ensureInPublic(charFile)) {
          paths.push(`sigml/${charFile}`);
        }
      }
    }

    return NextResponse.json({
      found: false,
      fingerspelled: true,
      word: word,
      paths
    });
  }
}
