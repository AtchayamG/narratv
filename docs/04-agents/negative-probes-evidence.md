# Negative Probes Evidence Log — Task 23

This log records every negative probe performed for Task 23: breaking each safety invariant deliberately, demonstrating test or typecheck failure with non-zero exit code and diagnostic output, reverting the change, and demonstrating a clean pass with exit code 0.

---

## Probe 1: Monorepo Root Typecheck (D2)

**Invariant**: `yarn typecheck` (or `npm run typecheck`) must detect and fail on TypeScript compiler diagnostics across all workspaces in the monorepo (`packages/contracts`, `packages/scheduler`, `services/pipeline`, and `apps/firetv`).

**Intervention**: Introduced an intentional type mismatch in `packages/contracts/src/gap.ts:15`:
```diff
--- a/packages/contracts/src/gap.ts
+++ b/packages/contracts/src/gap.ts
@@ -15,0 +16,1 @@
+export const negativeProbeTypeCheck: number = "intentionally broken string";
```

**Broken Run Command**:
```powershell
cmd /c "yarn typecheck"
```

**Broken Run Output (Exit Code: 1)**:
```text
yarn run v1.22.22
$ tsc --noEmit -p packages/contracts && tsc --noEmit -p packages/scheduler && tsc --noEmit -p services/pipeline && tsc --noEmit -p apps/firetv
packages/contracts/src/gap.ts(15,14): error TS2322: Type 'string' is not assignable to type 'number'.
error Command failed with exit code 1.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
```

**Restoration**: Removed the invalid export line from `packages/contracts/src/gap.ts`.

**Passing Run Command**:
```powershell
cmd /c "yarn typecheck"
```

**Passing Run Output (Exit Code: 0)**:
```text
yarn run v1.22.22
$ tsc --noEmit -p packages/contracts && tsc --noEmit -p packages/scheduler && tsc --noEmit -p services/pipeline && tsc --noEmit -p apps/firetv
Done in 3.65s.
```

---

## Probe 2: Programmatic Typecheck Gate Test (D3)

**Invariant**: `services/pipeline/tests/typecheck.test.ts` executes `yarn typecheck` via `spawnSync`, asserts exit code 0, and asserts zero `error TS\d+:` compiler diagnostics in standard output or error. If any workspace has a compiler error, this test suite fails.

**Intervention**: Injected an intentional type mismatch in `packages/contracts/src/gap.ts:15`:
```diff
--- a/packages/contracts/src/gap.ts
+++ b/packages/contracts/src/gap.ts
@@ -15,0 +16,1 @@
+export const d3ProbeBadType: number = "broken";
```

**Broken Run Command**:
```powershell
cmd /c "npx jest services/pipeline/tests/typecheck.test.ts"
```

**Broken Run Output (Exit Code: 1)**:
```text
FAIL services/pipeline/tests/typecheck.test.ts (15.526 s)
  Monorepo Typecheck Gate
    ✕ monorepo typecheck script exits 0 across all workspaces with no TypeScript diagnostics (14407 ms)

  ● Monorepo Typecheck Gate › monorepo typecheck script exits 0 across all workspaces with no TypeScript diagnostics

    expect(received).not.toMatch(expected)

    Expected pattern: not /error TS\d+:/
    Received string: "packages/contracts/src/gap.ts(15,14): error TS2322: Type 'string' is not assignable to type 'number'.
    "

      27 |     // Assert no diagnostic error strings in stdout/stderr
      28 |     const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`;
    > 29 |     expect(combinedOutput).not.toMatch(/error TS\d+:/);
         |                                ^
      30 |     expect(result.status).toBe(0);
      31 |   }, 60000);
      32 | });

      at Object.<anonymous> (tests/typecheck.test.ts:29:32)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 total
