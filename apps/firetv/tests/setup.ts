// Belt and braces for the NODE_ENV=production trap described in the root
// jest.config.js. The root config fixes it for the main process, but this file
// runs inside the worker and runs BEFORE the test module requires React, which
// is the moment the dev-or-production bundle gets chosen. Setting it here means
// a single suite run directly through the firetv project is correct too.
if (process.env.NODE_ENV !== 'test') {
  process.env.NODE_ENV = 'test';
}

(global as any).__DEV__ = true;
require('react-native/jest/setup');

const Platform = require('react-native/Libraries/Utilities/Platform');
Platform.OS = 'android';
Platform.select = (objs: any) => objs.android || objs.default;

// Ensure act implementation is never undefined for React 19 / RNTL actImplementation.
// Named ReactRuntime, not React: this file has no imports, so TypeScript treats
// it as a global script, and `const React` there collides with the React UMD
// global from @types/react.
const ReactRuntime = require('react');
const ReactTestRenderer = require('react-test-renderer');
const actFn =
  ReactRuntime.act || ReactTestRenderer.act || ReactTestRenderer.default?.act || ((cb: any) => cb());
if (typeof ReactRuntime.act !== 'function') {
  ReactRuntime.act = actFn;
}
if (typeof ReactTestRenderer.act !== 'function') {
  ReactTestRenderer.act = actFn;
}

