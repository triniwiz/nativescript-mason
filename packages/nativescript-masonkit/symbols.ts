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
// The break run a Windows `<br>` placeholder becomes inside a text container.
export const breakRun_ = Symbol('[[breakRun]]');
// On a child of a Windows container: the anonymous Text drawing it as part of an inline run.
export const anonymousText_ = Symbol('[[anonymousText]]');
// How it is held: 'run', 'break', 'text' or 'box', or 'solo' for a lone element laid out directly.
export const runMember_ = Symbol('[[runMember]]');
export const runsInline_ = Symbol('[[runsInline]]');
export const blockified_ = Symbol('[[blockified]]');
export const runsSettled_ = Symbol('[[runsSettled]]');
// The resolved Windows font source a container's anonymous Text uses.
export const windowsFontSource_ = Symbol('[[windowsFontSource]]');
// Whether a view's Windows native view lays out text runs itself, and whether it is any other
// panel that needs an anonymous Text for them; fixed once the native view exists.
export const hostsRuns_ = Symbol('[[hostsRuns]]');
export const needsAnonymousText_ = Symbol('[[needsAnonymousText]]');

// Per-corner / per-side caches for the CSS-class border-radius and
// border-color longhands core's shorthand expansion hands us — see
// `common.ts`. Kept on the view so each longhand can recompose the shorthand
// string the native side actually parses.
export const borderRadiusCorners_ = Symbol('[[borderRadiusCorners]]');
export const borderSideColors_ = Symbol('[[borderSideColors]]');

// Overridden `Event.type`, when a host framework's DOM shim relabels the
// event on its way to JS listeners — see `Event` in `common.ts`.
export const eventType_ = Symbol('[[eventType]]');
