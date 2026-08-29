import { useState } from 'react';

const PILLS = ['Flexbox', 'Grid', 'CSS', 'React'];

export function App() {
  const [count, setCount] = useState(0);

  return (
    <scroll style={{ backgroundColor: '#0f172a', padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>Mason + React</span>
        <span style={{ fontSize: 14, color: '#94a3b8' }}>Real CSS flexbox/grid syntax, rendered through @nativescript-community/react</span>

        <div>
          <span style={{ color: 'red', fontWeight: 600, fontSize: 20 }}>PLAIN TEST</span>
        </div>
        <div style={{ backgroundColor: '#38bdf8' }}>
          <span style={{ color: 'red', fontWeight: 600, fontSize: 20 }}>SINGLE DIV WRAP TEST</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div style={{ backgroundColor: '#38bdf8' }}>
            <span style={{ color: 'red', fontWeight: 600, fontSize: 20 }}>ROW NESTED TEST</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: '#38bdf8' }}>
            <span style={{ color: 'red', fontWeight: 600, fontSize: 20 }}>COLUMN NESTED TEST</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div style={{ backgroundColor: '#38bdf8', width: 220 }}>
            <span style={{ color: 'red', fontWeight: 600, fontSize: 20 }}>ROW+WIDTH TEST</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
          {PILLS.map((label) => (
            <div key={label} style={{ backgroundColor: '#38bdf8' }}>
              <span style={{ color: 'red', fontWeight: 600, fontSize: 20 }}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PILLS.map((label) => (
            <div
              key={label}
              style={{
                paddingTop: 8,
                paddingBottom: 8,
                paddingLeft: 14,
                paddingRight: 14,
                backgroundColor: '#38bdf8',
                borderRadius: '999px',
              }}
            >
              <span style={{ color: 'red', fontWeight: 600, fontSize: 13 }}>{label} </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 60,
                borderRadius: '8px',
                backgroundColor: i % 2 === 0 ? '#334155' : '#1e293b',
              }}
            />
          ))}
        </div>

        <div onClick={() => setCount((c) => c + 1)} style={{ backgroundColor: '#22c55e', borderRadius: '8px', paddingTop: 14, paddingBottom: 14 }}>
          <span style={{ color: 'white', fontWeight: 600 }}>Tapped {count} times</span>
        </div>
      </div>
    </scroll>
  );
}
