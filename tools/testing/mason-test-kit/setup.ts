// @nativescript/core's platform modules dereference the host runtime at module
// scope (utils/constants.android.ts reads android.os.Build.VERSION.SDK_INT on
// its first line), so importing core in Node needs those namespaces to exist.
//
// This is a self-similar proxy: every property is another proxy, and it is
// callable. That's enough for the module-load-time constants core computes, and
// anything a test genuinely depends on shows up as an obviously wrong value
// rather than a silent one — so keep real behaviour in an explicit stub, not here.
function runtimeProxy(name: string): any {
  const target: any = function () {};
  target.__nsStub = name;
  return new Proxy(target, {
    get(_t, prop) {
      if (prop === Symbol.toPrimitive) return () => 0;
      if (prop === 'toString') return () => name;
      if (prop === Symbol.toStringTag) return name;
      if (prop === '__nsStub') return name;
      return runtimeProxy(`${name}.${String(prop)}`);
    },
    apply() {
      return runtimeProxy(`${name}()`);
    },
    construct() {
      return runtimeProxy(`new ${name}`);
    },
    has: () => true,
  });
}

const g = globalThis as any;
for (const name of ['android', 'androidx', 'java', 'javax', 'org', 'com', 'dalvik', 'global']) {
  g[name] ??= runtimeProxy(name);
}

// core/globals installs polyfills by assigning onto the global object; several
// of those names (crypto, performance) are getter-only in Node.
for (const name of ['crypto', 'performance', 'fetch', 'XMLHttpRequest']) {
  const existing = (globalThis as any)[name];
  try {
    Object.defineProperty(globalThis, name, { value: existing, writable: true, configurable: true });
  } catch {
    // Already writable, or not present at all — either is fine.
  }
}

// NativeScript's build injects these decorators/globals; they are no-ops for the
// value-layer tests, which never construct a real native view.
g.NativeClass ??= (target: unknown) => target;
g.__decorate ??= undefined;
g.zonedCallback ??= (cb: unknown) => cb;
g.Deprecated ??= () => () => {};
g.Experimental ??= () => () => {};
g.Interfaces ??= runtimeProxy('Interfaces');