Snapshots:   0 total
Time:        15.656 s
Ran all test suites matching /services\\pipeline\\tests\\typecheck.test.ts/i.
```

**Restoration**: Removed `d3ProbeBadType` from `packages/contracts/src/gap.ts`.

**Passing Run Command**:
```powershell
cmd /c "npx jest services/pipeline/tests/typecheck.test.ts"
```

**Passing Run Output (Exit Code: 0)**:
```text
PASS services/pipeline/tests/typecheck.test.ts (14.286 s)
  Monorepo Typecheck Gate
    √ monorepo typecheck script exits 0 across all workspaces with no TypeScript diagnostics (13123 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        14.412 s
Ran all test suites matching /services\\pipeline\\tests\\typecheck.test.ts/i.
```

---

## Probe 3: 10-Foot D-Pad Focus & Preferred Focus Invariants (D4)

**Invariant**: Every screen must have exactly one node carrying `hasTVPreferredFocus` to prevent TV focus limbo (where the D-pad remote cannot focus on anything) or focus collisions. `apps/firetv/tests/dpad-navigation.test.tsx` validates this invariant across all screens.

**Intervention**: Removed `hasTVPreferredFocus` from `apps/firetv/src/features/settings/presentation/SystemStatusScreen.tsx:125`:
```diff
--- a/apps/firetv/src/features/settings/presentation/SystemStatusScreen.tsx
+++ b/apps/firetv/src/features/settings/presentation/SystemStatusScreen.tsx
@@ -125,1 +125,0 @@
-          hasTVPreferredFocus
```

**Broken Run Command**:
```powershell
cmd /c "cd apps\firetv && npx jest tests/dpad-navigation.test.tsx"
```

**Broken Run Output (Exit Code: 1)**:
```text
FAIL tests/dpad-navigation.test.tsx
  D4 — 10-Foot D-Pad Reachability and Spatial Focus Invariants
    Screen-Level D-Pad Navigation
      ✓ CatalogScreen: all interactive controls are focusable, have labels/roles, and exactly one hasTVPreferredFocus (42 ms)
      ✓ PlayerScreen: all controls are focusable, labelled, and initial focus lands on Play button (48 ms)
      ✕ SystemStatusScreen: all controls are focusable, labelled, and initial focus lands on mode toggle (18 ms)
    Component-Level D-Pad Focus and Spatial Invariants
      ✓ HeroSpotlight: CTA button is focusable with valid accessibility label and role (5 ms)
      ✓ MovieRail: all movie cards are focusable with nextFocusLeft/Right routing (9 ms)
      ✓ TimelineSurface: all action buttons are focusable with appropriate labels (9 ms)
      ✓ WhyPanel: close button is focusable with accessibilityRole="button" (4 ms)
    Deliberate Negative Probe: Focus Limbo Detection
      ✓ deliberate probe: detects when a screen has zero initial focus targets (focus limbo) (7 ms)
      ✓ deliberate probe: detects when a screen has multiple conflicting initial focus targets (focus collision) (7 ms)

  ● D4 — 10-Foot D-Pad Reachability and Spatial Focus Invariants › Screen-Level D-Pad Navigation › SystemStatusScreen: all controls are focusable, labelled, and initial focus lands on mode toggle

    expect(received).toHaveLength(expected)

    Expected length: 1
    Received length: 0
    Received array:  []

       98 |     // Fire TV 10-foot requirement: exactly 1 initial preferred focus node
       99 |     const preferred = getPreferredFocusNodes(root);
    > 100 |     expect(preferred).toHaveLength(1);
          |                       ^
      101 |     expect(preferred[0].props.accessibilityLabel).toMatch(/mode/i);
      102 |   });
      103 |

      at Object.<anonymous> (tests/dpad-navigation.test.tsx:100:23)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 8 passed, 9 total
