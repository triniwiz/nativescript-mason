<template>
  <Page iosOverflowSafeAreaEnabled="false" @loaded="scheduleRead(400)">
    <ActionBar title="Core Views">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <p class="lead">
          Plain @nativescript/core views hosted inside MasonKit flex/grid containers — the interop path where a
          non-Mason child is attached as a leaf Taffy node and measured natively — and the reverse: Mason
          roots hosted inside core StackLayout / GridLayout / WrapLayout that are themselves leaves of a Mason tree.
        </p>

        <!--
          Intrinsic sizing note: core views need NO explicit width/height to be visible here.
          MasonKit attaches each non-Mason child (Switch, TextField, TextView, Slider, Progress,
          ActivityIndicator, SegmentedBar, ListPicker) as a leaf Taffy node with a default measure
          function (Android: View.measure, iOS: sizeThatFits), so they report their intrinsic size.
          The widths set in CSS below (Slider/Progress/ListPicker stretch, TextField/TextView stretch)
          are only there for fill behavior, not to make them visible.
        -->

        <section class="card">
          <h2>Form — flex column</h2>
          <label class="field-label" text="Name" />
          <TextField v-model="form.name" class="field" hint="Your name" returnKeyType="done" :isEnabled="!allDisabled"
            @returnPress="onReturn('name')" />
          <label class="field-label" text="Bio" />
          <TextView v-model="form.bio" class="field bio" hint="A few lines about you…" :isEnabled="!allDisabled" />
          <p class="readout">name: {{ form.name || '—' }} · bio: {{ form.bio.length }} chars</p>
          <p class="readout" v-if="lastReturn">return pressed on: {{ lastReturn }}</p>
        </section>

        <section class="card">
          <h2>Rows — space-between</h2>
          <div class="setting-row">
            <label text="Airplane mode" class="row-title" />
            <Switch :checked="airplane" :isEnabled="!allDisabled" @checkedChange="onAirplane" />
          </div>
          <div class="setting-row">
            <label text="Sync on Wi-Fi only" class="row-title" />
            <Switch :checked="wifiOnly" :isEnabled="!allDisabled" @checkedChange="onWifiOnly" />
          </div>
          <p class="readout">airplane: {{ airplane ? 'on' : 'off' }} · wifi-only: {{ wifiOnly ? 'on' : 'off' }}</p>

          <div class="setting-row">
            <label text="Spinner" class="row-title" />
            <ActivityIndicator :busy="spinning" />
            <button class="small-btn" @tap="spinning = !spinning">{{ spinning ? 'Stop' : 'Start' }}</button>
          </div>

          <div class="setting-row">
            <label text="View" class="row-title" />
            <SegmentedBar class="segmented" :isEnabled="!allDisabled" @selectedIndexChange="onViewChange">
              <SegmentedBarItem title="List" />
              <SegmentedBarItem title="Grid" />
              <SegmentedBarItem title="Map" />
            </SegmentedBar>
          </div>
          <p class="readout">selected view: {{ views[viewIndex] }}</p>
        </section>

        <section class="card">
          <h2>Grid — auto 1fr</h2>
          <div class="grid">
            <label text="Volume" class="grid-label" />
            <Slider class="stretch" v-model="volume" minValue="0" maxValue="100" :isEnabled="!allDisabled" />
            <label text="Download" class="grid-label" />
            <Progress class="stretch" :value="volume" maxValue="100" />
            <label text="Planet" class="grid-label" />
            <div class="picker-cell">
              <ListPicker class="stretch" :items="planets" v-model="planetIndex" :isEnabled="!allDisabled" />
            </div>
          </div>
          <p class="readout">volume: {{ volume }} / 100 · Progress mirrors the Slider</p>
          <button class="small-btn" @tap="bump">Bump +10</button>
        </section>

        <section class="card">
          <h2>Nested — core view in a div in a Scroll</h2>
          <div class="nested">
            <div class="nested-inner">
              <TextView v-model="notes" class="field notes" hint="Scratch notes…" :isEnabled="!allDisabled" />
            </div>
          </div>
          <p class="readout">notes: {{ notes.length }} chars</p>
        </section>


        <!--
          Reverse interop: Mason roots inside core layouts inside Mason. The outer
          compute holds the Rust tree lock while the core ViewGroup measures its
          Mason children, so each nested root reports its last size and defers a
          compute (Element.computeNestedRootLater); the foreign leaf is then
          dirtied so the outer tree picks up the real height. Before the fix every
          block below collapsed to 0.
        -->

        <section class="card">
          <h2>StackLayout hosting Mason</h2>
          <StackLayout class="core-host" ref="stackHost">
            <p class="nested-p">Mason text inside a classic vertical StackLayout should wrap onto several lines and stay visible instead of collapsing to zero height.</p>
            <div class="chip-row">
              <span class="chip chip-a">flex row</span>
              <span class="chip chip-b">inside</span>
              <span class="chip chip-c">StackLayout</span>
            </div>
            <button class="small-btn" @tap="addLine">Mason button — add a line ({{ extraLines }})</button>
            <p v-for="n in extraLines" :key="n" class="nested-p extra">Appended line {{ n }} — a content-only change that must reach the host.</p>
          </StackLayout>
          <p class="readout">stack height: {{ hostHeights.stack }} dp · grows when lines are added</p>
        </section>

        <section class="card">
          <h2>GridLayout hosting Mason</h2>
          <GridLayout class="core-host" columns="*, *" rows="auto, auto" ref="gridHost">
            <p class="nested-p" row="0" col="0">Mason p — r0 c0</p>
            <nlabel class="core-label" text="core Label — r0 c1" row="0" col="1" />
            <div class="cell cell-a" row="1" col="0"><span class="cell-text">Mason div — r1 c0</span></div>
            <div class="cell cell-b" row="1" col="1"><span class="cell-text">Mason div — r1 c1</span></div>
          </GridLayout>
          <p class="readout">grid height: {{ hostHeights.grid }} dp · both Mason cells should show a colour</p>
        </section>

        <section class="card">
          <h2>Horizontal StackLayout keeps Mason's width</h2>
          <StackLayout orientation="horizontal" class="core-host core-row" ref="rowHost">
            <nlabel class="core-label" text="A" />
            <nlabel class="core-label" text="B" />
            <nlabel class="core-label" text="C" />
          </StackLayout>
          <p class="readout">row: {{ hostHeights.rowWidth }} × {{ hostHeights.row }} dp · width should equal the card's content width, not A+B+C</p>
        </section>

        <section class="card">
          <h2>WrapLayout hosting Mason chips</h2>
          <WrapLayout class="core-host" ref="wrapHost">
            <span v-for="(tag, i) in tags" :key="tag" :class="['chip', 'wrap-chip', 'chip-' + ['a', 'b', 'c'][i % 3]]">{{ tag }}</span>
          </WrapLayout>
          <div class="btn-row">
            <button class="small-btn" @tap="addTag">Add chip</button>
            <button class="small-btn" @tap="removeTag">Remove chip</button>
          </div>
          <p class="readout">wrap height: {{ hostHeights.wrap }} dp · {{ tags.length }} chips — height changes as rows wrap</p>
        </section>

        <section class="card">
          <h2>Double nesting</h2>
          <StackLayout class="core-host" ref="deepHost">
            <div class="nested">
              <StackLayout class="core-host inner-host">
                <p class="nested-p">Mason → StackLayout → Mason div → StackLayout → Mason p. Every level below the outer root is measured while the outer compute is in flight.</p>
                <div class="chip-row">
                  <span class="chip chip-b">depth 4</span>
                </div>
              </StackLayout>
            </div>
          </StackLayout>
          <p class="readout">outer stack height: {{ hostHeights.deep }} dp</p>
          <button class="small-btn" @tap="readSizes">Read host sizes</button>
        </section>

        <section class="card">
          <div class="setting-row">
            <label text="Disable all controls" class="row-title" />
            <Switch :checked="allDisabled" @checkedChange="allDisabled = $event.value" />
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack, reactive, ref } from 'nativescript-vue';
import { Utils, View } from '@nativescript/core';

