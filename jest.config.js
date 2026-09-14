// Jest respects an inherited NODE_ENV instead of forcing "test", and this
// machine exports NODE_ENV=production globally (friction log entry 8). When
// that leaks in, `require('react-test-renderer')` resolves to React's
// PRODUCTION bundle, where act() is a no-op. Nothing flushes, the test
// renderer's root never commits, and eight suites fail with "Can't access
// .root on unmounted test renderer" - an error that points at React and has
// nothing to do with the code under test. It cost a full debugging detour
// once; it does not get to do that twice.
//
// Setting it here, before the projects are loaded, means `yarn test` is
// correct no matter what the caller's shell exports.
if (process.env.NODE_ENV !== 'test') {
  process.env.NODE_ENV = 'test';
}

module.exports = {
  projects: [
    '<rootDir>/packages/contracts',
    '<rootDir>/packages/scheduler',
    '<rootDir>/services/pipeline',
    '<rootDir>/apps/firetv'
  ]
};