Snapshots:   0 total
Time:        1.393 s
```

**Restoration**: Replaced `hasTVPreferredFocus` on line 125 of `apps/firetv/src/features/settings/presentation/SystemStatusScreen.tsx`.

**Passing Run Command**:
```powershell
cmd /c "cd apps\firetv && npx jest tests/dpad-navigation.test.tsx"
```

**Passing Run Output (Exit Code: 0)**:
```text
PASS tests/dpad-navigation.test.tsx
  D4 — 10-Foot D-Pad Reachability and Spatial Focus Invariants
    Screen-Level D-Pad Navigation
      √ CatalogScreen: all interactive controls are focusable, have labels/roles, and exactly one hasTVPreferredFocus (45 ms)
      √ PlayerScreen: all controls are focusable, labelled, and initial focus lands on Play button (38 ms)
      √ SystemStatusScreen: all controls are focusable, labelled, and initial focus lands on mode toggle (18 ms)
    Component-Level D-Pad Focus and Spatial Invariants
      √ HeroSpotlight: CTA button is focusable with valid accessibility label and role (6 ms)
      √ MovieRail: all movie cards are focusable with nextFocusLeft/Right routing (9 ms)
      √ TimelineSurface: all action buttons are focusable with appropriate labels (9 ms)
      √ WhyPanel: close button is focusable with accessibilityRole="button" (4 ms)
    Deliberate Negative Probe: Focus Limbo Detection
      √ deliberate probe: detects when a screen has zero initial focus targets (focus limbo) (8 ms)
      √ deliberate probe: detects when a screen has multiple conflicting initial focus targets (focus collision) (7 ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        1.423 s
```

---

## Probe 4: Screen-Reader State and Assertive Live Region (D5)

**Invariant**: When candidate narration is refused/skipped (e.g. during speech collisions or audio dialogue gaps), the refusal indicator must declare `accessibilityLiveRegion="assertive"` so blind users wearing screen readers hear the critical refusal immediately without moving focus. `apps/firetv/tests/screen-reader-state.test.tsx` validates this behavior.

**Intervention**: Removed `accessibilityLiveRegion="assertive"` from `apps/firetv/src/features/player/presentation/PlayerScreen.tsx:377`:
```diff
--- a/apps/firetv/src/features/player/presentation/PlayerScreen.tsx
+++ b/apps/firetv/src/features/player/presentation/PlayerScreen.tsx
@@ -377,1 +377,0 @@
-                  accessibilityLiveRegion="assertive"
```

**Broken Run Command**:
```powershell
cmd /c "cd apps\firetv && npx jest tests/screen-reader-state.test.tsx"
```

**Broken Run Output (Exit Code: 1)**:
```text
FAIL tests/screen-reader-state.test.tsx
  D5 — Screen-Reader State and Live Region Invariants
    SystemStatusScreen State Invariants
      ✓ mode toggle declares accessibilityState.checked reflecting demoMode (34 ms)
      ✓ refresh status button declares accessibilityState.disabled and busy reflecting loading state (11 ms)
    MovieRail State Invariants
      ✓ movie cards declare accessibilityState.selected reflecting active item selection (11 ms)
    PlayerScreen Controls State and Live Regions
      ✓ playback controls declare accurate accessibilityState (selected, checked, disabled, expanded) (36 ms)
      ✓ active narration declares accessibilityLiveRegion="polite" during real-time speech (13 ms)
      ✕ refusal indicator declares accessibilityLiveRegion="assertive" when candidate description is skipped (13 ms)

  ● D5 — Screen-Reader State and Live Region Invariants › PlayerScreen Controls State and Live Regions › refusal indicator declares accessibilityLiveRegion="assertive" when candidate description is skipped

    expect(received).toBeGreaterThanOrEqual(expected)

    Expected: >= 1
    Received:    0

      175 |     const assertiveNodes = root.findAll((node: any) => node.props?.accessibilityLiveRegion === 'assertive');
    > 176 |     expect(assertiveNodes.length).toBeGreaterThanOrEqual(1);
          |                                   ^
      177 |     const refusalNode = assertiveNodes.find((node: any) =>
      178 |       node.props?.accessibilityLabel?.includes('Refusal') ||
      179 |       node.props?.accessibilityLabel?.includes('Dialogue')

      at Object.<anonymous> (tests/screen-reader-state.test.tsx:176:35)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 5 passed, 6 total
Snapshots:   0 total
Time:        1.442 s
```

**Restoration**: Replaced `accessibilityLiveRegion="assertive"` on line 377 of `apps/firetv/src/features/player/presentation/PlayerScreen.tsx`.

**Passing Run Command**:
```powershell
cmd /c "cd apps\firetv && npx jest tests/screen-reader-state.test.tsx"
```

**Passing Run Output (Exit Code: 0)**:
```text
PASS tests/screen-reader-state.test.tsx
  D5 — Screen-Reader State and Live Region Invariants
    SystemStatusScreen State Invariants
      √ mode toggle declares accessibilityState.checked reflecting demoMode (33 ms)
      √ refresh status button declares accessibilityState.disabled and busy reflecting loading state (12 ms)
    MovieRail State Invariants
      √ movie cards declare accessibilityState.selected reflecting active item selection (11 ms)
    PlayerScreen Controls State and Live Regions
      √ playback controls declare accurate accessibilityState (selected, checked, disabled, expanded) (36 ms)
      √ active narration declares accessibilityLiveRegion="polite" during real-time speech (13 ms)
      √ refusal indicator declares accessibilityLiveRegion="assertive" when candidate description is skipped (14 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        1.446 s
```
