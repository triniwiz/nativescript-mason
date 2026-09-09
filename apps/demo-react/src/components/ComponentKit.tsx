import { useState } from 'react';

export function ComponentKitScreen() {
  const [toast, setToast] = useState(false);

  return (
    <scroll className="bg-slate-50">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Navbar */}
        <div
          className="bg-white border-b border-slate-200"
          style={{ padding: 16, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span className="text-slate-900 font-bold" style={{ fontSize: 16 }}>
            ⬡ Kit
          </span>
          <div className="bg-slate-100 rounded-full" style={{ paddingTop: 6, paddingBottom: 6, paddingLeft: 14, paddingRight: 14 }}>
            <span className="text-slate-600" style={{ fontSize: 12 }}>
              Docs
            </span>
          </div>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Buttons */}
          <section>
            <span className="text-slate-400 font-semibold" style={{ fontSize: 11 }}>
              BUTTONS
            </span>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '10px 10px', marginTop: 10 }}>
              <div className="bg-indigo-600 rounded-lg" style={{ display: 'flex', paddingTop: 10, paddingBottom: 10, paddingLeft: 18, paddingRight: 18 }}>
                <span className="text-white font-semibold" style={{ fontSize: 13 }}>
                  Primary
                </span>
              </div>
              <div className="bg-slate-900 rounded-lg" style={{ display: 'flex', paddingTop: 10, paddingBottom: 10, paddingLeft: 18, paddingRight: 18 }}>
                <span className="text-white font-semibold" style={{ fontSize: 13 }}>
                  Neutral
                </span>
              </div>
              <div className="border-2 border-indigo-600 rounded-lg" style={{ display: 'flex', paddingTop: 9, paddingBottom: 9, paddingLeft: 18, paddingRight: 18 }}>
                <span className="text-indigo-600 font-semibold" style={{ fontSize: 13 }}>
                  Outline
                </span>
              </div>
              <div
                onClick={() => setToast(true)}
                className="bg-emerald-500 rounded-lg"
                style={{ display: 'flex', paddingTop: 10, paddingBottom: 10, paddingLeft: 18, paddingRight: 18 }}
              >
                <span className="text-white font-semibold" style={{ fontSize: 13 }}>
                  Tap for toast
                </span>
              </div>
            </div>
          </section>

          {/* Badges */}
          <section>
            <span className="text-slate-400 font-semibold" style={{ fontSize: 11 }}>
              BADGES
            </span>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '8px 8px', marginTop: 10 }}>
              {[
                { label: 'default', cls: 'bg-slate-200 text-slate-700' },
                { label: 'info', cls: 'bg-sky-100 text-sky-700' },
                { label: 'success', cls: 'bg-emerald-100 text-emerald-700' },
                { label: 'warning', cls: 'bg-amber-100 text-amber-700' },
                { label: 'error', cls: 'bg-rose-100 text-rose-700' },
              ].map((b) => (
                <div
                  key={b.label}
                  className={`${b.cls} rounded-full`}
                  style={{ display: 'flex', paddingTop: 4, paddingBottom: 4, paddingLeft: 12, paddingRight: 12 }}
                >
                  <span className={`${b.cls} font-semibold`} style={{ fontSize: 11 }}>
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Alert */}
          <section>
            <span className="text-slate-400 font-semibold" style={{ fontSize: 11 }}>
              ALERT
            </span>
            <div
              className="bg-amber-50 border border-amber-200 rounded-xl"
              style={{ padding: 14, marginTop: 10, display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}
            >
              <span style={{ fontSize: 16 }}>⚠️</span>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span className="text-amber-800 font-semibold" style={{ fontSize: 13 }}>
                  Heads up
                </span>
                <span className="text-amber-700" style={{ fontSize: 12, marginTop: 2 }}>
                  This alert is one Tailwind-styled Mason view tree, not a browser component.
                </span>
              </div>
            </div>
          </section>

          {/* Card */}
          <section>
            <span className="text-slate-400 font-semibold" style={{ fontSize: 11 }}>
              CARD
            </span>
            <div
              className="bg-white rounded-2xl border border-slate-200"
              style={{ padding: 16, marginTop: 10, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <div
                  className="bg-indigo-100 rounded-full"
                  style={{ display: 'flex', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
                >
                  <span style={{ fontSize: 16 }}>🧩</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="text-slate-900 font-semibold" style={{ fontSize: 14 }}>
                    Mason Core
                  </span>
                  <span className="text-slate-400" style={{ fontSize: 11 }}>
                    v1.0.0-beta.91
                  </span>
                </div>
              </div>
              <span className="text-slate-500" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.4 }}>
                A Rust layout engine, built on taffy, that gives NativeScript real flexbox and CSS grid.
              </span>
            </div>
          </section>

          {toast ? (
            <div className="bg-slate-900 rounded-xl" style={{ padding: 14, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-white" style={{ fontSize: 13 }}>
                Saved changes ✓
              </span>
              <span onClick={() => setToast(false)} className="text-slate-400 font-semibold" style={{ fontSize: 12 }}>
                Dismiss
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </scroll>
  );
}
