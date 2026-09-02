<template>
  <Page iosOverflowSafeAreaEnabled="false" iosOverflowSafeArea="false">
    <ActionBar title="Layout stress" class="stress-action-bar">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>

    <Scroll class="stress-scroll">
      <main class="stress-page">
        <section class="case">
          <h3 class="section-title">1. Insert / remove in the middle</h3>
          <p class="case-note">Keyed items must be inserted and removed at the requested index. Rendered order below must match Expected.</p>

          <div class="expected-row">
            <span class="expected-label">Expected:</span>
            <span class="expected-value">{{ expectedOrder }}</span>
          </div>

          <div class="chip-row">
            <StressChip v-for="item in items" :key="item.id" class="chip" :label="item.label" />
          </div>

          <div class="btn-row">
            <button class="btn" @tap="insertMiddle">Insert mid</button>
            <button class="btn" @tap="removeMiddle">Remove mid</button>
            <button class="btn" @tap="prepend">Prepend</button>
          </div>
          <div class="btn-row">
            <button class="btn" @tap="reverse">Reverse</button>
            <button class="btn" @tap="shuffle">Shuffle</button>
            <button class="btn" @tap="reset">Reset</button>
          </div>
        </section>

        <section class="case">
          <h3 class="section-title">2. Conditional between static siblings</h3>
          <p class="case-note">Toggling must put the middle chip back between first and last, not at the end.</p>

          <div class="chip-row">
            <StressChip class="chip" label="first" />
            <StressChip v-if="showMiddle" class="chip chip-accent" label="middle" />
            <StressChip class="chip" label="last" />
          </div>

          <div class="btn-row">
            <button class="btn" @tap="toggleMiddle">{{ showMiddle ? 'Hide middle' : 'Show middle' }}</button>
          </div>
        </section>

        <section class="case">
          <h3 class="section-title">3. Styling the component root</h3>
          <p class="case-note">These chips carry their background, padding and margin on the component itself. Their root boxes must retain those inherited attributes.</p>

          <div class="chip-row">
            <StressChip v-for="color in hostBoxes" :key="color" class="chip" :style="{ backgroundColor: color }" :label="`host ${color}`" />
          </div>
        </section>

        <section class="case">
          <h3 class="section-title">4. Swapping component types in a slot</h3>
          <p class="case-note">Removes one component and inserts a different type at the same index. The swapped chip must stay in the middle.</p>

          <div class="chip-row">
            <StressChip class="chip" label="before" />
            <StressChipAlt v-if="useAlternate" class="chip chip-accent" label="swapped" />
            <StressChip v-else class="chip chip-accent" label="original" />
            <StressChip class="chip" label="after" />
          </div>

          <div class="btn-row">
            <button class="btn" @tap="toggleAlternate">Swap</button>
          </div>
        </section>

        <section class="case">
          <h3 class="section-title">5. Component roots as grid cells</h3>
          <p class="case-note">A grid container whose cells are component roots. Cells must land on the grid, not stack.</p>

          <div class="grid-cases">
            <StressChip class="grid-cell" label="cell 1" />
            <StressChip class="grid-cell" label="cell 2" />
            <StressChip class="grid-cell" label="cell 3" />
            <StressChip class="grid-cell" label="cell 4" />
            <StressChip class="grid-cell" label="cell 5" />
            <StressChip class="grid-cell" label="cell 6" />
          </div>
        </section>

        <section class="case">
          <h3 class="section-title">6. Border: uniform solid (even-odd ring)</h3>
          <p class="case-note">The band must be even all the way around and unbroken through the corners. A filled centre means the inner contour did not cancel.</p>

          <div class="b-row">
            <div class="b-cell">
              <div class="b-box b-solid" style="border: 12 solid #2d6cdf" />
              <span class="b-cap">square</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-solid-r" style="border: 12 solid #2d6cdf" />
              <span class="b-cap">rounded</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-solid-pill" style="border: 12 solid #2d6cdf" />
              <span class="b-cap">pill</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-corners" style="border: 12 solid #7a3ea3" />
              <span class="b-cap">per-corner</span>
            </div>
          </div>
        </section>

        <section class="case">
          <h3 class="section-title">6b. Border: superellipse corners</h3>
          <p class="case-note">Non-round corners use polyline contours. A bite taken out of a corner here points to the fill rule rather than the geometry.</p>

          <div class="b-row">
            <div class="b-cell">
              <div class="b-box b-sq" style="border: 12 solid #2d6cdf" />
              <span class="b-cap">squircle</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-notch" style="border: 12 solid #2d6cdf" />
              <span class="b-cap">notch</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-bevel" style="border: 12 solid #2d6cdf" />
              <span class="b-cap">bevel</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-se-mixed" style="border: 12 solid #7a3ea3" />
              <span class="b-cap">4 shapes</span>
            </div>
          </div>

          <p class="case-note">The same shapes with a thick border and large radius exercise the crowded inner contour.</p>

          <div class="b-row">
            <div class="b-cell">
              <div class="b-box b-sq-thick" style="border: 40 solid #2d6cdf" />
              <span class="b-cap">squircle thick</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-notch-thick" style="border: 40 solid #2d6cdf" />
              <span class="b-cap">notch thick</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-bevel-thick" style="border: 40 solid #2d6cdf" />
              <span class="b-cap">bevel thick</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-sq-alpha" style="border: 20 solid rgba(20, 110, 220, 0.45)" />
              <span class="b-cap">squircle 45%</span>
            </div>
          </div>
        </section>

        <section class="case">
          <h3 class="section-title">7. Border: degenerate inner contour</h3>
          <p class="case-note">The border is wider than half the box, so the inner contour collapses. Expected: a solid filled block.</p>

          <div class="b-row">
            <div class="b-cell">
              <div class="b-box b-thick" style="border: 90 solid #2d6cdf" />
              <span class="b-cap">w &gt; box/2</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-thick-r" style="border: 90 solid #2d6cdf" />
              <span class="b-cap">+ radius</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-huge-radius" style="border: 12 solid #2d6cdf" />
              <span class="b-cap">radius &gt; box</span>
            </div>
          </div>
        </section>

        <section class="case">
          <h3 class="section-title">8. Border: translucent</h3>
          <p class="case-note">The band must be one flat tone over the page background. A darker ring means the shape is being painted twice.</p>

          <div class="b-row">
            <div class="b-cell">
              <div class="b-box b-alpha" style="border: 16 solid rgba(20, 110, 220, 0.45)" />
              <span class="b-cap">45% square</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-alpha-r" style="border: 16 solid rgba(20, 110, 220, 0.45)" />
              <span class="b-cap">45% rounded</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-alpha-on-fill" style="border: 16 solid rgba(20, 110, 220, 0.45)" />
              <span class="b-cap">over fill</span>
            </div>
          </div>
        </section>

        <section class="case">
          <h3 class="section-title">9. Border: per-side and non-solid (control)</h3>
          <p class="case-note">These use the per-side and stroke branches rather than the ring and act as controls.</p>

          <div class="b-row">
            <div class="b-cell">
              <div class="b-box b-sides" style="border-top: 12 solid #d1495b; border-right: 12 solid #2d6cdf; border-bottom: 12 solid #3f9b3f; border-left: 12 solid #e0a800" />
              <span class="b-cap">4 colours</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-widths" style="border-top: 6 solid #444444; border-right: 20 solid #444444; border-bottom: 6 solid #444444; border-left: 20 solid #444444" />
              <span class="b-cap">4 widths</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-dashed" style="border: 8 dashed #2d6cdf" />
              <span class="b-cap">dashed</span>
            </div>
            <div class="b-cell">
              <div class="b-box b-dotted" style="border: 8 dotted #2d6cdf" />
              <span class="b-cap">dotted</span>
            </div>
          </div>
        </section>

        <section class="case">
          <h3 class="section-title">10. Border: percentage radius survives a resize</h3>
          <p class="case-note">The 50% radius must resolve again after resizing. Corners that keep their old curve indicate a stale renderer cache.</p>

          <div class="b-row">
            <div class="b-cell">
              <div class="b-box b-pct" :class="{ 'b-wide': wideBorderBox }" style="border: 12 solid #2d6cdf" />
              <span class="b-cap">{{ wideBorderBox ? 'wide' : 'narrow' }}</span>
            </div>
          </div>

          <div class="btn-row">
            <button class="btn" @tap="toggleBorderBoxWidth">Resize</button>
          </div>
        </section>

        <section class="case">
          <h3 class="section-title">Elsewhere</h3>
          <div class="btn-row">
            <button class="btn" @tap="$navigateTo(HackerNews)">Feed</button>
          </div>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { computed, ref, $navigateBack, $navigateTo } from 'nativescript-vue';
