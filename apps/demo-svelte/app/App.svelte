<script lang="ts">
  type Item = { id: number; label: string };

  let nextId = 4;
  let taps = 0;
  let items: Item[] = [
    { id: 1, label: 'Alpha' },
    { id: 2, label: 'Beta' },
    { id: 3, label: 'Gamma' },
  ];

  const prepend = () => {
    items = [{ id: nextId, label: `Item ${nextId}` }, ...items];
    nextId++;
  };
  const reverse = () => {
    items = [...items].reverse();
  };
  const removeSecond = () => {
    items = items.filter((_, i) => i !== 1);
  };
</script>

<page>
  <actionBar title="MasonKit + Svelte" />
  <scroll style="height: 100%">
    <div class="page">
      <h1>MasonKit on Svelte Native</h1>
      <div class="row">
        <nlabel text="core Label in a Mason div" class="core-label" />
        <stackLayout class="core-stack">
          <nlabel text="core StackLayout" />
          <nlabel text="with two Labels" />
        </stackLayout>
      </div>
      <p>A1 <span>B1</span> C1</p>
      <p>A2 <b>B2</b> C2</p>
      <p>A3 {'B3'} C3</p>
      <p>A4 <span style="background-color: #ffeaa7">B4</span> C4</p>
      <p>Text with a <b>bold</b> run, an <em>emphasised</em> one and <a href="https://nativescript.org">a link</a>.</p>

      <div class="row">
        <div class="chip">flex</div>
        <div class="chip grow">grow</div>
        <div class="chip">row</div>
      </div>

      <div class="grid">
        {#each [1, 2, 3, 4, 5, 6] as n}
          <div class="cell"><span>{n}</span></div>
        {/each}
      </div>

      <div class="row">
        <button class="btn" on:tap={() => taps++}>Tapped {taps}</button>
        <button class="btn" on:tap={prepend}>Prepend</button>
        <button class="btn" on:tap={reverse}>Reverse</button>
        <button class="btn" on:tap={removeSecond}>Remove 2nd</button>
      </div>

      <ul>
        {#each items as item (item.id)}
          <li>{`#${item.id} ${item.label}`}</li>
        {/each}
      </ul>

      <h2>text-decoration</h2>
      <span style="text-decoration: underline">underline</span>
      <span style="text-decoration: overline">overline</span>
      <span style="text-decoration: line-through">line-through</span>
      <span style="text-decoration: underline overline red">underline overline red</span>
      <span style="text-decoration: underline wavy #e17055">wavy underline</span>
      <span style="text-decoration: underline dotted #0984e3 2px">dotted 2px</span>
      <span style="text-decoration: underline dashed">dashed</span>
      <span style="text-decoration: underline double">double</span>
      <span style="text-decoration: spelling-error">spelling-error</span>
      <span style="text-decoration: grammar-error">grammar-error</span>

      <h2>background</h2>
      <div class="bg-row">
        <div class="swatch" style="background: linear-gradient(to right, #6c5ce7, #00cec9) no-repeat; background-size: 50% 100%; background-position: right center">size + position</div>
        <div class="swatch" style="background: linear-gradient(#fdcb6e, #e17055); background-size: 20px 20px">tiled</div>
        <div class="swatch pad" style="background: linear-gradient(#55efc4, #0984e3); background-origin: content-box; background-clip: content-box">content-box</div>
        <div class="swatch" style="background: linear-gradient(to right, red, blue), linear-gradient(yellow, green); background-blend-mode: multiply">multiply</div>
        <div class="swatch" style="background: linear-gradient(to bottom, #ffeaa7, #fab1a0); background-position-x: 20px; background-position-y: bottom; background-size: 40px 40px; background-repeat: no-repeat">position-x/y</div>
      </div>
    </div>
  </scroll>
</page>

<style>
  .page { padding: 16; display: flex; flex-direction: column; gap: 12; }
  .row { display: flex; flex-direction: row; gap: 8; flex-wrap: wrap; }
  .chip { padding: 8 12; background-color: #6c5ce7; color: white; border-radius: 12; }
  .grow { flex-grow: 1; }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8; }
  .cell { background-color: #dfe6e9; border-radius: 8; padding: 12; display: flex; justify-content: center; align-items: center; }
  .btn { padding: 8 12; background-color: #0984e3; color: white; border-radius: 8; }
  .bg-row { display: flex; flex-direction: row; flex-wrap: wrap; gap: 8; }
  .swatch { width: 150; height: 90; border: 2 solid #2d3436; border-radius: 8; color: #2d3436; font-size: 12; padding: 4; }
  .pad { padding: 14; }
  .core-label { background-color: #ffeaa7; padding: 6; }
  .core-stack { background-color: #81ecec; padding: 6; }
</style>