const form = reactive({ name: '', bio: '' });
const lastReturn = ref('');

const airplane = ref(false);
const wifiOnly = ref(true);
const spinning = ref(true);

const views = ['List', 'Grid', 'Map'];
const viewIndex = ref(0);

const volume = ref(40);
const planets = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter'];
const planetIndex = ref(2);

const notes = ref('');

const allDisabled = ref(false);

const extraLines = ref(0);
const tags = ref(['flex', 'grid', 'taffy', 'stack', 'wrap', 'nested']);
const addLine = () => {
  extraLines.value++;
  scheduleRead();
};
const addTag = () => {
  tags.value.push('chip ' + (tags.value.length + 1));
  scheduleRead();
};
const removeTag = () => {
  if (tags.value.length > 1) tags.value.pop();
  scheduleRead();
};

// Measured size of each core host, read back after the deferred nested-root
// compute has run, so the readouts prove the outer Mason tree saw the real size.
// (layoutChanged fires on the first, pre-deferral pass and reports 0/padding.)
// Template refs resolve to NS-Vue's NSVElement wrapper; the core view is its nativeView.
type HostRef = { nativeView?: View };
const stackHost = ref<HostRef>();
const gridHost = ref<HostRef>();
const rowHost = ref<HostRef>();
const wrapHost = ref<HostRef>();
const deepHost = ref<HostRef>();
const hostHeights = reactive<Record<string, number>>({ stack: 0, grid: 0, row: 0, rowWidth: 0, wrap: 0, deep: 0 });
const dp = (px: number) => Math.round(Utils.layout.toDeviceIndependentPixels(px));
const readSizes = () => {
  const hosts: Record<string, HostRef | undefined> = { stack: stackHost.value, grid: gridHost.value, row: rowHost.value, wrap: wrapHost.value, deep: deepHost.value };
  for (const key of Object.keys(hosts)) {
    const view = hosts[key]?.nativeView;
    if (view) hostHeights[key] = dp(view.getMeasuredHeight());
  }
  const row = rowHost.value?.nativeView;
  if (row) hostHeights.rowWidth = dp(row.getMeasuredWidth());
};
const scheduleRead = (delay = 150) => {
  setTimeout(readSizes, delay);
};
</script>

