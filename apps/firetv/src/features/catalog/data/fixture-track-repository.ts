import { Title, DescriptionTrack, SubtitleCue, Description } from '@narratv/contracts';
import { parseSrt, findGaps, placeDescriptions, computeTrackCounters } from '@narratv/scheduler';
import { ITrackRepository } from '../domain/repository';

const rawTitles = require('../../../../assets/fixtures/titles.json');
const rawSintelTrack = require('../../../../assets/fixtures/sintel-track.json');

const titlesData: Title[] = Array.isArray(rawTitles) ? rawTitles : (rawTitles.default || []);
const sintelTrackData = rawSintelTrack.default || rawSintelTrack;

const SINTEL_SRT = `1
00:00:24,500 --> 00:00:26,800
This blade has a dark past.

2
00:00:27,200 --> 00:00:29,800
It has shed much innocent blood.

3
00:00:30,200 --> 00:00:34,200
You're a fool for traveling alone, so completely unprepared.

4
00:00:34,800 --> 00:00:37,500
You're lucky your blood's still flowing.

5
00:00:38,200 --> 00:00:39,500
Thank you.

6
00:00:40,200 --> 00:00:44,000
So... what brings you to the land of the gatekeepers?

7
00:00:44,800 --> 00:00:47,000
I'm searching for someone.

8
00:00:47,500 --> 00:00:50,800
Someone very dear? A kindred spirit?

9
00:00:51,500 --> 00:00:53,200
A dragon.

10
00:00:54,000 --> 00:00:57,200
A dangerous quest for a lone hunter.

11
00:00:58,000 --> 00:01:00,800
I've been looking for a long time.

12
00:01:25,000 --> 00:01:27,500
It was winter...

13
00:01:48,000 --> 00:01:51,000
I found him in the town square.

14
00:02:08,000 --> 00:02:11,500
He was wounded, shivering in the cold.

15
00:02:35,000 --> 00:02:39,000
I nursed him back to health and named him Scales.

16
00:03:15,000 --> 00:03:18,000
He learned to fly quickly.

17
00:03:45,000 --> 00:03:47,500
We were inseparable.

18
00:04:12,000 --> 00:04:16,500
Then one afternoon... a giant shadow crossed the sun.

19
00:04:38,000 --> 00:04:42,500
A massive dragon swept down and took him away.

20
00:04:45,000 --> 00:04:47,000
Scales!

21
00:05:25,000 --> 00:05:30,000
I swore I would find him, no matter how far I had to walk.

22
00:06:05,000 --> 00:06:10,000
Across deserts, through ruined cities, across oceans.

23
00:07:15,000 --> 00:07:20,500
Be careful in the deep caverns. Dragons remember who hurt them.

24
00:09:12,000 --> 00:09:15,000
Scales? Is that you?

25
00:10:45,000 --> 00:10:48,500
No... no, it can't be!

26
00:11:18,000 --> 00:11:23,500
What have I done... Scales... I'm so sorry...`;

const BBB_SRT = `# Big Buck Bunny is a 100% non-dialogue animated film. No spoken dialogue cues.`;

const ED_SRT = `1
00:00:15,000 --> 00:00:17,951
At the left we can see...

2
00:00:18,166 --> 00:00:20,083
At the right we can see the...

3
00:00:20,119 --> 00:00:21,962
...the head-snarlers

4
00:00:21,999 --> 00:00:24,368
Everything is safe. Perfectly safe.

5
00:00:24,582 --> 00:00:27,035
Emo?

6
00:00:28,206 --> 00:00:29,996
Watch out!

7
00:00:47,037 --> 00:00:48,494
Are you hurt?

8
00:00:51,994 --> 00:00:53,949
I don't think so. You?

9
00:00:55,160 --> 00:00:56,985
I'm Ok.

10
00:00:57,118 --> 00:01:01,111
Get up. Emo. it's not safe here.`;

export class FixtureTrackRepository implements ITrackRepository {
  private titles: Title[] = titlesData;

  async getTitles(): Promise<Title[]> {
    return this.titles;
  }

  async getTitle(id: string): Promise<Title | null> {
    const title = this.titles.find(t => t.id === id);
    return title || null;
  }

  async getSubtitles(titleId: string): Promise<SubtitleCue[]> {
    let srtText = SINTEL_SRT;
    if (titleId === 'big-buck-bunny') srtText = BBB_SRT;
    if (titleId === 'elephants-dream') srtText = ED_SRT;
    return parseSrt(srtText);
  }

  async getTrack(titleId: string): Promise<DescriptionTrack> {
    const cues = await this.getSubtitles(titleId);
    const gaps = findGaps(cues, { minGapSec: 2.5, guardMs: 300 });

    if (titleId === 'sintel') {
      const rawDrafts = (Array.isArray(sintelTrackData.descriptions)
        ? sintelTrackData.descriptions
        : sintelTrackData.default?.descriptions || []) as Description[];
      const placement = placeDescriptions(gaps, rawDrafts);
      const counters = computeTrackCounters(placement.scheduled, gaps, cues);

      return {
        titleId: 'sintel',
        revision: sintelTrackData.revision || 'v2.0',
        status: sintelTrackData.status as any || 'ai-draft',
        descriptions: placement.all,
        metadata: {
          totalGaps: counters.totalGaps,
          describedCount: counters.describedCount,
          skippedCount: counters.skippedCount,
          overlapCount: counters.overlapCount,
          generatedAt: sintelTrackData.metadata?.generatedAt || '2026-09-02T12:00:00Z',
          model: sintelTrackData.metadata?.model || 'fixture-handwritten'
        }
      };
    }

    // For titles without a pre-recorded description track (Big Buck Bunny, Elephants Dream),
    // return an honest empty track. Never fabricate or invent descriptions.
    return {
      titleId,
      revision: 'unprocessed',
      status: 'ai-draft',
      descriptions: [],
      metadata: {
        totalGaps: gaps.length,
        describedCount: 0,
        skippedCount: gaps.length,
        overlapCount: 0,
        generatedAt: 'not-generated',
        model: 'none'
      }
    };
  }
}
