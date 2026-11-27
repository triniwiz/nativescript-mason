import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSelector } from '@nativescript/core/ui/styling/css-selector';

// The slice of @nativescript/angular the host patches touch: the element map,
// and the two places that substitute a ProxyViewContainer for an unknown tag.
vi.mock('@nativescript/angular', async () => {
  const { ProxyViewContainer } = await import('@nativescript/core');
  const elements = new Map<string, () => any>();
  class ViewUtil {
    createView(name: string) {
      const known = elements.has(name);
      const view = new (known ? elements.get(name)!() : ProxyViewContainer)() as any;
      view.nodeName = known ? name : 'ProxyViewContainer';
      return view;
    }
  }
  class NativeScriptRenderer {
    viewUtil = new ViewUtil();
    createElement(name: string) {
      return this.viewUtil.createView(name);
    }
  }
  class PageRouterOutlet {
    activateOnGoForward(create: () => unknown) {
      return create();
    }
  }
  return {
    EmulatedRenderer: class extends NativeScriptRenderer {},
    PageRouterOutlet,
    TextNode: class {},
    CommentNode: class {},
    isKnownView: (name: string) => elements.has(name),
    registerElement: (name: string, resolver: () => any) => elements.set(name, resolver),
    ɵViewUtil: { ViewUtil },
  };
});

import { EmulatedRenderer, PageRouterOutlet } from '@nativescript/angular';
import { ProxyViewContainer } from '@nativescript/core';
import { enableMasonComponentHosts } from './component-host';

// Auto-detection reads Frame, Page and ActionBar, which the core stub leaves out.
enableMasonComponentHosts({ passthrough: ['app-passthrough'], autoDetectPassthrough: false });

const renderer = new (EmulatedRenderer as any)();
const matches = (selector: string, view: unknown) => createSelector(selector).match(view as any);

describe('component host', () => {
  it.each(['story', 'app-story', 'app-story-card', 'app-story-card-title'])('matches a type selector for <%s>', (tag) => {
    const host = renderer.createElement(tag);
    expect(host).not.toBeInstanceOf(ProxyViewContainer);
    expect(matches(tag, host)).toBe(true);
  });

  it('matches a type selector combined with a class and an ancestor', () => {
    const parent = renderer.createElement('app-page');
    const host = renderer.createElement('app-story-card');
    host.cssClasses.add('unread');
    parent.addChild(host);
    expect(matches('app-story-card.unread', host)).toBe(true);
    expect(matches('app-page app-story-card', host)).toBe(true);
    expect(matches('app-page > app-story-card.read', host)).toBe(false);
  });

  it('does not match the selector of a component whose name it extends', () => {
    expect(matches('app-story', renderer.createElement('app-story-card'))).toBe(false);
  });

  it('keeps the tag as nodeName and tagName', () => {
    const host = renderer.createElement('app-story-card');
    expect([host.nodeName, host.tagName]).toEqual(['app-story-card', 'app-story-card']);
  });
});

describe('passthrough element', () => {
  afterEach(() => enableMasonComponentHosts({ enabled: true }));

  it('matches a type selector when listed in the passthrough option', () => {
    const proxy = renderer.createElement('app-passthrough');
    expect(proxy).toBeInstanceOf(ProxyViewContainer);
    expect(matches('app-passthrough', proxy)).toBe(true);
  });

  it('matches a type selector as a routed component', () => {
    const proxy = (PageRouterOutlet.prototype as any).activateOnGoForward(() => renderer.createElement('app-story-list'));
    expect(proxy).toBeInstanceOf(ProxyViewContainer);
    expect(matches('app-story-list', proxy)).toBe(true);
  });

  it('keeps the stock CSS type when component hosts are off', () => {
    enableMasonComponentHosts({ enabled: false });
    const proxy = renderer.createElement('app-story');
    expect(proxy).toBeInstanceOf(ProxyViewContainer);
    expect(matches('ProxyViewContainer', proxy)).toBe(true);
  });
});
