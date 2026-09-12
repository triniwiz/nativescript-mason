export const native_ = Symbol('[[native]]');
export const style_ = Symbol('[[style]]');
export const isTextChild_ = Symbol('[[isTextChild]]');
export const isText_ = Symbol('[[isText]]');
export const isMasonView_ = Symbol('[[isMasonView]]');
export const text_ = Symbol('[[text]]');
export const isPlaceholder_ = Symbol('[[isPlaceholder]]');
export const textNode_ = Symbol('[[textNode]]');
export const textNodeIndex_ = Symbol('[[textNodeIndex]]');
export const textNodeProxied_ = Symbol('[[textNodeProxied]]');
export const pseudoStyles_ = Symbol('[[pseudoStyles]]');
// Cache slot for the synthetic text node `[textProperty.setNative]` uses when
// no real framework DOM child backs the text (see common.ts) — lets repeat
// writes reuse/update it instead of allocating a fresh native text run every
// time.
export const emptyTextNode_ = Symbol('[[emptyTextNode]]');

// Per-corner / per-side caches for the CSS-class border-radius and
// border-color longhands core's shorthand expansion hands us — see
// `common.ts`. Kept on the view so each longhand can recompose the shorthand
// string the native side actually parses.
export const borderRadiusCorners_ = Symbol('[[borderRadiusCorners]]');
export const borderSideColors_ = Symbol('[[borderSideColors]]');

// Overridden `Event.type`, when a host framework's DOM shim relabels the
// event on its way to JS listeners — see `Event` in `common.ts`.
export const eventType_ = Symbol('[[eventType]]');
