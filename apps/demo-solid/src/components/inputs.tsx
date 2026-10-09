import { createSignal } from 'solid-js'
import { BG, MUTED, TEXT, ACCENT, Card } from './controls'

const BORDER = '#b2bec3'
const SURFACE = '#dfe6e9'

const field = { padding: '8 12', border: `1 solid ${BORDER}`, borderRadius: 6, color: TEXT } as const
const stack = { display: 'flex', flexDirection: 'column', gap: 8 } as const
const row = { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 } as const
const note = { fontSize: 12, color: MUTED }
const label = { fontSize: 14, color: TEXT }

const show = (v: unknown) => `${JSON.stringify(v)} (${typeof v})`

export default function Inputs() {
  const [live, setLive] = createSignal('')
  const [agree, setAgree] = createSignal(true)
  const [size, setSize] = createSignal('m')
  const [volume, setVolume] = createSignal('30')
  const [day, setDay] = createSignal('2026-01-15')
  const [tint, setTint] = createSignal('#ff0000')

  const setBound = () => {
    setAgree(!agree())
    setSize('s')
    setVolume('80')
    setDay('2026-12-25')
    setTint('#00aa00')
  }

  return (
    <>
      <actionbar title="Inputs" />
      <scroll style={{ backgroundColor: BG, padding: 16, overflowY: 'scroll' }}>
        <p style={note} text="Each block mirrors apps/inputs-reference.html. Compare with the same markup in a browser." />

        <Card title="BOUND VALUE">
          <div style={stack}>
            <input style={field} value={live()} placeholder="type here" on:input={(e: any) => setLive(e.target.value)} />
            <span style={note} text={`value: ${live()}`} />
            <div style={row}>
              <input type="checkbox" checked={agree()} on:change={(e: any) => setAgree(e.target.checked)} />
              <span style={note} text={`checkbox: ${show(agree())}`} />
            </div>
            <div style={row}>
              <input type="radio" value="s" checked={size() === 's'} on:change={(e: any) => e.target.checked && setSize(e.target.value)} />
              <span style={label} text="small" />
              <input type="radio" value="m" checked={size() === 'm'} on:change={(e: any) => e.target.checked && setSize(e.target.value)} />
              <span style={label} text="medium" />
              <span style={note} text={`radio: ${show(size())}`} />
            </div>
            <input type="range" value={volume()} on:input={(e: any) => setVolume(e.target.value)} />
            <span style={note} text={`range: ${show(volume())}`} />
            <input type="date" value={day()} on:input={(e: any) => setDay(e.target.value)} />
            <span style={note} text={`date: ${show(day())}`} />
            <input type="color" value={tint()} on:input={(e: any) => setTint(e.target.value)} />
            <span style={note} text={`color: ${show(tint())}`} />
            <button style={{ padding: '8 14', borderRadius: 6, backgroundColor: ACCENT, color: 'white' }} on:click={setBound} text="Set from code" />
          </div>
        </Card>

        <Card title="UNSTYLED (UA DEFAULTS)">
          <div style={stack}>
            <input placeholder="type=text" />
            <input type="email" placeholder="type=email" />
            <input type="password" placeholder="type=password" />
            <input type="tel" placeholder="type=tel" />
            <input type="url" placeholder="type=url" />
            <input type="number" placeholder="type=number" />
            <input type="search" placeholder="type=search" />
            <input value="Prefilled value" />
          </div>
        </Card>

        <Card title="BORDER AND PADDING">
          <div style={stack}>
            <input style={{ padding: 0, border: `1 solid ${BORDER}` }} placeholder="padding: 0, border 1" />
            <input style={{ padding: 8, border: `1 solid ${BORDER}` }} placeholder="padding: 8, border 1" />
            <input style={{ padding: '12 16', border: `1 solid ${BORDER}` }} placeholder="padding: 12 16, border 1" />
            <input style={{ padding: 8, border: `2 solid ${ACCENT}` }} placeholder="border: 2 solid, padding 8" />
            <input style={{ padding: 8, border: 'none', backgroundColor: SURFACE }} placeholder="border: none, padding 8" />
          </div>
        </Card>

        <Card title="RADIUS AND BACKGROUND">
          <div style={stack}>
            <input style={{ ...field, borderRadius: 0 }} placeholder="radius 0" />
            <input style={{ ...field, borderRadius: 8 }} placeholder="radius 8" />
            <input style={{ ...field, borderRadius: 999, padding: '8 16' }} placeholder="radius 999 (pill)" />
            <input style={{ ...field, backgroundColor: SURFACE }} placeholder="filled background" />
          </div>
        </Card>

        <Card title="TYPOGRAPHY">
          <div style={stack}>
            <input style={{ ...field, fontSize: 12 }} value="Small text" placeholder="font-size 12" />
            <input style={{ ...field, fontSize: 18 }} value="Large text" placeholder="font-size 18" />
            <input style={{ ...field, fontSize: 18 }} placeholder="font-size 18 placeholder" />
            <input style={{ ...field, fontWeight: 'bold', color: ACCENT }} value="Bold text" placeholder="bold, colored text" />
            <input class="inputs-center" style={field} value="Centered" placeholder="text-align: center" />
            <input class="inputs-center" style={field} placeholder="text-align: center" />
            <input class="inputs-right" style={field} placeholder="text-align: right" />
          </div>
        </Card>

        <Card title="COLORS">
          <div style={stack}>
            <input style={{ ...field, border: '2 solid #ff0000' }} value="border literal red" />
            <input style={{ ...field, border: '2 solid', borderColor: '#00aa00' }} value="border-color longhand green" />
            <input style={{ ...field, color: '#ff0000' }} value="text literal red" />
            <input style={field} placeholder="placeholder (theme color)" />
            <input class="inputs-ph" style={field} placeholder="::placeholder { color: red }" />
            <input class="inputs-ph-blue" style={field} placeholder="placeholder-color: blue" />
            <input class="inputs-ph-blue" type="password" style={field} placeholder="password, placeholder-color: blue" />
          </div>
        </Card>

        <Card title="WIDTH AND LAYOUT">
          <div style={stack}>
            <input style={{ ...field, width: '50%' }} placeholder="width: 50%" />
            <div style={row}>
              <input style={{ ...field, flexGrow: 1, minWidth: 0 }} placeholder="flex: 1" />
              <button style={{ padding: '8 14', borderRadius: 6, backgroundColor: ACCENT, color: 'white' }} text="Go" />
            </div>
            <div style={row}>
              <input style={{ ...field, flexGrow: 1, minWidth: 0 }} placeholder="first" />
              <input style={{ ...field, flexGrow: 1, minWidth: 0 }} placeholder="second" />
            </div>
          </div>
        </Card>

        <Card title="OTHER TYPES">
          <div style={stack}>
            <div style={row}>
              <input type="checkbox" />
              <span style={label} text="checkbox" />
            </div>
            <div style={row}>
              <input type="radio" />
              <span style={label} text="radio" />
            </div>
            <input type="range" />
            <input type="date" />
            <input type="color" />
            <input type="file" />
            <input type="button" value="type=button" />
            <input type="submit" value="type=submit" />
          </div>
        </Card>
      </scroll>
    </>
  )
}