<style scoped>
.page {
  background-color: var(--bg);
  overflow-y: scroll;
}

main {
  display: flex;
  flex-direction: column;
  gap: 14;
}

.lead {
  font-size: 12;
  color: var(--muted);
}

.card {
  background-color: var(--surface);
  border-radius: 12;
  padding: 14;
  display: flex;
  flex-direction: column;
  gap: 8;
  box-shadow: 0 2px 8px var(--shadow);
}

.card h2 {
  font-size: 12;
  font-weight: bold;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 4;
}

.field-label {
  font-size: 12;
  color: var(--text);
}

.field {
  font-size: 14;
  color: var(--text);
  padding: 8;
  border: 1 solid var(--border);
  border-radius: 8;
  background-color: var(--bg);
  width: 100%;
}

/* Core (non-Mason) children are leaf nodes measured natively; give them an
 * explicit width to fill the track instead of their intrinsic size. */
.stretch {
  width: 100%;
}

.bio {
  height: 90;
}

.notes {
  height: 70;
}

.readout {
  font-size: 11;
  color: var(--muted);
}

.setting-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12;
  padding-top: 6;
  padding-bottom: 6;
}

.row-title {
  font-size: 14;
  color: var(--text);
  flex-grow: 1;
}

.segmented {
  width: 220;
}

.small-btn {
  background-color: var(--primary);
  color: #ffffff;
  padding: 7 14;
  border-radius: 8;
  font-size: 12;
  font-weight: 600;
  border-style: none;
  align-self: flex-start;
}

.grid {
  display: grid;
  /* minmax(0, 1fr): a bare 1fr is minmax(auto, 1fr) and lets the ListPicker's
   * intrinsic width blow the track past the card, exactly as on the web. */
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12;
  align-items: center;
}

.grid-label {
  font-size: 14;
  color: var(--text);
}

/* A grid item's automatic minimum is its min-content width, and the
 * ListPicker's is enormous. Hosting it in a Mason box with min-width: 0 lets
 * the track win, and the picker stretches to the box. */
.picker-cell {
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.nested {
  padding: 10;
  background-color: var(--surface-2);
  border-radius: 10;
}

.nested-inner {
  padding: 8;
  background-color: var(--surface-2);
  border-radius: 8;
}

/* Core layouts hosting Mason roots. NativeScript width CSS is not forwarded
 * to the foreign leaf, so the card's flex column stretches them instead. */
.core-host {
  background-color: var(--surface-2);
  border-radius: 10;
  padding: 8;
}

.inner-host {
  background-color: var(--surface);
}

.core-label {
  font-size: 14;
  color: var(--text);
  padding: 4 10;
}

.nested-p {
  font-size: 14;
  color: var(--text);
  padding: 4;
}

.nested-p.extra {
  color: var(--muted);
  font-size: 12;
}

.chip-row {
  display: flex;
  flex-direction: row;
  gap: 6;
  padding: 4;
}

.btn-row {
  display: flex;
  flex-direction: row;
  gap: 8;
}

.chip {
  font-size: 12;
  color: #ffffff;
  padding: 4 10;
  margin: 3;
  border-radius: 999;
}

/* A Mason root fills the width its core host offers (AT_MOST maps to a
 * definite available space), so shrink-wrap chips that are roots. */
.wrap-chip {
  width: fit-content;
}

.chip-a {
  background-color: var(--primary);
}

.chip-b {
  background-color: var(--success);
}

.chip-c {
  background-color: var(--info);
}

.cell {
  height: 44;
  margin: 4;
  border-radius: 8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-a {
  background-color: var(--primary-soft);
}

.cell-b {
  background-color: var(--warning);
}

.cell-text {
  font-size: 12;
  color: var(--ink);
}
</style>
