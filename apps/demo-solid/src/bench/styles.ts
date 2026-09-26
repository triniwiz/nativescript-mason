import { addTaggedAdditionalCSS } from '@nativescript/core/ui/styling/style-scope';

// The demo-vue bench styles, one class prefix per scoped component. Applied through core's CSS
// engine rather than style objects so selector matching and var() lookups stay in the measured
// work, as in the Vue pages. Installed at runtime because the @nativescript/tailwind postcss
// plugin drops `display`, `gap`, `grid-*`, `flex-basis` and more from any imported .css file.
const CSS = `
.ns-root {
  --bench-bg: #f4f5fa;
  --bench-surface: #ffffff;
  --bench-surface-2: #eceef5;
  --bench-text: #1a1a2e;
  --bench-text-2: #4b4f62;
  --bench-muted: #8a8fa3;
  --bench-border: #e3e5ee;
  --bench-primary: #6c5ce7;
  --bench-primary-soft: #ebe8fd;
  --bench-on-primary: #ffffff;
  --bench-success: #00b894;
  --bench-danger: #ff6b6b;
  --bench-shadow: rgba(20, 20, 40, 0.08);
}

.ns-root.ns-dark {
  --bench-bg: #0f1117;
  --bench-surface: #1a1d27;
  --bench-surface-2: #242836;
  --bench-text: #f1f2f7;
  --bench-text-2: #c2c5d1;
  --bench-muted: #7f849a;
  --bench-border: #2c303f;
  --bench-primary: #8b7cf6;
  --bench-primary-soft: #2a2650;
  --bench-on-primary: #ffffff;
  --bench-success: #2fd4a6;
  --bench-danger: #ff8080;
  --bench-shadow: rgba(0, 0, 0, 0.45);
}

.bench-page { background-color: var(--bench-bg); overflow-y: scroll; }
.bench-page-body { padding: 16; }
.bench-card { background-color: var(--bench-surface); border-radius: 14; padding: 14; box-shadow: 0 2px 10px var(--bench-shadow); }
.bench-h2 { font-size: 16; font-weight: bold; color: var(--bench-text); }
.bench-body { font-size: 13; color: var(--bench-text-2); }
.bench-muted { font-size: 12; color: var(--bench-muted); }

.bc-toolbar { margin-bottom: 8; }
.bc-tool { padding: 6 10; margin: 0 6 6 0; font-size: 12; color: var(--bench-on-primary); background-color: var(--bench-primary); border-radius: 6; text-transform: none; min-width: 0; min-height: 0; android-elevation: 0; }
.bc-count { font-size: 11; color: var(--bench-muted); margin-bottom: 8; }

.bm-toolbar { display: flex; flex-direction: row; flex-wrap: wrap; gap: 6; }
.bm-tool { padding: 6 10; background-color: var(--bench-primary); border-radius: 6; }
.bm-tool-text { font-size: 12; color: var(--bench-on-primary); }
.bm-count { font-size: 11; color: var(--bench-muted); }

.fc-feed { padding: 12; }
.fc-row { padding: 10; margin-bottom: 8; background-color: var(--bench-surface); border-radius: 10; vertical-alignment: middle; }
.fc-avatar { width: 40; height: 40; border-radius: 20; vertical-alignment: middle; }
.fc-avatar-text { font-size: 13; font-weight: bold; color: #ffffff; text-align: center; vertical-alignment: middle; }
.fc-body { margin-left: 10; margin-right: 10; vertical-alignment: middle; }
.fc-title { font-size: 14; font-weight: bold; color: var(--bench-text); margin-bottom: 2; }
.fc-subtitle { font-size: 12; color: var(--bench-muted); }
.fc-badge { padding: 3 8; border-radius: 10; background-color: var(--bench-primary-soft); vertical-alignment: middle; }
.fc-badge-text { font-size: 11; color: var(--bench-primary); }

.fm-feed { display: flex; flex-direction: column; gap: 8; padding: 12; }
.fm-row { display: flex; flex-direction: row; align-items: center; gap: 10; padding: 10; background-color: var(--bench-surface); border-radius: 10; }
.fm-avatar { flex-shrink: 0; width: 40; height: 40; border-radius: 20; display: flex; align-items: center; justify-content: center; }
.fm-avatar-text { font-size: 13; font-weight: bold; color: #ffffff; }
.fm-body { flex-grow: 1; flex-shrink: 1; display: flex; flex-direction: column; gap: 2; }
.fm-title { font-size: 14; font-weight: bold; color: var(--bench-text); }
.fm-subtitle { font-size: 12; color: var(--bench-muted); }
.fm-badge { padding: 3 8; border-radius: 10; background-color: var(--bench-primary-soft); }
.fm-badge-text { font-size: 11; color: var(--bench-primary); }

.dc-dash { padding: 12; }
.dc-toolbar { margin-bottom: 10; }
/* Gap is emulated with a margin on every cell. */
.dc-grid { margin: -4; }
.dc-tile { margin: 4; padding: 10; background-color: var(--bench-surface); border-radius: 10; }
.dc-label { font-size: 11; color: var(--bench-muted); text-transform: uppercase; margin-bottom: 4; }
.dc-value { font-size: 20; font-weight: bold; margin-bottom: 4; }
.dc-bars { height: 32; }
.dc-bar { margin: 0 1.5; vertical-alignment: bottom; border-radius: 2; }

.dm-dash { display: flex; flex-direction: column; gap: 10; padding: 12; }
.dm-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8; }
.dm-grid.dm-wide { grid-template-columns: 1fr 1fr; }
.dm-tile { display: flex; flex-direction: column; gap: 4; padding: 10; background-color: var(--bench-surface); border-radius: 10; }
.dm-label { font-size: 11; color: var(--bench-muted); text-transform: uppercase; }
.dm-value { font-size: 20; font-weight: bold; }
.dm-bars { display: flex; flex-direction: row; align-items: flex-end; gap: 3; height: 32; }
.dm-bar { flex-grow: 1; border-radius: 2; }

.nc-nested { padding: 12; }
.nc-root { width: 100%; horizontal-alignment: left; }
.nc-root.nc-narrow { width: 70%; }

.nbc-box { padding: 4; border-radius: 6; background-color: var(--bench-surface); border-width: 1; border-color: var(--bench-border); }
.nbc-cell { margin: 2; vertical-alignment: top; }
.nbc-text { font-size: 10; color: var(--bench-text-2); margin: 2; }
.nbc-branch { color: var(--bench-muted); }

.nm-nested { display: flex; flex-direction: column; gap: 8; padding: 12; }
.nm-root { width: 100%; }
.nm-root.nm-narrow { width: 70%; }

/* margin: 0 on <p>: demo-vue sets View.preflight = true, which drops the UA <p> margin; demo-solid keeps it off. */
.nbm-box { display: flex; gap: 4; padding: 4; border-radius: 6; background-color: var(--bench-surface); border-width: 1; border-color: var(--bench-border); }
.nbm-row { flex-direction: row; flex-wrap: wrap; align-items: flex-start; }
.nbm-full { flex-basis: 100%; }
.nbm-column { flex-direction: column; }
.nbm-cell { flex-grow: 1; flex-basis: 0; min-width: 0; }
.nbm-text { font-size: 10; color: var(--bench-text-2); margin: 0; }
.nbm-branch { color: var(--bench-muted); }

.rc-rich { padding: 12; }
.rc-root { width: 100%; horizontal-alignment: left; }
.rc-root.rc-narrow { width: 60%; }
.rc-card { border-width: 1; border-radius: 8; margin-bottom: 8; }
.rc-card-body { padding: 10; }
.rc-title { font-size: 15; font-weight: bold; margin-bottom: 4; }
.rc-para { font-size: 13; line-height: 18; color: var(--bench-text-2); margin-bottom: 4; }
.rc-meta { font-size: 11; color: var(--bench-muted); }

.rm-rich { display: flex; flex-direction: column; gap: 8; padding: 12; }
.rm-root { width: 100%; display: flex; flex-direction: column; gap: 8; }
.rm-root.rm-narrow { width: 60%; }
.rm-card { border-width: 1; border-style: solid; border-radius: 8; }
.rm-card-body { display: flex; flex-direction: column; gap: 4; padding: 10; }
.rm-title { font-size: 15; font-weight: bold; margin: 0; }
.rm-badge { font-size: 10; color: white; padding: 1 5; border-radius: 4; }
.rm-title-text { font-size: 15; font-weight: bold; }
.rm-para { font-size: 13; line-height: 18; color: var(--bench-text-2); margin: 0; }
.rm-meta { font-size: 11; color: var(--bench-muted); margin: 0; }

.bh-bench { display: flex; flex-direction: column; gap: 12; }
.bh-lead { font-size: 12; color: var(--bench-text-2); margin: 0; }
.bh-controls { display: flex; flex-direction: column; gap: 10; }
.bh-control-row { display: flex; flex-direction: row; align-items: center; gap: 8; }
.bh-iters { display: flex; flex-direction: row; gap: 6; margin-left: auto; }
.bh-iter { padding: 4 10; border-radius: 6; background-color: var(--bench-surface-2); }
.bh-iter.bh-selected { background-color: var(--bench-primary); }
.bh-iter-text { font-size: 12; color: var(--bench-text); }
.bh-iter.bh-selected .bh-iter-text { color: var(--bench-on-primary); }
.bh-btn-primary { padding: 8 16; border-radius: 8; background-color: var(--bench-primary); }
.bh-btn-primary.bh-disabled { background-color: var(--bench-muted); }
.bh-btn-primary-text { font-size: 13; color: var(--bench-on-primary); }
.bh-btn-plain { padding: 8 12; border-radius: 8; background-color: var(--bench-surface-2); }
.bh-btn-plain-text { font-size: 13; color: var(--bench-text); }
.bh-scenario-head { display: flex; flex-direction: row; align-items: center; }
.bh-scenario-text { display: flex; flex-direction: column; gap: 2; flex-grow: 1; }
.bh-open-row { display: flex; flex-direction: row; gap: 8; margin-top: 10; }
.bh-btn-open { padding: 6 12; border-radius: 8; }
.bh-btn-open.bh-mason { background-color: #6c5ce7; }
.bh-btn-open.bh-core { background-color: #0984e3; }
.bh-btn-open-text { font-size: 12; color: #ffffff; }
.bh-table { display: flex; flex-direction: column; margin-top: 10; border-radius: 8; background-color: var(--bench-surface-2); padding: 6; }
.bh-tr { display: flex; flex-direction: row; padding: 3 4; }
.bh-th .bh-td { font-weight: bold; color: var(--bench-muted); }
.bh-td { font-size: 11; color: var(--bench-text); }
.bh-phase { flex-grow: 1; flex-basis: 0; }
.bh-num { width: 56; text-align: right; }
.bh-ratio.bh-good { color: var(--bench-success); }
.bh-ratio.bh-bad { color: var(--bench-danger); }
`;

addTaggedAdditionalCSS(CSS, 'demo-solid/bench');