import HackerNews from '../hn/HackerNews.vue';
import StressChip from './StressChip.vue';
import StressChipAlt from './StressChipAlt.vue';

interface Item {
  id: number;
  label: string;
}

const initialItems = (): Item[] => [
  { id: 1, label: 'A' },
  { id: 2, label: 'B' },
  { id: 3, label: 'C' },
];

let nextId = 4;
const items = ref<Item[]>(initialItems());
const showMiddle = ref(true);
const hostBoxes = ['red', 'green', 'blue'];
const useAlternate = ref(false);
const wideBorderBox = ref(false);

const expectedOrder = computed(() => items.value.map((item) => item.label).join(', '));

function insertMiddle(): void {
  const next = [...items.value];
  const at = Math.floor(next.length / 2);
  next.splice(at, 0, { id: nextId, label: `M${nextId}` });
  nextId += 1;
  items.value = next;
}

function removeMiddle(): void {
  if (items.value.length < 2) return;
  const next = [...items.value];
  next.splice(Math.floor(next.length / 2), 1);
  items.value = next;
}

function prepend(): void {
  items.value = [{ id: nextId, label: `P${nextId}` }, ...items.value];
  nextId += 1;
}

function reverse(): void {
  items.value = [...items.value].reverse();
}

function shuffle(): void {
  const next = [...items.value];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  items.value = next;
}

