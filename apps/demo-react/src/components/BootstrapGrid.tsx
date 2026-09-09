const STATS = [
  { label: 'Sessions', value: '12.4k' },
  { label: 'Bounce rate', value: '38%' },
  { label: 'Avg. duration', value: '4m 12s' },
  { label: 'Conversions', value: '812' },
];

// Reused inline to keep this demo focused on grid behavior.
const CARD_STYLE: Record<string, unknown> = {
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: 16,
  borderWidth: 1,
  borderColor: '#e2e8f0',
  height: 140,
  alignItems: 'center',
  justifyContent: 'center',
};

export function BootstrapGridScreen() {
  return (
    <scroll style={{ backgroundColor: '#f8fafc' }}>
      <div className="container" style={{ paddingTop: 20, paddingBottom: 20 }}>
        <span style={{ fontSize: 20, fontWeight: '700', color: '#0f172a' }}>Bootstrap-style grid</span>
        <span style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>.container / .row / .col-*, ported to app.css</span>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          {STATS.map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: 16,
                borderWidth: 1,
                borderColor: '#e2e8f0',
              }}
            >
              <span style={{ fontSize: 11, color: '#64748b' }}>{s.label}</span>
              <span style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', marginTop: 4 }}>{s.value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 4 }}>
          <div style={CARD_STYLE}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>col-8</span>
          </div>
          <div style={CARD_STYLE}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>col-4</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 4 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ ...CARD_STYLE, height: 90 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>col-4</span>
            </div>
          ))}
        </div>

        <span style={{ fontSize: 13, fontWeight: '600', color: '#0f172a', marginTop: 20 }}>Utility classes</span>
        <div
          className="d-flex flex-row justify-content-between align-items-center card"
          style={{ marginTop: 10, flexDirection: 'row' }}
        >
          <span style={{ fontSize: 13, color: '#0f172a' }}>d-flex justify-content-between</span>
          <div className="btn btn-primary">
            <span style={{ fontSize: 12, fontWeight: '600', color: 'white' }}>Action</span>
          </div>
        </div>
        <div className="d-flex flex-row" style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <div className="badge" style={{ backgroundColor: '#e0e7ff' }}>
            <span style={{ fontSize: 11, color: '#4338ca', fontWeight: '600' }}>m-2</span>
          </div>
          <div className="badge" style={{ backgroundColor: '#dcfce7' }}>
            <span style={{ fontSize: 11, color: '#166534', fontWeight: '600' }}>p-2</span>
          </div>
          <div
            className="badge"
            style={{ display: 'flex', borderWidth: 1.5, borderColor: '#4f46e5', backgroundColor: 'transparent' }}
          >
            <span style={{ fontSize: 11, color: '#4f46e5', fontWeight: '600' }}>btn-outline</span>
          </div>
        </div>
      </div>
    </scroll>
  );
}
