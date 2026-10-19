// Captions utility — calls Python youtube_transcript_api via child_process

export interface ParsedCaption {
  start: number;
  duration: number;
  text: string;
}

export async function fetchCaptions(videoId: string): Promise<ParsedCaption[]> {
  const { execSync } = require('child_process');
  const path = require('path');

  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'fetch_captions.py');
    const result = execSync(`python "${scriptPath}" "${videoId}"`, {
      encoding: 'utf-8',
      timeout: 15000, // 15 second timeout
    });

    const parsed = JSON.parse(result.trim());

    if (parsed.error) {
      console.error('Caption fetch error:', parsed.error);
      return [];
    }

    return parsed.map((item: any) => ({
      start: item.start,
      duration: item.duration,
      text: item.text,
    }));
  } catch (error) {
    console.error('Error fetching captions via Python:', error);
    return [];
  }
}
