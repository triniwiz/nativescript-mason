const NAV = ['Overview', 'Sessions', 'Sources', 'Revenue', 'Settings'];

const STATS = [
  { label: 'Active users', value: '2,481' },
  { label: 'New signups', value: '164' },
  { label: 'Churn', value: '1.2%' },
  { label: 'MRR', value: '$18.2k' },
];

export function VanillaShellScreen() {
  return (
    <div className="app-shell">
      <header>
        <span className="brand">Vanilla CSS Dashboard</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>header + nav + main, real tags</span>
      </header>
      <div className="app-body">
        <nav>
          <ul>
            {NAV.map((item, i) => (
              <li key={item} className={i === 0 ? 'active' : undefined}>
                <span style={{ fontSize: 12 }}>{item}</span>
              </li>
            ))}
          </ul>
        </nav>
        <main>
          <span style={{ fontSize: 16, fontWeight: '700', color: 'var(--ink)' }}>Overview</span>
          <div className="card-grid" style={{ marginTop: 12 }}>
            {STATS.map((s) => (
              <div key={s.label} className="stat-card">
                <span className="stat-label">{s.label}</span>
                <span className="stat-value">{s.value}</span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
