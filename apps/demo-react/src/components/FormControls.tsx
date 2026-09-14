const FIELD_STYLE: Record<string, unknown> = {
  width: '100%',
  minHeight: 38,
  borderWidth: 1,
  borderColor: '#cbd5e1',
  borderRadius: '8px',
  backgroundColor: 'white',
  color: '#0f172a',
  fontSize: 14,
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 10,
  paddingRight: 10,
};

const ROW_STYLE: Record<string, unknown> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const LABEL_STYLE: Record<string, unknown> = {
  color: '#334155',
  fontSize: 12,
  fontWeight: 600,
};

const OPTION_ROW_STYLE: Record<string, unknown> = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
};

export function FormControlsScreen() {
  return (
    <scroll style={{ backgroundColor: '#f8fafc' }}>
      <form style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ color: '#0f172a', fontSize: 22, fontWeight: 800 }}>Mobile web form controls</span>
          <span style={{ color: '#64748b', fontSize: 13, lineHeight: 1.4 }}>
            Lowercase HTML tags backed by native Mason controls, with mobile keyboard types and form widgets.
          </span>
        </div>

        <fieldset
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            borderRadius: '10px',
            padding: 14,
            backgroundColor: 'white',
          }}
        >
          <legend style={{ color: '#475569', fontSize: 12, fontWeight: 700 }}>Text entry</legend>

          <div style={ROW_STYLE}>
            <label style={LABEL_STYLE}>Search</label>
            <input type="search" placeholder="Find components" style={FIELD_STYLE} />
          </div>

          <div style={ROW_STYLE}>
            <label style={LABEL_STYLE}>Email</label>
            <input type="email" placeholder="dev@example.com" style={FIELD_STYLE} />
          </div>

          <div style={ROW_STYLE}>
            <label style={LABEL_STYLE}>Telephone</label>
            <input type="tel" placeholder="+1 555 0100" style={FIELD_STYLE} />
          </div>

          <div style={ROW_STYLE}>
            <label style={LABEL_STYLE}>URL</label>
            <input type="url" placeholder="https://example.dev" style={FIELD_STYLE} />
          </div>

          <div style={ROW_STYLE}>
            <label style={LABEL_STYLE}>Password</label>
            <input type="password" placeholder="Secure text entry" style={FIELD_STYLE} />
          </div>

          <div style={ROW_STYLE}>
            <label style={LABEL_STYLE}>Notes</label>
            <textarea rows={4} cols={24} placeholder="Multi-line text scrolls inside the textarea." style={{ ...FIELD_STYLE, minHeight: 96 }} />
          </div>
        </fieldset>

        <fieldset
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            borderRadius: '10px',
            padding: 14,
            backgroundColor: 'white',
          }}
        >
          <legend style={{ color: '#475569', fontSize: 12, fontWeight: 700 }}>Native pickers</legend>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={ROW_STYLE}>
              <label style={LABEL_STYLE}>Number</label>
              <input type="number" value="42" style={FIELD_STYLE} />
            </div>
            <div style={ROW_STYLE}>
              <label style={LABEL_STYLE}>Date</label>
              <input type="date" value="2026-09-03" style={FIELD_STYLE} />
            </div>
          </div>

          <div style={ROW_STYLE}>
            <label style={LABEL_STYLE}>Range</label>
            <input type="range" value="35" style={{ width: '100%', minHeight: 36 }} />
          </div>

          <div style={ROW_STYLE}>
            <label style={LABEL_STYLE}>Color</label>
            <input type="color" value="#4f46e5" style={{ width: 72, minHeight: 36 }} />
          </div>

          <div style={ROW_STYLE}>
            <label style={LABEL_STYLE}>File</label>
            <input type="file" accept="image/*" multiple style={FIELD_STYLE} />
          </div>
        </fieldset>

        <fieldset
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            borderRadius: '10px',
            padding: 14,
            backgroundColor: 'white',
          }}
        >
          <legend style={{ color: '#475569', fontSize: 12, fontWeight: 700 }}>Choices</legend>

          <div style={OPTION_ROW_STYLE}>
            <input type="checkbox" />
            <label style={{ color: '#334155', fontSize: 13 }}>Send product updates</label>
          </div>

          <div style={OPTION_ROW_STYLE}>
            <input type="radio" name="channel" value="email" />
            <label style={{ color: '#334155', fontSize: 13 }}>Email</label>
          </div>

          <div style={OPTION_ROW_STYLE}>
            <input type="radio" name="channel" value="sms" />
            <label style={{ color: '#334155', fontSize: 13 }}>SMS</label>
          </div>
        </fieldset>

        <div style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
          <button type="submit" style={{ flex: 1, minHeight: 42, borderRadius: '8px', backgroundColor: '#4f46e5' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Submit</span>
          </button>
          <input type="reset" value="Reset" style={{ flex: 1, minHeight: 42, borderRadius: '8px', borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: 'white', color: '#334155' }} />
        </div>
      </form>
    </scroll>
  );
}
