import { FixtureTrackRepository } from '../src/features/catalog/data/fixture-track-repository';

/**
 * Character continuity is the one thing an audio description track cannot get
 * wrong quietly.
 *
 * A sighted viewer sees one person walk across a film. A listener only knows
 * it is one person if the track keeps calling her the same thing. When an
 * earlier revision of this track said "a young woman", "a woman with red hair",
 * "the young woman" and "a gaunt woman" across the same character, a listener
 * had no way to know they were not four people - and no way to know they were.
 * The information simply was not delivered.
 *
 * So the register is not a style guide here, it is an invariant, and these
 * tests fail the build if it drifts back.
 */
describe('Sintel track - character continuity', () => {
  const load = async () => {
    const repo = new FixtureTrackRepository();
    const { descriptions } = await repo.getTrack('sintel');
    return descriptions;
  };

  // The film's own title card reads SINTEL at 96s. Before that the track
  // describes her; from there on it names her. Naming her earlier would hand a
  // listener something the picture has not given a sighted viewer yet.
  const TITLE_CARD_SEC = 96;

  it('never names Sintel before the film puts her name on screen', async () => {
    const early = (await load()).filter(d => d.tStart < TITLE_CARD_SEC);
    expect(early.length).toBeGreaterThan(0);
    for (const d of early) {
      expect(d.text).not.toMatch(/\bSintel\b/);
    }
  });

  it('uses one fixed name for the protagonist after the title card', async () => {
    // Every phrase an earlier revision used for her instead of her name.
    const DRIFT = [
      /\bthe young woman\b/i,
      /\ba young woman\b/i,
      /\bthe woman\b/i,
      /\ba woman with\b/i,
      /\bred[- ]haired\b/i,
      /\bwith red hair\b/i,
      /\ba gaunt woman\b/i
    ];
    const offenders: string[] = [];
    for (const d of (await load()).filter(x => x.tStart >= TITLE_CARD_SEC)) {
      for (const re of DRIFT) {
        if (re.test(d.text)) offenders.push(`${d.id}: ${d.text}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('calls the adult dragon a dragon, not a creature', async () => {
    // "creature" was the model's word and it was used for the same animal in
    // four separate lines while "wing" was used for it in a fifth. One animal,
    // one noun.
    //
    // sintel-ad-44 is exempt and stays exempt: it describes end-credit pencil
    // sketches, and the frame at 882s holds stylised cartoon figures rather
    // than the characters as the film renders them. "A girl and a creature" is
    // the honest reading of a drawing; naming them would be an identity claim
    // the sketch does not support. The register governs the film, not its
    // credit art.
    const CREDIT_ART = new Set(['sintel-ad-44']);
    const offenders: string[] = [];
    for (const d of await load()) {
      if (CREDIT_ART.has(d.id)) continue;
      if (/\bcreature\b/i.test(d.text)) offenders.push(`${d.id}: ${d.text}`);
    }
    expect(offenders).toEqual([]);
  });

  it('introduces the protagonist before it names her', async () => {
    const all = await load();
    const named = all
      .filter(d => /\bSintel\b/.test(d.text))
      .sort((a, b) => a.tStart - b.tStart);
    expect(named.length).toBeGreaterThan(15);

    // The first line that says her name is the title-card line, and it says so.
    expect(named[0].id).toBe('sintel-ad-10');
    expect(named[0].text).toMatch(/title/i);

    // And she is on screen, described, before that point.
    const before = all.filter(d => d.tStart < named[0].tStart);
    expect(before.some(d => /traveller|warrior/i.test(d.text))).toBe(true);
  });

  it('keeps the previous wording of every line the register changed', async () => {
    // A silent rewrite of a description track is indistinguishable from a
    // fabrication. Each edited line carries its own history.
    const edited = (await load()).filter(d => (d as any).continuityFrom);
    expect(edited.length).toBeGreaterThan(20);
    for (const d of edited) {
      const chain = (d as any).continuityFrom;
      expect(Array.isArray(chain)).toBe(true);
      expect(chain.length).toBeGreaterThan(0);
      for (const prior of chain) {
        expect(typeof prior).toBe('string');
        expect(prior.length).toBeGreaterThan(0);
        expect(prior).not.toBe(d.text);
      }
    }
  });

  it('states a reason for every line it rewrote rather than renamed', async () => {
    // A rewrite changes what the line claims to have seen, so it owes an
    // explanation. A rename does not change the claim, so it does not.
    // Reasons from the first accuracy review are terse by design - "called a
    // near-white frame dark" says everything it needs to. The bar is that a
    // reason exists, names the fault, and points at a frame; not that it is
    // long.
    const rewritten = (await load()).filter(d => (d as any).correctionReason);
    expect(rewritten.length).toBeGreaterThan(15);
    for (const d of rewritten) {
      expect((d as any).correctionReason.trim().length).toBeGreaterThan(15);
      expect(d.frameRef).toMatch(/^sintel@\d{2}:\d{2}$/);
    }
  });
});
