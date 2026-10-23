// Generated alongside a plain HTML copy for comparing against a browser; keep the two in step.
const TILES: { title: string; svg: string }[] = [
  {
    "title": "Patterns",
    "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><pattern id='c' width='20' height='20' patternUnits='userSpaceOnUse'><rect width='10' height='10' fill='%236c5ce7'/><rect x='10' y='10' width='10' height='10' fill='%236c5ce7'/></pattern><pattern id='s' width='8' height='8' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'><rect width='4' height='8' fill='%23e17055'/></pattern></defs><rect width='100' height='50' fill='url(%23c)'/><circle cx='50' cy='75' r='22' fill='url(%23s)' stroke='%23e17055' stroke-width='2'/></svg>"
  },
  {
    "title": "Masks",
    "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g'><stop offset='0' stop-color='white'/><stop offset='1' stop-color='black'/></linearGradient><mask id='m'><rect width='100' height='100' fill='url(%23g)'/></mask><mask id='a' style='mask-type:alpha'><circle cx='70' cy='78' r='20'/></mask></defs><rect width='100' height='55' fill='%230984e3' mask='url(%23m)'/><rect y='55' width='100' height='45' fill='%2300b894' mask='url(%23a)'/></svg>"
  },
  {
    "title": "Markers",
    "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><marker id='dot' markerWidth='6' markerHeight='6' refX='3' refY='3' markerUnits='userSpaceOnUse'><circle cx='3' cy='3' r='3' fill='%23e84393'/></marker><marker id='arrow' viewBox='0 0 10 10' refX='5' refY='5' markerWidth='4' markerHeight='4' orient='auto-start-reverse'><path d='M0 0L10 5L0 10z' fill='%232d3436'/></marker></defs><polyline points='10,80 30,40 50,60 70,20 90,35' fill='none' stroke='%232d3436' stroke-width='2' marker-start='url(%23arrow)' marker-mid='url(%23dot)' marker-end='url(%23arrow)'/></svg>"
  },
  {
    "title": "Text",
    "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='t' x2='0' y2='1'><stop offset='0' stop-color='%23fdcb6e'/><stop offset='1' stop-color='%23e17055'/></linearGradient></defs><text x='50' y='48' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='34' fill='url(%23t)' stroke='%232d3436' stroke-width='1'>SVG</text><text x='50' y='78' text-anchor='middle' font-family='serif' font-size='14' fill='%23636e72'>Hello <tspan fill='%230984e3' font-style='italic'>text</tspan><tspan dy='-6' font-size='9' fill='%23e84393'>2</tspan></text></svg>"
  },
  {
    "title": "Text clip",
    "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><clipPath id='k'><text x='50' y='72' text-anchor='middle' font-family='sans-serif' font-weight='900' font-size='60'>Aa</text></clipPath><pattern id='p' width='6' height='6' patternUnits='userSpaceOnUse'><circle cx='3' cy='3' r='2' fill='%2300b894'/></pattern></defs><rect width='100' height='100' fill='url(%23p)' clip-path='url(%23k)'/></svg>"
  },
  {
    "title": "Text mask",
    "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><radialGradient id='r'><stop offset='0' stop-color='%23fdcb6e'/><stop offset='1' stop-color='%236c5ce7'/></radialGradient><mask id='tm'><rect width='100' height='100' fill='%23444'/><text x='50' y='62' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-weight='bold' font-size='30' fill='white'>MASK</text></mask></defs><rect width='100' height='100' rx='12' fill='url(%23r)' mask='url(%23tm)'/></svg>"
  }
]

const BADGE = "<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><circle cx='24' cy='24' r='22' fill='%236c5ce7'/><text x='24' y='24' text-anchor='middle' dominant-baseline='central' font-family='sans-serif' font-weight='bold' font-size='22' fill='white'>M</text></svg>"

export default function Svg() {
  return (
    <>
      <actionbar title="SVG" />
      <scroll style={{ backgroundColor: 'white', overflowY: 'scroll' }}>
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', padding: 8, width: 370 }}>
          {TILES.map((t) => (
            <div style={{ width: 110, margin: 4 }}>
              <div style={{ width: 110, height: 110, background: `url("data:image/svg+xml,${t.svg}") center / contain no-repeat`, backgroundColor: '#f5f6fa' }} />
              <span style={{ display: "block", fontSize: 11, color: "#636e72", marginTop: 4 }}>{t.title}</span>
            </div>
          ))}
          <div style={{ width: 110, margin: 4 }}>
            <img src={`data:image/svg+xml,${BADGE}`} style={{ display: 'block', width: 110, height: 70, backgroundColor: '#f5f6fa' }} />
            <span style={{ display: "block", fontSize: 11, color: "#636e72", marginTop: 4 }}>img fill</span>
          </div>
          <div style={{ width: 110, margin: 4 }}>
            <img src={`data:image/svg+xml,${BADGE}`} style={{ display: 'block', width: 110, height: 70, objectFit: 'cover', backgroundColor: '#f5f6fa' }} />
            <span style={{ display: "block", fontSize: 11, color: "#636e72", marginTop: 4 }}>img cover</span>
          </div>
          <div style={{ width: 110, margin: 4 }}>
            <img src="~/assets/svg-demo.svg" style={{ display: 'block', width: 110, backgroundColor: '#f5f6fa' }} />
            <span style={{ display: "block", fontSize: 11, color: "#636e72", marginTop: 4 }}>img file</span>
          </div>
        </div>
      </scroll>
    </>
  )
}
