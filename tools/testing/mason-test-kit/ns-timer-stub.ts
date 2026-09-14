// Stand-in for @nativescript/core/timer. The real iOS module subclasses NSObject
// at module scope for its run-loop-backed timers; in Node the host timers are
// both sufficient and closer to the real semantics than anything stubbed.
export const setTimeout = globalThis.setTimeout.bind(globalThis);
export const clearTimeout = globalThis.clearTimeout.bind(globalThis);
export const setInterval = globalThis.setInterval.bind(globalThis);
export const clearInterval = globalThis.clearInterval.bind(globalThis);
