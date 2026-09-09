const FEATURES = [
  { title: 'Real Flexbox', desc: 'row/column, wrap, gap & alignment — the actual CSS algorithm.' },
  { title: 'Real CSS Grid', desc: 'template columns/rows, spans & auto-flow.' },
  { title: 'Rust Core', desc: 'Layout computed by a taffy-based engine, not a bridge to a browser.' },
];

const PLANS = [
  { name: 'Starter', price: '$0', highlight: false, perks: ['1 project', 'Community support', 'Core layout engine'] },
  { name: 'Pro', price: '$19', highlight: true, perks: ['Unlimited projects', 'Priority support', 'Grid + Flexbox playgrounds'] },
  { name: 'Team', price: '$49', highlight: false, perks: ['Everything in Pro', 'Shared workspaces', 'SSO'] },
];

export function TailwindLandingScreen() {
  return (
    <scroll className="bg-slate-50">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Hero */}
        <div className="bg-indigo-600" style={{ padding: 28, paddingTop: 40 }}>
          <span className="text-indigo-200 font-semibold" style={{ fontSize: 12 }}>
            TAILWIND CSS · className=&quot;...&quot;
          </span>
          <span className="text-white font-bold" style={{ fontSize: 30, marginTop: 8 }}>
            Ship native UI with utility classes
          </span>
          <span className="text-indigo-100" style={{ fontSize: 14, marginTop: 10, lineHeight: 1.5 }}>
            Every class below is a real Tailwind utility, compiled by the same tailwindcss + PostCSS pipeline you'd
            use on the web, then applied to native views through Mason.
          </span>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '8px 8px', flexWrap: 'wrap', marginTop: 18 }}>
            <div
              className="bg-white rounded-full"
              style={{ display: 'flex', paddingTop: 8, paddingBottom: 8, paddingLeft: 18, paddingRight: 18 }}
            >
              <span className="text-indigo-700 font-semibold" style={{ fontSize: 13 }}>
                Get Started
              </span>
            </div>
            <div
              className="border border-indigo-300 rounded-full"
              style={{ display: 'flex', paddingTop: 8, paddingBottom: 8, paddingLeft: 18, paddingRight: 18 }}
            >
              <span className="text-white font-semibold" style={{ fontSize: 13 }}>
                View Source
              </span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="text-slate-900 font-bold" style={{ fontSize: 18 }}>
            Why it works
          </span>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-slate-200"
              style={{ padding: 16, display: 'flex', flexDirection: 'column' }}
            >
              <span className="text-slate-900 font-semibold" style={{ fontSize: 15 }}>
                {f.title}
              </span>
              <span className="text-slate-500" style={{ fontSize: 13, marginTop: 4 }}>
                {f.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div style={{ padding: 20, paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span className="text-slate-900 font-bold" style={{ fontSize: 18 }}>
            Pricing cards
          </span>
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={p.highlight ? 'bg-indigo-600 rounded-2xl' : 'bg-white rounded-2xl border border-slate-200'}
              style={{ padding: 18 }}
            >
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={p.highlight ? 'text-white font-bold' : 'text-slate-900 font-bold'} style={{ fontSize: 16 }}>
                  {p.name}
                </span>
                {p.highlight ? (
                  <div className="bg-indigo-400 rounded-full" style={{ paddingTop: 3, paddingBottom: 3, paddingLeft: 10, paddingRight: 10 }}>
                    <span className="text-white font-semibold" style={{ fontSize: 10 }}>
                      POPULAR
                    </span>
                  </div>
                ) : null}
              </div>
              <span className={p.highlight ? 'text-white font-bold' : 'text-slate-900 font-bold'} style={{ fontSize: 28, marginTop: 6 }}>
                {p.price}
                <span className={p.highlight ? 'text-indigo-200' : 'text-slate-400'} style={{ fontSize: 13 }}>
                  {' '}
                  /mo
                </span>
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {p.perks.map((perk) => (
                  <span key={perk} className={p.highlight ? 'text-indigo-100' : 'text-slate-600'} style={{ fontSize: 13 }}>
                    ✓ {perk}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </scroll>
  );
}
