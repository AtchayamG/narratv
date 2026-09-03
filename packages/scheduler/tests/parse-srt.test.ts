import { parseSrt, parseSrtTimestamp, stripHtmlTags } from '../src/parse-srt';

describe('SRT Parser', () => {
  test('parses timestamps correctly', () => {
    expect(parseSrtTimestamp('00:01:23,456')).toBe(83.456);
    expect(parseSrtTimestamp('01:00:00,000')).toBe(3600);
    expect(parseSrtTimestamp('00:00:05.500')).toBe(5.5);
    expect(parseSrtTimestamp('02:30')).toBe(150);
    expect(parseSrtTimestamp('45.2')).toBe(45.2);
    expect(parseSrtTimestamp('invalid')).toBe(0);
  });

  test('strips HTML formatting tags from text', () => {
    expect(stripHtmlTags('<i>Hello</i> <b>world</b>')).toBe('Hello world');
    expect(stripHtmlTags('<font color="#ffff00">Look out!</font>')).toBe('Look out!');
  });

  test('parses multi-cue SRT document', () => {
    const srt = `1
00:00:01,000 --> 00:00:04,500
Hello, welcome to NarraTV.

2
00:00:10,200 --> 00:00:14,800
<i>This is a second subtitle line.</i>
Second line of cue 2.

cue-alpha
00:00:20,000 --> 00:00:22,000
Third cue.

00:00:25,000 --> 00:00:28,000
Fourth cue with no index.`;

    const cues = parseSrt(srt);
    expect(cues).toHaveLength(4);
    expect(cues[0]).toEqual({
      id: 1,
      tStart: 1.0,
      tEnd: 4.5,
      text: 'Hello, welcome to NarraTV.'
    });
    expect(cues[1]).toEqual({
      id: 2,
      tStart: 10.2,
      tEnd: 14.8,
      text: 'This is a second subtitle line. Second line of cue 2.'
    });
    expect(cues[2].id).toBe('cue-alpha');
    expect(cues[3].text).toBe('Fourth cue with no index.');
  });

  test('handles empty or malformed input gracefully', () => {
    expect(parseSrt('')).toEqual([]);
    expect(parseSrt('Not an srt file')).toEqual([]);
    expect(parseSrt(null as any)).toEqual([]);
  });
});
