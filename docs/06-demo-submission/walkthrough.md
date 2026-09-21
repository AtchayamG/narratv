# NarraTV — Submission Walkthrough & Verification Guide

Written for someone who has never seen this repository. Part 1 needs no code
execution. Part 2 is for a judge who wants to run it, with the exact commands
and the exact output to expect.

Every figure in this document was re-derived on **2026-09-21** from the
repository as it stands, not copied forward from an earlier draft.

---

## Part 1 — For the judge reviewing offline

### 1. What it is

A Fire TV application that **generates audio description for films that have no
description track**, speaks it in the real dialogue-free gaps, and **refuses out
loud, on screen, when a line will not fit**.

About 7% of streaming content carries audio description. Human-authored AD runs
$15–75 per minute of runtime *per language*, so the original-language release
gets described and the dubs never do. India's Ministry of Information and
Broadcasting issued OTT accessibility guidelines on 6 February 2026 requiring
audio description, so the shortfall is about to become a compliance problem at a
scale description studios cannot staff.

### 2. The claim that matters most

**The model was graded, not trusted.** Amazon Bedrock Nova Pro wrote 34 of the
44 lines in the shipped track, each from a frame pulled out of the same cut the
app streams — never from a synopsis. Every line was then re-read against the
frame it came from:

| | count |
|---|---|
| Bedrock lines, total | **34** |
| accepted as written (shipped verbatim, or renamed referent only) | **19** |
| corrected after review | **15** |
| human-written lines in the opening gap | **10** |
| **total lines in the track** | **44** |

That 19/34 split is **derived from the per-line `model` labels** in
`apps/firetv/assets/fixtures/sintel-track.json`, not typed in. Reproduce it
without trusting this document:

```powershell
node -e "const t=require('./apps/firetv/assets/fixtures/sintel-track.json');const m=t.descriptions.filter(x=>/nova-pro/.test(x.model));const h=x=>m.filter(y=>y.model.includes(x)).length;const vb=h('amazon.nova-pro-v1:0')-h('+'),rn=h('referent-normalised'),co=h('human-corrected'),rw=h('human-rewritten-from-frame');console.log('bedrock lines      ',m.length);console.log('accepted as written',vb+rn,'( verbatim',vb,'+ renamed',rn,')');console.log('corrected          ',co+rw,'( reworded',co,'+ rewritten',rw,')');console.log('sums to total?     ',vb+rn+co+rw===m.length)"
```

Verified output on 2026-09-21:

```
bedrock lines       34
accepted as written 19 ( verbatim 5 + renamed 14 )
corrected           15 ( reworded 14 + rewritten 1 )
sums to total?      true
```

The honest part is the 15. An earlier revision of this track reported 8 of 34
surviving review while its own metadata said 19, because it counted a renamed
character as a correction. A rename makes no new observation, so it is not a
correction — and the figure is now computed from the labels so the two cannot
drift apart again.

### 3. What was wrong and got fixed, on the record

This is not a clean-run story and the repository does not present it as one.

- **The hand-written opening gap was wrong.** Ten lines were written by hand and
  labelled `human-verified-frames`, then never re-checked. Re-extracting the
  frames found **four lines describing a scene the film does not contain** — the
  film opens on a fight and the track described a quiet walk through snow. A
  fifth led on the wrong detail. All five were rewritten from the frames. Full
  account, with a claimed-versus-actual table, in
  [`sintel-track.json.PROVENANCE.md`](../../apps/firetv/assets/fixtures/sintel-track.json.PROVENANCE.md).
  The lesson is stated there: *a provenance label is a claim about process, not
  a certificate of accuracy, and only a frame settles it.*
- **The test suite was green over seven TypeScript errors.** Jest runs through
  babel, which strips types without checking them. Two were real defects — a
  badge variant that did not exist, on the catalog screen, and a type against an
  `expo-av` export the installed version does not have, on the
  audio-description playback path. The root `typecheck` script that would have
  caught it was itself broken (`tsc --build` with no root `tsconfig.json`).
  Both fixed; a test now fails the suite if the typecheck regresses.
- **A test that could not fail.** The D-pad reachability suite asserted
  `focusable === true || accessible === true`, and both components hardcode
  `accessible={true}`. Setting `focusable={false}` on every button in the app —
  making the whole UI unreachable by remote — left all nine tests green across
  five runs. The two properties are now asserted separately.
- **An accessibility regression caused by a type fix.** Correcting the badge
  variant moved a label from 5.33:1 to **3.13:1 at rest and 2.72:1 focused**,
  under the 4.5:1 WCAG 1.4.3 needs. On a 10-foot D-pad surface, focused is the
  normal state. Fixed with text-only colour tokens, and
  `apps/firetv/tests/badge-contrast.test.tsx` now reads the colours off the
  rendered node and fails if a fill token is used as label text.

### 4. Verified vs. unverified

The README carries a 16-row table separating what is verified from what is
modelled, including the rows that are unflattering. Two worth reading before you
test anything:

- **Sync error** is stated as *"Verified, narrow sample"* — mean absolute error
  0.203s over **ten** logged lines from the opening gap in a single run, max
  0.540s, 6 of 10 inside 0.2s. Ten of 44 lines, not the whole film.
- **Cloud cost ~$0.37** for a 90-minute track is a *projection* from measured
  per-call costs, not a reconciled bill, and says so.

---

## Part 2 — For the judge running the code

### Prerequisites

- Node 20+ and npm
- Windows PowerShell (the `ops\*.cmd` helpers are Windows batch). On macOS or
  Linux, run the underlying npm/npx commands directly — nothing in the test or
  typecheck path is Windows-specific.
- An **Android TV emulator, API 30+**, only for Step 4. Steps 1–3 need no device.

