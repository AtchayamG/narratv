import React from 'react';

if (!(React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE) {
  (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =
    (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED || {};
}
const internals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
if (internals.S === undefined) internals.S = null;
internals.actQueue = null;
internals.thrownErrors = [];

let _currentDispatcher: any = null;
const dispatcherHolder = {
  get current() {
    return internals.H || _currentDispatcher;
  },
  set current(val: any) {
    _currentDispatcher = val;
    internals.H = val;
  }
};
try {
  Object.defineProperty(internals, 'ReactCurrentDispatcher', {
    get: () => dispatcherHolder,
    set: (v: any) => { if (v && v.current) internals.H = v.current; },
    configurable: true,
    enumerable: true
  });
} catch {}

let _currentBatch: any = null;
const batchHolder = {
  get transition() {
    return internals.T !== undefined ? internals.T : _currentBatch;
  },
  set transition(val: any) {
    _currentBatch = val;
    internals.T = val;
  }
};
try {
  Object.defineProperty(internals, 'ReactCurrentBatchConfig', {
    get: () => batchHolder,
    set: (v: any) => { if (v && v.transition) internals.T = v.transition; },
    configurable: true,
    enumerable: true
  });
} catch {}

if (typeof (global as any).ErrorUtils !== 'undefined') {
  const origHandler = (global as any).ErrorUtils.getGlobalHandler();
  (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
    console.error('>>> NARRA_GLOBAL_ERROR_TRACE <<<', error?.message, error?.stack);
    if (origHandler) origHandler(error, isFatal);
  });
}

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