function reset(): void {
  nextId = 4;
  items.value = initialItems();
  showMiddle.value = true;
  useAlternate.value = false;
  wideBorderBox.value = false;
}

function toggleMiddle(): void {
  showMiddle.value = !showMiddle.value;
}

function toggleAlternate(): void {
  useAlternate.value = !useAlternate.value;
}

function toggleBorderBoxWidth(): void {
  wideBorderBox.value = !wideBorderBox.value;
}
</script>

<style scoped>
.stress-action-bar {
  background-color: #ff6600;
  color: #ffffff;
}

.stress-scroll {
  width: 100%;
  height: 100%;
  overflow-y: scroll;
}

.stress-page {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  padding: 12;
  gap: 10;
  background-color: #f6f6ef;
}

.case {
  display: flex;
  flex-direction: column;
  gap: 8;
  background-color: #ffffff;
  border-radius: 8;
  padding: 12;
}

.section-title {
  font-size: 15;
  color: #1a1a1a;
}

.case-note {
  font-size: 11;
  color: #828282;
}

.expected-row,
.chip-row,
.btn-row,
.b-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.expected-row {
  gap: 6;
}

.expected-label,
.expected-value,
.chip-text {
  font-size: 12;
}

.expected-label {
  color: #828282;
}

.expected-value {
  color: #ff6600;
}

.chip-row {
  gap: 6;
  padding: 6;
  background-color: #f0f0e8;
  border-radius: 6;
}

.chip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6 10;
  background-color: #dddddd;
  border-radius: 4;
}

.chip-accent {
  background-color: #ff6600;
}

.chip-text {
  color: #1a1a1a;
}

.btn-row {
  gap: 6;
}

.btn {
  font-size: 13;
  padding: 6 10;
  color: #ffffff;
  background-color: #444444;
  border-radius: 6;
}

.grid-cases {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6;
}

.grid-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10;
  background-color: #eeeee4;
  border-radius: 4;
}

.b-row {
  gap: 12;
  padding: 8;
  background-color: #f0f0e8;
  border-radius: 6;
}

.b-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4;
}

.b-box {
  width: 64;
  height: 44;
  background-color: #ffffff;
}

.b-cap {
  font-size: 10;
  color: #828282;
}

.b-solid-r {
  border-radius: 14;
}
.b-solid-pill {
  border-radius: 22;
}
.b-corners {
  border-radius: 2 20 2 20;
}
.b-sq {
  border-radius: 18;
  corner-shape: squircle;
}
.b-notch {
  border-radius: 18;
  corner-shape: notch;
}
.b-bevel {
  border-radius: 18;
  corner-shape: bevel;
}
.b-se-mixed {
  border-radius: 18;
  corner-shape: round squircle notch bevel;
}
.b-sq-thick {
  border-radius: 30;
  corner-shape: squircle;
}
.b-notch-thick {
  border-radius: 30;
  corner-shape: notch;
}
.b-bevel-thick {
  border-radius: 30;
  corner-shape: bevel;
}
.b-sq-alpha {
  border-radius: 22;
  corner-shape: squircle;
}
.b-thick-r {
  border-radius: 16;
}
.b-huge-radius {
  border-radius: 200;
}
.b-alpha-r {
  border-radius: 14;
}
.b-alpha-on-fill {
  border-radius: 14;
  background-color: #ffd9a0;
}
.b-pct {
  border-radius: 50%;
}
.b-wide {
  width: 180;
}
</style>