```powershell
git clone https://github.com/AtchayamG/narratv
cd narratv
npm install
ops\check-tools.cmd      # reports what is present and what is missing
```

### Step 1 — Run the suites

```powershell
ops\test-all.cmd
```

Expect exactly:

```
Test Suites: 28 passed, 28 total
Tests:       141 passed, 141 total
Ran all test suites in 4 projects.
```

Four workspaces run: `packages/contracts`, `packages/scheduler`,
`services/pipeline`, `apps/firetv`.

### Step 2 — Run the typecheck, and prove it can fail

```powershell
npm run typecheck
```

Expect **no output and exit 0** across all four workspaces. This is the check
that was broken while the suite was green, so it is worth breaking on purpose:

```powershell
echo const __probe: number = 'nope'; >> apps\firetv\src\shared\Badge.tsx
npx jest services/pipeline/tests/typecheck.test.ts
git checkout -- apps\firetv\src\shared\Badge.tsx
```

The test fails and prints the `TS2322` diagnostic. That is the gate working.

### Step 3 — Call the live AWS endpoint yourself

```powershell
curl https://oqxbh0hegf.execute-api.us-east-1.amazonaws.com/health
```

Expect `mode: live` with `bedrock`, `polly` and `s3` all `ok`, plus a `revision`
and a current `timestamp`:

```json
{"mode":"live","providers":{"bedrock":"ok","polly":"ok","s3":"ok"},
 "revision":"2026.09.02-production.v1","timestamp":"..."}
```

The live timestamp is the point — it rules out a cached or stubbed reply. Two
scripts reproduce the deeper calls:

```powershell
ops\verify-live-endpoint.cmd              # health + /describe round trip
ops\verify-live-describe-real-frame.cmd   # posts a real frame, returns a Nova Pro line
```

**No AWS credentials are ever on the television.** The app reaches this endpoint
with a plain `fetch()`; the Lambda holds the credentials. That is why LIVE mode
is a deployment property rather than a device secret.

### Step 4 — Run the app on an emulator

```powershell
ops\build-release.cmd        # signed release APK, JS bundled
ops\fix-tts.cmd              # REQUIRED after every emulator start - see below
ops\install-and-shoot.cmd    # install, launch, capture
```

`ops\fix-tts.cmd` is not optional. On this Android TV image
`com.google.android.tts` ships **disabled** (`enabled=0`,
`tts_default_synth` null), so without it the audio-description app is silent and
looks broken. This is written up in the friction log.

What to look for, in order:

1. **The catalogue.** Three titles. *Big Buck Bunny* and *Elephants Dream* show
   an honest `NO AD TRACK` state — they are not silently pretended over.
2. **Play Sintel.** Real H.264 streaming, clock driven by `onProgress`, never a
   timer. The film's first spoken line is at **1:47.250**; the 107 seconds
   before it are dialogue-free and get described in real silence.
3. **The refusal, at 2:26.8.** `SKIPPED · NO GAP` appears over the picture,
   holds 4 seconds (`REFUSAL_HOLD_SEC = 4.0`) and clears. The line needed ~4.40s
   of speech and had 2.05s before the next subtitle cue at 148.85s, so the
   player refused rather than talking over dialogue.
4. **The player header** reads `42 AD · 2 SKIPPED · 13 GAPS`, computed at
   runtime from the track — not a literal in the markup.
5. **System Status → Switch to LIVE.** The running app flips to AWS Bedrock with
   no rebuild, and describes the current frame.

### Step 5 — Check the refusal count without the emulator

Exactly two of the 44 lines refuse at runtime, and the binding constraint is
**dialogue proximity, not slot width**:

```powershell
node -e "const fs=require('fs');const t=require('./apps/firetv/assets/fixtures/sintel-track.json');const s=fs.readFileSync('./apps/firetv/assets/fixtures/sintel.srt','utf8');const c=[...s.matchAll(/(\d\d):(\d\d):(\d\d)[,.](\d\d\d)\s*-->/g)].map(m=>+m[1]*3600+ +m[2]*60+ +m[3]+ +m[4]/1000);const W=2.5;t.descriptions.forEach(d=>{const need=d.text.trim().split(/\s+/).length/W;const n=c.find(x=>x>=d.tStart);if(n&&(n-d.tStart)<need)console.log(d.id,'at',d.tStart+'s','has',(n-d.tStart).toFixed(2)+'s room, needs',need.toFixed(2)+'s')})"
```

Expect two lines: `sintel-ad-11` at 146.8s (2:26.8) and `sintel-ad-28` at
449.3s (7:29.3). `SPEECH_WORDS_PER_SEC = 2.5` is the app's own constant, in
`apps/firetv/src/features/player/data/tts-adapter.ts`.

---

## What this submission does not claim

- **No Vega OS build.** This targets Fire OS with `react-native-tvos`. The Vega
  toolchain needs a Linux or macOS host and this was built on Windows. The
  domain and scheduler packages are plain TypeScript with no platform imports,
  so a Vega build would reuse them unchanged; only the player shell is
  platform-specific.
- **No physical Fire TV device.** Verified on an Android TV emulator, API 30,
  1080p. Amazon's developer-relations team confirmed on the hackathon build
  session that a virtual device is an accepted demo target.
- **Screen-reader behaviour is asserted in tests, not on hardware.**
  `accessibilityLiveRegion="assertive"` on the refusal pill is verified by a
  test that fails if it is downgraded, but whether Fire OS VoiceView audibly
  announces it on real hardware was not measured.
- **Four README rows were re-measured on 2026-09-21** and one was re-worded
  because the sample was narrower than the original claim implied. The
  correction is in the table, not hidden here.
