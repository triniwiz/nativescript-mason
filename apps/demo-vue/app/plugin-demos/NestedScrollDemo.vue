<template>
  <Page>
    <ActionBar title="Nested scroll">
      <NavigationButton text="Back" v-bind="$backIcon" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <div class="page-body stack">
        <span class="body">Horizontal rows inside a vertical page. Swipe a row sideways with some up-and-down wobble: only the row should move. Swipe up or down starting on a row: only the page should move. Tap a card: the tap should count without scrolling anything.</span>

        <div v-for="row in rows" :key="row.title" class="block">
          <span class="section-label">{{ row.title }}</span>
          <div class="carousel">
            <div v-for="n in row.count" :key="n" class="tile" :class="row.size" :style="{ backgroundColor: color(n) }" @tap="tap(row.title, n)">
              <span class="tile-text">{{ n }}</span>
            </div>
          </div>
        </div>

        <div class="block">
          <span class="section-label">Vertical list</span>
          <span class="muted">Scrolls the same way as the page. A swipe that starts here moves the list first; once the list reaches its end, the rest of the swipe moves the page.</span>
          <div class="vertical tk-surface">
            <div v-for="n in 20" :key="n" class="list-row" @tap="tap('Vertical list', n)">
              <div class="dot" :style="{ backgroundColor: color(n) }" />
              <span class="list-text tk-text">Item {{ n }}</span>
            </div>
          </div>
        </div>

        <span class="muted">Last tap: {{ lastTap || 'none' }} · taps {{ taps }}</span>

        <div class="block">
          <span class="section-label">Both axes</span>
          <span class="muted">Straight swipes lock to one axis; a diagonal one moves both.</span>
          <div class="both">
            <div class="grid">
              <div v-for="n in 64" :key="n" class="cell" :style="{ backgroundColor: color(n) }">
                <span class="tile-text">{{ n }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-for="n in 12" :key="'filler' + n" class="card filler">
          <span class="h2">Filler {{ n }}</span>
          <span class="muted">More page to scroll through.</span>
        </div>
      </div>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { ref } from 'nativescript-vue';

const rows = [
  { title: 'Small cards', count: 20, size: 'small' },
  { title: 'Wide cards', count: 10, size: 'wide' },
  { title: 'Tall cards', count: 12, size: 'tall' },
];

const palette = ['#6c5ce7', '#0984e3', '#00b894', '#e17055', '#fdcb6e', '#e84393', '#00cec9', '#636e72'];
const color = (n: number) => palette[n % palette.length];

const lastTap = ref('');
const taps = ref(0);
function tap(row: string, n: number) {
  lastTap.value = `${row} #${n}`;
  taps.value++;
}
</script>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 16;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 8;
}

.carousel {
  display: flex;
  flex-direction: row;
  gap: 12;
  overflow-x: auto;
  overflow-y: hidden;
}

.tile {
  flex-shrink: 0;
  border-radius: 12;
  display: flex;
  align-items: center;
  justify-content: center;
}

.small {
  width: 80;
  height: 80;
}

.wide {
  width: 260;
  height: 140;
}

.tall {
  width: 120;
  height: 220;
}

.tile-text {
  font-size: 20;
  font-weight: bold;
  color: #ffffff;
}

.vertical {
  height: 240;
  overflow-y: auto;
  border-radius: 12;
}

.list-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12;
  height: 48;
  padding: 0 12;
}

.dot {
  width: 24;
  height: 24;
  border-radius: 12;
}

.list-text {
  font-size: 16;
}

.both {
  height: 260;
  overflow: scroll;
  border-radius: 12;
}

.grid {
  display: grid;
  grid-template-columns: repeat(8, 110);
  gap: 8;
}

.cell {
  height: 110;
  border-radius: 8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filler {
  display: flex;
  flex-direction: column;
  gap: 4;
}
</style>
