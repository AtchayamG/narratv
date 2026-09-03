import { SubtitleCue } from '@narratv/contracts';

/**
 * Parses timestamp string HH:MM:SS,mmm or HH:MM:SS.mmm to seconds
 */
export function parseSrtTimestamp(timestampStr: string): number {
  const clean = timestampStr.trim().replace(',', '.');
  const parts = clean.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000) / 1000;
  }
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return Math.round((minutes * 60 + seconds) * 1000) / 1000;
  }
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

/**
 * Strips HTML formatting tags from subtitle text
 */
export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

/**
 * Parses raw SRT subtitle file content into an array of SubtitleCue objects
 */
export function parseSrt(srtContent: string): SubtitleCue[] {
  if (!srtContent || typeof srtContent !== 'string') {
    return [];
  }

  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    // Check if line 0 is numeric index or timestamp
    let timeLineIdx = 1;
    let cueId: string | number = cues.length + 1;

    if (lines[0].includes('-->')) {
      timeLineIdx = 0;
    } else {
      const parsedId = parseInt(lines[0], 10);
      if (!isNaN(parsedId)) {
        cueId = parsedId;
      } else {
        cueId = lines[0];
      }
    }

    const timeLine = lines[timeLineIdx];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const timeParts = timeLine.split('-->');
    if (timeParts.length !== 2) continue;

    const tStart = parseSrtTimestamp(timeParts[0]);
    const tEnd = parseSrtTimestamp(timeParts[1]);

    const textLines = lines.slice(timeLineIdx + 1);
    const text = stripHtmlTags(textLines.join(' '));

    if (tEnd >= tStart) {
      cues.push({
        id: cueId,
        tStart,
        tEnd,
        text
      });
    }
  }

  // Sort cues by tStart
  return cues.sort((a, b) => a.tStart - b.tStart);
}
