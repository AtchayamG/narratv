import { Title, DescriptionTrack, SubtitleCue, Description } from '@narratv/contracts';
import { parseSrt, findGaps, placeDescriptions, computeTrackCounters } from '@narratv/scheduler';
import { ITrackRepository } from '../domain/repository';

const rawTitles = require('../../../../assets/fixtures/titles.json');
const rawSintelTrack = require('../../../../assets/fixtures/sintel-track.json');

const titlesData: Title[] = Array.isArray(rawTitles) ? rawTitles : (rawTitles.default || []);
const sintelTrackData = rawSintelTrack.default || rawSintelTrack;

/**
 * Official English subtitles for Sintel, from Wikimedia Commons
 * TimedText:Sintel_movie_4K.webm.en.srt (CC-BY 3.0, (c) Blender Foundation).
 * Kept byte-identical to assets/fixtures/sintel.srt - see that file's
 * PROVENANCE.md for what was here before and why it was wrong.
 *
 * The film's first spoken word is at 00:01:47,250. Anything that claims
 * dialogue before that is fabricated.
 */
const SINTEL_SRT = `1
00:01:47,250 --> 00:01:50,500
This blade has a dark past.

2
00:01:51,800 --> 00:01:55,800
It has shed much innocent blood.

3
00:01:58,000 --> 00:02:01,450
You're a fool for traveling alone,
so completely unprepared.

4
00:02:01,750 --> 00:02:04,800
You're lucky your blood's still flowing.

5
00:02:05,250 --> 00:02:06,300
Thank you.

6
00:02:07,500 --> 00:02:09,000
So...

7
00:02:09,400 --> 00:02:13,800
What brings you to
the land of the gatekeepers?

8
00:02:15,000 --> 00:02:17,500
I'm searching for someone.

9
00:02:18,000 --> 00:02:22,200
Someone very dear?
A kindred spirit?

10
00:02:23,400 --> 00:02:25,000
A dragon.

11
00:02:28,850 --> 00:02:31,750
A dangerous quest for a lone hunter.

12
00:02:32,950 --> 00:02:35,870
I've been alone for
as long as I can remember.

13
00:03:27,250 --> 00:03:30,500
We're almost done. Shhh...

14
00:03:30,750 --> 00:03:33,500
Hey, sit still.

15
00:03:48,250 --> 00:03:52,250
Good night, Scales.

16
00:04:10,350 --> 00:04:13,850
Get him, Scales! Come on!

17
00:04:25,250 --> 00:04:28,250
Scales?

18
00:05:04,000 --> 00:05:07,500
Yeah! Come on!

19
00:05:38,750 --> 00:05:42,000
Scales!

20
00:07:25,850 --> 00:07:27,500
I have failed.

21
00:07:32,800 --> 00:07:36,500
You've only failed to see...

22
00:07:37,800 --> 00:07:40,500
These are dragon lands, Sintel.

23
00:07:40,850 --> 00:07:44,000
You are closer than you know.

24
00:09:17,600 --> 00:09:19,500
Scales!

25
00:10:21,600 --> 00:10:24,000
Scales?

26
00:10:26,200 --> 00:10:29,800
Scales...`;

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

  async getTrack(titleId: string, options?: { extended?: boolean }): Promise<DescriptionTrack> {
    const cues = await this.getSubtitles(titleId);
    // The film's runtime MUST be passed. Without it findGaps cannot know where
    // the last gap ends, so it drops the tail gap between the final dialogue
    // cue and the end of the film entirely. For Sintel that is 630.1s-888.064s
    // - 258 seconds, the single largest gap in the film - and the counter
    // reported 12 gaps while the player was placing six descriptions inside
    // the thirteenth. Counting a gap the app describes is not optional.
    const title = await this.getTitle(titleId);
    const gaps = findGaps(cues, {
      minGapSec: 2.5,
      guardMs: 300,
      totalDurationSec: title?.durationSec
    });

    if (titleId === 'sintel') {
      const rawDrafts = (Array.isArray(sintelTrackData.descriptions)
        ? sintelTrackData.descriptions
        : sintelTrackData.default?.descriptions || []) as Description[];

      // Two different kinds of track need two different treatments.
      //
      // A DRAFT track carries candidate descriptions with approximate times and
      // must be fitted into gaps by placeDescriptions().
      //
      // A PRE-PLACED track carries timings that ARE the deliverable: each line
      // was written against the frame at that exact timestamp. Re-placing it
      // would snap every description to the head of its gap and destroy the
      // alignment. So it is VALIDATED instead - anything that would collide
      // with real dialogue is marked skipped rather than silently moved.
      //
      // This is flagged explicitly rather than inferred from the model name.
      // The track now carries mixed provenance - gap 0 written by hand from
      // frames, gaps 1-12 written by Bedrock from frames - so no single model
      // string describes it, and every description states its own `model`.
      const preplaced = sintelTrackData.metadata?.placement === 'preplaced';

      const collidesWithDialogue = (d: Description) =>
        cues.some(cue => d.tStart < cue.tEnd && d.tEnd > cue.tStart);

      const findPreplacedSafePoint = (d: Description): { safePoint: number | null; reason?: string } => {
        // Quality gates: low-confidence (<0.6) or human-rejected candidates are NEVER extended
        if (d.status === 'skipped' && d.skipReason === 'human-rejected') {
          return { safePoint: null, reason: 'human-rejected' };
        }
        if (d.confidence !== undefined && d.confidence < 0.6) {
          return { safePoint: null, reason: 'low-confidence' };
        }

        const overlappingCues = cues
          .filter(cue => d.tStart < cue.tEnd && d.tEnd > cue.tStart)
          .sort((a, b) => a.tStart - b.tStart);

        if (overlappingCues.length === 0) {
          return { safePoint: null };
        }

        // Trace cue chain starting from the first overlapping cue
        const chainStart = overlappingCues[0].tStart;
        let chainEnd = overlappingCues[0].tEnd;

        // Any cue that connects with less than 300ms gap extends the chain
        const sortedCues = [...cues].sort((a, b) => a.tStart - b.tStart);
        for (const cue of sortedCues) {
          if (cue.tStart >= chainStart && cue.tStart <= chainEnd + 0.3) {
            chainEnd = Math.max(chainEnd, cue.tEnd);
          }
        }

        const chainDuration = chainEnd - chainStart;
        if (chainDuration > 5.0) {
          return { safePoint: null, reason: 'cue-chain-exceeded' };
        }

        const candidatePoint = Math.round((chainEnd + 0.3) * 100) / 100;
        const insideDialogue = cues.some(c => candidatePoint >= c.tStart && candidatePoint < c.tEnd);
        if (insideDialogue) {
          return { safePoint: null, reason: 'inside-dialogue' };
        }

        return { safePoint: candidatePoint };
      };

      const descriptions: Description[] = preplaced
        ? rawDrafts.map(d => {
            if (!collidesWithDialogue(d)) {
              return d;
            }
            if (options?.extended) {
              const { safePoint, reason } = findPreplacedSafePoint(d);
              if (safePoint !== null) {
                return {
                  ...d,
                  isExtended: true,
                  pausePoint: safePoint,
                  placementRule: `Extended: delivered by pause at ${safePoint.toFixed(2)}s`
                };
              }
              if (reason === 'cue-chain-exceeded') {
                return {
                  ...d,
                  status: 'skipped' as const,
                  skipReason: 'no-gap' as const,
                  placementRule: 'Refused: dialogue cue chain exceeds 5.0 s limit'
                };
              }
              if (reason === 'low-confidence') {
                return {
                  ...d,
                  status: 'skipped' as const,
                  skipReason: 'low-confidence' as const,
                  placementRule: `Rejected: confidence ${d.confidence} < threshold 0.6`
                };
              }
              if (reason === 'human-rejected') {
                return {
                  ...d,
                  status: 'skipped' as const,
                  skipReason: 'human-rejected' as const,
                  placementRule: 'Rejected during human editorial review'
                };
              }
            }
            return {
              ...d,
              status: 'skipped' as const,
              skipReason: 'no-gap' as const,
              placementRule: 'Refused: overlaps a real dialogue cue.'
            };
          })
        : placeDescriptions(gaps, rawDrafts, { extended: options?.extended, cues }).all;

      const active = descriptions.filter(d => d.status !== 'skipped');
      const normalActive = active.filter(d => !d.isExtended);
      const extendedActive = active.filter(d => d.isExtended);
      const counters = preplaced
        ? {
            totalGaps: gaps.length,
            describedCount: normalActive.length,
            extendedCount: extendedActive.length,
            skippedCount: descriptions.length - active.length,
            overlapCount: active.filter(d => {
              if (d.isExtended) {
                return cues.some(c => d.pausePoint !== undefined && d.pausePoint >= c.tStart && d.pausePoint < c.tEnd);
              }
              return collidesWithDialogue(d);
            }).length
          }
        : computeTrackCounters(active, gaps, cues);

      return {
        titleId: 'sintel',
        revision: sintelTrackData.revision || 'v2.0',
        status: sintelTrackData.status as any || 'ai-draft',
        descriptions,
        metadata: {
          totalGaps: counters.totalGaps,
          describedCount: counters.describedCount,
          extendedCount: counters.extendedCount ?? 0,
          skippedCount: counters.skippedCount,
          overlapCount: counters.overlapCount,
          generatedAt: sintelTrackData.metadata?.generatedAt || 'not-generated',
          model: sintelTrackData.metadata?.model || 'none'
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
        extendedCount: 0,
        skippedCount: gaps.length,
        overlapCount: 0,
        generatedAt: 'not-generated',
        model: 'none'
      }
    };
  }
}
