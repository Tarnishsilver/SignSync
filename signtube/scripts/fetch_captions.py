import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No video ID provided"}))
        sys.exit(1)

    video_id = sys.argv[1]

    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=["en"])
        # Output format: [{ text, start, duration }]
        captions = []
        for chunk in transcript_list:
            captions.append({
                "text": chunk["text"],
                "start": chunk["start"],
                "duration": chunk["duration"]
            })
        print(json.dumps(captions))
    except TranscriptsDisabled:
        print(json.dumps({"error": "No captions available for this video."}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
