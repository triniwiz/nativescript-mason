import { useNavigate } from '@tanstack/react-nativescript-router';

const SECTIONS: Array<{ to: string; title: string; desc: string; tag: string; color: string }> = [
  {
    to: '/showcase',
    title: '✦ Showcase',
    desc: 'Gradients, backdrop-blur glass, an asymmetric CSS Grid bento layout — the max potential of one page',
    tag: 'wow',
    color: '#db2777',
  },
  {
    to: '/tailwind',
    title: 'Tailwind CSS',
    desc: 'Hero, feature grid & pricing cards written with real utility classes',
    tag: 'className',
    color: '#4f46e5',
  },
  {
    to: '/components',
    title: 'Component Kit',
    desc: 'daisyUI/Flowbite-style navbar, buttons, badges, alerts & cards',
    tag: 'className',
    color: '#0ea5e9',
  },
  {
    to: '/forms',
    title: 'Form Controls',
    desc: 'Lowercase input, textarea, button and form tags with native mobile control behavior',
    tag: 'mobile',
    color: '#14b8a6',
  },
  {
    to: '/bootstrap',
    title: 'Bootstrap-style Grid',
    desc: 'container / row / col-* + flex utilities, hand-ported to CSS',
    tag: 'app.css',
    color: '#7c3aed',
  },
  {
    to: '/vanilla',
    title: 'Vanilla CSS App Shell',
    desc: 'Plain flexbox + CSS grid on real <header>/<nav>/<main> elements',
    tag: 'app.css',
    color: '#059669',
  },
  {
    to: '/router-demo',
    title: 'Router Demo',
    desc: 'The original TanStack Router + React proof of concept',
    tag: 'legacy',
    color: '#f97316',
  },
];

export function HomeScreen() {
  const navigate = useNavigate();

  return (
    <scroll className="bg-slate-50" style={{ padding: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="bg-slate-900 rounded-2xl" style={{ padding: 24 }}>
          <span className="text-white font-bold" style={{ fontSize: 26 }}>
            Mason + React
          </span>
          <span className="text-slate-300" style={{ fontSize: 13, marginTop: 6 }}>
            Real HTML tags, real CSS class names, real flexbox/grid — rendered natively via Mason's Rust layout
            engine. No WebView.
          </span>
        </div>

        {SECTIONS.map((s) => (
          <div
            key={s.to}
            onClick={() => navigate({ to: s.to, stackBehavior: 'push' } as never)}
            className="bg-white rounded-2xl border border-slate-200"
            style={{ padding: 18, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14 }}
          >
            <div
              style={{
                display: 'flex',
                width: 44,
                height: 44,
                minWidth: 44,
                maxWidth: 44,
                minHeight: 44,
                maxHeight: 44,
                borderRadius: '999px',
                backgroundColor: s.color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="text-white font-bold">{s.title.slice(0, 1)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <span className="font-semibold text-slate-900" style={{ fontSize: 15 }}>
                {s.title}
              </span>
              <span className="text-slate-500" style={{ fontSize: 12, marginTop: 2 }}>
                {s.desc}
              </span>
            </div>
            <span className="text-slate-400" style={{ fontSize: 11 }}>
              {s.tag}
            </span>
          </div>
        ))}
      </div>
    </scroll>
  );
}
