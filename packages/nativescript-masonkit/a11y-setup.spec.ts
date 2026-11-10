import { describe, expect, it } from 'vitest';
import { deferredA11ySetup } from './a11y-setup';
import { isMasonView_ } from './symbols';

function fixture(serviceOn: boolean) {
  const mason = { [isMasonView_]: true };
  const core = {};
  const state = { serviceOn };
  const setUp: object[] = [];
  const deferred = deferredA11ySetup({
    setup: (view) => setUp.push(view),
    serviceOn: () => state.serviceOn,
    eachLoadedView: (visit) => [mason, core].forEach(visit),
  });
  return { mason, core, state, setUp, deferred };
}

describe('accessibility setup for Mason views', () => {
  it('waits while no accessibility service is on', () => {
    const { mason, setUp, deferred } = fixture(false);
    deferred.update(mason);
    expect(setUp).toEqual([]);
  });

  it('runs at once for views that are not Mason views', () => {
    const { core, setUp, deferred } = fixture(false);
    deferred.update(core);
    expect(setUp).toEqual([core]);
  });

  it('runs at once while a service is on', () => {
    const { mason, setUp, deferred } = fixture(true);
    deferred.update(mason);
    expect(setUp).toEqual([mason]);
  });

  it('sets up the Mason views already loaded when a service turns on', () => {
    const { mason, state, setUp, deferred } = fixture(false);
    deferred.update(mason);
    state.serviceOn = true;
    deferred.serviceTurnedOn();
    expect(setUp).toEqual([mason]);
  });
});
