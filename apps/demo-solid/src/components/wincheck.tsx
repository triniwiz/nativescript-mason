import { onMount } from 'solid-js'

// TEMP: does the native frame counter advance.
export default function WinCheck() {
  let box: any
  onMount(() => {
    const D = (globalThis as any).NativeScript.Mason.Diagnostics
    const samples: string[] = []
    let n = 0
    const tick = () => {
      if (n === 0) {
        try {
          D.WatchLayout(box.nativeView)
          samples.push('watching ' + String(box.nativeView))
        } catch (e) {
          samples.push('watch err ' + e)
        }
      }
      let fc: any, lp: any
      try { fc = D.FrameCount } catch (e) { fc = 'err ' + e }
      try { lp = D.LayoutPassCount } catch (e) { lp = 'err ' + e }
      samples.push(typeof fc + ':' + String(fc) + '/' + String(lp))
      try { box.nativeView.Width = 100 + n } catch {}
      if (++n < 8) setTimeout(tick, 250)
      else console.log('DIAGDBG ' + samples.join(' '))
    }
    setTimeout(tick, 1000)
  })
  return (
    <>
      <actionbar title="WinCheck" />
      <div ref={(el: any) => (box = el)} style={{ width: 100, height: 40, 'background-color': '#6c5ce7' }} />
    </>
  )
}
