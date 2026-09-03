(global as any).__DEV__ = true;
require('react-native/jest/setup');

const Platform = require('react-native/Libraries/Utilities/Platform');
Platform.OS = 'android';
Platform.select = (objs: any) => objs.android || objs.default;

// Ensure act implementation is never undefined for React 19 / RNTL actImplementation
const React = require('react');
const ReactTestRenderer = require('react-test-renderer');
const actFn = React.act || ReactTestRenderer.act || ReactTestRenderer.default?.act || ((cb: any) => cb());
if (typeof React.act !== 'function') {
  React.act = actFn;
}
if (typeof ReactTestRenderer.act !== 'function') {
  ReactTestRenderer.act = actFn;
}

