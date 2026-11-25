import { ref } from 'nativescript-vue';
import { benchSnapshot, resetBench } from '@demo/shared/bench/harness';

export { beginNavigation, fmt, idle, median, PageBench, pageDone, setBenchStatus, unwatchLayout } from '@demo/shared/bench/harness';
export type { Flavour, PhaseSample, ScenarioKey } from '@demo/shared/bench/harness';

const initial = benchSnapshot();

export const results = ref(initial.results);
export const running = ref(false);
export const status = ref('');
export const phaseOrder = ref(initial.phaseOrder);

export function flushBenchUi(): void {
  const snapshot = benchSnapshot();
  results.value = snapshot.results;
  phaseOrder.value = snapshot.phaseOrder;
  if (snapshot.status) status.value = snapshot.status;
}

export function resetResults(): void {
  resetBench();
  flushBenchUi();
}
