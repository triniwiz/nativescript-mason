// Mason's dominative-registered intrinsic elements (see index.ts). Loosely
// typed for this demo — a real integration would give each tag its proper
// prop/style shape instead of `any`.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: any;
      span: any;
      scroll: any;
      button: any;
    }
  }
}

export {};
