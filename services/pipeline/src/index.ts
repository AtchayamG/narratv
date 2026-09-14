// Each Lambda module exports a function called `handler`, so six `export *`
// lines collided on that one name and tsc failed with TS2308 six times over.
//
// That mattered far more than a barrel file should: `cdk.json` runs the
// COMPILED stack (`node ./dist/cdk/bin/app.js`), so a failing build left dist
// stale, and `cdk synth` kept happily emitting the previous template. Any
// deploy would have shipped whatever last compiled successfully rather than the
// stack in source. A build error in a file nobody imports was quietly
// controlling what reached AWS.
//
// Namespaced so the handlers stay reachable without fighting over the name.
export * as apiHandler from './lambdas/api-handler';
export * as describe from './lambdas/describe';
export * as detectGaps from './lambdas/detect-gaps';
export * as extractFrames from './lambdas/extract-frames';
export * as publish from './lambdas/publish';
export * as synthesize from './lambdas/synthesize';

export * from './live-describe-adapter';
