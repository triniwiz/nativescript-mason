<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Core Views">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <p class="lead">
          Plain @nativescript/core views hosted inside MasonKit flex/grid containers — the interop path where a
          non-Mason child is attached as a leaf Taffy node and measured natively.
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

const onReturn = (field: string) => {
  lastReturn.value = field;
};

const onAirplane = (e: { value: boolean }) => {
  airplane.value = e.value;
};

const onWifiOnly = (e: { value: boolean }) => {
  wifiOnly.value = e.value;
};

const onViewChange = (e: { value: number }) => {
  viewIndex.value = e.value;
};

const bump = () => {
  volume.value = (volume.value + 10) % 110;
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
</style>
